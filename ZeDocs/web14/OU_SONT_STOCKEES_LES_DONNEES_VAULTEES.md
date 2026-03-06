# Où sont stockées les données vaultées ?

**Contexte** : Tenant sarl-la-platine ; factures « Protégées » avec attestation dans Odoo ; carte Linky « Ventes certifiées » à 0 € car la base Vault sarl-la-platine est vide.

---

## 1. Trois « lieux » possibles

| Lieu | Rôle | Contenu typique |
|------|------|------------------|
| **Base Odoo** (account.move) | Copie des preuves après fetch | `dorevia_vault_id`, `dorevia_vault_evidence_jws`, `dorevia_vault_ledger_hash`, `dorevia_vault_date`, statut « vaulted » |
| **Base Vault** (PostgreSQL, table `documents`) | Source de vérité des preuves + agrégations | Lignes par document scellé (hash, JWS, tenant, invoice_date, total_ttc, etc.) |
| **DVIG** (outbox_events) | File d’envoi Odoo → Vault | Events en attente / envoyés vers **un** Vault (celui configuré dans DVIG) |

---

## 2. Ce que fait Odoo (flux actuel)

1. **À la validation de facture** : Odoo envoie un event à **DVIG** (`dorevia.dvig.url`), pas directement au Vault.
2. **DVIG** met l’event en outbox puis un worker envoie vers **un** Vault : `VAULT_URL` / `vault_host:vault_port` du **conteneur DVIG** (une seule URL par instance DVIG).
3. **Odoo** récupère la preuve plus tard en appelant **le Vault** (`dorevia.vault.url`) : `GET /api/v1/proof/account_move/:id`. La réponse (id, hash, jws, ledger, etc.) est enregistrée dans **Odoo** (champs `dorevia_vault_*`).
4. **Téléchargement attestation** : Odoo **ne rappelle pas** le Vault. Il construit le JSON d’attestation à partir des données **déjà en base Odoo** (vault_controller.py : `move.dorevia_vault_id`, `move.dorevia_vault_evidence_jws`, etc.).

Donc : **tout ce que l’utilisateur voit comme « Protégée » + attestation vient de données stockées dans Odoo** au moment où le fetch proof a réussi (à une date quelconque, peut-être quand un autre Vault était utilisé).

---

## 3. Où est vraiment la « source de vérité » Vault ?

La table **`documents`** du Vault (PostgreSQL) est la source de vérité pour :

- servir `GET /api/v1/proof/account_move/:id` ;
- alimenter `GET /ui/aggregations/sales` (ventes certifiées pour Linky).

**Pour sarl-la-platine** :

- La **platform** déployée (tenants/sarl-la-platine/platform/docker-compose.yml) contient **uniquement Vault + Vault-DB** (pas de DVIG).
- La base **vault-db-sarl-la-platine** a **0 lignes** dans `documents` et `ledger`.
- Donc **aucune donnée vaultée n’est stockée dans le Vault sarl-la-platine** actuellement.

**Conséquence logique** : les preuves affichées dans Odoo ont été récupérées **à un moment** depuis **un autre** Vault (ex. **Vault core**), puis stockées en copie dans Odoo. Aujourd’hui :

- soit Odoo est encore configuré avec `dorevia.vault.url` = Vault core (et les preuves étaient/sont dans vault-core) ;
- soit il pointe vers vault.sarl-la-platine mais les preuves ont été fetchées quand la base sarl-la-platine contenait encore des données (base recréée depuis).

Dans les deux cas, **la source de vérité « Vault » pour les factures actuellement affichées comme protégées n’est pas la base vault.sarl-la-platine** (qui est vide).

---

## 4. Chaîne complète (à vérifier en prod)

À contrôler **dans l’instance Odoo stinger sarl-la-platine** (Paramètres → Technique → Paramètres système) :

| Paramètre | Exemple doc | Rôle |
|-----------|-------------|------|
| `dorevia.dvig.url` | `https://dvig.core-stinger.doreviateam.com` | Où Odoo envoie les events (invoice.posted) |
| `dorevia.dvig.source` | `odoo.stinger.sarl-la-platine` | Identifiant source dans les events |
| `dorevia.vault.url` | `https://vault.core-stinger.doreviateam.com` ou `https://vault.sarl-la-platine.doreviateam.com` | D’où Odoo récupère la preuve (GET proof) |

Côté **DVIG** qui reçoit ces events (ex. dvig.core-stinger) :

- Variable **VAULT_URL** (ou équivalent vault_host:vault_port) du conteneur DVIG = vers **quel** Vault le worker envoie les events (ex. `http://vault-core:8080` → données dans **vault-core**).

Règle simple :

- **Si** `dorevia.vault.url` = `https://vault.sarl-la-platine...` **et** la base sarl-la-platine est vide → incohérent avec des factures « Protégées » sauf si la base a été vidée après les fetch (attestations = ancienne copie dans Odoo).
- **Si** `dorevia.vault.url` = `https://vault.core-stinger...` (ou autre Vault partagé) → les **données vaultées** (source de vérité) sont dans **ce** Vault (ex. vault-core), pas dans vault.sarl-la-platine. Linky appelle vault.sarl-la-platine → 0 document → 0 €.

---

## 5. Synthèse

| Question | Réponse |
|----------|---------|
| **Où sont les données qui permettent l’attestation dans Odoo ?** | **Dans la base Odoo** (champs `dorevia_vault_*` sur account.move), copiées lors d’un fetch proof réussi (à une date indéterminée). |
| **Où est la source de vérité Vault (table `documents`) ?** | Dans **une** instance Vault (PostgreSQL de ce Vault). Pour sarl-la-platine, la base **vault.sarl-la-platine** est **vide** → la source de vérité pour les factures actuellement « protégées » est **ailleurs** (très probablement Vault core ou autre tenant). |
| **Pourquoi Linky affiche 0 € ?** | Linky interroge **uniquement** le Vault sarl-la-platine (`GET /ui/aggregations/sales`). Comme `documents` y est vide, l’agrégation retourne 0. |
| **Que faire pour que les ventes certifiées s’affichent dans Linky ?** | (1) Aligner les URLs : que DVIG envoie les events vers **vault.sarl-la-platine** (en déployant un DVIG pour ce tenant avec VAULT_URL=vault-sarl-la-platine, ou en faisant pointer le DVIG existant vers ce Vault). (2) Et que Odoo utilise **le même** Vault pour le fetch proof (`dorevia.vault.url` = vault.sarl-la-platine). (3) Optionnel : backfill des factures déjà scellées si besoin d’historique. |

---

## 6. Autres Vaults possibles (où les données peuvent être)

Dans la plateforme, il existe **plusieurs instances Vault**. Seules celles qui ont un **DVIG** qui leur envoie les events reçoivent des lignes dans `documents`.

| Tenant / stack        | Conteneur Vault      | Base PostgreSQL        | DVIG qui envoie vers ce Vault | URL publique typique |
|-----------------------|----------------------|------------------------|--------------------------------|-----------------------|
| **core** (lab)        | vault-core           | vault-db-core          | **dvig-core** (VAULT_URL=vault-core:8080) | `https://vault.core.doreviateam.com` ou `vault.lab.core...` |
| **core-stinger**      | vault-core-stinger   | vault-db-core-stinger  | **dvig-core-stinger** (VAULT_URL=vault-core-stinger:8080) | **`https://vault.core-stinger.doreviateam.com`** |
| **sarl-la-platine**  | vault-sarl-la-platine | vault-db-sarl-la-platine | **Aucun** (pas de DVIG dans ce tenant) | `https://vault.sarl-la-platine.doreviateam.com` |

- **Où vont les events aujourd’hui ?** Si Odoo stinger sarl-la-platine est configuré avec `dorevia.dvig.url` = DVIG **core-stinger** (ex. `https://dvig.core-stinger.doreviateam.com`), alors les events partent vers **vault-core-stinger**. Les données vaultées (table `documents`) sont donc dans **vault-core-stinger**, pas dans vault-sarl-la-platine.
- **Recommandation doc / scripts** : `scripts/check_vault_config.sh` et le README du connecteur Odoo indiquent `dorevia.vault.url` = `https://vault.core-stinger.doreviateam.com` pour les Odoo stinger. Donc le Vault « autre » le plus probable est **vault.core-stinger.doreviateam.com**.

Autres tenants (dido, rozas, etc.) peuvent avoir leur propre platform avec vault (ex. vault-dido, vault-rozas) si le manifest le prévoit ; chacun n’a de données que si un DVIG pointe vers lui (VAULT_URL = ce vault).

---

## 7. Références code

| Fichier | Rôle |
|---------|------|
| `units/odoo/custom-addons/dorevia_vault_connector/controllers/vault_controller.py` | Attestation = construction depuis champs Odoo (`dorevia_vault_*`), pas d’appel Vault au téléchargement. |
| `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py` | Envoi events vers DVIG ; fetch proof vers `dorevia.vault.url` ; stockage preuve dans Odoo. |
| `sources/dvig/workers/outbox_worker.py` | Envoi vers Vault via `settings.vault_host` / `vault_port` (une URL par instance DVIG). |
| `lib/render/render_platform_compose.sh` | Si DVIG dans la platform, `VAULT_URL=http://vault-$TENANT_ID:8080`. Manifest sarl-la-platine : pas de DVIG dans la platform actuelle. |

# Flux de vaultage — Odoo stinger sarl-la-platine

**URL** : https://odoo.stinger.sarl-la-platine.doreviateam.com  
**Rôle** : Comprendre ce qui se passe quand on valide une facture et « ça crée un vault ».

---

## 1. Tu valides une facture — et après ?

Quand tu cliques sur **Valider** (action « Confirmer » / `action_post`) sur une facture client/fournisseur :

### Étape 1 — Dans Odoo (immédiat)

- La facture passe en **état Comptabilisée** (`state = posted`).
- Le connecteur Vault initialise la **machine d’état** :
  - `dorevia_vault_status = 'todo'`
  - calcul de la clé d’idempotence (`dorevia_vault_idempotency_key`)
  - `dorevia_vault_next_retry_at = now` (pour que le CRON ou le job puisse la prendre tout de suite).
- **Aucun appel réseau** dans `action_post()` : tout le reste est asynchrone (queue_job ou CRON).

### Étape 2 — Déclenchement du worker DVIG (asynchrone)

- Si **queue_job** est configuré et que `dorevia.dvig.internal.token` est renseigné, Odoo enqueue un **job** : `job_trigger_worker(limit=50)`.
- Ce job fait, dans l’ordre :
  1. **Envoi des factures « todo » vers DVIG**  
     - Pour chaque facture en `todo`, envoi d’un **POST** vers **`dorevia.dvig.url`/ingest** (ex. `https://dvig.core-stinger.doreviateam.com/ingest`) avec un payload (tenant, source, event_type, payload métier, idempotency_key, etc.).  
     - DVIG enregistre chaque événement dans sa table **outbox_events** (statut `pending`).
  2. **Traitement de l’outbox DVIG**  
     - Odoo appelle **POST** **`dorevia.dvig.internal.url`** (ex. `https://dvig.core-stinger.doreviateam.com/internal/outbox/process`) avec `limit=50`.  
     - Le **worker DVIG** prend des événements en attente dans l’outbox et pour chacun envoie un **POST** vers **le Vault** configuré dans le conteneur DVIG (`VAULT_URL`, ex. `http://vault-core-stinger:8080`), endpoint **`/api/v1/events`**.  
     - Le **Vault** crée ou met à jour une ligne dans la table **`documents`** (avec tenant, invoice_date, total_ttc, move_type, odoo_model, etc. si le payload le fournit).
  3. **Enchaînement fetch proof**  
     - Si le DVIG retourne des `forwarded_source_ids` (ex. `["account_move:123"]`), Odoo enqueue pour chaque facture concernée un job **`job_vault_fetch_proof`**.

### Étape 3 — Récupération de la preuve (asynchrone)

- Le job **`job_vault_fetch_proof`** appelle **`dorevia.vault.url`** : **GET** `/api/v1/proof/account_move/{id}` (id = id Odoo de la facture).
- Si le Vault répond **404** (preuve pas encore dispo) → retry avec backoff (queue_job).
- Si le Vault répond **200** → Odoo enregistre dans la fiche facture :
  - `dorevia_vault_id`, `dorevia_vault_sha256`, `dorevia_vault_evidence_jws`, `dorevia_vault_ledger_hash`, `dorevia_vault_date`
  - `dorevia_vault_status = 'vaulted'`.
- L’utilisateur voit alors **« Facture protégée »** et peut **télécharger l’attestation** (construite à partir de ces champs stockés dans Odoo, sans rappel au Vault).

---

## 2. Résumé en chaîne

```
[Toi] Valider la facture (Odoo)
    → Odoo : status = todo, enqueue job_trigger_worker
        → Job : POST DVIG /ingest (facture → outbox)
        → Job : POST DVIG /internal/outbox/process
            → DVIG worker : POST Vault /api/v1/events  →  ligne dans table documents (Vault)
        → Job : enqueue job_vault_fetch_proof par facture traitée
            → job_vault_fetch_proof : GET Vault /api/v1/proof/account_move/:id
                → Odoo : stocke preuve (dorevia_vault_*), status = vaulted
    → [Toi] Tu vois « Protégée » + attestation téléchargeable
```

- **Qui remplit le Vault (table `documents`) ?** Le **DVIG** qui envoie vers le Vault (celui dont `VAULT_URL` pointe vers ce Vault).
- **D’où vient l’affichage « Protégée » et l’attestation ?** De la **preuve récupérée** par Odoo (GET proof) et stockée dans Odoo ; l’attestation est générée côté Odoo à partir de ces données.

---

## 3. Pour sarl-la-platine aujourd’hui

- **Odoo** : https://odoo.stinger.sarl-la-platine.doreviateam.com — valide les factures, envoie vers un DVIG (souvent **dvig.core-stinger**), récupère la preuve depuis une URL Vault (souvent **vault.core-stinger**).
- **DVIG** utilisé (ex. core-stinger) a **VAULT_URL = vault-core-stinger** → les lignes `documents` sont créées dans le **Vault core-stinger**, pas dans le Vault sarl-la-platine.
- **Linky** interroge **vault.sarl-la-platine** → table `documents` vide → 0 €.

Pour que Linky affiche les ventes certifiées, il faut que les events aillent **dans le Vault sarl-la-platine** (DVIG qui pointe vers vault-sarl-la-platine, ou autre mécanisme alimentant ce Vault), et que Odoo récupère la preuve depuis ce même Vault si on veut cohérence complète.

---

## 4. Explication du problème (à réutiliser)

**Constat** : Odoo sarl-la-platine utilise **dvig.core-stinger** (et sans doute **vault.core-stinger** pour récupérer les preuves). Donc tout le flux vaultage (ingest → outbox → events → documents) alimente **le Vault core-stinger**, pas le Vault du tenant sarl-la-platine.

**Conséquence** : Les factures sont bien vaultées et l’attestation est téléchargeable, parce que les données sont en base — dans **vault-core-stinger**. En revanche, **Linky** pour sarl-la-platine interroge **vault.sarl-la-platine**, qui est une **autre** instance Vault, avec sa propre base. Personne n’y envoie les events (il n’y a pas de DVIG qui pointe vers elle pour ce tenant). Sa table `documents` reste vide, donc l’agrégation « Ventes certifiées » renvoie 0 €.

**En une phrase** : Les données vaultées de sarl-la-platine sont dans le Vault **core-stinger** (car Odoo utilise DVIG core-stinger), alors que Linky lit le Vault **sarl-la-platine**, qui est vide — d’où 0 € affiché.

---

## 5. Vérification effectuée (2026-02-01)

| Vérification | Résultat |
|--------------|----------|
| **Base vault-db-core-stinger** — `COUNT(*)` documents `tenant = 'sarl-la-platine'` | **34** documents |
| **Factures client** (out_invoice) avec `invoice_date` et `total_ttc` renseignés | **28** éligibles à l’agrégation |
| **Exemples** (5 dernières) | FAC/2026/00030, 00028, 00029, 00027, 00026 (dates et montants présents) |
| **Odoo sarl-la-platine** — `ir_config_parameter` | `dorevia.dvig.url` = **https://dvig.core-stinger.doreviateam.com** ; `dorevia.vault.url` = **https://vault.core-stinger.doreviateam.com** ; `dorevia.dvig.source` = **odoo.stinger.sarl-la-platine** |

**Conclusion** : La config Odoo pointe bien vers DVIG et Vault **core-stinger**. Les documents sarl-la-platine sont bien présents dans **vault-db-core-stinger** (34 lignes, 28 factures client agrégables). Le Vault **sarl-la-platine** (interrogé par Linky) n’est pas alimenté par ce flux — d’où 0 € côté Linky.

---

## 6. Source(s) de vérité en trop — Correction à faire

### Problème : deux sources de vérité pour un même tenant

Aujourd’hui, pour les données vaultées de **sarl-la-platine** :

| Lieu | Rôle actuel | Problème |
|------|-------------|----------|
| **vault.core-stinger** | Contient les 34 documents (28 factures client) ; Odoo y envoie et y récupère les preuves. | C’est la vraie source de données, mais ce n’est pas le Vault « du » tenant. |
| **vault.sarl-la-platine** | Interrogé par Linky pour les ventes certifiées ; base vide. | C’est le Vault attendu côté UI tenant, mais il n’est pas alimenté. |

On a donc **deux** bases Vault concernées pour un même tenant : une qui a les données (core-stinger), une que Linky lit (sarl-la-platine). Une seule source de vérité devrait exister par tenant pour les données vaultées (documents + agrégations).

### Correction à faire : une seule source de vérité par tenant

**Principe** : Pour un tenant donné, un seul Vault doit être la source de vérité (table `documents`) pour ce tenant — celui qu’Odoo alimente **et** que Linky interroge.

**Option A — Vault dédié au tenant (recommandé si on veut un Vault par client)**  
- **Source de vérité** : **vault.sarl-la-platine** (uniquement).
- **Correction** :  
  1. Faire en sorte que le flux (Odoo → DVIG → Vault) alimente **vault.sarl-la-platine** : déployer un DVIG pour sarl-la-platine avec `VAULT_URL=http://vault-sarl-la-platine:8080`, ou faire router les events de ce tenant vers ce Vault.  
  2. Dans Odoo sarl-la-platine : `dorevia.dvig.url` = ce DVIG (ou URL qui envoie vers vault-sarl-la-platine) ; `dorevia.vault.url` = **https://vault.sarl-la-platine.doreviateam.com**.  
  3. Linky ne change pas (il interroge déjà vault.sarl-la-platine).  
- **Historique** : backfill ou migration des 34 documents de vault-core-stinger vers vault-sarl-la-platine si besoin, puis bascule Odoo.

**Option B — Vault partagé (core-stinger) comme seule source de vérité**  
- **Source de vérité** : **vault.core-stinger** (partagé entre tenants stinger).  
- **Correction** : Faire que **Linky** sarl-la-platine interroge **vault.core-stinger** avec `tenant=sarl-la-platine` (au lieu de vault.sarl-la-platine). Côté Linky ou proxy : selon le tenant, choisir l’URL du Vault (ex. tenant sarl-la-platine → vault.core-stinger).  
- **Conséquence** : vault.sarl-la-platine n’est plus utilisé comme source de vérité pour les ventes certifiées (on supprime la source en trop en ne l’utilisant pas pour ce cas).

### Synthèse

- **Source(s) en trop** : aujourd’hui, deux Vaults sont impliqués pour les données sarl-la-platine (core-stinger avec les données, sarl-la-platine lu par Linky et vide). Il faut en choisir **un seul** comme source de vérité.  
- **Correction** : soit tout passer par le Vault du tenant (vault.sarl-la-platine) — Option A —, soit tout passer par le Vault partagé (vault.core-stinger) et faire pointer Linky dessus pour ce tenant — Option B.

### Recommandation : Option B

**Pourquoi Option B est la plus adéquate** :  
- Aucune nouvelle infra (pas de DVIG ni de backfill pour sarl-la-platine).  
- Les données sont déjà dans vault.core-stinger (34 documents, 28 factures client).  
- Odoo reste inchangé (continue d’utiliser dvig.core-stinger et vault.core-stinger).  
- La modification est localisée : seule l’instance **Linky** sarl-la-platine doit appeler le bon Vault (core-stinger) avec `tenant=sarl-la-platine`.  
- Un seul stack opérationnel (core-stinger) pour tous les tenants stinger qui partagent ce flux.

**Implémentation Option B** :  
- Linky lit `VAULT_URL` et `TENANT_ID` depuis l’environnement (`app/api/sales/route.ts`, `app/lib/vault.ts`). Par défaut le rendu app compose utilise `VAULT_URL=http://vault-${TENANT_ID}:8080`.  
- **À faire** : pour l’instance Linky qui sert sarl-la-platine (ex. conteneur `linky_lab_sarl-la-platine`), définir **`VAULT_URL`** vers le Vault partagé, par exemple :
  - `VAULT_URL=https://vault.core-stinger.doreviateam.com` (ou en interne `http://vault-core-stinger:8080` si même réseau Docker).  
- Garder **`TENANT_ID=sarl-la-platine`** pour que l’appel reste `tenant=sarl-la-platine` côté agrégation.  
- Moyens possibles : variable d’environnement au déploiement (`.env`, override compose), ou champ dans le manifest (ex. `vault_url_override` / `use_shared_vault: "core-stinger"`) lu par le script de rendu pour injecter ce `VAULT_URL` dans le compose Linky de ce tenant.

**Écart total Odoo vs Linky (914 k€ vs 353 k€)** : Le total des 30 factures clients dans Odoo est 914 093,53 €. Le Vault (vault-core-stinger) ne contient que **28 documents** facture client pour sarl-la-platine, pour un total de **353 583,13 €** (période 2026-01-12 → 2026-02-06). L’écart (560 k€) vient du fait que **toutes les factures ne sont pas encore dans le Vault** (2 factures ou plus manquantes / non envoyées ou non traitées). Linky affiche uniquement ce qui est certifié dans le Vault. Pour rapprocher l’affichage du total Odoo, il faut que les factures manquantes soient vaultées (flux Odoo → DVIG → Vault).

**Implémentation réalisée (2026-02-01)** :  
- Manifest `tenants/sarl-la-platine/state/manifest.json` : ajout de **`linky_vault_url": "http://vault-core-stinger:8080"`**.  
- `lib/render/render_app_compose.sh` : lecture de `linky_vault_url` ; si présent, `VAULT_URL` par défaut pour Linky = cette URL, sinon `http://vault-${TENANT_ID}:8080`.  
- Rendu regénéré : `tenants/sarl-la-platine/rendered/lab/ui/docker-compose.yml` contient `VAULT_URL: ${VAULT_URL:-http://vault-core-stinger:8080}` et `TENANT_ID: sarl-la-platine`.  
- **À faire côté déploiement** : appliquer ce compose (copier le rendu vers l’app dir si besoin, puis `docker compose up -d` pour le service linky) et s’assurer que le conteneur Linky et vault-core-stinger sont sur le même réseau Docker (ex. `dorevia-network`).

### Vérifier que vault-core-stinger tourne et est sur le même réseau que Linky

```bash
# 1. Les deux conteneurs tournent
docker ps --filter "name=vault-core-stinger" --filter "name=linky_lab_sarl-la-platine"

# 2. Ils sont sur le même réseau (dorevia-network)
docker network inspect dorevia-network --format '{{range .Containers}}{{.Name}} {{end}}' | tr ' ' '\n' | grep -E 'vault-core-stinger|linky_lab_sarl-la-platine'
```

Si les deux noms apparaissent à l’étape 2, Linky peut joindre le Vault en `http://vault-core-stinger:8080`.

**Si la carte affiche « fetch failed »** : l’image **vault-core-stinger** doit exposer l’endpoint **GET /ui/aggregations/sales** (présent dans **dorevia/vault:v1.4.0-card-sales**, pas dans v1.3.4-go125). Mettre à jour le compose platform core-stinger pour utiliser `image: dorevia/vault:v1.4.0-card-sales`, puis recréer le service vault :  
`docker compose -p dorevia_core-stinger_platform up -d --force-recreate vault`

---

## 7. Factures qui ne se vaultent pas (deux premières ou autres)

Si certaines factures clients (souvent les plus anciennes) restent sans statut « Protégée », la cause est en général : **statut vault vide** (validées avant le connecteur ou avant la migration) ou **blocage en failed_soft / failed_hard**.

→ **Voir** : [DIAGNOSTIC_FACTURES_NON_VAULTEES.md](./DIAGNOSTIC_FACTURES_NON_VAULTEES.md) — diagnostic en shell Odoo, remise en `todo` (migration ou par ID), et déclenchement du worker.

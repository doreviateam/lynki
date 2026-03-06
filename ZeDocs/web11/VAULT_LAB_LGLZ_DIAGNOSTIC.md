# Vault lab LGLZ — Facture « en cours » : diagnostic et déblocage

## Pourquoi « Exécuter manuellement » ne fait rien

Si vous lancez **Vault Send DVIG** ou **Vault Fetch Proof** et que **rien ne change** (0 tentative, statut reste « À protéger »), c’est en général parce que les **paramètres système DVIG/Vault sont vides** sur le lab LGLZ.

Le CRON s’exécute bien, mais le code vérifie d’abord la configuration : s’il manque **dorevia.dvig.url**, **dorevia.dvig.token** ou **dorevia.dvig.source**, aucune facture n’est traitée et aucune erreur n’est affichée. Il faut donc **reproduire le paramétrage** (voir ci‑dessous).

---

## Reproduire le paramétrage de La Platine (odoo.stinger.sarl-la-platine)

Pour que le lab LGLZ se comporte comme [https://odoo.stinger.sarl-la-platine.doreviateam.com](https://odoo.stinger.sarl-la-platine.doreviateam.com) pour le scellement :

1. **Sur La Platine** : **Paramètres** → **Technique** → **Paramètres** → **Paramètres système** (recherche « dorevia »).
2. Noter (ou copier) la **valeur** de chaque clé ci‑dessous.
3. **Sur le lab LGLZ** : **Paramètres** → **Technique** → **Paramètres** → **Paramètres système**.
4. Créer chaque paramètre avec la **même valeur** que La Platine, **sauf** `dorevia.dvig.source` = **`odoo.lab.lglz`**.

**Important** : le lab LGLZ ne doit **pas** utiliser le même token que La Platine. DVIG exige que le **tenant du token** corresponde à la source : La Platine envoie `odoo.stinger.sarl-la-platine` (tenant = `sarl-la-platine`), le lab LGLZ envoie `odoo.lab.lglz` (tenant = `lglz`). Si le lab LGLZ utilise le token de La Platine, DVIG renvoie **403 TENANT_MISMATCH** (auparavant masqué en 500). Il faut donc **créer un token dédié pour le tenant `lglz`** sur DVIG core-stinger et le mettre dans le paramètre `dorevia.dvig.token` du lab LGLZ (voir section « Token dédié lab LGLZ » ci-dessous).

### Liste des paramètres (référence La Platine)

| Clé | Valeur sur La Platine | Sur lab LGLZ |
|-----|------------------------|--------------|
| `dorevia.dvig.url` | `https://dvig.core-stinger.doreviateam.com` | **identique** |
| `dorevia.dvig.token` | (token La Platine — tenant sarl-la-platine) | **token dédié lglz** (voir § Token dédié) |
| `dorevia.dvig.source` | `odoo.stinger.sarl-la-platine` | **`odoo.lab.lglz`** |
| `dorevia.dvig.internal.token` | (token interne La Platine) | **nouveau token interne lglz** ou réutiliser si DVIG le permet |
| `dorevia.vault.url` | `https://vault.core-stinger.doreviateam.com` | **identique** |
| `dorevia.vault.token` | (JWT long — copier depuis La Platine) | **identique** |
| `dorevia.vault.max_attempts_proof` | `20` | **identique** |
| `dorevia.vault.max_age_pending_proof_hours` | `24` | **identique** |
| `dorevia.debug.actions` | `1` (optionnel, pour boutons debug) | **identique** ou `0` |
| `dorevia_posted_lock.enabled` | `True` | **identique** |
| `dorevia_posted_lock.allow_chatter` | `True` | **identique** |
| `dorevia_posted_lock.allow_draft` | `False` | **identique** |
| `dorevia_posted_lock.apply_to_entries` | `False` | **identique** |

5. Enregistrer, puis **Exécuter manuellement** « Vault Send DVIG » puis « Vault Fetch Proof » sur le lab LGLZ.

Après ça, les factures en « À protéger » devraient être traitées (tentatives > 0, puis « Protégée » ou un message dans « Dernière erreur »).

---

## Token dédié lab LGLZ (obligatoire pour que le scellement fonctionne)

Sur La Platine, le token DVIG est enregistré sur **DVIG core-stinger** avec **tenant = `sarl-la-platine`**. Le lab LGLZ envoie **source = `odoo.lab.lglz`** (tenant = `lglz`). DVIG exige que le tenant du token soit égal au tenant de la source. Donc le lab LGLZ doit utiliser un **token dont le tenant est `lglz`** dans le fichier de tokens DVIG.

**À faire une seule fois, côté serveur DVIG core-stinger :**

1. **Générer un token pour le tenant `lglz`** (depuis la machine où tourne DVIG ou où se trouve le dépôt `sources/dvig`) :
   ```bash
   cd /opt/dorevia-plateform/sources/dvig
   python -m dvig.cli.token_gen --tenant lglz --univers odoo --output token
   ```
   Noter la ligne `TOKEN=...` (à mettre dans Odoo lab LGLZ, paramètre `dorevia.dvig.token`).

2. **Ajouter l’entrée au fichier de tokens DVIG** (ex. `/etc/dvig/tokens.yml` ou `conf/tokens.yml` sur core-stinger) :
   ```bash
   python -m dvig.cli.token_gen --tenant lglz --univers odoo --output yaml
   ```
   Copier le bloc YAML affiché et l’ajouter dans la section `tokens:` du fichier. Recharger DVIG (ou attendre le rechargement des tokens selon la config).

3. **Sur Odoo lab LGLZ** : **Paramètres** → **Technique** → **Paramètres système** → modifier **`dorevia.dvig.token`** et mettre la valeur **TOKEN** générée à l’étape 1 (remplacer l’ancien token copié de La Platine).

4. (Optionnel) **Token interne** : si DVIG utilise un token interne distinct par tenant, générer aussi un token pour lglz et l’ajouter au fichier (entrée avec le même tenant `lglz`), puis mettre sa valeur en clair dans **`dorevia.dvig.internal.token`** sur le lab LGLZ. Sinon, garder la même valeur que La Platine si l’instance core-stinger partage un seul token interne.

Après ça, « Trigger DVIG Worker Now » ou le CRON Vault Send DVIG devrait accepter les requêtes du lab LGLZ (plus de 403 TENANT_MISMATCH).

---

## Pourquoi la facture reste « en cours »

Le scellement passe par deux étapes :

1. **CRON #1** (toutes les 1 min) : envoi de la facture vers DVIG → statut passe à « Protection en cours » (`pending_proof`).
2. **CRON #2** (toutes les 1 min) : récupération de la preuve depuis Vault → statut passe à « Protégée » (`vaulted`).

Sans **job runner** dédié, seuls les CRONs traitent les factures. Il faut donc attendre **1 à 2 minutes** après validation pour que la preuve soit disponible. Si après 2–3 minutes c’est encore « en cours », faire le diagnostic ci‑dessous.

---

## 1. Vérifier la facture dans Odoo

Sur la facture (formulaire) :

- **Statut de protection** : `À protéger` (todo) / `Protection en cours` (pending_proof) / `Protégée` (vaulted) / `Échec temporaire` ou `Échec définitif`.
- **Dernière erreur** : si une erreur s’affiche (connexion, 401, 404, etc.), c’est la cause du blocage.

À noter : si le statut est **Protection en cours** et qu’il n’y a pas d’erreur, Vault peut mettre quelques secondes à produire la preuve ; CRON #2 réessaie toutes les minutes.

---

## 2. Déclencher les CRONs manuellement (déblocage immédiat)

1. Se connecter à **https://odoo.lab.lglz.doreviateam.com** en admin.
2. Aller dans **Paramètres** → **Technique** → **Automation** → **Actions planifiées** (ou **Scheduled Actions**).
3. Rechercher **« Vault Send DVIG »** :
   - Ouvrir l’action.
   - Cliquer sur **« Exécuter maintenant »** (Run Manually).
4. Puis rechercher **« Vault Fetch Proof »** :
   - Ouvrir l’action.
   - Cliquer sur **« Exécuter maintenant »**.

Revenir sur la facture : le statut devrait évoluer vers **Protégée** (sauf si une erreur est affichée dans « Dernière erreur »).

---

## 3. Si « Dernière erreur » est renseigné

- **Connexion / timeout** : le conteneur Odoo lab LGLZ doit pouvoir joindre les URLs DVIG et Vault (réseau, firewall, DNS).
- **401 / 403** : vérifier les paramètres système **dorevia.dvig.token**, **dorevia.vault.token** (et **dorevia.dvig.internal.token** si utilisé).
- **Source** : **dorevia.dvig.source** doit être cohérent avec ce qu’attend DVIG (ex. `odoo.lab.lglz` pour le lab LGLZ).

Vérifier les paramètres : **Paramètres** → **Technique** → **Paramètres système**.

### Erreur HTTP 500 ou 403 sur `dvig.core-stinger.doreviateam.com/ingest`

- **403 (TENANT_MISMATCH)** : le token utilisé par le lab LGLZ est celui de La Platine (tenant `sarl-la-platine`), alors que la source envoyée est `odoo.lab.lglz` (tenant `lglz`). DVIG exige que le tenant du token = tenant de la source. **Solution** : créer un token dédié pour le tenant `lglz` sur DVIG et le mettre dans `dorevia.dvig.token` sur le lab LGLZ (voir section « Token dédié lab LGLZ » ci-dessus).

- **500 Internal Server Error** : (plus rare après correctif) une exception côté DVIG lors de la persistance (table outbox). **À faire** : consulter les logs DVIG au moment de la requête (`ingest_event_error`), vérifier que la table `outbox_events` existe (migration `006_create_outbox_events.sql`).

---

## 4. (Optionnel) Accélérer avec le traitement par la file (queue_job)

Aujourd’hui, les **jobs** (envoi DVIG + fetch proof) sont mis en file à la validation de la facture, mais **personne ne les exécute** : il n’y a pas de job runner dans le lab. Seuls les CRONs font le travail, d’où le délai d’environ 1–2 minutes.

Pour un traitement quasi immédiat après validation, il faudrait soit :

- installer et configurer le module **queue_job_cron_jobrunner** (OCA), qui exécute les jobs via un CRON ;  
- soit lancer un processus **job runner** dédié (hors scope de cette fiche).

Sans cela, le comportement normal est : **attendre 1–2 minutes** ou **déclencher manuellement** les deux actions planifiées comme en § 2.

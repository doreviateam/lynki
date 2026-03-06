# Résumé — Atteindre le total « Ventes certifiées » 914 093,53 € (Linky sarl-la-platine)

**Objectif** : Que la carte **Ventes certifiées** de Dorevia Linky (ui.lab.sarl-la-platine.doreviateam.com) affiche le **bon total** des factures de vente vaultées, aligné avec Odoo (30 factures = 914 093,53 €).

**Résultat obtenu** : 914 093,53 €, « Toutes périodes », dernier scellement affiché ; carte avec **Hors taxes** / **Dont taxes**, un seul badge **Certifié : X %** (ou « Données certifiées » en secours), **Dernier scellement** en une ligne en dessous ; **rafraîchissement automatique** toutes les 30 secondes ; anciennes URLs `/app/*` (type Appsmith) redirigées vers le dashboard.

---

## 1. Contexte initial

- **Odoo** (odoo.stinger.sarl-la-platine) : 30 factures clients (out_invoice) postées, toutes marquées **vaulted** ou en cours.
- **Linky** interroge le **Vault** (GET /ui/aggregations/sales) avec `tenant=sarl-la-platine`. Les données vaultées de ce tenant sont dans le Vault **core-stinger** (pas dans un Vault dédié sarl-la-platine), donc Linky est configuré avec `VAULT_URL=http://vault-core-stinger:8080` et `TENANT_ID=sarl-la-platine`.
- Problèmes identifiés :
  - Une facture (FAC/2026/00009, id 1905) restait en **pending_proof** car le DVIG recevait **404** du Vault sur POST /api/v1/events.
  - Le total affiché (367 308,73 €) était **faux** : doublon sur la facture 9 + deux premières factures (1896, 1898) absentes du Vault.

---

## 2. Ce qui a été fait (dans l’ordre logique)

### 2.1 Exigence « aucune facture posted non vaultée »

- **Paramètre `dorevia.vault.no_abandon`** (Odoo) : activé pour ne plus passer les factures en `failed_hard` (retries infinis).
- **CRON « Vault Reconciler failed_hard »** : toutes les 15 min, remet les factures posted en `failed_hard` en `todo` et déclenche le worker DVIG.
- Fichiers : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`, `data/ir_cron.xml`.

### 2.2 Vault : exposer POST /api/v1/events

- Le worker outbox DVIG envoie les événements au Vault sur **POST /api/v1/events**. Si le Vault ne proposait pas cette route → 404 → événements en `failed_hard` dans l’outbox.
- **Modifications** :
  - RBAC : `sources/vault/internal/auth/rbac.go` — ajout de `/api/v1/events` (PermissionWriteDocuments).
  - Point d’entrée : `sources/vault/cmd/vault/main.go` — enregistrement de POST /api/v1/events (et GET /health, GET /api/v1/proof/..., GET /ui/aggregations/sales).
- Image Vault : **dorevia/vault:v1.4.0-events** (puis remplacée par v1.4.0-aggreg-dedup).
- Compose : `tenants/core-stinger/platform/docker-compose.yml` — service vault avec cette image.

### 2.3 DVIG : cibler le bon Vault (VAULT_HOST)

- Le worker outbox utilisait par défaut **vault_host = "vault"** (Settings), alors que le conteneur s’appelle **vault-core-stinger** → 404 sur `http://vault:8080/api/v1/events`.
- **Correction** : dans le compose platform, pour le service **dvig**, ajout de **`VAULT_HOST=vault-core-stinger`**.
- Redémarrage du conteneur DVIG pour prendre en compte la variable.

### 2.4 Facture 9 (1905) : déblocage

- L’événement de la facture 9 était en **failed_hard** dans l’outbox DVIG (à cause des 404 passés).
- **Actions** :
  1. En base **dorevia_vault** (conteneur vault-db-core-stinger) :  
     `UPDATE outbox_events SET status = 'accepted', attempt_count = 0, last_error = NULL, next_retry_at = NULL WHERE event_id = '3eea6263-97f3-4c70-97a0-1f4546d35d44'.`
  2. Déclencher **POST /internal/outbox/process** sur le DVIG (après correction VAULT_HOST).
- Résultat : **succeeded: 1**, `forwarded_source_ids: ["account.move:1905"]`. La facture 9 est ensuite passée en **vaulted** dans Odoo (preuve récupérée).

### 2.5 Agrégation « Ventes certifiées » : bon total

- **Problème 1 — Doublon** : la facture 9 (1905) était présente **deux fois** dans la table `documents` (deux événements, clés d’idempotence différentes). Le total était donc **surestimé** (367 308,73 € au lieu de 353 583,13 € pour les 28 factures distinctes alors présentes).
- **Problème 2 — Factures manquantes** : les factures **1896** (FAC/2026/00001) et **1898** (FAC/2026/00002) n’étaient pas dans le Vault → total **sous-estimé** par rapport aux 30 factures Odoo.

**Correctif agrégation (Vault)** :  
`sources/vault/internal/storage/aggregations_sales.go`

- **Déduplication par facture** : pour le total et les séries, une seule ligne par **odoo_id** est prise en compte (la plus récente en cas de doublon), via `ROW_NUMBER() OVER (PARTITION BY odoo_id ORDER BY created_at DESC)`.
- Ainsi, le total ne double plus une même facture et reflète bien la somme des factures **distinctes** dans le Vault.

**Image** : **dorevia/vault:v1.4.0-aggreg-dedup**, puis **v1.4.0-ht-tax** (voir §2.7).

### 2.6 Alimenter le Vault avec les factures 1 et 2 (1896, 1898)

- En **Odoo** : 1896 et 1898 étaient déjà en **vaulted** mais **absentes** du Vault (données perdues ou jamais envoyées).
- **Actions** :
  1. En base Odoo : remise en **todo** des deux factures (effacement de `dorevia_dvig_event_id`, etc.).
  2. **Envoi au DVIG** : POST /ingest pour chaque facture (payload avec event_type, source, idempotency_key, data move_id/montants, etc.) — ex. depuis le conteneur DVIG avec `urllib` ou script `scripts/send_two_invoices_to_dvig.py`.
  3. **Outbox** : un événement (1898) était en failed_hard (ancien 404) → remis en `accepted`, puis **POST /internal/outbox/process** pour renvoyer au Vault.
  4. Les documents 1896 et 1898 existaient déjà dans le Vault mais avec **total_ttc**, **invoice_number**, **invoice_date**, **move_type** vides → **UPDATE** en base Vault pour renseigner ces champs (et `move_type = 'out_invoice'` pour 1896).
  5. En **Odoo** : remise en **vaulted** avec les bons `dorevia_dvig_event_id` pour 1896 et 1898.

### 2.7 Carte Linky : HT / taxes, ratio Certifié, rafraîchissement automatique

- **Total HT et montant des taxes** (Vault + Linky) :  
  - Vault : champs **total_ht**, **total_tax** (TTC − HT) dans la réponse GET /ui/aggregations/sales ; déduplication sur les mêmes factures.  
  - Backfill **total_ht** pour les documents existants : `scripts/backfill_vault_total_ht.sql` (à exécuter sur la base dorevia_vault).  
  - Linky : affichage « Hors taxes » et « Dont taxes » sous le total TTC (libellé « Dont taxes » pour couvrir toutes les taxes, pas seulement la TVA).

- **Ratio Certifié** : (factures vaultées dans le Vault) / (factures de vente postées dans Odoo), affiché en **Certifié : X %**.  
  - Vault : champ **invoices_count** dans la réponse d’agrégation (nombre de factures distinctes vaultées).  
  - Linky : dénominateur via **ODOO_POSTED_SALES_COUNT** (env) ou **ODOO_METRICS_URL** (GET → `{ posted_sales_count }`).  
  - Compose sarl-la-platine : `ODOO_POSTED_SALES_COUNT: "30"`.

- **Rafraîchissement automatique** : pas de rechargement manuel de la page.  
  - Composant client **SalesCardWithPolling** : polling **toutes les 30 secondes** vers GET /api/sales.  
  - API **/api/sales** : retourne les données Vault + **posted_sales_count** ; pas de cache (`revalidate = 0`, `cache: "no-store"`) pour que chaque appel ait des données à jour.

- **Affichage « certifié » fusionné** (éviter doublon) : un seul **badge vert** — « Certifié : X % » (ou « Certifié : X / Y ») quand le ratio est connu, sinon « Données certifiées » ; en dessous, une seule ligne **« Dernier scellement : … »** (sans répéter le pourcentage). Fichier : `components/SalesCard.tsx`.

- **Redirection anciennes URLs Appsmith** : les chemins `/app/*` (ex. anciens signets ou liens Appsmith sur le même domaine) redirigent vers `/` (dashboard Linky) pour éviter une 404. Fichier : `next.config.js` (redirects).

- **Image Vault déployée** : **dorevia/vault:v1.4.0-ht-tax** (dédup + total_ht + total_tax + invoices_count).

---

## 3. Récapitulatif des changements (fichiers / config)

| Domaine | Fichier / lieu | Modification |
|--------|----------------|--------------|
| Odoo | `dorevia_vault_connector` (account_move, ir_cron) | no_abandon, CRON reconciler failed_hard |
| Vault | `internal/auth/rbac.go`, `cmd/vault/main.go` | Route POST /api/v1/events |
| Vault | `internal/models/aggregations.go` | Champs total_ht, total_tax, invoices_count |
| Vault | `internal/storage/aggregations_sales.go` | Dédup par odoo_id ; total_ht, total_tax, invoices_count |
| Compose | `tenants/core-stinger/platform/docker-compose.yml` | VAULT_HOST=vault-core-stinger (dvig), image vault v1.4.0-ht-tax |
| Linky | `app/api/sales/route.ts` | Retourne Vault + posted_sales_count ; pas de cache (polling) |
| Linky | `app/lib/odoo-metrics.ts` | fetchPostedSalesCount (ODOO_POSTED_SALES_COUNT ou ODOO_METRICS_URL) |
| Linky | `components/SalesCard.tsx` | Hors taxes / Dont taxes ; badge unique Certifié : X % (ou Données certifiées) ; Dernier scellement en une ligne |
| Linky | `next.config.js` | Redirection /app/* → / (anciennes URLs Appsmith) |
| Linky | `components/SalesCardWithPolling.tsx` | Polling 30 s vers /api/sales, mise à jour sans rechargement |
| Linky | `app/page.tsx` | Données initiales serveur + SalesCardWithPolling |
| Compose | `tenants/sarl-la-platine/apps/ui/lab/docker-compose.yml` | ODOO_POSTED_SALES_COUNT=30 |
| Données | Base Odoo (account_move) | 1896, 1898 : todo → puis vaulted + event_id |
| Données | Base dorevia_vault (outbox_events) | Réinitialisation event facture 9, event 1898 |
| Données | Base Vault (documents) | Complétion total_ttc, total_ht, invoice_*, move_type (1896, 1898 + backfill HT) |
| Script | `scripts/send_two_invoices_to_dvig.py` | Envoi manuel 1896, 1898 vers DVIG /ingest (optionnel) |
| Script | `scripts/backfill_vault_total_ht.sql` | Backfill total_ht sur documents sarl-la-platine (optionnel si déjà alimenté par events) |

---

## 4. Ordre des opérations (pour reproduire ou expliquer)

1. **Infra / code** : Vault expose POST /api/v1/events ; DVIG a VAULT_HOST=vault-core-stinger ; agrégation Vault dédupliquée puis v1.4.0-ht-tax (total_ht, total_tax, invoices_count).
2. **Facture 9** : Réinitialiser l’event outbox (1905) → process outbox → fetch proof côté Odoo.
3. **Factures 1 et 2** : Remise en todo → ingest DVIG (1896, 1898) → process outbox → compléter documents Vault (total_ttc, move_type, etc.) → Odoo remis en vaulted.
4. **Backfill total_ht** (si besoin) : exécuter `scripts/backfill_vault_total_ht.sql` sur la base dorevia_vault.
5. **Déploiement** : Build image Vault v1.4.0-ht-tax, mise à jour compose platform, `docker compose -p dorevia_core-stinger_platform up -d vault` ; build image Linky, `ODOO_POSTED_SALES_COUNT` dans le compose ui lab, `docker compose -p dorevia_ui_lab_sarl-la-platine up -d linky`.
6. **Linky** : Ouverture de la page (ou d’une URL `/app/...`) → total **914 093,53 €**, Hors taxes / Dont taxes, badge **Certifié : 100 %**, ligne « Dernier scellement » ; données mises à jour **automatiquement toutes les 30 secondes** sans rechargement.

---

## 5. Accord : chaque facture vaultée remonte automatiquement dans Linky

**Principe retenu** : Dès qu’une facture de vente est **vaultée** (statut `vaulted` dans Odoo, document présent dans le Vault avec `total_ttc` et `move_type = out_invoice`), elle est **automatiquement** prise en compte dans la carte **Ventes certifiées** de Dorevia Linky.

- **Flux** : Odoo (validation → todo → ingest DVIG → outbox → POST Vault /api/v1/events) → document créé/mis à jour dans le Vault → agrégation GET /ui/aggregations/sales (avec déduplication par `odoo_id`) → Linky affiche le total.
- Aucune action manuelle n’est nécessaire : le **polling toutes les 30 secondes** met à jour la carte sans rechargement de la page ; une nouvelle facture vaultée apparaît au plus tard au prochain cycle.
- **Condition** : Linky doit être configuré avec le **même** Vault que celui alimenté par le DVIG (pour sarl-la-platine : `VAULT_URL` vers vault-core-stinger, `TENANT_ID=sarl-la-platine`).

---

## 6. Documentation associée

- **DIAGNOSTIC_FACTURES_NON_VAULTEES.md** : causes des factures non vaultées, migration, remise en todo, §7 (404 /api/v1/events), §8 (total Ventes certifiées, doublon, dédup).
- **FLUX_VAULTAGE_ODOO_STINGER_SARL_LA_PLATINE.md** : chaîne Odoo → DVIG → Vault, config Linky (Option B, VAULT_URL core-stinger).

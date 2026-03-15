# Runbook — Aligner le Vault sur le rapprochement o19 (RECONCIL)

**Objectif** : Que la projection `bank_reconciliation_projection` du Vault reflète la réalité Odoo o19 (1 ligne rapprochée 996 €, 3 à rapprocher 3 391 €).

## 1. Prérequis

- Token DVIG pour le tenant **o19** présent dans `tenants/core-stinger/secrets/dvig.tokens.yml`.
- Odoo o19 configuré pour DVIG (voir §2).

## 2. Configurer Odoo o19 pour DVIG

**Option A — Variables d'environnement (recommandé pour Docker)**

Dans `tenants/o19/apps/odoo/lab/docker-compose.yml`, le service `odoo` a déjà :

- `ODOO_DVIG_URL`: `http://dvig-core-stinger:8080`
- `ODOO_DVIG_SOURCE`: `odoo.lab.o19`
- `ODOO_DVIG_TENANT`: `o19`
- `ODOO_DVIG_TOKEN`: `${DVIG_TOKEN_O19:-}`

Définir `DVIG_TOKEN_O19` (secret) dans un fichier `.env` à la racine du projet ou l’exporter avant `docker compose up`.  
Si le token est déjà en base Odoo (option B), ce n’est pas obligatoire.

**Option B — Script de configuration (une fois)**

```bash
# Générer un nouveau token et configurer Odoo (écrase l’entrée o19 dans dvig.tokens.yml)
./tenants/o19/apps/odoo/lab/fix_vault_token.sh
```

Ou configurer manuellement dans Odoo (Paramètres → Technique → Paramètres système) :

- `dorevia.dvig.url` = `http://dvig-core-stinger:8080`
- `dorevia.dvig.token` = \<token o19\>
- `dorevia.dvig.source` = `odoo.lab.o19`
- `dorevia.tenant` = `o19`

## 3. Lancer le backfill rapprochement

Envoie l’état actuel des lignes de relevé (dont la ligne rapprochée 996 €) vers DVIG → Vault.

```bash
./tenants/o19/apps/odoo/lab/run_backfill_reconcil_o19.sh
```

Résultat attendu : `Backfill terminé : 1 envoyés, 0 erreurs` (ou plus si plusieurs lignes postées).

## 4. Vérifier le Vault

- **Trésorerie** : `GET /ui/aggregations/treasury?tenant=o19` (montants rapprochés / non rapprochés).
- **Projection** (en base) :
  ```bash
  docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c \
    "SELECT move_id, is_reconciled, amount FROM bank_reconciliation_projection WHERE tenant = 'o19';"
  ```
  Attendu après backfill : au moins une ligne avec `is_reconciled = true` et `amount = 996` (move_id = id de la ligne de relevé dans Odoo, ex. 617).

## 5. Si la projection ne se met pas à jour

1. Vérifier l’outbox DVIG : événements `bank.move.reconciled` / `bank.move.unreconciled` pour tenant o19 en statut `forwarded`.
2. Relancer le worker DVIG : `POST /internal/outbox/process` avec `{"limit": 50}` (auth Bearer DVIG_INTERNAL_TOKEN).
3. Relancer le backfill (§3) puis revérifier la projection (§4).

## 6. Stabilisation données Linky o19

Pour que Linky affiche des **données réelles à jour** (alignées Odoo o19 ↔ Vault), configurer Linky avec `ODOO_O19_URL` (ex. `http://odoo_lab_o19:8069`) et le Vault avec `ODOO_BANK_RECONCILIATION_URL_O19`. Détail : **`RUNBOOK_STABILISATION_DONNEES_LINKY_O19.md`**.

## 7. Corrections appliquées (2026-03-08)

- **Connecteur** : `get_dvig_config()` avec fallback sur `ODOO_DVIG_URL`, `ODOO_DVIG_TOKEN`, `ODOO_DVIG_SOURCE`, `ODOO_DVIG_TENANT`.
- **Compose o19** : variables d’environnement DVIG ajoutées pour le service `odoo`.
- **Script** : `tenants/o19/apps/odoo/lab/run_backfill_reconcil_o19.sh` pour lancer le backfill en une commande.

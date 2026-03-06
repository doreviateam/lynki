# Runbook — Backfill Confirmation Bancaire (financial_recon_deltas)

**Version :** v1.0  
**Date :** 2026-03-03  
**Référence :** SPEC Reste à rapprocher (ZeDocs/web38), Confirmation Bancaire v1.3

---

## Contexte

La table `financial_recon_deltas` matérialise le lien **paiement ↔ ligne de relevé** pour l’indicateur « Reste à rapprocher ».

Elle est alimentée par les événements `bank.move.reconciled` / `unreconciled` via le handler Vault `confirmation-events`. Le DVIG envoie ces événements **après** le POST vers `bank-reconciliation/events`.

**Problème typique** : Si les confirmations ont été traitées **avant** que les paiements existent dans le Vault, `GetDocumentByTenantOdooModelID` ne trouve rien → aucune ligne insérée → `financial_recon_deltas` vide.

**Solution** : Exécuter le backfill de confirmation **après** le backfill des paiements.

---

## Prérequis

1. **Paiements présents dans le Vault** (backfill Odoo → Vault effectué)
2. **Lignes de relevé rapprochées** dans Odoo (`account.bank.statement.line` avec `is_reconciled = True`)
3. **DVIG opérationnel** (ingest, outbox, worker)
4. **Vault opérationnel** (endpoint `confirmation-events`)

---

## Étapes

### 1. Vérifier paiements présents (Vault)

```bash
# Exemple laplatine2026
docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "
SELECT COUNT(*) AS n_payments
FROM documents
WHERE tenant = 'laplatine2026' AND source = 'payment';
"
```

Attendu : `n_payments > 0`. Si 0 → exécuter d’abord le backfill paiements.

---

### 2. Relancer le backfill confirmation (Odoo)

**Option A — Action serveur (recommandé pour rattrapage ponctuel)**

1. Odoo → Paramètres (ou menu dédié)
2. Exécuter l’action : **📥 Backfill Confirmation Bancaire (v1.3)**
3. Ou via shell Odoo :

```python
env['account.bank.statement.line'].backfill_reconciliation_confirmation_events(batch_size=500)
```

**Option B — CRON**

Le CRON `Reconcil Backfill Confirmation (v1.3)` tourne toutes les 6 h. Pour forcer immédiatement :

```python
# Dans shell Odoo
env['ir.cron'].search([('model_id.model', '=', 'account.bank.statement.line'), ('code', 'ilike', 'backfill_reconciliation')]).method_direct_trigger()
```

**Option C — Re-play après correction du code (_traverse_to_impacted_documents)**

Lorsque des lignes ont eu `impacted_documents` vide (ex. lignes 7, 8) et que le code Odoo a été corrigé :

1. **Réinitialiser le curseur backfill** (shell Odoo) :
   ```python
   env['ir.config_parameter'].sudo().set_param('dorevia.vault.reconcil_backfill_last_bsl_id', '0')
   ```

2. **Supprimer les événements outbox** pour les lignes à rejouer (DVIG DB) :
   ```sql
   -- Exemple : lignes 7 et 8 pour laplatine2026
   DELETE FROM outbox_events
   WHERE tenant = 'laplatine2026'
     AND payload->>'event_type' = 'bank.move.reconciled'
     AND (payload->'data'->>'bank_statement_line_id')::int IN (7, 8);
   ```

3. **Relancer le backfill** (shell Odoo) :
   ```python
   env['account.bank.statement.line'].backfill_reconciliation_confirmation_events(batch_size=500)
   ```

4. **Déclencher le worker DVIG** (étape 3 ci-dessous).

---

### 3. Déclencher le worker DVIG

Les événements sont en outbox. Le worker les traite en continu. Pour accélérer :

```bash
# Appel manuel du trigger (si exposé)
curl -X POST "http://dvig:8000/trigger-worker?limit=100"
```

Ou attendre le cycle normal du worker.

---

### 4. Vérifier financial_recon_deltas > 0

```bash
docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "
SELECT tenant, COUNT(*) AS n, SUM(CASE WHEN direction = '+' THEN 1 ELSE 0 END) AS reconciled, SUM(CASE WHEN direction = '-' THEN 1 ELSE 0 END) AS unreconciled
FROM financial_recon_deltas
WHERE tenant = 'laplatine2026'
GROUP BY tenant;
"
```

Attendu : `n > 0` après backfill.

---

### 5. Vérifier SUM(direction) (optionnel)

Pour un paiement donné, la règle « rapproché » est `SUM(direction) > 0` (avec + → 1, - → -1).

```sql
-- Exemple : paiements avec SUM(direction) <= 0 (délettrés ou incohérents)
WITH sums AS (
  SELECT document_id, SUM(CASE WHEN direction = '+' THEN 1 ELSE -1 END) AS sum_dir
  FROM financial_recon_deltas
  WHERE tenant = 'laplatine2026'
  GROUP BY document_id
)
SELECT d.id, s.sum_dir
FROM documents d
JOIN sums s ON s.document_id = d.id
WHERE d.tenant = 'laplatine2026' AND d.source = 'payment'
  AND s.sum_dir <= 0;
```

---

### 6. Vérification post-backfill (sanity-check KPI)

Après exécution du runbook, vérifier :

1. **Lignes insérées** : `SELECT COUNT(*) FROM financial_recon_deltas WHERE tenant='laplatine2026';` → doit être > 0

2. **Sample** :
   ```sql
   SELECT document_id, bank_statement_line_id, occurred_at, direction
   FROM financial_recon_deltas
   WHERE tenant='laplatine2026'
   ORDER BY occurred_at DESC
   LIMIT 20;
   ```

3. **KPI cohérent** : A > 0, R > 0, reste% diminue (au moins un peu par rapport à l’état pré-backfill)

---

## Ordre recommandé (nouveau tenant / post-backfill)

1. Backfill paiements Odoo → Vault  
2. Backfill confirmation bancaire (ce runbook)  
3. Vérifier `financial_recon_deltas`  
4. L’indicateur « Reste à rapprocher » devient exploitable  

---

## Références

* `units/odoo/custom-addons/dorevia_vault_connector/models/account_bank_statement_line.py` — `backfill_reconciliation_confirmation_events`
* `sources/vault/internal/handlers/bank_reconciliation_confirmation.go` — handler `confirmation-events`
* `sources/dvig/workers/outbox_worker.py` — `format_vault_payload_bank_reconciliation_confirmation`
* `ZeDocs/web38/SPEC_RESTE_A_RAPPROCHER.md` — spec indicateur

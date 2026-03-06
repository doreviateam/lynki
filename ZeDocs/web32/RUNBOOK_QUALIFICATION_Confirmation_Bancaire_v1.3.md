# Runbook — Qualification Confirmation Bancaire Stricte v1.3 (Sprint 4)

**Date :** 2026-02-25  
**Objectif :** Exécuter le backfill, valider la double écriture (projection + deltas), recette API Treasury confirmation

**Référence :** `SPEC_Confirmation_Bancaire_Stricte_v1.3.md`, `PLAN_IMPLEMENTATION_Confirmation_Bancaire_Stricte_v1.3_SCRUM.md`

---

## 1. Ordre de déploiement (OBLIGATOIRE)

| Étape | Composant | Action |
|-------|-----------|--------|
| 0 | Vault | Migration 036 appliquée (`financial_recon_deltas`, `amount_signed`) |
| 1 | Vault | Handler v1.2 `/api/v1/bank-reconciliation/confirmation-events` déployé |
| 2 | Odoo | Module `dorevia_vault_connector` avec payload v1.2 (impacted_documents) |
| 3 | DVIG | Worker avec dual-forward (projection + confirmation) |
| 4 | Backfill | Exécuter backfill Confirmation Bancaire |

---

## 2. Prérequis

- Docker, docker-compose
- Réseau `dorevia-network` existant
- Odoo stinger sarl-la-platine (ou lab) démarré
- Backfill RECONCIL **projection** déjà effectué (lignes dans `bank_reconciliation_projection`)
- Vault DB accessible pour vérifications SQL

---

## 3. Déploiement

### 3.1 Vault — Migration 036

Vérifier que la migration est appliquée :

```bash
psql -U vault -d vault_<tenant> -c "
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_recon_deltas');
SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'amount_signed');
"
```

Si absent, appliquer :

```bash
cd /opt/dorevia-plateform/sources/vault
psql -U vault -d vault_<tenant> -f migrations/036_financial_recon_deltas_and_amount_signed.sql
```

### 3.2 Vault — Rebuild

```bash
cd /opt/dorevia-plateform/sources/vault
docker build -t dorevia/vault:confirmation-v1.3 .
```

### 3.3 DVIG — Rebuild (dual-forward projection + confirmation)

```bash
cd /opt/dorevia-plateform/sources/dvig
docker build -t dorevia/dvig:confirmation-v1.3 .
```

### 3.4 Redémarrer les services

```bash
# Vault + DVIG (core-stinger)
cd /opt/dorevia-plateform/tenants/core-stinger/platform
docker compose -p dorevia_core-stinger_platform up -d vault dvig --force-recreate


# Odoo (recharger addon payload v1.2)
cd tenants/sarl-la-platine/apps/odoo/stinger
docker compose -p dorevia_odoo_stinger_sarl-la-platine restart odoo
```

---

## 4. Backfill Confirmation Bancaire

### 4.1 Option A — Action serveur manuelle (recommandé pour premier run)

1. Se connecter à Odoo (admin)
2. Paramètres → Technique → Actions serveur
3. Chercher « Backfill Confirmation Bancaire (v1.3) »
4. Exécuter l'action → notification « X lignes traitées »

### 4.2 Option B — CRON (rattrapage périodique)

Le CRON `Reconcil Backfill Confirmation (v1.3)` s'exécute toutes les 6 h (batch 100). Pour forcer une exécution immédiate :

```bash
# Depuis un shell Odoo
odoo shell -d <database> --no-http
>>> env['account.bank.statement.line'].backfill_reconciliation_confirmation_events(batch_size=500)
>>> env.cr.commit()
>>> exit()
```

### 4.3 Réinitialiser le curseur backfill (si besoin)

Pour rejouer tout le backfill depuis le début :

```sql
-- Odoo : ir.config_parameter
UPDATE ir_config_parameter SET value = '0' WHERE key = 'dorevia.vault.reconcil_backfill_last_bsl_id';
```

---

## 5. Vérifications obligatoires

### 5.1 Table financial_recon_deltas

```sql
-- Nombre de deltas par tenant
SELECT tenant, direction, COUNT(*), SUM(delta_amount_abs)
FROM financial_recon_deltas
GROUP BY tenant, direction;
```

### 5.2 Check 1 — Invariant multi-split

Pour chaque `bank_statement_line_id` backfillé : `SUM(deltas "+")` = montant ligne (abs).

```sql
-- Vérification : somme des deltas par bank_statement_line_id (direction +)
WITH deltas_per_bsl AS (
  SELECT bank_statement_line_id, SUM(delta_amount_abs) AS sum_deltas
  FROM financial_recon_deltas
  WHERE tenant = 'sarl-la-platine' AND direction = '+'
  GROUP BY bank_statement_line_id
)
SELECT bank_statement_line_id, sum_deltas
FROM deltas_per_bsl
ORDER BY bank_statement_line_id;
```

*Note :* Comparer `sum_deltas` aux montants des lignes Odoo correspondantes. Les exclusions cross-currency peuvent expliquer des écarts.

### 5.3 Check 2 — Invariant document clamp

Pour chaque document : `confirmed_abs ≤ ABS(amount_signed)`.

```sql
-- Vérification : aucun document avec confirmed_abs > amount_abs
WITH doc_amounts AS (
  SELECT d.id, ABS(COALESCE(d.amount_signed, 0)) AS amount_abs
  FROM documents d
  WHERE d.tenant = 'sarl-la-platine' AND d.source = 'payment'
    AND d.odoo_model IN ('account.payment', 'pos.payment')
),
delta_sums AS (
  SELECT document_id,
    SUM(CASE WHEN direction = '+' THEN delta_amount_abs ELSE -delta_amount_abs END) AS raw_sum
  FROM financial_recon_deltas
  WHERE tenant = 'sarl-la-platine'
  GROUP BY document_id
)
SELECT da.id, da.amount_abs, COALESCE(ds.raw_sum, 0) AS confirmed_raw,
  LEAST(GREATEST(COALESCE(ds.raw_sum, 0), 0), da.amount_abs) AS confirmed_clamped
FROM doc_amounts da
LEFT JOIN delta_sums ds ON ds.document_id = da.id
WHERE GREATEST(COALESCE(ds.raw_sum, 0), 0) > da.amount_abs + 0.01;
```

**Attendu :** 0 lignes (aucun document en violation du clamp).

### 5.4 API Treasury — Objet confirmation

```bash
curl -s "http://localhost:8080/ui/aggregations/treasury?tenant=sarl-la-platine" | jq '.confirmation'
```

**Attendu :**

```json
{
  "total_amount_abs": <X>,
  "confirmed_amount_abs": <Y>,
  "unconfirmed_amount_abs": <Z>,
  "confirmation_rate": <0..1>,
  "full_count": <n>,
  "partial_count": <n>,
  "unconfirmed_count": <n>
}
```

**Vérifications :**
- [ ] `total_amount_abs` > 0 si des paiements sont vaultés
- [ ] `confirmation_rate` cohérent avec métier (0 si aucun rapprochement, 1 si tout rapproché)
- [ ] `full_count` + `partial_count` + `unconfirmed_count` = total documents payment

---

## 6. Double écriture (vérification)

| Flux | Endpoint Vault | Table cible |
|------|----------------|-------------|
| **Projection** (Position) | POST `/api/v1/bank-reconciliation/events` | `bank_reconciliation_projection` |
| **Confirmation** (deltas) | POST `/api/v1/bank-reconciliation/confirmation-events` | `financial_recon_deltas` |

**Validation :** Un rapprochement Odoo déclenche 2 appels DVIG → Vault :
1. Projection → position
2. Confirmation → deltas (si `impacted_documents` non vide)

Vérifier les logs DVIG : `vault_confirmation_ok` présent après un rapprochement.

---

## 7. Script de vérification (SQL)

```bash
cd /opt/dorevia-plateform
psql -U vault -d vault_sarl-la-platine -f scripts/verify_confirmation_invariants.sql
```

Le script exécute Check 1, Check 2 et affiche le résumé agrégation. Pour un autre tenant, modifier `tenant_sql` dans le script.

---

## 8. Checklist DoD Sprint 4

| Item | Statut |
|------|--------|
| Migration 036 appliquée | |
| Vault handler v1.2 déployé | |
| Odoo payload v1.2 + DVIG dual-forward déployés | |
| Backfill exécuté | |
| Check 1 (invariant multi-split) validé | |
| Check 2 (invariant document clamp) validé | |
| API Treasury `.confirmation` cohérent | |
| Projection RECONCIL inchangée | |

---

## 9. Troubleshooting

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| `impacted_documents is required` (400) | Payload Odoo ancien format | Vérifier addon `dorevia_vault_connector` à jour |
| 0 deltas après backfill | Lignes sans payment vaulté, ou cross-currency | Vérifier `traverse` : seuls account.payment / pos.payment inclus |
| confirmation null dans Treasury | Aucun delta ou tenant/company_id mismatch | Vérifier `GetConfirmationAggregation` ; filtrer par company_id |
| Doublons dans financial_recon_deltas | event_uid non unique | Vérifier idempotency_key Odoo stable (`reconcil:tenant:bsl:id:suffix`) |

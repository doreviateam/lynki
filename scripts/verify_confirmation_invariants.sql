-- Script de vérification invariants Confirmation Bancaire v1.3 (Sprint 4)
-- Usage : psql -U vault -d vault_sarl-la-platine -f scripts/verify_confirmation_invariants.sql
-- Pour autre tenant : modifier 'sarl-la-platine' ci-dessous

\set tenant_sql 'sarl-la-platine'
\echo '=== Vérification Confirmation Bancaire v1.3 ==='
\echo 'Tenant :' :tenant_sql
\echo ''

-- 1. Nombre de deltas
\echo '--- 1. Deltas par direction ---'
SELECT direction, COUNT(*) AS count, ROUND(SUM(delta_amount_abs)::numeric, 2) AS sum_amount
FROM financial_recon_deltas
WHERE tenant = :'tenant_sql'
GROUP BY direction;

-- 2. Check 1 — Invariant multi-split (échantillon)
\echo ''
\echo '--- 2. Check 1 : Invariant multi-split (5 premières lignes) ---'
WITH deltas_per_bsl AS (
  SELECT bank_statement_line_id, SUM(delta_amount_abs) AS sum_deltas
  FROM financial_recon_deltas
  WHERE tenant = :'tenant_sql' AND direction = '+'
  GROUP BY bank_statement_line_id
)
SELECT bank_statement_line_id, ROUND(sum_deltas::numeric, 2) AS sum_deltas
FROM deltas_per_bsl
ORDER BY bank_statement_line_id
LIMIT 5;

-- 3. Check 2 — Invariant document clamp (violations)
\echo ''
\echo '--- 3. Check 2 : Violations document clamp ---'
WITH doc_amounts AS (
  SELECT d.id, ABS(COALESCE(d.amount_signed, 0)) AS amount_abs
  FROM documents d
  WHERE d.tenant = :'tenant_sql' AND d.source = 'payment'
    AND d.odoo_model IN ('account.payment', 'pos.payment')
),
delta_sums AS (
  SELECT document_id,
    SUM(CASE WHEN direction = '+' THEN delta_amount_abs ELSE -delta_amount_abs END) AS raw_sum
  FROM financial_recon_deltas
  WHERE tenant = :'tenant_sql'
  GROUP BY document_id
)
SELECT COUNT(*) AS violation_count
FROM doc_amounts da
JOIN delta_sums ds ON ds.document_id = da.id
WHERE GREATEST(COALESCE(ds.raw_sum, 0), 0) > da.amount_abs + 0.01;

\echo ''
\echo '--- 4. Résumé agrégation confirmation ---'
WITH doc_amounts AS (
  SELECT d.id, ABS(COALESCE(d.amount_signed, 0)) AS amount_abs
  FROM documents d
  WHERE d.tenant = :'tenant_sql' AND d.source = 'payment'
    AND d.odoo_model IN ('account.payment', 'pos.payment')
),
delta_sums AS (
  SELECT document_id,
    SUM(CASE WHEN direction = '+' THEN delta_amount_abs ELSE -delta_amount_abs END) AS raw_sum
  FROM financial_recon_deltas
  WHERE tenant = :'tenant_sql'
  GROUP BY document_id
),
clamped AS (
  SELECT da.amount_abs,
    LEAST(GREATEST(COALESCE(ds.raw_sum, 0), 0), da.amount_abs) AS confirmed_abs
  FROM doc_amounts da
  LEFT JOIN delta_sums ds ON ds.document_id = da.id
)
SELECT
  ROUND(SUM(amount_abs)::numeric, 2) AS total_amount_abs,
  ROUND(SUM(confirmed_abs)::numeric, 2) AS confirmed_amount_abs,
  ROUND(SUM(amount_abs - confirmed_abs)::numeric, 2) AS unconfirmed_amount_abs,
  CASE WHEN SUM(amount_abs) > 0.01
    THEN ROUND((SUM(confirmed_abs) / SUM(amount_abs))::numeric, 4)
    ELSE 1.0
  END AS confirmation_rate
FROM clamped;

\echo ''
\echo '=== Fin vérification ==='

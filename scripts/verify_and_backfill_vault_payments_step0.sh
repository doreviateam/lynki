#!/usr/bin/env bash
# Vérification et backfill tenant + company_id sur les documents paiements (Step 0)
# Pour que les agrégations /ui/aggregations/payments-in et payments-out retournent des données.
# Usage: ./scripts/verify_and_backfill_vault_payments_step0.sh [VAULT_DB_CONTAINER]
# Ex.   ./scripts/verify_and_backfill_vault_payments_step0.sh vault-db-core-stinger

set -euo pipefail
VAULT_DB_CONTAINER="${1:-vault-db-core-stinger}"
DB_USER="${VAULT_DB_USER:-vault}"
DB_NAME="${VAULT_DB_NAME:-dorevia_vault}"

echo "=== Vérification des documents source=payment (tenant, company_id) ==="
echo "Conteneur: $VAULT_DB_CONTAINER"
echo ""

# Vérification : compter les paiements avec/sans tenant et company_id
docker exec "$VAULT_DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A -c "
SELECT 'Total payment docs' AS label, COUNT(*) AS cnt FROM documents WHERE source = 'payment'
UNION ALL
SELECT 'With tenant', COUNT(*) FROM documents WHERE source = 'payment' AND tenant IS NOT NULL AND tenant != ''
UNION ALL
SELECT 'With company_id', COUNT(*) FROM documents WHERE source = 'payment' AND company_id IS NOT NULL AND company_id != ''
UNION ALL
SELECT 'Missing tenant', COUNT(*) FROM documents WHERE source = 'payment' AND (tenant IS NULL OR tenant = '')
UNION ALL
SELECT 'Missing company_id', COUNT(*) FROM documents WHERE source = 'payment' AND (company_id IS NULL OR company_id = '');
"

echo ""
echo "=== Backfill : dériver tenant et company_id depuis payload_json pour les paiements manquants ==="

# Backfill tenant depuis payload (payload_json->>'tenant')
docker exec "$VAULT_DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
UPDATE documents
SET tenant = NULLIF(TRIM(payload_json->>'tenant'), '')
WHERE source = 'payment'
  AND payload_json IS NOT NULL
  AND payload_json->>'tenant' IS NOT NULL
  AND (tenant IS NULL OR tenant = '');
" 2>/dev/null || true

# Backfill company_id au format normatif (odoo_account:N ou odoo_pos:N) depuis payload
docker exec "$VAULT_DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
UPDATE documents
SET company_id = CASE
  WHEN payload_json->>'source_model' LIKE '%account%' THEN 'odoo_account:' || COALESCE(payload_json->>'company_id', '0')
  WHEN payload_json->>'source_model' LIKE '%pos%' THEN 'odoo_pos:' || COALESCE(payload_json->>'company_id', '0')
  ELSE 'odoo:' || COALESCE(payload_json->>'company_id', '0')
END
WHERE source = 'payment'
  AND payload_json IS NOT NULL
  AND (company_id IS NULL OR company_id = '');
" 2>/dev/null || true

echo ""
echo "=== Vérification après backfill ==="
docker exec "$VAULT_DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A -c "
SELECT 'With tenant', COUNT(*) FROM documents WHERE source = 'payment' AND tenant IS NOT NULL AND tenant != ''
UNION ALL
SELECT 'With company_id', COUNT(*) FROM documents WHERE source = 'payment' AND company_id IS NOT NULL AND company_id != '';
"

echo ""
echo "Terminé. Si les agrégations doivent être filtrées par company_id, les documents payment ont maintenant tenant et company_id renseignés."
echo "Tester les routes: curl -s 'http://<vault-host>:8080/ui/aggregations/payments-in?tenant=<tenant>&date_debut=2020-01-01&date_fin=2030-12-31'"

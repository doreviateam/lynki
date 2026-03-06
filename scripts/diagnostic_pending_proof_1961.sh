#!/bin/bash
# Diagnostic — pourquoi la facture 1961 reste en pending_proof
# Vérifie : Vault (preuve 200/404), queue_job, config Odoo

set -euo pipefail

MOVE_ID="${1:-1961}"
ODOO_DB="${ODOO_DB_CONTAINER:-odoo_db_stinger_sarl-la-platine}"
DB_NAME="${DB_NAME:-odoo_stinger_sarl-la-platine}"

echo "============================================================"
echo "🔍 Diagnostic pending_proof — Facture ID: $MOVE_ID"
echo "============================================================"
echo ""

# 1) Infos facture en base Odoo
echo "📋 1. Facture dans Odoo"
echo "------------------------------------------------------------"
docker exec "$ODOO_DB" psql -U odoo -d "$DB_NAME" -c "
  SELECT id, name, state, dorevia_vault_status,
         dorevia_dvig_event_id, dorevia_vault_last_try_at,
         LEFT(dorevia_vault_last_error, 80) as last_error
  FROM account_move WHERE id = $MOVE_ID;
" 2>/dev/null || echo "   (connexion DB impossible)"
echo ""

# 2) Vault utilisé par Odoo (depuis ir_config_parameter si lisible)
echo "📋 2. Paramètre dorevia.vault.url (Odoo)"
echo "------------------------------------------------------------"
VAULT_URL=$(docker exec "$ODOO_DB" psql -U odoo -d "$DB_NAME" -t -A -c "
  SELECT value FROM ir_config_parameter WHERE key = 'dorevia.vault.url';
" 2>/dev/null | tr -d '\r\n ')
echo "   dorevia.vault.url = ${VAULT_URL:-'(non trouvé)'}"
echo ""

# 3) Preuve existante ? (tester vault-core-stinger et vault-sarl-la-platine)
echo "📋 3. Preuve dans le Vault (GET /api/v1/proof/account_move/$MOVE_ID)"
echo "------------------------------------------------------------"
for VAULT_HOST in "vault.core-stinger.doreviateam.com" "vault.sarl-la-platine.doreviateam.com"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${VAULT_HOST}/api/v1/proof/account_move/${MOVE_ID}" 2>/dev/null || echo "000")
  echo "   https://${VAULT_HOST} → HTTP $CODE"
done
echo "   (200 = preuve présente, 404 = document absent dans ce Vault)"
echo ""

# 4) Derniers jobs queue_job (vault / proof)
echo "📋 4. Derniers jobs queue_job (vault / proof)"
echo "------------------------------------------------------------"
docker exec "$ODOO_DB" psql -U odoo -d "$DB_NAME" -c "
  SELECT id, name, state,
         TO_CHAR(date_created, 'HH24:MI:SS') as created,
         TO_CHAR(date_done, 'HH24:MI:SS') as done,
         LEFT(COALESCE(exc_info,''), 100) as exc
  FROM queue_job
  WHERE (name LIKE '%vault%' OR name LIKE '%proof%' OR record_ids::text LIKE '%$MOVE_ID%')
    AND date_created > NOW() - INTERVAL '1 hour'
  ORDER BY date_created DESC
  LIMIT 8;
" 2>/dev/null || echo "   (requête impossible)"
echo ""

# 5) Documents dans vault-db core-stinger (tenant sarl-la-platine, odoo_id)
echo "📋 5. Documents Vault (vault-db-core-stinger) pour tenant sarl-la-platine"
echo "------------------------------------------------------------"
if docker ps --format '{{.Names}}' | grep -q 'vault-db-core-stinger'; then
  docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "
    SELECT id, tenant, source_system, source_document_id, invoice_number, created_at
    FROM documents
    WHERE tenant = 'sarl-la-platine'
      AND (source_document_id LIKE '%1961%' OR source_document_id LIKE '%account_move%')
    ORDER BY created_at DESC
    LIMIT 5;
  " 2>/dev/null || echo "   (requête impossible)"
else
  echo "   Conteneur vault-db-core-stinger non trouvé (ou autre nom)."
  echo "   Vérifier: docker ps | grep vault"
fi
echo ""

echo "============================================================"
echo "💡 Suite : si preuve = 404 partout → event pas dans ce Vault (DVIG pointe ailleurs)."
echo "   Si preuve = 200 → Odoo ne récupère pas (CRON #2 / job fetch_proof, token, URL)."
echo "   Bouton Odoo « Refresh Proof Now » après 10 s si preuve disponible."
echo "============================================================"

#!/bin/bash
# Diagnostic : factures Odoo absentes du Vault (laplatine2026)
# Compare les IDs Odoo (account_move) avec les odoo_id du Vault.
#
# Usage : depuis la racine du projet
#   ./tenants/laplatine2026/scripts/diagnostic_missing_invoices.sh
#
# Sortie : missing_invoice_ids.txt (IDs à ré-envoyer)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_FILE="${SCRIPT_DIR}/missing_invoice_ids.txt"

ODOO_DB="laplatine2026"
ODOO_CONTAINER="odoo_db_lab_laplatine2026"
VAULT_CONTAINER="vault-db-core-stinger"
VAULT_DB="dorevia_vault"

# Vérifier que les conteneurs existent
if ! docker ps --format '{{.Names}}' | grep -q "^${ODOO_CONTAINER}$"; then
  echo "Conteneur Odoo DB non trouvé: ${ODOO_CONTAINER}"
  echo "Tentative avec odoo_db_lab_laplatine2026..."
  ODOO_CONTAINER="odoo_db_lab_laplatine2026"
fi

# IDs Odoo (factures ventes + achats posted)
ODOO_IDS=$(docker exec "${ODOO_CONTAINER}" psql -U odoo -d "${ODOO_DB}" -t -A -c "
  SELECT id FROM account_move
  WHERE state = 'posted'
    AND move_type IN ('out_invoice', 'in_invoice')
  ORDER BY id;
" 2>/dev/null | tr -d ' ' | grep -E '^[0-9]+$' || true)

# IDs présents dans le Vault (tenant laplatine2026, account.move)
VAULT_IDS=$(docker exec "${VAULT_CONTAINER}" psql -U vault -d "${VAULT_DB}" -t -A -c "
  SELECT DISTINCT odoo_id::text FROM documents
  WHERE tenant = 'laplatine2026'
    AND odoo_model = 'account.move'
    AND odoo_id IS NOT NULL
    AND move_type IN ('out_invoice', 'in_invoice');
" 2>/dev/null | tr -d ' ' | grep -E '^[0-9]+$' || true)

# Diff : Odoo - Vault
echo "# Factures Odoo absentes du Vault (généré $(date -Iseconds))" > "${OUT_FILE}"
echo "# Total Odoo: $(echo "$ODOO_IDS" | wc -l), Vault: $(echo "$VAULT_IDS" | wc -l)" >> "${OUT_FILE}"
for id in $ODOO_IDS; do
  if ! echo "$VAULT_IDS" | grep -q "^${id}$"; then
    echo "$id" >> "${OUT_FILE}"
  fi
done

MISSING_COUNT=$(grep -c -E '^[0-9]+$' "${OUT_FILE}" 2>/dev/null || echo 0)
echo "Factures manquantes : ${MISSING_COUNT}"
echo "Liste écrite dans : ${OUT_FILE}"

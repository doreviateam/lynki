#!/bin/bash
# Comptages Vault pour le tenant laplatine2026 (documents scellés).
# À comparer avec diagnostic_odoo_vault_laplatine2026.py (Odoo).

VAULT_DB="${VAULT_DB:-vault-db-core-stinger}"
echo "=== VAULT (tenant=laplatine2026) ==="
docker exec "$VAULT_DB" psql -U vault -d dorevia_vault -c "
SELECT source, COUNT(*) AS n
FROM documents
WHERE tenant = 'laplatine2026'
GROUP BY source
ORDER BY source;
"
echo ""
echo "Factures Vault (sales+purchase) vs Odoo (total factures postées)."
echo "Paiements Vault (payment) vs Odoo (total paiements éligibles)."

#!/bin/bash
# Lance le backfill rapprochement bancaire (RECONCIL) pour o19.
# Envoie l'état courant des lignes de relevé vers DVIG → Vault (bank_reconciliation_projection).
# Prérequis : Odoo o19 configuré (configure_vault_dvig.py ou ODOO_DVIG_* dans le compose).
# Usage: ./run_backfill_reconcil_o19.sh

set -euo pipefail
ROOT="/opt/dorevia-plateform"
LAB_DIR="${ROOT}/tenants/o19/apps/odoo/lab"
DB_NAME="odoo_lab_o19"

echo "=== Backfill rapprochement bancaire o19 → Vault ==="
docker exec -i odoo_lab_o19 odoo shell -d "$DB_NAME" --no-http << 'PYEOF'
backfill = env["bank.reconciliation.backfill"]
result = backfill.run_backfill(company_id=env.company.id)
print("Résultat:", result)
if result.get("message"):
    print(result["message"])
PYEOF
echo ""
echo "=== Vérifier le Vault : GET /ui/aggregations/treasury?tenant=o19 ==="

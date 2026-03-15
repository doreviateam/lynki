#!/bin/bash
# Backfill AR Payment History — envoie les factures payées (12 mois) au Vault.
# Nécessite que le shell Odoo démarre correctement (sans erreur de registre).
# Si "Model 'hr.payslip' does not exist" : corriger les modules Odoo puis réessayer.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTAINER="${ODOO_CONTAINER:-odoo_lab_laplatine2026}"
DB="${ODOO_DB:-laplatine2026}"

docker cp "$SCRIPT_DIR/backfill_ar_payment_history.py" "$CONTAINER:/tmp/backfill_ar_payment_history.py"
echo "Exécution du backfill dans le shell Odoo (db=$DB)..."
echo 'exec(open("/tmp/backfill_ar_payment_history.py").read())' | docker exec -i "$CONTAINER" odoo shell -d "$DB" --no-http
echo "Backfill terminé."

#!/bin/bash
# Backfill OD de paie (641*, 645*) vers le Vault — alimente payroll_od_lines pour l'agrégat EBE.
# LINKY-EBE-OD-01 / SPEC EBE OD payroll v1.0.
# Période par défaut : 2026-01-01 → 2026-02-28 (La Platine, 21 500 € attendus).

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTAINER="${ODOO_CONTAINER:-odoo_lab_laplatine2026}"
DB="${ODOO_DB:-laplatine2026}"

docker cp "$SCRIPT_DIR/backfill_payroll_od_lines.py" "$CONTAINER:/tmp/backfill_payroll_od_lines.py"
echo "Exécution du backfill payroll OD dans le shell Odoo (db=$DB)..."
echo 'exec(open("/tmp/backfill_payroll_od_lines.py").read())' | docker exec -i "$CONTAINER" odoo shell -d "$DB" --no-http
echo "Backfill payroll OD terminé."

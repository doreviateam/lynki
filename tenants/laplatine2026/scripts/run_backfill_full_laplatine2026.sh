#!/bin/bash
# Backfill COMPLET laplatine2026 → DVIG → Vault :
#   1. Factures (clients + achats / fournisseurs)
#   2. Paiements (clients + fournisseurs)
# Sans volume tenant-scripts. Prérequis : connecteur installé, DVIG/Vault configurés.
# Usage : depuis la racine du repo
#   ./tenants/laplatine2026/scripts/run_backfill_full_laplatine2026.sh

set -e
REPO_ROOT="${REPO_ROOT:-/opt/dorevia-plateform}"
CONTAINER="${CONTAINER:-odoo_lab_laplatine2026}"
DB="${DB:-laplatine2026}"

cd "$REPO_ROOT"
DIR="$REPO_ROOT/tenants/laplatine2026/scripts"
for f in backfill_all_invoices_to_vault.py backfill_all_payments_to_vault.py; do
  if [[ ! -f "$DIR/$f" ]]; then
    echo "Fichier introuvable: $DIR/$f"
    exit 1
  fi
done

echo "========== 1/2 Factures (clients + achats) =========="
docker cp "$DIR/backfill_all_invoices_to_vault.py" "$CONTAINER:/tmp/backfill_invoices.py"
docker exec -i "$CONTAINER" odoo shell -d "$DB" --no-http <<'PY'
exec(open('/tmp/backfill_invoices.py').read())
PY

echo ""
echo "========== 2/2 Paiements =========="
docker cp "$DIR/backfill_all_payments_to_vault.py" "$CONTAINER:/tmp/backfill_payments.py"
docker exec -i "$CONTAINER" odoo shell -d "$DB" --no-http <<'PY'
exec(open('/tmp/backfill_payments.py').read())
PY

echo ""
echo "Backfill complet terminé (factures + paiements)."
echo "Attendre 2–5 min que DVIG/Vault scellent, puis vérifier Linky (preuves scellées, cartes Business, Paiements, Taxes, etc.)."
echo "Optionnel (après paiements en Vault) : backfill confirmation rapprochement — ZeDocs/RUNBOOK_BACKFILL_CONFIRMATION.md"

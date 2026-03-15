#!/bin/bash
# Backfill paiements laplatine2026 → DVIG → Vault (sans volume tenant-scripts).
# Prérequis : connecteur dorevia_vault_connector installé ; DVIG/Vault configurés (ex. tenants/laplatine2026/scripts/configure_dvig_and_backfill.py).
# Usage : depuis la racine du repo
#   ./tenants/laplatine2026/scripts/run_backfill_payments_laplatine2026.sh

set -e
REPO_ROOT="${REPO_ROOT:-/opt/dorevia-plateform}"
CONTAINER="${CONTAINER:-odoo_lab_laplatine2026}"
DB="${DB:-laplatine2026}"

cd "$REPO_ROOT"
SCRIPT="$REPO_ROOT/tenants/laplatine2026/scripts/backfill_all_payments_to_vault.py"
if [[ ! -f "$SCRIPT" ]]; then
  echo "Fichier introuvable: $SCRIPT"
  exit 1
fi

echo "Copie du script dans le conteneur..."
docker cp "$SCRIPT" "$CONTAINER:/tmp/backfill_payments.py"

echo "Exécution backfill + 15 rounds cron + trigger_worker..."
docker exec -i "$CONTAINER" odoo shell -d "$DB" --no-http <<'PY'
exec(open('/tmp/backfill_payments.py').read())
PY

echo "Backfill paiements terminé. Attendre 2–5 min que DVIG/Vault scellent, puis vérifier Linky."
echo "Optionnel (après paiements en Vault) : backfill confirmation rapprochement — voir ZeDocs/RUNBOOK_BACKFILL_CONFIRMATION.md"

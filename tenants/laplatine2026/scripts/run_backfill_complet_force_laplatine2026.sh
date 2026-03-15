#!/bin/bash
# Backfill COMPLET laplatine2026 : toutes factures + tous paiements → todo puis DVIG/Vault.
# Garantit que tout l'éligible Odoo est poussé (y compris déjà vaulted).
# Usage : ./tenants/laplatine2026/scripts/run_backfill_complet_force_laplatine2026.sh

set -e
REPO_ROOT="${REPO_ROOT:-/opt/dorevia-plateform}"
CONTAINER="${CONTAINER:-odoo_lab_laplatine2026}"
DB="${DB:-laplatine2026}"

cd "$REPO_ROOT"
SCRIPT="$REPO_ROOT/tenants/laplatine2026/scripts/backfill_complet_force_laplatine2026.py"
[[ -f "$SCRIPT" ]] || { echo "Fichier introuvable: $SCRIPT"; exit 1; }

echo "Copie et exécution du backfill complet (toutes factures + tous paiements → Vault)..."
docker cp "$SCRIPT" "$CONTAINER:/tmp/backfill_complet_force.py"
docker exec -i "$CONTAINER" odoo shell -d "$DB" --no-http <<'PY'
exec(open('/tmp/backfill_complet_force.py').read())
PY
echo "Terminé. Attendre 2–5 min puis : ./tenants/laplatine2026/scripts/diagnostic_vault_laplatine2026.sh et vérifier Linky."
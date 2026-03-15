#!/bin/bash
# Rétablir la vérité Vault pour laplatine2026 : factures et paiements
# marqués vaulted dans Odoo sont remis en todo puis ré-envoyés vers DVIG → Vault.
# Usage : depuis la racine du repo
#   ./tenants/laplatine2026/scripts/run_resync_odoo_vault_laplatine2026.sh

set -e
REPO_ROOT="${REPO_ROOT:-/opt/dorevia-plateform}"
CONTAINER="${CONTAINER:-odoo_lab_laplatine2026}"
DB="${DB:-laplatine2026}"

cd "$REPO_ROOT"
SCRIPT="$REPO_ROOT/tenants/laplatine2026/scripts/resync_odoo_vault_laplatine2026.py"
if [[ ! -f "$SCRIPT" ]]; then
  echo "Fichier introuvable: $SCRIPT"
  exit 1
fi

echo "Copie du script de résync dans le conteneur..."
docker cp "$SCRIPT" "$CONTAINER:/tmp/resync_odoo_vault_laplatine2026.py"

echo "Exécution : reset vaulted → todo + envoi factures + envoi paiements vers DVIG/Vault..."
docker exec -i "$CONTAINER" odoo shell -d "$DB" --no-http <<'PY'
exec(open('/tmp/resync_odoo_vault_laplatine2026.py').read())
PY

echo "Résync terminée. Attendre 2–5 min puis vérifier Linky (preuves scellées)."

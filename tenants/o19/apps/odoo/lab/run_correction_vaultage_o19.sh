#!/usr/bin/env bash
# Plan de correction Odoo → DVIG → Vault (o19) : backfill paiements + exécution crons + optionnel vérif.
# Prérequis : DVIG_TOKEN_O19 (ou ODOO_DVIG_TOKEN) défini dans l’env du conteneur Odoo ; Vault et DVIG joignables.
# Voir ZeDocs/web39/PLAN_CORRECTION_ODOO_DVIG_VAULT_O19.md
#
# Usage:
#   ./run_correction_vaultage_o19.sh           # backfill + crons uniquement
#   ./run_correction_vaultage_o19.sh --verify  # idem + attente 90s + scripts/verifier_vaultage_o19.sh

set -euo pipefail
ROOT="${DOREVIA_ROOT:-/opt/dorevia-plateform}"
LAB_DIR="${ROOT}/tenants/o19/apps/odoo/lab"
DB_NAME="odoo_lab_o19"
CONTAINER="odoo_lab_o19"
VERIFY=""
[[ "${1:-}" == "--verify" ]] && VERIFY=1

echo "=== Correction vaultage o19 : backfill + crons Vault paiements ==="
echo "Conteneur: ${CONTAINER}  DB: ${DB_NAME}"
echo ""

docker exec -i "$CONTAINER" odoo shell -d "$DB_NAME" --no-http < "${LAB_DIR}/run_correction_vaultage_o19.py"
echo ""

if [[ -n "$VERIFY" ]]; then
  echo "Attente 90 s (DVIG → Vault) avant vérification..."
  sleep 90
  if [[ -x "${ROOT}/scripts/verifier_vaultage_o19.sh" ]]; then
    "${ROOT}/scripts/verifier_vaultage_o19.sh"
  else
    echo "Script de vérification non trouvé: ${ROOT}/scripts/verifier_vaultage_o19.sh"
    echo "Appel manuel: VAULT_URL=... ./scripts/verifier_vaultage_o19.sh"
  fi
else
  echo "Pour vérifier le vaultage dans 1–2 min : ./scripts/verifier_vaultage_o19.sh (ou relancer avec --verify)"
fi

#!/bin/bash
# phase4_apply_prod.sh - Phase 4 : Apply Prod (exécution non interactive)
# Usage: phase4_apply_prod.sh <tenant> [--auto-gateway]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TENANTS_DIR="$ROOT_DIR/tenants"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error() {
  echo -e "${RED}ERROR: ${NC}$1" >&2
}

warn() {
  echo -e "${YELLOW}WARN: ${NC}$1"
}

info() {
  echo -e "${GREEN}INFO: ${NC}$1"
}

# Vérifier arguments
if [[ $# -lt 1 ]]; then
  error "Usage: $0 <tenant> [--auto-gateway]"
  exit 1
fi

TENANT="$1"
shift || true

AUTO_GATEWAY=false

# Parser arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --auto-gateway)
      AUTO_GATEWAY=true
      shift
      ;;
    *)
      error "Option inconnue: $1"
      exit 1
      ;;
  esac
done

TENANT_DIR="$TENANTS_DIR/$TENANT"
MANIFEST_FILE="$TENANT_DIR/state/manifest.json"

# Vérifier manifest
if [[ ! -f "$MANIFEST_FILE" ]]; then
  error "Manifest introuvable: $MANIFEST_FILE"
  exit 1
fi

# Vérifier fichiers rendus
RENDERED_DIR="$TENANT_DIR/rendered/prod"
if [[ ! -d "$RENDERED_DIR" ]]; then
  error "Répertoire rendered/prod introuvable: $RENDERED_DIR"
  error "Générer avec: dorevia.sh render $TENANT --env prod"
  exit 1
fi

# Utiliser la commande apply existante
APPLY_SCRIPT="$ROOT_DIR/bin/dorevia.sh"

if [[ ! -f "$APPLY_SCRIPT" ]]; then
  error "Script dorevia.sh introuvable: $APPLY_SCRIPT"
  exit 1
fi

info "🚀 Phase 4 : Apply Prod (exécution non interactive)"
info "============================================================"
info "Tenant: $TENANT"
info "Environnement: prod"
if [[ "$AUTO_GATEWAY" == true ]]; then
  info "Agrégation gateway: automatique"
fi
echo ""

# Appeler apply
APPLY_ARGS="apply $TENANT --env prod"
if [[ "$AUTO_GATEWAY" == true ]]; then
  APPLY_ARGS="$APPLY_ARGS --auto-gateway"
fi

if bash "$APPLY_SCRIPT" $APPLY_ARGS; then
  info ""
  info "✅ Phase 4 : Apply Prod terminé"
  exit 0
else
  error "Phase 4 : Apply Prod échoué"
  exit 1
fi


#!/bin/bash
# render_caddyfile.sh - Génération Caddyfile depuis manifest Phase 1
# Usage: render_caddyfile.sh <tenant> <env>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TENANTS_DIR="$ROOT_DIR/tenants"
TEMPLATE_FILE="$SCRIPT_DIR/templates/caddyfile.template"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error() {
  echo -e "${RED}ERROR: ${NC}$1" >&2
  exit 1
}

info() {
  echo -e "${GREEN}INFO: ${NC}$1"
}

# Vérifier arguments
if [[ $# -lt 2 ]]; then
  error "Usage: $0 <tenant> <env>"
fi

TENANT="$1"
ENV="$2"

# Vérifier tenant
TENANT_DIR="$TENANTS_DIR/$TENANT"
if [[ ! -d "$TENANT_DIR" ]]; then
  error "Tenant introuvable: $TENANT"
fi

# Vérifier manifest
MANIFEST_FILE="$TENANT_DIR/state/manifest.json"
if [[ ! -f "$MANIFEST_FILE" ]]; then
  error "Manifest introuvable: $MANIFEST_FILE"
fi

# Vérifier template
if [[ ! -f "$TEMPLATE_FILE" ]]; then
  error "Template introuvable: $TEMPLATE_FILE"
fi

# Vérifier jq
if ! command -v jq &> /dev/null; then
  error "jq n'est pas installé. Veuillez l'installer."
fi

info "Génération Caddyfile pour tenant: $TENANT, env: $ENV"

# Lire manifest
MANIFEST=$(cat "$MANIFEST_FILE")

# Extraire données
TENANT_ID=$(echo "$MANIFEST" | jq -r '.tenant_id')
UNIVERSES=$(echo "$MANIFEST" | jq -r '.universes[]')
ENVIRONMENTS=$(echo "$MANIFEST" | jq -r '.environments[]')

# Vérifier que l'env est dans la liste
if ! echo "$ENVIRONMENTS" | grep -q "^${ENV}$"; then
  error "Environnement '$ENV' non activé pour tenant '$TENANT'"
fi

# Créer répertoire de sortie
OUTPUT_DIR="$TENANT_DIR/rendered/$ENV/caddy"
mkdir -p "$OUTPUT_DIR"
OUTPUT_FILE="$OUTPUT_DIR/Caddyfile"

# Générer Caddyfile
# Note: Pour Phase 1, on génère un Caddyfile par tenant/env
# L'agrégation globale sera faite dans US-2.4

# Préparer le contenu
{
  echo "{"
  echo "  email admin@doreviateam.com"
  echo "}"
  echo ""
  
  # Générer routes pour chaque univers
  for universe in $UNIVERSES; do
    echo "# $universe - Environnements (tenant $TENANT_ID)"
    echo "${universe}.${ENV}.${TENANT_ID}.doreviateam.com {"
    echo "  reverse_proxy ${universe}_${ENV}_${TENANT_ID}:8069"
    echo "}"
    echo ""
  done
  
  # Générer routes pour services cœur (DVIG/Vault)
  echo "# Services partagés (tenant $TENANT_ID)"
  echo "dvig.${ENV}.${TENANT_ID}.doreviateam.com {"
  echo "  reverse_proxy dvig-${TENANT_ID}:8080"
  echo "}"
  echo ""
  echo "vault.${ENV}.${TENANT_ID}.doreviateam.com {"
  echo "  reverse_proxy vault-${TENANT_ID}:8080"
  echo "}"
} > "$OUTPUT_FILE"

info "✅ Caddyfile généré: $OUTPUT_FILE"


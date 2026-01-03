#!/bin/bash
# phase3_config.sh - Phase 3 : Génération Configuration depuis intention
# Usage: phase3_config.sh <tenant> [--intent <intent-file>]

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
  error "Usage: $0 <tenant> [--intent <intent-file>]"
  exit 1
fi

TENANT="$1"
shift || true

INTENT_FILE=""

# Parser arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --intent)
      INTENT_FILE="${2:-}"
      shift 2 || true
      ;;
    *)
      error "Option inconnue: $1"
      exit 1
      ;;
  esac
done

TENANT_DIR="$TENANTS_DIR/$TENANT"
MANIFEST_FILE="$TENANT_DIR/state/manifest.json"
INTENTS_DIR="$TENANT_DIR/state/intents"

# Si intent-file non fourni, prendre le plus récent
if [[ -z "$INTENT_FILE" ]]; then
  if [[ -d "$INTENTS_DIR" ]]; then
    INTENT_FILE=$(ls -1t "$INTENTS_DIR"/intent-*.json 2>/dev/null | head -1)
  fi
fi

if [[ -z "$INTENT_FILE" || ! -f "$INTENT_FILE" ]]; then
  error "Fichier intention introuvable: $INTENT_FILE"
  error "Créer une intention avec: dorevia.sh prompt $TENANT --env prod"
  exit 1
fi

info "📄 Fichier intention: $INTENT_FILE"

# Vérifier jq
if ! command -v jq &> /dev/null; then
  error "jq n'est pas installé. Veuillez l'installer."
  exit 1
fi

# Lire intention
INTENT=$(cat "$INTENT_FILE")

# Extraire informations
ENV=$(echo "$INTENT" | jq -r '.environment // "prod"' 2>/dev/null || echo "prod")
UNIVERSES=$(echo "$INTENT" | jq -r '.intention.universes[]' 2>/dev/null || echo "odoo")
CANONICAL=$(echo "$INTENT" | jq -r '.intention.domains.canonical // "doreviateam.com"' 2>/dev/null || echo "doreviateam.com")

info "📋 Configuration depuis intention:"
info "  - Environnement: $ENV"
info "  - Univers: $(echo $UNIVERSES | tr '\n' ' ')"
info "  - Domaine canonique: $CANONICAL"
echo ""

# 1. Mettre à jour manifest.json si nécessaire
info "📝 Mise à jour manifest.json..."

if [[ ! -f "$MANIFEST_FILE" ]]; then
  error "Manifest introuvable: $MANIFEST_FILE"
  exit 1
fi

# Lire manifest existant
MANIFEST=$(cat "$MANIFEST_FILE")

# Mettre à jour prod.target si présent dans intention
PROD_MODE=$(echo "$INTENT" | jq -r '.intention.mode // "saas"' 2>/dev/null || echo "saas")
if [[ "$PROD_MODE" == "client" || "$PROD_MODE" == "hybrid" ]]; then
  # Extraire serveur depuis intention si présent
  SERVER_IP=$(echo "$INTENT" | jq -r '.intention.server.public_ip // ""' 2>/dev/null || echo "")
  SSH_USER=$(echo "$INTENT" | jq -r '.intention.server.ssh_user // "ubuntu"' 2>/dev/null || echo "ubuntu")
  
  # Mettre à jour manifest
  MANIFEST=$(echo "$MANIFEST" | jq --arg mode "$PROD_MODE" --arg ip "$SERVER_IP" --arg user "$SSH_USER" \
    '.prod.target = $mode | .prod.public_ip = $ip | .prod.ssh_user = $user' 2>/dev/null || echo "$MANIFEST")
fi

# S'assurer que prod est dans environments
ENVIRONMENTS=$(echo "$MANIFEST" | jq -r '.environments[]' 2>/dev/null || echo "")
if ! echo "$ENVIRONMENTS" | grep -q "^prod$"; then
  MANIFEST=$(echo "$MANIFEST" | jq '.environments += ["prod"]' 2>/dev/null || echo "$MANIFEST")
fi

# Sauvegarder manifest mis à jour
echo "$MANIFEST" | jq '.' > "$MANIFEST_FILE.tmp" 2>/dev/null
if [[ $? -eq 0 ]]; then
  mv "$MANIFEST_FILE.tmp" "$MANIFEST_FILE"
  info "✅ Manifest mis à jour"
else
  warn "⚠️  Impossible de mettre à jour manifest (continuer quand même)"
  rm -f "$MANIFEST_FILE.tmp"
fi

# 2. Générer fichiers rendus
info ""
info "🔧 Génération fichiers rendus..."

# Utiliser la commande render existante
RENDER_SCRIPT="$ROOT_DIR/bin/dorevia.sh"

if [[ ! -f "$RENDER_SCRIPT" ]]; then
  error "Script dorevia.sh introuvable: $RENDER_SCRIPT"
  exit 1
fi

# Appeler render pour prod
if bash "$RENDER_SCRIPT" render "$TENANT" --env "$ENV"; then
  info "✅ Fichiers rendus générés"
else
  error "Échec génération fichiers rendus"
  exit 1
fi

# 3. Afficher fichiers générés
RENDERED_DIR="$TENANT_DIR/rendered/$ENV"
if [[ -d "$RENDERED_DIR" ]]; then
  info ""
  info "📄 Fichiers générés:"
  find "$RENDERED_DIR" -type f | while read -r file; do
    info "  - $file"
  done
fi

# 4. Note sur versionnement Git
info ""
warn "⚠️  IMPORTANT: Versionner la configuration avant exécution"
info "   Commande suggérée: git add $MANIFEST_FILE $RENDERED_DIR && git commit -m 'Production config: $TENANT $ENV'"

info ""
info "✅ Phase 3 : Génération Configuration terminée"
exit 0


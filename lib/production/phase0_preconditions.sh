#!/bin/bash
# phase0_preconditions.sh - Phase 0 : Préconditions pour mise en production
# Usage: phase0_preconditions.sh <tenant>

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
  error "Usage: $0 <tenant>"
  exit 1
fi

TENANT="$1"
TENANT_DIR="$TENANTS_DIR/$TENANT"

# Compteurs
CHECKS_OK=0
CHECKS_KO=0
CHECKS_WARN=0

# Fonction de vérification
check() {
  local name="$1"
  local result="$2"
  local message="${3:-}"
  
  if [[ "$result" == "0" ]]; then
    info "✅ $name"
    ((CHECKS_OK++))
  elif [[ "$result" == "1" ]]; then
    error "❌ $name${message:+: $message}"
    ((CHECKS_KO++))
  else
    warn "⚠️  $name${message:+: $message}"
    ((CHECKS_WARN++))
  fi
}

echo "🔍 Phase 0 : Préconditions pour mise en production"
echo "============================================================"
echo "Tenant: $TENANT"
echo ""

# 1. Vérifier que le tenant existe
if [[ ! -d "$TENANT_DIR" ]]; then
  check "Tenant existe" 1 "Tenant '$TENANT' introuvable"
  exit 1
fi
check "Tenant existe" 0

# 2. Vérifier manifest
MANIFEST_FILE="$TENANT_DIR/state/manifest.json"
if [[ ! -f "$MANIFEST_FILE" ]]; then
  check "Manifest présent" 1 "Manifest introuvable: $MANIFEST_FILE"
  exit 1
fi
check "Manifest présent" 0

# 3. Vérifier que l'environnement stinger est opérationnel
STINGER_DIR="$TENANT_DIR/rendered/stinger"
if [[ ! -d "$STINGER_DIR" ]]; then
  check "Environnement stinger rendu" 1 "Répertoire stinger introuvable: $STINGER_DIR"
  exit 1
fi
check "Environnement stinger rendu" 0

# 4. Vérifier que stinger est déployé (containers en cours d'exécution)
# Vérifier platform
PLATFORM_CONTAINER="dvig-${TENANT}"
if ! docker ps --format "{{.Names}}" | grep -q "^${PLATFORM_CONTAINER}$"; then
  check "Platform stinger déployée" 1 "Container $PLATFORM_CONTAINER non trouvé"
  exit 1
fi
check "Platform stinger déployée" 0

# Vérifier app (au moins un univers)
MANIFEST=$(cat "$MANIFEST_FILE")
if command -v jq &> /dev/null; then
  UNIVERSES=$(echo "$MANIFEST" | jq -r '.universes[]' 2>/dev/null || echo "odoo")
  STINGER_APP_FOUND=0
  for universe in $UNIVERSES; do
    APP_CONTAINER="${universe}_stinger_${TENANT}"
    if docker ps --format "{{.Names}}" | grep -q "^${APP_CONTAINER}$"; then
      STINGER_APP_FOUND=1
      break
    fi
  done
  if [[ $STINGER_APP_FOUND -eq 0 ]]; then
    check "App stinger déployée" 1 "Aucune app stinger trouvée"
    exit 1
  fi
  check "App stinger déployée" 0
else
  warn "jq non disponible, vérification app stinger ignorée"
  ((CHECKS_WARN++))
fi

# 5. Vérifier mode de production (dans manifest ou intention)
# Optionnel pour Phase 0 (sera défini lors du prompt)
if command -v jq &> /dev/null; then
  PROD_MODE=$(echo "$MANIFEST" | jq -r '.prod.target // "unknown"' 2>/dev/null || echo "unknown")
  if [[ "$PROD_MODE" == "unknown" ]]; then
    check "Mode de production défini" 2 "Mode de production non défini (sera défini lors du prompt)"
  else
    check "Mode de production défini" 0 "Mode: $PROD_MODE"
  fi
else
  warn "jq non disponible, vérification mode production ignorée"
  ((CHECKS_WARN++))
fi

# Résumé
echo ""
echo "============================================================"
echo "📊 Résumé Phase 0 :"
echo "  ✅ OK: $CHECKS_OK"
echo "  ⚠️  WARN: $CHECKS_WARN"
echo "  ❌ KO: $CHECKS_KO"
echo ""

if [[ $CHECKS_KO -gt 0 ]]; then
  error "Phase 0 échouée : $CHECKS_KO erreur(s)"
  exit 1
fi

if [[ $CHECKS_WARN -gt 0 ]]; then
  warn "Phase 0 complétée avec $CHECKS_WARN avertissement(s)"
  exit 0
fi

info "✅ Phase 0 : Préconditions validées"
exit 0


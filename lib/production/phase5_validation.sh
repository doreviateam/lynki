#!/bin/bash
# phase5_validation.sh - Phase 5 : Validation Post-Prod
# Usage: phase5_validation.sh <tenant>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TENANTS_DIR="$ROOT_DIR/tenants"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
MANIFEST_FILE="$TENANT_DIR/state/manifest.json"
REPORT_FILE="$TENANT_DIR/state/prod-validation-$(date -u +"%Y%m%dT%H%M%SZ").md"

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
    echo "✅ $name${message:+: $message}" >> "$REPORT_FILE"
  elif [[ "$result" == "1" ]]; then
    error "❌ $name${message:+: $message}"
    ((CHECKS_KO++))
    echo "❌ $name${message:+: $message}" >> "$REPORT_FILE"
  else
    warn "⚠️  $name${message:+: $message}"
    ((CHECKS_WARN++))
    echo "⚠️  $name${message:+: $message}" >> "$REPORT_FILE"
  fi
}

echo "🔍 Phase 5 : Validation Post-Prod"
echo "============================================================"
echo "Tenant: $TENANT"
echo ""

# Initialiser rapport
{
  echo "# Validation Post-Prod"
  echo ""
  echo "**Tenant**: $TENANT"
  echo "**Date**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "**Opérateur**: ${USER:-unknown}"
  echo ""
  echo "## Vérifications"
  echo ""
} > "$REPORT_FILE"

# Lire manifest
if [[ ! -f "$MANIFEST_FILE" ]]; then
  error "Manifest introuvable: $MANIFEST_FILE"
  exit 1
fi

MANIFEST=$(cat "$MANIFEST_FILE")

# Extraire informations
if command -v jq &> /dev/null; then
  UNIVERSES=$(echo "$MANIFEST" | jq -r '.universes[]' 2>/dev/null || echo "odoo")
  BASE_DOMAIN=$(echo "$MANIFEST" | jq -r '.base_domain // "doreviateam.com"' 2>/dev/null || echo "doreviateam.com")
  TENANT_ID=$(echo "$MANIFEST" | jq -r '.tenant_id // "'"$TENANT"'"' 2>/dev/null || echo "$TENANT")
else
  UNIVERSES="odoo"
  BASE_DOMAIN="doreviateam.com"
  TENANT_ID="$TENANT"
fi

# 1. Vérifier containers platform
info "Vérifications containers platform..."

PLATFORM_CONTAINER="dvig-${TENANT_ID}"
if docker ps --format "{{.Names}}" | grep -q "^${PLATFORM_CONTAINER}$"; then
  check "Container DVIG actif" 0
else
  check "Container DVIG actif" 1
fi

VAULT_CONTAINER="vault-${TENANT_ID}"
if docker ps --format "{{.Names}}" | grep -q "^${VAULT_CONTAINER}$"; then
  check "Container Vault actif" 0
else
  check "Container Vault actif" 1
fi

# 2. Vérifier containers apps
info ""
info "Vérifications containers apps..."

for universe in $UNIVERSES; do
  APP_CONTAINER="${universe}_prod_${TENANT_ID}"
  if docker ps --format "{{.Names}}" | grep -q "^${APP_CONTAINER}$"; then
    check "Container $universe actif" 0
  else
    check "Container $universe actif" 1
  fi
done

# 3. Vérifier URLs accessibles (optionnel, avertissement seulement)
info ""
info "Vérifications URLs (optionnel)..."

if command -v curl &> /dev/null; then
  for universe in $UNIVERSES; do
    FQDN="${universe}.prod.${TENANT_ID}.${BASE_DOMAIN}"
    if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://${FQDN}" 2>/dev/null | grep -q "200\|301\|302"; then
      check "URL accessible: $FQDN" 0
    else
      check "URL accessible: $FQDN" 2 "Non accessible (peut être normal si DNS non configuré)"
    fi
  done
  
  # Services cœur (1 par tenant, sans environnement)
  DVIG_FQDN="dvig.${TENANT_ID}.${BASE_DOMAIN}"
  if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://${DVIG_FQDN}/health" 2>/dev/null | grep -q "200\|401"; then
    check "DVIG health accessible: $DVIG_FQDN" 0
  else
    check "DVIG health accessible: $DVIG_FQDN" 2 "Non accessible (peut être normal si DNS non configuré)"
  fi
  
  VAULT_FQDN="vault.${TENANT_ID}.${BASE_DOMAIN}"
  if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://${VAULT_FQDN}/health" 2>/dev/null | grep -q "200\|401"; then
    check "Vault health accessible: $VAULT_FQDN" 0
  else
    check "Vault health accessible: $VAULT_FQDN" 2 "Non accessible (peut être normal si DNS non configuré)"
  fi
else
  warn "curl non disponible, vérification URLs ignorée"
  ((CHECKS_WARN++))
fi

# 4. Vérifier healthchecks Docker
info ""
info "Vérifications healthchecks..."

if docker inspect "$PLATFORM_CONTAINER" --format '{{.State.Health.Status}}' 2>/dev/null | grep -q "healthy"; then
  check "DVIG healthcheck" 0
elif docker inspect "$PLATFORM_CONTAINER" --format '{{.State.Status}}' 2>/dev/null | grep -q "running"; then
  check "DVIG healthcheck" 2 "Container running mais healthcheck non configuré"
else
  check "DVIG healthcheck" 1
fi

# Finaliser rapport
{
  echo ""
  echo "## Résumé"
  echo ""
  echo "| Statut | Nombre |"
  echo "|--------|--------|"
  echo "| ✅ OK | $CHECKS_OK |"
  echo "| ⚠️  WARN | $CHECKS_WARN |"
  echo "| ❌ KO | $CHECKS_KO |"
  echo ""
  if [[ $CHECKS_KO -eq 0 ]]; then
    echo "**✅ Validation réussie**"
  else
    echo "**❌ Validation échouée ($CHECKS_KO erreur(s))**"
  fi
  echo ""
  echo "---"
  echo "*Généré automatiquement par phase5_validation.sh*"
} >> "$REPORT_FILE"

# Résumé
echo ""
echo "============================================================"
echo "📊 Résumé Phase 5 :"
echo "  ✅ OK: $CHECKS_OK"
echo "  ⚠️  WARN: $CHECKS_WARN"
echo "  ❌ KO: $CHECKS_KO"
echo ""
echo "📄 Rapport: $REPORT_FILE"
echo ""

if [[ $CHECKS_KO -gt 0 ]]; then
  error "Phase 5 échouée : $CHECKS_KO erreur(s)"
  exit 1
fi

if [[ $CHECKS_WARN -gt 0 ]]; then
  warn "Phase 5 complétée avec $CHECKS_WARN avertissement(s)"
  exit 0
fi

info "✅ Phase 5 : Validation Post-Prod réussie"
exit 0


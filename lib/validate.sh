#!/bin/bash
# validate.sh - Validateur de manifest Phase 1
# Valide un manifest.json contre le schéma JSON Schema

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SCHEMA_FILE="$ROOT_DIR/schemas/manifest.schema.json"

# Couleurs pour sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

error() {
  echo -e "${RED}ERROR:${NC} $1" >&2
  exit 1
}

info() {
  echo -e "${GREEN}INFO:${NC} $1"
}

warn() {
  echo -e "${YELLOW}WARN:${NC} $1"
}

# Vérifier que le schéma existe
if [[ ! -f "$SCHEMA_FILE" ]]; then
  error "Schéma JSON Schema introuvable: $SCHEMA_FILE"
fi

# Vérifier que jq est installé
if ! command -v jq &> /dev/null; then
  error "jq est requis pour la validation. Installez-le: apt-get install jq"
fi

# Fonction de validation avec jq
validate_manifest() {
  local manifest_file="$1"
  
  if [[ ! -f "$manifest_file" ]]; then
    error "Manifest introuvable: $manifest_file"
  fi
  
  info "Validation du manifest: $manifest_file"
  info "Schéma: $SCHEMA_FILE"
  
  # Validation basique avec jq (structure JSON valide)
  if ! jq empty "$manifest_file" 2>/dev/null; then
    error "Le manifest n'est pas un JSON valide"
  fi
  
  # Vérifications de base (champs obligatoires)
  local tenant_id=$(jq -r '.tenant_id // empty' "$manifest_file")
  if [[ -z "$tenant_id" ]]; then
    error "Champ obligatoire manquant: tenant_id"
  fi
  
  # Validation slug tenant
  if [[ ! "$tenant_id" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]]; then
    error "tenant_id invalide (doit être un slug DNS): $tenant_id"
  fi
  
  # Vérification universes
  local universes=$(jq -r '.universes // []' "$manifest_file")
  if [[ "$universes" == "[]" ]]; then
    error "Champ obligatoire manquant ou vide: universes"
  fi
  
  # Vérification environments
  local environments=$(jq -r '.environments // []' "$manifest_file")
  if [[ "$environments" == "[]" ]]; then
    error "Champ obligatoire manquant ou vide: environments"
  fi
  
  # Vérification domain_mode
  local domain_mode=$(jq -r '.domain_mode // empty' "$manifest_file")
  if [[ -z "$domain_mode" ]]; then
    error "Champ obligatoire manquant: domain_mode"
  fi
  if [[ ! "$domain_mode" =~ ^(saas|client|hybrid)$ ]]; then
    error "domain_mode invalide (doit être: saas, client ou hybrid): $domain_mode"
  fi
  
  # Vérification domains (Phase 3)
  if [[ "$domain_mode" != "saas" ]]; then
    local domains=$(jq -r '.domains // {}' "$manifest_file")
    if [[ "$domains" == "{}" ]]; then
      warn "Mode $domain_mode activé mais structure 'domains' manquante (Phase 3)"
    fi
  fi
  
  # Vérification units
  local units=$(jq -r '.units // {}' "$manifest_file")
  if [[ "$units" == "{}" ]]; then
    error "Champ obligatoire manquant ou vide: units"
  fi
  
  # Vérification cohérence: univers activé => unit requise
  local has_odoo=$(jq -r '.universes[] | select(. == "odoo")' "$manifest_file" | head -1)
  if [[ -n "$has_odoo" ]]; then
    local has_odoo_unit=$(jq -r '.units.odoo // []' "$manifest_file")
    if [[ "$has_odoo_unit" == "[]" ]]; then
      warn "Univers 'odoo' activé mais aucune unit odoo déclarée"
    fi
  fi
  
  info "Validation basique réussie"
  warn "Note: Validation complète JSON Schema nécessite un outil externe (ajv, jsonschema)"
  warn "Pour validation complète: npm install -g ajv-cli && ajv validate -s $SCHEMA_FILE -d $manifest_file"
  
  return 0
}

# Main
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <manifest.json>"
  echo "Exemple: $0 tenants/core/state/manifest.json"
  exit 1
fi

validate_manifest "$1"
info "✅ Manifest valide"


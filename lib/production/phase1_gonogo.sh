#!/bin/bash
# phase1_gonogo.sh - Phase 1 : Go/No-Go pour mise en production
# Usage: phase1_gonogo.sh <tenant> [--auto-yes]

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
  error "Usage: $0 <tenant> [--auto-yes]"
  exit 1
fi

TENANT="$1"
AUTO_YES=false

if [[ "${2:-}" == "--auto-yes" ]]; then
  AUTO_YES=true
fi

TENANT_DIR="$TENANTS_DIR/$TENANT"
MANIFEST_FILE="$TENANT_DIR/state/manifest.json"
GONOGO_FILE="$TENANT_DIR/state/gonogo-$(date -u +"%Y%m%dT%H%M%SZ").md"

# Créer répertoire state si nécessaire
mkdir -p "$TENANT_DIR/state"

echo "📋 Phase 1 : Go/No-Go pour mise en production"
echo "============================================================"
echo "Tenant: $TENANT"
echo ""

# Lire manifest
if [[ ! -f "$MANIFEST_FILE" ]]; then
  error "Manifest introuvable: $MANIFEST_FILE"
  exit 1
fi

MANIFEST=$(cat "$MANIFEST_FILE")

# Extraire informations
if command -v jq &> /dev/null; then
  PROD_MODE=$(echo "$MANIFEST" | jq -r '.prod.target // "unknown"' 2>/dev/null || echo "unknown")
  UNIVERSES=$(echo "$MANIFEST" | jq -r '.universes[]' 2>/dev/null || echo "odoo")
else
  PROD_MODE="unknown"
  UNIVERSES="odoo"
fi

# Afficher informations
echo "📊 Informations de production:"
echo "  - Mode: $PROD_MODE"
echo "  - Univers: $(echo $UNIVERSES | tr '\n' ' ')"
echo ""

# Questions de validation
echo "🔍 Questions de validation:"
echo ""

VALIDATION_OK=true

# 1. Validation fonctionnelle
echo -e "${BLUE}1. Validation fonctionnelle${NC}"
echo "   Stinger est-il opérationnel et validé fonctionnellement ?"
if [[ "$AUTO_YES" == true ]]; then
  FUNCTIONAL_OK=true
  echo "   → Auto-yes: OUI"
else
  read -p "   Réponse (o/n): " answer
  if [[ "$answer" =~ ^[oO] ]]; then
    FUNCTIONAL_OK=true
  else
    FUNCTIONAL_OK=false
    VALIDATION_OK=false
  fi
fi
echo ""

# 2. Validation technique
echo -e "${BLUE}2. Validation technique${NC}"
echo "   La configuration est-elle conforme à la SPEC v2.0 ?"
if [[ "$AUTO_YES" == true ]]; then
  TECHNICAL_OK=true
  echo "   → Auto-yes: OUI"
else
  read -p "   Réponse (o/n): " answer
  if [[ "$answer" =~ ^[oO] ]]; then
    TECHNICAL_OK=true
  else
    TECHNICAL_OK=false
    VALIDATION_OK=false
  fi
fi
echo ""

# 3. Validation contractuelle
echo -e "${BLUE}3. Validation contractuelle${NC}"
echo "   Mode prod, domaines et alias sont-ils validés contractuellement ?"
if [[ "$AUTO_YES" == true ]]; then
  CONTRACTUAL_OK=true
  echo "   → Auto-yes: OUI"
else
  read -p "   Réponse (o/n): " answer
  if [[ "$answer" =~ ^[oO] ]]; then
    CONTRACTUAL_OK=true
  else
    CONTRACTUAL_OK=false
    VALIDATION_OK=false
  fi
fi
echo ""

# Générer compte-rendu
OPERATOR="${USER:-unknown}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

{
  echo "# Go/No-Go - Mise en Production"
  echo ""
  echo "**Tenant**: $TENANT"
  echo "**Date**: $TIMESTAMP"
  echo "**Opérateur**: $OPERATOR"
  echo ""
  echo "## Validations"
  echo ""
  echo "| Validation | Statut |"
  echo "|------------|--------|"
  echo "| Fonctionnelle (Stinger OK) | $([ "$FUNCTIONAL_OK" == true ] && echo "✅ OUI" || echo "❌ NON") |"
  echo "| Technique (Conforme SPEC) | $([ "$TECHNICAL_OK" == true ] && echo "✅ OUI" || echo "❌ NON") |"
  echo "| Contractuelle (Mode/Domaines) | $([ "$CONTRACTUAL_OK" == true ] && echo "✅ OUI" || echo "❌ NON") |"
  echo ""
  echo "## Décision"
  echo ""
  if [[ "$VALIDATION_OK" == true ]]; then
    echo "**✅ GO** - Mise en production autorisée"
    echo ""
    echo "**Base de décision**:"
    echo "- Validation fonctionnelle: OK"
    echo "- Validation technique: OK"
    echo "- Validation contractuelle: OK"
  else
    echo "**❌ NO-GO** - Mise en production refusée"
    echo ""
    echo "**Raisons**:"
    [[ "$FUNCTIONAL_OK" != true ]] && echo "- Validation fonctionnelle: ÉCHEC"
    [[ "$TECHNICAL_OK" != true ]] && echo "- Validation technique: ÉCHEC"
    [[ "$CONTRACTUAL_OK" != true ]] && echo "- Validation contractuelle: ÉCHEC"
  fi
  echo ""
  echo "---"
  echo "*Généré automatiquement par phase1_gonogo.sh*"
} > "$GONOGO_FILE"

# Afficher résultat
echo "============================================================"
if [[ "$VALIDATION_OK" == true ]]; then
  info "✅ GO - Mise en production autorisée"
  echo ""
  echo "📄 Compte-rendu: $GONOGO_FILE"
  exit 0
else
  error "❌ NO-GO - Mise en production refusée"
  echo ""
  echo "📄 Compte-rendu: $GONOGO_FILE"
  exit 1
fi


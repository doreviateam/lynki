#!/bin/bash
# phase2_preflight_prod.sh - Phase 2 : Préflight Production
# Usage: phase2_preflight_prod.sh <tenant> [--server <server_ip>] [--ssh-user <user>]

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
  error "Usage: $0 <tenant> [--server <server_ip>] [--ssh-user <user>]"
  exit 1
fi

TENANT="$1"
shift || true

SERVER_IP=""
SSH_USER="ubuntu"

# Parser arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --server)
      SERVER_IP="${2:-}"
      shift 2 || true
      ;;
    --ssh-user)
      SSH_USER="${2:-}"
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

echo "🔍 Phase 2 : Préflight Production"
echo "============================================================"
echo "Tenant: $TENANT"
if [[ -n "$SERVER_IP" ]]; then
  echo "Serveur: $SERVER_IP"
fi
echo ""

# Lire manifest
if [[ ! -f "$MANIFEST_FILE" ]]; then
  error "Manifest introuvable: $MANIFEST_FILE"
  exit 1
fi

MANIFEST=$(cat "$MANIFEST_FILE")

# Extraire mode production
if command -v jq &> /dev/null; then
  PROD_MODE=$(echo "$MANIFEST" | jq -r '.prod.target // "doreviateam"' 2>/dev/null || echo "doreviateam")
  if [[ -z "$SERVER_IP" ]]; then
    SERVER_IP=$(echo "$MANIFEST" | jq -r '.prod.public_ip // ""' 2>/dev/null || echo "")
  fi
else
  PROD_MODE="doreviateam"
fi

# 1. Vérifications locales (toujours)
info "Vérifications locales..."

# Docker
if ! command -v docker &> /dev/null; then
  check "Docker installé" 1 "Docker non trouvé"
else
  check "Docker installé" 0
fi

# Docker Compose
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
  check "Docker Compose disponible" 1 "Docker Compose non disponible"
else
  check "Docker Compose disponible" 0
fi

# 2. Vérifications serveur cible (si serveur client)
if [[ "$PROD_MODE" == "client" || "$PROD_MODE" == "hybrid" ]]; then
  if [[ -z "$SERVER_IP" ]]; then
    check "IP serveur définie" 1 "IP serveur non définie (--server ou manifest.prod.public_ip)"
  else
    check "IP serveur définie" 0 "IP: $SERVER_IP"
    
    info ""
    info "Vérifications serveur cible ($SERVER_IP)..."
    
    # Test connexion SSH
    if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "${SSH_USER}@${SERVER_IP}" "echo 'OK'" &> /dev/null; then
      check "Accès SSH serveur" 0
      
      # Vérifier Docker sur serveur distant
      if ssh "${SSH_USER}@${SERVER_IP}" "command -v docker &> /dev/null" &> /dev/null; then
        check "Docker installé (serveur)" 0
      else
        check "Docker installé (serveur)" 1
      fi
      
      # Vérifier Docker Compose sur serveur distant
      if ssh "${SSH_USER}@${SERVER_IP}" "docker compose version &> /dev/null" &> /dev/null; then
        check "Docker Compose disponible (serveur)" 0
      else
        check "Docker Compose disponible (serveur)" 1
      fi
      
      # Vérifier ports ouverts (80, 443)
      if command -v nc &> /dev/null; then
        if nc -z -w 2 "$SERVER_IP" 80 &> /dev/null; then
          check "Port 80 accessible" 0
        else
          check "Port 80 accessible" 2 "Port 80 non accessible (peut être normal si firewall)"
        fi
        
        if nc -z -w 2 "$SERVER_IP" 443 &> /dev/null; then
          check "Port 443 accessible" 0
        else
          check "Port 443 accessible" 2 "Port 443 non accessible (peut être normal si firewall)"
        fi
      else
        warn "nc (netcat) non disponible, vérification ports ignorée"
        ((CHECKS_WARN++))
      fi
    else
      check "Accès SSH serveur" 1 "Impossible de se connecter à ${SSH_USER}@${SERVER_IP}"
    fi
  fi
else
  info "Mode SaaS Doreviateam - Vérifications serveur client ignorées"
fi

# 3. Vérifications DNS (optionnel, avertissement seulement)
info ""
info "Vérifications DNS (optionnel)..."

if command -v jq &> /dev/null; then
  UNIVERSES=$(echo "$MANIFEST" | jq -r '.universes[]' 2>/dev/null || echo "odoo")
  BASE_DOMAIN=$(echo "$MANIFEST" | jq -r '.base_domain // "doreviateam.com"' 2>/dev/null || echo "doreviateam.com")
  
  for universe in $UNIVERSES; do
    FQDN="${universe}.prod.${TENANT}.${BASE_DOMAIN}"
    if host "$FQDN" &> /dev/null; then
      check "DNS résolu: $FQDN" 0
    else
      check "DNS résolu: $FQDN" 2 "DNS non résolu (peut être normal si pas encore configuré)"
    fi
  done
else
  warn "jq non disponible, vérification DNS ignorée"
  ((CHECKS_WARN++))
fi

# 4. Vérifications registry (optionnel)
info ""
info "Vérifications registry..."

if docker pull alpine:latest &> /dev/null; then
  check "Accès Docker registry" 0
else
  check "Accès Docker registry" 2 "Impossible de pull depuis registry (peut être normal si offline)"
fi

# Résumé
echo ""
echo "============================================================"
echo "📊 Résumé Phase 2 :"
echo "  ✅ OK: $CHECKS_OK"
echo "  ⚠️  WARN: $CHECKS_WARN"
echo "  ❌ KO: $CHECKS_KO"
echo ""

if [[ $CHECKS_KO -gt 0 ]]; then
  error "Phase 2 échouée : $CHECKS_KO erreur(s) critique(s)"
  exit 1
fi

if [[ $CHECKS_WARN -gt 0 ]]; then
  warn "Phase 2 complétée avec $CHECKS_WARN avertissement(s)"
  exit 0
fi

info "✅ Phase 2 : Préflight Production validé"
exit 0


#!/bin/bash
# preflight.sh - Vérifications prérequis Phase 1
# Usage: preflight.sh <tenant> <env>

set -uo pipefail

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
if [[ $# -lt 2 ]]; then
  error "Usage: $0 <tenant> <env>"
  exit 1
fi

TENANT="$1"
ENV="$2"

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
    CHECKS_OK=$((CHECKS_OK + 1))
    return 0
  else
    error "❌ $name${message:+: $message}"
    CHECKS_KO=$((CHECKS_KO + 1))
    return 1
  fi
}

check_warn() {
  local name="$1"
  local result="$2"
  local message="${3:-}"
  
  if [[ "$result" == "0" ]]; then
    info "✅ $name"
    CHECKS_OK=$((CHECKS_OK + 1))
    return 0
  else
    warn "⚠️  $name${message:+: $message}"
    CHECKS_WARN=$((CHECKS_WARN + 1))
    return 1
  fi
}

echo "🔍 Préflight technique pour tenant: $TENANT, env: $ENV"
echo ""

# 1. Vérifier manifest
echo "📋 Vérification manifest..."
MANIFEST_FILE="$TENANTS_DIR/$TENANT/state/manifest.json"
if [[ ! -f "$MANIFEST_FILE" ]]; then
  check "Manifest présent" 1 "Manifest introuvable: $MANIFEST_FILE"
  exit 1
fi
check "Manifest présent" 0

# Vérifier jq
if ! command -v jq &> /dev/null; then
  check "jq installé" 1 "jq requis pour lire le manifest"
  exit 1
fi
check "jq installé" 0

# Vérifier que l'env est activé
MANIFEST=$(cat "$MANIFEST_FILE")
ENVS=$(echo "$MANIFEST" | jq -r '.environments[]' 2>/dev/null || echo "")
if [[ -z "$ENVS" ]]; then
  check "Environnement activé" 1 "Impossible de lire les environnements depuis manifest"
  exit 1
fi
if ! echo "$ENVS" | grep -q "^${ENV}$"; then
  check "Environnement activé" 1 "Environnement '$ENV' non activé pour tenant '$TENANT'"
  exit 1
fi
check "Environnement activé" 0
echo ""

# 2. Vérifier Docker
echo "🐳 Vérification Docker..."
if ! command -v docker &> /dev/null; then
  check "Docker installé" 1 "Docker non installé"
else
  check "Docker installé" 0
fi

if command -v docker &> /dev/null; then
  if docker info &> /dev/null; then
    check "Docker accessible" 0
    DOCKER_VERSION=$(docker --version 2>/dev/null || echo "unknown")
    info "  Version: $DOCKER_VERSION"
  else
    check "Docker accessible" 1 "Docker daemon non accessible"
  fi
fi
echo ""

# 3. Vérifier Docker Compose
echo "🐙 Vérification Docker Compose..."
if command -v docker-compose &> /dev/null; then
  check "Docker Compose installé (legacy)" 0
  COMPOSE_VERSION=$(docker-compose --version 2>/dev/null || echo "unknown")
  info "  Version: $COMPOSE_VERSION"
elif docker compose version &> /dev/null 2>&1; then
  check "Docker Compose installé (plugin)" 0
  COMPOSE_VERSION=$(docker compose version 2>/dev/null || echo "unknown")
  info "  Version: $COMPOSE_VERSION"
else
  check "Docker Compose installé" 1 "Docker Compose non installé"
fi
echo ""

# 4. Vérifier ports 80/443 (si reverse proxy local)
echo "🔌 Vérification ports..."
if command -v netstat &> /dev/null || command -v ss &> /dev/null; then
  # Vérifier port 80
  if command -v ss &> /dev/null; then
    PORT80_IN_USE=$(ss -tuln | grep -c ":80 " || echo "0")
  else
    PORT80_IN_USE=$(netstat -tuln 2>/dev/null | grep -c ":80 " || echo "0")
  fi
  
  if [[ "$PORT80_IN_USE" == "0" ]]; then
    check_warn "Port 80 disponible" 0
  else
    check_warn "Port 80 disponible" 1 "Port 80 déjà utilisé (peut être normal si gateway déjà démarrée)"
  fi
  
  # Vérifier port 443
  if command -v ss &> /dev/null; then
    PORT443_IN_USE=$(ss -tuln | grep -c ":443 " || echo "0")
  else
    PORT443_IN_USE=$(netstat -tuln 2>/dev/null | grep -c ":443 " || echo "0")
  fi
  
  if [[ "$PORT443_IN_USE" == "0" ]]; then
    check_warn "Port 443 disponible" 0
  else
    check_warn "Port 443 disponible" 1 "Port 443 déjà utilisé (peut être normal si gateway déjà démarrée)"
  fi
else
  warn "⚠️  netstat/ss non disponible, vérification ports ignorée"
  ((CHECKS_WARN++))
fi
echo ""

# 5. Vérifier réseau Docker
echo "🌐 Vérification réseau Docker..."
if command -v docker &> /dev/null && docker info &> /dev/null; then
  if docker network inspect dorevia-network &> /dev/null; then
    check "Réseau dorevia-network" 0
  else
    check_warn "Réseau dorevia-network" 1 "Réseau non créé (sera créé automatiquement si nécessaire)"
  fi
else
  check_warn "Réseau dorevia-network" 1 "Docker non accessible"
fi
echo ""

# 6. Vérifier fichiers rendered (optionnel)
echo "📁 Vérification fichiers générés..."
RENDERED_PLATFORM="$TENANTS_DIR/$TENANT/rendered/$ENV/platform/docker-compose.yml"
RENDERED_CADDY="$TENANTS_DIR/$TENANT/rendered/$ENV/caddy/Caddyfile"

if [[ -f "$RENDERED_PLATFORM" ]]; then
  check "Fichier rendered platform" 0
else
  check_warn "Fichier rendered platform" 1 "Fichier non généré (utiliser: dorevia.sh render $TENANT --env $ENV)"
fi

if [[ -f "$RENDERED_CADDY" ]]; then
  check "Fichier rendered Caddyfile" 0
else
  check_warn "Fichier rendered Caddyfile" 1 "Fichier non généré (utiliser: dorevia.sh render $TENANT --env $ENV)"
fi
echo ""

# 7. Vérifier résolution DNS (Phase 1 + Phase 3: domaines clients)
echo "🌍 Vérification DNS..."
if command -v dig &> /dev/null || command -v nslookup &> /dev/null; then
  # Extraire tenant_id depuis manifest
  TENANT_ID=$(echo "$MANIFEST" | jq -r '.tenant_id' 2>/dev/null || echo "$TENANT")
  
  # Phase 3: Vérifier domaines clients si configurés
  DOMAIN_MODE=$(echo "$MANIFEST" | jq -r '.domain_mode // "saas"')
  CHECK_DNS_PHASE3=false
  
  if [[ "$DOMAIN_MODE" == "client" ]] || [[ "$DOMAIN_MODE" == "hybrid" ]]; then
    if echo "$MANIFEST" | jq -e '.domains' >/dev/null 2>&1; then
      CHECK_DNS_PHASE3=true
      CANONICAL_DOMAIN=$(echo "$MANIFEST" | jq -r '.domains.canonical // "doreviateam.com"')
      FALLBACK_DOMAIN=$(echo "$MANIFEST" | jq -r '.domains.fallback // empty')
      
      # Si fallback est booléen true, utiliser doreviateam.com
      if [[ "$FALLBACK_DOMAIN" == "true" ]]; then
        FALLBACK_DOMAIN="doreviateam.com"
      fi
      
      # Extraire IP serveur attendue (si configurée)
      EXPECTED_IP=$(echo "$MANIFEST" | jq -r '.prod.public_ip // empty')
      
      info "Phase 3: Validation DNS domaines clients"
      info "  Mode: $DOMAIN_MODE"
      info "  Domaine canonique: $CANONICAL_DOMAIN"
      
      # Vérifier hostnames canoniques
      UNIVERSES=$(echo "$MANIFEST" | jq -r '.universes[]')
      for universe in $UNIVERSES; do
        HOSTNAME_CANONICAL="${universe}.${ENV}.${TENANT_ID}.${CANONICAL_DOMAIN}"
        if [[ -n "$EXPECTED_IP" ]]; then
          if "$SCRIPT_DIR/check_dns.sh" "$HOSTNAME_CANONICAL" "$EXPECTED_IP" &>/dev/null; then
            check "DNS $HOSTNAME_CANONICAL" 0
          else
            check "DNS $HOSTNAME_CANONICAL" 1 "Ne pointe pas vers $EXPECTED_IP"
          fi
        else
          if "$SCRIPT_DIR/check_dns.sh" "$HOSTNAME_CANONICAL" &>/dev/null; then
            check_warn "DNS $HOSTNAME_CANONICAL" 0
          else
            check_warn "DNS $HOSTNAME_CANONICAL" 1 "Non résolu (vérifier DNS avant déploiement)"
          fi
        fi
      done
      
      # Vérifier services cœur (DVIG/Vault)
      for service in dvig vault; do
        HOSTNAME_SERVICE="${service}.${TENANT_ID}.${CANONICAL_DOMAIN}"
        if [[ -n "$EXPECTED_IP" ]]; then
          if "$SCRIPT_DIR/check_dns.sh" "$HOSTNAME_SERVICE" "$EXPECTED_IP" &>/dev/null; then
            check "DNS $HOSTNAME_SERVICE" 0
          else
            check "DNS $HOSTNAME_SERVICE" 1 "Ne pointe pas vers $EXPECTED_IP"
          fi
        else
          if "$SCRIPT_DIR/check_dns.sh" "$HOSTNAME_SERVICE" &>/dev/null; then
            check_warn "DNS $HOSTNAME_SERVICE" 0
          else
            check_warn "DNS $HOSTNAME_SERVICE" 1 "Non résolu (vérifier DNS avant déploiement)"
          fi
        fi
      done
      
      # Vérifier fallback si présent
      if [[ -n "$FALLBACK_DOMAIN" ]] && [[ "$FALLBACK_DOMAIN" != "null" ]]; then
        info "  Fallback: $FALLBACK_DOMAIN"
        for universe in $UNIVERSES; do
          HOSTNAME_FALLBACK="${universe}.${ENV}.${TENANT_ID}.${FALLBACK_DOMAIN}"
          if "$SCRIPT_DIR/check_dns.sh" "$HOSTNAME_FALLBACK" &>/dev/null; then
            check_warn "DNS fallback $HOSTNAME_FALLBACK" 0
          else
            check_warn "DNS fallback $HOSTNAME_FALLBACK" 1 "Non résolu (optionnel)"
          fi
        done
      fi
    fi
  fi
  
  # Phase 1: Vérification DNS standard (si Phase 3 non activée)
  if [[ "$CHECK_DNS_PHASE3" == "false" ]]; then
    # Vérifier hostname DVIG (Phase 1)
    HOSTNAME_DVIG="dvig.${TENANT_ID}.doreviateam.com"
    if command -v dig &> /dev/null; then
      DNS_RESULT=$(dig +short "$HOSTNAME_DVIG" 2>/dev/null | head -1 || echo "")
    else
      DNS_RESULT=$(nslookup "$HOSTNAME_DVIG" 2>/dev/null | grep -A1 "Name:" | tail -1 | awk '{print $2}' || echo "")
    fi
    
    if [[ -n "$DNS_RESULT" ]]; then
      check_warn "DNS $HOSTNAME_DVIG" 0 "Résout vers: $DNS_RESULT"
    else
      check_warn "DNS $HOSTNAME_DVIG" 1 "Non résolu (peut être normal si DNS non configuré)"
    fi
  fi
else
  warn "⚠️  dig/nslookup non disponible, vérification DNS ignorée"
  ((CHECKS_WARN++))
fi
echo ""

# 8. Vérifier accès registry (optionnel)
echo "📦 Vérification registry Docker..."
if command -v docker &> /dev/null && docker info &> /dev/null; then
  # Tester pull d'une image légère (alpine)
  if docker pull alpine:latest &> /dev/null 2>&1; then
    check_warn "Accès registry Docker Hub" 0
    docker rmi alpine:latest &> /dev/null 2>&1 || true
  else
    check_warn "Accès registry Docker Hub" 1 "Impossible de pull depuis Docker Hub (peut être normal si images déjà présentes)"
  fi
else
  check_warn "Accès registry Docker Hub" 1 "Docker non accessible"
fi
echo ""

# Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Résumé préflight:"
echo "  ✅ Vérifications OK: $CHECKS_OK"
echo "  ⚠️  Avertissements: $CHECKS_WARN"
echo "  ❌ Erreurs: $CHECKS_KO"
echo ""

if [[ $CHECKS_KO -eq 0 ]]; then
  info "✅ Préflight réussi"
  exit 0
else
  error "❌ Préflight échoué ($CHECKS_KO erreur(s))"
  exit 1
fi


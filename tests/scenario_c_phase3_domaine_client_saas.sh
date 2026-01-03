#!/bin/bash
# Tests de conformité Scénario C Phase 3 (Domaine Client SaaS — tenant "rozas")
# US-5.1 : Tests déploiement avec domaine client en mode SaaS

set -uo pipefail  # Pas de -e pour permettre les tests qui échouent

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DOREVIA_SCRIPT="$ROOT_DIR/bin/dorevia.sh"
TENANT="rozas"
ENV="prod"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0
TESTS_WARN=0

# Fonctions
pass() {
  echo -e "${GREEN}✅ PASS${NC}: $1"
  ((TESTS_PASSED++))
  ((TESTS_TOTAL++))
}

fail() {
  echo -e "${RED}❌ FAIL${NC}: $1"
  ((TESTS_FAILED++))
  ((TESTS_TOTAL++))
}

warn() {
  echo -e "${YELLOW}⚠️  WARN${NC}: $1"
  ((TESTS_WARN++))
}

info() {
  echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

# Test helper
test_command() {
  local name="$1"
  local command="$2"
  local expected_exit="${3:-0}"
  
  info "Test: $name"
  set +e  # Désactiver erreur immédiate
  eval "$command" > /tmp/test_output_$$.log 2>&1
  local exit_code=$?
  set -e  # Réactiver erreur immédiate
  
  if [[ $exit_code -eq $expected_exit ]]; then
    pass "$name"
    return 0
  else
    fail "$name (exit code: $exit_code, expected: $expected_exit)"
    echo "   Command: $command"
    echo "   Output:"
    cat /tmp/test_output_$$.log 2>/dev/null | sed 's/^/   /' || true
    return 1
  fi
}

test_file_exists() {
  local file="$1"
  local name="$2"
  
  if [[ -f "$file" ]]; then
    pass "$name: $file existe"
    return 0
  else
    fail "$name: $file n'existe pas"
    return 1
  fi
}

test_file_contains() {
  local file="$1"
  local pattern="$2"
  local name="$3"
  
  if grep -q "$pattern" "$file" 2>/dev/null; then
    pass "$name: $file contient '$pattern'"
    return 0
  else
    fail "$name: $file ne contient pas '$pattern'"
    return 1
  fi
}

test_dns_resolution() {
  local hostname="$1"
  local name="$2"
  
  if ! command -v dig &> /dev/null && ! command -v nslookup &> /dev/null; then
    warn "$name (dig/nslookup non disponible, test ignoré)"
    return 0
  fi
  
  local resolved_ip=""
  if command -v dig &> /dev/null; then
    resolved_ip=$(dig +short "$hostname" 2>/dev/null | head -1)
  elif command -v nslookup &> /dev/null; then
    resolved_ip=$(nslookup "$hostname" 2>/dev/null | grep -A1 "Name:" | tail -1 | awk '{print $2}')
  fi
  
  if [[ -n "$resolved_ip" ]] && [[ "$resolved_ip" != "NXDOMAIN" ]]; then
    pass "$name: $hostname résout vers $resolved_ip"
    return 0
  else
    warn "$name: $hostname ne résout pas (DNS non configuré ou non propagé)"
    return 0  # Non bloquant pour les tests
  fi
}

# Nettoyage
cleanup() {
  rm -f /tmp/test_output_$$.log
}

trap cleanup EXIT

# Header
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🧪 Tests de conformité Scénario C Phase 3"
echo "   Domaine Client SaaS — tenant '$TENANT'"
echo "   Environnement: $ENV"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test 1: validate rozas
echo "📋 Test 1: validate rozas"
test_command "validate rozas" "$DOREVIA_SCRIPT validate $TENANT" 0 || true
echo ""

# Test 2: render rozas --env prod
echo "📋 Test 2: render rozas --env prod"
test_command "render rozas --env prod" "$DOREVIA_SCRIPT render $TENANT --env $ENV" 0 || true
echo ""

# Test 3: Vérifier fichiers générés
echo "📋 Test 3: Vérifier fichiers générés"
test_file_exists "$ROOT_DIR/tenants/$TENANT/rendered/$ENV/caddy/Caddyfile" "Caddyfile généré" || true
test_file_exists "$ROOT_DIR/tenants/$TENANT/rendered/$ENV/platform/docker-compose.yml" "docker-compose.yml platform généré" || true
test_file_exists "$ROOT_DIR/tenants/$TENANT/rendered/$ENV/odoo/docker-compose.yml" "docker-compose.yml app (odoo) généré" || true
echo ""

# Test 4: Vérifier domaine client dans Caddyfile
echo "📋 Test 4: Vérifier domaine client dans Caddyfile"
CADDYFILE="$ROOT_DIR/tenants/$TENANT/rendered/$ENV/caddy/Caddyfile"
if [[ -f "$CADDYFILE" ]]; then
  # Vérifier présence domaine client (rozas.gp)
  test_file_contains "$CADDYFILE" "rozas.gp" "Caddyfile contient domaine client rozas.gp" || true
  
  # Vérifier présence fallback (doreviateam.com)
  test_file_contains "$CADDYFILE" "doreviateam.com" "Caddyfile contient fallback doreviateam.com" || true
  
  # Vérifier hostnames canoniques
  test_file_contains "$CADDYFILE" "odoo.prod.rozas.rozas.gp" "Caddyfile contient hostname canonique odoo" || true
  test_file_contains "$CADDYFILE" "dvig.rozas.rozas.gp" "Caddyfile contient hostname DVIG" || true
  test_file_contains "$CADDYFILE" "vault.rozas.rozas.gp" "Caddyfile contient hostname Vault" || true
fi
echo ""

# Test 5: gateway aggregate --reload
echo "📋 Test 5: gateway aggregate --reload"
test_command "gateway aggregate --reload" "$DOREVIA_SCRIPT gateway aggregate --reload" 0 || true
echo ""

# Test 6: Vérifier Caddyfile global
echo "📋 Test 6: Vérifier Caddyfile global"
GLOBAL_CADDYFILE="$ROOT_DIR/gateway/Caddyfile"
if [[ -f "$GLOBAL_CADDYFILE" ]]; then
  test_file_contains "$GLOBAL_CADDYFILE" "rozas.gp" "Caddyfile global contient domaine client" || true
  test_file_contains "$GLOBAL_CADDYFILE" "odoo.prod.rozas.rozas.gp" "Caddyfile global contient hostname odoo" || true
fi
echo ""

# Test 7: Validation DNS (non bloquant)
echo "📋 Test 7: Validation DNS (non bloquant)"
if [[ -f "$ROOT_DIR/tenants/$TENANT/state/manifest.json" ]]; then
  # Lire domaine canonique depuis manifest
  canonical_domain=$(jq -r '.domains.canonical // "doreviateam.com"' "$ROOT_DIR/tenants/$TENANT/state/manifest.json" 2>/dev/null || echo "doreviateam.com")
  
  if [[ "$canonical_domain" != "doreviateam.com" ]]; then
    test_dns_resolution "odoo.prod.rozas.${canonical_domain}" "DNS odoo canonique" || true
    test_dns_resolution "dvig.rozas.${canonical_domain}" "DNS dvig canonique" || true
    test_dns_resolution "vault.rozas.${canonical_domain}" "DNS vault canonique" || true
  fi
  
  # Test fallback
  test_dns_resolution "odoo.prod.rozas.doreviateam.com" "DNS odoo fallback" || true
  test_dns_resolution "dvig.rozas.doreviateam.com" "DNS dvig fallback" || true
  test_dns_resolution "vault.rozas.doreviateam.com" "DNS vault fallback" || true
fi
echo ""

# Test 8: preflight --check-dns
echo "📋 Test 8: preflight --check-dns"
test_command "preflight rozas --env prod --check-dns" "$DOREVIA_SCRIPT preflight $TENANT --env $ENV --check-dns" 0 || true
echo ""

# Résumé
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📊 Résumé des tests"
echo "═══════════════════════════════════════════════════════════════"
echo "Total: $TESTS_TOTAL"
echo -e "${GREEN}✅ Passés: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Échoués: $TESTS_FAILED${NC}"
if [[ $TESTS_WARN -gt 0 ]]; then
  echo -e "${YELLOW}⚠️  Avertissements: $TESTS_WARN${NC}"
fi
echo ""

if [[ $TESTS_FAILED -eq 0 ]]; then
  echo -e "${GREEN}✅ Tous les tests sont passés !${NC}"
  exit 0
else
  echo -e "${RED}❌ Certains tests ont échoué${NC}"
  exit 1
fi


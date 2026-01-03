#!/bin/bash
# Tests de conformité Scénario E Phase 3 (Alias Multi-Domaines — tenant "rozas")
# US-5.2 : Tests alias multi-domaines

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

# Nettoyage
cleanup() {
  rm -f /tmp/test_output_$$.log
}

trap cleanup EXIT

# Header
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🧪 Tests de conformité Scénario E Phase 3"
echo "   Alias Multi-Domaines — tenant '$TENANT'"
echo "   Environnement: $ENV"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test 1: Vérifier manifest avec alias
echo "📋 Test 1: Vérifier manifest avec alias"
MANIFEST="$ROOT_DIR/tenants/$TENANT/state/manifest.json"
if [[ -f "$MANIFEST" ]]; then
  test_file_exists "$MANIFEST" "Manifest existe" || true
  
  # Vérifier structure domains.aliases
  if jq -e '.domains.aliases' "$MANIFEST" >/dev/null 2>&1; then
    pass "Manifest contient structure domains.aliases"
    ((TESTS_TOTAL++))
    
    # Vérifier alias global si présent
    if jq -e '.domains.aliases.global' "$MANIFEST" >/dev/null 2>&1; then
      global_aliases=$(jq -r '.domains.aliases.global // [] | length' "$MANIFEST")
      if [[ "$global_aliases" -gt 0 ]]; then
        pass "Manifest contient alias global (count: $global_aliases)"
        ((TESTS_TOTAL++))
      fi
    fi
    
    # Vérifier alias par service si présent
    if jq -e '.domains.aliases.odoo' "$MANIFEST" >/dev/null 2>&1; then
      odoo_aliases=$(jq -r '.domains.aliases.odoo // [] | length' "$MANIFEST")
      if [[ "$odoo_aliases" -gt 0 ]]; then
        pass "Manifest contient alias odoo (count: $odoo_aliases)"
        ((TESTS_TOTAL++))
      fi
    fi
  else
    warn "Manifest ne contient pas de structure domains.aliases (test ignoré)"
  fi
else
  warn "Manifest non trouvé (test ignoré)"
fi
echo ""

# Test 2: render rozas --env prod (avec alias)
echo "📋 Test 2: render rozas --env prod"
test_command "render rozas --env prod" "$DOREVIA_SCRIPT render $TENANT --env $ENV" 0 || true
echo ""

# Test 3: Vérifier alias dans Caddyfile
echo "📋 Test 3: Vérifier alias dans Caddyfile"
CADDYFILE="$ROOT_DIR/tenants/$TENANT/rendered/$ENV/caddy/Caddyfile"
if [[ -f "$CADDYFILE" ]]; then
  # Vérifier que le Caddyfile contient plusieurs hostnames (canonique + alias)
  hostname_count=$(grep -c "{" "$CADDYFILE" 2>/dev/null || echo "0")
  if [[ "$hostname_count" -gt 0 ]]; then
    pass "Caddyfile contient des blocs de configuration"
    ((TESTS_TOTAL++))
  fi
  
  # Vérifier format multi-hostname (virgule séparée)
  if grep -q "," "$CADDYFILE" 2>/dev/null; then
    pass "Caddyfile contient format multi-hostname (virgule séparée)"
    ((TESTS_TOTAL++))
  else
    warn "Caddyfile ne contient pas de format multi-hostname (alias peut-être non configuré)"
  fi
else
  fail "Caddyfile non trouvé"
fi
echo ""

# Test 4: gateway aggregate (avec alias)
echo "📋 Test 4: gateway aggregate"
test_command "gateway aggregate" "$DOREVIA_SCRIPT gateway aggregate" 0 || true
echo ""

# Test 5: Vérifier alias dans Caddyfile global
echo "📋 Test 5: Vérifier alias dans Caddyfile global"
GLOBAL_CADDYFILE="$ROOT_DIR/gateway/Caddyfile"
if [[ -f "$GLOBAL_CADDYFILE" ]]; then
  # Vérifier format multi-hostname dans global
  if grep -q "," "$GLOBAL_CADDYFILE" 2>/dev/null; then
    pass "Caddyfile global contient format multi-hostname"
    ((TESTS_TOTAL++))
  else
    warn "Caddyfile global ne contient pas de format multi-hostname"
  fi
else
  warn "Caddyfile global non trouvé"
fi
echo ""

# Test 6: preflight --check-dns (avec alias)
echo "📋 Test 6: preflight --check-dns (avec alias)"
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


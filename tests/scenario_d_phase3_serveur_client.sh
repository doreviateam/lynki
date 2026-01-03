#!/bin/bash
# Tests de conformité Scénario D Phase 3 (Serveur Client — tenant "rozas")
# US-5.2 : Tests déploiement sur serveur client

set -uo pipefail  # Pas de -e pour permettre les tests qui échouent

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DOREVIA_SCRIPT="$ROOT_DIR/bin/dorevia.sh"
TENANT="rozas"
ENV="prod"
SERVER_NAME="ionos-rozas"  # Serveur de test (peut être modifié)

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

# Nettoyage
cleanup() {
  rm -f /tmp/test_output_$$.log
}

trap cleanup EXIT

# Header
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🧪 Tests de conformité Scénario D Phase 3"
echo "   Serveur Client — tenant '$TENANT'"
echo "   Serveur: $SERVER_NAME"
echo "   Environnement: $ENV"
echo "═══════════════════════════════════════════════════════════════"
echo ""
warn "⚠️  Ces tests nécessitent un serveur client configuré et accessible"
warn "⚠️  Modifiez SERVER_NAME si nécessaire"
echo ""

# Test 1: server list
echo "📋 Test 1: server list"
test_command "server list" "$DOREVIA_SCRIPT server list" 0 || true
echo ""

# Test 2: Vérifier configuration serveur
echo "📋 Test 2: Vérifier configuration serveur"
SERVER_CONFIG="$ROOT_DIR/servers/$SERVER_NAME.json"
if [[ -f "$SERVER_CONFIG" ]]; then
  test_file_exists "$SERVER_CONFIG" "Configuration serveur existe" || true
else
  warn "Configuration serveur $SERVER_NAME non trouvée (créer avec 'server add $SERVER_NAME')"
  warn "Tests suivants seront ignorés"
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
  echo -e "${YELLOW}⚠️  Tests incomplets (serveur non configuré)${NC}"
  exit 0
fi
echo ""

# Test 3: server preflight
echo "📋 Test 3: server preflight $SERVER_NAME"
test_command "server preflight $SERVER_NAME" "$DOREVIA_SCRIPT server preflight $SERVER_NAME" 0 || true
echo ""

# Test 4: server status
echo "📋 Test 4: server status $SERVER_NAME"
test_command "server status $SERVER_NAME" "$DOREVIA_SCRIPT server status $SERVER_NAME" 0 || true
echo ""

# Test 5: render rozas --env prod (prérequis pour déploiement)
echo "📋 Test 5: render rozas --env prod"
test_command "render rozas --env prod" "$DOREVIA_SCRIPT render $TENANT --env $ENV" 0 || true
echo ""

# Test 6: platform up rozas --server $SERVER_NAME (optionnel, nécessite serveur réel)
echo "📋 Test 6: platform up rozas --server $SERVER_NAME"
warn "⚠️  Test optionnel (nécessite serveur réel et peut prendre du temps)"
warn "⚠️  Pour exécuter manuellement: $DOREVIA_SCRIPT platform up $TENANT --server $SERVER_NAME"
# test_command "platform up rozas --server $SERVER_NAME" "$DOREVIA_SCRIPT platform up $TENANT --server $SERVER_NAME" 0 || true
echo ""

# Test 7: app up odoo prod rozas --server $SERVER_NAME (optionnel, nécessite serveur réel)
echo "📋 Test 7: app up odoo prod rozas --server $SERVER_NAME"
warn "⚠️  Test optionnel (nécessite serveur réel et peut prendre du temps)"
warn "⚠️  Pour exécuter manuellement: $DOREVIA_SCRIPT app up odoo $ENV $TENANT --server $SERVER_NAME"
# test_command "app up odoo prod rozas --server $SERVER_NAME" "$DOREVIA_SCRIPT app up odoo $ENV $TENANT --server $SERVER_NAME" 0 || true
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


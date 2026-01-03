#!/bin/bash
# Tests de conformité Scénario B (Stinger — tenant "core")
# US-5.2 : Validation isolation des environnements

set -uo pipefail  # Pas de -e pour permettre continuation après échec de test

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DOREVIA_SCRIPT="$ROOT_DIR/bin/dorevia.sh"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

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
}

info() {
  echo -e "ℹ️  INFO: $1"
}

# Test helper
test_command() {
  local name="$1"
  local command="$2"
  local expected_exit="${3:-0}"
  
  info "Test: $name"
  set +e  # Désactiver erreur immédiate
  eval "$command" > /tmp/test_output.log 2>&1
  local exit_code=$?
  set -e  # Réactiver erreur immédiate
  
  if [[ "$exit_code" == "$expected_exit" ]]; then
    pass "$name"
    return 0
  else
    fail "$name (exit code: $exit_code, expected: $expected_exit)"
    if [[ -f /tmp/test_output.log ]]; then
      cat /tmp/test_output.log
    fi
    return 1
  fi
}

test_file_exists() {
  local file="$1"
  local name="$2"
  
  if [[ -f "$file" ]]; then
    pass "$name (fichier existe: $file)"
    return 0
  else
    fail "$name (fichier introuvable: $file)"
    return 1
  fi
}

test_file_different() {
  local file1="$1"
  local file2="$2"
  local name="$3"
  
  if [[ ! -f "$file1" ]] || [[ ! -f "$file2" ]]; then
    fail "$name (fichiers introuvables pour comparaison)"
    return 1
  fi
  
  if ! diff -q "$file1" "$file2" > /dev/null 2>&1; then
    pass "$name (fichiers distincts)"
    return 0
  else
    fail "$name (fichiers identiques, attendu distincts)"
    return 1
  fi
}

test_container_running() {
  local container="$1"
  local name="$2"
  
  if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
    pass "$name (container $container démarré)"
    return 0
  else
    fail "$name (container $container non démarré)"
    return 1
  fi
}

# --- Main ---

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Tests de conformité Scénario B (Stinger — tenant 'core')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TENANT="core"
ENV_LAB="lab"
ENV_STINGER="stinger"

# Prérequis : Vérifier que lab est déjà déployé
info "Vérification prérequis : lab doit être déployé"
if ! docker ps --format "{{.Names}}" | grep -q "^odoo_lab_core$"; then
  warn "Container odoo_lab_core non démarré. Le test d'isolation nécessite lab déployé."
  warn "Démarrage lab pour les tests..."
  $DOREVIA_SCRIPT apply $TENANT --env $ENV_LAB > /dev/null 2>&1 || true
fi

# Test 1: render core --env stinger
echo "📋 Test 1: render core --env stinger"
test_command "render core --env stinger" "$DOREVIA_SCRIPT render $TENANT --env $ENV_STINGER" 0 || true
echo ""

# Test 2: Vérifier fichiers générés pour stinger
echo "📋 Test 2: Vérifier fichiers générés pour stinger"
test_file_exists "$ROOT_DIR/tenants/$TENANT/rendered/$ENV_STINGER/caddy/Caddyfile" "Caddyfile stinger généré" || true
test_file_exists "$ROOT_DIR/tenants/$TENANT/rendered/$ENV_STINGER/platform/docker-compose.yml" "docker-compose.yml platform stinger généré" || true
test_file_exists "$ROOT_DIR/tenants/$TENANT/rendered/$ENV_STINGER/odoo/docker-compose.yml" "docker-compose.yml app (odoo) stinger généré" || true
echo ""

# Test 3: Vérifier hostnames stinger normalisés
echo "📋 Test 3: Vérifier hostnames stinger normalisés"
CADDYFILE_STINGER="$ROOT_DIR/tenants/$TENANT/rendered/$ENV_STINGER/caddy/Caddyfile"
if [[ -f "$CADDYFILE_STINGER" ]]; then
  if grep -q "odoo.stinger.core.doreviateam.com" "$CADDYFILE_STINGER"; then
    pass "Caddyfile stinger contient hostname odoo.stinger.core.doreviateam.com"
  else
    fail "Caddyfile stinger ne contient pas hostname odoo.stinger.core.doreviateam.com"
  fi
  
  if grep -q "dvig.stinger.core.doreviateam.com" "$CADDYFILE_STINGER"; then
    pass "Caddyfile stinger contient hostname dvig.stinger.core.doreviateam.com (normalisé avec <env>)"
  else
    fail "Caddyfile stinger ne contient pas hostname dvig.stinger.core.doreviateam.com (normalisé avec <env>)"
  fi
  
  if grep -q "vault.stinger.core.doreviateam.com" "$CADDYFILE_STINGER"; then
    pass "Caddyfile stinger contient hostname vault.stinger.core.doreviateam.com (normalisé avec <env>)"
  else
    fail "Caddyfile stinger ne contient pas hostname vault.stinger.core.doreviateam.com (normalisé avec <env>)"
  fi
else
  fail "Caddyfile stinger introuvable pour vérification hostnames"
fi
echo ""

# Test 4: Vérifier que les fichiers stinger sont distincts de lab
echo "📋 Test 4: Vérifier isolation (fichiers stinger distincts de lab)"
CADDYFILE_LAB="$ROOT_DIR/tenants/$TENANT/rendered/$ENV_LAB/caddy/Caddyfile"
if [[ -f "$CADDYFILE_LAB" ]] && [[ -f "$CADDYFILE_STINGER" ]]; then
  # Les Caddyfiles doivent être différents (hostnames différents)
  if ! diff -q "$CADDYFILE_LAB" "$CADDYFILE_STINGER" > /dev/null 2>&1; then
    pass "Caddyfile stinger distinct de Caddyfile lab (isolation OK)"
  else
    fail "Caddyfile stinger identique à Caddyfile lab (isolation non garantie)"
  fi
else
  warn "Impossible de comparer Caddyfiles (fichiers manquants)"
fi

# Vérifier docker-compose.yml app
COMPOSE_LAB="$ROOT_DIR/tenants/$TENANT/rendered/$ENV_LAB/odoo/docker-compose.yml"
COMPOSE_STINGER="$ROOT_DIR/tenants/$TENANT/rendered/$ENV_STINGER/odoo/docker-compose.yml"
if [[ -f "$COMPOSE_LAB" ]] && [[ -f "$COMPOSE_STINGER" ]]; then
  # Les docker-compose doivent être différents (noms containers différents)
  if ! diff -q "$COMPOSE_LAB" "$COMPOSE_STINGER" > /dev/null 2>&1; then
    pass "docker-compose.yml app stinger distinct de lab (isolation OK)"
  else
    fail "docker-compose.yml app stinger identique à lab (isolation non garantie)"
  fi
else
  warn "Impossible de comparer docker-compose.yml app (fichiers manquants)"
fi
echo ""

# Test 5: apply core --env stinger (ne doit pas casser lab)
echo "📋 Test 5: apply core --env stinger (isolation avec lab)"
info "Vérification que lab est toujours démarré avant apply stinger"
LAB_CONTAINER_BEFORE=$(docker ps --format "{{.Names}}" | grep -c "^odoo_lab_core$" || echo "0")

test_command "apply core --env stinger" "$DOREVIA_SCRIPT apply $TENANT --env $ENV_STINGER" 0 || true

info "Vérification que lab est toujours démarré après apply stinger"
LAB_CONTAINER_AFTER=$(docker ps --format "{{.Names}}" | grep -c "^odoo_lab_core$" || echo "0")

if [[ "$LAB_CONTAINER_BEFORE" == "1" ]] && [[ "$LAB_CONTAINER_AFTER" == "1" ]]; then
  pass "Lab non impacté par déploiement stinger (isolation OK)"
elif [[ "$LAB_CONTAINER_BEFORE" == "0" ]]; then
  warn "Lab n'était pas démarré avant apply stinger (test d'isolation partiel)"
else
  fail "Lab impacté par déploiement stinger (isolation non garantie)"
fi
echo ""

# Test 6: Vérifier containers stinger démarrés
echo "📋 Test 6: Vérifier containers stinger démarrés"
test_container_running "odoo_stinger_core" "Container odoo_stinger_core démarré" || true
test_container_running "dvig-core" "Container dvig-core démarré (partagé)" || true
test_container_running "vault-core" "Container vault-core démarré (partagé)" || true
echo ""

# Test 7: Vérifier que lab et stinger coexistent
echo "📋 Test 7: Vérifier coexistence lab et stinger"
LAB_RUNNING=$(docker ps --format "{{.Names}}" | grep -c "^odoo_lab_core$" || echo "0")
STINGER_RUNNING=$(docker ps --format "{{.Names}}" | grep -c "^odoo_stinger_core$" || echo "0")

if [[ "$LAB_RUNNING" == "1" ]] && [[ "$STINGER_RUNNING" == "1" ]]; then
  pass "Lab et Stinger coexistent (isolation complète)"
elif [[ "$LAB_RUNNING" == "1" ]]; then
  warn "Lab démarré mais Stinger non démarré"
elif [[ "$STINGER_RUNNING" == "1" ]]; then
  warn "Stinger démarré mais Lab non démarré"
else
  fail "Ni Lab ni Stinger démarrés"
fi
echo ""

# Test 8: Vérifier hostnames cohérents (stinger contient "stinger")
echo "📋 Test 8: Vérifier cohérence hostnames stinger"
if [[ -f "$CADDYFILE_STINGER" ]]; then
  # Vérifier que tous les hostnames stinger contiennent "stinger"
  if grep -q "stinger" "$CADDYFILE_STINGER"; then
    pass "Caddyfile stinger contient 'stinger' dans les hostnames"
  else
    fail "Caddyfile stinger ne contient pas 'stinger' dans les hostnames"
  fi
  
  # Vérifier qu'aucun hostname lab n'est présent dans stinger
  if ! grep -q "odoo.lab.core.doreviateam.com" "$CADDYFILE_STINGER"; then
    pass "Caddyfile stinger ne contient pas de hostname lab (isolation OK)"
  else
    fail "Caddyfile stinger contient des hostnames lab (isolation non garantie)"
  fi
else
  fail "Caddyfile stinger introuvable pour vérification cohérence"
fi
echo ""

# --- Résumé ---
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Résumé des tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total: $TESTS_TOTAL"
echo -e "${GREEN}✅ Passés: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Échoués: $TESTS_FAILED${NC}"
echo ""

if [[ "$TESTS_FAILED" -eq 0 ]]; then
  echo -e "${GREEN}✅ Tous les tests sont passés !${NC}"
  exit 0
else
  echo -e "${RED}❌ Certains tests ont échoué${NC}"
  exit 1
fi


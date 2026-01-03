#!/bin/bash
# Tests de conformité Scénario A (Lab — tenant "core")
# US-5.1 : Validation Phase 1 sur tenant de référence

set -euo pipefail

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

test_http_response() {
  local url="$1"
  local name="$2"
  local expected_status="${3:-200}"
  
  info "Test HTTP: $name ($url)"
  
  # Utiliser curl si disponible, sinon skip
  if ! command -v curl &> /dev/null; then
    warn "$name (curl non disponible, test ignoré)"
    return 0
  fi
  
  local status_code
  status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
  
  if [[ "$status_code" == "$expected_status" ]] || [[ "$status_code" =~ ^[23] ]]; then
    pass "$name (HTTP $status_code)"
    return 0
  else
    fail "$name (HTTP $status_code, attendu: $expected_status ou 2xx/3xx)"
    return 1
  fi
}

# --- Main ---

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Tests de conformité Scénario A (Lab — tenant 'core')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TENANT="core"
ENV="lab"

# Test 1: validate core
echo "📋 Test 1: validate core"
test_command "validate core" "$DOREVIA_SCRIPT validate $TENANT" 0 || true
echo ""

# Test 2: render core --env lab
echo "📋 Test 2: render core --env lab"
test_command "render core --env lab" "$DOREVIA_SCRIPT render $TENANT --env $ENV" 0 || true
echo ""

# Test 3: Vérifier fichiers générés
echo "📋 Test 3: Vérifier fichiers générés"
test_file_exists "$ROOT_DIR/tenants/$TENANT/rendered/$ENV/caddy/Caddyfile" "Caddyfile généré" || true
test_file_exists "$ROOT_DIR/tenants/$TENANT/rendered/$ENV/platform/docker-compose.yml" "docker-compose.yml platform généré" || true
test_file_exists "$ROOT_DIR/tenants/$TENANT/rendered/$ENV/odoo/docker-compose.yml" "docker-compose.yml app (odoo) généré" || true
echo ""

# Test 4: Vérifier contenu Caddyfile (hostnames normalisés)
echo "📋 Test 4: Vérifier hostnames normalisés dans Caddyfile"
CADDYFILE="$ROOT_DIR/tenants/$TENANT/rendered/$ENV/caddy/Caddyfile"
if [[ -f "$CADDYFILE" ]]; then
  if grep -q "odoo.lab.core.doreviateam.com" "$CADDYFILE"; then
    pass "Caddyfile contient hostname odoo.lab.core.doreviateam.com"
  else
    fail "Caddyfile ne contient pas hostname odoo.lab.core.doreviateam.com"
  fi
  
  if grep -q "dvig.lab.core.doreviateam.com" "$CADDYFILE"; then
    pass "Caddyfile contient hostname dvig.lab.core.doreviateam.com (normalisé avec <env>)"
  else
    fail "Caddyfile ne contient pas hostname dvig.lab.core.doreviateam.com (normalisé avec <env>)"
  fi
  
  if grep -q "vault.lab.core.doreviateam.com" "$CADDYFILE"; then
    pass "Caddyfile contient hostname vault.lab.core.doreviateam.com (normalisé avec <env>)"
  else
    fail "Caddyfile ne contient pas hostname vault.lab.core.doreviateam.com (normalisé avec <env>)"
  fi
else
  fail "Caddyfile introuvable pour vérification hostnames"
fi
echo ""

# Test 5: preflight core --env lab
echo "📋 Test 5: preflight core --env lab"
test_command "preflight core --env lab" "$DOREVIA_SCRIPT preflight $TENANT --env $ENV" 0 || true
echo ""

# Test 6: apply core --env lab
echo "📋 Test 6: apply core --env lab"
test_command "apply core --env lab" "$DOREVIA_SCRIPT apply $TENANT --env $ENV" 0 || true
echo ""

# Test 7: Vérifier containers démarrés
echo "📋 Test 7: Vérifier containers démarrés"
if docker ps --format "{{.Names}}" | grep -q "^odoo_lab_core$"; then
  pass "Container odoo_lab_core démarré"
else
  fail "Container odoo_lab_core non démarré"
fi

if docker ps --format "{{.Names}}" | grep -q "^dvig-core$"; then
  pass "Container dvig-core démarré"
else
  fail "Container dvig-core non démarré"
fi

if docker ps --format "{{.Names}}" | grep -q "^vault-core$"; then
  pass "Container vault-core démarré"
else
  fail "Container vault-core non démarré"
fi
echo ""

# Test 8: Vérifier health endpoints (si gateway configurée)
echo "📋 Test 8: Vérifier health endpoints (optionnel)"
info "Note: Ces tests nécessitent que la gateway soit configurée et que les DNS pointent vers le serveur"
info "Ils sont ignorés si curl n'est pas disponible ou si les endpoints ne répondent pas"

# Test DVIG health (via hostname normalisé)
test_http_response "http://dvig.lab.core.doreviateam.com/health" "DVIG health (dvig.lab.core.doreviateam.com)"

# Test Vault health (via hostname normalisé)
test_http_response "http://vault.lab.core.doreviateam.com/health" "Vault health (vault.lab.core.doreviateam.com)"

# Test Odoo (via hostname normalisé)
test_http_response "http://odoo.lab.core.doreviateam.com" "Odoo (odoo.lab.core.doreviateam.com)"
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


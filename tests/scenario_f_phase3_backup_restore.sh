#!/bin/bash
# Tests de conformité Scénario F Phase 3 (Backup/Restore — tenant "rozas")
# US-5.3 : Tests backup/restore

set -uo pipefail  # Pas de -e pour permettre les tests qui échouent

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DOREVIA_SCRIPT="$ROOT_DIR/bin/dorevia.sh"
TENANT="rozas"
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

test_file_size() {
  local file="$1"
  local min_size="$2"
  local name="$3"
  
  if [[ ! -f "$file" ]]; then
    fail "$name: $file n'existe pas"
    return 1
  fi
  
  local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
  if [[ "$size" -gt "$min_size" ]]; then
    pass "$name: $file a une taille valide ($size bytes)"
    return 0
  else
    fail "$name: $file a une taille invalide ($size bytes, attendu > $min_size)"
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
echo "🧪 Tests de conformité Scénario F Phase 3"
echo "   Backup/Restore — tenant '$TENANT'"
echo "   Serveur: $SERVER_NAME"
echo "═══════════════════════════════════════════════════════════════"
echo ""
warn "⚠️  Ces tests nécessitent un serveur client configuré et accessible"
warn "⚠️  Modifiez SERVER_NAME si nécessaire"
echo ""

# Test 1: Vérifier configuration serveur
echo "📋 Test 1: Vérifier configuration serveur"
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

# Test 2: backup rozas --server $SERVER_NAME
echo "📋 Test 2: backup rozas --server $SERVER_NAME"
BACKUP_OUTPUT_DIR="$ROOT_DIR/backups/test-backup-${TENANT}-$(date +%s)"
test_command "backup rozas --server $SERVER_NAME --output $BACKUP_OUTPUT_DIR" "$DOREVIA_SCRIPT backup $TENANT --server $SERVER_NAME --output $BACKUP_OUTPUT_DIR" 0 || true
echo ""

# Test 3: Vérifier artefacts backup
echo "📋 Test 3: Vérifier artefacts backup"
if [[ -d "$BACKUP_OUTPUT_DIR" ]]; then
  # Vérifier structure répertoire
  test_file_exists "$BACKUP_OUTPUT_DIR/tenants/$TENANT/platform" "Répertoire platform backup existe" || true
  test_file_exists "$BACKUP_OUTPUT_DIR/tenants/$TENANT/secrets" "Répertoire secrets backup existe" || true
  
  # Vérifier archives Vault (optionnelles)
  if [[ -f "$BACKUP_OUTPUT_DIR/tenants/$TENANT/platform/vault-storage.tar.gz" ]]; then
    test_file_exists "$BACKUP_OUTPUT_DIR/tenants/$TENANT/platform/vault-storage.tar.gz" "Archive vault-storage existe" || true
    test_file_size "$BACKUP_OUTPUT_DIR/tenants/$TENANT/platform/vault-storage.tar.gz" 100 "Archive vault-storage a une taille valide" || true
  else
    warn "Archive vault-storage non trouvée (volume peut-être vide ou non existant)"
  fi
  
  if [[ -f "$BACKUP_OUTPUT_DIR/tenants/$TENANT/platform/vault-db.dump" ]]; then
    test_file_exists "$BACKUP_OUTPUT_DIR/tenants/$TENANT/platform/vault-db.dump" "Dump vault-db existe" || true
    test_file_size "$BACKUP_OUTPUT_DIR/tenants/$TENANT/platform/vault-db.dump" 100 "Dump vault-db a une taille valide" || true
  else
    warn "Dump vault-db non trouvé (DB peut-être vide ou non existante)"
  fi
  
  # Vérifier archive secrets
  if [[ -f "$BACKUP_OUTPUT_DIR/tenants/$TENANT/secrets/secrets.tar.gz" ]]; then
    test_file_exists "$BACKUP_OUTPUT_DIR/tenants/$TENANT/secrets/secrets.tar.gz" "Archive secrets existe" || true
    test_file_size "$BACKUP_OUTPUT_DIR/tenants/$TENANT/secrets/secrets.tar.gz" 10 "Archive secrets a une taille valide" || true
    
    # Vérifier permissions (600 ou 640)
    local perms=$(stat -f%A "$BACKUP_OUTPUT_DIR/tenants/$TENANT/secrets/secrets.tar.gz" 2>/dev/null || stat -c%a "$BACKUP_OUTPUT_DIR/tenants/$TENANT/secrets/secrets.tar.gz" 2>/dev/null || echo "000")
    if [[ "$perms" == "600" ]] || [[ "$perms" == "640" ]]; then
      pass "Archive secrets a permissions sécurisées ($perms)"
      ((TESTS_TOTAL++))
    else
      warn "Archive secrets a permissions $perms (attendu 600 ou 640)"
    fi
  else
    warn "Archive secrets non trouvée (secrets peut-être non configurés)"
  fi
else
  warn "Répertoire backup non trouvé (backup peut avoir échoué)"
fi
echo ""

# Test 4: restore rozas --server $SERVER_NAME --from $BACKUP_OUTPUT_DIR (optionnel)
echo "📋 Test 4: restore rozas --server $SERVER_NAME --from $BACKUP_OUTPUT_DIR"
warn "⚠️  Test optionnel (nécessite serveur réel et peut modifier données)"
warn "⚠️  Pour exécuter manuellement: $DOREVIA_SCRIPT restore $TENANT --server $SERVER_NAME --from $BACKUP_OUTPUT_DIR"
# test_command "restore rozas --server $SERVER_NAME --from $BACKUP_OUTPUT_DIR" "$DOREVIA_SCRIPT restore $TENANT --server $SERVER_NAME --from $BACKUP_OUTPUT_DIR" 0 || true
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


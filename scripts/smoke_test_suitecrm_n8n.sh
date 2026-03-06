#!/usr/bin/env bash
# Smoke test — SuiteCRM et n8n (Sprint 2 US-2.5)
# Usage: ./scripts/smoke_test_suitecrm_n8n.sh <tenant> <env> [--http]
# Vérifie : conteneurs running (app + db pour suitecrm et n8n).
# Avec --http : curl sur les URLs (200, 301, 302, 401 acceptés).
# Code de sortie : 0 si tout OK, 1 sinon.

set -euo pipefail

TENANT="${1:-}"
ENV="${2:-}"
CHECK_HTTP=false
if [[ "${3:-}" == "--http" ]]; then
  CHECK_HTTP=true
fi

if [[ -z "$TENANT" ]] || [[ -z "$ENV" ]]; then
  echo "Usage: $0 <tenant> <env> [--http]"
  echo "Ex.   $0 lab lab"
  echo "Ex.   $0 lab lab --http   # + vérif HTTP sur les URLs"
  exit 1
fi

FAIL=0

# Conteneurs attendus (si univers activés dans le manifest, on vérifie au moins n8n/suitecrm quand présents)
check_container() {
  local name="$1"
  local status
  status=$(docker ps --filter "name=^${name}$" --format "{{.Status}}" 2>/dev/null || true)
  if [[ -z "$status" ]]; then
    echo "KO  Container $name absent ou non running"
    return 1
  fi
  if [[ "$status" != Up* ]]; then
    echo "KO  Container $name pas Up: $status"
    return 1
  fi
  echo "OK  $name ($status)"
  return 0
}

# HTTP check (curl) — accepter 200, 301, 302, 401
check_http() {
  local url="$1"
  local label="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$url" 2>/dev/null || echo "000")
  case "$code" in
    200|301|302|401) echo "OK  HTTP $label: $code"; return 0 ;;
    *)                echo "KO  HTTP $label: $code (attendu 200/301/302/401)"; return 1 ;;
  esac
}

echo "Smoke test — tenant=$TENANT env=$ENV (http=$CHECK_HTTP)"
echo "---"

# Conteneurs n8n (souvent déployés en premier)
if docker ps -a --format "{{.Names}}" | grep -q "^n8n_${ENV}_${TENANT}$"; then
  check_container "n8n_${ENV}_${TENANT}" || FAIL=1
  check_container "n8n_db_${ENV}_${TENANT}" || FAIL=1
else
  echo "—   n8n_${ENV}_${TENANT} non déployé (ignoré)"
fi

# Conteneurs suitecrm
if docker ps -a --format "{{.Names}}" | grep -q "^suitecrm_${ENV}_${TENANT}$"; then
  check_container "suitecrm_${ENV}_${TENANT}" || FAIL=1
  check_container "suitecrm_db_${ENV}_${TENANT}" || FAIL=1
else
  echo "—   suitecrm_${ENV}_${TENANT} non déployé (ignoré)"
fi

# Au moins un univers vérifié
if ! docker ps -a --format "{{.Names}}" | grep -qE "^(n8n_${ENV}_${TENANT}|suitecrm_${ENV}_${TENANT})$"; then
  echo "KO  Aucun conteneur app n8n/suitecrm trouvé pour $TENANT/$ENV"
  FAIL=1
fi

if [[ "$CHECK_HTTP" == true ]]; then
  echo "---"
  BASE="https://${ENV}.${TENANT}.doreviateam.com"
  if docker ps --format "{{.Names}}" | grep -q "^n8n_${ENV}_${TENANT}$"; then
    check_http "https://n8n.${ENV}.${TENANT}.doreviateam.com/" "n8n" || FAIL=1
  fi
  if docker ps --format "{{.Names}}" | grep -q "^suitecrm_${ENV}_${TENANT}$"; then
    check_http "https://suitecrm.${ENV}.${TENANT}.doreviateam.com/" "suitecrm" || FAIL=1
  fi
fi

echo "---"
if [[ $FAIL -eq 0 ]]; then
  echo "Smoke test OK"
  exit 0
else
  echo "Smoke test KO"
  exit 1
fi

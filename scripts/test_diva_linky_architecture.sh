#!/usr/bin/env bash
# =============================================================================
# Tests d'architecture DIVA / Linky / Mistral
# Valide les 3 règles fondamentales :
#   1. L'UI ne dépend jamais de Mistral
#   2. Mistral travaille en tâche de fond
#   3. DIVA lit toujours depuis la base (GET = 200, jamais 404)
# =============================================================================

set -uo pipefail

DIVA_URL="http://diva:8010"
LINKY_URL="http://linky_lab_sarl-la-platine:3000"
DVIG_URL="http://dvig-core-stinger:8080"
DB_CONTAINER="vault-db-core-stinger"
NETWORK="dorevia-network"
TENANT="sarl-la-platine"
DVIG_TOKEN="0MutdWWm97SG7KAHCd3jqGL7aYZNptuqSJiGyEOIzSI"

PASS=0
FAIL=0
SKIP=0

# --- Helpers ---
curl_net() {
  docker run --rm --network "$NETWORK" curlimages/curl:latest -s "$@"
}

psql_exec() {
  docker exec -i "$DB_CONTAINER" psql -U vault -d dorevia_vault -tAc "$1"
}

assert_eq() {
  local desc="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  ✓ $desc"
    ((PASS++))
  else
    echo "  ✗ $desc (attendu: '$expected', obtenu: '$actual')"
    ((FAIL++))
  fi
}

assert_contains() {
  local desc="$1" needle="$2" haystack="$3"
  if echo "$haystack" | grep -q "$needle"; then
    echo "  ✓ $desc"
    ((PASS++))
  else
    echo "  ✗ $desc (ne contient pas: '$needle')"
    ((FAIL++))
  fi
}

assert_not_contains() {
  local desc="$1" needle="$2" haystack="$3"
  if echo "$haystack" | grep -qi "$needle"; then
    echo "  ✗ $desc (contient interdit: '$needle')"
    ((FAIL++))
  else
    echo "  ✓ $desc"
    ((PASS++))
  fi
}

assert_http_code() {
  local desc="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  ✓ $desc (HTTP $actual)"
    ((PASS++))
  else
    echo "  ✗ $desc (attendu HTTP $expected, obtenu HTTP $actual)"
    ((FAIL++))
  fi
}

# =============================================================================
echo ""
echo "========================================="
echo " Tests d'architecture DIVA / Linky"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="
echo ""

# --- PRE-REQUIS : vérifier que les services tournent ---
echo "[0] Pré-requis : services actifs"
for svc in diva linky_lab_sarl-la-platine dvig-core-stinger "$DB_CONTAINER"; do
  status=$(docker inspect -f '{{.State.Running}}' "$svc" 2>/dev/null || echo "false")
  assert_eq "Container $svc en cours" "true" "$status"
done
echo ""

# =============================================================================
# RÈGLE 1 : L'UI ne dépend jamais de Mistral
# =============================================================================
echo "[1] RÈGLE 1 — L'UI ne dépend jamais de Mistral"
echo ""

# --- T1 : GET insight retourne toujours 200 (jamais 404) ---
echo "  [1.1] GET /diva/insights retourne 200 même sans insight"
resp=$(curl_net -w "\n%{http_code}" \
  "${DIVA_URL}/diva/insights?tenant=test-inexistant&company_id=0&mode=cockpit&date_start=2020-01-01&date_end=2020-12-31")
http_code=$(echo "$resp" | tail -1)
body=$(echo "$resp" | head -n -1)
assert_http_code "GET contexte inexistant → 200" "200" "$http_code"

state=$(echo "$body" | python3 -c "import sys,json; print(json.load(sys.stdin).get('state',''))" 2>/dev/null || echo "")
assert_eq "state=pending quand pas d'insight" "pending" "$state"
echo ""

# --- T2 : GET retourne state=ready quand insight existe ---
echo "  [1.2] GET retourne state=ready quand insight existe en BDD"
valid_key=$(psql_exec "SELECT context_key FROM diva_insights WHERE status='ok' AND expires_at > now() ORDER BY created_at DESC LIMIT 1;" 2>/dev/null || echo "")
if [[ -n "$valid_key" ]]; then
  resp=$(curl_net -w "\n%{http_code}" \
    "${DIVA_URL}/diva/insights?tenant=${TENANT}&company_id=0&mode=cockpit&date_start=2026-01-01&date_end=2026-02-18")
  http_code=$(echo "$resp" | tail -1)
  body=$(echo "$resp" | head -n -1)
  state=$(echo "$body" | python3 -c "import sys,json; print(json.load(sys.stdin).get('state',''))" 2>/dev/null || echo "")
  assert_http_code "GET insight existant → 200" "200" "$http_code"
  assert_eq "state=ready quand insight valide" "ready" "$state"
  msg=$(echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('insight',{}).get('message_text','')[:40])" 2>/dev/null || echo "")
  if [[ -n "$msg" ]]; then
    echo "  ✓ message_text présent (${msg}...)"
    ((PASS++))
  else
    echo "  ✗ message_text vide"
    ((FAIL++))
  fi
else
  echo "  ⊘ SKIP : aucun insight valide en BDD (runner pas encore passé)"
  ((SKIP+=3))
fi
echo ""

# --- T3 : Fallback company_id=0 ---
echo "  [1.3] Fallback company_id=0 quand company_id spécifique n'a pas d'insight"
has_global=$(psql_exec "SELECT count(*) FROM diva_insights WHERE company_id=0 AND status='ok' AND expires_at > now();" 2>/dev/null || echo "0")
if [[ "$has_global" -gt 0 ]]; then
  resp=$(curl_net -w "\n%{http_code}" \
    "${DIVA_URL}/diva/insights?tenant=${TENANT}&company_id=999&mode=cockpit&date_start=2026-01-01&date_end=2026-02-18")
  http_code=$(echo "$resp" | tail -1)
  body=$(echo "$resp" | head -n -1)
  state=$(echo "$body" | python3 -c "import sys,json; print(json.load(sys.stdin).get('state',''))" 2>/dev/null || echo "")
  assert_http_code "GET company_id=999 → 200" "200" "$http_code"
  assert_eq "fallback sur company_id=0 → state=ready" "ready" "$state"
else
  echo "  ⊘ SKIP : aucun insight global (company_id=0) en BDD"
  ((SKIP+=2))
fi
echo ""

# =============================================================================
# RÈGLE 2 : Mistral travaille en tâche de fond
# =============================================================================
echo "[2] RÈGLE 2 — Mistral en tâche de fond uniquement"
echo ""

# --- T4 : Prewarm = fire-and-forget (204, rapide) ---
echo "  [2.1] POST /api/diva/prewarm → 204 (fire-and-forget)"
prewarm_resp=$(curl_net -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"context":{"tenant":"sarl-la-platine","company_id":1,"date_debut":"2026-01-01","date_fin":"2026-02-18"},"dashboard":{"treasury":{"value":0,"formatted":"0 %"},"cash":{"value":100,"formatted":"100 €"}}}' \
  "${LINKY_URL}/api/diva/prewarm" --max-time 5)
prewarm_code=$(echo "$prewarm_resp" | tail -1)
assert_http_code "Prewarm retourne 204" "204" "$prewarm_code"
echo ""

# --- T5 : Refresh = lecture BDD pure ---
echo "  [2.2] Bouton Refresh = GET insight (pas d'appel /diva/generate)"
refresh_resp=$(curl_net -w "\n%{http_code}" \
  "${LINKY_URL}/api/diva/insight?tenant=${TENANT}&company_id=1&mode=cockpit&date_start=2026-01-01&date_end=2026-02-18" --max-time 5)
refresh_code=$(echo "$refresh_resp" | tail -1)
assert_http_code "Refresh (GET insight) → 200 (pas de timeout Mistral)" "200" "$refresh_code"
echo ""

# =============================================================================
# RÈGLE 3 : Pas de fuite de noms internes
# =============================================================================
echo "[3] RÈGLE 3 — Aucune fuite de noms internes dans les réponses"
echo ""

echo "  [3.1] Messages d'erreur DIVA ne contiennent pas 'Mistral'"
err503_body=$(curl_net -s "${DIVA_URL}/diva/insights?tenant=x&company_id=0&mode=cockpit&date_start=2020-01-01&date_end=2020-12-31")
assert_not_contains "Réponse GET ne contient pas 'Mistral'" "mistral" "$err503_body"
assert_not_contains "Réponse GET ne contient pas 'Lock timeout'" "lock timeout" "$err503_body"
echo ""

# =============================================================================
# INTÉGRITÉ : Badge IntegrityBadge
# =============================================================================
echo "[4] IntegrityBadge — DVIG vault-health avec token"
echo ""

echo "  [4.1] DVIG /internal/vault-health accessible avec token"
vh_resp=$(curl_net -w "\n%{http_code}" \
  -H "Authorization: Bearer ${DVIG_TOKEN}" \
  "${DVIG_URL}/internal/vault-health?tenant=${TENANT}")
vh_code=$(echo "$vh_resp" | tail -1)
vh_body=$(echo "$vh_resp" | head -n -1)
assert_http_code "DVIG vault-health → 200" "200" "$vh_code"
vault_rate=$(echo "$vh_body" | python3 -c "import sys,json; print(json.load(sys.stdin).get('vault_rate', -1))" 2>/dev/null || echo "-1")
if [[ "$vault_rate" != "-1" ]]; then
  echo "  ✓ vault_rate retourné ($vault_rate)"
  ((PASS++))
else
  echo "  ✗ vault_rate absent de la réponse"
  ((FAIL++))
fi
echo ""

echo "  [4.2] Linky /api/platform/status retourne integrity_state"
ps_resp=$(curl_net -s "${LINKY_URL}/api/platform/status?tenant=${TENANT}")
ps_state=$(echo "$ps_resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('integrity_state',''))" 2>/dev/null || echo "")
if [[ "$ps_state" == "STATE_OK" || "$ps_state" == "STATE_PARTIAL" ]]; then
  echo "  ✓ integrity_state=$ps_state (pas STATE_ALERT)"
  ((PASS++))
else
  echo "  ✗ integrity_state=$ps_state (attendu STATE_OK ou STATE_PARTIAL)"
  ((FAIL++))
fi
echo ""

# =============================================================================
# COMPANY_ID : extractNumericCompanyId
# =============================================================================
echo "[5] company_id — Linky extrait la partie numérique"
echo ""

echo "  [5.1] GET avec company_id numérique via Linky"
linky_resp=$(curl_net -w "\n%{http_code}" \
  "${LINKY_URL}/api/diva/insight?tenant=${TENANT}&company_id=1&mode=cockpit&date_start=2026-01-01&date_end=2026-02-18")
linky_code=$(echo "$linky_resp" | tail -1)
linky_body=$(echo "$linky_resp" | head -n -1)
assert_http_code "Linky GET insight → 200" "200" "$linky_code"
linky_state=$(echo "$linky_body" | python3 -c "import sys,json; print(json.load(sys.stdin).get('state',''))" 2>/dev/null || echo "")
assert_contains "state est ready ou pending" "$linky_state" "ready pending"
echo ""

# =============================================================================
# RÉSUMÉ
# =============================================================================
echo "========================================="
TOTAL=$((PASS + FAIL + SKIP))
echo " RÉSULTATS : $PASS/$TOTAL passés, $FAIL échoués, $SKIP ignorés"
if [[ $FAIL -eq 0 ]]; then
  echo " ✓ TOUS LES TESTS PASSENT"
else
  echo " ✗ $FAIL TEST(S) EN ÉCHEC"
fi
echo "========================================="
echo ""

exit $FAIL

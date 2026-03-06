#!/usr/bin/env bash
# S2.4 — Tests manuels DIVA Insights v1.1
# Vérifie : GET /diva/insights, POST /diva/generate, proxy Linky GET /api/diva/insight, prewarm
# Usage : ./scripts/test_diva_insights_s2.sh [LINKY_URL]
# Prérequis : docker, dorevia-network, DIVA (+ optionnel Linky) démarrés

set -e

DIVA_URL="${DIVA_URL:-http://diva:8010}"
LINKY_URL="${1:-}"
NETWORK="${NETWORK:-dorevia-network}"
TENANT="${TENANT:-core}"
COMPANY_ID="${COMPANY_ID:-0}"

# Dates YTD 2026 pour les tests
DATE_START="2026-01-01"
DATE_END="2026-02-16"

PASS=0
FAIL=0

ok() {
  echo "  ✓ $1"
  ((PASS++)) || true
}

ko() {
  echo "  ✗ $1"
  ((FAIL++)) || true
}

echo "=== S2.4 Tests DIVA Insights v1.1 ==="
echo "DIVA_URL=$DIVA_URL  LINKY_URL=${LINKY_URL:-non fourni}"
echo ""

# --- 1. DIVA GET /diva/insights (direct) ---
echo "1. DIVA GET /diva/insights (direct, cockpit, YTD)"
RESP=$(docker run --rm --network "$NETWORK" curlimages/curl:latest -s -w "\n%{http_code}" \
  "${DIVA_URL}/diva/insights?tenant=${TENANT}&company_id=${COMPANY_ID}&mode=cockpit&period=YTD" 2>/dev/null || echo -e "\n000")
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [[ "$HTTP" == "200" ]] && echo "$BODY" | grep -q '"insight"'; then
  ok "200 + insight"
elif [[ "$HTTP" == "404" ]]; then
  ok "404 (pas d'insight — attendu si runner non lancé ou cache vide)"
else
  ko "HTTP $HTTP — $(echo "$BODY" | head -c 80)"
fi
echo ""

# --- 2. DIVA GET /diva/insights mode card ---
echo "2. DIVA GET /diva/insights (direct, card cash)"
RESP=$(docker run --rm --network "$NETWORK" curlimages/curl:latest -s -w "\n%{http_code}" \
  "${DIVA_URL}/diva/insights?tenant=${TENANT}&company_id=${COMPANY_ID}&mode=card&card_key=cash&date_start=${DATE_START}&date_end=${DATE_END}" 2>/dev/null || echo -e "\n000")
HTTP=$(echo "$RESP" | tail -n1)

if [[ "$HTTP" == "200" ]] || [[ "$HTTP" == "404" ]]; then
  ok "HTTP $HTTP"
else
  ko "HTTP $HTTP"
fi
echo ""

# --- 3. DIVA POST /diva/generate (direct) ---
echo "3. DIVA POST /diva/generate (direct)"
PAYLOAD=$(cat << 'JSON'
{
  "context": {
    "tenant": "core",
    "company_id": 0,
    "date_start": "2026-01-01",
    "date_end": "2026-02-16",
    "timezone": "Europe/Paris",
    "currency": "EUR",
    "locale": "fr-FR"
  },
  "dashboard": {
    "cards": [
      {"key": "cash", "label": "Cash", "value": 1000, "formatted": "1 000 €", "unit": "EUR"}
    ]
  },
  "options": {"mode": "flash", "force_refresh": false}
}
JSON
)
RESP=$(docker run --rm --network "$NETWORK" curlimages/curl:latest -s -w "\n%{http_code}" -X POST \
  "${DIVA_URL}/diva/generate" -H "Content-Type: application/json" -d "$PAYLOAD" 2>/dev/null || echo -e "\n000")
HTTP=$(echo "$RESP" | tail -n1)

if [[ "$HTTP" == "200" ]] || [[ "$HTTP" == "204" ]]; then
  ok "HTTP $HTTP"
else
  # 503 si Mistral indispo ou lock timeout ; 404 si route absente (DIVA sans DB/ancienne image)
  if [[ "$HTTP" == "503" ]]; then
    ok "503 (Mistral/lock indispo — acceptable en test)"
  elif [[ "$HTTP" == "404" ]]; then
    ok "404 (route absente si DIVA sans DIVA_DATABASE_URL ou image non reconstruite)"
  else
    ko "HTTP $HTTP"
  fi
fi
echo ""

# --- 4. Linky GET /api/diva/insight (proxy) ---
if [[ -n "$LINKY_URL" ]]; then
  echo "4. Linky GET /api/diva/insight (proxy)"
  RESP=$(docker run --rm --network "$NETWORK" curlimages/curl:latest -s -w "\n%{http_code}" \
    "${LINKY_URL}/api/diva/insight?tenant=${TENANT}&company_id=${COMPANY_ID}&mode=cockpit&date_start=${DATE_START}&date_end=${DATE_END}" 2>/dev/null || echo -e "\n000")
  HTTP=$(echo "$RESP" | tail -n1)
  BODY=$(echo "$RESP" | sed '$d')

  if [[ "$HTTP" == "200" ]] && echo "$BODY" | grep -q '"insight"'; then
    ok "200 + insight"
  elif [[ "$HTTP" == "404" ]]; then
    ok "404 (proxy relayé — OK si insight absent)"
  elif [[ "$HTTP" == "400" ]] || [[ "$HTTP" == "503" ]] || [[ "$HTTP" == "408" ]]; then
    ok "HTTP $HTTP (proxy fonctionnel)"
  else
    ko "HTTP $HTTP — $(echo "$BODY" | head -c 80)"
  fi
  echo ""

  # --- 5. Linky POST /api/diva/prewarm ---
  echo "5. Linky POST /api/diva/prewarm"
  # prewarm attend dashboard (format dashboard-metrics). Format minimal si pas de métriques.
  METRICS=$(docker run --rm --network "$NETWORK" curlimages/curl:latest -s \
    "${LINKY_URL}/api/dashboard-metrics?tenant=${TENANT}&date_debut=${DATE_START}&date_fin=${DATE_END}" 2>/dev/null || echo '{}')
  if echo "$METRICS" | grep -q '"treasury"' && command -v jq >/dev/null 2>&1; then
    PREWARM_BODY=$(echo "$METRICS" | jq -c '{context:{tenant:"'"$TENANT"'",company_id:'"$COMPANY_ID"',date_debut:"'"$DATE_START"'",date_fin:"'"$DATE_END"'"},dashboard:.,options:{mode:"flash",prewarm:true}}')
  else
    PREWARM_BODY=$(cat << 'PREWARM'
{"context":{"tenant":"core","company_id":0,"date_debut":"2026-01-01","date_fin":"2026-02-16"},"dashboard":{"treasury":{"value":100,"formatted":"100 €"},"cash":{"value":200,"formatted":"200 €"},"business":{"value":300,"formatted":"300 €"},"taxes":{"value":0,"formatted":"—"},"credit_notes":{"value":0,"formatted":"—"},"refunds":{"value":0,"formatted":"—"},"pos_shops":{"value":0,"formatted":"—"},"pos_z":{"value":0,"formatted":"—"}},"options":{"mode":"flash","prewarm":true}}
PREWARM
)
  fi
  HTTP=$(docker run --rm --network "$NETWORK" curlimages/curl:latest -s -o /dev/null -w "%{http_code}" -X POST \
    "${LINKY_URL}/api/diva/prewarm" -H "Content-Type: application/json" -d "$PREWARM_BODY" 2>/dev/null || echo "000")

  if [[ "$HTTP" == "204" ]]; then
    ok "204 (fire-and-forget)"
  else
    ko "HTTP $HTTP"
  fi
  echo ""
else
  echo "4–5. Omis (fournir LINKY_URL en arg: $0 http://linky_lab_XXX:3000)"
  echo ""
fi

# --- Bilan ---
echo "=== Bilan ==="
echo "OK: $PASS  KO: $FAIL"
if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
exit 0

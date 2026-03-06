#!/usr/bin/env bash
# Diagnostic "Analyse expirée" — reproduit EXACTEMENT le flux navigateur (Linky → DIVA)
# Usage : ./scripts/diagnostic_diva_analyse_expiree.sh
# Prérequis : docker, dorevia-network, DIVA + Linky lab démarrés

set -e

# Période : passer ytd|2|3|... en $1 (défaut: ytd). Ex: ./script 2  → Février
PERIOD_KEY="${1:-ytd}"
YEAR=${2:-$(date +%Y)}

if [[ "$PERIOD_KEY" == "ytd" ]]; then
  MONTH=$(date +%m)
  LAST_DAY=$(date -d "${YEAR}-${MONTH}-01 + 1 month - 1 day" +%Y-%m-%d 2>/dev/null || date -v1d -v+1m -v-1d +%Y-%m-%d 2>/dev/null)
  DATE_DEBUT="${YEAR}-01-01"
  DATE_FIN="${LAST_DAY}"
  LABEL="YTD ${YEAR}"
else
  # Mois 1-12 (Février = 2)
  DATE_DEBUT="${YEAR}-$(printf '%02d' "$PERIOD_KEY")-01"
  LAST_DAY=$(date -d "${DATE_DEBUT} + 1 month - 1 day" +%Y-%m-%d 2>/dev/null || date -v1d -v+1m -v-1d +%Y-%m-%d 2>/dev/null)
  DATE_FIN="${LAST_DAY}"
  LABEL="Mois $PERIOD_KEY ${YEAR}"
fi

LINKY="http://linky_lab_sarl-la-platine:3000"
TENANT="sarl-la-platine"
COMPANY_ID=0  # "Tout" en Linky

echo "=== Diagnostic Analyse expirée ==="
echo "Scénario : $TENANT, company_id=$COMPANY_ID (Tout), $LABEL : $DATE_DEBUT → $DATE_FIN"
echo ""

# 0. Jobs dans le store (pour comparaison)
echo "0. Derniers jobs dans diva_analysis :"
docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -t -c \
  "SELECT LEFT(context_hash,20)||'...', status, started_at FROM diva_analysis ORDER BY started_at DESC LIMIT 5;" 2>/dev/null || echo "   (DB non accessible)"
echo ""

# 1. GET dashboard-metrics — exactement comme DivaFlashBlock
echo "1. GET /api/dashboard-metrics..."
METRICS=$(docker run --rm --network dorevia-network curlimages/curl:latest -s \
  "${LINKY}/api/dashboard-metrics?tenant=${TENANT}&date_debut=${DATE_DEBUT}&date_fin=${DATE_FIN}" 2>/dev/null)

if ! echo "$METRICS" | grep -q '"treasury"'; then
  echo "   ❌ Linky injoignable ou erreur. Vérifier : docker exec linky_lab_sarl-la-platine wget -qO- http://localhost:3000/api/dashboard-metrics"
  echo "   Réponse : $(echo "$METRICS" | head -c 200)"
  exit 1
fi
echo "   ✓ Métriques OK"

# 2. POST /api/diva/explain/async — MÊME requête que le navigateur (via proxy Linky)
# Le body est { context, dashboard: metrics, options } — Linky transforme en cards côté route
echo "2. POST /api/diva/explain/async (flux navigateur via Linky)..."
BODY=$(cat << BODYEOF
{
  "context": {
    "tenant": "${TENANT}",
    "company_id": ${COMPANY_ID},
    "date_debut": "${DATE_DEBUT}",
    "date_fin": "${DATE_FIN}",
    "currency": "EUR",
    "locale": "fr-FR"
  },
  "dashboard": ${METRICS},
  "options": { "mode": "flash", "force_refresh": true }
}
BODYEOF
)

RESP=$(docker run --rm --network dorevia-network curlimages/curl:latest -s -w "\n%{http_code}" -X POST \
  "${LINKY}/api/diva/explain/async" -H "Content-Type: application/json" -d "$BODY" 2>/dev/null)

HTTP_CODE=$(echo "$RESP" | tail -n1)
RESP_BODY=$(echo "$RESP" | sed '$d')
echo "   HTTP $HTTP_CODE"

if [[ "$HTTP_CODE" == "200" ]] && echo "$RESP_BODY" | grep -q '"flash"'; then
  echo "   ✓ Cache hit — flash immédiat"
  echo "$RESP_BODY" | grep -o '"headline":"[^"]*"' | head -1
  exit 0
fi

if [[ "$HTTP_CODE" != "202" ]]; then
  echo "   Réponse : $(echo "$RESP_BODY" | head -c 300)"
  if [[ "$HTTP_CODE" == "500" ]] || [[ "$HTTP_CODE" == "502" ]] || [[ "$HTTP_CODE" == "503" ]]; then
    echo "   ❌ Erreur proxy Linky → DIVA"
  fi
  exit 1
fi

CONTEXT_HASH=$(echo "$RESP_BODY" | grep -o '"context_hash":"[^"]*"' | cut -d'"' -f4)
CONTEXT_HASH=${CONTEXT_HASH:-$(echo "$RESP_BODY" | grep -o '"job_id":"[^"]*"' | cut -d'"' -f4)}
[[ -z "$CONTEXT_HASH" ]] && echo "   ❌ Pas de context_hash" && exit 1
echo "   context_hash=$CONTEXT_HASH"

# 3. Poll via Linky (comme le navigateur : /api/diva/jobs/{hash})
echo "3. Poll GET /api/diva/jobs/{hash} (max 90 s)..."
ENCODED_HASH=$(echo "$CONTEXT_HASH" | sed 's/:/%3A/g')
START=$(date +%s)

while true; do
  POLL=$(docker run --rm --network dorevia-network curlimages/curl:latest -s -w "\n%{http_code}" \
    "${LINKY}/api/diva/jobs/${ENCODED_HASH}" 2>/dev/null)
  CODE=$(echo "$POLL" | tail -n1)
  PBODY=$(echo "$POLL" | sed '$d')
  ELAPSED=$(($(date +%s) - START))
  STATUS=$(echo "$PBODY" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

  printf "   [%2ds] HTTP %s status=%s\n" "$ELAPSED" "$CODE" "$STATUS"

  if [[ "$CODE" == "200" ]] && echo "$PBODY" | grep -q '"status":"done"'; then
    echo "   ✓ Succès"
    echo "$PBODY" | grep -o '"headline":"[^"]*"' | head -1
    exit 0
  fi

  if [[ "$CODE" == "404" ]]; then
    echo ""
    echo "   ❌ 404 — Même erreur que le navigateur."
    echo ""
    echo "   Test direct DIVA (bypass Linky) :"
    DIRECT=$(docker run --rm --network dorevia-network curlimages/curl:latest -s -o /dev/null -w "%{http_code}" \
      "http://diva:8010/diva/jobs/${ENCODED_HASH}" 2>/dev/null)
    echo "   GET diva:8010/diva/jobs/{hash} → HTTP $DIRECT"
    if [[ "$DIRECT" == "200" ]] || [[ "$DIRECT" == "202" ]]; then
      echo "   → DIVA a le job ! Le problème vient du proxy Linky (routage, timeout)."
    else
      echo "   → DIVA ne trouve pas le job non plus. Store Postgres ou hash incorrect."
      echo "   Vérifier diva_analysis : SELECT * FROM diva_analysis WHERE context_hash LIKE '$(echo $CONTEXT_HASH | sed 's/sha256://')%';"
    fi
    exit 1
  fi

  [[ $ELAPSED -ge 90 ]] && echo "   ❌ Timeout" && exit 1
  sleep 2
done

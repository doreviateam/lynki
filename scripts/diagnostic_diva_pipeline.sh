#!/bin/bash
# Diagnostic pipeline DIVA — cockpit / Focus Card
# Vérifie : prewarm, generate, GET insight, hash, status
# Usage : ./scripts/diagnostic_diva_pipeline.sh [LINKY_URL] [MODE] [CARD_KEY]

set -e
LINKY_URL="${1:-http://localhost:3000}"
MODE="${2:-cockpit}"
CARD_KEY="${3:-}"
TENANT="${DIVA_TENANT:-sarl-la-platine}"
COMPANY_ID="${DIVA_COMPANY_ID:-1}"
# Exercice à date 2026
DATE_START="2026-01-01"
DATE_END="2026-02-18"  # Ajuster selon la date du jour

DIVA_URL="${DIVA_URL:-http://localhost:8010}"

echo "=== Diagnostic pipeline DIVA ==="
echo "Linky: $LINKY_URL | DIVA: $DIVA_URL | Mode: $MODE | Card: ${CARD_KEY:-—}"
echo ""

# 1. GET insight (état actuel)
echo "1. GET /api/diva/insight"
INSIGHT_PARAMS="tenant=$TENANT&company_id=$COMPANY_ID&mode=$MODE&date_start=$DATE_START&date_end=$DATE_END"
[ -n "$CARD_KEY" ] && INSIGHT_PARAMS="$INSIGHT_PARAMS&card_key=$CARD_KEY"
INSIGHT_RES=$(curl -s -w "\n%{http_code}" "${LINKY_URL}/api/diva/insight?${INSIGHT_PARAMS}" 2>/dev/null || echo "000")
INSIGHT_HTTP=$(echo "$INSIGHT_RES" | tail -1)
INSIGHT_BODY=$(echo "$INSIGHT_RES" | sed '$d')
echo "   HTTP: $INSIGHT_HTTP"
if [ "$INSIGHT_HTTP" = "200" ]; then
  echo "   OK — insight trouvé"
  echo "$INSIGHT_BODY" | jq -r '.insight.message_text // .insight.flash.headline // "—"' 2>/dev/null | head -3
else
  echo "   → 404 ou erreur : pas d'insight en cache"
fi
echo ""

# 2. Dashboard-metrics (pour prewarm)
echo "2. GET /api/dashboard-metrics"
METRICS=$(curl -s "${LINKY_URL}/api/dashboard-metrics?tenant=$TENANT&date_debut=$DATE_START&date_fin=$DATE_END&company_id=$COMPANY_ID" 2>/dev/null || echo "{}")
if [ -n "$METRICS" ] && [ "$METRICS" != "{}" ]; then
  echo "   OK — métriques récupérées"
else
  echo "   KO — métriques indisponibles"
fi
echo ""

# 3. Prewarm (déclenche generate)
echo "3. POST /api/diva/prewarm"
PREWARM_BODY=$(echo "$METRICS" | jq -c '{context:{tenant:"'"$TENANT"'",company_id:'"$COMPANY_ID"',date_debut:"'"$DATE_START"'",date_fin:"'"$DATE_END"'"},dashboard:.}' 2>/dev/null)
[ -n "$CARD_KEY" ] && PREWARM_BODY=$(echo "$PREWARM_BODY" | jq -c --arg k "$CARD_KEY" '. + {focus_card:$k}')
PREWARM_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$PREWARM_BODY" "${LINKY_URL}/api/diva/prewarm" 2>/dev/null || echo "000")
echo "   HTTP: $PREWARM_HTTP (204 attendu)"
echo ""

# 4. Attendre 5s puis GET à nouveau
echo "4. Attente 5s puis GET insight"
sleep 5
INSIGHT_RES2=$(curl -s -w "\n%{http_code}" "${LINKY_URL}/api/diva/insight?${INSIGHT_PARAMS}" 2>/dev/null || echo "000")
INSIGHT_HTTP2=$(echo "$INSIGHT_RES2" | tail -1)
echo "   HTTP: $INSIGHT_HTTP2"
if [ "$INSIGHT_HTTP2" = "200" ]; then
  echo "   OK — insight disponible après prewarm"
else
  echo "   → Toujours 404 — la génération peut prendre 30–40 s (Mistral)"
  echo "   Réessayer : ./scripts/diagnostic_diva_pipeline.sh $LINKY_URL $MODE $CARD_KEY"
fi
echo ""

# 5. GET direct DIVA (si accessible)
echo "5. GET direct DIVA /diva/insights"
DIVA_PARAMS="tenant=$TENANT&company_id=$COMPANY_ID&mode=$MODE&date_start=$DATE_START&date_end=$DATE_END"
[ -n "$CARD_KEY" ] && DIVA_PARAMS="$DIVA_PARAMS&card_key=$CARD_KEY"
DIVA_GET=$(curl -s -w "\n%{http_code}" "${DIVA_URL}/diva/insights?${DIVA_PARAMS}" 2>/dev/null || echo "000")
DIVA_HTTP=$(echo "$DIVA_GET" | tail -1)
echo "   HTTP: $DIVA_HTTP"
echo ""

echo "=== Résumé ==="
[ "$INSIGHT_HTTP" = "200" ] && echo "• Insight initial : OK" || echo "• Insight initial : absent (404)"
[ "$PREWARM_HTTP" = "204" ] && echo "• Prewarm : envoyé (204)" || echo "• Prewarm : $PREWARM_HTTP"
[ "$INSIGHT_HTTP2" = "200" ] && echo "• Insight après 5s : OK" || echo "• Insight après 5s : toujours absent (attendre 30–40 s)"
[ "$DIVA_HTTP" = "200" ] && echo "• DIVA direct : OK" || echo "• DIVA direct : $DIVA_HTTP (vérifier DIVA_URL, DIVA_DATABASE_URL)"

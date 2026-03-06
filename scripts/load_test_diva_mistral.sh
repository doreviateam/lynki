#!/usr/bin/env bash
# Load test DIVA + Mistral
# - Mesure RAM/CPU Mistral
# - 10 appels simultanés (5 cache + 5 force_refresh)
# - 20 appels séquentiels → latence moyenne
# Usage : Mistral + DIVA up, depuis racine projet

set -e

DIVA_URL="${DIVA_URL:-http://diva:8010}"
NETWORK="${NETWORK:-dorevia-network}"
REPORT="/tmp/load_test_diva_$(date +%Y%m%d_%H%M%S).txt"

PAYLOAD_CACHE='{"context":{"tenant":"core","company_id":1,"date_start":"2025-01-01","date_end":"2025-01-31","currency":"EUR"},"dashboard":{"cards":[{"key":"cash","label":"Cash","value":1400952.21,"formatted":"+1 400 952,21 €","unit":"EUR"},{"key":"treasury_validated_pct","label":"Trésorerie validée","value":45,"formatted":"45 %","unit":"%"}]},"options":{"mode":"flash","force_refresh":false}}'
PAYLOAD_REFRESH='{"context":{"tenant":"core","company_id":1,"date_start":"2025-01-01","date_end":"2025-01-31","currency":"EUR"},"dashboard":{"cards":[{"key":"cash","label":"Cash","value":1400952.21,"formatted":"+1 400 952,21 €","unit":"EUR"},{"key":"treasury_validated_pct","label":"Trésorerie validée","value":45,"formatted":"45 %","unit":"%"}]},"options":{"mode":"flash","force_refresh":true}}'

do_curl() {
  docker run --rm --network "$NETWORK" curlimages/curl:latest -s -w "%{time_total}" -o /dev/null \
    -X POST "$DIVA_URL/diva/explain" -H "Content-Type: application/json" -d "$1"
}

exec 3>&1
exec 1>"$REPORT"
exec 2>&1

echo "=== Load test DIVA + Mistral ==="
echo "DIVA_URL=$DIVA_URL | Réseau=$NETWORK"
echo ""

echo "--- 1. RAM/CPU Mistral (avant charge) ---"
docker stats mistral-llamacpp --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null || echo "mistral-llamacpp absent"
echo ""

echo "--- 2. Pré-remplissage cache (1 appel) ---"
L0=$(do_curl "$PAYLOAD_CACHE")
echo "Premier appel : ${L0}s"
sleep 1
echo ""

echo "--- 3. 10 appels simultanés (5 cache + 5 force_refresh) ---"
TDIR=$(mktemp -d)
for i in 1 2 3 4 5; do (do_curl "$PAYLOAD_CACHE"; echo) > "$TDIR/c$i" & done
for i in 1 2 3 4 5; do (do_curl "$PAYLOAD_REFRESH"; echo) > "$TDIR/r$i" & done
wait
echo "Cache (5): $(cat $TDIR/c* 2>/dev/null | tr '\n' ' ')"
echo "Refresh (5): $(cat $TDIR/r* 2>/dev/null | tr '\n' ' ')"
echo ""

echo "--- 4. RAM/CPU Mistral (sous charge) ---"
docker stats mistral-llamacpp --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null || true
echo ""

echo "--- 5. 20 appels séquentiels ---"
LAT20=""
for i in $(seq 1 20); do
  L=$(do_curl "$PAYLOAD_CACHE")
  echo "  $i: ${L}s"
  LAT20="${LAT20:+$LAT20 }$L"
done

SUM10=$(cat "$TDIR"/c* "$TDIR"/r* 2>/dev/null | paste -sd+ | bc 2>/dev/null || echo 0)
AVG10=$(echo "scale=3; $SUM10/10" | bc 2>/dev/null || echo "N/A")
SUM20=$(echo "$LAT20" | tr ' ' '+' | bc 2>/dev/null || echo 0)
AVG20=$(echo "scale=4; $SUM20/20" | bc 2>/dev/null || echo "N/A")
AVG10=$(printf "%.3f" "${AVG10:-0}" 2>/dev/null || echo "$AVG10")
AVG20=$(printf "%.4f" "${AVG20:-0}" 2>/dev/null || echo "$AVG20")
echo ""
echo "=== RÉSULTATS ==="
echo "Moyenne 10 simultanés (5 cache + 5 force_refresh) : ${AVG10}s"
echo "Moyenne 20 séquentiels (cache) : ${AVG20}s"
echo "Rapport : $REPORT"

# Logger latence moyenne sur 20 appels
LOG_FILE="${LOG_FILE:-/tmp/diva_load_test.log}"
echo "$(date -Iseconds) | latence_moyenne_20_appels_s=${AVG20} | latence_moyenne_10_simultanes_s=${AVG10}" >> "$LOG_FILE" 2>/dev/null || echo "Log: $LOG_FILE (écriture désactivée)"
echo ""

rm -rf "$TDIR"
exec 1>&3
exec 3>&-

echo ""
echo "Rapport écrit : $REPORT"
cat "$REPORT"

#!/usr/bin/env bash
# Test intégration Concurrency Guard — SPEC_ConcurrencyGuard §10.2
# 5 requêtes simultanées force_refresh, même context_hash
# Attendu : 1 inférence Mistral, 4 réponses refresh_in_progress=true
# Usage : Mistral + DIVA up, depuis racine projet

set -e

DIVA_URL="${DIVA_URL:-http://diva:8010}"
NETWORK="${NETWORK:-dorevia-network}"

PAYLOAD='{"context":{"tenant":"core","company_id":1,"date_start":"2025-01-01","date_end":"2025-01-31","currency":"EUR"},"dashboard":{"cards":[{"key":"cash","label":"Cash","value":1400952.21,"formatted":"+1 400 952,21 €","unit":"EUR"}]},"options":{"mode":"flash","force_refresh":true}}'

echo "=== Test intégration Concurrency Guard ==="
echo "5 requêtes simultanées force_refresh (même context_hash)"
echo ""

TDIR=$(mktemp -d)
for i in 1 2 3 4 5; do
  (
    RESP=$(docker run --rm --network "$NETWORK" curlimages/curl:latest -s -X POST "$DIVA_URL/diva/explain" \
      -H "Content-Type: application/json" -d "$PAYLOAD")
    if echo "$RESP" | grep -q '"refresh_in_progress":true'; then
      echo "progress" > "$TDIR/r$i"
    else
      echo "success" > "$TDIR/r$i"
    fi
  ) &
done
wait

COUNT_PROGRESS=$(grep -l "progress" "$TDIR"/r* 2>/dev/null | wc -l)
COUNT_OK=$(grep -l "success" "$TDIR"/r* 2>/dev/null | wc -l)

echo "Réponses refresh_in_progress : $COUNT_PROGRESS"
echo "Réponses succès (inférence) : $COUNT_OK"
echo ""

if [ "$COUNT_PROGRESS" -eq 4 ] && [ "$COUNT_OK" -eq 1 ]; then
  echo "✓ Guard OK : 1 inférence, 4 rejets soft"
else
  echo "⚠ Attendu : 1 succès, 4 refresh_in_progress. Obtenu : $COUNT_OK succès, $COUNT_PROGRESS refresh_in_progress"
fi

rm -rf "$TDIR"
echo ""
echo "=== Fin ==="

#!/usr/bin/env bash
# Diagnostic flux async DIVA — localise l'étape en échec
# Usage : depuis la racine du projet

set -e

echo "=== Diagnostic DIVA async ==="
echo ""

# 1. Mistral
echo "1. Mistral health..."
if docker run --rm --network dorevia-network curlimages/curl:latest -s -f http://mistral-llamacpp:8000/health > /dev/null 2>&1; then
  echo "   ✓ OK"
else
  echo "   ❌ KO"
  exit 1
fi

# 2. DIVA health
echo "2. DIVA health..."
if docker run --rm --network dorevia-network curlimages/curl:latest -s -f http://diva:8010/health > /dev/null 2>&1; then
  echo "   ✓ OK"
else
  echo "   ❌ KO"
  exit 1
fi

# 3. POST /diva/explain/async (8 KPI comme Linky)
echo "3. POST /diva/explain/async (8 KPI)..."
PAYLOAD='{"context":{"tenant":"sarl-la-platine","company_id":1,"date_start":"2026-01-01","date_end":"2026-12-31","currency":"EUR"},"dashboard":{"cards":[{"key":"cash","label":"Cash","value":1400952.21,"formatted":"+1 400 952,21 €","unit":"EUR"},{"key":"treasury_validated_pct","label":"Trésorerie validée","value":0,"formatted":"0 %","unit":"%"},{"key":"business","label":"Business","value":1162748.1,"unit":"EUR"},{"key":"taxes","label":"Taxes","value":231097.31,"unit":"EUR"},{"key":"credit_notes","label":"Notes de crédit","value":0,"unit":"EUR"},{"key":"refunds","label":"Remboursements","value":-1686.84,"unit":"EUR"},{"key":"pos_shops","label":"POS magasins","value":4213.2,"unit":"EUR"},{"key":"pos_z","label":"Z de caisse","value":null,"unit":"EUR"}]},"options":{"mode":"flash","force_refresh":true}}'

RESP=$(docker run --rm --network dorevia-network curlimages/curl:latest -s -w "\n%{http_code}" -X POST http://diva:8010/diva/explain/async \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

echo "   HTTP $HTTP_CODE"
echo "   Body: $BODY" | head -c 300
echo ""

if [[ "$HTTP_CODE" == "200" ]] && echo "$BODY" | grep -q '"flash"'; then
  echo "   ✓ Cache hit — flash retourné immédiatement"
  exit 0
fi

if [[ "$HTTP_CODE" != "202" ]]; then
  echo "   ❌ Attendu 202 ou 200"
  exit 1
fi

CONTEXT_HASH=$(echo "$BODY" | grep -o '"context_hash":"[^"]*"' | cut -d'"' -f4)
if [[ -z "$CONTEXT_HASH" ]]; then
  CONTEXT_HASH=$(echo "$BODY" | grep -o '"job_id":"[^"]*"' | cut -d'"' -f4)
fi
if [[ -z "$CONTEXT_HASH" ]]; then
  echo "   ❌ Pas de context_hash dans la réponse"
  exit 1
fi
echo "   ✓ context_hash=$CONTEXT_HASH"

# 4. Poll GET /diva/jobs/{context_hash}
echo "4. Poll GET /diva/jobs/$CONTEXT_HASH (max 120 s pour 8 KPI)..."
START=$(date +%s)
MAX_WAIT=120

while true; do
  POLL_RESP=$(docker run --rm --network dorevia-network curlimages/curl:latest -s -w "\n%{http_code}" "http://diva:8010/diva/jobs/$CONTEXT_HASH")
  POLL_CODE=$(echo "$POLL_RESP" | tail -n1)
  POLL_BODY=$(echo "$POLL_RESP" | sed '$d')

  ELAPSED=$(($(date +%s) - START))
  echo "   [$ELAPSED s] HTTP $POLL_CODE status=$(echo "$POLL_BODY" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"

  if [[ "$POLL_CODE" == "200" ]]; then
    if echo "$POLL_BODY" | grep -q '"status":"done"'; then
      echo "   ✓ Job terminé avec succès"
      echo "$POLL_BODY" | grep -o '"headline":"[^"]*"' | head -1
      exit 0
    fi
    if echo "$POLL_BODY" | grep -qE '"status":"(error|failed)"'; then
      echo "   ❌ Job en erreur:"
      echo "$POLL_BODY" | grep -o '"message":"[^"]*"' | head -1
      echo "$POLL_BODY" | grep -o '"code":"[^"]*"' | head -1
      exit 1
    fi
  fi

  if [[ "$POLL_CODE" == "404" ]]; then
    echo "   ❌ Job non trouvé ou expiré"
    exit 1
  fi

  if [[ $ELAPSED -ge $MAX_WAIT ]]; then
    echo "   ❌ Timeout après ${MAX_WAIT}s"
    exit 1
  fi

  sleep 2
done

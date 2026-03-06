#!/bin/bash
# Smoke test Mistral — health + latence
# Usage : ./scripts/smoke_test_mistral.sh
# Prérequis : conteneur mistral-llamacpp running sur dorevia-network

set -e
NETWORK="${MISTRAL_NETWORK:-dorevia-network}"
BASE_URL="http://mistral-llamacpp:8000"

echo "=== Smoke test Mistral ==="
echo "Réseau : $NETWORK"
echo ""

echo "1. Healthcheck..."
HEALTH=$(docker run --rm --network "$NETWORK" curlimages/curl:latest -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" || true)
if [ "$HEALTH" = "200" ]; then
  echo "   ✅ Health OK (HTTP $HEALTH)"
else
  echo "   ❌ Health KO (HTTP $HEALTH)"
  exit 1
fi

echo ""
echo "2. Latence (prompt court, max_tokens=64)..."
RESULT=$(docker run --rm --network "$NETWORK" curlimages/curl:latest -s -w "HTTP=%{http_code} TOTAL=%{time_total}s\n" -o /tmp/mistral_smoke.json \
  -X POST -H "Content-Type: application/json" \
  -d '{"model":"mistral","messages":[{"role":"user","content":"Résume en 10 mots : Dorevia Vault scelle des preuves financières."}],"max_tokens":64,"temperature":0.2}' \
  "$BASE_URL/v1/chat/completions" || true)
echo "   $RESULT"
rm -f /tmp/mistral_smoke.json

echo ""
echo "=== Fin smoke test ==="

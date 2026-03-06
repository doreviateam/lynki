#!/usr/bin/env bash
# Test webhook n8n — workflow « Webhook Echo » (template A minimal)
# Usage: ./scripts/test_n8n_webhook.sh <tenant> <env> [--public]
# Prérequis : importer units/n8n/workflows/webhook-echo.json dans n8n et activer le workflow.
# Sans --public : appelle le conteneur n8n sur le réseau Docker (http://n8n_<env>_<tenant>:5678).
# Avec --public : appelle https://n8n.<env>.<tenant>.doreviateam.com (nécessite DNS/hosts).

set -euo pipefail

TENANT="${1:?tenant requis}"
ENV="${2:?env requis}"
USE_PUBLIC=false
[[ "${3:-}" == "--public" ]] && USE_PUBLIC=true

CONTAINER="n8n_${ENV}_${TENANT}"
WEBHOOK_PATH="web-to-lead"

if [[ "$USE_PUBLIC" == true ]]; then
  BASE_URL="https://n8n.${ENV}.${TENANT}.doreviateam.com"
else
  if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER}$"; then
    echo "Erreur: conteneur $CONTAINER non running"
    exit 1
  fi
  BASE_URL="http://${CONTAINER}:5678"
fi

echo "Test webhook n8n — tenant=$TENANT env=$ENV (public=$USE_PUBLIC)"
echo "URL: $BASE_URL/webhook/$WEBHOOK_PATH"
echo "---"

if [[ "$USE_PUBLIC" == true ]]; then
  RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/webhook/$WEBHOOK_PATH" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test@example.com"}' \
    --connect-timeout 10 --max-time 15 2>&1) || true
else
  RESP=$(docker run --rm --network dorevia-network curlimages/curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST "$BASE_URL/webhook/$WEBHOOK_PATH" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test@example.com"}' \
    --connect-timeout 10 --max-time 15 2>&1) || true
fi

HTTP_CODE=$(echo "$RESP" | grep "HTTP_CODE:" | sed 's/HTTP_CODE://')
BODY=$(echo "$RESP" | sed '/HTTP_CODE:/d')

if [[ "$HTTP_CODE" == "200" ]] && echo "$BODY" | grep -q '"received"'; then
  echo "OK  HTTP $HTTP_CODE — réponse: $BODY"
  exit 0
fi

if [[ -z "$HTTP_CODE" ]]; then
  echo "KO  Pas de réponse (conteneur down, workflow inactif ou URL incorrecte)"
  echo "    Vérifier : 1) workflow webhook-echo importé et activé dans n8n, 2) conteneur $CONTAINER running"
  exit 1
fi

echo "KO  HTTP $HTTP_CODE — $BODY"
echo "    Si 404 : importer units/n8n/workflows/webhook-echo.json dans n8n et activer le workflow."
exit 1

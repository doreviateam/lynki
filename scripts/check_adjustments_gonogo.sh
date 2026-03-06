#!/usr/bin/env bash
# Vérification Go/No-Go endpoint adjustments (CHECKLIST_PROD_READY_ADJUSTMENTS_v1.0 §7, §10).
# Usage : VAULT_URL=https://vault.example.com TENANT=sarl-la-platine ./scripts/check_adjustments_gonogo.sh

set -e

VAULT_URL="${VAULT_URL:-http://localhost:8080}"
TENANT="${TENANT:-sarl-la-platine}"
DATE_DEBUT="${DATE_DEBUT:-2026-01-01}"
DATE_FIN="${DATE_FIN:-2026-12-31}"
MAX_MS="${MAX_MS:-300}"

url="${VAULT_URL%/}/ui/aggregations/adjustments?tenant=${TENANT}&date_debut=${DATE_DEBUT}&date_fin=${DATE_FIN}"

echo "=== Check adjustments endpoint ==="
echo "URL: $url"
echo ""

# Perf (approx: time curl)
start=$(date +%s%3N 2>/dev/null || date +%s)
body=$(curl -sS -w "\n%{http_code}" "$url")
end=$(date +%s%3N 2>/dev/null || date +%s)
code=$(echo "$body" | tail -n1)
json=$(echo "$body" | sed '$d')

if [ -z "$start" ] || [ -z "$end" ]; then
  elapsed_ms="N/A"
else
  elapsed_ms=$((end - start))
fi

if [ "$code" != "200" ]; then
  echo "FAIL: HTTP $code"
  echo "$json" | head -c 500
  exit 1
fi

echo "HTTP 200 OK"
echo ""

# Structure minimale
if ! echo "$json" | grep -q '"total_amount"'; then
  echo "FAIL: response missing total_amount"
  exit 1
fi
if ! echo "$json" | grep -q '"event_count"'; then
  echo "FAIL: response missing event_count"
  exit 1
fi
if ! echo "$json" | grep -q '"currency"'; then
  echo "FAIL: response missing currency"
  exit 1
fi
echo "Structure: total_amount, event_count, currency present"

# Perf
if [ "$elapsed_ms" != "N/A" ] && [ "$elapsed_ms" -gt "$MAX_MS" ]; then
  echo "WARN: latency ${elapsed_ms} ms > ${MAX_MS} ms (checklist §7)"
else
  echo "Latency: ${elapsed_ms} ms (max ${MAX_MS} ms)"
fi

# list=1
url_list="${url}&list=1"
body_list=$(curl -sS "$url_list")
if echo "$body_list" | grep -q '"events"'; then
  echo "list=1: events[] present"
else
  echo "list=1: events key present or empty array"
fi

echo ""
echo "Go/No-Go: endpoint OK. Valider en plus Tests 4 et 5 (connecteur) et cohérence Linky (checklist §10)."
echo ""
echo "Après déploiement (docker-compose up -d vault) :"
echo "  VAULT_URL=http://localhost:8080 TENANT=sarl-la-platine ./scripts/check_adjustments_gonogo.sh"
echo "  Ou en prod : VAULT_URL=https://vault.core-stinger.doreviateam.com TENANT=sarl-la-platine ./scripts/check_adjustments_gonogo.sh"

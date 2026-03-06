#!/usr/bin/env bash
# Test GET /ui/aggregations/sales (SPEC_DOREVIA_UI_CARD_SALES_v1.0)
# Usage:
#   VAULT_URL=http://localhost:8080 ./scripts/test_ui_aggregations_sales.sh
#   ./scripts/test_ui_aggregations_sales.sh   # utilise https://vault.sarl-la-platine.doreviateam.com si pas de VAULT_URL

set -e

BASE="${VAULT_URL:-https://vault.sarl-la-platine.doreviateam.com}"
TENANT="${TENANT:-sarl-la-platine}"
FROM="${DATE_DEBUT:-2026-01-01}"
TO="${DATE_FIN:-2026-02-06}"
GRAN="${GRANULARITY:-month}"

URL="${BASE}/ui/aggregations/sales?tenant=${TENANT}&date_debut=${FROM}&date_fin=${TO}&granularity=${GRAN}"

echo "GET $URL"
echo "---"
curl -sS "$URL" | jq . 2>/dev/null || curl -sS "$URL"

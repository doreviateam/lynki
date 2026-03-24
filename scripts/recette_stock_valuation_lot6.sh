#!/usr/bin/env bash
# Recette Lot 6 — Valeur du stock Option B (ZeDocs/web52)
# Usage :
#   VAULT_URL=http://localhost:8080 STOCK_VALUATION_INTERNAL_TOKEN=secret ./scripts/recette_stock_valuation_lot6.sh
# Depuis réseau Docker : VAULT_URL=http://vault-core-stinger:8080 STOCK_VALUATION_INTERNAL_TOKEN=... ./scripts/recette_stock_valuation_lot6.sh

set -e
VAULT_URL="${VAULT_URL:-http://localhost:8080}"
TOKEN="${STOCK_VALUATION_INTERNAL_TOKEN:-}"
TENANT="${TENANT:-laplatine2026}"
COMPANY_ID="${COMPANY_ID:-odoo:1}"
BASE="${VAULT_URL%/}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}[OK]${NC} $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; return 1; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }

echo "=== Recette Lot 6 — Stock Valuation (Option B) ==="
echo "   VAULT_URL=$BASE"
echo "   TENANT=$TENANT COMPANY_ID=$COMPANY_ID"
echo ""

# Vault joignable ?
if ! curl -sf --connect-timeout 3 "$BASE/health" >/dev/null 2>&1; then
  if curl -s --connect-timeout 2 "$BASE/health" -o /dev/null -w "%{http_code}" 2>/dev/null | grep -q "000"; then
    echo "   Vault inaccessible (connexion refusée ou timeout). Démarrez le Vault puis relancez."
    echo "   Ex: docker compose up -d vault-core-stinger"
    exit 1
  fi
fi

if [ -z "$TOKEN" ]; then
  warn "STOCK_VALUATION_INTERNAL_TOKEN non défini — les appels POST vont renvoyer 401."
  echo "   Définissez-le pour valider R6.1 (POST / internal/stock-valuation-snapshot)."
  echo ""
fi

# --- R6.1.1 POST body valide → 200
echo "--- R6.1.1 POST /internal/stock-valuation-snapshot ---"
AS_OF="2026-03-14"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/internal/stock-valuation-snapshot" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"tenant\":\"$TENANT\",\"company_id\":\"$COMPANY_ID\",\"as_of_date\":\"$AS_OF\",\"value\":12345.67,\"currency\":\"EUR\",\"source\":\"odoo.inventory.valuation\"}" 2>/dev/null)
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP" = "200" ]; then
  ok "POST → 200, body: $BODY"
else
  fail "POST → $HTTP (attendu 200). body: $BODY"
fi

# --- R6.1.2 GET stock-valuation après POST → 200 + même valeur
echo "--- R6.1.2 GET /ui/aggregations/stock-valuation ---"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/ui/aggregations/stock-valuation?tenant=$TENANT&company_id=$COMPANY_ID" 2>/dev/null)
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP" = "200" ]; then
  if echo "$BODY" | grep -q '"value"'; then
    ok "GET → 200, $BODY"
  else
    fail "GET → 200 mais body sans value: $BODY"
  fi
else
  fail "GET → $HTTP (attendu 200 si POST a réussi). body: $BODY"
fi

# --- R6.1.3 GET sans snapshot → 404
echo "--- R6.1.3 GET sans snapshot → 404 ---"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/ui/aggregations/stock-valuation?tenant=tenant_inexistant&company_id=odoo:99" 2>/dev/null)
HTTP=$(echo "$RESP" | tail -n1)
if [ "$HTTP" = "404" ]; then
  ok "GET (tenant/company inexistant) → 404"
else
  fail "GET → $HTTP (attendu 404)"
fi

# --- R6.1.4 GET stock-series
echo "--- R6.1.4 GET /ui/aggregations/stock-series ---"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/ui/aggregations/stock-series?tenant=$TENANT&company_id=$COMPANY_ID&date_debut=2026-03-01&date_fin=2026-03-31" 2>/dev/null)
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP" = "200" ]; then
  if echo "$BODY" | grep -q '"series"'; then
    ok "GET stock-series → 200, $BODY"
  else
    fail "GET → 200 mais body sans series: $BODY"
  fi
else
  fail "GET stock-series → $HTTP. body: $BODY"
fi

# --- R6.1.5 Upsert : second POST même (tenant, company_id, as_of_date)
echo "--- R6.1.5 Upsert (second POST même date) ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/internal/stock-valuation-snapshot" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"tenant\":\"$TENANT\",\"company_id\":\"$COMPANY_ID\",\"as_of_date\":\"$AS_OF\",\"value\":99999,\"currency\":\"EUR\",\"source\":\"odoo.inventory.valuation\"}" 2>/dev/null)
HTTP=$(echo "$RESP" | tail -n1)
if [ "$HTTP" != "200" ]; then
  fail "Second POST → $HTTP (attendu 200)"
fi
RESP=$(curl -s -w "\n%{http_code}" "$BASE/ui/aggregations/stock-valuation?tenant=$TENANT&company_id=$COMPANY_ID&as_of_date=$AS_OF" 2>/dev/null)
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP" = "200" ] && echo "$BODY" | grep -q '"value":99999'; then
  ok "Upsert OK : GET retourne value=99999"
else
  fail "Après upsert GET → $HTTP ou value != 99999: $BODY"
fi

echo ""
echo "=== R6.1 Vault : fin des vérifications automatiques ==="
echo "   R6.2 (Odoo cron), R6.3 (Linky + alignement Odoo), R6.4 (idempotence en base) : à exécuter manuellement (voir ZeDocs/web52/CHECKLIST_RECETTE_LOT6_VALEUR_STOCK_OPTION_B_v1.0.md)."

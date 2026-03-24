#!/usr/bin/env bash
# Injecte des lignes OD paie (641*) dans le Vault pour obtenir couverture structurelle > 0
# (ZeDocs/web52 — MINI_SPEC_COUVERTURE_STRUCTURELLE_PAIE, R1.2 / R2.2)
#
# Usage :
#   VAULT_URL=http://localhost:8080 TENANT=core ./scripts/seed_payroll_od_couverture_structurelle.sh
#   VAULT_URL=http://localhost:8080 TENANT=core DATE_DEBUT=2026-01-01 DATE_FIN=2026-01-31 ./scripts/seed_payroll_od_couverture_structurelle.sh
#
# Puis ouvrir Linky (ex. http://localhost:13000), tuile Trésorerie : « Présente » + montant.

set -e
VAULT_URL="${VAULT_URL:-http://localhost:8080}"
TENANT="${TENANT:-core}"
DATE_DEBUT="${DATE_DEBUT:-2026-01-01}"
DATE_FIN="${DATE_FIN:-2026-01-31}"
BASE="${VAULT_URL%/}"

# Une ligne 641100 au milieu de la période (ex. 15 du mois)
SEED_DATE="${SEED_DATE:-${DATE_DEBUT:0:7}-15}"
if [[ "$SEED_DATE" == *"-01-15" ]]; then
  : # ok
else
  SEED_DATE="${DATE_DEBUT:0:7}-15"
fi
AMOUNT="${AMOUNT:-12400}"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
ok() { echo -e "${GREEN}[OK]${NC} $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; return 1; }

echo "=== Seed payroll OD — couverture structurelle > 0 ==="
echo "   VAULT_URL=$BASE"
echo "   TENANT=$TENANT DATE_DEBUT=$DATE_DEBUT DATE_FIN=$DATE_FIN"
echo "   Ligne : 641100 $AMOUNT € au $SEED_DATE"
echo ""

# Vault joignable ?
if ! curl -sf --connect-timeout 3 "$BASE/health" -o /dev/null -w "%{http_code}" 2>/dev/null | grep -q "200"; then
  echo "   Vault inaccessible. Démarrez le Vault (ex. docker start vault-core-stinger)."
  exit 1
fi

# POST /api/v1/payroll-od-lines (X-Tenant requis)
BODY=$(cat <<EOF
{
  "lines": [
    {
      "move_id": 9001,
      "line_id": 1,
      "line_date": "$SEED_DATE",
      "account_code": "641100",
      "debit": $AMOUNT,
      "credit": 0,
      "currency": "EUR",
      "state": "posted"
    }
  ]
}
EOF
)

HTTP=$(curl -s -o /tmp/seed_payroll_resp.json -w "%{http_code}" -X POST "$BASE/api/v1/payroll-od-lines" \
  -H "X-Tenant: $TENANT" \
  -H "Content-Type: application/json" \
  -d "$BODY" 2>/dev/null)

if [ "$HTTP" != "201" ] && [ "$HTTP" != "200" ]; then
  echo "   POST /api/v1/payroll-od-lines a renvoyé HTTP $HTTP"
  [ -f /tmp/seed_payroll_resp.json ] && cat /tmp/seed_payroll_resp.json | head -20
  exit 1
fi

ok "Ligne(s) OD paie ingérée(s) (HTTP $HTTP)"

# Vérifier GET /ui/aggregations/payroll
PAYROLL_RESP=$(curl -s "$BASE/ui/aggregations/payroll?tenant=$TENANT&date_debut=$DATE_DEBUT&date_fin=$DATE_FIN" 2>/dev/null)
SOURCE=$(echo "$PAYROLL_RESP" | jq -r '.payroll_source // "unknown"')
TOTAL=$(echo "$PAYROLL_RESP" | jq -r '.total_charges // 0')

if [ "$SOURCE" = "od" ] && [ "$TOTAL" != "0" ] && [ "$TOTAL" != "null" ]; then
  ok "Vault payroll : source=od, total_charges=$TOTAL"
else
  echo "   Vault payroll : source=$SOURCE, total_charges=$TOTAL (attendu od et > 0)"
fi

echo ""
echo "--- Suite ---"
echo "   Linky /api/treasury pour ce tenant + période doit maintenant renvoyer :"
echo "   structural_coverage_available: true, structural_charges_amount: $TOTAL"
echo "   Dans l’UI : tuile Trésorerie → « Présente » et montant (ex. $AMOUNT €)."
echo ""
echo "   Vérification rapide :"
echo "   curl -s \"\${LINKY_URL:-http://localhost:3000}/api/treasury?tenant=$TENANT&date_debut=$DATE_DEBUT&date_fin=$DATE_FIN\" | jq '{ structural_coverage_available, structural_charges_amount }'"

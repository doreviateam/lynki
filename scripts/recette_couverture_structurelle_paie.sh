#!/usr/bin/env bash
# Recette couverture structurelle (ZeDocs/web52 — MINI_SPEC_COUVERTURE_STRUCTURELLE_PAIE)
# Automatise R1.1 à R1.3 de CHECKLIST_RECETTE_COUVERTURE_STRUCTURELLE_PAIE_v1.0.md
#
# Usage :
#   LINKY_URL=http://localhost:3000 ./scripts/recette_couverture_structurelle_paie.sh
#   LINKY_URL=http://localhost:3000 TENANT=laplatine2026 DATE_DEBUT=2026-01-01 DATE_FIN=2026-01-31 ./scripts/recette_couverture_structurelle_paie.sh
#
# Optionnel :
#   EXPECT_STRUCTURAL=1  — exécute aussi R1.2 (attend structural_coverage_available true)
#   EXPECT_STRUCTURAL=0  — exécute aussi R1.3 (attend structural_coverage_available false)

set -e
LINKY_URL="${LINKY_URL:-http://localhost:3000}"
TENANT="${TENANT:-core}"
DATE_DEBUT="${DATE_DEBUT:-2026-01-01}"
DATE_FIN="${DATE_FIN:-2026-01-31}"
BASE="${LINKY_URL%/}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}[OK]${NC} $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; return 1; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }

echo "=== Recette couverture structurelle (Card Trésorerie) ==="
echo "   LINKY_URL=$BASE"
echo "   TENANT=$TENANT DATE_DEBUT=$DATE_DEBUT DATE_FIN=$DATE_FIN"
echo ""

# Linky joignable ?
if ! curl -sf --connect-timeout 3 "$BASE/api/treasury?tenant=$TENANT" -o /dev/null -w "%{http_code}" 2>/dev/null | grep -q "200"; then
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$BASE/api/treasury?tenant=$TENANT" 2>/dev/null || true)
  if [ "$CODE" = "000" ] || [ -z "$CODE" ]; then
    echo "   Linky inaccessible (connexion refusée ou timeout). Démarrez Linky puis relancez."
    echo "   Ex: cd units/dorevia-linky && npm run dev"
    exit 1
  fi
  warn "GET /api/treasury a renvoyé $CODE (attendu 200). On continue pour vérifier la forme de la réponse."
fi

# --- R1.1 Réponse contient structural_coverage_available, structural_charges_amount, structural_charges_breakdown
echo "--- R1.1 GET /api/treasury — champs structural_* présents ---"
URL="$BASE/api/treasury?tenant=$TENANT&date_debut=$DATE_DEBUT&date_fin=$DATE_FIN"
RESP=$(curl -s -w "\n%{http_code}" "$URL" 2>/dev/null)
HTTP=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP" != "200" ]; then
  fail "GET → $HTTP (attendu 200). body: $BODY"
  exit 1
fi

MISSING=""
echo "$BODY" | grep -q '"structural_coverage_available"' || MISSING="$MISSING structural_coverage_available"
echo "$BODY" | grep -q '"structural_charges_amount"'         || MISSING="$MISSING structural_charges_amount"
echo "$BODY" | grep -q '"structural_charges_breakdown"'     || MISSING="$MISSING structural_charges_breakdown"
echo "$BODY" | grep -q '"structural_coverage_ratio"'        || MISSING="$MISSING structural_coverage_ratio"

if [ -n "$MISSING" ]; then
  fail "Body sans clé(s):$MISSING. body (extrait): $(echo "$BODY" | head -c 300)"
  exit 1
fi
ok "R1.1 — structural_coverage_available, structural_charges_amount, structural_charges_breakdown, structural_coverage_ratio présents"

# --- R1.4 (AC5) : pas de champ couverture_structurelle_montant
echo "--- R1.4 AC5 — pas d’assimilation couverture = montant ---"
if echo "$BODY" | grep -q '"couverture_structurelle_montant"'; then
  fail "API ne doit pas exposer couverture_structurelle_montant (AC5)"
  exit 1
fi
ok "R1.4 — aucun champ couverture_structurelle_montant"

# --- R1.2 ou R1.3 selon EXPECT_STRUCTURAL (parsing avec jq si dispo, sinon grep)
if command -v jq >/dev/null 2>&1; then
  AVAILABLE=$(echo "$BODY" | jq -r 'if .structural_coverage_available == true then "true" elif .structural_coverage_available == false then "false" else "unknown" end')
  AMOUNT=$(echo "$BODY" | jq -r 'if .structural_charges_amount == null then "null" else (.structural_charges_amount | tostring) end')
else
  if echo "$BODY" | grep -qE '"structural_coverage_available"[[:space:]]*:[[:space:]]*true'; then
    AVAILABLE="true"
  elif echo "$BODY" | grep -qE '"structural_coverage_available"[[:space:]]*:[[:space:]]*false'; then
    AVAILABLE="false"
  else
    AVAILABLE="unknown"
  fi
  AMOUNT=$(echo "$BODY" | sed -n 's/.*"structural_charges_amount":\s*\([0-9][0-9.]*\).*/\1/p' | head -1)
  [ -z "$AMOUNT" ] && AMOUNT="null"
fi

if [ "${EXPECT_STRUCTURAL:-}" = "1" ]; then
  echo "--- R1.2 Période avec paie → structural_coverage_available true ---"
  if [ "$AVAILABLE" = "true" ]; then
    ok "R1.2 — structural_coverage_available === true"
    if [ -n "$AMOUNT" ] && [ "$AMOUNT" != "null" ] && [ "$AMOUNT" != "0" ]; then
      ok "R1.2 — structural_charges_amount > 0 ($AMOUNT)"
    else
      warn "structural_charges_amount absent ou 0 (attendu > 0 si paie présente)"
    fi
  else
    fail "R1.2 — structural_coverage_available !== true (obtenu: $AVAILABLE). Vérifiez que la période a des OD paie."
    exit 1
  fi
elif [ "${EXPECT_STRUCTURAL:-}" = "0" ]; then
  echo "--- R1.3 Période sans paie → structural_coverage_available false ---"
  if [ "$AVAILABLE" = "false" ]; then
    ok "R1.3 — structural_coverage_available === false"
  else
    fail "R1.3 — structural_coverage_available !== false (obtenu: $AVAILABLE). Attendu pour période sans paie."
    exit 1
  fi
else
  echo "--- R1.2 / R1.3 ---"
  echo "   structural_coverage_available = $AVAILABLE, structural_charges_amount = $AMOUNT"
  echo "   (Optionnel) Pour valider R1.2 : EXPECT_STRUCTURAL=1 $0"
  echo "   (Optionnel) Pour valider R1.3 : EXPECT_STRUCTURAL=0 $0"
fi

echo ""
echo "=== Recette R1 (API) terminée ==="

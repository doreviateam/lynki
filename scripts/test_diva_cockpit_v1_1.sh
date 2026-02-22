#!/usr/bin/env bash
# Tests automatisés — DIVA Cockpit Trésorerie Inducteurs v1.1
# SPEC : ZeDocs/web29/SPEC_DIVA_Cockpit_Tresorerie_Inducteurs_v1.0.md
# Plan : ZeDocs/web29/PLAN_IMPLEMENTATION_DIVA_Cockpit_Tresorerie_Inducteurs_v1.1.md
#
# Ce script teste ce qui est déterministe :
# - Structure dashboard-metrics (data_completeness, _details.treasury)
# - Schéma réponse DIVA (headline, what_i_see, to_check, confidence)
# - Longueur bloc (~10 lignes max)
# - Transmission data_completeness vers DIVA
#
# Usage : depuis la racine du projet (réseau dorevia-network requis)

set -e

LINKY_URL="${LINKY_URL:-http://linky_stinger_sarl-la-platine:3000}"
DIVA_URL="${DIVA_URL:-http://diva:8010}"
TENANT="${TENANT:-sarl-la-platine}"
NETWORK="${DIVA_NETWORK:-dorevia-network}"

PASS=0
FAIL=0

pass() { echo "   ✅ $1"; ((PASS++)) || true; }
fail() { echo "   ❌ $1"; ((FAIL++)) || true; }

echo "=== Tests DIVA Cockpit v1.1 ==="
echo "Linky: $LINKY_URL | DIVA: $DIVA_URL | Tenant: $TENANT"
echo ""

# --- Test 1 : dashboard-metrics — structure data_completeness et _details.treasury ---
echo "1. dashboard-metrics — structure"
DM=$(docker run --rm --network "$NETWORK" curlimages/curl:latest -s \
  "${LINKY_URL}/api/dashboard-metrics?tenant=${TENANT}&date_debut=2025-01-01&date_fin=2025-12-31")

if echo "$DM" | jq -e '.data_completeness' >/dev/null 2>&1; then
  pass "data_completeness présent"
  BHM=$(echo "$DM" | jq -r '.data_completeness.bank_health_metrics')
  if [[ "$BHM" == "absent" || "$BHM" == "partial" || "$BHM" == "complete" ]]; then
    pass "bank_health_metrics = $BHM (valide)"
  else
    fail "bank_health_metrics invalide: $BHM"
  fi
else
  fail "data_completeness absent"
fi

if echo "$DM" | jq -e '._details.treasury' >/dev/null 2>&1; then
  pass "_details.treasury présent"
  for f in unreconciled_lines_count last_statement_import_date journals_count oldest_unreconciled_date; do
    if echo "$DM" | jq -e "._details.treasury | has(\"$f\")" >/dev/null 2>&1; then
      pass "  treasury.$f présent"
    else
      fail "  treasury.$f absent"
    fi
  done
else
  fail "_details.treasury absent"
fi
echo ""

# --- Test 2 : DIVA — payload avec data_completeness absent ---
echo "2. DIVA — data_completeness absent (doit être transmis)"
# Récupérer dashboard depuis dashboard-metrics
DM_JSON=$(docker run --rm --network "$NETWORK" curlimages/curl:latest -s \
  "${LINKY_URL}/api/dashboard-metrics?tenant=${TENANT}&date_debut=2025-01-01&date_fin=2025-12-31")

# Construire payload minimal pour explain
CARDS=$(echo "$DM_JSON" | jq -c '[.treasury, .cash, .business, .taxes, .credit_notes, .refunds, .pos_shops, .pos_z] | map({
  key: (if .value != null then ({"treasury":"treasury_validated_pct","cash":"cash","business":"business","taxes":"taxes","credit_notes":"credit_notes","refunds":"refunds","pos_shops":"pos_shops","pos_z":"pos_z"})[.valueKind] else "pos_z" end),
  label: "x",
  value: .value,
  formatted: .formatted,
  unit: "EUR",
  status: .status,
  status_reason: .status_reason
})' 2>/dev/null) || true

# Payload simplifié pour éviter dépendance au format exact
PAYLOAD_ABSENT=$(cat <<EOF
{
  "context": {"tenant":"$TENANT","date_start":"2025-01-01","date_end":"2025-12-31","currency":"EUR"},
  "dashboard": {
    "cards": [
      {"key":"treasury_validated_pct","label":"Trésorerie","value":0,"formatted":"0 %","unit":"%","status":"watch","status_reason":"Non validée"},
      {"key":"cash","label":"Cash","value":1400000,"formatted":"+ 1 400 000 €","unit":"EUR","status":"watch","status_reason":""},
      {"key":"business","label":"Business","value":1160000,"formatted":"+ 1 160 000 €","unit":"EUR","status":"ok","status_reason":""}
    ],
    "_details": {"treasury":{"reconciled":0,"unreconciled":1000,"total":1000,"currency":"EUR","unreconciled_lines_count":null,"last_statement_import_date":null,"journals_count":null,"oldest_unreconciled_date":null}},
    "data_completeness": {"bank_health_metrics": "absent"}
  },
  "options": {"mode":"flash"}
}
EOF
)

RESP=$(docker run --rm --network "$NETWORK" curlimages/curl:latest -s -X POST "${DIVA_URL}/diva/explain" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD_ABSENT")

if echo "$RESP" | jq -e '.flash.headline' >/dev/null 2>&1; then
  pass "Réponse DIVA a headline"
else
  fail "Réponse DIVA sans headline (ou erreur)"
fi

if echo "$RESP" | jq -e '.flash.what_i_see' >/dev/null 2>&1; then
  pass "Réponse DIVA a what_i_see"
else
  fail "Réponse DIVA sans what_i_see"
fi

if echo "$RESP" | jq -e '.flash.to_check' >/dev/null 2>&1; then
  pass "Réponse DIVA a to_check"
else
  fail "Réponse DIVA sans to_check"
fi

if echo "$RESP" | jq -e '.flash.confidence' >/dev/null 2>&1; then
  pass "Réponse DIVA a confidence"
else
  fail "Réponse DIVA sans confidence"
fi
echo ""

# --- Test 3 : Longueur (what_i_see + headline ≤ ~10 lignes) ---
echo "3. Longueur bloc (≤ ~10 lignes)"
HEADLINE=$(echo "$RESP" | jq -r '.flash.headline // ""')
WHAT_LINES=$(echo "$RESP" | jq -r '.flash.what_i_see // [] | length')
TO_CHECK=$(echo "$RESP" | jq -r '.flash.to_check // [] | length')
TOTAL=$((WHAT_LINES + TO_CHECK + 1))  # +1 pour headline

if [[ $TOTAL -le 12 ]]; then
  pass "Bloc $TOTAL éléments (headline + ${WHAT_LINES} what_i_see + ${TO_CHECK} to_check)"
else
  fail "Bloc trop long: $TOTAL éléments (max ~10-12)"
fi
echo ""

# --- Test 4 : data_completeness absent → contenu recommandé (soft check) ---
echo "4. data_completeness absent — mention rapprochement (soft, LLM peut varier)"
BODY=$(echo "$RESP" | jq -r '.flash.headline + " " + (.flash.what_i_see | join(" ")) + " " + (.flash.to_check | join(" "))')
if echo "$BODY" | grep -qiE "rapprochement|données.*non disponibles|non disponibles"; then
  pass "Mention données rapprochement absentes (ou équivalent)"
else
  echo "   ⚠️  Aucune mention explicite « Données de rapprochement non disponibles » — vérifier manuellement"
  echo "      (LLM peut reformuler; critique si extrapolation ou invention)"
fi
echo ""

# --- Test 5 : Trésorerie 0% + flux — tension discipline (soft check) ---
echo "5. Tréso 0% + flux — règle 16 (soft, LLM peut varier)"
if echo "$BODY" | grep -qiE "discipline|validation.*absente|flux.*présent|incohérence"; then
  pass "Tension discipline/flux exprimée (règle 16)"
else
  echo "   ⚠️  Vérifier manuellement : flux présents mais validation absente doit être explicite"
fi
echo ""

# --- Résumé ---
echo "=== Résumé ==="
echo "Pass: $PASS | Fail: $FAIL"
if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
echo ""
echo "✅ Tests déterministes OK. Tests « soft » (LLM) à valider manuellement si besoin."
echo "   Voir COMPTE_RENDU §8 pour la grille de validation complète."

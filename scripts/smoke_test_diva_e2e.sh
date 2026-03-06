#!/usr/bin/env bash
# Smoke test end-to-end DIVA
# Flux : Mistral + DIVA + Linky — charger page, vérifier synthèse
# SPEC : ZeDocs/web22/PLAN_IMPLEMENTATION_DIVA_SCRUM_v1.0.md US-3.3
# Usage : depuis la racine du projet

set -e

echo "=== Smoke test DIVA e2e ==="
echo ""

# 1. Vérifier Mistral
echo "1. Vérification Mistral..."
if ! docker run --rm --network dorevia-network curlimages/curl:latest -s -f http://mistral-llamacpp:8000/health > /dev/null 2>&1; then
  echo "   ❌ Mistral non accessible. Démarrer : cd units/mistral && docker compose up -d"
  exit 1
fi
echo "   ✓ Mistral OK"

# 2. Vérifier DIVA
echo "2. Vérification DIVA..."
if ! docker run --rm --network dorevia-network curlimages/curl:latest -s -f http://diva:8010/health > /dev/null 2>&1; then
  echo "   ❌ DIVA non accessible. Démarrer : cd units/diva && docker compose up -d"
  exit 1
fi
echo "   ✓ DIVA OK"

# 3. Test direct DIVA
echo "3. Test POST /diva/explain..."
RESP=$(docker run --rm --network dorevia-network curlimages/curl:latest -s -X POST http://diva:8010/diva/explain \
  -H "Content-Type: application/json" \
  -d '{"context":{"tenant":"core","company_id":1,"date_start":"2025-01-01","date_end":"2025-01-31","currency":"EUR"},"dashboard":{"cards":[{"key":"cash","label":"Cash","value":1400952.21,"formatted":"+1 400 952,21 €","unit":"EUR"}]},"options":{"mode":"flash"}}')

if echo "$RESP" | grep -q '"headline"'; then
  echo "   ✓ DIVA répond avec flash"
  LATENCY=$(echo "$RESP" | grep -o '"latency_ms":[0-9]*' | cut -d: -f2)
  echo "   Latence : ${LATENCY:-?} ms"
else
  echo "   ❌ Réponse DIVA invalide"
  echo "$RESP" | head -c 500
  exit 1
fi

echo ""
echo "=== Smoke test terminé avec succès ==="
echo ""
echo "Pour valider l'UI Linky :"
echo "  1. Démarrer Linky (tenant sarl-la-platine ou core)"
echo "  2. Ouvrir la page d'accueil"
echo "  3. Attendre 5 s (debounce) — le bloc DIVA doit apparaître sous la grille"
echo "  4. Vérifier headline, badge confidence, disclaimer"
echo "  5. Tester le bouton « Rafraîchir »"
echo ""

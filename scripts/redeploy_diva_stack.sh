#!/usr/bin/env bash
# Redéploiement stack DIVA (Mistral + DIVA + optionnel Linky)
# Usage : depuis la racine du projet
#   ./scripts/redeploy_diva_stack.sh           # Mistral + DIVA
#   ./scripts/redeploy_diva_stack.sh --linky    # + rebuild Linky + restart UI sarl-la-platine lab

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

WITH_LINKY=false
[[ "${1:-}" == "--linky" ]] && WITH_LINKY=true

echo "=== Redéploiement stack DIVA ==="
echo ""

# 1. Réseau
echo "1. Vérification réseau dorevia-network..."
docker network inspect dorevia-network >/dev/null 2>&1 || docker network create dorevia-network
echo "   ✓ Réseau OK"
echo ""

# 2. Mistral
echo "2. Mistral (llama.cpp)..."
cd "$REPO_ROOT/units/mistral"
docker compose build --quiet 2>/dev/null || true
docker compose up -d
echo "   ✓ Mistral démarré"
echo ""

# 3. DIVA (avec Concurrency Guard)
echo "3. DIVA (Concurrency Guard)..."
cd "$REPO_ROOT/units/diva"
docker compose build
docker compose up -d --force-recreate
echo "   ✓ DIVA démarré"
echo ""

# 4. Optionnel : rebuild Linky + restart UI
if [[ "$WITH_LINKY" == "true" ]]; then
  echo "4. Rebuild Linky + restart UI lab sarl-la-platine..."
  cd "$REPO_ROOT/units/dorevia-linky"
  docker build -t dorevia/linky:latest .
  cd "$REPO_ROOT"
  DIVA_URL=http://diva:8010 bin/dorevia.sh app up ui lab sarl-la-platine
  echo "   ✓ Linky redémarré (image dorevia/linky:latest)"
else
  echo "4. Redémarrer Linky pour appliquer DIVA_URL : bin/dorevia.sh app up ui lab sarl-la-platine"
fi
echo ""

echo "=== Vérification ==="
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "mistral|diva|linky" || true
echo ""
echo "Smoke test : ./scripts/smoke_test_diva_e2e.sh"
echo ""

#!/usr/bin/env bash
# Build & deploy : Vault (core-stinger), Linky lab laplatine2026 + Linky lab o19
#
# NB : l’URL publique https://lab.linky.doreviateam.com/ est routée vers **linky_generic**
# (tenants/linky-generic), pas vers linky_lab_laplatine2026. Pour aligner le lab « visible » :
#   ./scripts/deploy-linky-lab.sh
#
# Usage habituel : on livre Linky sur les deux tenants lab en même temps (même image, deux compose).
#   - tenants/laplatine2026/apps/ui/lab/docker-compose.yml  → linky_lab_laplatine2026
#   - tenants/o19/apps/ui/lab/docker-compose.yml            → linky_lab_o19
#
# Après un build local, aligner la ligne `image:` des DEUX fichiers docker-compose sur LINKY_TAG
# (sinon `docker compose up` continue d'utiliser l'ancien tag).
#
# Réseau Docker : dorevia-network (créé si absent)
#
# Usage :
#   ./scripts/build_deploy_vault_laplatine_o19.sh              # build + deploy
#   ./scripts/build_deploy_vault_laplatine_o19.sh --build-only # build uniquement
#   ./scripts/build_deploy_vault_laplatine_o19.sh --deploy-only # deploy uniquement (images déjà buildées)
#
# Tags par défaut : dorevia/vault:bfr-complet-2026-03-15, dorevia/linky:bfr-complet-2026-03-15
# Surcharge : VAULT_TAG=... LINKY_TAG=... ./scripts/build_deploy_vault_laplatine_o19.sh

set -e
REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$REPO_ROOT"

VAULT_TAG="${VAULT_TAG:-dorevia/vault:bfr-complet-2026-03-15}"
LINKY_TAG="${LINKY_TAG:-dorevia/linky:bfr-complet-2026-03-15}"

BUILD_ONLY=false
DEPLOY_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --build-only)  BUILD_ONLY=true ;;
    --deploy-only) DEPLOY_ONLY=true ;;
  esac
done

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
ok() { echo -e "${GREEN}[OK]${NC} $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; return 1; }

echo "=== Build & deploy — Vault, Linky lab (laplatine2026 + o19) ==="
echo "   VAULT_TAG=$VAULT_TAG"
echo "   LINKY_TAG=$LINKY_TAG"
echo ""

# --- Build ---
if [ "$DEPLOY_ONLY" != "true" ]; then
  echo "--- Build Vault ---"
  docker build -t "$VAULT_TAG" ./sources/vault || { fail "Build Vault"; exit 1; }
  ok "Image $VAULT_TAG"

  echo "--- Build Linky ---"
  docker build -t "$LINKY_TAG" ./units/dorevia-linky || { fail "Build Linky"; exit 1; }
  ok "Image $LINKY_TAG"
fi

[ "$BUILD_ONLY" = "true" ] && { echo "Build only — exit."; exit 0; }

# --- Réseau ---
echo "--- Réseau dorevia-network ---"
if ! docker network inspect dorevia-network &>/dev/null; then
  docker network create dorevia-network || true
  ok "Réseau dorevia-network créé"
else
  ok "Réseau dorevia-network présent"
fi

# --- Deploy Vault (core-stinger) ---
echo "--- Deploy Vault (core-stinger) ---"
COMPOSE_VAULT="tenants/core-stinger/platform/docker-compose.yml"
docker compose -p dorevia_core-stinger_platform -f "$COMPOSE_VAULT" up -d vault-db vault || { fail "Deploy Vault"; exit 1; }
ok "Vault (vault-db + vault) up"

# --- Deploy Linky laplatine2026 ---
echo "--- Deploy Linky laplatine2026 ---"
COMPOSE_LAPLATINE="tenants/laplatine2026/apps/ui/lab/docker-compose.yml"
docker compose -f "$COMPOSE_LAPLATINE" up -d || { fail "Deploy laplatine2026"; exit 1; }
ok "Linky laplatine2026 up"

# --- Deploy Linky o19 ---
echo "--- Deploy Linky o19 ---"
COMPOSE_O19="tenants/o19/apps/ui/lab/docker-compose.yml"
docker compose -f "$COMPOSE_O19" up -d || { fail "Deploy o19"; exit 1; }
ok "Linky o19 up"

echo ""
echo "=== Terminé ==="
echo "   Vault    : vault-core-stinger (port 8080 si exposé)"
echo "   Linky LP  : linky_lab_laplatine2026 (même chaîne que o19)"
echo "   Linky o19 : linky_lab_o19 (même image Linky que laplatine2026 si tags alignés dans les compose)"
echo "   Santé Vault : curl -s http://localhost:8080/health"

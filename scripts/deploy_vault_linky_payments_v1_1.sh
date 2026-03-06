#!/usr/bin/env bash
# Déploiement Vault (routes payments IN/OUT) + Linky (cards Encaissements/Décaissements)
# SPEC_DOREVIA_PAYMENTS_v1.1 — Steps 0–3
# Usage: ./scripts/deploy_vault_linky_payments_v1_1.sh [vault|linky|both]

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VAULT_TAG="${VAULT_IMAGE_TAG:-dorevia/vault:v1.6.0-payments}"
LINKY_TAG="${LINKY_IMAGE_TAG:-dorevia/linky:v1.1-payments}"

do_vault() {
  echo "=== Build image Vault: $VAULT_TAG ==="
  docker build -t "$VAULT_TAG" "$ROOT_DIR/sources/vault"
  echo "Image construite: $VAULT_TAG"
  echo ""
  echo "Pour déployer, mettre à jour le compose platform (vault) avec:"
  echo "  image: $VAULT_TAG"
  echo "Puis: docker compose -f <compose> up -d vault"
}

do_linky() {
  echo "=== Build Linky (npm run build) ==="
  cd "$ROOT_DIR/units/dorevia-linky"
  npm ci --prefer-offline --no-audit 2>/dev/null || npm install
  npm run build
  echo ""
  echo "=== Build image Linky: $LINKY_TAG ==="
  docker build -t "$LINKY_TAG" .
  echo "Image construite: $LINKY_TAG"
  echo ""
  echo "Pour déployer Linky, mettre à jour le compose ui (linky) avec:"
  echo "  image: $LINKY_TAG"
  echo "Puis: docker compose -f <compose> up -d linky"
}

case "${1:-both}" in
  vault)  do_vault ;;
  linky)  do_linky ;;
  both)   do_vault; do_linky ;;
  *)      echo "Usage: $0 [vault|linky|both]"; exit 1 ;;
esac

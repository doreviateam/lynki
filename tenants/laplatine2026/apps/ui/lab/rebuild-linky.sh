#!/usr/bin/env bash
# Rebuild Linky lab sans cache Docker + hash git dans le pied de page (UI · <hash>).
# Commande de référence depuis la racine du dépôt : ./scripts/deploy-linky-lab.sh
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# lab → racine dépôt (…/apps/ui/lab → ../../../../.. = 5 × ..)
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"
export LINKY_UI_BUILD_REF
LINKY_UI_BUILD_REF="$(git -C "$REPO_ROOT" rev-parse --short HEAD)"
cd "$SCRIPT_DIR"
echo "LINKY_UI_BUILD_REF=$LINKY_UI_BUILD_REF (repo: $REPO_ROOT)"
docker compose build --no-cache linky
docker compose up -d linky
echo "OK — vérifiez le pied de page : « UI $LINKY_UI_BUILD_REF » et le badge Flux net « PROXY »."

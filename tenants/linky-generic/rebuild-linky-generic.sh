#!/usr/bin/env bash
# Build Linky depuis units/dorevia-linky + redémarre linky_generic (sans cache Docker).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# linky-generic → racine dépôt (tenants/linky-generic → ../..)
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
export LINKY_UI_BUILD_REF
LINKY_UI_BUILD_REF="$(git -C "$REPO_ROOT" rev-parse --short HEAD)"
cd "$SCRIPT_DIR"
echo "LINKY_UI_BUILD_REF=$LINKY_UI_BUILD_REF (repo: $REPO_ROOT)"
docker compose build --no-cache linky
docker compose up -d linky
echo "OK — conteneur linky_generic ; image dorevia/linky:web60-linky-generic ; pied de page UI $LINKY_UI_BUILD_REF"

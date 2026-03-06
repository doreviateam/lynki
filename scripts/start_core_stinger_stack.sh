#!/usr/bin/env bash
# Démarrer la stack DVIG + Vault (tenant core-stinger).
# Usage : depuis la racine du projet : ./scripts/start_core_stinger_stack.sh

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT/tenants/core-stinger/platform"

echo "Démarrage de la stack core-stinger (dvig + vault + vault-db)..."
docker compose -p dorevia_core-stinger_platform up -d

echo ""
echo "État des conteneurs :"
docker compose -p dorevia_core-stinger_platform ps

echo ""
echo "Pour vérifier la santé : ./scripts/check_core_stinger_health.sh"

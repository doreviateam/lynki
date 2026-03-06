#!/usr/bin/env bash
# Vérifier que DVIG et Vault (core-stinger) répondent.
# Usage : depuis la racine du projet : ./scripts/check_core_stinger_health.sh

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=== Conteneurs core-stinger ==="
docker ps --filter name=dvig-core-stinger --filter name=vault-core-stinger --filter name=vault-db-core-stinger \
  --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" 2>/dev/null || true

echo ""
echo "=== Health DVIG (depuis le conteneur) ==="
if docker exec dvig-core-stinger curl -sf http://127.0.0.1:8080/health 2>/dev/null; then
  echo ""
else
  echo "Échec ou conteneur dvig-core-stinger absent."
fi

echo ""
echo "=== Connectivité Caddy → DVIG ==="
if docker exec gateway-caddy wget -qO- http://dvig-core-stinger:8080/health 2>/dev/null; then
  echo ""
  echo "OK : Caddy peut joindre DVIG."
else
  echo "Échec : Caddy ne peut pas joindre DVIG (vérifier que gateway-caddy et dvig-core-stinger sont sur le même réseau)."
fi

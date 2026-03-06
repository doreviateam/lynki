#!/bin/bash
# Affiche les derniers "Event vaulted successfully" avec duration_ms (temps de traitement Vault).
# Nécessite le correctif events.go qui logue duration_ms (ZeDocs/web14/VAULT_DUREE_TRAITEMENT.md).
# Usage: ./scripts/check_vault_event_duration.sh [conteneur_vault] [nombre_lignes]

CONTAINER="${1:-vault-core-stinger}"
LINES="${2:-15}"

echo "============================================================"
echo "⏱ Durée traitement Vault (Event vaulted successfully)"
echo "   Conteneur: $CONTAINER (dernières $LINES lignes)"
echo "============================================================"
echo ""

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "❌ Conteneur '$CONTAINER' non trouvé."
  exit 1
fi

docker logs "$CONTAINER" 2>&1 | grep "Event vaulted successfully" | tail -"$LINES"

echo ""
echo "Si duration_ms est souvent > 500, investiguer DB / disque / JWS côté Vault."
echo "Voir ZeDocs/web14/VAULT_DUREE_TRAITEMENT.md"

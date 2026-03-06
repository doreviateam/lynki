#!/bin/bash
# Affiche les derniers envois DVIG → Vault et leur durée (outbox_event_forwarded, duration_seconds).
# Usage: ./scripts/check_dvig_forward_duration.sh [conteneur_dvig] [nombre_lignes]

CONTAINER="${1:-dvig-core-stinger}"
LINES="${2:-15}"

echo "============================================================"
echo "⏱ Durées d'envoi DVIG → Vault (outbox_event_forwarded)"
echo "   Conteneur: $CONTAINER (dernières $LINES lignes)"
echo "============================================================"
echo ""

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "❌ Conteneur '$CONTAINER' non trouvé."
  exit 1
fi

# Logs : lignes contenant outbox_event_forwarded (format JSON structlog = une ligne par événement)
docker logs "$CONTAINER" 2>&1 | grep "outbox_event_forwarded" | tail -"$LINES"

echo ""
echo "Si duration_seconds est souvent > 3s, le goulot est probablement côté Vault."
echo "Voir ZeDocs/web14/DVIG_DUREE_VAULT.md"

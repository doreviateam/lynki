#!/bin/bash
# Script de démarrage DVIG avec worker outbox
# Démarre l'API FastAPI et le worker outbox en parallèle

set -e

# Fonction pour gérer la sortie propre
cleanup() {
    echo "Arrêt des processus..."
    kill $API_PID $WORKER_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# Démarrer l'API FastAPI en arrière-plan
echo "🚀 Démarrage de l'API DVIG..."
python -m dvig.api_fastapi &
API_PID=$!

# Attendre que l'API soit prête
sleep 5

# Démarrer le worker outbox en boucle (toutes les 30 secondes)
echo "🚀 Démarrage du worker outbox DVIG..."
while true; do
    echo "[$(date +%Y-%m-%d\ %H:%M:%S)] Exécution du worker outbox..."
    python3 -m workers.outbox_worker --limit 50 || true
    sleep 30
done &
WORKER_PID=$!

# Attendre que les processus se terminent
wait $API_PID $WORKER_PID

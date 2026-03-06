#!/bin/bash

# Script de configuration du worker DVIG en CRON
# SPEC DVIG → Vault Forwarding v1.1
# Date: 2026-01-11

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔧 Configuration du Worker DVIG en CRON"
echo "======================================"
echo ""

# Vérifier si nous sommes dans un conteneur Docker (optionnel - ne pas bloquer)
# Note: Le script peut aussi fonctionner sur l'hôte si CRON est configuré différemment

# Vérifier que cron est installé
if ! command -v crontab &> /dev/null; then
    echo -e "${YELLOW}⚠️  CRON n'est pas installé. Installation...${NC}"
    apt-get update && apt-get install -y --no-install-recommends cron
fi

# Configuration
WORKER_COMMAND="cd /app && python3 -m workers.outbox_worker --limit 50"
CRON_SCHEDULE="*/5 * * * *"  # Toutes les 5 minutes
CRON_USER="dvig"

# Créer le fichier CRON
CRON_FILE="/tmp/dvig_worker_cron"
echo "# Worker DVIG Outbox - Traitement automatique des événements" > "$CRON_FILE"
echo "# SPEC DVIG → Vault Forwarding v1.1" >> "$CRON_FILE"
echo "# Exécution toutes les 5 minutes" >> "$CRON_FILE"
echo "$CRON_SCHEDULE $WORKER_COMMAND >> /var/log/dvig/worker_cron.log 2>&1" >> "$CRON_FILE"

# Installer le CRON
echo -e "${GREEN}📅 Installation du CRON...${NC}"
crontab -u "$CRON_USER" "$CRON_FILE" 2>/dev/null || crontab "$CRON_FILE"

# Créer le répertoire de logs si nécessaire
mkdir -p /var/log/dvig
chown -R "$CRON_USER:$CRON_USER" /var/log/dvig

# Démarrer le service cron
echo -e "${GREEN}🚀 Démarrage du service CRON...${NC}"
service cron start 2>/dev/null || /etc/init.d/cron start 2>/dev/null || true

# Vérifier l'installation
echo ""
echo -e "${GREEN}✅ Configuration terminée${NC}"
echo ""
echo "📋 CRON configuré :"
crontab -l | grep -v "^#" | grep outbox_worker || echo "   (aucun CRON trouvé)"
echo ""
echo "📝 Logs disponibles dans : /var/log/dvig/worker_cron.log"
echo ""
echo "🧪 Test manuel :"
echo "   python3 -m workers.outbox_worker --limit 10"
echo ""
echo "📊 Vérifier les logs :"
echo "   tail -f /var/log/dvig/worker_cron.log"

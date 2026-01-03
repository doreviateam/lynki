#!/bin/bash

# Script de déploiement - Modification last_ticket_hash optionnel
# Version: 1.5.1
# Date: 2025-01-16

set -e

VAULT_DIR="/opt/dorevia-vault"
BACKUP_DIR="${VAULT_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Déploiement - Modification last_ticket_hash optionnel"
echo "=========================================================="
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "${VAULT_DIR}/bin/vault" ]; then
    echo "❌ Erreur: ${VAULT_DIR}/bin/vault introuvable"
    exit 1
fi

# Créer le répertoire de backup
mkdir -p "${BACKUP_DIR}"

echo "1️⃣  Sauvegarde du binaire actuel..."
if [ -f "${VAULT_DIR}/bin/vault" ]; then
    BACKUP_FILE="${BACKUP_DIR}/vault.backup.${TIMESTAMP}"
    cp "${VAULT_DIR}/bin/vault" "${BACKUP_FILE}"
    echo "✅ Sauvegarde créée: ${BACKUP_FILE}"
else
    echo "⚠️  Aucun binaire à sauvegarder"
fi

echo ""
echo "2️⃣  Vérification du nouveau binaire..."
if [ ! -f "${VAULT_DIR}/bin/vault" ]; then
    echo "❌ Erreur: Nouveau binaire introuvable"
    exit 1
fi

# Vérifier que le binaire est exécutable
chmod +x "${VAULT_DIR}/bin/vault"
echo "✅ Binaire vérifié: $(ls -lh ${VAULT_DIR}/bin/vault | awk '{print $5}')"

echo ""
echo "3️⃣  Redémarrage du service..."
if systemctl is-active --quiet dorevia-vault; then
    echo "   Service actif, redémarrage en cours..."
    sudo systemctl restart dorevia-vault
    sleep 2
else
    echo "   Service inactif, démarrage en cours..."
    sudo systemctl start dorevia-vault
    sleep 2
fi

echo ""
echo "4️⃣  Vérification du statut..."
if systemctl is-active --quiet dorevia-vault; then
    echo "✅ Service actif"
    PID=$(systemctl show -p MainPID --value dorevia-vault)
    echo "   PID: ${PID}"
else
    echo "❌ Erreur: Service non actif"
    echo "   Logs: sudo journalctl -u dorevia-vault -n 50"
    exit 1
fi

echo ""
echo "5️⃣  Vérification health check..."
sleep 1
HEALTH_RESPONSE=$(curl -s http://localhost:8080/api/v1/health/zreports 2>&1 || echo "ERROR")
if echo "${HEALTH_RESPONSE}" | grep -q "healthy"; then
    echo "✅ Health check OK"
    echo "   Réponse: ${HEALTH_RESPONSE}"
else
    echo "⚠️  Health check non disponible ou erreur"
    echo "   Réponse: ${HEALTH_RESPONSE}"
fi

echo ""
echo "=========================================================="
echo "✅ Déploiement terminé avec succès !"
echo ""
echo "📋 Informations:"
echo "   Version: 1.5.1"
echo "   Backup: ${BACKUP_FILE}"
echo "   Service: $(systemctl is-active dorevia-vault)"
echo ""
echo "🧪 Test recommandé:"
echo "   curl -X POST http://localhost:8080/api/v1/pos/zreports \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'X-Tenant: test' \\"
echo "     -d '{\"z_id\":\"Z-TEST\",\"tickets_count\":0,\"chain_level\":\"z-report\",\"tenant\":\"test\"}'"
echo ""
echo "📝 Logs:"
echo "   sudo journalctl -u dorevia-vault -f"
echo ""


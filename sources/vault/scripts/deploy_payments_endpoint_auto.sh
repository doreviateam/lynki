#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Déploiement automatique de l'endpoint /api/v1/payments"
echo "=========================================================="
echo ""

# Vérifier que le binaire existe
if [ ! -f "/opt/dorevia-vault/bin/vault" ]; then
    echo "❌ Erreur : Binaire /opt/dorevia-vault/bin/vault introuvable"
    exit 1
fi

echo "✅ Binaire trouvé : /opt/dorevia-vault/bin/vault"
echo "   Taille : $(ls -lh /opt/dorevia-vault/bin/vault | awk '{print $5}')"
echo "   Date : $(stat -c "%y" /opt/dorevia-vault/bin/vault | cut -d'.' -f1)"
echo ""

# Vérifier si l'endpoint est déjà actif
echo "🔍 Vérification de l'endpoint actuel :"
if curl -s -X GET http://localhost:8080/api/v1/payments 2>&1 | grep -q "Method Not Allowed"; then
    echo "✅ Endpoint déjà actif (retourne 405 Method Not Allowed pour GET)"
    echo "   L'endpoint est opérationnel, aucun redémarrage nécessaire."
    exit 0
elif curl -s -X GET http://localhost:8080/api/v1/payments 2>&1 | grep -q "Cannot GET"; then
    echo "⚠️  Endpoint non actif (retourne 404)"
    echo "   Redémarrage nécessaire."
else
    echo "⚠️  État indéterminé, redémarrage recommandé."
fi
echo ""

# Redémarrer le service (nécessite sudo)
echo "🔄 Redémarrage du service..."
if sudo systemctl restart dorevia-vault; then
    echo "✅ Service redémarré avec succès"
else
    echo "❌ Erreur lors du redémarrage du service"
    exit 1
fi

# Attendre que le service démarre
echo "⏳ Attente du démarrage du service (5 secondes)..."
sleep 5

# Vérifier le statut
echo ""
echo "📊 Statut après redémarrage :"
if systemctl is-active --quiet dorevia-vault; then
    echo "✅ Service actif"
else
    echo "❌ Erreur : Service non actif"
    systemctl status dorevia-vault --no-pager | head -20
    exit 1
fi

# Vérifier les logs pour le message d'activation
echo ""
echo "📋 Vérification des logs :"
if sudo journalctl -u dorevia-vault -n 50 --no-pager | grep -q "Payments endpoint enabled"; then
    echo "✅ Message 'Payments endpoint enabled' trouvé dans les logs"
else
    echo "⚠️  Message 'Payments endpoint enabled' non trouvé (peut être normal si déjà présent)"
fi

# Tester l'endpoint
echo ""
echo "🧪 Test de l'endpoint :"
response=$(curl -s -X GET http://localhost:8080/api/v1/payments 2>&1)
if echo "$response" | grep -q "Method Not Allowed"; then
    echo "✅ Endpoint actif (retourne 405 Method Not Allowed pour GET - normal)"
    echo "   Réponse : $response"
elif echo "$response" | grep -q "Cannot GET"; then
    echo "❌ Endpoint toujours non actif (retourne 404)"
    echo "   Réponse : $response"
    echo ""
    echo "⚠️  Vérifiez les logs pour plus de détails :"
    echo "   sudo journalctl -u dorevia-vault -n 100 | grep -i payment"
    exit 1
else
    echo "⚠️  Réponse inattendue : $response"
fi

echo ""
echo "✅ Déploiement terminé avec succès !"
echo ""
echo "📝 Prochaines étapes :"
echo "   1. Tester l'endpoint avec une requête POST valide"
echo "   2. Vérifier les logs : sudo journalctl -u dorevia-vault -f"
echo "   3. Confirmer à l'équipe Odoo que l'endpoint est actif"
echo ""


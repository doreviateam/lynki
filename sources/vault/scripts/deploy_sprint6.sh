#!/bin/bash
# Script de déploiement Sprint 6 v1.4.0
# Usage: sudo ./scripts/deploy_sprint6.sh

set -e

cd "$(dirname "$0")/.."

echo "🚀 Déploiement Sprint 6 v1.4.0"
echo "================================"
echo ""

# 1. Vérifier que nous sommes dans le bon répertoire
if [ ! -f "cmd/vault/main.go" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# 2. Appliquer la migration DB (si DATABASE_URL est configuré)
if [ -n "${DATABASE_URL:-}" ]; then
    echo "📊 Application de la migration DB..."
    if command -v psql >/dev/null 2>&1; then
        psql "$DATABASE_URL" -f migrations/005_add_pos_fields.sql
        echo "✅ Migration DB appliquée"
    else
        echo "⚠️  psql non disponible, migration DB à appliquer manuellement:"
        echo "   psql \$DATABASE_URL -f migrations/005_add_pos_fields.sql"
    fi
else
    echo "⚠️  DATABASE_URL non configuré, migration DB à appliquer manuellement"
fi

# 3. Compiler la nouvelle version
echo ""
echo "🔨 Compilation de la version 1.4.0..."
./scripts/build.sh 1.4.0

# 4. Vérifier que le binaire a été créé
if [ ! -f "bin/vault" ]; then
    echo "❌ Erreur: Le binaire bin/vault n'a pas été créé"
    exit 1
fi

# 5. Vérifier la version du binaire
echo ""
echo "📋 Vérification de la version..."
VERSION_OUTPUT=$(./bin/vault --version 2>&1 || echo "")
echo "   $VERSION_OUTPUT"

# 6. Redémarrer le service
echo ""
echo "🔄 Redémarrage du service dorevia-vault..."
systemctl restart dorevia-vault

# 7. Attendre que le service démarre
echo "⏳ Attente du démarrage du service..."
sleep 3

# 8. Vérifier le statut du service
echo ""
echo "📊 Statut du service:"
systemctl status dorevia-vault --no-pager -l | head -10

# 9. Vérifier la version via l'API
echo ""
echo "🧪 Vérification de la version via l'API..."
sleep 2
VERSION_API=$(curl -s http://localhost:8080/version 2>&1 || echo "Erreur")
echo "   $VERSION_API"

# 10. Vérifier les logs pour l'endpoint POS
echo ""
echo "📋 Vérification des logs (endpoint POS)..."
sleep 2
if journalctl -u dorevia-vault --no-pager -n 50 | grep -q "POS tickets endpoint enabled"; then
    echo "   ✅ Endpoint POS activé"
    journalctl -u dorevia-vault --no-pager -n 50 | grep "POS tickets endpoint" | tail -1
else
    echo "   ⚠️  Endpoint POS non trouvé dans les logs"
    echo "   Vérifiez les logs: journalctl -u dorevia-vault -n 100"
fi

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Vérifier les logs: journalctl -u dorevia-vault -f"
echo "   2. Tester l'endpoint: curl -X POST http://localhost:8080/api/v1/pos-tickets ..."
echo "   3. Vérifier la version: curl http://localhost:8080/version"


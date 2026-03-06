#!/bin/bash
# Script de configuration de la base de données de test pour SPEC 2

set -e

echo "=== Configuration de la base de données de test ==="
echo ""

# Vérifier PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL n'est pas installé"
    echo "Installer avec: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

echo "✅ PostgreSQL est installé: $(psql --version)"
echo ""

# Démarrer PostgreSQL
echo "Démarrage de PostgreSQL..."
sudo systemctl start postgresql 2>/dev/null || echo "⚠️  Impossible de démarrer PostgreSQL (peut-être déjà démarré)"
echo ""

# Créer la base de données
echo "Création de la base de données dorevia_vault_test..."
sudo -u postgres psql -c "CREATE DATABASE dorevia_vault_test;" 2>/dev/null && echo "✅ Base créée" || echo "⚠️  Base existe déjà ou erreur"
echo ""

# Configurer TEST_DATABASE_URL
export TEST_DATABASE_URL='postgresql://postgres@localhost:5432/dorevia_vault_test?sslmode=disable'
echo "✅ TEST_DATABASE_URL configuré"
echo "   Valeur: $TEST_DATABASE_URL"
echo ""

# Tester la connexion
echo "Test de connexion..."
if psql "$TEST_DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Connexion réussie"
else
    echo "❌ Échec de connexion"
    echo "   Vérifier que PostgreSQL est démarré et accessible"
    exit 1
fi
echo ""

# Sauvegarder dans .env.test
echo "TEST_DATABASE_URL=$TEST_DATABASE_URL" > .env.test
echo "✅ Configuration sauvegardée dans .env.test"
echo ""

echo "=== Configuration terminée ==="
echo ""
echo "Pour exécuter les tests:"
echo "  source .env.test"
echo "  cd sources/vault"
echo "  go test -v ./tests/integration -run 'TestConstatIntegration'"

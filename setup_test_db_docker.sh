#!/bin/bash
# Script pour configurer PostgreSQL avec Docker (alternative)

set -e

echo "=== Configuration PostgreSQL avec Docker ==="
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    echo "Installer avec: sudo apt-get install docker.io"
    exit 1
fi

echo "✅ Docker est disponible"
echo ""

# Arrêter le conteneur existant s'il existe
docker stop postgres-test 2>/dev/null || true
docker rm postgres-test 2>/dev/null || true

# Démarrer PostgreSQL dans Docker
echo "Démarrage de PostgreSQL dans Docker..."
docker run -d \
  --name postgres-test \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=dorevia_vault_test \
  -p 5432:5432 \
  postgres:16

echo "✅ Conteneur PostgreSQL démarré"
echo ""

# Attendre que PostgreSQL soit prêt
echo "Attente que PostgreSQL soit prêt..."
sleep 5

# Configurer TEST_DATABASE_URL
export TEST_DATABASE_URL='postgresql://postgres:test@localhost:5432/dorevia_vault_test?sslmode=disable'
echo "✅ TEST_DATABASE_URL configuré"
echo "   Valeur: $TEST_DATABASE_URL"
echo ""

# Tester la connexion
echo "Test de connexion..."
if psql "$TEST_DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Connexion réussie"
else
    echo "⚠️  Connexion échouée, attente supplémentaire..."
    sleep 5
    psql "$TEST_DATABASE_URL" -c "SELECT version();"
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
echo ""
echo "Pour arrêter le conteneur:"
echo "  docker stop postgres-test"

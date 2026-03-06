#!/bin/bash
# Script de configuration de la base de données de test pour Sprint 1
# Usage: ./tests/setup_test_db.sh

set -euo pipefail

echo "🔧 Configuration de la base de données de test"
echo "=============================================="
echo ""

# Vérifier si Docker est disponible
if command -v docker &> /dev/null; then
    echo "✅ Docker détecté"
    USE_DOCKER=true
else
    echo "⚠️  Docker non disponible, utilisation de PostgreSQL local"
    USE_DOCKER=false
fi

# Fonction pour créer la base de données avec Docker
setup_docker_db() {
    echo ""
    echo "🐳 Configuration avec Docker..."
    
    CONTAINER_NAME="vault-test-db"
    DB_NAME="vault_test"
    DB_USER="vault_test"
    DB_PASS="vault_test_pass"
    DB_PORT="5433"
    
    # Vérifier si le conteneur existe déjà
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "📦 Conteneur ${CONTAINER_NAME} existe déjà"
        
        # Vérifier s'il est en cours d'exécution
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            echo "✅ Conteneur ${CONTAINER_NAME} est en cours d'exécution"
        else
            echo "▶️  Démarrage du conteneur ${CONTAINER_NAME}..."
            docker start "${CONTAINER_NAME}"
            sleep 2
        fi
    else
        echo "📦 Création du conteneur PostgreSQL de test..."
        docker run -d \
            --name "${CONTAINER_NAME}" \
            -e POSTGRES_DB="${DB_NAME}" \
            -e POSTGRES_USER="${DB_USER}" \
            -e POSTGRES_PASSWORD="${DB_PASS}" \
            -p "${DB_PORT}:5432" \
            postgres:15-alpine
        
        echo "⏳ Attente du démarrage de PostgreSQL (5 secondes)..."
        sleep 5
    fi
    
    # Vérifier que PostgreSQL est prêt
    echo "🔍 Vérification de la connexion..."
    for i in {1..10}; do
        if docker exec "${CONTAINER_NAME}" pg_isready -U "${DB_USER}" -d "${DB_NAME}" &> /dev/null; then
            echo "✅ PostgreSQL est prêt !"
            break
        fi
        if [ $i -eq 10 ]; then
            echo "❌ PostgreSQL n'est pas prêt après 10 tentatives"
            exit 1
        fi
        echo "   Tentative $i/10..."
        sleep 1
    done
    
    # Exporter TEST_DATABASE_URL
    export TEST_DATABASE_URL="postgres://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}?sslmode=disable"
    echo ""
    echo "✅ Base de données de test configurée :"
    echo "   TEST_DATABASE_URL=${TEST_DATABASE_URL}"
    echo ""
    
    return 0
}

# Fonction pour créer la base de données avec PostgreSQL local
setup_local_db() {
    echo ""
    echo "💻 Configuration avec PostgreSQL local..."
    
    # Vérifier si psql est disponible
    if ! command -v psql &> /dev/null; then
        echo "❌ psql n'est pas disponible"
        echo "   Installez PostgreSQL ou utilisez Docker"
        exit 1
    fi
    
    DB_NAME="vault_test"
    DB_USER="${PGUSER:-$(whoami)}"
    DB_HOST="${PGHOST:-localhost}"
    DB_PORT="${PGPORT:-5432}"
    
    echo "📦 Création de la base de données ${DB_NAME}..."
    
    # Créer la base de données si elle n'existe pas
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -tc \
        "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
        psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c \
        "CREATE DATABASE ${DB_NAME};"
    
    echo "✅ Base de données ${DB_NAME} créée ou existe déjà"
    
    # Exporter TEST_DATABASE_URL
    export TEST_DATABASE_URL="postgres://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable"
    echo ""
    echo "✅ Base de données de test configurée :"
    echo "   TEST_DATABASE_URL=${TEST_DATABASE_URL}"
    echo ""
    
    return 0
}

# Fonction pour vérifier la connexion et appliquer les migrations
verify_connection() {
    echo "📋 Vérification de la connexion et application des migrations..."
    
    cd sources/vault || exit 1
    
    # Vérifier si go est disponible
    if ! command -v go &> /dev/null; then
        echo "⚠️  go n'est pas disponible, les migrations seront appliquées lors des tests"
        cd - > /dev/null
        return 0
    fi
    
    # Créer un script temporaire pour tester la connexion
    # Les migrations seront appliquées automatiquement par NewDB lors des tests
    cat > /tmp/test_connection.go << 'EOF'
package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		fmt.Println("❌ TEST_DATABASE_URL n'est pas défini")
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		fmt.Printf("❌ Erreur de connexion: %v\n", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		fmt.Printf("❌ Erreur de ping: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("✅ Connexion à la base de données réussie")
	fmt.Println("   Les migrations seront appliquées automatiquement lors des tests")
}
EOF

    go run /tmp/test_connection.go
    rm -f /tmp/test_connection.go
    
    cd - > /dev/null
}

# Fonction principale
main() {
    if [ "$USE_DOCKER" = true ]; then
        setup_docker_db
    else
        setup_local_db
    fi
    
    verify_connection
    
    echo ""
    echo "✅ Configuration terminée !"
    echo ""
    echo "📝 Pour exécuter les tests :"
    echo "   export TEST_DATABASE_URL='${TEST_DATABASE_URL}'"
    echo "   ./tests/sprint1_test.sh"
    echo ""
    echo "   Ou directement :"
    echo "   cd sources/vault"
    echo "   go test -v ./tests/integration -run TestAccountMove"
    echo ""
}

# Exécuter
main


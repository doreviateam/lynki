#!/bin/bash

# Script de déploiement DVIG avec worker outbox inclus
# SPEC DVIG → Vault Forwarding v1.1
# Date: 2026-01-11

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Version (patch: 0.1.2 → 0.1.3)
VERSION="0.1.3"
IMAGE_NAME="dorevia/dvig"
IMAGE_TAG="${IMAGE_NAME}:${VERSION}"

echo "🔧 Déploiement DVIG avec Worker Outbox"
echo "======================================"
echo ""
echo "📦 Version    : ${VERSION}"
echo "🏷️  Image     : ${IMAGE_TAG}"
echo "📁 Répertoire : ${PROJECT_ROOT}"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "docker/Dockerfile" ]; then
    echo -e "${RED}❌ Erreur: Dockerfile non trouvé${NC}"
    echo "   Assurez-vous d'être dans le répertoire sources/dvig"
    exit 1
fi

# Vérifier que les répertoires nécessaires existent
REQUIRED_DIRS=("workers" "storage" "models")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo -e "${RED}❌ Erreur: Répertoire $dir non trouvé${NC}"
        exit 1
    fi
done

REQUIRED_FILES=("config.py" "metrics.py")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Erreur: Fichier $file non trouvé${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Vérifications de structure OK${NC}"

# 1. Vérifier les dépendances Python
echo ""
echo "🔍 Étape 1/4 : Vérification des dépendances..."
if grep -q "sqlalchemy" requirements.txt && grep -q "httpx" requirements.txt; then
    echo -e "${GREEN}✅ Dépendances présentes dans requirements.txt${NC}"
else
    echo -e "${YELLOW}⚠️  Certaines dépendances peuvent manquer${NC}"
fi

# 2. Build de l'image Docker
echo ""
echo "🐳 Étape 2/4 : Build de l'image Docker..."
if docker build -f docker/Dockerfile -t "${IMAGE_TAG}" . 2>&1; then
    echo -e "${GREEN}✅ Image buildée : ${IMAGE_TAG}${NC}"
else
    echo -e "${RED}❌ Erreur lors du build Docker${NC}"
    exit 1
fi

# 3. Tagger aussi comme latest (optionnel, pour faciliter les tests)
echo ""
echo "🏷️  Étape 3/4 : Tagging de l'image..."
docker tag "${IMAGE_TAG}" "${IMAGE_NAME}:latest"
echo -e "${GREEN}✅ Image taggée : ${IMAGE_NAME}:latest${NC}"

# 4. Mise à jour du docker-compose.yml
echo ""
echo "📝 Étape 4/4 : Mise à jour du docker-compose.yml..."
COMPOSE_FILE="/opt/dorevia-plateform/tenants/core-stinger/platform/docker-compose.yml"

if [ -f "$COMPOSE_FILE" ]; then
    # Sauvegarder l'ancienne version
    cp "$COMPOSE_FILE" "${COMPOSE_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Remplacer la version dans docker-compose.yml
    if sed -i "s|image: ${IMAGE_NAME}:.*|image: ${IMAGE_TAG}|g" "$COMPOSE_FILE"; then
        echo -e "${GREEN}✅ docker-compose.yml mis à jour${NC}"
        echo "   Backup créé : ${COMPOSE_FILE}.backup.*"
        
        # Retirer le volume workers/ (plus nécessaire, inclus dans l'image)
        if grep -q "workers:/app/workers" "$COMPOSE_FILE"; then
            sed -i '/workers:\/app\/workers:ro/d' "$COMPOSE_FILE"
            echo -e "${GREEN}✅ Volume workers/ retiré (inclus dans l'image)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Impossible de mettre à jour docker-compose.yml automatiquement${NC}"
        echo "   Veuillez mettre à jour manuellement :"
        echo "   image: ${IMAGE_TAG}"
    fi
else
    echo -e "${YELLOW}⚠️  docker-compose.yml non trouvé : ${COMPOSE_FILE}${NC}"
    echo "   Veuillez mettre à jour manuellement :"
    echo "   image: ${IMAGE_TAG}"
fi

# Résumé
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Déploiement préparé avec succès !${NC}"
echo ""
echo "📋 Prochaines étapes :"
echo ""
echo "1. Redémarrer le conteneur DVIG :"
echo "   cd /opt/dorevia-plateform/tenants/core-stinger/platform"
echo "   docker compose up -d --no-deps dvig"
echo ""
echo "2. Vérifier les logs :"
echo "   docker logs -f dvig-core-stinger"
echo ""
echo "3. Lancer le worker manuellement (test) :"
echo "   docker exec -it dvig-core-stinger sh -c 'cd /app && python3 -m workers.outbox_worker --limit 10'"
echo ""
echo "4. Configurer le worker en CRON (production) :"
echo "   Ajouter un CRON dans le conteneur ou un service systemd"
echo ""
echo "5. Vérifier que les événements sont traités :"
echo "   docker logs dvig-core-stinger | grep outbox"
echo ""
echo "=========================================="

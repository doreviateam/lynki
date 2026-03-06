#!/bin/bash

# Script de déploiement pour corriger l'erreur 500 sur /api/v1/proof/account_move/:id
# Problème: Requête SQL référençant des colonnes inexistantes (move_type, compliance_status, etc.)
# Solution: Correction de GetDocumentBySourceID et GetDocumentByID dans queries.go
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

# Version (patch: v1.3.0 -> v1.3.1)
VERSION="1.3.1"
IMAGE_NAME="dorevia/vault"
IMAGE_TAG="${IMAGE_NAME}:v${VERSION}"

echo "🔧 Déploiement du correctif Proof Endpoint"
echo "=========================================="
echo ""
echo "📦 Version    : v${VERSION}"
echo "🏷️  Image     : ${IMAGE_TAG}"
echo "📁 Répertoire : ${PROJECT_ROOT}"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ Erreur: Dockerfile non trouvé${NC}"
    echo "   Assurez-vous d'être dans le répertoire sources/vault"
    exit 1
fi

# 1. Vérifier que le code compile
echo "🔨 Étape 1/4 : Vérification de la compilation..."
if go build -o /tmp/vault_test ./cmd/vault 2>&1; then
    echo -e "${GREEN}✅ Compilation réussie${NC}"
    rm -f /tmp/vault_test
else
    echo -e "${RED}❌ Erreur de compilation${NC}"
    exit 1
fi

# 2. Build de l'image Docker
echo ""
echo "🐳 Étape 2/4 : Build de l'image Docker..."
if docker build -t "${IMAGE_TAG}" . 2>&1; then
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
    if sed -i "s|image: ${IMAGE_NAME}:v[0-9.]*|image: ${IMAGE_TAG}|g" "$COMPOSE_FILE"; then
        echo -e "${GREEN}✅ docker-compose.yml mis à jour${NC}"
        echo "   Backup créé : ${COMPOSE_FILE}.backup.*"
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
echo "1. Redémarrer le conteneur Vault :"
echo "   cd /opt/dorevia-plateform/tenants/core-stinger/platform"
echo "   docker-compose pull vault"
echo "   docker-compose up -d vault"
echo ""
echo "2. Vérifier les logs :"
echo "   docker logs -f vault-core-stinger"
echo ""
echo "3. Tester l'endpoint corrigé :"
echo "   curl -X GET 'https://vault.core-stinger.doreviateam.com/api/v1/proof/account_move/1896' \\"
echo "     -H 'Authorization: Bearer <token>'"
echo ""
echo "4. Si tout fonctionne, déclencher le CRON #2 dans Odoo :"
echo "   docker exec -i odoo_stinger_sarl-la-platine odoo shell -d odoo_stinger_sarl-la-platine"
echo "   env['account.move'].cron_vault_fetch_proof()"
echo ""
echo "=========================================="

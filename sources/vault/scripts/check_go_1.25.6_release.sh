#!/bin/bash

# Script de vérification publication Go 1.25.6
# Usage: ./scripts/check_go_1.25.6_release.sh

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔍 Vérification publication Go 1.25.6..."
echo ""

# Vérifier Docker Hub
echo "📦 Vérification Docker Hub..."
if docker pull golang:1.25.6-alpine >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Go 1.25.6 disponible sur Docker Hub${NC}"
    DOCKER_AVAILABLE=true
else
    echo -e "${YELLOW}⏳ Go 1.25.6 pas encore disponible sur Docker Hub${NC}"
    DOCKER_AVAILABLE=false
fi
echo ""

# Vérifier site Go officiel
echo "🌐 Vérification site Go officiel..."
if curl -s https://go.dev/dl/ | grep -q "go1.25.6"; then
    echo -e "${GREEN}✅ Go 1.25.6 listé sur go.dev/dl${NC}"
    SITE_AVAILABLE=true
else
    echo -e "${YELLOW}⏳ Go 1.25.6 pas encore listé sur go.dev/dl${NC}"
    SITE_AVAILABLE=false
fi
echo ""

# Résumé
if [ "$DOCKER_AVAILABLE" = true ] && [ "$SITE_AVAILABLE" = true ]; then
    echo -e "${GREEN}✅ Go 1.25.6 est PUBLIÉ !${NC}"
    echo ""
    echo "🚀 Prochaines étapes :"
    echo "   cd /opt/dorevia-plateform/sources/vault"
    echo "   ./scripts/upgrade_go_1.25.6.sh"
    exit 0
elif [ "$DOCKER_AVAILABLE" = true ] || [ "$SITE_AVAILABLE" = true ]; then
    echo -e "${YELLOW}⚠️  Go 1.25.6 partiellement disponible${NC}"
    echo "   Vérifier manuellement avant d'appliquer le patch"
    exit 1
else
    echo -e "${YELLOW}⏳ Go 1.25.6 pas encore publié${NC}"
    echo "   Réessayer plus tard"
    exit 1
fi

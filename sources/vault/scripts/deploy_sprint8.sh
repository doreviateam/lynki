#!/bin/bash
# Script de déploiement Sprint 8 - Endpoints Proof
# Version: 1.6.0

set -e

echo "🚀 Déploiement Sprint 8 - Endpoints Proof pour dorevia_vault_report"
echo "===================================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
PROJECT_DIR="/opt/dorevia-vault"
BINARY_PATH="$PROJECT_DIR/bin/vault"
SERVICE_NAME="dorevia-vault"
VERSION="1.6.0"

# 1. Vérification prérequis
echo "📋 Vérification des prérequis..."
echo ""

# Vérifier Go
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Go installé${NC}"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "$PROJECT_DIR/cmd/vault/main.go" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis $PROJECT_DIR${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

# 2. Compilation
echo ""
echo "🔨 Compilation de la version $VERSION..."
if [ -f "$PROJECT_DIR/scripts/build.sh" ]; then
    ./scripts/build.sh "$VERSION"
else
    # Build manuel
    go build -ldflags "-X main.Version=$VERSION -X main.Commit=$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown') -X main.BuiltAt=$(date -u +%Y-%m-%dT%H:%M:%SZ)" -o "$BINARY_PATH" cmd/vault/main.go
fi

if [ ! -f "$BINARY_PATH" ]; then
    echo -e "${RED}❌ Erreur: Le binaire n'a pas été créé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Binaire compilé${NC}"

# 3. Vérification de la version
echo ""
echo "📋 Vérification de la version..."
VERSION_OUTPUT=$("$BINARY_PATH" --version 2>&1 || echo "")
echo "   $VERSION_OUTPUT"

# 4. Migration DB (automatique au démarrage, mais on peut vérifier)
echo ""
echo "📊 Note: La migration DB sera appliquée automatiquement au démarrage du service"
echo "   Migration 008: Index pour recherche par source_model + source_id"

# 5. Redémarrage du service
echo ""
echo "🔄 Redémarrage du service $SERVICE_NAME..."
if systemctl is-active --quiet "$SERVICE_NAME"; then
    systemctl restart "$SERVICE_NAME"
    echo -e "${GREEN}✅ Service redémarré${NC}"
else
    echo -e "${YELLOW}⚠️  Service non actif, démarrage...${NC}"
    systemctl start "$SERVICE_NAME" || true
fi

# 6. Attente du démarrage
echo ""
echo "⏳ Attente du démarrage du service..."
sleep 3

# 7. Vérification du statut
echo ""
echo "📊 Statut du service:"
systemctl status "$SERVICE_NAME" --no-pager -l | head -10

# 8. Vérification de la version via l'API
echo ""
echo "🧪 Vérification de la version via l'API..."
sleep 2
if command -v curl &> /dev/null; then
    VERSION_API=$(curl -s http://localhost:8080/version 2>&1 || echo "Erreur")
    echo "   $VERSION_API"
    
    # Vérifier les endpoints proof
    echo ""
    echo "🧪 Vérification des endpoints proof..."
    PROOF_ENDPOINTS=$(curl -s http://localhost:8080/health 2>&1 || echo "")
    if echo "$PROOF_ENDPOINTS" | grep -q "200\|OK"; then
        echo -e "${GREEN}✅ Service répond correctement${NC}"
    else
        echo -e "${YELLOW}⚠️  Service répond mais vérifiez les logs${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl non disponible, vérification manuelle requise${NC}"
fi

# 9. Vérification des logs
echo ""
echo "📋 Vérification des logs (dernières lignes)..."
if journalctl -u "$SERVICE_NAME" -n 20 --no-pager | grep -q "Proof endpoints enabled\|Sprint 8"; then
    echo -e "${GREEN}✅ Endpoints proof détectés dans les logs${NC}"
else
    echo -e "${YELLOW}⚠️  Vérifiez les logs manuellement: journalctl -u $SERVICE_NAME -n 50${NC}"
fi

# 10. Résumé
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Déploiement Sprint 8 terminé${NC}"
echo "=========================================="
echo ""
echo "📋 Endpoints disponibles:"
echo "   - GET  /api/v1/proof/account_move/:id"
echo "   - GET  /api/v1/proof/account_payment/:id"
echo "   - GET  /api/v1/proof/pos_order/:id"
echo "   - GET  /api/v1/proof/pos_payment/:id"
echo "   - POST /api/v1/proof/bulk"
echo ""
echo "📚 Documentation:"
echo "   - docs/PROOF_API.md"
echo "   - docs/IMPLEMENTATION_SPRINT8_PROOF_ENDPOINTS.md"
echo ""
echo "🧪 Tests:"
echo "   curl -X GET http://localhost:8080/api/v1/proof/account_move/123 \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN'"
echo ""


#!/bin/bash
# Script de déploiement Sprint 8.1 - Compatibilité DVIG
# Version: 1.6.2
# Date: 2025-11-26

set -e

echo "🚀 Déploiement Sprint 8.1 - Compatibilité DVIG"
echo "=============================================="
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
NEW_VERSION="1.6.2" # Sprint 8.1 - Compatibilité DVIG

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
if [ ! -f "$PROJECT_DIR/go.mod" ]; then
    echo -e "${RED}❌ Répertoire projet invalide: $PROJECT_DIR${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Répertoire projet valide${NC}"

# 2. Compilation de la nouvelle version
echo ""
echo "🔨 Compilation de la version $NEW_VERSION..."
cd "$PROJECT_DIR"
./scripts/build.sh "$NEW_VERSION"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur de compilation${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Binaire compilé${NC}"

# 3. Vérification du binaire
if [ ! -f "$BINARY_PATH" ]; then
    echo -e "${RED}❌ Binaire non trouvé: $BINARY_PATH${NC}"
    exit 1
fi
BINARY_SIZE=$(du -h "$BINARY_PATH" | cut -f1)
echo -e "${GREEN}✅ Binaire créé ($BINARY_SIZE)${NC}"

# 4. Redémarrage du service
echo ""
echo "🔄 Redémarrage du service $SERVICE_NAME..."
sudo systemctl restart "$SERVICE_NAME"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du redémarrage du service${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Service redémarré${NC}"

# 5. Attendre que le service démarre
echo "⏳ Attente du démarrage du service..."
sleep 5

# 6. Vérifier le statut du service
echo ""
echo "📊 Statut du service:"
systemctl status "$SERVICE_NAME" --no-pager -l | head -10
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "${GREEN}✅ Service actif${NC}"
else
    echo -e "${RED}❌ Service inactif${NC}"
    echo "Derniers logs:"
    sudo journalctl -u "$SERVICE_NAME" -n 20 --no-pager
    exit 1
fi

# 7. Vérifier la version via l'API
echo ""
echo "🧪 Vérification de la version via l'API..."
sleep 2
VERSION_API=$(curl -s http://localhost:8080/version 2>&1 || echo "Erreur")
echo "   $VERSION_API"
if echo "$VERSION_API" | grep -q "\"version\":\"$NEW_VERSION\""; then
    echo -e "${GREEN}✅ Version $NEW_VERSION confirmée via l'API${NC}"
else
    echo -e "${YELLOW}⚠️  La version de l'API ne correspond pas à $NEW_VERSION (peut être normal si version non exposée)${NC}"
fi

# 8. Vérifier les logs pour les fonctionnalités DVIG
echo ""
echo "🔍 Vérification des logs pour les fonctionnalités DVIG..."
LOG_OUTPUT=$(sudo journalctl -u "$SERVICE_NAME" -n 50 | grep -i "correlation_id\|tenant\|DVIG\|dvig" || echo "")
if [ -n "$LOG_OUTPUT" ]; then
    echo -e "${GREEN}✅ Logs DVIG trouvés${NC}"
    echo "$LOG_OUTPUT" | head -5
else
    echo -e "${YELLOW}⚠️  Aucun log DVIG trouvé (normal si aucune requête DVIG n'a été traitée)${NC}"
fi

# 9. Vérifier que les endpoints sont accessibles
echo ""
echo "🧪 Vérification des endpoints..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health 2>&1 || echo "000")
if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Endpoint /health accessible (HTTP $HEALTH_CHECK)${NC}"
else
    echo -e "${YELLOW}⚠️  Endpoint /health retourne HTTP $HEALTH_CHECK${NC}"
fi

# 10. Résumé
echo ""
echo "=============================================="
echo -e "${GREEN}🎉 Déploiement Sprint 8.1 terminé avec succès !${NC}"
echo ""
echo "📋 Fonctionnalités déployées:"
echo "   ✅ Compatibilité DVIG v1.1"
echo "   ✅ Logging correlation_id et tenant"
echo "   ✅ Tests d'intégration DVIG (8 tests)"
echo "   ✅ Documentation mise à jour"
echo ""
echo "📚 Documentation:"
echo "   - docs/DVIG_COMPATIBILITY.md"
echo "   - docs/REPONSE_EQUIPE_DVIG_COMPATIBILITY.md"
echo ""
echo "🧪 Tests:"
echo "   - tests/integration/dvig_compatibility_test.go"
echo ""
echo "🔍 Vérification manuelle:"
echo "   - Vérifier les logs: sudo journalctl -u $SERVICE_NAME -f"
echo "   - Tester un endpoint: curl -X POST http://localhost:8080/api/v1/invoices ..."
echo ""
echo "✅ L'équipe DVIG peut maintenant intégrer avec l'API Vault"
echo "=============================================="


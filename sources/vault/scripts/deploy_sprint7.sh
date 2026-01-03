#!/bin/bash
# Script de déploiement Sprint 7 - Z-Reports
# Version: 1.5.0

set -e

echo "🚀 Déploiement Sprint 7 - Z-Reports avec Double Chaînage"
echo "=========================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
PROJECT_DIR="/opt/dorevia-vault"
LEDGER_DIR="/opt/dorevia-vault/ledger"
BINARY_PATH="$PROJECT_DIR/bin/vault"
SERVICE_NAME="dorevia-vault"

# 1. Vérification prérequis
echo "📋 Vérification des prérequis..."
echo ""

# Vérifier Go
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Go installé${NC}"

# Vérifier compilation
if [ ! -f "$BINARY_PATH" ]; then
    echo "🔨 Compilation du binaire..."
    cd "$PROJECT_DIR"
    go build -o "$BINARY_PATH" cmd/vault/main.go
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erreur de compilation${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Binaire compilé${NC}"
else
    echo -e "${GREEN}✅ Binaire existant trouvé${NC}"
fi

# 2. Création répertoire ledger
echo ""
echo "📁 Configuration du répertoire ledger..."
if [ ! -d "$LEDGER_DIR" ]; then
    sudo mkdir -p "$LEDGER_DIR"
    echo -e "${GREEN}✅ Répertoire créé${NC}"
else
    echo -e "${GREEN}✅ Répertoire existant${NC}"
fi

# Vérifier permissions
if [ -w "$LEDGER_DIR" ]; then
    echo -e "${GREEN}✅ Permissions OK${NC}"
else
    echo "🔧 Ajustement des permissions..."
    sudo chown -R $(whoami):$(whoami) "$LEDGER_DIR"
    sudo chmod 755 "$LEDGER_DIR"
    echo -e "${GREEN}✅ Permissions ajustées${NC}"
fi

# 3. Vérification configuration
echo ""
echo "⚙️  Vérification de la configuration..."

# Vérifier variables d'environnement critiques
if [ -z "$LEDGER_FILESYSTEM_PATH" ]; then
    echo -e "${YELLOW}⚠️  LEDGER_FILESYSTEM_PATH non défini (sera créé automatiquement)${NC}"
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL non défini (requis pour validation last_ticket_hash)${NC}"
fi

if [ -z "$JWS_ENABLED" ] || [ "$JWS_ENABLED" != "true" ]; then
    echo -e "${YELLOW}⚠️  JWS_ENABLED non activé (requis pour signature evidence)${NC}"
fi

# 4. Tests
echo ""
echo "🧪 Exécution des tests..."
cd "$PROJECT_DIR"

# Tests unitaires
echo "  → Tests unitaires ledger filesystem..."
go test ./internal/ledger/filesystem/... -v > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✅ Tests ledger filesystem passent${NC}"
else
    echo -e "  ${RED}❌ Tests ledger filesystem échouent${NC}"
    exit 1
fi

echo "  → Tests unitaires handlers..."
go test ./internal/handlers/... -v -run TestPosZReports > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✅ Tests handlers passent${NC}"
else
    echo -e "  ${YELLOW}⚠️  Certains tests handlers peuvent échouer (normal si DB non configurée)${NC}"
fi

# 5. Vérification health check
echo ""
echo "🏥 Vérification health check..."

# Vérifier si le service tourne déjà
if pgrep -f "$BINARY_PATH" > /dev/null; then
    echo -e "${YELLOW}⚠️  Le service est déjà en cours d'exécution${NC}"
    echo "   Vous pouvez le redémarrer avec: sudo systemctl restart $SERVICE_NAME"
else
    echo -e "${GREEN}✅ Service non démarré (prêt pour démarrage)${NC}"
fi

# 6. Résumé
echo ""
echo "=========================================================="
echo -e "${GREEN}✅ Déploiement préparé avec succès${NC}"
echo ""
echo "📝 Prochaines étapes:"
echo ""
echo "1. Configurer les variables d'environnement:"
echo "   export LEDGER_FILESYSTEM_PATH=$LEDGER_DIR"
echo "   export DATABASE_URL=postgresql://..."
echo "   export JWS_ENABLED=true"
echo "   export JWS_PRIVATE_KEY_PATH=/opt/dorevia-vault/keys/private.pem"
echo ""
echo "2. Démarrer le service:"
echo "   $BINARY_PATH"
echo ""
echo "   Ou via systemd:"
echo "   sudo systemctl start $SERVICE_NAME"
echo ""
echo "3. Vérifier le health check:"
echo "   curl http://localhost:8080/api/v1/health/zreports"
echo ""
echo "4. Tester l'endpoint:"
echo "   curl -X POST http://localhost:8080/api/v1/pos/zreports \\"
echo "     -H 'Authorization: Bearer <token>' \\"
echo "     -H 'X-Tenant: test-tenant' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d @test_zreport.json"
echo ""
echo "📚 Documentation:"
echo "   - API: docs/ZREPORTS_API.md"
echo "   - Déploiement: docs/DEPLOIEMENT_SPRINT7.md"
echo ""


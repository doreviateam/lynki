#!/bin/bash
# Script de diagnostic et correction - Endpoint Z-Reports
# Version: 1.5.0

set -e

echo "🔍 Diagnostic Endpoint Z-Reports"
echo "=================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="/opt/dorevia-vault"
BINARY_PATH="$PROJECT_DIR/bin/vault"

# 1. Vérifier si le service tourne
echo "1️⃣  Vérification du service..."
if pgrep -f "$BINARY_PATH" > /dev/null; then
    PID=$(pgrep -f "$BINARY_PATH")
    echo -e "${GREEN}✅ Service en cours (PID: $PID)${NC}"
else
    echo -e "${RED}❌ Service non démarré${NC}"
    exit 1
fi

# 2. Tester l'endpoint
echo ""
echo "2️⃣  Test de l'endpoint..."
RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/pos/zreports \
  -H "Content-Type: application/json" \
  -H "X-Tenant: test" \
  -d '{}' 2>&1)

if echo "$RESPONSE" | grep -q "Cannot POST"; then
    echo -e "${RED}❌ Endpoint non activé${NC}"
    echo "   Réponse: $RESPONSE"
    ENDPOINT_DISABLED=true
else
    echo -e "${GREEN}✅ Endpoint activé${NC}"
    echo "   Réponse: $RESPONSE"
    ENDPOINT_DISABLED=false
fi

if [ "$ENDPOINT_DISABLED" = "false" ]; then
    echo ""
    echo -e "${GREEN}✅ L'endpoint est activé et fonctionne correctement${NC}"
    exit 0
fi

# 3. Diagnostic des prérequis
echo ""
echo "3️⃣  Diagnostic des prérequis..."
echo ""

# Vérifier DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL non configuré${NC}"
    DB_MISSING=true
else
    echo -e "${GREEN}✅ DATABASE_URL configuré${NC}"
    DB_MISSING=false
fi

# Vérifier JWS_ENABLED
if [ -z "$JWS_ENABLED" ] || [ "$JWS_ENABLED" != "true" ]; then
    echo -e "${RED}❌ JWS_ENABLED non activé${NC}"
    JWS_MISSING=true
else
    echo -e "${GREEN}✅ JWS_ENABLED activé${NC}"
    JWS_MISSING=false
fi

# Vérifier JWS_PRIVATE_KEY_PATH
if [ -z "$JWS_PRIVATE_KEY_PATH" ]; then
    if [ -f "/opt/dorevia-vault/keys/private.pem" ]; then
        echo -e "${YELLOW}⚠️  JWS_PRIVATE_KEY_PATH non défini mais clé trouvée${NC}"
        JWS_KEY_MISSING=false
    else
        echo -e "${RED}❌ JWS_PRIVATE_KEY_PATH non défini et clé introuvable${NC}"
        JWS_KEY_MISSING=true
    fi
else
    if [ -f "$JWS_PRIVATE_KEY_PATH" ]; then
        echo -e "${GREEN}✅ JWS_PRIVATE_KEY_PATH configuré et fichier existe${NC}"
        JWS_KEY_MISSING=false
    else
        echo -e "${RED}❌ JWS_PRIVATE_KEY_PATH pointe vers fichier inexistant${NC}"
        JWS_KEY_MISSING=true
    fi
fi

# Vérifier LEDGER_FILESYSTEM_PATH
if [ -z "$LEDGER_FILESYSTEM_PATH" ]; then
    echo -e "${RED}❌ LEDGER_FILESYSTEM_PATH non configuré${NC}"
    LEDGER_MISSING=true
else
    if [ -d "$LEDGER_FILESYSTEM_PATH" ]; then
        echo -e "${GREEN}✅ LEDGER_FILESYSTEM_PATH configuré et répertoire existe${NC}"
        LEDGER_MISSING=false
    else
        echo -e "${RED}❌ LEDGER_FILESYSTEM_PATH pointe vers répertoire inexistant${NC}"
        LEDGER_MISSING=true
    fi
fi

# 4. Résumé et solution
echo ""
echo "4️⃣  Résumé et solution..."
echo ""

if [ "$DB_MISSING" = "true" ] || [ "$JWS_MISSING" = "true" ] || [ "$JWS_KEY_MISSING" = "true" ] || [ "$LEDGER_MISSING" = "true" ]; then
    echo -e "${RED}❌ Prérequis manquants détectés${NC}"
    echo ""
    echo "📝 Variables à configurer :"
    echo ""
    
    if [ "$DB_MISSING" = "true" ]; then
        echo "export DATABASE_URL=postgresql://user:password@localhost:5432/dorevia_vault"
    fi
    
    if [ "$JWS_MISSING" = "true" ]; then
        echo "export JWS_ENABLED=true"
    fi
    
    if [ "$JWS_KEY_MISSING" = "true" ]; then
        if [ -f "/opt/dorevia-vault/keys/private.pem" ]; then
            echo "export JWS_PRIVATE_KEY_PATH=/opt/dorevia-vault/keys/private.pem"
        else
            echo "⚠️  Clé JWS introuvable : /opt/dorevia-vault/keys/private.pem"
        fi
    fi
    
    if [ "$LEDGER_MISSING" = "true" ]; then
        echo "export LEDGER_FILESYSTEM_PATH=/opt/dorevia-vault/ledger"
        echo "mkdir -p /opt/dorevia-vault/ledger"
    fi
    
    echo ""
    echo "🔄 Après configuration, redémarrer le service :"
    echo "   pkill -f bin/vault"
    echo "   sleep 2"
    echo "   cd $PROJECT_DIR"
    echo "   source .env  # Si vous utilisez .env"
    echo "   ./bin/vault"
    echo ""
    echo "📚 Documentation complète : DIAGNOSTIC_ENDPOINT_ZREPORTS.md"
    
    exit 1
else
    echo -e "${GREEN}✅ Tous les prérequis sont configurés${NC}"
    echo ""
    echo "⚠️  L'endpoint devrait être activé. Vérifiez :"
    echo "   1. Que le service a été redémarré après configuration"
    echo "   2. Les logs du service pour voir les messages d'activation"
    echo ""
    echo "Pour redémarrer :"
    echo "   pkill -f bin/vault && sleep 2 && cd $PROJECT_DIR && ./bin/vault"
fi


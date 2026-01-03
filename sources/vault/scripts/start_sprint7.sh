#!/bin/bash
# Script de démarrage Sprint 7 - Z-Reports
# Version: 1.5.0

set -e

echo "🚀 Démarrage Dorevia Vault - Sprint 7 (Z-Reports)"
echo "=================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
PROJECT_DIR="/opt/dorevia-vault"
BINARY_PATH="$PROJECT_DIR/bin/vault"
LEDGER_DIR="/opt/dorevia-vault/ledger"

# 1. Configuration des variables d'environnement
echo "⚙️  Configuration des variables d'environnement..."
echo ""

# Ledger Filesystem
export LEDGER_FILESYSTEM_PATH="${LEDGER_FILESYSTEM_PATH:-$LEDGER_DIR}"
echo -e "${GREEN}✅ LEDGER_FILESYSTEM_PATH=$LEDGER_FILESYSTEM_PATH${NC}"

# Configuration Z-Reports (valeurs par défaut)
export ZREPORT_MAX_SIZE_BYTES="${ZREPORT_MAX_SIZE_BYTES:-1048576}"
export ZREPORT_FSYNC_ENABLED="${ZREPORT_FSYNC_ENABLED:-true}"
echo -e "${GREEN}✅ ZREPORT_MAX_SIZE_BYTES=$ZREPORT_MAX_SIZE_BYTES${NC}"
echo -e "${GREEN}✅ ZREPORT_FSYNC_ENABLED=$ZREPORT_FSYNC_ENABLED${NC}"

# Base de données
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL non défini${NC}"
    echo "   Les fonctionnalités Z-Reports nécessitent une base de données pour valider last_ticket_hash"
    echo "   Exemple: export DATABASE_URL=postgresql://user:password@localhost:5432/dorevia_vault"
else
    echo -e "${GREEN}✅ DATABASE_URL configuré${NC}"
fi

# JWS
if [ -z "$JWS_ENABLED" ] || [ "$JWS_ENABLED" != "true" ]; then
    echo -e "${YELLOW}⚠️  JWS_ENABLED non activé${NC}"
    echo "   Les Z-Reports nécessitent JWS pour la signature evidence"
    echo "   Exemple: export JWS_ENABLED=true"
else
    echo -e "${GREEN}✅ JWS_ENABLED=$JWS_ENABLED${NC}"
fi

if [ -z "$JWS_PRIVATE_KEY_PATH" ]; then
    if [ -f "/opt/dorevia-vault/keys/private.pem" ]; then
        export JWS_PRIVATE_KEY_PATH="/opt/dorevia-vault/keys/private.pem"
        echo -e "${GREEN}✅ JWS_PRIVATE_KEY_PATH=$JWS_PRIVATE_KEY_PATH (auto-détecté)${NC}"
    else
        echo -e "${YELLOW}⚠️  JWS_PRIVATE_KEY_PATH non défini${NC}"
    fi
else
    echo -e "${GREEN}✅ JWS_PRIVATE_KEY_PATH=$JWS_PRIVATE_KEY_PATH${NC}"
fi

if [ -z "$JWS_PUBLIC_KEY_PATH" ]; then
    if [ -f "/opt/dorevia-vault/keys/public.pem" ]; then
        export JWS_PUBLIC_KEY_PATH="/opt/dorevia-vault/keys/public.pem"
        echo -e "${GREEN}✅ JWS_PUBLIC_KEY_PATH=$JWS_PUBLIC_KEY_PATH (auto-détecté)${NC}"
    fi
fi

if [ -z "$JWS_KID" ]; then
    export JWS_KID="zreports-kid-2025"
    echo -e "${GREEN}✅ JWS_KID=$JWS_KID (défaut)${NC}"
fi

# Authentification
if [ -z "$AUTH_ENABLED" ] || [ "$AUTH_ENABLED" != "true" ]; then
    echo -e "${YELLOW}⚠️  AUTH_ENABLED non activé${NC}"
    echo "   Les endpoints Z-Reports nécessitent une authentification"
    echo "   Exemple: export AUTH_ENABLED=true"
else
    echo -e "${GREEN}✅ AUTH_ENABLED=$AUTH_ENABLED${NC}"
fi

# 2. Vérification du binaire
echo ""
echo "📦 Vérification du binaire..."
if [ ! -f "$BINARY_PATH" ]; then
    echo -e "${RED}❌ Binaire non trouvé: $BINARY_PATH${NC}"
    echo "   Compilation en cours..."
    cd "$PROJECT_DIR"
    go build -o "$BINARY_PATH" cmd/vault/main.go
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erreur de compilation${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Binaire compilé${NC}"
else
    echo -e "${GREEN}✅ Binaire trouvé: $BINARY_PATH${NC}"
fi

# 3. Vérification du répertoire ledger
echo ""
echo "📁 Vérification du répertoire ledger..."
if [ ! -d "$LEDGER_DIR" ]; then
    echo "   Création du répertoire..."
    mkdir -p "$LEDGER_DIR"
    chmod 755 "$LEDGER_DIR"
    echo -e "${GREEN}✅ Répertoire créé: $LEDGER_DIR${NC}"
else
    echo -e "${GREEN}✅ Répertoire existant: $LEDGER_DIR${NC}"
fi

# 4. Vérification si le service tourne déjà
echo ""
if pgrep -f "$BINARY_PATH" > /dev/null; then
    echo -e "${YELLOW}⚠️  Le service est déjà en cours d'exécution${NC}"
    echo "   PID: $(pgrep -f "$BINARY_PATH")"
    read -p "   Voulez-vous le redémarrer? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   Arrêt du service..."
        pkill -f "$BINARY_PATH" || true
        sleep 2
        echo -e "${GREEN}✅ Service arrêté${NC}"
    else
        echo "   Démarrage annulé"
        exit 0
    fi
fi

# 5. Démarrage du service
echo ""
echo "🚀 Démarrage du service..."
echo ""
cd "$PROJECT_DIR"

# Afficher les variables importantes
echo "Configuration:"
echo "  - LEDGER_FILESYSTEM_PATH: $LEDGER_FILESYSTEM_PATH"
echo "  - DATABASE_URL: ${DATABASE_URL:-non configuré}"
echo "  - JWS_ENABLED: ${JWS_ENABLED:-false}"
echo "  - AUTH_ENABLED: ${AUTH_ENABLED:-false}"
echo ""

# Démarrer le service
echo "Démarrage en cours..."
echo "  → Logs: Ctrl+C pour arrêter"
echo "  → Health check: curl http://localhost:8080/api/v1/health/zreports"
echo ""

exec "$BINARY_PATH"


#!/bin/sh
# Script d'initialisation pour le conteneur Docker Vault
# Corrige les permissions des volumes montés au démarrage
# SPEC Phase 6 - Ops Hardening

set -e

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Initialisation du conteneur Vault...${NC}"

# Vérifier si nous sommes root (pour corriger les permissions)
if [ "$(id -u)" = "0" ]; then
    echo -e "${YELLOW}⚠️  Exécution en root - correction des permissions...${NC}"
    
    # Corriger les permissions des volumes montés
    if [ -d "/opt/dorevia-vault/storage" ]; then
        chown -R vault:vault /opt/dorevia-vault/storage
        chmod -R 755 /opt/dorevia-vault/storage
        echo "✅ Permissions corrigées pour /opt/dorevia-vault/storage"
    fi
    
    if [ -d "/opt/dorevia-vault/ledger" ]; then
        chown -R vault:vault /opt/dorevia-vault/ledger
        chmod -R 755 /opt/dorevia-vault/ledger
        echo "✅ Permissions corrigées pour /opt/dorevia-vault/ledger"
    fi
    
    if [ -d "/opt/dorevia-vault/audit" ]; then
        chown -R vault:vault /opt/dorevia-vault/audit
        chmod -R 755 /opt/dorevia-vault/audit
        echo "✅ Permissions corrigées pour /opt/dorevia-vault/audit"
    fi
    
    # Créer les sous-répertoires si nécessaire (pour organisation par année)
    if [ -d "/opt/dorevia-vault/storage" ]; then
        mkdir -p /opt/dorevia-vault/storage/$(date +%Y)
        chown -R vault:vault /opt/dorevia-vault/storage/$(date +%Y)
        chmod -R 755 /opt/dorevia-vault/storage/$(date +%Y)
    fi
    
    # Passer à l'utilisateur vault pour exécuter l'application
    exec su-exec vault "$@"
else
    # Déjà en tant qu'utilisateur vault, exécuter directement
    exec "$@"
fi

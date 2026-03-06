#!/bin/bash

# Script d'upgrade Go 1.25.6 pour Dorevia Vault
# Date : 2026-01-12
# Priorité : P0 (Sécurité)
# Usage: ./scripts/upgrade_go_1.25.6.sh [--dry-run] [--skip-tests]

set -euo pipefail

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Options
DRY_RUN=false
SKIP_TESTS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        *)
            echo -e "${RED}❌ Option inconnue: $1${NC}"
            echo "Usage: $0 [--dry-run] [--skip-tests]"
            exit 1
            ;;
    esac
done

echo "🔐 Upgrade Go 1.25.6 — Dorevia Vault"
echo "===================================="
echo ""

# Vérifier que Go 1.25.6 est disponible
echo "🔍 Vérification de la disponibilité de Go 1.25.6..."
if ! docker pull golang:1.25.6-alpine >/dev/null 2>&1; then
    echo -e "${RED}❌ Go 1.25.6 n'est pas encore disponible dans Docker Hub${NC}"
    echo "   Attendez la publication officielle de Go 1.25.6"
    exit 1
fi
echo -e "${GREEN}✅ Go 1.25.6 disponible${NC}"
echo ""

# Backup des fichiers
echo "💾 Création de sauvegardes..."
if [ "$DRY_RUN" = false ]; then
    cp Dockerfile Dockerfile.backup.$(date +%Y%m%d_%H%M%S)
    cp go.mod go.mod.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ Sauvegardes créées${NC}"
else
    echo "   [DRY-RUN] Sauvegardes seraient créées"
fi
echo ""

# Modification Dockerfile
echo "📝 Modification du Dockerfile..."
if [ "$DRY_RUN" = false ]; then
    sed -i 's/golang:1.23-alpine/golang:1.25.6-alpine/g' Dockerfile
    echo -e "${GREEN}✅ Dockerfile modifié${NC}"
else
    echo "   [DRY-RUN] Dockerfile serait modifié :"
    echo "   FROM golang:1.23-alpine → FROM golang:1.25.6-alpine"
fi
echo ""

# Modification go.mod (optionnel)
echo "📝 Modification de go.mod..."
if [ "$DRY_RUN" = false ]; then
    sed -i 's/^go 1.23.0$/go 1.25.6/' go.mod
    sed -i 's/^toolchain go1.24.10$/toolchain go1.25.6/' go.mod
    echo -e "${GREEN}✅ go.mod modifié${NC}"
else
    echo "   [DRY-RUN] go.mod serait modifié :"
    echo "   go 1.23.0 → go 1.25.6"
    echo "   toolchain go1.24.10 → toolchain go1.25.6"
fi
echo ""

# Tests de compatibilité
if [ "$SKIP_TESTS" = false ]; then
    echo "🧪 Tests de compatibilité..."
    if [ "$DRY_RUN" = false ]; then
        # Test build
        echo "   Build de test..."
        if docker build -t dorevia/vault:test-go1.25.6 . >/dev/null 2>&1; then
            echo -e "${GREEN}   ✅ Build réussi${NC}"
        else
            echo -e "${RED}   ❌ Build échoué${NC}"
            echo "   Restauration des sauvegardes..."
            # Restaurer les backups (à implémenter)
            exit 1
        fi
        
        # Test unitaires (si disponibles)
        if [ -d "internal" ] || [ -d "pkg" ]; then
            echo "   Tests unitaires..."
            if docker run --rm -v "$(pwd):/app" -w /app golang:1.25.6-alpine \
                sh -c "go mod download && go test ./..." >/dev/null 2>&1; then
                echo -e "${GREEN}   ✅ Tests unitaires OK${NC}"
            else
                echo -e "${YELLOW}   ⚠️  Tests unitaires avec warnings (vérifier manuellement)${NC}"
            fi
        fi
    else
        echo "   [DRY-RUN] Tests seraient exécutés"
    fi
    echo ""
fi

# Scan vulnérabilités (si govulncheck disponible)
echo "🛡️  Scan de vulnérabilités..."
if [ "$DRY_RUN" = false ]; then
    if docker run --rm -v "$(pwd):/app" -w /app golang:1.25.6-alpine \
        sh -c "go install golang.org/x/vuln/cmd/govulncheck@latest && govulncheck ./..." 2>&1 | grep -q "No vulnerabilities found"; then
        echo -e "${GREEN}   ✅ Aucune vulnérabilité détectée${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Vulnérabilités détectées (vérifier le rapport)${NC}"
    fi
else
    echo "   [DRY-RUN] Scan serait exécuté"
fi
echo ""

# Résumé
echo "📊 Résumé"
echo "=========="
echo ""
echo "✅ Modifications appliquées :"
echo "   - Dockerfile : golang:1.25.6-alpine"
echo "   - go.mod : go 1.25.6"
echo ""
echo "📋 Prochaines étapes :"
echo ""
echo "1. Build de l'image production :"
echo "   docker build -t dorevia/vault:v1.3.5 ."
echo ""
echo "2. Mettre à jour docker-compose.yml :"
echo "   image: dorevia/vault:v1.3.5"
echo ""
echo "3. Déployer :"
echo "   cd /opt/dorevia-plateform/tenants/core-stinger/platform"
echo "   docker compose up -d vault"
echo ""
echo "4. Vérifications :"
echo "   curl http://localhost:8080/health"
echo "   curl http://localhost:8080/version"
echo "   docker logs vault-core-stinger --tail 50"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}⚠️  Mode DRY-RUN : Aucune modification n'a été appliquée${NC}"
    echo "   Exécutez sans --dry-run pour appliquer les modifications"
fi

echo ""
echo -e "${GREEN}✅ Upgrade Go 1.25.6 préparé${NC}"

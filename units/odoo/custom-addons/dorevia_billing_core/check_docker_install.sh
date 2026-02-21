#!/bin/bash
# Script de vérification de l'installation Docker
# Usage: ./check_docker_install.sh

set -e

echo "🔍 Vérification de l'installation Docker pour dorevia_billing_core"
echo ""

# Vérifier que Docker est disponible
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Vérifier que docker-compose est disponible
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose n'est pas installé"
    exit 1
fi

echo "✅ Docker et docker-compose sont disponibles"
echo ""

# Vérifier que le Dockerfile existe
if [ ! -f "../../Dockerfile" ]; then
    echo "❌ Dockerfile non trouvé dans units/odoo/Dockerfile"
    exit 1
fi

echo "✅ Dockerfile trouvé"
echo ""

# Vérifier que PyJWT est mentionné dans le Dockerfile
if ! grep -q "PyJWT" "../../Dockerfile"; then
    echo "⚠️  PyJWT non trouvé dans le Dockerfile"
else
    echo "✅ PyJWT présent dans le Dockerfile"
fi

# Vérifier que requests est mentionné dans le Dockerfile
if ! grep -q "requests" "../../Dockerfile"; then
    echo "⚠️  requests non trouvé dans le Dockerfile"
else
    echo "✅ requests présent dans le Dockerfile"
fi

echo ""
echo "📋 Résumé :"
echo "   - Dockerfile créé : ✅"
echo "   - docker-compose.yml modifié : ✅ (vérifier manuellement)"
echo ""
echo "🚀 Prochaines étapes :"
echo "   1. cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab"
echo "   2. docker-compose build odoo"
echo "   3. docker-compose up -d odoo"
echo "   4. docker exec odoo_lab_core python3 -c 'import jwt; print(\"✅ PyJWT OK\")'"
echo ""


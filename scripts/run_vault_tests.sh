#!/bin/bash
set -e

TENANT="${1:-core}"
ENV="${2:-lab}"
TEST_TAGS="${3:-dorevia_vault_connector}"
DB_NAME="odoo_${ENV}_${TENANT}"
ODOO_CONTAINER="odoo_${ENV}_${TENANT}"

echo "🧪 Exécution des tests dorevia_vault_connector"
echo "   Tenant: ${TENANT}, Env: ${ENV}, DB: ${DB_NAME}"

if ! docker ps -a --format '{{.Names}}' | grep -q "^${ODOO_CONTAINER}$"; then
    echo "❌ Container ${ODOO_CONTAINER} introuvable"
    exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${ODOO_CONTAINER}$"; then
    echo "⚠️  Démarrage du container..."
    docker start ${ODOO_CONTAINER}
    sleep 2
fi

echo "🚀 Exécution des tests..."
# Port 8070 pour éviter conflit si Odoo tourne déjà dans le container (port 8069)
docker exec ${ODOO_CONTAINER} odoo \
    -d ${DB_NAME} \
    --test-enable \
    --stop-after-init \
    --test-tags=${TEST_TAGS} \
    --log-level=test \
    --http-port=8070

EXIT_CODE=$?
if [ ${EXIT_CODE} -eq 0 ]; then
    echo "✅ Tous les tests sont passés !"
else
    echo "❌ Certains tests ont échoué"
fi
exit ${EXIT_CODE}

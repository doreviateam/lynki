#!/bin/bash
# Script pour vérifier la configuration dorevia.vault.url dans Odoo

set -e

TENANT="${1:-sarl-la-platine}"
ENV="${2:-stinger}"

echo "🔍 Vérification de la configuration dorevia.vault.url pour ${TENANT} (${ENV})"
echo ""

# Nom du container Odoo (les containers utilisent des tirets, pas des underscores)
ODOO_CONTAINER="odoo_${ENV}_${TENANT}"
DB_CONTAINER="odoo_db_${ENV}_${TENANT}"
DB_NAME="odoo_${ENV}_${TENANT}"

echo "📦 Containers:"
echo "   - Odoo: ${ODOO_CONTAINER}"
echo "   - DB: ${DB_CONTAINER}"
echo "   - Base: ${DB_NAME}"
echo ""

# Vérifier si les containers existent
if ! docker ps -a --format '{{.Names}}' | grep -q "^${ODOO_CONTAINER}$"; then
    echo "❌ Container Odoo ${ODOO_CONTAINER} introuvable"
    exit 1
fi

if ! docker ps -a --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo "❌ Container DB ${DB_CONTAINER} introuvable"
    exit 1
fi

echo "✅ Containers trouvés"
echo ""

# Vérifier les paramètres dans la base de données
echo "🔍 Vérification des paramètres système:"
echo ""

# Vérifier dorevia.vault.url
VAULT_URL=$(docker exec ${DB_CONTAINER} psql -U odoo -d ${DB_NAME} -t -c "SELECT value FROM ir_config_parameter WHERE key = 'dorevia.vault.url';" 2>/dev/null | xargs || echo "")

if [ -z "$VAULT_URL" ]; then
    echo "❌ dorevia.vault.url : NON CONFIGURÉ"
else
    echo "✅ dorevia.vault.url : ${VAULT_URL}"
fi

# Vérifier dorevia.vault.token
VAULT_TOKEN=$(docker exec ${DB_CONTAINER} psql -U odoo -d ${DB_NAME} -t -c "SELECT value FROM ir_config_parameter WHERE key = 'dorevia.vault.token';" 2>/dev/null | xargs || echo "")

if [ -z "$VAULT_TOKEN" ]; then
    echo "⚠️  dorevia.vault.token : NON CONFIGURÉ (optionnel)"
else
    echo "✅ dorevia.vault.token : ${VAULT_TOKEN:0:20}... (masqué)"
fi

# Vérifier aussi les paramètres DVIG pour référence
echo ""
echo "📋 Paramètres DVIG (pour référence):"
DVIG_URL=$(docker exec ${DB_CONTAINER} psql -U odoo -d ${DB_NAME} -t -c "SELECT value FROM ir_config_parameter WHERE key = 'dorevia.dvig.url';" 2>/dev/null | xargs || echo "")
if [ -z "$DVIG_URL" ]; then
    echo "❌ dorevia.dvig.url : NON CONFIGURÉ"
else
    echo "✅ dorevia.dvig.url : ${DVIG_URL}"
fi

DVIG_SOURCE=$(docker exec ${DB_CONTAINER} psql -U odoo -d ${DB_NAME} -t -c "SELECT value FROM ir_config_parameter WHERE key = 'dorevia.dvig.source';" 2>/dev/null | xargs || echo "")
if [ -z "$DVIG_SOURCE" ]; then
    echo "❌ dorevia.dvig.source : NON CONFIGURÉ"
else
    echo "✅ dorevia.dvig.source : ${DVIG_SOURCE}"
fi

echo ""
echo "📝 Recommandation pour dorevia.vault.url:"
echo "   https://vault.core-stinger.doreviateam.com"
echo ""

if [ -z "$VAULT_URL" ]; then
    echo "💡 Pour configurer dorevia.vault.url, exécutez:"
    echo ""
    echo "docker exec ${DB_CONTAINER} psql -U odoo -d ${DB_NAME} -c \\"
    echo "  \"INSERT INTO ir_config_parameter (key, value, create_date, write_date) \\"
    echo "   VALUES ('dorevia.vault.url', 'https://vault.core-stinger.doreviateam.com', NOW(), NOW()) \\"
    echo "   ON CONFLICT (key) DO UPDATE SET value = 'https://vault.core-stinger.doreviateam.com', write_date = NOW();\""
    echo ""
fi

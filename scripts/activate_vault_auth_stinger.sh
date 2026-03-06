#!/bin/bash
# Script pour activer l'authentification JWT sur le vault STINGER

set -e

echo "🔐 Activation de l'authentification JWT - Vault STINGER"
echo ""

# Variables
TENANT="core-stinger"
ENV="stinger"
KEYS_DIR="/opt/dorevia-plateform/tenants/${TENANT}/secrets/keys"
COMPOSE_FILE="/opt/dorevia-plateform/tenants/${TENANT}/platform/docker-compose.yml"

# Créer le répertoire des clés
mkdir -p "${KEYS_DIR}"

echo "📁 Répertoire des clés : ${KEYS_DIR}"
echo ""

# Étape 1 : Générer les clés RSA
echo "🔑 Étape 1 : Génération des clés RSA..."
if [ ! -f "${KEYS_DIR}/jwt-private.pem" ] || [ ! -f "${KEYS_DIR}/jwt-public.pem" ]; then
    echo "   Génération d'une nouvelle paire de clés RSA 2048 bits..."
    openssl genrsa -out "${KEYS_DIR}/jwt-private.pem" 2048
    openssl rsa -in "${KEYS_DIR}/jwt-private.pem" -pubout -out "${KEYS_DIR}/jwt-public.pem"
    chmod 600 "${KEYS_DIR}/jwt-private.pem"
    chmod 644 "${KEYS_DIR}/jwt-public.pem"
    echo "   ✅ Clés générées"
else
    echo "   ✅ Clés existantes trouvées"
fi
echo ""

# Étape 2 : Générer un token JWT pour Odoo
echo "🔑 Étape 2 : Génération du token JWT pour Odoo..."
echo "   Pour générer le token, vous avez besoin de l'outil token-gen"
echo "   ou vous pouvez utiliser jwt-cli/openssl manuellement"
echo ""
echo "   Commande recommandée (si token-gen disponible) :"
echo "   cd sources/vault && go build -o /tmp/token-gen ./cmd/token-gen/main.go"
echo "   /tmp/token-gen -key ${KEYS_DIR}/jwt-private.pem -sub odoo.stinger.sarl-la-platine -role operator -exp 365"
echo ""

# Étape 3 : Modifier docker-compose.yml
echo "📝 Étape 3 : Modification du docker-compose.yml..."
echo "   Fichier : ${COMPOSE_FILE}"
echo ""
echo "   Ajouter dans la section 'vault' -> 'environment' :"
echo "   - AUTH_ENABLED=true"
echo "   - AUTH_JWT_ENABLED=true"
echo "   - AUTH_JWT_PUBLIC_KEY_PATH=/opt/dorevia-vault/keys/jwt-public.pem"
echo ""
echo "   Ajouter dans la section 'vault' -> 'volumes' :"
echo "   - ${KEYS_DIR}:/opt/dorevia-vault/keys:ro"
echo ""

# Étape 4 : Instructions pour Odoo
echo "📝 Étape 4 : Configuration du token dans Odoo..."
echo "   Une fois le token généré, configurer dans Odoo :"
echo ""
echo "   docker exec odoo_db_stinger_sarl-la-platine psql -U odoo -d odoo_stinger_sarl-la-platine -c \\"
echo "     \"INSERT INTO ir_config_parameter (key, value, create_date, write_date) \\"
echo "      VALUES ('dorevia.vault.token', '<TOKEN_GENERE>', NOW(), NOW()) \\"
echo "      ON CONFLICT (key) DO UPDATE SET value = '<TOKEN_GENERE>', write_date = NOW();\""
echo ""

# Étape 5 : Redémarrage
echo "🔄 Étape 5 : Redémarrage du vault..."
echo "   cd /opt/dorevia-plateform/tenants/${TENANT}/platform"
echo "   docker compose restart vault"
echo ""

# Étape 6 : Vérification
echo "✅ Étape 6 : Vérification..."
echo "   # Test sans token (devrait retourner 401)"
echo "   curl -s -o /dev/null -w '%{http_code}' https://vault.core-stinger.doreviateam.com/api/v1/proof/account_move/3"
echo ""
echo "   # Test avec token (devrait fonctionner)"
echo "   curl -s -H 'Authorization: Bearer <TOKEN>' https://vault.core-stinger.doreviateam.com/api/v1/proof/account_move/3"
echo ""

echo "📚 Documentation complète : ZeDocs/TestV2/GUIDE_ACTIVATION_AUTH_VAULT_STINGER.md"
echo ""
echo "⚠️  IMPORTANT :"
echo "   - Ne JAMAIS exposer la clé privée (jwt-private.pem)"
echo "   - Stocker le token de manière sécurisée"
echo "   - Tester avant de mettre en production"
echo ""

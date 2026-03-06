#!/bin/bash
# Applique les paramètres Odoo pour viser un vaultage ≤ 30 s (AVIS_DUREE_PROCESSUS_VAULT §6).
# À exécuter une fois par instance Odoo (ex. sarl-la-platine stinger).
# Valeurs par défaut : token = DVIG_INTERNAL_TOKEN du compose core-stinger ; URL = dvig.core-stinger + /internal/outbox/process.
# Usage: ./scripts/set_odoo_config_duree_vault_30s.sh
#        DVIG_INTERNAL_URL=https://... DVIG_INTERNAL_TOKEN=... ./scripts/set_odoo_config_duree_vault_30s.sh  # pour surcharger

set -euo pipefail

ODOO_DB="${ODOO_DB_CONTAINER:-odoo_db_stinger_sarl-la-platine}"
DB_NAME="${DB_NAME:-odoo_stinger_sarl-la-platine}"

# Valeurs par défaut (alignées sur tenants/core-stinger/platform/docker-compose.yml)
DEFAULT_TOKEN="0MutdWWm97SG7KAHCd3jqGL7aYZNptuqSJiGyEOIzSI"
DEFAULT_URL="https://dvig.core-stinger.doreviateam.com/internal/outbox/process"

DVIG_INTERNAL_TOKEN="${DVIG_INTERNAL_TOKEN:-$DEFAULT_TOKEN}"
DVIG_INTERNAL_URL="${DVIG_INTERNAL_URL:-$DEFAULT_URL}"

echo "============================================================"
echo "🔧 Application config Odoo — objectif vaultage ≤ 30 s"
echo "============================================================"
echo "   Base      : $DB_NAME"
echo "   Conteneur : $ODOO_DB"
echo "   URL       : $DVIG_INTERNAL_URL"
echo "   Token     : (longueur ${#DVIG_INTERNAL_TOKEN})"
echo ""

# Échapper les simples quotes pour SQL (pour valeur)
escape_sql() {
  echo "$1" | sed "s/'/''/g"
}
TOKEN_ESC=$(escape_sql "$DVIG_INTERNAL_TOKEN")
URL_ESC=$(escape_sql "$DVIG_INTERNAL_URL")

# 1) dorevia.dvig.internal.token
docker exec "$ODOO_DB" psql -U odoo -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "
UPDATE ir_config_parameter SET value = '$TOKEN_ESC', write_date = NOW() WHERE key = 'dorevia.dvig.internal.token';
INSERT INTO ir_config_parameter (key, value, create_date, write_date, create_uid, write_uid)
SELECT 'dorevia.dvig.internal.token', '$TOKEN_ESC', NOW(), NOW(), 2, 2
WHERE NOT EXISTS (SELECT 1 FROM ir_config_parameter WHERE key = 'dorevia.dvig.internal.token');
" 2>/dev/null && echo "   ✅ dorevia.dvig.internal.token mis à jour" || { echo "   ❌ Erreur (conteneur/DB ?)"; exit 1; }

# 2) dorevia.dvig.internal.url
docker exec "$ODOO_DB" psql -U odoo -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "
UPDATE ir_config_parameter SET value = '$URL_ESC', write_date = NOW() WHERE key = 'dorevia.dvig.internal.url';
INSERT INTO ir_config_parameter (key, value, create_date, write_date, create_uid, write_uid)
SELECT 'dorevia.dvig.internal.url', '$URL_ESC', NOW(), NOW(), 2, 2
WHERE NOT EXISTS (SELECT 1 FROM ir_config_parameter WHERE key = 'dorevia.dvig.internal.url');
" 2>/dev/null && echo "   ✅ dorevia.dvig.internal.url mis à jour" || { echo "   ❌ Erreur"; exit 1; }

echo ""
echo "============================================================"
echo "✅ Config appliquée. Vérifier avec : ./scripts/check_config_duree_vault_30s.sh"
echo "   Puis tester avec une nouvelle facture + ./scripts/test_duree_vault_sarl_la_platine.sh <id>"
echo "============================================================"

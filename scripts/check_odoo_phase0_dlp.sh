#!/bin/bash
# Vérification Phase 0 DLP — Modules project et hr_timesheet sur Odoo
# Usage : ./scripts/check_odoo_phase0_dlp.sh [tenant] [env]
# Exemple : ./scripts/check_odoo_phase0_dlp.sh sarl-la-platine stinger

set -e

TENANT="${1:-sarl-la-platine}"
ENV="${2:-stinger}"
DB_CONTAINER="odoo_db_${ENV}_${TENANT}"
# Nom de la BDD Odoo (dbfilter) : odoo_<env>_<tenant>
DB_NAME="odoo_${ENV}_${TENANT}"
DB_USER="odoo"
DB_PASS="${ODOO_DB_PASSWORD:-odoo}"

echo "=== Vérification Phase 0 DLP — Odoo $TENANT ==="
echo ""

# Vérifier que le conteneur existe et tourne
if ! docker ps --format '{{.Names}}' | grep -q "${DB_CONTAINER}"; then
  echo "❌ Conteneur $DB_CONTAINER non trouvé ou arrêté."
  echo "   Démarrer Odoo : ./bin/dorevia.sh app up odoo stinger $TENANT"
  exit 1
fi

echo "📦 Conteneur DB : $DB_CONTAINER"
echo ""

# Vérifier les modules
echo "--- Modules project et hr_timesheet ---"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
  SELECT 
    name, 
    state,
    CASE WHEN state = 'installed' THEN '✅' ELSE '❌' END as status
  FROM ir_module_module 
  WHERE name IN ('project', 'hr_timesheet')
  ORDER BY name;
" 2>/dev/null || {
  echo "❌ Impossible de se connecter à la base. Vérifier les identifiants."
  exit 1
}

echo ""
echo "--- Projets existants (5 derniers) ---"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
  SELECT id, name FROM project_project ORDER BY id DESC LIMIT 5;
" 2>/dev/null || echo "⚠ Table project_project absente (module project non installé?)"

echo ""
echo "--- Lignes timesheet (5 dernières) ---"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
  SELECT id, project_id, company_id, unit_amount, date 
  FROM account_analytic_line 
  WHERE project_id IS NOT NULL 
  ORDER BY id DESC LIMIT 5;
" 2>/dev/null || echo "⚠ Table account_analytic_line ou projet absent"

echo ""
echo "=== Fin vérification ==="

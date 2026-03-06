#!/bin/bash
# Installe les modules project et hr_timesheet sur Odoo (prérequis Phase 0 DLP)
# Arrête Odoo temporairement, exécute l'installation, puis redémarre.
# Usage : ./scripts/install_odoo_modules_dlp.sh [tenant] [env]

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TENANT="${1:-sarl-la-platine}"
ENV="${2:-stinger}"
COMPOSE_DIR="${ROOT_DIR}/tenants/${TENANT}/apps/odoo/${ENV}"
DB_NAME="odoo_${ENV}_${TENANT}"

echo "=== Installation modules project + hr_timesheet — $TENANT ($ENV) ==="

if [ ! -f "${COMPOSE_DIR}/docker-compose.yml" ]; then
  echo "❌ docker-compose non trouvé : $COMPOSE_DIR"
  echo "   Vérifier : ./bin/dorevia.sh render $TENANT --env $ENV"
  exit 1
fi

echo "⏸ Arrêt d'Odoo..."
cd "$COMPOSE_DIR"
docker compose stop odoo 2>/dev/null || true
sleep 2

echo "📦 Installation des modules (peut prendre 1–2 min)..."
docker compose run --rm --no-deps odoo \
  odoo -c /etc/odoo/odoo.conf -d "$DB_NAME" -i project,hr_timesheet --stop-after-init \
  2>&1 | tail -25

echo ""
echo "▶ Redémarrage d'Odoo..."
docker compose start odoo

echo ""
echo "✅ Installation terminée. Vérifier : ./scripts/check_odoo_phase0_dlp.sh $TENANT $ENV"

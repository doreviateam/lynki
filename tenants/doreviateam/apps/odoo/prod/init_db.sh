#!/bin/bash
# Initialise la base doreviateam (à exécuter sur le serveur, après up -d)
set -e
cd "$(dirname "$0")"

# Charger le .env dans le shell pour que Compose le substitue correctement
set -a
source .env 2>/dev/null || export $(grep -v '^#' .env | xargs)
set +a

echo "[init_db] Création et initialisation de la base doreviateam..."
docker compose -f docker-compose.prod-o19.yml run --rm --no-deps odoo sh -c '
  sed "s|__POSTGRES_PASSWORD__|$POSTGRES_PASSWORD|g" /etc/odoo/odoo.conf.template | sed "s|__ADMIN_PASSWD__|$ADMIN_PASSWD|g" > /tmp/odoo.conf
  odoo -c /tmp/odoo.conf -d doreviateam -i base --stop-after-init
'
echo "[init_db] Terminé. Accès : https://odoo.doreviateam.com/web/login"

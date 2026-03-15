#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "[bootstrap] ERREUR: fichier .env introuvable"
  exit 1
fi

sed -i 's/\r$//' .env

set -a
. ./.env
set +a

POSTGRES_PASSWORD="$(printf '%s' "${POSTGRES_PASSWORD:-}" | tr -d '\r\n')"
ADMIN_PASSWD="$(printf '%s' "${ADMIN_PASSWD:-}" | tr -d '\r\n')"
export POSTGRES_PASSWORD ADMIN_PASSWD

if [ -z "$POSTGRES_PASSWORD" ]; then
  echo "[bootstrap] ERREUR: POSTGRES_PASSWORD vide"
  exit 1
fi

if [ -z "$ADMIN_PASSWD" ]; then
  echo "[bootstrap] ERREUR: ADMIN_PASSWD vide"
  exit 1
fi

COMPOSE="docker compose -f docker-compose.prod-o19.yml"
DB_USER="firmin_christelle"
DB_NAME="firmin_christelle"

echo "[bootstrap] .env chargé (POSTGRES_PASSWORD length: ${#POSTGRES_PASSWORD})"
echo "[bootstrap] Arrêt et suppression du volume DB..."
$COMPOSE down
docker volume rm odoo_prod_firmin_christelle_db 2>/dev/null || true

echo "[bootstrap] Démarrage de la stack..."
$COMPOSE up -d db odoo

echo "[bootstrap] Attente disponibilité DB..."
for i in $(seq 1 30); do
  if $COMPOSE exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" db \
      psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "select 1" >/dev/null 2>&1; then
    echo "[bootstrap] DB prête"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "[bootstrap] ERREUR: impossible de joindre Postgres"
    exit 1
  fi
  sleep 2
done

echo "[bootstrap] Arrêt Odoo pour init..."
$COMPOSE stop odoo

echo "[bootstrap] Initialisation Odoo..."
$COMPOSE run --rm \
  -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  -e ADMIN_PASSWD="$ADMIN_PASSWD" \
  odoo sh -c '
    python3 - <<'"'"'PY'"'"'
import os, sys

tpl_path = "/etc/odoo/odoo.conf.template"
out_path = "/tmp/odoo.conf"

with open(tpl_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("__POSTGRES_PASSWORD__", os.environ["POSTGRES_PASSWORD"])
content = content.replace("__ADMIN_PASSWD__", os.environ["ADMIN_PASSWD"])

if "__POSTGRES_PASSWORD__" in content or "__ADMIN_PASSWD__" in content:
    print("[bootstrap:init] ERREUR: placeholders non remplacés")
    sys.exit(1)

with open(out_path, "w", encoding="utf-8") as f:
    f.write(content)

print("[bootstrap:init] /tmp/odoo.conf généré")
print("[bootstrap:init] POSTGRES_PASSWORD length =", len(os.environ["POSTGRES_PASSWORD"]))
PY

    exec odoo -c /tmp/odoo.conf -d firmin_christelle -i base --load-language=fr_FR --stop-after-init
  '

echo "[bootstrap] Redémarrage Odoo..."
$COMPOSE start odoo

echo "[bootstrap] Terminé."
echo "[bootstrap] URL : https://firmin.christelle.doreviateam.com/web/login"

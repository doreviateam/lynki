#!/usr/bin/env bash
# À exécuter SUR L’HÔTE qui sert https://glz-rgl.doreviateam.com (après SSH), pas depuis un poste sans Docker distant.
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-/opt/dorevia-plateform}"
CONTAINER="${ODOO_CONTAINER:-odoo_lab_glz-rgl}"
DB_NAME="${ODOO_DB:-odoo_lab_glz_rgl}"
ODOO_CONF="${ODOO_CONF:-/etc/odoo/odoo.conf}"

echo "[upgrade-dorevia] REPO_ROOT=$REPO_ROOT"
echo "[upgrade-dorevia] CONTAINER=$CONTAINER DB=$DB_NAME"

cd "$REPO_ROOT"
git pull origin "${GIT_BRANCH:-web60-w60-103-tresorerie-contour-etat}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "[upgrade-dorevia] ERREUR: conteneur « $CONTAINER » introuvable (docker ps)." >&2
  exit 1
fi

# Nouveau module : « upgrade » refuse si le module n’est pas encore installé (UserError).
docker exec "$CONTAINER" odoo module install -c "$ODOO_CONF" -d "$DB_NAME" dorevia_res_config_dms_shim \
  || docker exec "$CONTAINER" odoo module upgrade -c "$ODOO_CONF" -d "$DB_NAME" dorevia_res_config_dms_shim

docker exec "$CONTAINER" odoo module upgrade -c "$ODOO_CONF" -d "$DB_NAME" \
  dorevia_partner_membership_fields \
  dorevia_helloasso_adherent

docker restart "$CONTAINER"
echo "[upgrade-dorevia] Terminé. Rafraîchir le navigateur (Ctrl+Shift+R) sur Odoo."

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

# Ordre séquentiel : les nouvelles colonnes res.partner sont dans membership_fields ;
# un seul « odoo module upgrade » multi-modules peut charger helloasso avant migration DB.
docker exec "$CONTAINER" odoo module upgrade -c "$ODOO_CONF" -d "$DB_NAME" \
  dorevia_partner_membership_fields

# Socle HelloAsso (client API + journal) — avant members / shim adherent.
docker exec "$CONTAINER" odoo module install -c "$ODOO_CONF" -d "$DB_NAME" dorevia_helloasso_connector \
  || docker exec "$CONTAINER" odoo module upgrade -c "$ODOO_CONF" -d "$DB_NAME" dorevia_helloasso_connector

# Métier synchro Membership (cron, wizard, paramètres res.config) — avant le shim adherent.
docker exec "$CONTAINER" odoo module install -c "$ODOO_CONF" -d "$DB_NAME" dorevia_helloasso_members \
  || docker exec "$CONTAINER" odoo module upgrade -c "$ODOO_CONF" -d "$DB_NAME" dorevia_helloasso_members

docker exec "$CONTAINER" odoo module upgrade -c "$ODOO_CONF" -d "$DB_NAME" \
  dorevia_helloasso_adherent

# Journal HelloAsso : modèle dorevia.helloasso.logentry + droits via _register_hook (pas de CSV ir.model.access).
ADH_SYNC_LOG="/mnt/custom-addons/dorevia_helloasso_connector/models/helloasso_sync_log.py"
if ! docker exec "$CONTAINER" grep -q "dorevia.helloasso.logentry" "$ADH_SYNC_LOG" 2>/dev/null; then
  echo "[upgrade-dorevia] ERREUR: « $ADH_SYNC_LOG » ne contient pas « dorevia.helloasso.logentry » (conteneur)." >&2
  echo "[upgrade-dorevia] git pull sur REPO_ROOT, puis redémarrer le conteneur si le volume est à jour." >&2
  exit 1
fi

# App HelloAsso (menus, liste adhésions, billetterie / commandes) : dépend de members (+ shim adherent pour la chaîne).
# Si la vue XML référence catalog_form_id mais que le .py du conteneur est ancien → ParseError au upgrade.
BILLET_MOD="/mnt/custom-addons/dorevia_helloasso_billetterie/models"
if ! docker exec "$CONTAINER" sh -c "grep -rq catalog_form_id ${BILLET_MOD}/helloasso_billetterie_order*.py" 2>/dev/null; then
  echo "[upgrade-dorevia] ERREUR: aucun « catalog_form_id » dans helloasso_billetterie_order*.py sous ${BILLET_MOD} (conteneur)." >&2
  echo "[upgrade-dorevia] Sur l’hôte: git pull dans REPO_ROOT, vérifier les fichiers, puis redémarrer le conteneur." >&2
  exit 1
fi
docker exec "$CONTAINER" odoo module install -c "$ODOO_CONF" -d "$DB_NAME" dorevia_helloasso_billetterie \
  || docker exec "$CONTAINER" odoo module upgrade -c "$ODOO_CONF" -d "$DB_NAME" dorevia_helloasso_billetterie

docker restart "$CONTAINER"
echo "[upgrade-dorevia] Terminé. Rafraîchir le navigateur (Ctrl+Shift+R) sur Odoo."

#!/bin/bash
# Réinstallation complète Odoo o19 — FR + plan comptable FR + Vault/DVIG
# Usage: cd tenants/o19/apps/odoo/lab && ./reinstall_o19.sh
# Avec dump: DUMP_FILE=/tmp/mon_dump.dump ./reinstall_o19.sh
# Ou: ./reinstall_o19.sh /tmp/mon_dump.dump

set -euo pipefail
ROOT="/opt/dorevia-plateform"
LAB_DIR="$ROOT/tenants/o19/apps/odoo/lab"
COMPOSE_FILE="$LAB_DIR/docker-compose.yml"
COMPOSE_PROJECT="dorevia_odoo_lab_o19"
DB_NAME="odoo_lab_o19"

# Dump optionnel : DUMP_FILE ou premier argument
DUMP_FILE="${DUMP_FILE:-${1:-}}"

dc() { docker compose -f "$COMPOSE_FILE" -p "$COMPOSE_PROJECT" "$@"; }

echo "=== Réinstallation Odoo o19 (FR + plan comptable FR) ==="
[[ -n "$DUMP_FILE" ]] && echo "Dump à restaurer: $DUMP_FILE"

# 1. Arrêter Odoo
echo "[1/10] Arrêt Odoo..."
dc stop odoo 2>/dev/null || true

# 2. Supprimer la base
echo "[2/10] Suppression base $DB_NAME..."
docker exec odoo_db_lab_o19 psql -U odoo -d postgres -c "
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
" 2>/dev/null || true
docker exec odoo_db_lab_o19 psql -U odoo -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true

# 3. Supprimer le filestore (optionnel)
echo "[3/10] Nettoyage filestore..."
docker run --rm -v odoo_lab_o19_data:/data alpine sh -c "rm -rf /data/filestore/$DB_NAME" 2>/dev/null || true

# 4. Créer la base : soit init vierge, soit restaurer le dump
if [[ -n "$DUMP_FILE" ]]; then
  if [[ ! -f "$DUMP_FILE" ]]; then
    echo "ERREUR: Fichier dump introuvable: $DUMP_FILE"
    exit 1
  fi
  echo "[4/10] Création base vide + restauration dump..."
  docker exec odoo_db_lab_o19 psql -U odoo -d postgres -c "CREATE DATABASE $DB_NAME;"
  docker cp "$DUMP_FILE" odoo_db_lab_o19:/tmp/restore.dump
  # Détecter format : custom (pg_restore) ou plain SQL (psql)
  if docker exec odoo_db_lab_o19 pg_restore -l /tmp/restore.dump &>/dev/null; then
    docker exec odoo_db_lab_o19 pg_restore -U odoo -d "$DB_NAME" --no-owner --no-privileges /tmp/restore.dump
    e=$?; [[ $e -eq 0 || $e -eq 1 ]] || exit $e
  else
    docker exec -i odoo_db_lab_o19 psql -U odoo -d "$DB_NAME" -f /tmp/restore.dump
  fi
  docker exec odoo_db_lab_o19 rm -f /tmp/restore.dump
else
  echo "[4a/10] Phase 1 : base uniquement (société créée)..."
  dc run --rm odoo sh -c "
    /mnt/custom-addons/bin/oca_flatten.sh && \
    odoo -c /etc/odoo/odoo.conf -d $DB_NAME \
      -i base --load-language=fr_FR --stop-after-init
  "
  echo "[4b/10] Forcer société en France avant plan comptable..."
  dc up -d odoo 2>/dev/null || true
  sleep 5
  docker exec -i odoo_lab_o19 odoo shell -d $DB_NAME --no-http < "$LAB_DIR/set_france_before_account.py" 2>&1 | tail -5
  dc stop odoo 2>/dev/null || true
  echo "[4c/10] Phase 2 : account + l10n_fr + plan comptable FR + sale (avec démo)..."
  dc run --rm odoo sh -c "
    /mnt/custom-addons/bin/oca_flatten.sh && \
    odoo -c /etc/odoo/odoo.conf -d $DB_NAME \
      -i account,l10n_fr,l10n_fr_account,sale \
      --load-language=fr_FR \
      --stop-after-init
  "
fi

# 5. Démarrer Odoo puis configurer
echo "[5/10] Démarrage Odoo..."
dc up -d odoo
echo "Attente démarrage (15s)..."
sleep 15

# 6. Définir pays fiscal France (sauf si dump déjà configuré)
echo "[6/10] Configuration pays France..."
docker exec -i odoo_lab_o19 odoo shell -d $DB_NAME --no-http < "$LAB_DIR/configure_fr_plan_comptable.py" 2>&1 | tail -10

# 7. Installer queue_job, account_usability, account_statement_base, OCA rapprochement (web39), modules Dorevia (conteneur one-off)
echo "[7/10] Installation queue_job, account_usability, account_statement_base, account_reconcile_model_oca, account_reconcile_oca, dorevia_vault_connector, dorevia_session_guard..."
dc run --rm odoo sh -c "
  /mnt/custom-addons/bin/oca_flatten.sh && \
  odoo -c /etc/odoo/odoo.conf -d $DB_NAME \
    -i queue_job,account_usability,account_statement_base,account_reconcile_model_oca,account_reconcile_oca,dorevia_vault_connector,dorevia_session_guard --stop-after-init
" 2>&1 | tail -20

# 8. Configurer Vault/DVIG
# Token DVIG : secret brut (PAS l'ID tok_lab_o19_xxx). Si absent, exécuter fix_vault_token.sh
DOREVIA_DVIG_TOKEN="${DOREVIA_DVIG_TOKEN:-}"
if [[ -z "$DOREVIA_DVIG_TOKEN" ]]; then
  # Essayer de lire depuis tenants/o19/secrets/dvig.token (créé par fix_vault_token.sh --save)
  if [[ -f "$ROOT/tenants/o19/secrets/dvig.token" ]]; then
    DOREVIA_DVIG_TOKEN=$(cat "$ROOT/tenants/o19/secrets/dvig.token")
  fi
fi

echo "[8/10] Configuration Vault/DVIG..."
docker exec -e DOREVIA_DVIG_TOKEN="$DOREVIA_DVIG_TOKEN" -i odoo_lab_o19 odoo shell -d $DB_NAME --no-http < "$LAB_DIR/configure_vault_dvig.py" 2>&1 | tail -15

# 9. Données de test (clients, produits, commandes, factures)
echo "[9/10] Création données de test..."
docker exec -i odoo_lab_o19 odoo shell -d $DB_NAME --no-http < "$LAB_DIR/seed_donnees_tests.py" 2>&1 | tail -8

echo "[10/10] Terminé."
echo ""
echo "=== Réinstallation terminée ==="
echo "URL: https://odoo.lab.o19.doreviateam.com"
echo "Base: $DB_NAME | Langue: fr_FR | Plan comptable: FR (PCG)"
echo ""
if [[ -z "$DOREVIA_DVIG_TOKEN" ]]; then
  echo "ATTENTION: Token DVIG non trouvé. Exécuter manuellement:"
  echo "  export DOREVIA_DVIG_TOKEN=<votre_token>"
  echo "  docker exec -e DOREVIA_DVIG_TOKEN=\$DOREVIA_DVIG_TOKEN -i odoo_lab_o19 odoo shell -d $DB_NAME --no-http < $LAB_DIR/configure_vault_dvig.py"
fi

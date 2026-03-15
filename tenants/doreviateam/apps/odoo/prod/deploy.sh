#!/usr/bin/env bash
# Déploiement Odoo 19 prod Doreviateam — Phase 2
# À exécuter depuis ce répertoire (tenants/doreviateam/apps/odoo/prod/)
# ou depuis la racine du dépôt avec : ./tenants/doreviateam/apps/odoo/prod/deploy.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
COMPOSE_FILE="docker-compose.prod-o19.yml"

echo "[deploy] Répertoire: $SCRIPT_DIR"
echo "[deploy] Fichier Compose: $COMPOSE_FILE"

# --- Pre-flight : .env
if [[ ! -f .env ]]; then
  echo "[deploy] ERREUR: .env absent. Créer à partir de .env.example et renseigner POSTGRES_PASSWORD."
  exit 1
fi
if ! grep -q '^POSTGRES_PASSWORD=.\+' .env 2>/dev/null; then
  echo "[deploy] ERREUR: POSTGRES_PASSWORD non défini ou vide dans .env."
  exit 1
fi
echo "[deploy] .env OK"

# --- Pre-flight : template doit contenir les placeholders (pas de secrets en dur)
if ! grep -q '__ADMIN_PASSWD__\|__POSTGRES_PASSWORD__' odoo.prod-o19.conf.template 2>/dev/null; then
  echo "[deploy] ERREUR: odoo.prod-o19.conf.template doit contenir __ADMIN_PASSWD__ et __POSTGRES_PASSWORD__"
  exit 1
fi
echo "[deploy] Config Odoo OK"

# --- Réseau Docker
if ! docker network inspect dorevia-network &>/dev/null; then
  echo "[deploy] Création du réseau dorevia-network..."
  docker network create dorevia-network
fi
echo "[deploy] Réseau dorevia-network OK"

# --- Lancement
echo "[deploy] Lancement de la stack..."
docker compose -f "$COMPOSE_FILE" up -d

echo ""
echo "[deploy] Stack démarrée. Vérifier les logs :"
echo "  docker compose -f $COMPOSE_FILE logs -f odoo"
echo ""
echo "Dans les logs, vérifier la ligne: database: doreviateam"
echo "Puis configurer Caddy avec le contenu de caddy-snippet.conf (Phase 3)."
echo "URL cible: https://odoo.doreviateam.com"

#!/bin/bash
# render_app_compose.sh - Génération docker-compose.yml app depuis manifest Phase 1
# Usage: render_app_compose.sh <tenant> <univers> <env>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TENANTS_DIR="$ROOT_DIR/tenants"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error() {
  echo -e "${RED}ERROR: ${NC}$1" >&2
  exit 1
}

info() {
  echo -e "${GREEN}INFO: ${NC}$1"
}

# Vérifier arguments
if [[ $# -lt 3 ]]; then
  error "Usage: $0 <tenant> <univers> <env>"
fi

TENANT="$1"
UNIVERS="$2"
ENV="$3"

# Vérifier tenant
TENANT_DIR="$TENANTS_DIR/$TENANT"
if [[ ! -d "$TENANT_DIR" ]]; then
  error "Tenant introuvable: $TENANT"
fi

# Vérifier manifest
MANIFEST_FILE="$TENANT_DIR/state/manifest.json"
if [[ ! -f "$MANIFEST_FILE" ]]; then
  error "Manifest introuvable: $MANIFEST_FILE"
fi

# Vérifier jq
if ! command -v jq &> /dev/null; then
  error "jq n'est pas installé. Veuillez l'installer."
fi

info "Génération docker-compose.yml app pour tenant: $TENANT, univers: $UNIVERS, env: $ENV"

# Lire manifest
MANIFEST=$(cat "$MANIFEST_FILE")

# Extraire données
TENANT_ID=$(echo "$MANIFEST" | jq -r '.tenant_id')
UNIVERSES=$(echo "$MANIFEST" | jq -r '.universes[]')
ENVIRONMENTS=$(echo "$MANIFEST" | jq -r '.environments[]')
UNITS_APP=$(echo "$MANIFEST" | jq -r "(.units.${UNIVERS} // [])[]")

# Vérifier que l'univers est dans la liste
if ! echo "$UNIVERSES" | grep -q "^${UNIVERS}$"; then
  error "Univers '$UNIVERS' non activé pour tenant '$TENANT'"
fi

# Vérifier que l'env est dans la liste
if ! echo "$ENVIRONMENTS" | grep -q "^${ENV}$"; then
  error "Environnement '$ENV' non activé pour tenant '$TENANT'"
fi

# Extraire images
IMAGE_ODOO=$(echo "$MANIFEST" | jq -r '.images.odoo // "odoo:18.0-20250819"')
IMAGE_POSTGRES=$(echo "$MANIFEST" | jq -r '.images.postgres // "postgres:16"')
IMAGE_SUITECRM=$(echo "$MANIFEST" | jq -r '.images.suitecrm // "bitnami/suitecrm:8"')
IMAGE_MARIADB=$(echo "$MANIFEST" | jq -r '.images.mariadb // "mariadb:11"')
IMAGE_N8N=$(echo "$MANIFEST" | jq -r '.images.n8n // "n8nio/n8n:latest"')
IMAGE_APPSMITH=$(echo "$MANIFEST" | jq -r '.images.appsmith // "appsmith/appsmith-ce:release"')
IMAGE_LINKY=$(echo "$MANIFEST" | jq -r '.images.linky // "dorevia/linky:latest"')
# Option B : Vault partagé (ex. core-stinger) — si défini, Linky appelle ce Vault au lieu de vault-${TENANT_ID}
LINKY_VAULT_URL=$(echo "$MANIFEST" | jq -r '.linky_vault_url // ""')
# Fallback vault-health : si Vault 404, Linky appelle DVIG /internal/vault-health (SPEC Indicateur Confiance v1.0)
LINKY_DVIG_URL=$(echo "$MANIFEST" | jq -r '.linky_dvig_url // ""')
LINKY_DVIG_INTERNAL_TOKEN=$(echo "$MANIFEST" | jq -r '.linky_dvig_internal_token // ""')
# Noms affichés des sociétés dans le filtre Company (JSON : company_id → libellé)
LINKY_COMPANY_NAMES_RAW=$(echo "$MANIFEST" | jq -c '.linky_company_display_names // empty')
# DLP (Decision Link Performance) — si défini, Linky appelle ce service ; sinon fallback http://dlp:8020
LINKY_DLP_URL=$(echo "$MANIFEST" | jq -r '.linky_dlp_url // ""')

# Calculer noms
SOURCE="${UNIVERS}.${ENV}.${TENANT_ID}"
DB_NAME="${UNIVERS}_${ENV}_${TENANT_ID}"
COMPOSE_PROJECT="dorevia_${UNIVERS}_${ENV}_${TENANT_ID}"
VOLUME_DB="${UNIVERS}_${ENV}_${TENANT_ID}_db"
VOLUME_DB_NAME="${VOLUME_DB}"
VOLUME_DATA="${UNIVERS}_${ENV}_${TENANT_ID}_data"
VOLUME_DATA_NAME="${VOLUME_DATA}"

# Créer répertoire de sortie
OUTPUT_DIR="$TENANT_DIR/rendered/$ENV/$UNIVERS"
mkdir -p "$OUTPUT_DIR"
OUTPUT_FILE="$OUTPUT_DIR/docker-compose.yml"

# Générer docker-compose.yml
{
  echo "# Docker Compose - $UNIVERS $ENV $TENANT_ID"
  echo "# Généré automatiquement depuis manifest Phase 1"
  echo "# Source attendue: $SOURCE"
  echo "# DB name: $DB_NAME"
  echo "# Compose project: $COMPOSE_PROJECT"
  echo ""
  echo "services:"
  
  # Service DB — PostgreSQL (odoo ou n8n selon univers)
  if [[ "$UNIVERS" == "odoo" ]] && echo "$UNITS_APP" | grep -q "^postgres$"; then
    echo "  db:"
    echo "    image: $IMAGE_POSTGRES"
    echo "    container_name: ${UNIVERS}_db_${ENV}_${TENANT_ID}"
    echo "    restart: unless-stopped"
    echo "    environment:"
    echo "      POSTGRES_DB: odoo"
    echo "      POSTGRES_USER: odoo"
    echo "      POSTGRES_PASSWORD: odoo"
    echo "    volumes:"
    echo "      - ${VOLUME_DB}:/var/lib/postgresql/data"
    echo "    networks:"
    echo "      - dorevia-network"
    echo "    healthcheck:"
    echo "      test: [\"CMD-SHELL\", \"pg_isready -U odoo\"]"
    echo "      interval: 10s"
    echo "      timeout: 5s"
    echo "      retries: 5"
    echo ""
  fi
  if [[ "$UNIVERS" == "n8n" ]] && echo "$UNITS_APP" | grep -q "^postgres$"; then
    echo "  db:"
    echo "    image: $IMAGE_POSTGRES"
    echo "    container_name: ${UNIVERS}_db_${ENV}_${TENANT_ID}"
    echo "    restart: unless-stopped"
    echo "    environment:"
    echo "      POSTGRES_DB: n8n"
    echo "      POSTGRES_USER: n8n"
    echo "      POSTGRES_PASSWORD: n8n"
    echo "    volumes:"
    echo "      - ${VOLUME_DB}:/var/lib/postgresql/data"
    echo "    networks:"
    echo "      - dorevia-network"
    echo "    healthcheck:"
    echo "      test: [\"CMD-SHELL\", \"PGPASSWORD=n8n psql -U n8n -d n8n -h localhost -c 'SELECT 1' || exit 1\"]"
    echo "      interval: 10s"
    echo "      timeout: 5s"
    echo "      retries: 10"
    echo "      start_period: 15s"
    echo ""
  fi

  # Service DB — MariaDB (suitecrm)
  if [[ "$UNIVERS" == "suitecrm" ]] && echo "$UNITS_APP" | grep -q "^mariadb$"; then
    echo "  db:"
    echo "    image: $IMAGE_MARIADB"
    echo "    container_name: ${UNIVERS}_db_${ENV}_${TENANT_ID}"
    echo "    restart: unless-stopped"
    echo "    environment:"
    echo "      MARIADB_DATABASE: suitecrm"
    echo "      MARIADB_USER: suitecrm"
    echo "      MARIADB_PASSWORD: suitecrm"
    echo "      MARIADB_ROOT_PASSWORD: root"
    echo "    volumes:"
    echo "      - ${VOLUME_DB}:/var/lib/mysql"
    echo "    networks:"
    echo "      - dorevia-network"
    echo "    healthcheck:"
    echo '      test: ["CMD-SHELL", "mariadb -u root -p\"$$MARIADB_ROOT_PASSWORD\" -e \"SELECT 1\" || exit 1"]'
    echo "      interval: 10s"
    echo "      timeout: 5s"
    echo "      retries: 5"
    echo "      start_period: 30s"
    echo ""
  fi

  # Service Odoo (si odoo dans units app)
  if echo "$UNITS_APP" | grep -q "^odoo$"; then
    echo "  odoo:"
    echo "    image: $IMAGE_ODOO"
    echo "    container_name: ${UNIVERS}_${ENV}_${TENANT_ID}"
    echo "    restart: unless-stopped"
    if echo "$UNITS_APP" | grep -q "^postgres$"; then
      echo "    depends_on:"
      echo "      db:"
      echo "        condition: service_healthy"
    fi
    echo "    networks:"
    echo "      - dorevia-network"
    echo "    volumes:"
    echo "      # Sources OCA (read-only)"
    echo "      - $ROOT_DIR/sources/oca:/mnt/oca:ro"
    echo "      # Extra-addons flatten (symlinks)"
    echo "      - oca_extra_addons:/mnt/extra-addons"
    echo "      # Addons métier"
    echo "      - $ROOT_DIR/units/odoo/custom-addons:/mnt/custom-addons"
    echo "      # Config Odoo"
    echo "      - ./odoo.conf:/etc/odoo/odoo.conf:ro"
    echo "      # Filestore"
    echo "      - ${VOLUME_DATA}:/var/lib/odoo"
    echo "    # Exécuter oca_flatten.sh puis démarrer Odoo"
    echo "    command: [\"sh\", \"-c\", \"/mnt/custom-addons/bin/oca_flatten.sh && odoo -c /etc/odoo/odoo.conf\"]"
    echo "    # Pas de port exposé (routage via Caddy uniquement)"
    echo ""
  fi

  # Service SuiteCRM (univers suitecrm)
  if [[ "$UNIVERS" == "suitecrm" ]] && echo "$UNITS_APP" | grep -q "^suitecrm$"; then
    echo "  suitecrm:"
    echo "    image: $IMAGE_SUITECRM"
    echo "    container_name: ${UNIVERS}_${ENV}_${TENANT_ID}"
    echo "    restart: unless-stopped"
    if echo "$UNITS_APP" | grep -q "^mariadb$"; then
      echo "    depends_on:"
      echo "      db:"
      echo "        condition: service_healthy"
    fi
    echo "    environment:"
    echo "      SUITECRM_DATABASE_HOST: ${UNIVERS}_db_${ENV}_${TENANT_ID}"
    echo "      SUITECRM_DATABASE_NAME: suitecrm"
    echo "      SUITECRM_DATABASE_USER: suitecrm"
    echo "      SUITECRM_DATABASE_PASSWORD: suitecrm"
    echo "      SUITECRM_USERNAME: admin"
    echo "      SUITECRM_PASSWORD: admin"
    echo "      SUITECRM_HOST: ${SOURCE}.doreviateam.com"
    echo "      TZ: Europe/Paris"
    echo "    volumes:"
    echo "      - ${VOLUME_DATA}:/bitnami/suitecrm"
    echo "    networks:"
    echo "      - dorevia-network"
    echo "    # Port 80 en interne (routage via Caddy)"
    echo ""
  fi

  # Service n8n (univers n8n)
  if [[ "$UNIVERS" == "n8n" ]] && echo "$UNITS_APP" | grep -q "^n8n$"; then
    echo "  n8n:"
    echo "    image: $IMAGE_N8N"
    echo "    container_name: ${UNIVERS}_${ENV}_${TENANT_ID}"
    echo "    restart: unless-stopped"
    if echo "$UNITS_APP" | grep -q "^postgres$"; then
      echo "    depends_on:"
      echo "      db:"
      echo "        condition: service_healthy"
    fi
    echo "    environment:"
    echo "      N8N_HOST: ${SOURCE}.doreviateam.com"
    echo "      N8N_PORT: 5678"
    echo "      N8N_PROTOCOL: https"
    echo "      N8N_ENCRYPTION_KEY: \${N8N_ENCRYPTION_KEY:-change-me-in-production-32-chars-minimum}"
    echo "      DB_TYPE: postgresdb"
    echo "      DB_POSTGRESDB_HOST: ${UNIVERS}_db_${ENV}_${TENANT_ID}"
    echo "      DB_POSTGRESDB_DATABASE: n8n"
    echo "      DB_POSTGRESDB_USER: n8n"
    echo "      DB_POSTGRESDB_PASSWORD: n8n"
    echo "      TZ: Europe/Paris"
    echo "      N8N_DEFAULT_LOCALE: \${N8N_DEFAULT_LOCALE:-fr}"
    echo "    volumes:"
    echo "      - ${VOLUME_DATA}:/home/node/.n8n"
    echo "    networks:"
    echo "      - dorevia-network"
    echo "    # Port 5678 en interne (routage via Caddy)"
    echo ""
  fi

  # Service Appsmith / Dorevia-UI (univers ui)
  if [[ "$UNIVERS" == "ui" ]] && echo "$UNITS_APP" | grep -q "^appsmith$"; then
    CONTAINER_APPSMITH="appsmith_${ENV}_${TENANT_ID}"
    VOLUME_APPSMITH="${CONTAINER_APPSMITH}_stacks"
    echo "  appsmith:"
    echo "    image: $IMAGE_APPSMITH"
    echo "    container_name: $CONTAINER_APPSMITH"
    echo "    restart: unless-stopped"
    echo "    environment:"
    echo "      APPSMITH_ENCRYPTION_PASSWORD: \${APPSMITH_ENCRYPTION_PASSWORD:?APPSMITH_ENCRYPTION_PASSWORD requis}"
    echo "      APPSMITH_ENCRYPTION_SALT: \${APPSMITH_ENCRYPTION_SALT:?APPSMITH_ENCRYPTION_SALT requis}"
    echo "      APPSMITH_INSTANCE_NAME: \${APPSMITH_INSTANCE_NAME:-Dorevia-UI}"
    echo "      TZ: \${TZ:-Europe/Paris}"
    echo "    volumes:"
    echo "      - ${VOLUME_APPSMITH}:/appsmith-stacks"
    echo "    networks:"
    echo "      - dorevia-network"
    echo "    # Port 80 en interne (routage via Caddy)"
    echo ""
  fi

  # Service Dorevia Linky (univers ui) — Next.js, proxy Vault, https via Caddy
  if [[ "$UNIVERS" == "ui" ]] && echo "$UNITS_APP" | grep -q "^linky$"; then
    CONTAINER_LINKY="linky_${ENV}_${TENANT_ID}"
    if [[ -n "$LINKY_VAULT_URL" ]]; then
      VAULT_URL_DEFAULT="$LINKY_VAULT_URL"
    else
      VAULT_URL_DEFAULT="http://vault-${TENANT_ID}:8080"
    fi
    echo "  linky:"
    echo "    image: $IMAGE_LINKY"
    echo "    container_name: $CONTAINER_LINKY"
    echo "    restart: unless-stopped"
    echo "    environment:"
    echo "      VAULT_URL: \${VAULT_URL:-$VAULT_URL_DEFAULT}"
    echo "      TENANT_ID: ${TENANT_ID}"
    echo "      TZ: \${TZ:-Europe/Paris}"
    if [[ -n "$LINKY_DVIG_URL" ]]; then
      echo "      DVIG_URL: ${LINKY_DVIG_URL}"
      # Token pour fallback vault-health (DVIG /internal/vault-health)
      echo "      DVIG_INTERNAL_TOKEN: \${DVIG_INTERNAL_TOKEN:-${LINKY_DVIG_INTERNAL_TOKEN}}"
    fi
    if [[ -n "$LINKY_COMPANY_NAMES_RAW" ]]; then
      LINKY_COMPANY_NAMES_ESCAPED=$(echo "$LINKY_COMPANY_NAMES_RAW" | sed 's/"/\\"/g')
      echo "      COMPANY_DISPLAY_NAMES: \"${LINKY_COMPANY_NAMES_ESCAPED}\""
    fi
    echo "      DIVA_URL: \${DIVA_URL:-http://diva:8010}"
    if [[ -n "$LINKY_DLP_URL" ]]; then
      echo "      DLP_URL: ${LINKY_DLP_URL}"
    else
      echo "      DLP_URL: \${DLP_URL:-http://dlp:8020}"
    fi
    echo "    networks:"
    echo "      - dorevia-network"
    echo "    # Port 3000 en interne (routage via Caddy)"
    echo ""
  fi

  # Volumes (omettre si vide pour compatibilité compose v2)
  HAS_VOLUMES=false
  echo "$UNITS_APP" | grep -qE "^(postgres|mariadb|odoo|suitecrm|n8n)$" && HAS_VOLUMES=true
  [[ "$UNIVERS" == "ui" ]] && echo "$UNITS_APP" | grep -q "^appsmith$" && HAS_VOLUMES=true
  [[ "$UNIVERS" == "odoo" ]] && HAS_VOLUMES=true
  if [[ "$HAS_VOLUMES" == "true" ]]; then
  echo "volumes:"
  if echo "$UNITS_APP" | grep -q "^postgres$"; then
    echo "  ${VOLUME_DB}:"
    echo "    name: ${VOLUME_DB_NAME}"
  fi
  if echo "$UNITS_APP" | grep -q "^mariadb$"; then
    echo "  ${VOLUME_DB}:"
    echo "    name: ${VOLUME_DB_NAME}"
  fi
  if echo "$UNITS_APP" | grep -q "^odoo$"; then
    echo "  ${VOLUME_DATA}:"
    echo "    name: ${VOLUME_DATA_NAME}"
  fi
  if echo "$UNITS_APP" | grep -q "^suitecrm$"; then
    echo "  ${VOLUME_DATA}:"
    echo "    name: ${VOLUME_DATA_NAME}"
  fi
  if echo "$UNITS_APP" | grep -q "^n8n$"; then
    echo "  ${VOLUME_DATA}:"
    echo "    name: ${VOLUME_DATA_NAME}"
  fi
  if [[ "$UNIVERS" == "ui" ]] && echo "$UNITS_APP" | grep -q "^appsmith$"; then
    echo "  appsmith_${ENV}_${TENANT_ID}_stacks:"
    echo "    name: appsmith_${ENV}_${TENANT_ID}_stacks"
  fi
  # Linky n'a pas de volume persistant
  # Volume OCA uniquement pour l'univers Odoo (guardrail multi-univers)
  if [[ "$UNIVERS" == "odoo" ]]; then
    echo "  oca_extra_addons:"
    echo "    name: oca_extra_addons"
  fi
  else
  echo "volumes: {}"
  fi
  echo ""
  
  # Networks
  echo "networks:"
  echo "  dorevia-network:"
  echo "    external: true"
} > "$OUTPUT_FILE"

info "✅ docker-compose.yml app généré: $OUTPUT_FILE"


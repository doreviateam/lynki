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
UNITS_APP=$(echo "$MANIFEST" | jq -r ".units.${UNIVERS}[] // empty")

# Vérifier que l'univers est dans la liste
if ! echo "$UNIVERSES" | grep -q "^${UNIVERS}$"; then
  error "Univers '$UNIVERS' non activé pour tenant '$TENANT'"
fi

# Vérifier que l'env est dans la liste
if ! echo "$ENVIRONMENTS" | grep -q "^${ENV}$"; then
  error "Environnement '$ENV' non activé pour tenant '$TENANT'"
fi

# Extraire images
IMAGE_ODOO=$(echo "$MANIFEST" | jq -r '.images.odoo // "odoo:18.0"')
IMAGE_POSTGRES=$(echo "$MANIFEST" | jq -r '.images.postgres // "postgres:16"')

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
  
  # Service DB (si postgres dans units app)
  if echo "$UNITS_APP" | grep -q "^postgres$"; then
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
  
  # Volumes
  echo "volumes:"
  if echo "$UNITS_APP" | grep -q "^postgres$"; then
    echo "  ${VOLUME_DB}:"
    echo "    name: ${VOLUME_DB_NAME}"
  fi
  if echo "$UNITS_APP" | grep -q "^odoo$"; then
    echo "  ${VOLUME_DATA}:"
    echo "    name: ${VOLUME_DATA_NAME}"
  fi
  echo "  oca_extra_addons:"
  echo "    name: oca_extra_addons"
  echo ""
  
  # Networks
  echo "networks:"
  echo "  dorevia-network:"
  echo "    external: true"
} > "$OUTPUT_FILE"

info "✅ docker-compose.yml app généré: $OUTPUT_FILE"


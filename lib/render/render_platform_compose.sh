#!/bin/bash
# render_platform_compose.sh - Génération docker-compose.yml platform depuis manifest Phase 1
# Usage: render_platform_compose.sh <tenant> <env>

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
if [[ $# -lt 2 ]]; then
  error "Usage: $0 <tenant> <env>"
fi

TENANT="$1"
ENV="$2"

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

info "Génération docker-compose.yml platform pour tenant: $TENANT, env: $ENV"

# Lire manifest
MANIFEST=$(cat "$MANIFEST_FILE")

# Extraire données
TENANT_ID=$(echo "$MANIFEST" | jq -r '.tenant_id')
UNITS_PLATFORM=$(echo "$MANIFEST" | jq -r '.units.platform[] // empty')
ENVIRONMENTS=$(echo "$MANIFEST" | jq -r '.environments[]')

# Vérifier que l'env est dans la liste
if ! echo "$ENVIRONMENTS" | grep -q "^${ENV}$"; then
  error "Environnement '$ENV' non activé pour tenant '$TENANT'"
fi

# Extraire images
IMAGE_DVIG=$(echo "$MANIFEST" | jq -r '.images.dvig // "dorevia/dvig:0.1.2-auth"')
IMAGE_VAULT=$(echo "$MANIFEST" | jq -r '.images.vault // "dorevia/vault:v1.3.0"')
IMAGE_POSTGRES=$(echo "$MANIFEST" | jq -r '.images.postgres // "postgres:16"')

# Extraire secrets_refs
DVIG_TOKENS_PATH=$(echo "$MANIFEST" | jq -r '.secrets_refs.dvig_tokens // "tenants/'$TENANT'/secrets/dvig.tokens.yml"')
VAULT_DB_PASSWORD_VAR=$(echo "$MANIFEST" | jq -r '.secrets_refs.vault_db_password // "VAULT_DB_PASSWORD"')

# Résoudre chemin absolu pour tokens
if [[ "$DVIG_TOKENS_PATH" =~ ^tenants/ ]]; then
  DVIG_TOKENS_ABS="$ROOT_DIR/$DVIG_TOKENS_PATH"
else
  DVIG_TOKENS_ABS="$DVIG_TOKENS_PATH"
fi

# Créer répertoire de sortie
OUTPUT_DIR="$TENANT_DIR/rendered/$ENV/platform"
mkdir -p "$OUTPUT_DIR"
OUTPUT_FILE="$OUTPUT_DIR/docker-compose.yml"

# Générer docker-compose.yml
{
  echo "# Docker Compose - Services Partagés (Platform)"
  echo "# Généré automatiquement depuis manifest Phase 1"
  echo "# Tenant: $TENANT_ID"
  echo "# Environment: $ENV"
  echo ""
  echo "services:"
  
  # Service DVIG (si présent dans units)
  if echo "$UNITS_PLATFORM" | grep -q "^dvig$"; then
    echo "  # DVIG - Service partagé"
    echo "  dvig:"
    echo "    image: $IMAGE_DVIG"
    echo "    container_name: dvig-$TENANT_ID"
    echo "    restart: unless-stopped"
    echo "    networks:"
    echo "      - dorevia-network"
    echo "    environment:"
    echo "      # Auth"
    echo "      - DVIG_AUTH_ENABLED=1"
    echo "      - DVIG_TOKENS_FILE=/etc/dvig/tokens.yml"
    echo "      - DVIG_TOKENS_RELOAD_INTERVAL=60"
    echo "      - DVIG_TOKENS_RELOAD_ON_SIGHUP=1"
    echo "      "
    echo "      # API"
    echo "      - DVIG_HOST=0.0.0.0"
    echo "      - DVIG_PORT=8080"
    echo "      "
    echo "      # Docs (désactivés en production)"
    echo "      - DVIG_DOCS_ENABLED=0"
    echo "      - DVIG_OPENAPI_ENABLED=0"
    echo "      "
    echo "      # Health"
    echo "      - DVIG_HEALTH_PROTECTED=0"
    echo "      "
    echo "      # Logs (format JSON pour production)"
    echo "      - DVIG_LOG_FORMAT=json"
    echo "      - DVIG_LOG_LEVEL=info"
    echo "      "
    echo "      # Vault"
    echo "      - VAULT_URL=http://vault-$TENANT_ID:8080"
    echo "      - VAULT_API_KEY=\${VAULT_API_KEY:-}"
    echo "    volumes:"
    echo "      # Tokens (read-only) - Source de vérité unique: $DVIG_TOKENS_PATH"
    echo "      - $DVIG_TOKENS_ABS:/etc/dvig/tokens.yml:ro"
    echo "      # Logs (optionnel)"
    echo "      - dvig_logs_${TENANT_ID}:/var/log/dvig"
    echo "    healthcheck:"
    echo "      test: [\"CMD\", \"sh\", \"-lc\", \"wget -qO- http://127.0.0.1:8080/health >/dev/null || curl -f http://localhost:8080/health\"]"
    echo "      interval: 10s"
    echo "      timeout: 3s"
    echo "      retries: 10"
    echo "      start_period: 40s"
    echo ""
  fi
  
  # Service Vault (si présent dans units)
  if echo "$UNITS_PLATFORM" | grep -q "^vault$"; then
    echo "  # Vault - Service partagé"
    echo "  vault:"
    echo "    image: $IMAGE_VAULT"
    echo "    container_name: vault-$TENANT_ID"
    echo "    restart: unless-stopped"
    echo "    networks:"
    echo "      - dorevia-network"
    echo "    environment:"
    echo "      - DATABASE_URL=postgres://vault:\${${VAULT_DB_PASSWORD_VAR}:-vault_password}@vault-db-$TENANT_ID:5432/dorevia_vault"
    echo "      - PORT=8080"
    echo "    volumes:"
    echo "      # Volumes persistants pour stockage Vault (Phase 6 - Ops Hardening)"
    echo "      - vault_storage_${TENANT_ID}:/opt/dorevia-vault/storage"
    echo "      - vault_ledger_${TENANT_ID}:/opt/dorevia-vault/ledger"
    echo "      - vault_audit_${TENANT_ID}:/opt/dorevia-vault/audit"
    echo "    depends_on:"
    echo "      - vault-db"
    echo "    healthcheck:"
    echo "      test: [\"CMD\", \"sh\", \"-lc\", \"wget -qO- http://127.0.0.1:8080/health >/dev/null || curl -f http://localhost:8080/health\"]"
    echo "      interval: 10s"
    echo "      timeout: 3s"
    echo "      retries: 10"
    echo "      start_period: 40s"
    echo ""
  fi
  
  # Service Vault Database (si vault présent)
  if echo "$UNITS_PLATFORM" | grep -q "^vault$"; then
    echo "  # Vault Database - PostgreSQL"
    echo "  vault-db:"
    echo "    image: $IMAGE_POSTGRES"
    echo "    container_name: vault-db-$TENANT_ID"
    echo "    restart: unless-stopped"
    echo "    environment:"
    echo "      - POSTGRES_USER=vault"
    echo "      - POSTGRES_PASSWORD=\${${VAULT_DB_PASSWORD_VAR}:-vault_password}"
    echo "      - POSTGRES_DB=dorevia_vault"
    echo "    volumes:"
    echo "      - vault_db_data_${TENANT_ID}:/var/lib/postgresql/data"
    echo "    networks:"
    echo "      - dorevia-network"
    echo "    healthcheck:"
    echo "      test: [\"CMD-SHELL\", \"pg_isready -U vault\"]"
    echo "      interval: 10s"
    echo "      timeout: 5s"
    echo "      retries: 5"
    echo ""
  fi
  
  # Volumes
  echo "volumes:"
  if echo "$UNITS_PLATFORM" | grep -q "^vault$"; then
    echo "  vault_db_data_${TENANT_ID}:"
    echo "    name: vault_db_${TENANT_ID}_data"
    echo "  vault_storage_${TENANT_ID}:"
    echo "    name: vault_storage_${TENANT_ID}"
    echo "  vault_ledger_${TENANT_ID}:"
    echo "    name: vault_ledger_${TENANT_ID}"
    echo "  vault_audit_${TENANT_ID}:"
    echo "    name: vault_audit_${TENANT_ID}"
  fi
  if echo "$UNITS_PLATFORM" | grep -q "^dvig$"; then
    echo "  dvig_logs_${TENANT_ID}:"
    echo "    name: dvig_logs_${TENANT_ID}"
  fi
  echo ""
  
  # Networks
  echo "networks:"
  echo "  dorevia-network:"
  echo "    external: true"
} > "$OUTPUT_FILE"

info "✅ docker-compose.yml platform généré: $OUTPUT_FILE"


#!/usr/bin/env bash
# Exécute les migrations 033 et 034 (AR by Partner) sur la base Vault.
# Usage : DATABASE_URL=postgresql://... ./scripts/run_ar_by_partner_migrations.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="$REPO_ROOT/sources/vault/migrations"

if [ -z "${DATABASE_URL:-}" ]; then
    export DATABASE_URL="${TEST_DATABASE_URL:-}"
fi
if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${RED}DATABASE_URL ou TEST_DATABASE_URL requis${NC}"
    exit 1
fi

echo "Migrations AR by Partner (033, 034)"
psql "$DATABASE_URL" -f "$MIGRATIONS_DIR/033_add_ar_by_partner_fields.sql"
psql "$DATABASE_URL" -f "$MIGRATIONS_DIR/034_residual_events_idempotency.sql"
echo "OK"

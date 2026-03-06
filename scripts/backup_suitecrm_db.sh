#!/usr/bin/env bash
# Backup DB SuiteCRM (MariaDB) — Sprint 3 US-3.1
# Usage: ./scripts/backup_suitecrm_db.sh <tenant> <env> [output_dir]
# Ex.   ./scripts/backup_suitecrm_db.sh lab lab /tmp/backups
# Nécessite MARIADB_ROOT_PASSWORD (env ou .env du tenant).

set -euo pipefail

TENANT="${1:?tenant requis}"
ENV="${2:?env requis}"
OUTPUT_DIR="${3:-/tmp/backup-suitecrm}"

CONTAINER="suitecrm_db_${ENV}_${TENANT}"
if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER}$"; then
  echo "Erreur: conteneur $CONTAINER non running"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
STAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="$OUTPUT_DIR/suitecrm_${TENANT}_${ENV}_${STAMP}.sql"

# Lire MARIADB_ROOT_PASSWORD depuis l'env ou demander
ROOT_PWD="${MARIADB_ROOT_PASSWORD:-}"
if [[ -z "$ROOT_PWD" ]]; then
  # Valeur par défaut du compose render (à éviter en prod)
  ROOT_PWD="root"
fi

docker exec "$CONTAINER" mysqldump -u root -p"$ROOT_PWD" \
  --single-transaction --routines --triggers \
  suitecrm > "$OUTPUT_FILE"

echo "Backup OK: $OUTPUT_FILE"
exit 0

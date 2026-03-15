#!/bin/bash
# Créer un dump de la base laplatine2026 (odoo.lab.laplatine2026.doreviateam.com)
# Usage: ./dump_laplatine2026.sh
# Sortie: tenants/o19/apps/odoo/lab/dumps/laplatine2026_YYYYMMDD_HHMMSS.dump

set -euo pipefail
ROOT="/opt/dorevia-plateform"
LAB_DIR="$ROOT/tenants/o19/apps/odoo/lab"
DUMP_DIR="$LAB_DIR/dumps"
DB_CONTAINER="odoo_db_lab_laplatine2026"
DB_NAME="laplatine2026"

mkdir -p "$DUMP_DIR"

# Démarrer le DB si arrêté
docker start "$DB_CONTAINER" 2>/dev/null || true
sleep 3

echo "Création dump $DB_NAME..."
docker exec "$DB_CONTAINER" pg_dump -U odoo -Fc "$DB_NAME" > "$DUMP_DIR/laplatine2026_$(date +%Y%m%d_%H%M%S).dump"

ls -la "$DUMP_DIR"/laplatine2026_*.dump | tail -1
echo ""
echo "Dump créé. ATTENTION: laplatine2026 = Odoo 18. Restauration sur o19 (Odoo 19) nécessite une migration manuelle (incompatibilités de schéma)."

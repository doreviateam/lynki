#!/bin/bash
# Purge diva_insights par lots (SPEC §5.5)
# Exécute la purge en boucle jusqu'à 0 lignes supprimées
# Usage cron : 0 * * * * /opt/dorevia-plateform/scripts/purge_diva_insights.sh

set -e
DB_URL="${DIVA_DATABASE_URL:-postgres://diva@localhost:5432/dorevia_vault?sslmode=disable}"
MAX_ITER=50  # Garde-fou contre boucle infinie

if ! command -v psql &>/dev/null; then
  echo "psql non trouvé. Exécuter purge_diva_insights.sql manuellement."
  exit 1
fi

for i in $(seq 1 $MAX_ITER); do
  ROWS=$(psql "$DB_URL" -t -A -c "
    WITH batch AS (
      SELECT id FROM diva_insights
      WHERE expires_at < now() - interval '1 hour'
      ORDER BY id LIMIT 500
    )
    DELETE FROM diva_insights WHERE id IN (SELECT id FROM batch) RETURNING id;
  " 2>/dev/null | wc -l)
  [ "${ROWS:-0}" -eq 0 ] && break
  sleep 0.5
done
ull || echo 0)
  [ "${ROWS:-0}" -eq 0 ] && break
  sleep 0.5
done

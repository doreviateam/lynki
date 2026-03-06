#!/bin/bash
# Diagnostic quand le vaultage dépasse 120 s (objectif ≤ 30 s).
# Vérifie : queue_job (jobs en attente ou en échec), CRON, config workers.
# Usage: ./scripts/diagnostic_vault_plus_de_120s.sh [invoice_id]

set -euo pipefail

MOVE_ID="${1:-}"
ODOO_DB="${ODOO_DB_CONTAINER:-odoo_db_stinger_sarl-la-platine}"
DB_NAME="${DB_NAME:-odoo_stinger_sarl-la-platine}"

echo "============================================================"
echo "🔍 Diagnostic vaultage > 120 s"
echo "============================================================"
echo ""

# 1) Table queue_job existe et derniers jobs (vault / trigger / proof)
echo "📋 1. Derniers jobs queue_job (vault / trigger_worker / fetch_proof)"
echo "------------------------------------------------------------"
docker exec "$ODOO_DB" psql -U odoo -d "$DB_NAME" -c "
  SELECT id, name, state,
         TO_CHAR(date_created, 'YYYY-MM-DD HH24:MI:SS') as created,
         TO_CHAR(date_started, 'HH24:MI:SS') as started,
         TO_CHAR(date_done, 'HH24:MI:SS') as done,
         LEFT(COALESCE(exc_info,''), 120) as exc
  FROM queue_job
  WHERE (name LIKE '%vault%' OR name LIKE '%trigger%' OR name LIKE '%proof%' OR name LIKE '%dvig%')
    AND date_created > NOW() - INTERVAL '2 hours'
  ORDER BY date_created DESC
  LIMIT 12;
" 2>/dev/null || echo "   (requête impossible — vérifier que le module queue_job est installé et que la table queue_job existe)"
echo ""

# 2) Jobs bloqués en pending / enqueued depuis plus de 2 min
echo "📋 2. Jobs en attente (pending/enqueued) depuis > 2 min"
echo "------------------------------------------------------------"
docker exec "$ODOO_DB" psql -U odoo -d "$DB_NAME" -c "
  SELECT id, name, state,
         TO_CHAR(date_created, 'HH24:MI:SS') as created,
         EXTRACT(EPOCH FROM (NOW() - date_created))::int as wait_seconds
  FROM queue_job
  WHERE state IN ('pending', 'enqueued')
    AND (name LIKE '%vault%' OR name LIKE '%trigger%' OR name LIKE '%proof%')
  ORDER BY date_created
  LIMIT 10;
" 2>/dev/null || echo "   (requête impossible)"
echo ""

# 3) Si un invoice_id est fourni : statut facture + jobs liés
if [ -n "$MOVE_ID" ]; then
  echo "📋 3. Facture $MOVE_ID et jobs associés"
  echo "------------------------------------------------------------"
  docker exec "$ODOO_DB" psql -U odoo -d "$DB_NAME" -c "
    SELECT id, name, dorevia_vault_status,
           TO_CHAR(dorevia_vault_last_try_at, 'YYYY-MM-DD HH24:MI:SS') as last_try,
           dorevia_vault_attempt_count
    FROM account_move WHERE id = $MOVE_ID;
  " 2>/dev/null || true
  docker exec "$ODOO_DB" psql -U odoo -d "$DB_NAME" -c "
    SELECT id, name, state,
           TO_CHAR(date_created, 'HH24:MI:SS') as created,
           TO_CHAR(date_done, 'HH24:MI:SS') as done,
           LEFT(COALESCE(exc_info,''), 80) as exc
    FROM queue_job
    WHERE record_ids::text LIKE '%$MOVE_ID%'
       OR (name LIKE '%proof%' AND arguments::text LIKE '%$MOVE_ID%')
    ORDER BY date_created DESC
    LIMIT 5;
  " 2>/dev/null || true
  echo ""
fi

# 4) CRON vault (prochains run) — cron_name (Odoo 14+) avec ILIKE pour cas insensible
echo "📋 4. CRON vault (prochain run)"
echo "------------------------------------------------------------"
docker exec "$ODOO_DB" psql -U odoo -d "$DB_NAME" -c "
  SELECT id, cron_name, nextcall, interval_number, interval_type
  FROM ir_cron
  WHERE active = true
    AND (cron_name ILIKE '%vault%' OR cron_name ILIKE '%dvig%'
         OR cron_name ILIKE '%proof%' OR cron_name ILIKE '%reconciler%')
  ORDER BY nextcall
  LIMIT 8;
" 2>/dev/null || echo "   (requête impossible)"
# Si 0 rows, montrer quelques crons pour voir le format de cron_name
docker exec "$ODOO_DB" psql -U odoo -d "$DB_NAME" -t -c "
  SELECT 1 FROM ir_cron WHERE active = true AND cron_name ILIKE '%vault%' LIMIT 1;
" 2>/dev/null | grep -q 1 || {
  echo "   (Aucun CRON avec cron_name contenant 'vault' — ex. de crons actifs :)"
  docker exec "$ODOO_DB" psql -U odoo -d "$DB_NAME" -c "
    SELECT id, cron_name, nextcall FROM ir_cron WHERE active = true ORDER BY nextcall LIMIT 5;
  " 2>/dev/null || true
}
echo ""

echo "============================================================"
echo "💡 Interprétation :"
echo "   - Uniquement « Reconciler proof » / « Refresh proof » (pas de « Trigger DVIG worker »"
echo "     ni « Fetch proof for FAC/... » automatique) → le flux validation n'enqueue pas les jobs ;"
echo "     seul le CRON tourne → vaultage souvent > 120 s."
echo "   - Jobs en pending/enqueued longtemps → workers queue_job ne prennent pas le channel dorevia_vault."
echo "   Vérifier : odoo.conf [queue_job] channels = root:2,dorevia_vault:2, workers = 2,"
echo "   et que le processus Odoo qui exécute les jobs est bien démarré."
echo "   Voir ZeDocs/web14/AVIS_DUREE_PROCESSUS_VAULT.md §6."
echo "============================================================"

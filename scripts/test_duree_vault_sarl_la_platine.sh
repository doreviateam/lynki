#!/bin/bash
# Test durée du process vault — mesure le temps jusqu'à statut « vaulted » pour une facture.
# Usage: ./scripts/test_duree_vault_sarl_la_platine.sh [invoice_id]
#   Sans argument: utilise la facture la plus récente en todo/pending_proof (ou ID 1961).
# Réf: ZeDocs/web14/AVIS_DUREE_PROCESSUS_VAULT.md, REDUCTION_DUREE_VAULT_ACTIONS.md

set -euo pipefail

ODOO_DB_CONTAINER="${ODOO_DB_CONTAINER:-odoo_db_stinger_sarl-la-platine}"
DB_NAME="${DB_NAME:-odoo_stinger_sarl-la-platine}"
POLL_INTERVAL="${POLL_INTERVAL:-2}"
MAX_WAIT="${MAX_WAIT:-120}"

if [ -n "${1:-}" ]; then
  MOVE_ID="$1"
  echo "📌 Facture cible (ID Odoo): $MOVE_ID"
else
  # Prendre la plus récente en todo ou pending_proof
  MOVE_ID=$(docker exec "$ODOO_DB_CONTAINER" psql -U odoo -d "$DB_NAME" -t -A -c "
    SELECT id FROM account_move
    WHERE state = 'posted'
      AND move_type = 'out_invoice'
      AND dorevia_vault_status IN ('todo', 'pending_proof')
    ORDER BY id DESC
    LIMIT 1;
  " 2>/dev/null | tr -d '\r\n ')
  if [ -z "$MOVE_ID" ]; then
    # Fallback: facture 1961 (FAC/2026/00031)
    MOVE_ID=1961
    echo "📌 Aucune facture todo/pending_proof récente → utilisation ID par défaut: $MOVE_ID"
  else
    echo "📌 Facture la plus récente en attente (ID Odoo): $MOVE_ID"
  fi
fi

echo "⏱️  Début du chrono — polling toutes les ${POLL_INTERVAL}s, timeout ${MAX_WAIT}s"
echo ""

START=$(date +%s)
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
  STATUS=$(docker exec "$ODOO_DB_CONTAINER" psql -U odoo -d "$DB_NAME" -t -A -c "
    SELECT COALESCE(dorevia_vault_status, '') FROM account_move WHERE id = $MOVE_ID;
  " 2>/dev/null | tr -d '\r\n ')

  if [ "$STATUS" = "vaulted" ]; then
    END=$(date +%s)
    DURATION=$((END - START))
    echo ""
    echo "============================================================"
    echo "✅ Facture $MOVE_ID : Protégée (vaulted) en ${DURATION} secondes"
    echo "============================================================"
    echo "   Objectif cible: ≤ 15 s (Odoo)"
    if [ $DURATION -le 15 ]; then
      echo "   🎯 Objectif atteint"
    else
      echo "   ⚠️  Au-dessus de la cible (vérifier queue_job, DVIG, backoff)"
    fi
    exit 0
  fi

  echo "[$(date +%H:%M:%S)] ID=$MOVE_ID | status=$STATUS | elapsed=${ELAPSED}s"
  sleep "$POLL_INTERVAL"
  ELAPSED=$((ELAPSED + POLL_INTERVAL))
done

echo ""
echo "⚠️  Timeout après ${MAX_WAIT}s — la facture $MOVE_ID n'est pas encore vaulted (status actuel: $STATUS)"
echo "   Vérifier: queue_job, CRON #1/#2, DVIG, Vault."
exit 1

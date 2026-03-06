#!/bin/bash
# Script de surveillance pour test facture SPEC v1.1.1

FACTURE_NUM="$1"
DB="odoo_stinger_sarl-la-platine"

if [ -z "$FACTURE_NUM" ]; then
    echo "Usage: $0 <NUMERO_FACTURE>"
    echo "Exemple: $0 FAC/2026/00010"
    exit 1
fi

echo "🔍 Surveillance facture: $FACTURE_NUM"
echo "=================================="
echo ""

while true; do
    clear
    echo "📊 État de la facture: $FACTURE_NUM"
    echo "=================================="
    
    # État de la facture
    docker exec odoo_db_stinger_sarl-la-platine psql -U odoo -d $DB -c "
    SELECT 
        name,
        state,
        dorevia_vault_status,
        dorevia_vault_attempt_count,
        dorevia_vault_last_try_at,
        CASE 
            WHEN dorevia_vault_proof_hash IS NOT NULL THEN '✅'
            ELSE '❌'
        END as proof_hash,
        CASE 
            WHEN dorevia_vault_proof_url IS NOT NULL THEN '✅'
            ELSE '❌'
        END as proof_url
    FROM account_move 
    WHERE name = '$FACTURE_NUM';
    " 2>/dev/null
    
    echo ""
    echo "📋 Jobs Queue en cours:"
    echo "========================"
    docker exec odoo_db_stinger_sarl-la-platine psql -U odoo -d $DB -c "
    SELECT 
        name,
        state,
        TO_CHAR(date_created, 'HH24:MI:SS') as created,
        TO_CHAR(date_started, 'HH24:MI:SS') as started,
        TO_CHAR(date_done, 'HH24:MI:SS') as done
    FROM queue_job 
    WHERE (name LIKE '%vault%' OR name LIKE '%proof%')
      AND date_created > NOW() - INTERVAL '5 minutes'
    ORDER BY date_created DESC 
    LIMIT 5;
    " 2>/dev/null
    
    echo ""
    echo "📊 Logs DVIG (dernières 3 lignes):"
    echo "==================================="
    docker logs dvig-core-stinger --tail 3 2>/dev/null | grep -E "outbox|forward|vault" || echo "Aucun log récent"
    
    echo ""
    echo "⏱️  $(date '+%H:%M:%S') - Actualisation toutes les 2s (Ctrl+C pour arrêter)"
    sleep 2
done

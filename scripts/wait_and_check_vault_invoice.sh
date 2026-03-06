#!/bin/bash
# Script pour attendre le vaulting d'une facture et vérifier les données

INVOICE_ID=${1:-1899}
MAX_WAIT=${2:-300}  # 5 minutes par défaut
WAIT_INTERVAL=10    # Vérifier toutes les 10 secondes

echo "============================================================"
echo "⏳ ATTENTE DU VAULTING - Facture ID: $INVOICE_ID"
echo "============================================================"
echo ""

elapsed=0
vaulted=false

while [ $elapsed -lt $MAX_WAIT ]; do
    # Vérifier dans Vault
    result=$(docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -t -c "
        SELECT COUNT(*) 
        FROM documents 
        WHERE odoo_id = $INVOICE_ID;
    " 2>/dev/null | tr -d ' ')
    
    if [ "$result" = "1" ]; then
        echo "✅ Facture vaultée trouvée dans Vault!"
        vaulted=true
        break
    fi
    
    echo "[$(date +%H:%M:%S)] En attente... ($elapsed/$MAX_WAIT secondes)"
    sleep $WAIT_INTERVAL
    elapsed=$((elapsed + WAIT_INTERVAL))
done

echo ""

if [ "$vaulted" = true ]; then
    echo "============================================================"
    echo "📊 DONNÉES DE FACTURATION DANS VAULT"
    echo "============================================================"
    echo ""
    
    docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "
        SELECT 
            id as vault_id,
            invoice_number,
            move_type,
            invoice_date,
            total_ht,
            total_ttc,
            currency,
            seller_vat,
            buyer_vat,
            odoo_id,
            created_at as vaulted_at,
            CASE 
                WHEN invoice_number IS NOT NULL 
                     AND move_type IS NOT NULL 
                     AND invoice_date IS NOT NULL 
                     AND total_ht IS NOT NULL 
                     AND total_ttc IS NOT NULL 
                THEN '✅ COMPLET' 
                ELSE '⚠️ INCOMPLET' 
            END as statut_donnees
        FROM documents 
        WHERE odoo_id = $INVOICE_ID
        ORDER BY created_at DESC
        LIMIT 1;
    "
    
    echo ""
    echo "============================================================"
    echo "✅ Vérification terminée"
    echo "============================================================"
else
    echo "⚠️  La facture n'a pas été vaultée dans les $MAX_WAIT secondes"
    echo "💡 Vérifiez les logs DVIG et Vault pour diagnostiquer"
    echo ""
    echo "Logs DVIG:"
    docker logs dvig-core-stinger --tail 20 2>&1 | grep -i "1899\|error" || echo "   Aucune trace"
    echo ""
    echo "Logs Vault:"
    docker logs vault-core-stinger --tail 20 2>&1 | grep -i "1899\|error" || echo "   Aucune trace"
fi

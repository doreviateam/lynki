#!/bin/bash
# Script pour vérifier les données de facturation dans Vault

echo "============================================================"
echo "🔍 VÉRIFICATION DES DONNÉES DE FACTURATION DANS VAULT"
echo "============================================================"
echo ""

# Vérifier les documents récents dans Vault
echo "📊 Documents récents dans Vault:"
docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "
SELECT 
    id,
    invoice_number,
    move_type,
    invoice_date,
    total_ht,
    total_ttc,
    currency,
    seller_vat,
    buyer_vat,
    odoo_id,
    created_at
FROM documents
WHERE odoo_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
"

echo ""
echo "============================================================"
echo "📋 Documents avec données de facturation complètes:"
echo "============================================================"
docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "
SELECT 
    id,
    invoice_number,
    move_type,
    invoice_date,
    total_ht,
    total_ttc,
    currency,
    seller_vat,
    buyer_vat,
    odoo_id
FROM documents
WHERE invoice_number IS NOT NULL
  AND move_type IS NOT NULL
  AND invoice_date IS NOT NULL
  AND total_ht IS NOT NULL
  AND total_ttc IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
"

echo ""
echo "============================================================"
echo "⚠️  Documents sans données de facturation:"
echo "============================================================"
docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "
SELECT 
    id,
    invoice_number,
    move_type,
    invoice_date,
    total_ht,
    total_ttc,
    odoo_id,
    created_at
FROM documents
WHERE odoo_id IS NOT NULL
  AND (invoice_number IS NULL 
       OR move_type IS NULL 
       OR invoice_date IS NULL 
       OR total_ht IS NULL 
       OR total_ttc IS NULL)
ORDER BY created_at DESC
LIMIT 5;
"

echo ""
echo "============================================================"
echo "✅ Vérification terminée"
echo "============================================================"

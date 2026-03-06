#!/bin/bash
# Sanity-check ventilation Espèces/Banque — comparaison Vault / Odoo / Linky
# Période : 2026-01-01 à 2026-03-02
# Usage : ./sanity_check_sql_payment_methods.sh

set -e
TENANT=laplatine2026
DATE_FROM=2026-01-01
DATE_TO=2026-03-02

echo "=== 1. VAULT (payment_date, by direction + method) ==="
docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -t -c "
SELECT 
  payload_json->>'payment_direction' AS direction,
  LOWER(COALESCE(o.method, NULLIF(TRIM(d.payload_json->>'method'), ''), 'transfer')) AS effective_method,
  COUNT(*) AS n,
  ROUND(SUM((d.payload_json->>'amount')::numeric)::numeric, 2) AS total
FROM documents d
LEFT JOIN payment_method_overrides o ON o.document_id = d.id
WHERE d.source = 'payment' AND d.tenant = '$TENANT'
  AND d.payload_json IS NOT NULL
  AND (d.payload_json->>'payment_date')::timestamptz::date >= '$DATE_FROM'
  AND (d.payload_json->>'payment_date')::timestamptz::date <= '$DATE_TO'
  AND (payload_json->>'payment_direction' = 'inbound' OR (payload_json->>'payment_direction' = 'outbound' AND COALESCE((payload_json->>'is_refund')::boolean, false) = false))
GROUP BY 1, 2
ORDER BY 1, 2;
"

echo ""
echo "=== 2. ODOO (journal type cash → cash, else transfer) ==="
docker exec odoo_db_lab_laplatine2026 psql -U odoo -d laplatine2026 -t -c "
SELECT 
  p.payment_type AS direction,
  CASE WHEN j.type = 'cash' THEN 'cash' WHEN pm.code ILIKE 'check' THEN 'check' ELSE 'transfer' END AS method,
  COUNT(*) AS n,
  ROUND(SUM(p.amount)::numeric, 2) AS total
FROM account_payment p
JOIN account_journal j ON j.id = p.journal_id
LEFT JOIN account_payment_method pm ON pm.id = p.payment_method_id
WHERE p.state IN ('posted','paid','in_process','sent','reconciled')
  AND p.date >= '$DATE_FROM' AND p.date <= '$DATE_TO'
GROUP BY 1, 2
ORDER BY 1, 2;
"

echo ""
echo "=== 3. COMPARAISON (Linky affiche les totaux Vault par méthode) ==="
echo "Vault = source de vérité pour Linky. Odoo peut avoir 1 paiement de plus si non encore vaulté."
echo ""
echo "Résultat attendu : Vault inbound cash 21 085,15 ; outbound cash 12 982,06 ; Net espèces = +8 103,09 €"

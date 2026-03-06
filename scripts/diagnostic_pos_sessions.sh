#!/usr/bin/env bash
# Diagnostic POS sessions — vérifier les documents vaultés pour la card Points de vente
# Usage: ./scripts/diagnostic_pos_sessions.sh

set -e
CONTAINER="vault-db-core-stinger"
DB_USER="vault"
DB_NAME="dorevia_vault"

echo "=== 1. Vue d'ensemble documents (source, tenant) ==="
docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT source, tenant, COUNT(*) 
FROM documents 
GROUP BY source, tenant 
ORDER BY COUNT(*) DESC;
" 2>/dev/null || echo "Connexion DB impossible (conteneur non trouvé?)"

echo ""
echo "=== 2. Documents source='pos' (tickets POS) ==="
docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT id, tenant, source, pos_session, location, 
       payload_json->>'total_incl_tax' AS total_incl_tax,
       created_at::date
FROM documents 
WHERE source = 'pos'
ORDER BY created_at DESC
LIMIT 20;
" 2>/dev/null

echo ""
echo "=== 3. Documents avec pos_session non NULL (quelle que soit source) ==="
docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT source, tenant, pos_session, COUNT(*)
FROM documents 
WHERE pos_session IS NOT NULL AND pos_session != ''
GROUP BY source, tenant, pos_session
ORDER BY COUNT(*) DESC
LIMIT 15;
" 2>/dev/null

echo ""
echo "=== 4. Documents tenant NULL (legacy - exclus par requête actuelle) ==="
docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT source, COUNT(*) FROM documents WHERE tenant IS NULL GROUP BY source;
" 2>/dev/null

echo ""
echo "=== 5. Test requête pos-sessions (tenant=core-stinger) ==="
curl -s "http://localhost:8080/ui/aggregations/pos-sessions?tenant=core-stinger&date_debut=2020-01-01&date_fin=2030-12-31" 2>/dev/null | head -5 || \
docker exec vault-core-stinger wget -qO- "http://127.0.0.1:8080/ui/aggregations/pos-sessions?tenant=core-stinger&date_debut=2020-01-01&date_fin=2030-12-31" 2>/dev/null | head -5

echo ""
echo "=== 6. Test avec tenant=sarl-la-platine ==="
curl -s "http://localhost:8080/ui/aggregations/pos-sessions?tenant=sarl-la-platine&date_debut=2020-01-01&date_fin=2030-12-31" 2>/dev/null | head -5 || \
docker exec vault-core-stinger wget -qO- "http://127.0.0.1:8080/ui/aggregations/pos-sessions?tenant=sarl-la-platine&date_debut=2020-01-01&date_fin=2030-12-31" 2>/dev/null | head -5

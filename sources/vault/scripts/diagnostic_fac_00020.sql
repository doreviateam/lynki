-- ============================================
-- DIAGNOSTIC COMPLET - Document FAC/2025/00020
-- Vault ID: 85852790-be9e-4432-84c0-a3f00ed2353e
-- Odoo ID: 1521
-- Date: 2025-12-10 21:28:25
-- ============================================

\echo '============================================'
\echo 'DIAGNOSTIC - Document FAC/2025/00020'
\echo '============================================'
\echo ''

-- 1. Vérifier l'existence par vault_id
\echo '1. Vérification par vault_id (85852790-be9e-4432-84c0-a3f00ed2353e)'
\echo '--------------------------------------------'
SELECT 
    CASE 
        WHEN id IS NOT NULL THEN '✅ DOCUMENT TROUVÉ'
        ELSE '❌ DOCUMENT NON TROUVÉ'
    END as statut,
    id,
    filename,
    sha256_hex,
    created_at,
    tenant,
    CASE WHEN evidence_jws IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_jws,
    CASE WHEN ledger_hash IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_ledger,
    stored_path
FROM documents
WHERE id = '85852790-be9e-4432-84c0-a3f00ed2353e';
\echo ''

-- 2. Rechercher par Odoo ID et modèle
\echo '2. Recherche par Odoo ID (1521) et modèle (account.move)'
\echo '--------------------------------------------'
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*) || ' DOCUMENT(S) TROUVÉ(S)'
        ELSE '❌ AUCUN DOCUMENT TROUVÉ'
    END as statut,
    id,
    filename,
    sha256_hex,
    created_at,
    tenant,
    odoo_model,
    odoo_id,
    CASE WHEN evidence_jws IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_jws,
    CASE WHEN ledger_hash IS NOT NULL THEN 'OUI' ELSE 'NON' END as has_ledger
FROM documents
WHERE odoo_model = 'account.move'
  AND odoo_id = 1521
GROUP BY id, filename, sha256_hex, created_at, tenant, odoo_model, odoo_id, evidence_jws, ledger_hash
ORDER BY created_at DESC;
\echo ''

-- 3. Rechercher tous les documents créés autour de cette date (±1 minute)
\echo '3. Documents créés autour de 2025-12-10 21:28:25 (±1 minute)'
\echo '--------------------------------------------'
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*) || ' DOCUMENT(S) TROUVÉ(S)'
        ELSE '❌ AUCUN DOCUMENT TROUVÉ'
    END as statut,
    id,
    filename,
    sha256_hex,
    created_at,
    tenant,
    odoo_model,
    odoo_id
FROM documents
WHERE created_at BETWEEN '2025-12-10 21:27:25'::timestamp AND '2025-12-10 21:29:25'::timestamp
GROUP BY id, filename, sha256_hex, created_at, tenant, odoo_model, odoo_id
ORDER BY created_at DESC;
\echo ''

-- 4. Vérifier les documents avec tenant = '1' créés ce jour
\echo '4. Documents avec tenant = 1 créés le 2025-12-10'
\echo '--------------------------------------------'
SELECT 
    COUNT(*) as total_documents,
    COUNT(CASE WHEN id = '85852790-be9e-4432-84c0-a3f00ed2353e' THEN 1 END) as document_cible_trouve,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM documents
WHERE tenant = '1'
  AND created_at::date = '2025-12-10'::date;
\echo ''

-- 5. Vérifier les documents sans tenant créés ce jour
\echo '5. Documents sans tenant créés le 2025-12-10'
\echo '--------------------------------------------'
SELECT 
    COUNT(*) as total_documents,
    COUNT(CASE WHEN id = '85852790-be9e-4432-84c0-a3f00ed2353e' THEN 1 END) as document_cible_trouve,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM documents
WHERE tenant IS NULL
  AND created_at::date = '2025-12-10'::date;
\echo ''

-- 6. Rechercher des documents avec un UUID similaire (en cas d'erreur de copie)
\echo '6. Recherche par UUID partiel (85852790-be9e)'
\echo '--------------------------------------------'
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*) || ' DOCUMENT(S) TROUVÉ(S)'
        ELSE '❌ AUCUN DOCUMENT TROUVÉ'
    END as statut,
    id,
    filename,
    sha256_hex,
    created_at,
    tenant,
    odoo_model,
    odoo_id
FROM documents
WHERE id::text LIKE '85852790-be9e%'
GROUP BY id, filename, sha256_hex, created_at, tenant, odoo_model, odoo_id
ORDER BY created_at DESC;
\echo ''

-- 7. Statistiques générales pour le jour
\echo '7. Statistiques générales - 2025-12-10'
\echo '--------------------------------------------'
SELECT 
    COUNT(*) as total_documents,
    COUNT(DISTINCT tenant) as tenants_distincts,
    COUNT(CASE WHEN evidence_jws IS NOT NULL THEN 1 END) as avec_jws,
    COUNT(CASE WHEN ledger_hash IS NOT NULL THEN 1 END) as avec_ledger,
    MIN(created_at) as premier_document,
    MAX(created_at) as dernier_document
FROM documents
WHERE created_at::date = '2025-12-10'::date;
\echo ''

\echo '============================================'
\echo 'FIN DU DIAGNOSTIC'
\echo '============================================'

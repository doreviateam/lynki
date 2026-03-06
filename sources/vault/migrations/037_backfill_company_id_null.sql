-- Migration 037 : Backfill company_id pour documents legacy (company_id IS NULL inacceptable)
-- Date : 2026-02-28
-- Contexte : SPEC Company v1.1 — tous les documents doivent avoir un company_id.
-- Stratégie :
--   1. Paiements : extraire depuis payload_json (company_id_string ou company_id)
--   2. Autres documents avec payload_json contenant company_id
--   3. Par défaut : odoo:1 (société principale Odoo)

-- 1. Paiements : company_id_string prioritaire, sinon company_id (entier)
UPDATE documents
SET company_id = COALESCE(
  NULLIF(TRIM(payload_json->>'company_id_string'), ''),
  CASE
    WHEN payload_json->>'company_id' IS NOT NULL
         AND (payload_json->>'company_id') ~ '^[0-9]+$'
         AND (payload_json->>'company_id')::bigint > 0
    THEN 'odoo:' || (payload_json->>'company_id')
    ELSE NULL
  END
)
WHERE company_id IS NULL
  AND source = 'payment'
  AND payload_json IS NOT NULL
  AND (
    NULLIF(TRIM(payload_json->>'company_id_string'), '') IS NOT NULL
    OR (
      payload_json->>'company_id' IS NOT NULL
      AND (payload_json->>'company_id') ~ '^[0-9]+$'
      AND (payload_json->>'company_id')::bigint > 0
    )
  );

-- 2. Paiements restants sans company_id dans payload : odoo:1
UPDATE documents
SET company_id = 'odoo:1'
WHERE company_id IS NULL
  AND source = 'payment';

-- 3. Documents avec payload_json contenant company_id à la racine (POS, etc.)
UPDATE documents
SET company_id = CASE
  WHEN payload_json->>'company_id_string' IS NOT NULL AND TRIM(payload_json->>'company_id_string') != ''
  THEN TRIM(payload_json->>'company_id_string')
  WHEN payload_json->>'company_id' IS NOT NULL
       AND (payload_json->>'company_id') ~ '^[0-9]+$'
       AND (payload_json->>'company_id')::bigint > 0
  THEN 'odoo:' || (payload_json->>'company_id')
  ELSE NULL
END
WHERE company_id IS NULL
  AND payload_json IS NOT NULL
  AND (
    (payload_json->>'company_id_string' IS NOT NULL AND TRIM(payload_json->>'company_id_string') != '')
    OR (
      payload_json->>'company_id' IS NOT NULL
      AND (payload_json->>'company_id') ~ '^[0-9]+$'
      AND (payload_json->>'company_id')::bigint > 0
    )
  );

-- 4. Tous les documents restants (factures, etc.) : odoo:1
UPDATE documents
SET company_id = 'odoo:1'
WHERE company_id IS NULL;

-- Vérification : aucun document ne doit rester avec company_id NULL
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM documents WHERE company_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration 037: % documents ont encore company_id NULL', null_count;
  END IF;
END $$;

COMMENT ON COLUMN documents.company_id IS 'Company ID normatif (source_system:source_company_id). Obligatoire après migration 037.';

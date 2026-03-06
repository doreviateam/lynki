-- Migration 027 : Colonne error_code sur diva_insights (SPEC v1.3 §6 — gestion état failed)
-- Date : 2026-02-18

ALTER TABLE diva_insights ADD COLUMN IF NOT EXISTS error_code TEXT;

ALTER TABLE diva_insights DROP CONSTRAINT IF EXISTS diva_insights_error_code_check;
ALTER TABLE diva_insights ADD CONSTRAINT diva_insights_error_code_check
    CHECK (error_code IS NULL OR error_code IN (
        'MISTRAL_TIMEOUT', 'MISTRAL_UNAVAILABLE', 'MISTRAL_OOM',
        'MISTRAL_BAD_RESPONSE', 'INVALID_PAYLOAD'
    ));

-- UPDATE nécessaire pour l'upsert ON CONFLICT dans InsertInsight
GRANT UPDATE ON diva_insights TO diva;

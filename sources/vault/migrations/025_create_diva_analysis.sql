-- Migration 025 : Table diva_analysis (SPEC DIVA Async Persistent Analysis Store v1.1)
-- Date : 2026-02-17
-- Description : Stockage persistant des jobs d'analyse DIVA (flash narrative KPI Linky)

-- Table diva_analysis
CREATE TABLE IF NOT EXISTS diva_analysis (
    context_hash TEXT PRIMARY KEY,
    status TEXT NOT NULL,  -- processing | done | failed
    flash_json JSONB,
    started_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    error_code TEXT,
    error_message TEXT
);

-- Contrainte sur status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_diva_analysis_status'
    ) THEN
        ALTER TABLE diva_analysis ADD CONSTRAINT chk_diva_analysis_status
        CHECK (status IN ('processing', 'done', 'failed'));
    END IF;
END $$;

-- Index pour purge des lignes expirées
CREATE INDEX IF NOT EXISTS idx_diva_analysis_expires_at ON diva_analysis(expires_at);

-- Index pour requêtes par statut
CREATE INDEX IF NOT EXISTS idx_diva_analysis_status ON diva_analysis(status);

-- Commentaires
COMMENT ON TABLE diva_analysis IS 'Jobs d''analyse DIVA (flash narrative KPI Linky) - stockage persistant';
COMMENT ON COLUMN diva_analysis.context_hash IS 'Clé SHA256 du contexte (tenant, company, dates, cards)';
COMMENT ON COLUMN diva_analysis.status IS 'processing | done | failed';
COMMENT ON COLUMN diva_analysis.flash_json IS 'Résultat JSON du flash (headline, what_i_see, to_check, confidence)';
COMMENT ON COLUMN diva_analysis.started_at IS 'Début du job LLM';
COMMENT ON COLUMN diva_analysis.expires_at IS 'Expiration du cache (TTL aligné navigateur)';

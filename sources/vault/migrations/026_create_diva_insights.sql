-- Migration 026 : Table diva_insights (SPEC DIVA Insights v1.1)
-- Date : 2026-02-18
-- Description : Cache applicatif insights DIVA (lecture instantanée, mode A)

-- Table diva_insights
CREATE TABLE IF NOT EXISTS diva_insights (
    id              BIGSERIAL PRIMARY KEY,
    tenant          TEXT NOT NULL,
    company_id      INTEGER NOT NULL DEFAULT 0,
    mode            TEXT NOT NULL CHECK (mode IN ('cockpit', 'card')),
    card_key        TEXT,
    date_start      DATE NOT NULL,
    date_end        DATE NOT NULL,
    context_key     TEXT NOT NULL,
    payload_hash    TEXT NOT NULL,
    message_text    TEXT NOT NULL,
    flash_json      JSONB NOT NULL,
    status          TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'error')),
    confidence      TEXT CHECK (confidence IN ('low', 'medium', 'high')),
    model           TEXT,
    latency_ms      INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL,
    generated_from_runner BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT chk_mode_card_key CHECK (
        (mode = 'cockpit' AND card_key IS NULL)
        OR (mode = 'card' AND card_key IS NOT NULL AND length(card_key) > 0)
    )
);

-- Idempotence : un seul insight consommable par (context_key, payload_hash).
CREATE UNIQUE INDEX IF NOT EXISTS idx_diva_insights_unique_ok
    ON diva_insights (context_key, payload_hash) WHERE status = 'ok';

CREATE INDEX IF NOT EXISTS idx_diva_insights_lookup
    ON diva_insights (tenant, company_id, mode, COALESCE(card_key, ''), date_start, date_end);

CREATE INDEX IF NOT EXISTS idx_diva_insights_expires
    ON diva_insights (expires_at);

CREATE INDEX IF NOT EXISTS idx_diva_insights_context_ok
    ON diva_insights (context_key) WHERE status = 'ok';

-- Commentaires
COMMENT ON TABLE diva_insights IS 'Cache insights DIVA (lecture instantanée) - TTL court, purge par lots';
COMMENT ON COLUMN diva_insights.context_key IS 'SHA-256(tenant|company_id|mode|card_key|date_start|date_end) - lock slot';
COMMENT ON COLUMN diva_insights.payload_hash IS 'SHA-256(canonical_json(hash_input)) - idempotence';

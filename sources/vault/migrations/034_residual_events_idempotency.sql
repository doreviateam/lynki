-- Migration 034 : AR by Partner - Idempotence invoice.residual.changed (SPEC v1.0.3 Annexe A)
-- Date : 2026-02-22
-- Description : Table pour garantir l'idempotence par event_id

CREATE TABLE IF NOT EXISTS residual_events_idempotency (
    tenant TEXT NOT NULL,
    event_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant, event_id)
);

CREATE INDEX IF NOT EXISTS idx_residual_events_created
    ON residual_events_idempotency(created_at);

COMMENT ON TABLE residual_events_idempotency IS 'Idempotence invoice.residual.changed : ignorer si event_id déjà traité';
COMMENT ON COLUMN residual_events_idempotency.event_id IS 'idempotency.event_id du payload (SPEC Annexe A)';

-- Migration 028 : Création des tables economic_events et tenant_sequences (SPEC ERP Reconnect v1.2)
-- Date : 2026-02-21
-- Description : Tables pour le replay ERP (Vault Replay Button) - registre d'événements économiques

-- Table economic_events : registre ordonné des événements économiques par tenant
CREATE TABLE IF NOT EXISTS economic_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    sequence BIGINT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    payload_json JSONB NOT NULL,
    hash VARCHAR(64) NOT NULL,
    prev_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_payload_json JSONB,
    schema_version VARCHAR(50) NOT NULL DEFAULT 'dorevia.economic_event.v1',
    ingest_source VARCHAR(50) NOT NULL DEFAULT 'dvig',
    ingest_idempotency_key VARCHAR(64),
    event_key VARCHAR(255),
    company_id INTEGER,
    CONSTRAINT unique_sequence_per_tenant UNIQUE (tenant, sequence)
);

-- Table tenant_sequences : dernier sequence par tenant (assignation atomique)
CREATE TABLE IF NOT EXISTS tenant_sequences (
    tenant VARCHAR(255) PRIMARY KEY,
    last_sequence BIGINT NOT NULL DEFAULT 0
);

-- Index pour requêtes par tenant et sequence (feed ordonné)
CREATE INDEX IF NOT EXISTS idx_economic_events_tenant_sequence ON economic_events (tenant, sequence);

-- Index pour requêtes par timestamp
CREATE INDEX IF NOT EXISTS idx_economic_events_tenant_timestamp ON economic_events (tenant, timestamp);

-- Index unique event_key (clé logique, ex: invoice:F2026-001)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_economic_events_tenant_event_key
    ON economic_events (tenant, event_key) WHERE event_key IS NOT NULL;

-- Index unique ingest_idempotency_key (idempotence ingestion)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_economic_events_tenant_ingest_key
    ON economic_events (tenant, ingest_idempotency_key) WHERE ingest_idempotency_key IS NOT NULL;

-- Index pour filtrage par event_type
CREATE INDEX IF NOT EXISTS idx_economic_events_tenant_event_type ON economic_events (tenant, event_type);

-- Commentaires
COMMENT ON TABLE economic_events IS 'Registre ordonné des événements économiques (SPEC ERP Reconnect v1.2). Source de vérité pour le replay vers ERP.';
COMMENT ON TABLE tenant_sequences IS 'Dernier sequence par tenant pour assignation atomique lors de l''ingestion.';
COMMENT ON COLUMN economic_events.event_id IS 'UUID unique de l''événement';
COMMENT ON COLUMN economic_events.sequence IS 'Ordre strict par tenant (1, 2, 3, ...)';
COMMENT ON COLUMN economic_events.payload_json IS 'Payload canonique (schema_version) - hash calculé sur représentation déterministe';
COMMENT ON COLUMN economic_events.hash IS 'SHA-256 hex du payload canonique (🔐 A)';
COMMENT ON COLUMN economic_events.prev_hash IS 'Hash de l''événement précédent (chaînage)';
COMMENT ON COLUMN economic_events.source_payload_json IS 'Payload brut reçu (debug, traçabilité)';
COMMENT ON COLUMN economic_events.ingest_idempotency_key IS 'Clé d''idempotence pour éviter double ingestion';
COMMENT ON COLUMN economic_events.event_key IS 'Clé logique optionnelle (ex: invoice:F2026-001)';

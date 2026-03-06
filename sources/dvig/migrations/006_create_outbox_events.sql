-- Migration 006 : Création de la table outbox_events pour le pattern Outbox
-- SPEC DVIG → Vault Forwarding v1.1
-- Permet la persistance des événements avant envoi vers Vault (Outbox pattern)

-- Création de la table outbox_events
CREATE TABLE IF NOT EXISTS outbox_events (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL UNIQUE,  -- UUID généré par DVIG (traçabilité)
    idempotency_key VARCHAR(64) NOT NULL,  -- SHA256 transmis par Odoo (idempotence)
    tenant VARCHAR(50) NOT NULL,
    env VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'accepted',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_try_at TIMESTAMP,
    next_retry_at TIMESTAMP,
    last_error TEXT,
    vault_receipt_id VARCHAR(100),
    payload JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_tenant_idempotency UNIQUE (tenant, idempotency_key)  -- ✅ Idempotence garantie
);

-- Index pour le worker (sélection optimisée)
-- Permet de trouver rapidement les événements à traiter
CREATE INDEX IF NOT EXISTS idx_outbox_worker
ON outbox_events(status, next_retry_at)
WHERE status IN ('accepted','failed_soft');

-- Index pour la traçabilité (recherche par event_id)
CREATE INDEX IF NOT EXISTS idx_outbox_event_id 
ON outbox_events(event_id);

-- Index pour la traçabilité (recherche par tenant + event_id)
CREATE INDEX IF NOT EXISTS idx_outbox_tenant_event 
ON outbox_events(tenant, event_id);

-- Index pour la recherche par status
CREATE INDEX IF NOT EXISTS idx_outbox_status 
ON outbox_events(status);

-- Index pour la recherche par tenant + status
CREATE INDEX IF NOT EXISTS idx_outbox_tenant_status 
ON outbox_events(tenant, status);

-- Commentaires pour documentation
COMMENT ON TABLE outbox_events IS 'Table Outbox pour persistance des événements avant envoi vers Vault (SPEC DVIG → Vault Forwarding v1.1)';
COMMENT ON COLUMN outbox_events.event_id IS 'UUID généré par DVIG pour traçabilité (unique par événement)';
COMMENT ON COLUMN outbox_events.idempotency_key IS 'SHA256 calculé par Odoo pour garantir l''idempotence bout en bout';
COMMENT ON COLUMN outbox_events.status IS 'État de l''événement : accepted, forwarding, forwarded, failed_soft, failed_hard, dead_letter';
COMMENT ON COLUMN outbox_events.attempt_count IS 'Nombre de tentatives d''envoi vers Vault';
COMMENT ON COLUMN outbox_events.next_retry_at IS 'Date/heure de la prochaine tentative (backoff exponentiel)';
COMMENT ON COLUMN outbox_events.vault_receipt_id IS 'ID de réception Vault (rempli après succès)';
COMMENT ON COLUMN outbox_events.payload IS 'Payload JSON complet de l''événement (format DVIG)';

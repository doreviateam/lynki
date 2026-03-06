-- Migration 035 : Tables bank_reconciliation_events et bank_reconciliation_projection (SPEC RECONCIL v1.1)
-- Date : 2026-02-25
-- Description : Event store + projection pour le rapprochement bancaire (is_reconciled vaulté)

-- Table bank_reconciliation_events : registre append-only des transitions reconciled/unreconciled
CREATE TABLE IF NOT EXISTS bank_reconciliation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('bank.move.reconciled', 'bank.move.unreconciled')),
    move_id INTEGER NOT NULL,
    account_id INTEGER,
    amount DECIMAL(18,4) NOT NULL,
    currency TEXT,
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id INTEGER,
    UNIQUE(tenant, idempotency_key)
);

-- Table bank_reconciliation_projection : état courant par move (tenant, move_id)
CREATE TABLE IF NOT EXISTS bank_reconciliation_projection (
    tenant TEXT NOT NULL,
    move_id INTEGER NOT NULL,
    is_reconciled BOOLEAN NOT NULL,
    amount DECIMAL(18,4) NOT NULL,
    last_transition_at TIMESTAMPTZ NOT NULL,
    account_id INTEGER,
    company_id INTEGER,
    PRIMARY KEY (tenant, move_id)
);

-- Index pour agrégations reconciled/unreconciled par tenant
CREATE INDEX IF NOT EXISTS idx_bank_reconciliation_projection_tenant_reconciled
    ON bank_reconciliation_projection(tenant, is_reconciled);

-- Index pour filtrage par company_id (multi-société)
CREATE INDEX IF NOT EXISTS idx_bank_reconciliation_projection_tenant_company
    ON bank_reconciliation_projection(tenant, company_id) WHERE company_id IS NOT NULL;

-- Index pour requêtes par tenant sur les événements
CREATE INDEX IF NOT EXISTS idx_bank_reconciliation_events_tenant_occurred
    ON bank_reconciliation_events(tenant, occurred_at);

COMMENT ON TABLE bank_reconciliation_events IS 'Registre append-only des événements bank.move.reconciled/unreconciled (SPEC RECONCIL v1.1)';
COMMENT ON TABLE bank_reconciliation_projection IS 'Projection optimisée : état courant is_reconciled par move pour calcul Trésorerie validée / En attente';

-- Migration 036 : Table financial_recon_deltas + colonne amount_signed (SPEC Confirmation Bancaire Stricte v1.3)
-- Date : 2026-02-25
-- Référence : ZeDocs/web32/SPEC_Confirmation_Bancaire_Stricte_v1.3.md

-- 1. Table financial_recon_deltas
-- Règles : occurred_at = date métier Odoo ; ingested_at = NOW() côté Vault
CREATE TABLE IF NOT EXISTS financial_recon_deltas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant TEXT NOT NULL,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    odoo_move_id INTEGER,
    bank_statement_line_id INTEGER NOT NULL,
    delta_amount_abs NUMERIC(16,2) NOT NULL,
    direction CHAR(1) NOT NULL CHECK (direction IN ('+', '-')),
    currency TEXT NOT NULL,
    event_uid TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant, event_uid)
);

CREATE INDEX IF NOT EXISTS idx_financial_recon_deltas_tenant_document
    ON financial_recon_deltas(tenant, document_id);

CREATE INDEX IF NOT EXISTS idx_financial_recon_deltas_tenant_odoo_move
    ON financial_recon_deltas(tenant, odoo_move_id) WHERE odoo_move_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financial_recon_deltas_tenant_bank_line
    ON financial_recon_deltas(tenant, bank_statement_line_id);

COMMENT ON TABLE financial_recon_deltas IS 'Deltas de confirmation bancaire par document (SPEC Confirmation Bancaire v1.3)';
COMMENT ON COLUMN financial_recon_deltas.occurred_at IS 'Date métier fournie par Odoo';
COMMENT ON COLUMN financial_recon_deltas.ingested_at IS 'Date ingestion Vault — DEFAULT now()';
COMMENT ON COLUMN financial_recon_deltas.direction IS 'CHAR(1) CHECK : + ou -';
COMMENT ON COLUMN financial_recon_deltas.event_uid IS 'Clé idempotente (idempotency_key Odoo ou hash hex/base64)';

-- 2. Colonne amount_signed sur documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS amount_signed NUMERIC(16,2);

CREATE INDEX IF NOT EXISTS idx_documents_amount_signed ON documents(amount_signed) WHERE amount_signed IS NOT NULL;

COMMENT ON COLUMN documents.amount_signed IS 'Montant signé : encaissement +, décaissement -. Source: payload amount ou total_ttc. SPEC Confirmation Bancaire v1.3.';

-- 3. Backfill amount_signed pour documents existants (payments)
-- Convention : encaissement +, décaissement −
-- Source : payload_json->>'amount' avec signe selon payment_direction ; fallback total_ttc
UPDATE documents d
SET amount_signed = CASE
    WHEN COALESCE(d.payload_json->>'payment_direction', 'inbound') = 'outbound'
    THEN -ABS(COALESCE((d.payload_json->>'amount')::numeric, d.total_ttc, 0))
    ELSE ABS(COALESCE((d.payload_json->>'amount')::numeric, d.total_ttc, 0))
END
WHERE d.source = 'payment'
  AND d.amount_signed IS NULL
  AND (d.payload_json IS NOT NULL OR d.total_ttc IS NOT NULL);

-- Note : payment_direction absent dans payload → COALESCE = 'inbound' → montant positif

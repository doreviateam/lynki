-- Migration 038 : Table payment_method_overrides (backfill ventilation Espèces/Banque)
-- Date : 2026-02-28
-- Contexte : SPEC_BACKFILL_PAIEMENTS_ESPECES_BANQUE_v1.0 — override méthode paiement sans modifier documents.
-- L'agrégation lit COALESCE(override.method, payload->>'method', 'transfer').

-- Table d'override pour réattribuer la méthode de paiement (backfill historique)
CREATE TABLE IF NOT EXISTS payment_method_overrides (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    method TEXT NOT NULL CHECK (method IN ('cash', 'transfer', 'check', 'card', 'mixed', 'other')),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (document_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_method_overrides_document
  ON payment_method_overrides(document_id);

COMMENT ON TABLE payment_method_overrides IS
  'Override méthode paiement (backfill). Prioritaire sur payload_json->>method.';
COMMENT ON COLUMN payment_method_overrides.reason IS
  'Traçabilité : backfill_2026_02_28, manual_correction, etc. Audit fonctionnel.';

-- Index pour le backfill : curseur stable (source, tenant, created_at, id)
-- Garantit une pagination sans sequence scan ; id pour tie-break
CREATE INDEX IF NOT EXISTS idx_documents_payment_tenant_created
  ON documents(source, tenant, created_at, id)
  WHERE source = 'payment';

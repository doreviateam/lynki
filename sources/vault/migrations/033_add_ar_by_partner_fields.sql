-- Migration 033 : AR by Partner (Encours & Retard) - SPEC v1.0.3
-- Date : 2026-02-22
-- Description : amount_residual, invoice_date_due, partner_id, last_residual_event_at pour agrégation AR

-- amount_residual : reste à payer (ouvert si > EPS 0.01)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS amount_residual DOUBLE PRECISION;

-- invoice_date_due : échéance (retard si < as_of_date)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS invoice_date_due DATE;

-- partner_id : clé P0 pour groupement (Odoo res.partner id)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS partner_id TEXT;

-- last_residual_event_at : garde-fou ordre (invoice.residual.changed)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_residual_event_at TIMESTAMPTZ;

-- Index pour agrégation AR (spec §5)
CREATE INDEX IF NOT EXISTS idx_documents_ar_invoice_date_due
  ON documents(tenant, company_id, invoice_date_due)
  WHERE tenant IS NOT NULL AND move_type = 'out_invoice';

CREATE INDEX IF NOT EXISTS idx_documents_ar_partner_id
  ON documents(tenant, company_id, partner_id)
  WHERE tenant IS NOT NULL AND move_type = 'out_invoice';

CREATE INDEX IF NOT EXISTS idx_documents_ar_amount_residual
  ON documents(tenant, company_id, amount_residual)
  WHERE tenant IS NOT NULL AND move_type = 'out_invoice' AND amount_residual > 0.01;

COMMENT ON COLUMN documents.amount_residual IS 'Reste à payer (AR). Ouvert si > EPS 0.01. Source: invoice.posted meta, invoice.residual.changed';
COMMENT ON COLUMN documents.invoice_date_due IS 'Date échéance facture. Retard si < as_of_date. Source: DVIG meta, invoice.residual.changed';
COMMENT ON COLUMN documents.partner_id IS 'ID partenaire Odoo (res.partner). Clé P0 pour groupement AR.';
COMMENT ON COLUMN documents.last_residual_event_at IS 'Garde-fou ordre: si changed_at <= last_residual_event_at alors ignore.';

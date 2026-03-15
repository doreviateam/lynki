-- Migration 041 : Table ar_payment_history (SPEC Priorisation v1.0 — Délai moyen de paiement)
-- Description : Historique des factures clients payées (due_date, payment_date) pour calcul
--               payment_delay_avg_days par partenaire. Alimenté par backfill Odoo puis events.

CREATE TABLE IF NOT EXISTS ar_payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant TEXT NOT NULL,
    company_id TEXT,
    partner_id TEXT NOT NULL,
    partner_name TEXT,
    odoo_invoice_id INTEGER NOT NULL,
    invoice_date_due DATE NOT NULL,
    payment_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant, odoo_invoice_id)
);

CREATE INDEX IF NOT EXISTS idx_ar_payment_history_tenant_partner
    ON ar_payment_history(tenant, COALESCE(company_id, ''), partner_id);
CREATE INDEX IF NOT EXISTS idx_ar_payment_history_payment_date
    ON ar_payment_history(tenant, payment_date DESC);

COMMENT ON TABLE ar_payment_history IS 'Factures clients payées : due_date + payment_date pour calcul délai moyen de paiement (SPEC Priorisation v1.0).';

-- Migration 044 : Table stock_valuation_snapshots (Option B valeur du stock laplatine2026)
-- Date : 2026-03-15
-- Référence : ZeDocs/web52/SPEC_VALEUR_STOCK_OPTION_B_LAPLATINE2026_v1.0.md
-- Contrat : tenant, company_id, as_of_date (J-1), value, currency, source ; created_at (immuable), updated_at

CREATE TABLE IF NOT EXISTS stock_valuation_snapshots (
  id                BIGSERIAL PRIMARY KEY,
  tenant            TEXT NOT NULL,
  company_id        TEXT NOT NULL,
  as_of_date        DATE NOT NULL,
  value             NUMERIC(18,4) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'EUR',
  source            TEXT NOT NULL DEFAULT 'odoo.inventory.valuation',
  valuation_method  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant, company_id, as_of_date)
);

CREATE INDEX IF NOT EXISTS idx_stock_valuation_tenant_company_date
  ON stock_valuation_snapshots(tenant, company_id, as_of_date);

COMMENT ON TABLE stock_valuation_snapshots IS 'Snapshots quotidien de clôture (J-1) : valeur du stock par tenant/company_id, poussée par Odoo (Option B).';

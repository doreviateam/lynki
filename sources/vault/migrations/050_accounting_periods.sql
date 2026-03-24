-- Sprint 13 T72 — Calendrier comptable aligné ERP
-- Stocke les périodes comptables synchronisées depuis Odoo (exercice, mois, statut clôture).

CREATE TABLE IF NOT EXISTS accounting_periods (
    id                SERIAL PRIMARY KEY,
    tenant            TEXT NOT NULL,
    company_id        TEXT NOT NULL,
    fiscal_year_start DATE NOT NULL,
    fiscal_year_end   DATE NOT NULL,
    period_month      INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year       INTEGER NOT NULL,
    status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'locked')),
    closed_at         TIMESTAMPTZ,
    synced_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant, company_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_accounting_periods_tenant_year
    ON accounting_periods (tenant, period_year);

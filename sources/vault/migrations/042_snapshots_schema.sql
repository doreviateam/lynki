-- Migration 042 : Schéma snapshots + tables Phase 3 (ADR-0010 v1.1)
-- Date : 2026-03-14
-- Description : Tables pour séries Évolution Trésorerie, Encours, BFR (snapshotting mensuel)

CREATE SCHEMA IF NOT EXISTS snapshots;

-- Table treasury_position_snapshots (E2) — un point par (tenant, company_id, as_of_date)
CREATE TABLE IF NOT EXISTS snapshots.treasury_position_snapshots (
    tenant TEXT NOT NULL,
    company_id INTEGER NOT NULL,
    as_of_date DATE NOT NULL,
    validated_balance DECIMAL(18,4) NOT NULL,
    erp_balance DECIMAL(18,4),
    reconciled DECIMAL(18,4) NOT NULL,
    unreconciled DECIMAL(18,4) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant, company_id, as_of_date)
);

CREATE INDEX IF NOT EXISTS idx_treasury_position_snapshots_tenant_date
    ON snapshots.treasury_position_snapshots(tenant, as_of_date);

COMMENT ON TABLE snapshots.treasury_position_snapshots IS 'Snapshots mensuels position trésorerie (ADR-0010, Epic E2)';

-- Table ar_totals_snapshots (E3) — totaux AR par (tenant, company_id, as_of_date)
CREATE TABLE IF NOT EXISTS snapshots.ar_totals_snapshots (
    tenant TEXT NOT NULL,
    company_id INTEGER NOT NULL,
    as_of_date DATE NOT NULL,
    open_amount DECIMAL(18,4) NOT NULL,
    overdue_amount DECIMAL(18,4) NOT NULL,
    open_count_invoices INTEGER NOT NULL DEFAULT 0,
    overdue_count_invoices INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant, company_id, as_of_date)
);

CREATE INDEX IF NOT EXISTS idx_ar_totals_snapshots_tenant_date
    ON snapshots.ar_totals_snapshots(tenant, as_of_date);

COMMENT ON TABLE snapshots.ar_totals_snapshots IS 'Snapshots mensuels totaux AR / Encours (ADR-0010, Epic E3)';

-- Table ap_totals_snapshots (E4) — totaux AP par (tenant, company_id, as_of_date)
CREATE TABLE IF NOT EXISTS snapshots.ap_totals_snapshots (
    tenant TEXT NOT NULL,
    company_id INTEGER NOT NULL,
    as_of_date DATE NOT NULL,
    open_amount DECIMAL(18,4) NOT NULL,
    overdue_amount DECIMAL(18,4) NOT NULL,
    open_count_invoices INTEGER NOT NULL DEFAULT 0,
    overdue_count_invoices INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant, company_id, as_of_date)
);

CREATE INDEX IF NOT EXISTS idx_ap_totals_snapshots_tenant_date
    ON snapshots.ap_totals_snapshots(tenant, as_of_date);

COMMENT ON TABLE snapshots.ap_totals_snapshots IS 'Snapshots mensuels totaux AP / BFR (ADR-0010, Epic E4)';

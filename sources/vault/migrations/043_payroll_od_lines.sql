-- Migration 043 : Table payroll_od_lines (SPEC EBE OD payroll v1.0, PLAN Phase 1)
-- Date : 2026-03-15
-- Description : Lignes OD comptables de paie (641*, 645*) pour agrégat charges de personnel EBE

CREATE TABLE IF NOT EXISTS payroll_od_lines (
    id BIGSERIAL PRIMARY KEY,
    tenant VARCHAR(255) NOT NULL,
    move_id INTEGER NOT NULL,
    line_id INTEGER NOT NULL,
    line_date DATE NOT NULL,
    account_code VARCHAR(32) NOT NULL,
    debit DECIMAL(18,4) NOT NULL DEFAULT 0,
    credit DECIMAL(18,4) NOT NULL DEFAULT 0,
    currency VARCHAR(8) NOT NULL DEFAULT 'EUR',
    state TEXT NOT NULL DEFAULT 'posted',
    company_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uniq_payroll_od_lines_tenant_move_line UNIQUE (tenant, move_id, line_id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_od_lines_tenant_date
    ON payroll_od_lines(tenant, line_date);

CREATE INDEX IF NOT EXISTS idx_payroll_od_lines_tenant_account
    ON payroll_od_lines(tenant, account_code);

COMMENT ON TABLE payroll_od_lines IS 'Lignes OD comptables de paie (641*, 645*) pour agrégat EBE (SPEC EBE OD payroll v1.0). Idempotence par (tenant, move_id, line_id).';
COMMENT ON COLUMN payroll_od_lines.move_id IS 'ID Odoo account.move';
COMMENT ON COLUMN payroll_od_lines.line_id IS 'ID Odoo account.move.line';
COMMENT ON COLUMN payroll_od_lines.line_date IS 'Date comptable de l''écriture';
COMMENT ON COLUMN payroll_od_lines.account_code IS 'Code compte (ex. 641100, 645100)';
COMMENT ON COLUMN payroll_od_lines.state IS 'Statut écriture parent : posted uniquement pour éligibilité';

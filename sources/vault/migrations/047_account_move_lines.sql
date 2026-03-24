-- Migration 047 : Table account_move_lines — extension couverture trial_balance (Sprint 04 T21)
-- Date : 2026-03-20
-- ADR : ZeDocs/web57/ADR_T19_TRIAL_BALANCE_EXTENSION.md
-- Description : Écritures comptables Odoo tous journaux (posted) pour agrégat balance générale complète.
--               Vient compléter payroll_od_lines (OD paie uniquement, Sprint 02).
--               Idempotence par (tenant, move_id, line_id).

CREATE TABLE IF NOT EXISTS account_move_lines (
    id            BIGSERIAL PRIMARY KEY,
    tenant        VARCHAR(255) NOT NULL,
    move_id       INTEGER      NOT NULL,
    line_id       INTEGER      NOT NULL,
    line_date     DATE         NOT NULL,
    account_code  VARCHAR(32)  NOT NULL,
    journal_code  VARCHAR(32)  NOT NULL DEFAULT '',
    debit         DECIMAL(18,4) NOT NULL DEFAULT 0,
    credit        DECIMAL(18,4) NOT NULL DEFAULT 0,
    currency      VARCHAR(8)   NOT NULL DEFAULT 'EUR',
    state         TEXT         NOT NULL DEFAULT 'posted',
    company_id    INTEGER,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uniq_account_move_lines_tenant_move_line
        UNIQUE (tenant, move_id, line_id)
);

CREATE INDEX IF NOT EXISTS idx_account_move_lines_tenant_date
    ON account_move_lines(tenant, line_date);

CREATE INDEX IF NOT EXISTS idx_account_move_lines_tenant_account
    ON account_move_lines(tenant, account_code);

CREATE INDEX IF NOT EXISTS idx_account_move_lines_tenant_company
    ON account_move_lines(tenant, company_id)
    WHERE company_id IS NOT NULL;

COMMENT ON TABLE account_move_lines IS
    'Écritures comptables Odoo tous journaux (posted) — extension couverture trial_balance Sprint 04. '
    'Alimenté par le connecteur Odoo via POST /api/v1/account-move-lines. '
    'Idempotence par (tenant, move_id, line_id).';

COMMENT ON COLUMN account_move_lines.journal_code IS 'Code journal Odoo (ex. BNK1, VEN, ACH, OD) — traçabilité couverture.';
COMMENT ON COLUMN account_move_lines.state IS 'État écriture parent : posted uniquement pour éligibilité.';

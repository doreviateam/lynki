-- Migration 049 : Colonnes tiers V2 — préparation netting Sprint 11 T63
-- Date : 2026-03-20
-- Contexte : Sprint 11 prépare des balances tiers plus fiables (V2) pour Sprint 12.
--            Colonnes nullables : les lignes existantes restent lisibles.
--            Pas de logique de netting dans ce sprint — schéma seulement.

ALTER TABLE account_move_lines
    ADD COLUMN IF NOT EXISTS date_maturity      DATE    DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS full_reconcile_id  INTEGER DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS matching_number    TEXT    DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_account_move_lines_tenant_maturity
    ON account_move_lines(tenant, date_maturity)
    WHERE date_maturity IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_account_move_lines_tenant_reconcile
    ON account_move_lines(tenant, full_reconcile_id)
    WHERE full_reconcile_id IS NOT NULL;

COMMENT ON COLUMN account_move_lines.date_maturity     IS 'Date d échéance Odoo (account.move.line.date_maturity) — nullable, alimenté Sprint 11+.';
COMMENT ON COLUMN account_move_lines.full_reconcile_id IS 'ID lettrage complet Odoo (account.full.reconcile.id) — nullable, alimenté Sprint 11+.';
COMMENT ON COLUMN account_move_lines.matching_number   IS 'Numéro de lettrage Odoo (matching_number) — nullable, alimenté Sprint 11+.';

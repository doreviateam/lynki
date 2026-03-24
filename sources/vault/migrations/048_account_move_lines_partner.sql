-- Migration 048 : Ajout partner_id / partner_name sur account_move_lines — filtres GL Sprint 06 T33
-- Date : 2026-03-20
-- Contexte : GL enrichi (T33) nécessite filtre par partenaire Odoo.
--            Colonne nullable : les lignes d'avant ce sprint n'ont pas de partenaire.

ALTER TABLE account_move_lines
    ADD COLUMN IF NOT EXISTS partner_id   INTEGER DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS partner_name TEXT    DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_account_move_lines_tenant_partner
    ON account_move_lines(tenant, partner_id)
    WHERE partner_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_account_move_lines_tenant_journal
    ON account_move_lines(tenant, journal_code)
    WHERE journal_code <> '';

COMMENT ON COLUMN account_move_lines.partner_id   IS 'ID partenaire Odoo (res.partner.id) — nullable.';
COMMENT ON COLUMN account_move_lines.partner_name IS 'Nom partenaire au moment du push — cache lecture.';

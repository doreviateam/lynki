-- Migration 032 : partner_name (client associé à la facture)
-- Transmis par DVIG dans meta.partner_name ; priorité Factur-X BuyerName > payload.Meta

ALTER TABLE documents ADD COLUMN IF NOT EXISTS partner_name TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_partner_name ON documents(partner_name) WHERE partner_name IS NOT NULL;

COMMENT ON COLUMN documents.partner_name IS 'Nom du client/partenaire (buyer). Source: DVIG meta ou Factur-X BuyerName.';

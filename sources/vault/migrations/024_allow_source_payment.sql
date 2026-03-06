-- SPEC_DOREVIA_PAYMENTS_v1.1 : autoriser source = 'payment' pour documents paiements
ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_source;
ALTER TABLE documents ADD CONSTRAINT chk_source
  CHECK (source IN ('sales','purchase','pos','stock','sale','odoo','dvig','payment') OR source IS NULL);

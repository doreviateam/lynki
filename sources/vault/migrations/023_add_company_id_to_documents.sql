-- Migration 023 : Company ID (SPEC_VAULT_LINKY_COMPANY v1.1)
-- Format normatif : <source_system>:<source_company_id> (ex. odoo.stinger.sarl-la-platine:1)
-- Nullable pour rétrocompatibilité ; documents existants non modifiés.

ALTER TABLE documents ADD COLUMN IF NOT EXISTS company_id TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id) WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_tenant_company_id ON documents(tenant, company_id)
  WHERE tenant IS NOT NULL AND company_id IS NOT NULL;

COMMENT ON COLUMN documents.company_id IS 'Company ID normatif (source_system:source_company_id). Nullable pour legacy.';

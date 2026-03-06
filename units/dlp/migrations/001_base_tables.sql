-- Migration 001 : Tables de base DLP (SPEC_DLP_v0.3, PLAN_IMPLEMENTATION Phase 1)
-- Base dédiée au service DLP

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  external_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, external_id)
);

CREATE TABLE IF NOT EXISTS business_perimeters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS dlps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  intention TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  hit_count INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  snapshot_id UUID,
  CONSTRAINT dlp_status_check CHECK (status IN ('active', 'archived'))
);

CREATE TABLE IF NOT EXISTS dlp_scope_companies (
  dlp_id UUID NOT NULL,
  company_id UUID NOT NULL,
  PRIMARY KEY (dlp_id, company_id),
  FOREIGN KEY (dlp_id) REFERENCES dlps(id),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS dlp_scope_perimeters (
  dlp_id UUID NOT NULL,
  business_perimeter_id UUID NOT NULL,
  PRIMARY KEY (dlp_id, business_perimeter_id),
  FOREIGN KEY (dlp_id) REFERENCES dlps(id),
  FOREIGN KEY (business_perimeter_id) REFERENCES business_perimeters(id)
);

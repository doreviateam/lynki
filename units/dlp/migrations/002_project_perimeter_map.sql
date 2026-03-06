-- Migration 002 : Table project_perimeter_map (D1 Option B — SPEC_DLP_v0.3)
-- Mapping project_external_id (ERP) → business_perimeter

CREATE TABLE IF NOT EXISTS project_perimeter_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  source_system VARCHAR(64) NOT NULL,
  project_external_id VARCHAR(255) NOT NULL,
  business_perimeter_id UUID NOT NULL REFERENCES business_perimeters(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, source_system, project_external_id)
);

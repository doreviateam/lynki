-- Migration 003 : Table hits (SPEC_DLP_v0.3 §5.3)
-- Un hit par time_entry validé + DLP associée (idempotence par contrainte unique)

CREATE TABLE IF NOT EXISTS hits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  dlp_id UUID NOT NULL REFERENCES dlps(id),
  company_id UUID NOT NULL,
  business_perimeter_id UUID NOT NULL REFERENCES business_perimeters(id),
  source_system VARCHAR(64) NOT NULL,
  time_entry_external_id VARCHAR(255) NOT NULL,
  hit_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, dlp_id, source_system, time_entry_external_id)
);

CREATE INDEX IF NOT EXISTS idx_hits_tenant_hit_at ON hits(tenant_id, hit_at);
CREATE INDEX IF NOT EXISTS idx_hits_dlp_id ON hits(dlp_id);

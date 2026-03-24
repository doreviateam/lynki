CREATE TABLE IF NOT EXISTS facts_pack_archive (
    id               SERIAL PRIMARY KEY,
    tenant           TEXT NOT NULL,
    facts_hash       TEXT NOT NULL,
    pack_json        JSONB NOT NULL,
    source           TEXT NOT NULL CHECK (source IN ('insight', 'report')),
    template_version TEXT,
    generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant, facts_hash, source)
);

CREATE INDEX IF NOT EXISTS idx_facts_pack_archive_tenant_hash
    ON facts_pack_archive (tenant, facts_hash);
CREATE INDEX IF NOT EXISTS idx_facts_pack_archive_generated_at
    ON facts_pack_archive (generated_at);

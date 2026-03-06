-- Migration 030 : Tables replay_jobs et replay_job_logs (SPEC ERP Reconnect v1.2 - E4-US1)
-- Date : 2026-02-19
-- Description : Jobs de replay et logs pour orchestration Runner

-- Table replay_jobs : jobs de replay (dry_run ou apply)
CREATE TABLE IF NOT EXISTS replay_jobs (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant VARCHAR(255) NOT NULL,
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('dry_run', 'apply')),
    status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    range_from TIMESTAMPTZ,
    range_to TIMESTAMPTZ,
    options JSONB DEFAULT '{}',
    progress_events_processed BIGINT DEFAULT 0,
    progress_last_sequence BIGINT,
    progress_cursor VARCHAR(512),
    stats_json JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Table replay_job_logs : logs d'exécution par job
CREATE TABLE IF NOT EXISTS replay_job_logs (
    id BIGSERIAL PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES replay_jobs(job_id) ON DELETE CASCADE,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level VARCHAR(10) NOT NULL DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error')),
    message TEXT NOT NULL,
    data JSONB
);

-- Index pour requêtes par tenant et status (poll jobs queued)
CREATE INDEX IF NOT EXISTS idx_replay_jobs_tenant_status ON replay_jobs(tenant, status);

-- Index pour liste jobs par tenant
CREATE INDEX IF NOT EXISTS idx_replay_jobs_tenant_created ON replay_jobs(tenant, created_at DESC);

-- Index pour logs par job
CREATE INDEX IF NOT EXISTS idx_replay_job_logs_job_id ON replay_job_logs(job_id);

CREATE INDEX IF NOT EXISTS idx_replay_job_logs_job_logged ON replay_job_logs(job_id, logged_at);

-- Commentaires
COMMENT ON TABLE replay_jobs IS 'Jobs de replay ERP (SPEC §6). Mode dry_run ou apply. 1 Odoo par tenant (spec §8 G).';
COMMENT ON TABLE replay_job_logs IS 'Logs d''exécution des jobs de replay';
COMMENT ON COLUMN replay_jobs.mode IS 'dry_run : simulation sans ERP. apply : exécution réelle';
COMMENT ON COLUMN replay_jobs.status IS 'queued → running → completed|failed';
COMMENT ON COLUMN replay_jobs.options IS 'JSON : odoo_url, etc. (1 ERP par tenant)';
COMMENT ON COLUMN replay_jobs.progress_cursor IS 'Cursor HMAC pour reprise après crash';

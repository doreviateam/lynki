-- Migration 029 : Write barrier pour backfill (SPEC ERP Reconnect v1.2 - E3-US0)
-- Date : 2026-02-21
-- Description : Table tenant_locks - bloque l'ingestion pendant le backfill

CREATE TABLE IF NOT EXISTS tenant_locks (
    tenant VARCHAR(255) PRIMARY KEY,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_by VARCHAR(100),
    reason VARCHAR(255) DEFAULT 'backfill'
);

CREATE INDEX IF NOT EXISTS idx_tenant_locks_tenant ON tenant_locks(tenant);

COMMENT ON TABLE tenant_locks IS 'Write barrier : aucun nouvel événement accepté pour un tenant locké (backfill en cours)';
COMMENT ON COLUMN tenant_locks.locked_by IS 'Identifiant du job ou opérateur';
COMMENT ON COLUMN tenant_locks.reason IS 'Raison du lock (ex: backfill, migration)';

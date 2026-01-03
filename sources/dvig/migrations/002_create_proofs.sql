-- Migration 002 : Création de la table proofs
-- Stockage des preuves vaultées avec idempotence via event_id

CREATE TABLE IF NOT EXISTS proofs (
    id SERIAL PRIMARY KEY,
    proof_id VARCHAR(100) UNIQUE NOT NULL,
    hash VARCHAR(64) NOT NULL,  -- SHA-256
    timestamp TIMESTAMP NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    tenant VARCHAR(50) NOT NULL,
    env VARCHAR(20) NOT NULL,
    date VARCHAR(8) NOT NULL,  -- YYYYMMDD pour séquence quotidienne
    sequence INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proofs_proof_id ON proofs(proof_id);
CREATE INDEX IF NOT EXISTS idx_proofs_event_id ON proofs(event_id);
CREATE INDEX IF NOT EXISTS idx_proofs_tenant_env ON proofs(tenant, env);
CREATE INDEX IF NOT EXISTS idx_proofs_date_sequence ON proofs(tenant, date, sequence);
CREATE INDEX IF NOT EXISTS idx_proofs_timestamp ON proofs(timestamp);

-- Index composite pour idempotence
CREATE UNIQUE INDEX IF NOT EXISTS idx_proofs_tenant_env_event_id ON proofs(tenant, env, event_id);


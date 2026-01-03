-- Migration 001 : Création de la table dvig_tokens
-- Source de vérité pour les tokens DVIG (P0.1)

CREATE TABLE IF NOT EXISTS dvig_tokens (
    id SERIAL PRIMARY KEY,
    tenant VARCHAR(50) NOT NULL,
    env VARCHAR(20) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,  -- SHA-256
    created_at TIMESTAMP DEFAULT NOW(),
    revoked_at TIMESTAMP NULL,
    UNIQUE(tenant, env, token_hash)
);

CREATE INDEX IF NOT EXISTS idx_dvig_tokens_tenant_env ON dvig_tokens(tenant, env);
CREATE INDEX IF NOT EXISTS idx_dvig_tokens_token_hash ON dvig_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_dvig_tokens_revoked_at ON dvig_tokens(revoked_at) WHERE revoked_at IS NULL;


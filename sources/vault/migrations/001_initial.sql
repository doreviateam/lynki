-- Migration 001: Table documents initiale (base)
-- Référence: INTEGRATION_POSTGRESQL_DOREVIA_VAULT_v0.1.md
-- Prérequis pour migrations 003+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS documents (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename     TEXT NOT NULL,
  content_type TEXT,
  size_bytes   BIGINT,
  sha256_hex   TEXT NOT NULL,
  stored_path  TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

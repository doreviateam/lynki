-- Migration 039 : Table expected_counts (Phase DVIG — complétude probante)
-- Date : 2026-03-03
-- Contexte : SPEC_COMPLETUDE_AVANT_AFFICHAGE_v1.1 — expected_count déclaré par DVIG/connecteur, pas de requête live ERP.
-- Source : ERP → DVIG (watermark) → Vault.
-- Usage : GET /ui/completeness-snapshot agrège expected_count par scope (somme des 5 sources).

-- company_id = '' pour agrégat tous sociétés (évite NULL dans UNIQUE)
CREATE TABLE IF NOT EXISTS expected_counts (
    id SERIAL PRIMARY KEY,
    tenant VARCHAR(50) NOT NULL,
    company_id VARCHAR(50) NOT NULL DEFAULT '',
    period_from DATE NOT NULL,
    period_to DATE NOT NULL,
    source VARCHAR(30) NOT NULL CHECK (source IN ('sales', 'purchases', 'paymentsIn', 'paymentsOut', 'pos')),
    expected_count INTEGER NOT NULL CHECK (expected_count >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant, company_id, period_from, period_to, source)
);

CREATE INDEX IF NOT EXISTS idx_expected_counts_scope
    ON expected_counts(tenant, company_id, period_from, period_to);

COMMENT ON TABLE expected_counts IS
    'Comptages attendus par scope (DVIG/connecteur). Phase DVIG complétude probante. Pas de requête live ERP.';
COMMENT ON COLUMN expected_counts.source IS
    'sales|purchases|paymentsIn|paymentsOut|pos — aligné sealed_count_sources';

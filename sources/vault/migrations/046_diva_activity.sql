-- Migration 046 : Table diva_activity — garde d'inactivité pour le runner DIVA (Option B)
-- Date : 2026-03-17
-- Objectif : Mistral ne tourne que si un utilisateur a consulté le cockpit récemment.
-- Upsert par (tenant, company_id) : last_seen_at est mis à jour à chaque lecture d'insight.

CREATE TABLE IF NOT EXISTS diva_activity (
    tenant       TEXT    NOT NULL,
    company_id   INTEGER NOT NULL DEFAULT 0,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant, company_id)
);

COMMENT ON TABLE diva_activity IS 'Horodatage de dernière consultation cockpit DIVA — pilote la garde d''inactivité du runner';
COMMENT ON COLUMN diva_activity.last_seen_at IS 'UTC — mis à jour à chaque GET /diva/insights consommé par un utilisateur';

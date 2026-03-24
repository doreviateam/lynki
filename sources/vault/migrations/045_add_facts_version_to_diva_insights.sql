-- Migration 045 : ajout de facts_version à diva_insights (Phase 3A DIVA)
-- facts_version = empreinte courte (12 hex) du FactsPack canonique (payload_hash[:12]).
-- Permet d'invalider un insight quand les données source changent sans comparer le hash complet.
-- Si facts_version change pour un même context_key → l'insight est stale → régénération.

ALTER TABLE diva_insights ADD COLUMN IF NOT EXISTS facts_version TEXT;
CREATE INDEX IF NOT EXISTS idx_diva_insights_facts_version ON diva_insights (context_key, facts_version);

COMMENT ON COLUMN diva_insights.facts_version IS 'Empreinte courte du FactsPack (12 hex). Dérivée de payload_hash. Vide = ancien insight pré-migration.';

-- Migration 026b : Droits utilisateur diva sur diva_insights
-- Date : 2026-02-18
-- À exécuter MANUELLEMENT en tant que superuser APRÈS 026_create_diva_insights.sql

GRANT SELECT, INSERT, DELETE ON diva_insights TO diva;
GRANT USAGE, SELECT ON SEQUENCE diva_insights_id_seq TO diva;

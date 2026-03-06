-- Migration 040 : Colonne generated_at sur expected_counts (traçabilité, audit, futur "Dernière synchronisation")
-- Date : 2026-03-03
-- Spec : SPEC_ALIMENTATION_EXPECTED_COUNTS_DVIG_v1.0 §2.3 — champ optionnel ISO 8601

ALTER TABLE expected_counts
ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ;

COMMENT ON COLUMN expected_counts.generated_at IS
    'Timestamp fourni par le connecteur (ERP) — traçabilité, debug, audit, affichage "Dernière synchronisation"';

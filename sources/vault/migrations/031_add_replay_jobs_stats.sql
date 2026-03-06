-- Migration 031 : Champs checkpoint replay_jobs (vigilance checkpoint)
-- Date : 2026-02-19
-- Description : Pour installs ayant 030 sans stats_json ; alias sémantiques

-- stats_json : compteurs JSON (si 030 n'avait pas la colonne)
ALTER TABLE replay_jobs ADD COLUMN IF NOT EXISTS stats_json JSONB DEFAULT '{}';

COMMENT ON COLUMN replay_jobs.progress_last_sequence IS 'last_sequence_processed : dernier sequence traité (checkpoint reprise)';
COMMENT ON COLUMN replay_jobs.progress_cursor IS 'cursor_state : état cursor HMAC pour reprise';
COMMENT ON COLUMN replay_jobs.error_message IS 'last_error : dernière erreur si failed';
COMMENT ON COLUMN replay_jobs.stats_json IS 'Compteurs par type event, erreurs, warnings (évite migrations ultérieures)';

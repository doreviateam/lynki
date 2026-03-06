-- Purge diva_insights par lots (SPEC §5.5)
-- À exécuter en boucle jusqu'à 0 lignes supprimées (cron horaire)
-- Usage : psql -U vault -d dorevia_vault -f purge_diva_insights.sql

-- 1) Purge des ok expirés depuis > 1h
WITH batch_expired AS (
  SELECT id
  FROM diva_insights
  WHERE status = 'ok' AND expires_at < now() - interval '1 hour'
  ORDER BY id
  LIMIT 500
)
DELETE FROM diva_insights
WHERE id IN (SELECT id FROM batch_expired);

-- 2) Purge des error > 24h
WITH batch_error AS (
  SELECT id
  FROM diva_insights
  WHERE status = 'error' AND created_at < now() - interval '24 hours'
  ORDER BY id
  LIMIT 500
)
DELETE FROM diva_insights
WHERE id IN (SELECT id FROM batch_error);

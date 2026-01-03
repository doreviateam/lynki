-- Migration 003 : Ajout du champ accept_until pour gérer l'overlap
-- Permet la rotation des tokens sans downtime (SPEC v2.0)

-- Ajout du champ accept_until
ALTER TABLE dvig_tokens 
  ADD COLUMN IF NOT EXISTS accept_until TIMESTAMP NULL;

-- Index pour les requêtes de validation avec overlap
-- Permet de trouver rapidement les tokens en overlap (revoked_at IS NOT NULL AND accept_until > now)
CREATE INDEX IF NOT EXISTS idx_dvig_tokens_accept_until 
  ON dvig_tokens(tenant, env, accept_until) 
  WHERE revoked_at IS NOT NULL;

-- Index pour les requêtes de rotation automatique
-- Permet de trouver rapidement les tokens actifs pour calculer la date de rotation
CREATE INDEX IF NOT EXISTS idx_dvig_tokens_created_at 
  ON dvig_tokens(tenant, env, created_at) 
  WHERE revoked_at IS NULL;

-- Commentaire pour documentation
COMMENT ON COLUMN dvig_tokens.accept_until IS 'Timestamp jusqu''auquel un token révoqué est encore accepté (overlap). NULL si pas d''overlap.';


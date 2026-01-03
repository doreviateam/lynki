-- Migration 005 : Ajout des champs expiration et grace period pour auto-renew tokens DVIG
-- Permet l'expiration automatique et le renouvellement des tokens (SPEC Phase 4)
-- Inspiré de Caddy (pre-renew + grace period)

-- Ajout du champ expires_at
ALTER TABLE dvig_tokens 
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL;

-- Ajout du champ status
ALTER TABLE dvig_tokens 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'legacy';

-- Ajout du champ grace_until
ALTER TABLE dvig_tokens 
  ADD COLUMN IF NOT EXISTS grace_until TIMESTAMPTZ NULL;

-- Ajout du champ replaces_token_id (référence vers token précédent)
ALTER TABLE dvig_tokens 
  ADD COLUMN IF NOT EXISTS replaces_token_id INTEGER NULL;

-- Index pour les requêtes de validation par status
-- Permet de trouver rapidement les tokens actifs/grace pour un scope
CREATE INDEX IF NOT EXISTS idx_dvig_tokens_status 
  ON dvig_tokens(tenant, scope_unit, env, status) 
  WHERE status IN ('active', 'grace');

-- Index pour les requêtes de validation par expiration
-- Permet de trouver rapidement les tokens expirés ou à renouveler
CREATE INDEX IF NOT EXISTS idx_dvig_tokens_expires_at 
  ON dvig_tokens(expires_at) 
  WHERE expires_at IS NOT NULL;

-- Index pour les requêtes de validation par grace_until
-- Permet de trouver rapidement les tokens en grace period
CREATE INDEX IF NOT EXISTS idx_dvig_tokens_grace_until 
  ON dvig_tokens(grace_until) 
  WHERE grace_until IS NOT NULL;

-- Index pour les requêtes de renouvellement (trouver token actif par scope)
CREATE INDEX IF NOT EXISTS idx_dvig_tokens_scope_active 
  ON dvig_tokens(tenant, scope_unit, env, created_at) 
  WHERE status = 'active' AND expires_at IS NOT NULL;

-- Migration des tokens existants : marquer comme 'legacy' (sans expiration)
-- Les tokens existants continuent de fonctionner comme avant (rétrocompatibilité)
UPDATE dvig_tokens 
  SET status = 'legacy' 
  WHERE expires_at IS NULL AND status = 'legacy';

-- Contrainte de clé étrangère optionnelle pour replaces_token_id
-- Permet de référencer le token précédent lors d'un renouvellement
-- Note : Pas de contrainte FK stricte pour éviter les problèmes de migration
-- La cohérence est gérée au niveau applicatif

-- Commentaires pour documentation
COMMENT ON COLUMN dvig_tokens.expires_at IS 'Date d''expiration du token. NULL pour tokens legacy (sans expiration).';
COMMENT ON COLUMN dvig_tokens.status IS 'Statut du token : active (token courant), grace (token en période de grâce), revoked (révoqué), legacy (token sans expiration).';
COMMENT ON COLUMN dvig_tokens.grace_until IS 'Date jusqu''à laquelle un token en grace period reste accepté. NULL si pas en grace.';
COMMENT ON COLUMN dvig_tokens.replaces_token_id IS 'ID du token précédent remplacé par ce token lors d''un renouvellement. NULL si pas de renouvellement.';


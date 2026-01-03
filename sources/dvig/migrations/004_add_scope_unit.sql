-- Migration 004 : Ajout du champ scope_unit pour scoper les tokens DVIG par unit
-- Permet l'isolement logique des tokens par unit (SPEC v1.5.1)
-- Renommage sémantique : universe → unit

-- Ajout du champ scope_unit
ALTER TABLE dvig_tokens 
  ADD COLUMN IF NOT EXISTS scope_unit VARCHAR(50) NULL;

-- Index pour les requêtes de validation par unit
-- Permet de trouver rapidement les tokens actifs pour un {tenant, env, unit}
CREATE INDEX IF NOT EXISTS idx_dvig_tokens_scope_unit 
  ON dvig_tokens(tenant, env, scope_unit, revoked_at) 
  WHERE revoked_at IS NULL;

-- Index composite pour les requêtes de rotation automatique par unit
CREATE INDEX IF NOT EXISTS idx_dvig_tokens_scope_unit_created 
  ON dvig_tokens(tenant, env, scope_unit, created_at) 
  WHERE revoked_at IS NULL;

-- Migration des tokens existants : définir scope_unit='odoo' par défaut (rétrocompatibilité)
-- ⚠️ Cette migration assume que tous les tokens existants sont pour l'unit 'odoo'
UPDATE dvig_tokens 
  SET scope_unit = 'odoo' 
  WHERE scope_unit IS NULL;

-- Rendre scope_unit NOT NULL après migration (contrainte pour nouveaux tokens)
-- ⚠️ PostgreSQL uniquement (SQLite ne supporte pas ALTER COLUMN SET NOT NULL facilement)
-- Pour SQLite, on laisse NULL et on gère la contrainte au niveau applicatif
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dvig_tokens' 
    AND column_name = 'scope_unit'
    AND is_nullable = 'YES'
  ) THEN
    -- PostgreSQL : ajouter contrainte NOT NULL
    ALTER TABLE dvig_tokens 
      ALTER COLUMN scope_unit SET NOT NULL;
  END IF;
END $$;

-- Commentaire pour documentation
COMMENT ON COLUMN dvig_tokens.scope_unit IS 'Unit (ex: odoo, sylius, pdp) pour laquelle ce token est valide. NULL interdit après migration.';



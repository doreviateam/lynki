-- Migration 020 : Création de la table constats (SPEC 2 - Vault → Constat Mensuel)
-- Date : 2026-01-03
-- Description : Crée la table constats pour stocker les constats mensuels générés par le Vault

-- Créer la table constats
CREATE TABLE IF NOT EXISTS constats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant VARCHAR(255) NOT NULL,
    period VARCHAR(7) NOT NULL,  -- YYYY-MM
    generated_at TIMESTAMP NOT NULL,
    vault_id VARCHAR(255),
    
    -- Volumes par type de document
    volumes_out_invoice INTEGER DEFAULT 0,
    volumes_in_invoice INTEGER DEFAULT 0,
    volumes_out_refund INTEGER DEFAULT 0,
    volumes_in_refund INTEGER DEFAULT 0,
    
    -- Statistiques de conformité Factur-X (optionnel)
    compliance_compliant INTEGER DEFAULT 0,
    compliance_non_compliant_2026 INTEGER DEFAULT 0,
    compliance_out_of_scope INTEGER DEFAULT 0,
    
    -- Preuves cryptographiques
    proofs_jws TEXT,
    proofs_ledger_hash VARCHAR(255),
    proofs_documents_count INTEGER DEFAULT 0,
    
    -- Statut de transmission vers Odoo CORE
    transmitted_at TIMESTAMP,
    transmission_status VARCHAR(50) DEFAULT 'pending',  -- pending, transmitted, failed
    transmission_error TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Contrainte UNIQUE : un seul constat par (tenant, period)
    UNIQUE(tenant, period)
);

-- Index pour optimiser les requêtes par tenant et période
CREATE INDEX IF NOT EXISTS idx_constats_tenant_period ON constats(tenant, period);

-- Index pour optimiser les requêtes par statut de transmission
CREATE INDEX IF NOT EXISTS idx_constats_transmission_status ON constats(transmission_status) WHERE transmission_status IS NOT NULL;

-- Index pour optimiser les requêtes par date de génération
CREATE INDEX IF NOT EXISTS idx_constats_generated_at ON constats(generated_at DESC);

-- Contrainte sur transmission_status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_constats_transmission_status'
    ) THEN
        ALTER TABLE constats ADD CONSTRAINT chk_constats_transmission_status 
        CHECK (transmission_status IN ('pending', 'transmitted', 'failed'));
    END IF;
END $$;

-- Contrainte sur period (format YYYY-MM)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_constats_period_format'
    ) THEN
        ALTER TABLE constats ADD CONSTRAINT chk_constats_period_format 
        CHECK (period ~ '^\d{4}-\d{2}$');
    END IF;
END $$;

-- Commentaires sur les colonnes
COMMENT ON TABLE constats IS 'Table stockant les constats mensuels générés par le Vault pour transmission vers Odoo CORE';
COMMENT ON COLUMN constats.tenant IS 'Identifiant du tenant (client)';
COMMENT ON COLUMN constats.period IS 'Période du constat au format YYYY-MM (mois calendaire clos)';
COMMENT ON COLUMN constats.generated_at IS 'Date/heure de génération du constat (UTC)';
COMMENT ON COLUMN constats.vault_id IS 'Identifiant de l''instance Vault ayant généré le constat';
COMMENT ON COLUMN constats.volumes_out_invoice IS 'Nombre de factures clients (out_invoice) vaultées pour la période';
COMMENT ON COLUMN constats.volumes_in_invoice IS 'Nombre de factures fournisseurs (in_invoice) vaultées pour la période';
COMMENT ON COLUMN constats.volumes_out_refund IS 'Nombre d''avoirs clients (out_refund) vaultés pour la période';
COMMENT ON COLUMN constats.volumes_in_refund IS 'Nombre d''avoirs fournisseurs (in_refund) vaultés pour la période';
COMMENT ON COLUMN constats.compliance_compliant IS 'Nombre de documents avec Factur-X présent (compliant)';
COMMENT ON COLUMN constats.compliance_non_compliant_2026 IS 'Nombre de documents B2B sans Factur-X (non_compliant_2026)';
COMMENT ON COLUMN constats.compliance_out_of_scope IS 'Nombre de documents B2C ou non qualifiés (out_of_scope)';
COMMENT ON COLUMN constats.proofs_jws IS 'JWS signant le constat complet (preuve cryptographique)';
COMMENT ON COLUMN constats.proofs_ledger_hash IS 'Hash du constat dans le ledger (si activé)';
COMMENT ON COLUMN constats.proofs_documents_count IS 'Nombre total de documents inclus dans le constat';
COMMENT ON COLUMN constats.transmitted_at IS 'Date/heure de transmission réussie vers Odoo CORE';
COMMENT ON COLUMN constats.transmission_status IS 'Statut de transmission : pending, transmitted, failed';
COMMENT ON COLUMN constats.transmission_error IS 'Message d''erreur en cas d''échec de transmission';


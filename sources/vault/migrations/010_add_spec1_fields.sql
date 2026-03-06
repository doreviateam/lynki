-- Migration 010 : Ajout des champs SPEC 1 (Vaulting account.move posted)
-- Date : 2026-01-03
-- Description : Ajoute les champs nécessaires pour la SPEC 1 : move_type, compliance_status, facturx_present

-- Ajouter colonne move_type
ALTER TABLE documents ADD COLUMN IF NOT EXISTS move_type VARCHAR(50);

-- Ajouter colonne compliance_status
ALTER TABLE documents ADD COLUMN IF NOT EXISTS compliance_status VARCHAR(50) DEFAULT 'out_of_scope';

-- Ajouter colonne facturx_present
ALTER TABLE documents ADD COLUMN IF NOT EXISTS facturx_present BOOLEAN DEFAULT FALSE;

-- Créer index pour move_type (requêtes fréquentes par type de mouvement)
CREATE INDEX IF NOT EXISTS idx_documents_move_type ON documents(move_type) WHERE move_type IS NOT NULL;

-- Créer index pour compliance_status (requêtes de conformité)
CREATE INDEX IF NOT EXISTS idx_documents_compliance_status ON documents(compliance_status) WHERE compliance_status IS NOT NULL;

-- Créer index composite pour requêtes fréquentes (tenant + move_type)
CREATE INDEX IF NOT EXISTS idx_documents_tenant_move_type ON documents(tenant, move_type) WHERE tenant IS NOT NULL AND move_type IS NOT NULL;

-- Créer index composite pour requêtes de conformité par tenant
CREATE INDEX IF NOT EXISTS idx_documents_tenant_compliance ON documents(tenant, compliance_status) WHERE tenant IS NOT NULL AND compliance_status IS NOT NULL;

-- Créer index composite pour idempotence (tenant, sha256) - US-1.3
CREATE INDEX IF NOT EXISTS idx_documents_tenant_sha256 ON documents(tenant, sha256_hex) WHERE tenant IS NOT NULL;

-- Commentaires sur les colonnes
COMMENT ON COLUMN documents.move_type IS 'Type de mouvement Odoo (out_invoice, in_invoice, out_refund, in_refund) - Stocké pour preuve';
COMMENT ON COLUMN documents.compliance_status IS 'Statut de conformité Factur-X 2026 : compliant, non_compliant_2026, out_of_scope';
COMMENT ON COLUMN documents.facturx_present IS 'Indique si le document contient un format Factur-X';


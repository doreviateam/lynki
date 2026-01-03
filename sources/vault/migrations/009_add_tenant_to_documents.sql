-- Migration 009 : Ajout du support multi-tenant (Sprint 4 - US-4.3)
-- Date : 2025-01-28
-- Description : Ajoute le champ tenant pour l'isolation multi-tenant

-- Ajouter colonne tenant
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant VARCHAR(100);

-- Créer index pour performance des requêtes par tenant
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant);

-- Index composite pour requêtes fréquentes (tenant + date)
CREATE INDEX IF NOT EXISTS idx_documents_tenant_created_at ON documents(tenant, created_at);

-- Index composite pour requêtes par tenant et source Odoo
CREATE INDEX IF NOT EXISTS idx_documents_tenant_source ON documents(tenant, source) WHERE source IS NOT NULL;

-- Commentaire sur la colonne
COMMENT ON COLUMN documents.tenant IS 'Tenant ID (UUID ou alphanumérique) pour isolation multi-tenant';


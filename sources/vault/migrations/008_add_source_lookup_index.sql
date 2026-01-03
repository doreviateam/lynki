-- Migration 008: Index pour recherche rapide par source_model + source_id
-- Sprint 8: Support des endpoints /api/v1/proof/*

-- Index pour recherche rapide par source_model + odoo_id (pour factures, paiements)
CREATE INDEX IF NOT EXISTS idx_documents_source_lookup 
ON documents(odoo_model, odoo_id) 
WHERE odoo_id IS NOT NULL;

-- Index pour recherche rapide par source_model + source_id_text (pour tickets POS)
CREATE INDEX IF NOT EXISTS idx_documents_source_text_lookup 
ON documents(odoo_model, source_id_text) 
WHERE source_id_text IS NOT NULL;

-- Index composite pour recherche optimale (couvre les deux cas)
CREATE INDEX IF NOT EXISTS idx_documents_source_model_lookup 
ON documents(odoo_model) 
WHERE odoo_model IS NOT NULL;


-- Migration 021 : Ajout du champ constat_id (10 caractères alphanumériques)
-- Date : 2026-01-XX
-- Description : Ajoute le champ constat_id pour stocker l'ID externe de 10 caractères

-- Ajouter la colonne constat_id
ALTER TABLE constats 
ADD COLUMN IF NOT EXISTS constat_id VARCHAR(10) UNIQUE;

-- Créer un index sur constat_id pour les recherches
CREATE INDEX IF NOT EXISTS idx_constats_constat_id ON constats(constat_id);

-- Commentaire sur la colonne
COMMENT ON COLUMN constats.constat_id IS 'ID externe du constat (10 caractères alphanumériques) utilisé pour la communication avec Odoo CORE';


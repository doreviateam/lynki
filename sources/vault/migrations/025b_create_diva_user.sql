-- Migration 025b : Création de l'utilisateur PostgreSQL diva (DIVA Persistent Store)
-- Date : 2026-02-17
-- À exécuter MANUELLEMENT en tant que superuser (postgres) APRÈS 025_create_diva_analysis.sql
-- Usage : psql -U postgres -d dorevia_vault -f 025b_create_diva_user.sql

-- Créer l'utilisateur (échoue si déjà existant — safe pour réexécution manuelle)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'diva') THEN
        CREATE ROLE diva WITH LOGIN PASSWORD 'CHANGE_ME_IN_PROD';
        RAISE NOTICE 'Utilisateur diva créé. Pensez à modifier le mot de passe.';
    ELSE
        RAISE NOTICE 'Utilisateur diva existe déjà.';
    END IF;
END $$;

-- Droits sur la base
GRANT CONNECT ON DATABASE dorevia_vault TO diva;

-- Droits sur le schéma public (requis pour accéder aux tables)
GRANT USAGE ON SCHEMA public TO diva;

-- Droits sur la table diva_analysis uniquement
GRANT SELECT, INSERT, UPDATE, DELETE ON diva_analysis TO diva;

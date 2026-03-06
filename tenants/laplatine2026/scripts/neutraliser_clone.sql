-- Phase 5 : Neutralisation du clone laplatine2026 (STEP 5 SPEC)
-- À exécuter dans la base laplatine2026
-- docker exec -i odoo_db_lab_laplatine2026 psql -U odoo -d laplatine2026 -f /tmp/neutraliser.sql

-- SMTP : désactiver serveurs sortants
UPDATE ir_mail_server SET active = false;

-- Crons : désactiver mail, webhooks, marketing
UPDATE ir_cron SET active = false 
WHERE cron_name ILIKE '%mail%' 
   OR cron_name ILIKE '%webhook%' 
   OR cron_name ILIKE '%marketing%'
   OR cron_name ILIKE '%smtp%';

-- Résumé
SELECT 'Neutralisation terminée' AS statut;

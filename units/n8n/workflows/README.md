# Workflows n8n — Templates (Sprint 3)

**SPEC** : `ZeDocs/web11/SPEC_Units_SuiteCRM_N8n_Plateforme_v1.0.md` §8.

---

## Template A — Web-to-Lead (minimal)

- **Fichier** : `webhook-echo.json`
- **Rôle** : Webhook POST qui répond avec un JSON (placeholder pour enchaînement vers SuiteCRM).
- **Usage** : Import dans n8n (Import from File), activer le workflow, appeler l’URL de production (POST).
- **Évolution** : Ajouter un nœud HTTP Request vers l’API SuiteCRM (création Lead/Contact) après le Webhook ; configurer les credentials SuiteCRM dans n8n.

---

## Template B — Opportunity Won → Odoo (structure)

- **Fichier** : à créer ou exporter depuis n8n après configuration.
- **Rôle** : Déclenchement (webhook SuiteCRM ou polling) → récupération opportunité → création/màj `res.partner` dans Odoo → création `sale.order` draft (origin=suitecrm).
- **Prérequis** : Credentials Odoo dans n8n (API key ou basic auth), URL Odoo (ex. `https://odoo.<env>.<tenant>.doreviateam.com`).
- **Étapes** : Dans n8n : Webhook ou Schedule Trigger → (optionnel) HTTP Request vers SuiteCRM API → Odoo node (Create/Update Partner) → Odoo node (Create Quotation draft).

---

## Import d’un workflow

1. Ouvrir n8n : `https://n8n.<env>.<tenant>.doreviateam.com`
2. Menu (trois points) → **Import from File** (ou **Import from URL**).
3. Choisir le fichier JSON (ex. `webhook-echo.json`).
4. Vérifier les nœuds et connexions ; configurer les credentials si demandés.
5. **Activer** le workflow (toggle) pour que l’URL de production soit disponible.
6. Tester :  
   - **Script** : `./scripts/test_n8n_webhook.sh <tenant> <env>` (depuis la racine du repo).  
   - **curl** : `curl -X POST https://n8n.<env>.<tenant>.doreviateam.com/webhook/web-to-lead -H "Content-Type: application/json" -d '{"name":"Test"}'`  
   Voir `ZeDocs/web11/TESTS_WEBHOOK_N8N.md` pour la procédure détaillée.

---

## Credentials à configurer (selon template)

- **SuiteCRM** : API URL + user/password (ou token) pour créer Lead/Contact.
- **Odoo** : URL + DB + user/password (ou API key) pour Partner et Quotation.

Ne pas committer les credentials ; les configurer dans l’interface n8n (Credentials) après import.

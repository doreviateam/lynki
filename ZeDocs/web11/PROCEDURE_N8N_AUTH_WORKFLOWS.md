# Procédure n8n — Auth, encryption, workflows (Sprint 3 US-3.2 / US-3.3)

**DoD n8n** : URL TLS, auth activée, N8N_ENCRYPTION_KEY stable, DB persistante, import + exécution d’un template.  
**DoD Intégration** : Flow web-to-lead et flow opportunity → Odoo documentés et opérationnels (même manuels).

---

## 1. Auth et encryption

### 1.1 N8N_ENCRYPTION_KEY

- **Obligatoire** : définir une clé stable (32+ caractères). Ne jamais la perdre (sinon perte des credentials chiffrés).
- **Où** : `tenants/<tenant>/apps/n8n/<env>/.env` (ex. `N8N_ENCRYPTION_KEY=...`) ou variable d’environnement au démarrage.
- **Backup** : sauvegarder la clé de manière sécurisée (secret manager ou stockage chiffré).

### 1.2 Basic Auth (v1.0)

- Dans n8n : **Settings** → **User Management** (ou équivalent) pour activer la gestion des utilisateurs.
- Ou **Basic Auth** : variables `N8N_BASIC_AUTH_ACTIVE=true`, `N8N_BASIC_AUTH_USER`, `N8N_BASIC_AUTH_PASSWORD` dans le .env du tenant (à ajouter au compose/render si besoin).
- En production : TLS via Caddy + auth n8n (ou SSO en v1.1+).

---

## 2. DB persistante

- Conteneur **`n8n_db_<env>_<tenant>`** (PostgreSQL) ; volume nommé **`n8n_<env>_<tenant>_db`**.
- Les workflows et credentials (chiffrés) sont stockés en DB ; le volume `n8n_<env>_<tenant>_data` (home n8n) est optionnel.
- Backup : `pg_dump` depuis le conteneur DB (voir runbook ou `units/n8n/README.md`).

---

## 3. Import d’un workflow template

1. Accéder à n8n : `https://n8n.<env>.<tenant>.doreviateam.com`
2. **Import from File** : choisir `units/n8n/workflows/webhook-echo.json` (ou un export depuis n8n).
3. Vérifier les nœuds ; configurer les credentials si le template en utilise (SuiteCRM, Odoo).
4. **Activer** le workflow (toggle en haut à droite).
5. Copier l’**URL de production** du nœud Webhook (ex. `https://n8n..../webhook/web-to-lead`).
6. Tester :  
   - **Script** : `./scripts/test_n8n_webhook.sh <tenant> <env>` (réseau interne) ou `... <tenant> <env> --public` (URL publique).  
   - **curl** : `curl -X POST "https://n8n.<env>.<tenant>.doreviateam.com/webhook/web-to-lead" -H "Content-Type: application/json" -d '{"name":"Test","email":"test@example.com"}'`  
   Réponse attendue : `{"received":true,"message":"web-to-lead placeholder"}` (ou équivalent selon template).  
   **Voir** : `ZeDocs/web11/TESTS_WEBHOOK_N8N.md` pour la procédure détaillée et le cas 404 (workflow non activé).

---

## 4. Flow A — Web-to-Lead (opérationnel)

- **Objectif** : Formulaire / webhook → normalisation → création Lead (ou Contact) dans SuiteCRM.
- **Template minimal** : `webhook-echo.json` (webhook → réponse JSON). Valide import + exécution.
- **Compléter** : Ajouter un nœud **HTTP Request** vers l’API SuiteCRM (création Lead) ; configurer les credentials SuiteCRM dans n8n (URL, user, password ou token).
- **Déclenchement** : POST depuis un formulaire (landing), Postman, ou autre service vers l’URL du webhook n8n.

---

## 5. Flow B — Opportunity Won → Odoo (MVP)

- **Objectif** : Opportunité gagnée dans SuiteCRM → création/màj Partner Odoo + devis draft.
- **Déclenchement** : Webhook (SuiteCRM envoie un POST quand opportunité gagnée) ou Schedule (polling API SuiteCRM).
- **Nœuds** :  
  1. Webhook ou Schedule Trigger  
  2. (Optionnel) HTTP Request vers SuiteCRM pour récupérer opportunité + compte  
  3. Odoo node : Create or Update **Contact** (res.partner)  
  4. Odoo node : Create **Quotation** (sale.order) en draft, origin=suitecrm  
- **Credentials** : Odoo (URL, DB, user, password) configurés dans n8n.
- **Documentation** : Voir `units/n8n/workflows/README.md` pour la structure et l’import.

---

## 6. Checklist DoD n8n et Intégration

### n8n
- [ ] URL `n8n.<env>.<tenant>.doreviateam.com` accessible en TLS.
- [ ] Auth activée (basic auth ou user management) + N8N_ENCRYPTION_KEY stable.
- [ ] DB PostgreSQL persistante (conteneur `n8n_db_<env>_<tenant>`).
- [ ] Import du template `webhook-echo.json` (ou équivalent) réussi.
- [ ] Exécution webhook → réponse OK (ou création lead SuiteCRM si template complet).

### Intégration
- [ ] Flow « web-to-lead » opérationnel (webhook → réponse ou webhook → SuiteCRM Lead).
- [ ] Flow « opportunity won → Odoo draft quotation » MVP opérationnel (même manuel : déclencher, vérifier Partner + Quotation dans Odoo).
- [ ] Doc courte : comment déclencher les workflows, quelles credentials (Odoo, SuiteCRM) configurer dans n8n (voir §4 et §5 ci-dessus et `units/n8n/workflows/README.md`).

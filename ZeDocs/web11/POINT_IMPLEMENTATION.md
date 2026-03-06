# Point d’implémentation — Plateforme Dorevia (n8n, SuiteCRM, Sprint 3)

**Date** : 2026-01-24  
**Contexte** : État après déploiement n8n et SuiteCRM core/lab, et avant finalisation Sprint 3 (flows, backup, doc).

**Objectif global** : **SuiteCRM et Odoo synchronisés** — n8n au milieu pour les flows (web-to-lead, opportunity → Odoo). Voir `ZeDocs/web11/VISION_SYNCHRO_SUITECRM_ODOO.md` pour la vision détaillée.

**Focus actuel** : **Odoo ↔ DVIG/Vault** — checklist ordonnée dans `ZeDocs/web11/FOCUS_ODOO_DVIG_VAULT.md`.

---

## 1. Ce qui est en place (fait)

| Composant | État | Détail |
|-----------|------|--------|
| **Manifest core** | ✅ | `tenants/core/state/manifest.json` : univers `odoo`, `n8n`, `suitecrm` ; env `lab` ; units odoo (odoo + postgres), n8n, suitecrm. |
| **Render** | ✅ | `render <tenant> --env lab` génère Caddyfile + docker-compose pour n8n et suitecrm (Caddy : ports 5678 / 8080). |
| **n8n core/lab** | ✅ | TLS (`https://n8n.lab.core.doreviateam.com`), DB PostgreSQL persistante, N8N_ENCRYPTION_KEY + DB_POSTGRESDB_HOST explicite, healthcheck PostgreSQL OK. Compte owner créé, workflow webhook-echo importé et testé (path `/webhook/web-to-lead`). |
| **SuiteCRM core/lab** | ✅ | TLS (`https://suitecrm.lab.core.doreviateam.com`), DB MariaDB persistante, host DB explicite (`suitecrm_db_lab_core`), port 8080 dans Caddy. Admin : identifiant `admin`, mot de passe `admin`. |
| **Odoo core/lab** | ✅ | TLS (`https://odoo.lab.core.doreviateam.com`), DB PostgreSQL persistante, Caddy + certificat OK. Les **3 couches** (SuiteCRM, n8n, Odoo) sont opérationnelles en lab core. |
| **CLI dorevia.sh** | ✅ | `app up/down/status` pour n8n et suitecrm ; génération `odoo.conf` limitée à l’univers `odoo` (pas de fichier parasite pour suitecrm/n8n). |
| **Documentation** | ✅ | Procédures n8n (auth, workflows, réinit), SuiteCRM (admin, backup), interfaces FR (n8n/SuiteCRM), suite Sprint 3, tests manuels, troubleshooting SSL. |

---

## 2. En attente ou partiel (Sprint 3)

| Item | État | Prochaine étape |
|------|------|------------------|
| **Interfaces en français** | ⏸️ Non bloquant | n8n : pas de réglage langue dans l’UI (N8N_DEFAULT_LOCALE=fr déjà en place ; à revoir plus tard si besoin). SuiteCRM : pack langue FR à installer manuellement (Admin → Module Loader). |
| **Backup/restore SuiteCRM** | 📋 Documenté, script présent | Procédure dans `PROCEDURE_SUITECRM_ADMIN_BACKUP.md` ; script `scripts/backup_suitecrm_db.sh`. À valider par un test backup + restore. |
| **Flow A — Web-to-lead complet** | 📋 Template webhook-echo seulement | Étendre le workflow n8n : webhook → appel API SuiteCRM (création Lead/Contact). Prérequis : credentials SuiteCRM dans n8n, API SuiteCRM configurée. |
| **Flow B — Opportunity won → Odoo** | 📋 Structure décrite (README workflows) | Workflow n8n : déclenchement → récupération opportunité (SuiteCRM API ou mock) → création/màj res.partner + sale.order draft dans Odoo. Prérequis : Odoo accessible, credentials Odoo dans n8n. |
| **Documentation courte flows** | 📋 Planifiée (US-3.3) | Guide : comment déclencher les workflows, quelles credentials configurer (Odoo, SuiteCRM). Fichier cible : `units/n8n/README.md` ou `ZeDocs/web11`. |
| **Odoo → Vault** | 📋 Documenté | Connecter Odoo core lab à DVIG/Vault : token DVIG pour `odoo.lab.core`, module `dorevia_vault_connector`, paramètres `dorevia.dvig.*`. Voir `CONNECTER_ODOO_CORE_LAB_VAULT.md`. |
| **N8N_BASIC_AUTH** (optionnel) | ⏳ Non fait | Renforcer l’accès n8n (N8N_BASIC_AUTH_ACTIVE, USER, PASSWORD) ; doc backup N8N_ENCRYPTION_KEY déjà dans `PROCEDURE_N8N_AUTH_WORKFLOWS.md`. |

---

## 3. Ordre recommandé pour la suite (Sprint 3)

1. **Documentation courte** : déclencher workflows, credentials (Odoo, SuiteCRM) — sans dépendance.
2. **Flow B (opportunity → Odoo)** en MVP : mock ou API SuiteCRM si dispo ; Odoo + credentials dans n8n.
3. **Valider backup/restore SuiteCRM** : lancer `backup_suitecrm_db.sh`, tester un restore.
4. **Flow A (web-to-lead)** : webhook n8n → API SuiteCRM (création Lead) une fois SuiteCRM + API prêts.

---

## 4. Fichiers clés

| Rôle | Fichier(s) |
|------|------------|
| Plan Sprint 3 | `ZeDocs/web11/SUITE_IMPLEMENTATION_SPRINT3.md` |
| SPEC units | `ZeDocs/web11/SPEC_Units_SuiteCRM_N8n_Plateforme_v1.0.md` |
| n8n | `PROCEDURE_N8N_AUTH_WORKFLOWS.md`, `units/n8n/workflows/` (webhook-echo.json, README) |
| SuiteCRM | `PROCEDURE_SUITECRM_ADMIN_BACKUP.md`, `scripts/backup_suitecrm_db.sh` |
| Interfaces FR | `ZeDocs/web11/INTERFACES_FRANCAIS_N8N_SUITECRM.md` |
| Odoo → Vault | `ZeDocs/web11/CONNECTER_ODOO_CORE_LAB_VAULT.md`, module `dorevia_vault_connector` |

---

## 5. Résumé en une phrase

**Objectif** : SuiteCRM ↔ Odoo synchro (n8n au milieu). **Infra** : n8n et SuiteCRM core/lab déployés en HTTPS avec DB persistantes. **Restent à faire** : flows **web-to-lead** (formulaire → n8n → SuiteCRM Lead) et **opportunity won → Odoo** (SuiteCRM → n8n → res.partner + sale.order brouillon) ; optionnel : sync inverse Odoo → SuiteCRM (voir `VISION_SYNCHRO_SUITECRM_ODOO.md`).

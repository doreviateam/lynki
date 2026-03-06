# Suite d'implémentation — Sprint 3 et DoD SPEC

**Contexte** : Les **3 couches** (SuiteCRM, n8n, Odoo) sont opérationnelles en **core/lab** (HTTPS, DB persistantes). Objectif global : **SuiteCRM ↔ Odoo synchronisés** via n8n ; Odoo connecté à **Dorevia Vault** (factures postées → DVIG → Vault).

**Référence état détaillé** : `ZeDocs/web11/POINT_IMPLEMENTATION.md`.

---

## État actuel (coché)

- [x] Sprint 0, 1, 2 : Manifest, render, units, déploiement, Caddy, destroy/purge, smoke test.
- [x] n8n core/lab : TLS (`n8n.lab.core.doreviateam.com`), N8N_ENCRYPTION_KEY, DB persistante, owner, template webhook-echo testé.
- [x] Correctifs appliqués : DB_POSTGRESDB_HOST explicite (n8n_db_<env>_<tenant>), healthcheck PostgreSQL authentifié, diagnostic/réinit documentés.
- [x] **SuiteCRM core/lab** : TLS (`suitecrm.lab.core.doreviateam.com`), DB MariaDB persistante, admin/admin, port 8080 Caddy.
- [x] **Odoo core/lab** : TLS (`odoo.lab.core.doreviateam.com`), DB PostgreSQL persistante, template odoo.conf pour core, Caddy + certificat OK.
- [x] **Manifest core** : univers `odoo`, `n8n`, `suitecrm` ; env `lab` ; 3 couches déployables.

---

## Suite possible (ordre recommandé)

### 1. US-3.1 — SuiteCRM (fait pour core lab)

- **Objectif** : `suitecrm.<env>.<tenant>.doreviateam.com` en TLS, admin créé, DB persistante, backup/restore documenté.
- **État** : ✅ Fait pour core lab (image `bitnamilegacy/suitecrm:8`, port 8080). Pour d'autres tenants : idem ou image alternative.
- **Tâches restantes** : valider backup/restore (`scripts/backup_suitecrm_db.sh`, `PROCEDURE_SUITECRM_ADMIN_BACKUP.md`).

### 2. US-3.2 — Compléments n8n (optionnel)

- **N8N_BASIC_AUTH** : ajouter au render ou au .env (N8N_BASIC_AUTH_ACTIVE, USER, PASSWORD) pour renforcer l'accès en plus du compte owner.
- **Documentation** : rappeler backup N8N_ENCRYPTION_KEY dans `PROCEDURE_N8N_AUTH_WORKFLOWS.md` (déjà présent).

### 3. US-3.3 — DoD Intégration (flows opérationnels)

- **Flow A — Web-to-lead complet** : étendre le workflow n8n pour que le webhook envoie les données à l'API SuiteCRM (création Lead/Contact). Prérequis : SuiteCRM déployé et API configurée ; credentials SuiteCRM dans n8n.
- **Flow B — Opportunity won → Odoo** : workflow n8n : déclenchement (webhook ou Schedule) → récupération opportunité (SuiteCRM API ou mock) → création/màj res.partner + sale.order draft dans Odoo. Prérequis : credentials Odoo dans n8n.
- **Documentation** : court guide dans `units/n8n/README.md` ou `ZeDocs/web11` : comment déclencher les workflows, quelles credentials configurer (Odoo, SuiteCRM).

### 4. Odoo → Dorevia Vault

- **Objectif** : Factures postées Odoo core lab envoyées vers DVIG puis Vault (preuve horodatée).
- **État** : Documenté dans `CONNECTER_ODOO_CORE_LAB_VAULT.md`. Module `dorevia_vault_connector` présent ; à faire : token DVIG pour `odoo.lab.core`, installation module dans Odoo, paramètres `dorevia.dvig.*`.
- **Prérequis** : DVIG et Vault déployés pour tenant `core`.

---

## Ordre d'exécution proposé

| Priorité | Item | Dépendance |
|----------|------|-------------|
| 1 | US-3.3 — Documentation courte (déclencher workflows, credentials) | Aucune |
| 2 | Odoo → Vault : token DVIG + config Odoo (voir `CONNECTER_ODOO_CORE_LAB_VAULT.md`) | DVIG + Vault core |
| 3 | US-3.3 — Flow B (opportunity → Odoo) en MVP | Odoo + credentials n8n |
| 4 | Valider backup/restore SuiteCRM | Aucune |
| 5 | US-3.3 — Flow A web-to-lead complet (webhook → SuiteCRM Lead) | SuiteCRM + API |

---

## Fichiers utiles

- **État détaillé** : `POINT_IMPLEMENTATION.md`
- **Plan** : `PLAN_IMPLEMENTATION_SPEC_Units_SuiteCRM_N8n_SCRUM.md`
- **SPEC** : `SPEC_Units_SuiteCRM_N8n_Plateforme_v1.0.md`
- **Vision synchro** : `VISION_SYNCHRO_SUITECRM_ODOO.md`
- **n8n** : `PROCEDURE_N8N_AUTH_WORKFLOWS.md`, `units/n8n/workflows/`
- **SuiteCRM** : `PROCEDURE_SUITECRM_ADMIN_BACKUP.md`, `scripts/backup_suitecrm_db.sh`
- **Odoo → Vault** : `CONNECTER_ODOO_CORE_LAB_VAULT.md`

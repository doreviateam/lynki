# Checklist Phase 0 — Prérequis Odoo pour DLP

**Date :** 2026-02-23  
**Référence :** PLAN_IMPLEMENTATION_DLP_v0.3_SCRUM.md § Phase 0  
**Objectif :** Valider que le tenant Odoo dispose des modules et du workflow nécessaires pour le flux DLP (timesheet → hit → Énergie stratégique)

---

## 1. Modules requis

| Module | Rôle | Vérification |
|--------|------|--------------|
| `project` | Projets (project.project), tâches, hiérarchie | DoD : un projet existe |
| `hr_timesheet` | Saisie de temps sur projets (account.analytic.line) | DoD : saisie + validation possibles |

### Installation des modules

1. Se connecter à Odoo (interface web du tenant)
2. Activer le mode développeur : **Paramètres** → bas de page → **Activer le mode développeur**
3. **Applications** → **Mettre à jour la liste des applications**
4. Rechercher **Projet** → **Installer**
5. Rechercher **Feuilles de temps** (ou **hr_timesheet** / **Timesheet**) → **Installer**

**Alternative CLI :**
```bash
# Depuis l'hôte, si le conteneur Odoo est démarré
docker exec odoo_stinger_sarl-la-platine odoo -c /etc/odoo/odoo.conf -d odoo_stinger_sarl-la-platine -i project,hr_timesheet --stop-after-init
# Puis redémarrer Odoo
```

---

## 2. Script de vérification

Exécuter le script de diagnostic :

```bash
./scripts/check_odoo_phase0_dlp.sh sarl-la-platine stinger
```

### Installation des modules (si absents)

```bash
./scripts/install_odoo_modules_dlp.sh sarl-la-platine stinger
```

Ce script vérifie :
- Présence des modules `project` et `hr_timesheet` (state = installed)
- Existence d'au moins un projet
- Structure des tables `project_project`, `account_analytic_line`

---

## 3. IDs à documenter pour le connecteur

Le module `dorevia_dlp_connector` (Phase 6) enverra au service DLP :

| Champ DLP | Source Odoo | Exemple |
|-----------|-------------|---------|
| `tenant_id` | `ir.config_parameter` dorevia.dlp.tenant.id | `sarl-la-platine` |
| `source_system` | Constante | `odoo` |
| `company_id` | `account.analytic.line.company_id.id` | `1` (ou external_id `odoo:1`) |
| `project_external_id` | `account.analytic.line.project_id.id` | `5` |
| `time_entry_external_id` | `account.analytic.line.id` | `42` |
| `hit_at` | `datetime.now()` ou date validation | ISO 8601 |

### Requête SQL pour lister les IDs (optionnel)

```sql
-- Projets
SELECT id, name FROM project_project LIMIT 10;

-- Lignes de timesheet (dernières)
SELECT id, project_id, company_id, user_id, unit_amount, date 
FROM account_analytic_line 
WHERE project_id IS NOT NULL 
ORDER BY id DESC LIMIT 10;
```

---

## 4. Workflow de validation

À confirmer selon la version Odoo et les modules installés :

- **Odoo 18 Community** : `account.analytic.line` peut avoir un champ `validated` ou état lié à un workflow
- **Alternative** : considérer une ligne comme "validée" quand elle est **confirmée** / **approuvée** (selon config)
- **Hook envisagé** : `write()` sur `account.analytic.line` quand une transition d'état est détectée

**À vérifier manuellement :**
1. Créer un projet "Test DLP" avec une tâche
2. Saisir une ligne de temps sur ce projet
3. Valider/approuver cette ligne
4. Identifier le point d'interception (champ d'état, bouton, workflow)

---

## 5. Critères de validation Phase 0

- [ ] Module `project` installé
- [ ] Module `hr_timesheet` installé
- [ ] Au moins un projet créé
- [ ] Une ligne de timesheet peut être saisie et validée
- [ ] `company_id`, `project_id`, `account.analytic.line.id` identifiables
- [ ] Workflow de validation documenté pour le connecteur Phase 6

---

*Document lié : PLAN_IMPLEMENTATION_DLP_v0.3_SCRUM.md*

# Plan d'implémentation Scrum — DLP (Decision Link Performance) v0.3

**Date :** 2026-02-24 (mise à jour)  
**Référence :** `SPEC_DLP_v0.3.md`, `SPEC_DLP_UX_v0.1.md`  
**Durée estimée :** 5–7 sprints (8–12 jours) + Phase 8 (2 j)  
**Stack :** Service DLP (Go), Odoo (Python), Linky (Next.js / React)

---

## 0. Vue d'ensemble

| Phase | Périmètre | Estimation | Statut | Dépendance |
|-------|-----------|------------|--------|------------|
| **Phase 0** | Prérequis Odoo | 0,5 j | ✅ Fait | — |
| **Phase 1** | Service DLP (squelette) | 2 j | ✅ Fait | — |
| **Phase 2** | API CRUD DLP + mapping | 1,5 j | ✅ Fait | Phase 1 |
| **Phase 3** | API timesheet.validated + hits | 1,5 j | ✅ Fait | Phase 2 |
| **Phase 4** | API energy-summary | 1 j | ✅ Fait | Phase 3 |
| **Phase 5** | Linky — interface création + card | 2 j | ✅ Fait | Phase 4 |
| **Phase 6** | Odoo dorevia_dlp_connector | 1,5 j | ✅ Fait | Phase 0, Phase 3 |
| **Phase 7** | E2E + documentation | 1 j | ✅ Fait | Phase 5, 6 |
| **Phase 8** | Refonte UX (séparation Admin / Gouvernance) | 2 j | À faire | Phase 7 |

**Référence Phase 8 :** `SPEC_DLP_UX_v0.1.md`

**Ordre recommandé :** Phase 8.

---

## Phase 0 — Prérequis Odoo

**Objectif :** Tenir un tenant Odoo avec project + hr_timesheet fonctionnels pour tester le flux DLP.

| Tâche | Action | Vérification |
|-------|--------|--------------|
| 0.1 | Installer modules `project`, `hr_timesheet` (ou `timesheet_grid`) sur tenant lab/stinger | Création projet, saisie timesheet, validation possibles |
| 0.2 | Documenter les IDs : project_id, account.analytic.line id, company_id, user_id | Pour les tests manuels et le connecteur |

**DoD Phase 0 :**
- [ ] Un projet avec au moins une tâche existe
- [ ] Une ligne de timesheet peut être validée (workflow compris)
- [ ] company_id et project_id sont identifiables côté API/ORM

---

## Phase 1 — Service DLP (squelette)

**Objectif :** Créer `units/dlp/` avec schéma BDD, migrations, health check.

### 1.1 Structure du projet

| Élément | Détail |
|---------|--------|
| Dossier | `units/dlp/` |
| Langage | Go (aligné Vault) ou Python (aligné DVIG) — choix à trancher |
| BDD | PostgreSQL dédié ou schema dans DB partagée |
| Docker | docker-compose.yml, Dockerfile |

### 1.2 Migrations

**Migration 001 — Tables de base :**

- `tenants` (id, slug, created_at) — ou réutilisation tenant existant si registre partagé
- `companies` (id, tenant_id, external_id, name, created_at)
- `business_perimeters` (id, tenant_id, company_id, name, hit_count, sort_order, created_at)
- `dlps` (id, tenant_id, title, intention, hypothesis, created_at, created_by, status, hit_count, archived_at, snapshot_id)
- Tables de liaison : `dlp_scope_companies`, `dlp_scope_perimeters`

**Migration 002 — project_perimeter_map :**

```sql
CREATE TABLE project_perimeter_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  source_system VARCHAR(64) NOT NULL,
  project_external_id VARCHAR(255) NOT NULL,
  business_perimeter_id UUID NOT NULL REFERENCES business_perimeters(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, source_system, project_external_id)
);
```

**Migration 003 — hits :**

```sql
CREATE TABLE hits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  dlp_id UUID NOT NULL,
  company_id UUID NOT NULL,
  business_perimeter_id UUID NOT NULL,
  source_system VARCHAR(64) NOT NULL,
  time_entry_external_id VARCHAR(255) NOT NULL,
  hit_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, dlp_id, source_system, time_entry_external_id)
);
```

### 1.3 Endpoints minimalux

- `GET /health` — liveness
- `GET /ready` — readiness (DB connectée)

**DoD Phase 1 :**
- [ ] `units/dlp/` créé, build Docker OK
- [ ] Migrations exécutées sans erreur
- [ ] Health/ready répondent 200

---

## Phase 2 — API CRUD DLP + mapping

**Objectif :** Exposer les APIs de création/gestion des DLP, perimeters, companies, et project_perimeter_map.

### 2.1 Companies

- `GET /api/v1/companies?tenant=...` — liste companies (peut être alimenté depuis Vault ou config)
- `POST /api/v1/companies` — création compte (si registre dédié)

### 2.2 Business Perimeters

- `GET /api/v1/perimeters?tenant=...` — liste
- `POST /api/v1/perimeters` — création (name, company_id, sort_order)
- `PATCH /api/v1/perimeters/:id` — modification

### 2.3 DLP

- `GET /api/v1/dlps?tenant=...&status=active` — liste
- `POST /api/v1/dlps` — création (title, intention, hypothesis, scope_companies, scope_perimeters)
- `PATCH /api/v1/dlps/:id` — modification, archivage
- `GET /api/v1/dlps/:id` — détail

### 2.4 project_perimeter_map

- `GET /api/v1/project-perimeter-map?tenant=...&source_system=...` — liste
- `POST /api/v1/project-perimeter-map` — création/upsert (tenant_id, source_system, project_external_id, business_perimeter_id)
- `DELETE /api/v1/project-perimeter-map/:id` — suppression

**DoD Phase 2 :**
- [ ] CRUD DLP opérationnel
- [ ] CRUD perimeters opérationnel
- [ ] Mapping projet → périmètre configurable
- [ ] Auth tenant (header ou token) — à définir selon stack existante

---

## Phase 3 — API timesheet.validated + hits

**Objectif :** Recevoir les événements de validation timesheet, résoudre le mapping, insérer les hits de manière idempotente.

### 3.1 Route `POST /api/v1/timesheet-validated`

**Payload attendu (exemple) :**

```json
{
  "tenant_id": "uuid",
  "source_system": "odoo",
  "company_id": "uuid ou external_id",
  "project_external_id": "123",
  "time_entry_external_id": "456",
  "hit_at": "2026-02-23T10:00:00Z"
}
```

### 3.2 Logique

1. Valider tenant, company_id, project_external_id, time_entry_external_id
2. Résoudre `business_perimeter_id` via `project_perimeter_map`
3. Si mapping absent → 202 Accepted + log "mapping_missing" (P0 : pas d'erreur bloquante, cf. Plan de tests T4.3)
4. Trouver DLP actives dont scope_companies ∋ company ET scope_perimeters ∋ perimeter
5. Pour chaque DLP : INSERT hit (ON CONFLICT DO NOTHING — idempotence)
6. Incrémenter hit_count sur DLP, BusinessPerimeter, Company

**DoD Phase 3 :**
- [ ] Route timesheet-validated accepte le payload
- [ ] Hit inséré si mapping existe et DLP match
- [ ] Idempotence : rejeu même payload → 1 seul hit
- [ ] hit_count cohérent

---

## Phase 4 — API energy-summary

**Objectif :** `GET /api/v1/dlp/energy-summary` pour alimenter la card Linky.

### 4.1 Route

```
GET /api/v1/dlp/energy-summary?tenant=...&period_days=90&company_id=... (optionnel)
```

### 4.2 Réponse

```json
{
  "dlp_active_count": 5,
  "hits_total": 142,
  "period_days": 90,
  "by_perimeter": [
    { "perimeter_id": "...", "perimeter_name": "Finance", "company_id": "...", "hits": 44, "pct": 31 }
  ],
  "by_company": [
    { "company_id": "...", "company_name": "Société A", "hits": 89, "pct": 63 }
  ]
}
```

### 4.3 Logique

- Filtrer hits par `hit_at` sur `period_days` glissante (now - period_days)
- Filtrer par tenant, optionnellement company_id
- Agrégater par perimeter, par company
- Calculer pourcentages

**DoD Phase 4 :**
- [ ] energy-summary retourne structure conforme
- [ ] Filtres tenant, period_days, company_id fonctionnent
- [ ] Tri by_perimeter par sort_order puis hits décroissant

---

## Phase 5 — Linky (interface création + card)

**Objectif :** Interface de création DLP, gestion perimeters, configuration mapping + card "Énergie stratégique".

### 5.1 Interface création (écriture)

| Composant | Rôle |
|-----------|------|
| Page /dlp ou section Admin | Liste DLP, bouton "Nouvelle DLP" |
| Formulaire DLP | title, intention, hypothesis, scope_companies (multi), scope_perimeters (multi), status |
| Gestion perimeters | Liste, création (name, company, sort_order) |
| Configuration mapping | Liste project_external_id → perimeter, ajout/modification |

**API Linky :** routes proxy vers service DLP (`/api/dlp/dlps`, `/api/dlp/perimeters`, `/api/dlp/project-perimeter-map`).

### 5.2 Card "Énergie stratégique" (lecture)

| Élément | Détail |
|---------|--------|
| Tuile IconGrid | 9ème tuile `strategic_energy`, label "Énergie stratégique" |
| StrategicEnergyCard | Répartition % by_perimeter, by_company, DLP actives, hits totaux |
| Disclaimer | Texte spec §6 |
| API route | `GET /api/dlp/energy-summary` → proxy vers service DLP |

### 5.3 Placement

- Intégration dans `DashboardWithFilters` : même pattern que les autres cards (focusedCardId = "strategic_energy")
- Icône dédiée (`IconStrategicEnergy`)

**DoD Phase 5 :**
- [ ] Création DLP possible depuis Linky
- [ ] Création perimeters possible
- [ ] Configuration mapping projet → périmètre possible
- [ ] Card affiche données energy-summary
- [ ] Disclaimer visible

---

## Phase 6 — Odoo dorevia_dlp_connector

**Objectif :** Module Odoo qui envoie un événement au service DLP lors de la validation d'une ligne de timesheet.

### 6.1 Module

- Nom : `dorevia_dlp_connector`
- Dépendances : `project`, `hr_timesheet` (ou équivalent)
- Modèle étendu : `account.analytic.line` (timesheet)

### 6.2 Déclencheur

- Hook : `write` ou `create` sur `account.analytic.line` quand une ligne passe en état "validé" (ou équivalent selon workflow)
- Alternative : signal/cron si pas de hook direct — à adapter au workflow Odoo timesheet

### 6.3 Payload envoyé

- tenant_id (config ir.config_parameter)
- source_system = "odoo"
- company_id (depuis company de la ligne)
- project_external_id (project.project.id)
- time_entry_external_id (account.analytic.line.id)
- hit_at = now()

### 6.4 Configuration Odoo

- `dorevia.dlp.service.url` — URL du service DLP
- `dorevia.dlp.tenant.id` — tenant UUID ou slug
- Token/auth si requis

**DoD Phase 6 :**
- [ ] Validation timesheet → POST vers service DLP
- [ ] En cas d'erreur : log, retry optionnel (à définir)
- [ ] Pas de blocage du workflow Odoo (async préférable)

---

## Phase 7 — E2E + documentation

**Objectif :** Valider le flux complet et documenter le déploiement.

### 7.1 Scénario E2E

1. Créer un perimeter "Test" dans Linky
2. Créer une DLP active, scope = company + perimeter "Test"
3. Configurer mapping : project Odoo X → perimeter "Test"
4. Valider une timesheet sur le projet X dans Odoo
5. Vérifier : hit dans la table hits, energy-summary mis à jour
6. Ouvrir Linky, card "Énergie stratégique" : 1 hit, 100 % sur "Test"

### 7.2 Documentation

- Runbook déploiement service DLP
- Checklist activation pour un nouveau tenant
- Prérequis Odoo (modules, config)

**DoD Phase 7 :**
- [x] Scénario E2E passe
- [x] Runbook rédigé
- [x] Checklist tenant disponible

---

## Phase 8 — Refonte UX (séparation Admin / Gouvernance)

**Objectif :** Séparer parcours gouvernance (cockpit, champ unique « Nouvelle décision ») et parcours admin (paramétrage technique). Référence : `SPEC_DLP_UX_v0.1.md`.

### 8.1 Monde Admin

| Tâche | Action | Vérification |
|-------|--------|---------------|
| 8.1 | Créer la route `/admin/dlp-config` | Page accessible |
| 8.2 | Déplacer le contenu de `/dlp` vers `/admin/dlp-config` (Sociétés, Périmètres, Mapping uniquement — pas de création DLP) | CRUD paramétrage fonctionnel |
| 8.3 | Rediriger `/dlp` vers `/admin/dlp-config` | Liens existants compatibles |
| 8.4 | Ajouter l’entrée « Paramétrage des décisions » dans le menu burger (Administration ou Paramètres) | Visible dans le menu |
| 8.5 | Restreindre la visibilité à l’admin (lien masqué si non-admin ; 403 ou redirection si accès direct) | Non-admin : pas de lien, accès /admin/dlp-config bloqué |

### 8.2 Monde Gouvernance (cockpit)

| Tâche | Action | Vérification |
|-------|--------|---------------|
| 8.6 | Créer le composant « Nouvelle décision » (champ texte unique + micro-texte + Enregistrer) | Affichage correct |
| 8.7 | Créer le composant « Décisions actives » (liste lecture seule des DLP actives) | Liste affichée |
| 8.8 | Intégrer les deux blocs dans `DashboardWithFilters` juste après DivaFlashBlock (vue « all ») | Positionnement correct |
| 8.9 | Adapter ou créer une route API pour création simplifiée : message unique → title (80 car.), intention, hypothesis=NULL, scope=Option A | DLP créée avec bons champs |
| 8.10 | Implémenter le garde-fou : si aucune société ou périmètre → refus + message « Le paramétrage initial n'est pas configuré. Contactez un administrateur. » | Message affiché, DLP non créée |

### 8.3 Backend DLP

| Tâche | Action | Vérification |
|-------|--------|---------------|
| 8.11 | Accepter `hypothesis` NULL dans la création DLP (adapter le modèle/API si nécessaire) | Création sans hypothesis OK |

### 8.4 Carte Énergie stratégique

| Tâche | Action | Vérification |
|-------|--------|---------------|
| 8.12 | Supprimer le lien « Gérer les DLP » dans StrategicEnergyCard | Lien absent |
| 8.13 | Remplacer « DLP actives » par « X décisions » (ex. : 3 décisions) | Libellé conforme |
| 8.14 | Vérifier que le terme « DLP » n’apparaît pas dans le bloc gouvernance | Revue UX |

### 8.5 Vocabulaire

- Utiliser « Décision », « Décisions actives », « Nouvelle décision » côté utilisateur.
- Le terme « DLP » reste interne/technique.

**DoD Phase 8 :**
- [ ] `/admin/dlp-config` accessible, paramétrage opérationnel
- [ ] Bloc « Nouvelle décision + Décisions actives » visible après Diva dans le cockpit
- [ ] Création d’une décision via champ unique fonctionne (scope Option A)
- [ ] Garde-fou sociétés/périmètres vides opérationnel
- [ ] Accès paramétrage via menu burger (admins uniquement)
- [ ] Carte affiche « X décisions », lien « Gérer les DLP » supprimé
- [ ] Critères A1–A8 de SPEC_DLP_UX_v0.1 §10 validés

---

## Annexes

### A. Risques et parades

| Risque | Parade |
|--------|--------|
| Odoo timesheet workflow différent selon version | Vérifier workflow en Phase 0 ; adapter hook Phase 6 |
| Auth service DLP | Réutiliser pattern DVIG (token YAML) ou API key |
| Multi-tenant Linky (auth user) | P0 : tenant fixe (cookie/header) ; P1 : auth utilisateur |

### B. Références

- SPEC modèle : `ZeDocs/web31/SPEC_DLP_v0.3.md`
- SPEC UX : `ZeDocs/web31/SPEC_DLP_UX_v0.1.md`
- Note de design : `ZeDocs/web31/NOTE_DESIGN_DLP_UX_v0.1.md`
- Avis expert : `ZeDocs/web31/AVIS_EXPERT_SPEC_DLP_v0.1.md`
- Architecture Dorevia : `ZeDocs/web22/VISION_TECHNIQUE_DOREVIA_v1.0.md`

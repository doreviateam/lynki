# SPEC — DLP (Decision Link Performance) v0.3

**Date** : 2026-02-23  
**Statut** : P0 — Implémentable  
**Positionnement** : Acte formalisé de gouvernance dans Linky

---

## Décisions P0 actées (intégrées)

| Décision | Choix | Justification |
|----------|-------|---------------|
| **D1** Mapping Projet ERP ↔ BusinessPerimeter | Option B : table de mapping | ERP-agnostic, pas de modification Odoo, branchable ERPNext demain |
| **D2** Origine des BusinessPerimeters | Créés dans Linky (service DLP) | Objet de gouvernance, pas copie ERP |
| **D3** Association DLP ↔ Projet | Lien indirect via périmètre | Simple, maintenable, pas de micro-config projet par projet |

---

## 1. Vision

La DLP structure les décisions stratégiques à partir de la lecture des données consolidées dans Linky.

Elle ne mesure pas la performance.  
Elle mesure l'orientation réelle de l'énergie organisationnelle sur un périmètre économique défini.

**La DLP est créée exclusivement dans Linky.**

---

## 2. Principes structurants

- Une DLP appartient à un tenant.
- Une DLP est rattachée à un ou plusieurs périmètres métier.
- Une DLP peut cibler une ou plusieurs sociétés.
- Une DLP n'existe pas dans l'ERP.
- Une DLP n'est pas un objet CRM.
- Une DLP n'est pas un projet.

**C'est un acte de gouvernance.**

---

## 3. Définition d'une DLP

### 3.1 Structure

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| id | UUID | Oui | Identifiant unique |
| title | string | Oui | Intitulé court |
| intention | text | Oui | Objectif stratégique |
| hypothesis | text | Oui | Hypothèse d'impact mesurable |
| tenant_id | UUID | Oui | Périmètre global |
| scope_companies | M2M Company | Oui | Sociétés concernées |
| scope_perimeters | M2M BusinessPerimeter | Oui | Périmètres métier ciblés |
| created_at | datetime | Oui | Date de création |
| created_by | user_id | Oui | Décisionnaire |
| status | enum(active, archived) | Oui | État |
| hit_count | integer | Oui | Compteur d'activation |
| archived_at | datetime | Non | Date d'archivage si status = archived |
| snapshot_id | UUID | Non | Référence snapshot Vault (P1, corrélation KPI↔DLP) — non utilisé en P0 |

---

## 4. Business Perimeter

Les périmètres métier structurent l'organisation économique.

Exemples : Retail, Export, Production, Finance, Structuration, Filiale ERPNext.

### Structure BusinessPerimeter

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant |
| name | string | Nom |
| company_id | FK Company | Rattachement société |
| hit_count | integer | Hits cumulés |
| sort_order | integer | Ordre d'affichage dans la card (défaut 0) |

Les périmètres ne sont pas décoratifs. Ils définissent un cadre opérationnel mesurable.

---

## 5. Le Hit

### 5.1 Déclencheur P0

Un hit est généré lorsque :

**1 déclaration validée + 1 DLP associée = 1 hit**

**Conditions :**

- La déclaration doit appartenir à une société incluse dans `scope_companies`
- Le projet doit appartenir à un périmètre métier inclus dans `scope_perimeters`

### 5.2 Effets

- `DLP.hit_count` += 1
- `BusinessPerimeter.hit_count` += 1
- `Company.hit_count` += 1

Les heures ne sont jamais exposées.

### 5.3 Table hits (modèle technique)

| Champ | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| tenant_id | UUID | Scope |
| dlp_id | UUID | FK |
| company_id | UUID | FK (celle du time entry) |
| business_perimeter_id | UUID | FK (résolu via mapping projet) |
| source_system | string | ex. `odoo` |
| time_entry_external_id | string | ID dans l'ERP |
| hit_at | datetime | Date effective |

**Contrainte unique** : `UNIQUE(tenant_id, dlp_id, source_system, time_entry_external_id)` — suffit pour l'idempotence, pas de champ dérivé.

**Note** : `hit_count` sur DLP, BusinessPerimeter et Company sont des données dérivées. En P0 on les incrémente. Plus tard : recalcul à la volée ou trigger transactionnel (à évaluer).

**Période** : paramètre `period_days` (30/60/90), défaut 90.

### 5.4 Table project_perimeter_map (mapping D1 — Option B)

| Champ | Type | Raison |
|-------|------|--------|
| tenant_id | UUID | Scope |
| source_system | string | |
| project_external_id | string | |
| business_perimeter_id | UUID | |
| created_at | datetime | Audit minimal |
| updated_at | datetime | Traçabilité config |

**Contrainte unique** : `UNIQUE(tenant_id, source_system, project_external_id)`

**Règle** : `(tenant_id, source_system, project_external_id)` → `business_perimeter_id`

> Le mapping est un point stratégique. `created_at` et `updated_at` assurent un minimum d'audit pour la traçabilité de la configuration.

---

## 6. Card "Énergie stratégique"

### Affiche

- Répartition relative (%) des hits par périmètre métier
- Répartition par société
- Nombre de DLP actives
- Hits totaux période glissante

### N'affiche pas

- Heures
- Individus
- Performance

### Disclaimer (affichage obligatoire)

> Répartition de l'énergie organisationnelle (allocation de temps validé), pas une mesure de performance individuelle. Les heures ne sont jamais exposées.

---

## 7. Gouvernance

- **Création** : Exclusivement dans Linky, décisionnaires uniquement
- **Activation** : Via association DLP ↔ Projet (lien indirect via périmètre)
- **Interprétation** : Humaine. DIVA peut produire une synthèse descriptive (non prescriptive)

---

## 8. Architecture

### 8.1 Logique

```
ERP (multi-sources)
    → Projets
    → DLP (créée dans Linky)
    → Hit
    → Périmètre métier
    → Société
    → Card Énergie stratégique
```

### 8.2 Flux P0

1. **Linky** : Création DLP + perimeters + companies + configuration mapping `project_external_id` → `perimeter`
2. **Odoo** valide une timesheet → `dorevia_dlp_connector` → `POST` au service DLP (`timesheet.validated`)
3. **Service DLP** :
   - Vérifie tenant + company
   - Lit `project_external_id`
   - Résout `business_perimeter_id` via table `project_perimeter_map`
   - Trouve les DLP actives dont `scope_companies` contient company ET `scope_perimeters` contient perimeter
   - Insère hits (idempotent via contrainte unique)
4. **Linky** lit `GET /api/dlp/energy-summary`

---

## 9. Multi-sources & Consolidation

Une DLP peut :

- Cibler plusieurs sociétés
- S'appliquer à des données issues de plusieurs ERP
- Être analysée dans une vue consolidée groupe

La consolidation respecte : le tenant, le périmètre juridique, le scope explicitement défini.

---

## 10. Hors Scope P0

- Pondération par durée
- Hiérarchie DLP Groupe → DLP Locale
- Corrélations KPI automatiques
- Scoring prédictif
- IA décisionnelle
- Automatisation déclenchement DLP

---

## 11. Intégration Dorevia

| Couche | Rôle |
|--------|------|
| Vault | Vérité financière scellée |
| Linky | Lecture consolidée & **création DLP** |
| DLP | Acte structuré de gouvernance |
| DIVA | Lecture interprétative |

---

## 12. Évolution future (P1+)

- Versioning des DLP
- Timeline d'activation
- Corrélation KPI ↔ DLP (optionnelle)
- DLP Groupe / DLP Locale hiérarchique
- Déclenchement assisté par signal (ex. : non-réconciliation détectée)

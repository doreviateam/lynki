# Avis expert — SPEC DLP v0.1 / v0.2 / v0.2.1

**Date** : 2026-02-23  
**Documents analysés** : `SPEC_DLP_v0.1_detaillee.md`, `SPEC_DLP_v0.2.md` (addendum v0.2.1)  
**Contexte** : Intégration DLP dans la plateforme Dorevia (Linky, DIVA, Vault)

---

## 1. Synthèse de l'avis

La spec DLP **v0.2.1** intègre les décisions P0 actées et consolide les retours sur v0.1 et clarifie l’architecture : **création DLP exclusivement dans Linky**, `tenant_id`, `scope_companies`, `scope_perimeters`, BusinessPerimeter (remplaçant Tags), multi-sources.

**Statut** : La plupart des amendements v0.1 sont intégrés ou dépassés par la v0.2.1. Il reste **trois points d’architecture** à préciser avant le dev.


---

## 2. Décisions P0 actées (v0.2.1)

| Décision | Choix | Justification |
|----------|-------|---------------|
| **D1** Mapping Projet ERP ↔ BusinessPerimeter | **Option B** : table `project_perimeter_map` | ERP-agnostic, pas de modification Odoo, branchable ERPNext demain |
| **D2** Origine des BusinessPerimeters | **Créés dans Linky** (service DLP) | Objet de gouvernance, pas copie ERP |
| **D3** Association DLP ↔ Projet | **Lien indirect via périmètre** | Simple, maintenable, pas de micro-config projet par projet |

## 2bis. Bilan v0.1 → v0.2.1

| Amendement v0.1 | Statut v0.2.1 |
|-----------------|---------------|
| `tenant`, `scope_companies`, `scope_perimeters` | ✅ Intégré |
| `snapshot_id`, `archived_at` | ✅ Intégré (champs optionnels) |
| `sort_order` sur BusinessPerimeter | ✅ Intégré |
| Table hits + `hit_at` + idempotence | ✅ Intégré (contrainte unique) |
| Table project_perimeter_map | ✅ Intégré (D1 Option B) |
| Disclaimer card | ✅ Intégré |
| Flux P0 détaillé | ✅ Intégré |

---

## 3. Points forts de la spec v0.2

| Élément | Appréciation |
|---------|--------------|
| **Principes structurants** | DLP ≠ ERP, ≠ CRM, ≠ projet — positionnement clair |
| **Création dans Linky** | Cohérent avec "acte de gouvernance", pas de dépendance ERP pour la définition |
| **Scope** | `scope_companies` + `scope_perimeters` — filtrage explicite |
| **BusinessPerimeter** | Périmètre métier rattaché à une société, opérationnel |
| **Multi-sources** | Prévu pour plusieurs ERP et consolidation groupe |
| **Card** | Répartition par périmètre + par société + DLP actives + hits totaux |
| **DIVA** | Synthèse descriptive, non prescriptive — aligné avec la vision existante |

---

## 4. Amendements proposés (compléments v0.2)

### 4.1 Structure DLP — champs optionnels

| Champ | Type | Description |
|-------|------|-------------|
| `snapshot_id` | UUID | Référence optionnelle à un snapshot Vault — corrélation KPI ↔ DLP (P1) |
| `archived_at` | datetime | Date d’archivage si status = archived |

---

### 4.2 BusinessPerimeter — ordre d’affichage

| Champ | Type | Description |
|-------|------|-------------|
| `sort_order` | integer | Ordre d’affichage dans la card (ex. 0, 1, 2…) |

---

### 4.3 Hit — précisions techniques

- **Période glissante** : Fenêtre paramétrable (30, 60, 90 j) avec 90 j par défaut.
- **Table hits** : Chaque hit stocke `hit_at` (datetime) pour filtrage par période.
- **Idempotence** : Clé unique `(time_entry_id, dlp_id)` pour éviter doublons si rejouer une validation.

---

### 4.4 Card "Énergie stratégique" — disclaimer

> La card affiche la **répartition de l’énergie organisationnelle** (où le temps validé a été alloué), pas une mesure de performance individuelle. Les heures ne sont jamais exposées.

---

## 5. Questions à trancher

### 5.1 Mapping Projet ERP ↔ BusinessPerimeter

La v0.2 impose : *"Le projet doit appartenir à un périmètre métier inclus dans scope_perimeters"*.

**Question** : Où est défini le lien Projet (ERP) ↔ BusinessPerimeter (registre DLP) ?

- **Option A** : Champ custom sur `project.project` (ex. `business_perimeter_id` ou `dorevia_perimeter_id`) — le projet référence un UUID du registre DLP.
- **Option B** : Table de mapping dans le registre DLP (ex. `project_external_id` + `source` + `perimeter_id`) — configuration côté Linky/registre.
- **Option C** : Réutilisation d’un objet ERP existant (compte analytique, catégorie projet, tag) — le connecteur mappe cet objet vers un BusinessPerimeter.

**Recommandation** : Option A ou B. Option A = simple si l’ERP accepte un champ custom. Option B = plus flexible pour multi-ERP sans modifier les schémas ERP.

---

### 5.2 Origine des BusinessPerimeters

**Question** : Où sont créés les périmètres (Retail, Export, Finance…) ?

- **Linky uniquement** : Création dans une interface Linky (gestion des périmètres).
- **ERP** : Déjà présents (ex. catégories projet, comptes analytiques) et synchronisés vers le registre DLP.

**Recommandation** : Création dans Linky pour P0 — cohérent avec "DLP créée exclusivement dans Linky". Les BusinessPerimeters sont des objets de gouvernance, pas des copies ERP.

---

### 5.3 Association DLP ↔ Projet pour l’activation

La v0.2 : *"Activation : Via association DLP ↔ Projet"*.

Avec `scope_perimeters` : un projet est lié à un BusinessPerimeter ; une DLP a `scope_perimeters`. Donc :

- **Lien indirect** : Projet ∈ Périmètre P, DLP scope_perimeters contient P → hit si société OK.
- **Lien direct** : Association explicite DLP ↔ Projet (table `dlp_project` ou champ sur projet).

**Question** : L’indirection via périmètre suffit-elle, ou faut-il une association explicite DLP ↔ Projet ?

**Recommandation** : Pour P0, **lien indirect** via périmètre. Une DLP cible des périmètres ; tout projet rattaché à l’un de ces périmètres (dans `scope_perimeters`) et dont la société est dans `scope_companies` génère un hit. Plus simple à opérer et à maintenir.

---

### 5.4 Source Time Entry — quel ERP pour P0 ?

**Recommandation** : Odoo + `project` + `hr_timesheet` comme cible P0. Documenter les prérequis et le flux de validation.

---

### 5.5 Déclencheur technique du hit

**Recommandation** : Module Odoo `dorevia_dlp_connector` qui envoie les événements `timesheet.validated` vers le service DLP — aligné avec `dorevia_vault_connector` → DVIG.

---

## 6. Intégration Linky — vision détaillée (mise à jour v0.2)

### 6.1 Création DLP dans Linky

Linky doit proposer une **interface de création / gestion des DLP** :

- Formulaire : title, intention, hypothesis, scope_companies, scope_perimeters, status.
- Liste des DLP actives / archivées.
- Gestion des BusinessPerimeters (création, rattachement société, ordre).

Cette interface est **en plus** de la card "Énergie stratégique" (lecture seule).

---

### 6.2 Card "Énergie stratégique"

Composant `StrategicEnergyCard.tsx` affichant :

- Répartition % par **périmètre métier** (ex‑Tags)
- **Répartition par société**
- Nombre de DLP actives
- Hits totaux sur période glissante

**Données** : `GET /api/dlp/energy-summary` → registre DLP.

---

### 6.3 API energy-summary (structure v0.2)

```
GET /api/dlp/energy-summary?tenant=...&period_days=90&company_id=... (optionnel)
```

Réponse type :

```json
{
  "dlp_active_count": 5,
  "hits_total": 142,
  "period_days": 90,
  "by_perimeter": [
    { "perimeter_id": "...", "perimeter_name": "Finance", "company_id": "...", "hits": 44, "pct": 31 },
    { "perimeter_id": "...", "perimeter_name": "Export", "company_id": "...", "hits": 38, "pct": 27 }
  ],
  "by_company": [
    { "company_id": "...", "company_name": "Société A", "hits": 89, "pct": 63 },
    { "company_id": "...", "company_name": "Société B", "hits": 53, "pct": 37 }
  ]
}
```

---

### 6.4 Tuile IconGrid

9ème tuile : `{ id: "strategic_energy", label: "Énergie stratégique", Icon: IconStrategicEnergy }`.

---

### 6.5 DLP vs Vault

| Aspect | Vault | DLP |
|--------|-------|-----|
| Source | Factures, paiements, POS | Time entries (ERP) |
| Scellement | Oui | Non |
| Lecture Linky | Via Vault | Via registre DLP |
| **Création** | — | **Dans Linky** |
| Badge intégrité | Oui | Non applicable |

---

## 7. Architecture proposée (alignée v0.2)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Linky                                                                           │
│  - Création DLP, BusinessPerimeters, scope_companies, scope_perimeters           │
│  - Card "Énergie stratégique" (lecture)                                            │
└───────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ Données DLP déjà en registre
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Registre DLP (Service DLP — units/dlp/)                                         │
│  - Tables : dlp, business_perimeter, company, hits                               │
│  - Mapping : table project_perimeter_map (tenant_id, source_system, project_external_id → business_perimeter_id)           │
│  - API : energy-summary, CRUD DLP (appelé par Linky)                             │
└───────────────────────────────┬─────────────────────────────────────────────────┘
                                ▲
                                │ POST timesheet-validated
                                │
┌───────────────────────────────┴─────────────────────────────────────────────────┐
│  Odoo (project, hr_timesheet)                                                    │
│  - Validation timesheet → dorevia_dlp_connector                                   │
│  - Projet mappé via project_perimeter_map (config Linky)                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Plan d'implémentation suggéré

1. **Créer** le service DLP (tables, API energy-summary, API CRUD DLP).
3. **Développer** l’interface Linky : création/gestion DLP et BusinessPerimeters.
4. **Développer** le module Odoo `dorevia_dlp_connector` (écoute validation timesheet).
5. **Ajouter** dans Linky : tuile IconGrid, StrategicEnergyCard, API route `/api/dlp/energy-summary`.
6. **Tester** E2E : création DLP dans Linky → mapping projet ↔ périmètre → validation timesheet → hit → affichage dans la card.

---

## 9. Résumé — spec v0.2.1 implémentable

Toutes les décisions P0 sont actées. Le modèle technique (tables hits, project_perimeter_map) et le flux P0 sont définis. Aucun amendement en attente.

---

**Document rédigé par** : Avis expert technique  
**Dernière mise à jour** : 2026-02-23 (aligné SPEC DLP v0.2.1 — décisions P0 actées)

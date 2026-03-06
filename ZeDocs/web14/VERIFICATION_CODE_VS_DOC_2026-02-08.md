# Vérification code vs documentation (2026-02-08)

**Objectif** : Comparer le code actuel (Linky + Vault) à la documentation sans modifier le code. Mise à jour de la doc pour refléter l’état réel.

---

## 1. Résumé du code actuel

### 1.1 Linky — Filtre Période

| Élément | Code actuel |
|--------|--------------|
| **UX** | **Deux champs uniquement** : (1) select Mois / Trimestre / Semaine, (2) select Année. Pas de preset « Toutes périodes », pas de période personnalisée (date pickers) dans l’en-tête. |
| **Options 1er champ** | `PERIOD_OPTIONS` : Janvier…Décembre (1–12), Trimestre 1–4 (T1–T4), Semaine 1–53 (S1–S53). |
| **2e champ** | Année : année courante + 5 années passées (`getAvailableYears(5)`). |
| **Défaut** | **Mois en cours / Année en cours** (`getDefaultPeriod()` = 1er–dernier jour du mois civil). |
| **Fichiers** | `app/lib/period-utils.ts` (PERIOD_OPTIONS, getAvailableYears, getPeriodFromKeyAndYear, getKeyAndYearFromPeriod), `components/ReportHeader.tsx` (deux `<select>`). |

Les helpers `getPresetPeriod`, `PRESET_LABELS`, `DEFAULT_PERIOD` et `formatPeriodLabel` existent encore dans `period-utils.ts` et sont utilisés ailleurs (cartes pour le libellé « Toutes périodes », API routes pour la plage large), mais **ne sont plus utilisés dans ReportHeader** pour la sélection.

### 1.2 Linky — Filtre Company

| Élément | Code actuel |
|--------|--------------|
| **Sélecteur** | « Tout » + une option par company ; défaut = « Tout » (`selectedCompanyId === null`). |
| **Affichage libellé** | `c.display_name ?? c.company_id` — donc **display_name** quand disponible (enrichissement côté API). |
| **Enrichissement** | GET /api/companies lit `COMPANY_DISPLAY_NAMES` (env, JSON `{"company_id": "Libellé"}`) et renvoie `display_name` dans chaque item. |
| **Timeout** | 5 s (COMPANIES_TIMEOUT_MS), fallback `[]` en erreur/timeout. |
| **Invariant de session** | `selectedCompanyId` dans DashboardWithFilters, passé à ReportHeader et aux cartes ; tous les appels sales/purchases (et polling) reçoivent le même `companyId`. |

### 1.3 Vault

| Élément | Code actuel |
|--------|--------------|
| **Point d’entrée** | `sources/vault/cmd/vault/main.go` **existe** dans ce dépôt. |
| **Route GET /ui/companies** | Enregistrée : `app.Get("/ui/companies", handlers.CompaniesHandler(db))`. |
| **Handler** | `internal/handlers/companies.go` — CompaniesHandler(db), liste triée par company_id. |

---

## 2. Écarts documentation → code (à corriger dans la doc)

### 2.1 PLAN_IMPLEMENTATION_FILTRES_LINKY_SCRUM.md

- **US-2.1 — Valeur par défaut**  
  - Doc : « Valeur par défaut : **Toutes périodes** (plage large type 2000-01-01 / 2030-12-31). »  
  - Code : Défaut = **Mois en cours / Année en cours** (getDefaultPeriod()).  
  - **Action** : Remplacer par « Valeur par défaut : **Mois en cours / Année en cours**. »

- **US-2.1 — Affichage période**  
  - Doc : « La période effective est affichée en en-tête (ex. « Toutes périodes » ou « 01/01/2026 – 31/12/2026 »). »  
  - Code : La période n’est pas affichée comme libellé séparé en en-tête ; elle est **implicite** via les deux selects (Mois/Trimestre/Semaine + Année). Les cartes affichent en revanche un libellé de période (formatPeriodLabel ou « Toutes périodes »).  
  - **Action** : Préciser que l’en-tête affiche la période via les deux listes déroulantes (Mois/Trimestre/Semaine + Année), et que le libellé explicite (ex. « 01/01/2026 – 31/12/2026 ») est affiché dans les cartes.

- **US-2.2 — Presets et période personnalisée**  
  - Doc : « Presets disponibles : Toutes périodes, Mois en cours, Trimestre en cours, Année en cours (YTD), Année précédente » et « Option « Période personnalisée » : sélection date de début + date de fin ».  
  - Code : Plus de presets ni de période personnalisée dans l’UI ; uniquement **Mois (1–12) / Trimestre (T1–T4) / Semaine (S1–S53) + Année**.  
  - **Action** : Remplacer la description par : « Sélection via deux champs : (1) Mois, Trimestre ou Semaine (ISO), (2) Année. Pas de preset « Toutes périodes » ni de période personnalisée en v1. »

- **US-2.2 — Tâches techniques**  
  - Adapter la phrase sur « dropdown ou boutons presets + option Personnalisée avec deux date pickers » pour refléter les deux selects (Mois/Trimestre/Semaine + Année).

### 2.2 RESUME_FILTRE_COMPANY_LINKY_VAULT.md

- **§2.1 US-V1 — Tâches techniques**  
  - Doc : « Le répertoire `cmd/vault` est absent de ce dépôt » et « Fichier à créer/modifier : point d’entrée du binaire Vault (ex. `cmd/vault/main.go` ou équivalent dans un autre dépôt). »  
  - Code : `sources/vault/cmd/vault/main.go` existe et enregistre déjà GET /ui/companies.  
  - **Action** : Remplacer par : « Le point d’entrée est `sources/vault/cmd/vault/main.go` ; la route GET /ui/companies y est enregistrée. »

### 2.3 SPEC_VAULT_LINKY_COMPANY / Plan — Affichage Company

- **Doc** (plan ou spec) : « Affichage v1 : company_id brut dans le sélecteur ».  
  - Code : Le sélecteur affiche **display_name** quand présent (env COMPANY_DISPLAY_NAMES), sinon **company_id**.  
  - **Action** : Préciser en doc : « Affichage : display_name si fourni (ex. via COMPANY_DISPLAY_NAMES), sinon company_id. »

---

## 3. Documentation déjà alignée (à ne pas modifier)

- **BROUILLON_UX_PERIODE_ANNEE_LINKY.md** : Cohérent avec le code (2 champs, Mois/Trimestre/Semaine + Année, défaut Mois en cours / Année en cours, fichiers period-utils.ts et ReportHeader.tsx).
- **RESUME_FILTRE_COMPANY_LINKY_VAULT.md** : §1 (ce qui a été fait) et statut US-V1 « Livré » sont corrects ; seules les tâches techniques de §2.1 étaient obsolètes (correction ci-dessus).
- **Vault** : main.go, handlers, storage, agrégations avec company_id — conformes à la description « livré » dans la doc.

---

## 4. Modifications recommandées (uniquement documentation)

1. **PLAN_IMPLEMENTATION_FILTRES_LINKY_SCRUM.md** : Mettre à jour US-2.1 et US-2.2 comme en §2.1 ci-dessus (défaut période, affichage période, presets remplacés par les 2 selects).
2. **RESUME_FILTRE_COMPANY_LINKY_VAULT.md** : Corriger la phrase sur l’absence de `cmd/vault` et le point d’entrée (§2.2).
3. **Spec Company / Plan** : Ajouter ou préciser que l’affichage Company utilise display_name si disponible, sinon company_id (§2.3).

Aucune modification du code n’a été effectuée ; seules les incohérences identifiées entre code et documentation sont listées pour mise à jour des documents.

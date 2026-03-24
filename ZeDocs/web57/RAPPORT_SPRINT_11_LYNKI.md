# Rapport Sprint 11 — Lynki (Phase 2)

**Fichier canonique :** `RAPPORT_SPRINT_11_LYNKI.md`  
**Version :** 1.1 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** livré

**Références :**  
[PLAN_SPRINT_11_LYNKI.md](PLAN_SPRINT_11_LYNKI.md) **v1.0** · [EXECUTION_TICKETS_SPRINT_11_LYNKI.md](EXECUTION_TICKETS_SPRINT_11_LYNKI.md) **v1.0** · [RAPPORT_SPRINT_10_LYNKI.md](RAPPORT_SPRINT_10_LYNKI.md) **v1.1** · [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) · [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md)

---

## 1. Objectif du sprint

### 1.1 Formulation produit

Le Sprint 11 fait passer Lynki de la **lecture comparative décisionnelle par société** à une **lecture consolidée multi-sociétés**, avec des **comparatifs enrichis** (trimestre, semestre, personnalisé) et une **préparation du netting tiers V2**.

### 1.2 Tickets livrés

| Ticket | Titre | Statut |
|--------|-------|--------|
| T59 | Vault — consolidation multi-sociétés (`company_ids`) | ✅ Livré |
| T60 | Linky UI — sélecteur multi-sociétés + propagation | ✅ Livré |
| T61 | Comparatifs enrichis — trimestre / semestre / personnalisé | ✅ Livré |
| T62 | Exports comparatifs Bilan / CR | ✅ Livré |
| T63 | Migration schéma tiers V2 (`date_maturity`, `full_reconcile_id`, `matching_number`) | ✅ Livré |
| T64 | Connecteur Odoo enrichi — échéance / lettrage | ✅ Livré |
| T65 | Non-régression + doc | ✅ Livré |

---

## 2. Détail des livrables

### T59 — Vault : consolidation multi-sociétés

**Périmètre modifié :**
- `accounting_rubrics.go` : `parseCompanyFilter()` partagé — parse `company_ids` (prioritaire) ou fallback `company_id`, déduplique, trie.
- `accounting_rubrics.go` (storage) : `RubricQuery.CompanyIDs []int32`, `companyFilter()` helper, `sumByPatterns()` avec `ANY($N::int[])`.
- `trial_balance.go` : `trialBalanceAggregationMulti()` avec args dynamiques, `countAccountMoveLinesMulti()`.
- `general_ledger.go` : `effectiveCompanyIDs()`, SQL dynamique avec numbering adaptatif.
- `accounting_restitutions_sprint07.go` : `ClassAggregationQuery.CompanyIDs`, SQL conditionnel.
- Handlers : `TrialBalanceHandler`, `GeneralLedgerHandler`, `BalanceSheetHandler`, `IncomeStatementHandler`, `AgedReceivablesHandler`, `AgedPayablesHandler` + tous les exports.

**Contrat API :**
- `company_ids=1,2,3` → canonique (entiers, dédupliqués, triés)
- `company_id=1` → fallback backward-compatible
- `company_ids` prime si présent
- Absence de filtre → toutes sociétés du tenant

**Consolidation V1 :** somme additive, pas de retraitement inter-sociétés. Limitation documentée.

### T60 — Linky UI : sélecteur multi-sociétés

**Périmètre modifié :**
- `AccountingSummaryView.tsx` : ajout `CompanyOption`, `extractNumericId()`, `buildCompanyIdsParam()`.
- Sélecteur multi-sociétés avec :
  - "Toutes les sociétés" (état explicite, `selectedIds = []`)
  - Sélection multiple par toggle
  - Badge/libellé de périmètre dans le header
- Propagation `company_ids` à tous les blocs (rubriques, classes, BG, balances tiers, exports).
- Routes proxy Linky : toutes mises à jour pour forwarder `company_ids` vers Vault.

**Fichiers proxy mis à jour (10) :** `balance-sheet/rubrics`, `income-statement/rubrics`, `trial-balance`, `aged-receivables`, `aged-payables`, `general-ledger` + 6 routes export.

### T61 — Comparatifs enrichis

**Périmètre modifié :**
- `AccountingSummaryView.tsx` : `PeriodMode` étendu à `"current" | "n-1" | "quarter" | "semester" | "custom"`.
- Helpers : `quarterPeriod()`, `semesterPeriod()`, `shiftYear()`, `periodLabel()`.
- `computePeriod()` enrichi pour supporter les 5 modes.
- Sélecteur de période : 5 options, avec champs date pour le mode personnalisé.
- `enableCompare` activé pour tous les modes sauf `n-1` (pas de double shift).

**Règle N-1 :** comparaison à période équivalente N-1, même durée. Le Vault calcule `previousPeriod` côté serveur.

### T62 — Exports comparatifs Bilan / CR

**Périmètre modifié :**
- `accounting_rubrics_export.go` : handler enrichi pour `compare=n-1`.
- Colonnes comparatives : `rubric_id`, `label`, `section`, `amount_current`, `amount_previous`, `delta`, `delta_percent`, `period_from/to`, `period_previous_from/to`, `referentiel_version`, `coverage`, `complete`, `tenant`, `generated_at`.
- Matching par `rubric_id` (pas par position) — cohérent avec l'UI.
- N-1 absent → colonnes previous/delta vides (pas de faux zéro).
- Filename suffixé `_comparatif` quand `compare=n-1`.
- Routes proxy export Linky : passage du paramètre `compare`.
- `RubricsExportButton` : prop `enableCompare` pour inclure `compare=n-1` dans l'URL d'export.

**Rétrocompatibilité :** export sans `compare` → format identique au Sprint 08.

### T63 — Migration schéma tiers V2

**Migration 049 :** `049_account_move_lines_tiers_v2.sql`
- Colonnes ajoutées : `date_maturity DATE`, `full_reconcile_id INTEGER`, `matching_number TEXT` — toutes `DEFAULT NULL`.
- Index créés : `idx_account_move_lines_tenant_maturity`, `idx_account_move_lines_tenant_reconcile`.
- Idempotente (`ADD COLUMN IF NOT EXISTS`).

**Structs Go :**
- `AccountMoveLine` : ajout `DateMaturity *time.Time`, `FullReconcileID *int`, `MatchingNumber *string`.
- `UpsertAccountMoveLines` : CopyFrom et upsert individuel étendus à 16 colonnes.
- Handler ingest : `AccountMoveLinePayload` enrichi, parsing `date_maturity` (YYYY-MM-DD → time.Time).

**Aucune logique de netting** dans ce sprint — schéma et ingest seulement.

### T64 — Connecteur Odoo enrichi

**Périmètre modifié :**
- `account_move_lines_push.py` : payload enrichi avec :
  - `date_maturity` (si `l.date_maturity` existe et non vide)
  - `full_reconcile_id` (si `l.full_reconcile_id` existe et non vide)
  - `matching_number` (si `l.matching_number` existe et non vide)
- Tolérance `hasattr()` pour compatibilité avec anciennes versions Odoo.
- Aucun champ obligatoire ajouté — les anciennes lignes restent lisibles.

---

## 3. Non-régression

| Vérification | Résultat |
|-------------|----------|
| Build Vault (`go build ./...`) | ✅ OK |
| Build Linky (`next build`) | ✅ OK |
| Surface 4 blocs Synthèse | ✅ Inchangée |
| Drill rubrique → BG → GL | ✅ Préservé |
| Exports existants (non comparatifs) | ✅ Rétrocompatibles |
| Comparatif N/N-1 Sprint 10 | ✅ Inchangé |
| `company_id` single → backward compat | ✅ Fallback fonctionnel |
| Habilitations `/accounting/*` | ✅ Inchangées |

---

## 4. Limitations documentées

| Sujet | Limitation Sprint 11 |
|-------|---------------------|
| Consolidation multi-sociétés | Somme additive V1 — pas d'élimination inter-sociétés |
| Netting tiers V2 | Schéma et connecteur prêts — pas de logique de netting |
| Balances tiers | Toujours V1 (ancienneté basée sur `line_date`, pas `date_maturity`) |
| Mode personnalisé | Livré avec date picker basique — pas de validations avancées |
| Persistance URL multi-sociétés | V1 : absence de `company_ids` = toutes sociétés. L'état UI "Toutes les sociétés" est explicite, même si son encodage URL reste implicite en V1. |

---

## 5. Gates

| Gate | État post-Sprint 11 |
|------|---------------------|
| **Gate A** | ✅ inchangée |
| **Gate B** | ✅ close — inchangée |
| **Gate C** | ✅ **Close (périmètre Phase 2 V1)** — surface Synthèse complète avec consolidation multi-sociétés, comparatifs enrichis, exports comparatifs |
| **Gate D** | ✅ renforcée — schéma tiers V2 et connecteur enrichi prêts pour Sprint 12 |

---

## 6. Fichiers principaux modifiés

### Vault (Go)
- `sources/vault/internal/handlers/accounting_rubrics.go` — `parseCompanyFilter`, multi-company
- `sources/vault/internal/storage/accounting_rubrics.go` — `CompanyIDs`, `companyFilter`, `sumByPatterns`
- `sources/vault/internal/storage/trial_balance.go` — `trialBalanceAggregationMulti`, `countAccountMoveLinesMulti`
- `sources/vault/internal/storage/general_ledger.go` — `effectiveCompanyIDs`, SQL dynamique
- `sources/vault/internal/storage/aged_balance.go` — `CompanyIDs`, SQL dynamique
- `sources/vault/internal/storage/accounting_restitutions_sprint07.go` — `CompanyIDs`
- `sources/vault/internal/storage/account_move_lines.go` — struct enrichie, upsert 16 colonnes
- `sources/vault/internal/handlers/accounting_rubrics_export.go` — export comparatif
- `sources/vault/internal/handlers/account_move_lines_ingest.go` — tiers V2 payload
- `sources/vault/migrations/049_account_move_lines_tiers_v2.sql`

### Linky (Next.js)
- `components/AccountingSummaryView.tsx` — sélecteur multi-sociétés, comparatifs enrichis
- 10 routes proxy `/api/accounting/*` — forwarding `company_ids` et `compare`

### Odoo
- `models/account_move_lines_push.py` — payload enrichi tiers V2

---

## 7. Après ce sprint

**Sprint 12** pourra se concentrer sur :
- **Balances tiers V2** avec `date_maturity` (ancienneté réelle) et `full_reconcile_id` (lettrage)
- **Premiers insights comptables Diva** sur la Synthèse
- **Consolidation avancée** si nécessaire (éliminations inter-sociétés)
- **Rejouabilité formelle** — premiers jalons documentaires et techniques à cadrer en Sprint 12+

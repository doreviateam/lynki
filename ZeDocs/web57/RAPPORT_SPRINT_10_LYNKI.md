# Rapport Sprint 10 — Lynki (Phase 2)

**Fichier canonique :** `RAPPORT_SPRINT_10_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** sprint terminé — enrichissement décisionnel (comparatif N/N-1, SIG, exports tiers)

**Sources :** [PLAN_SPRINT_10_LYNKI.md](PLAN_SPRINT_10_LYNKI.md) **v1.0** · [EXECUTION_TICKETS_SPRINT_10_LYNKI.md](EXECUTION_TICKETS_SPRINT_10_LYNKI.md) **v1.0** · [RAPPORT_SPRINT_09_LYNKI.md](RAPPORT_SPRINT_09_LYNKI.md) **v1.0** · [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) **v1.1**

---

## 1. Synthèse du sprint

### 1.1 Objectif

Le Sprint 10 fait passer la Synthèse comptable Lynki de la **lecture structurée** à la **lecture comparative et décisionnelle** :

- **Comparatif N / N-1** sur Bilan et CR par rubriques ;
- **SIG optionnels** (Marge brute, Valeur ajoutée, EBE/EBITDA) dans le bloc CR ;
- **Exports CSV balances tiers** clients et fournisseurs ;
- **Sélecteur de période** (exercice courant / N-1) dans la Synthèse.

### 1.2 Résultat

| Ticket | Titre | Statut |
|--------|-------|--------|
| **T54** | Vault — comparatif N/N-1 | **Livré** |
| **T55** | Vault — SIG optionnels | **Livré** |
| **T56** | Linky UI — comparatif + SIG + sélecteur | **Livré** |
| **T57** | Exports balances tiers CSV | **Livré** |
| **T58** | Non-régression + doc | **Livré** |

**Paliers :** A (Vault comparatif prêt) ✓ — B (UI décisionnelle prête) ✓ — C (sprint clôturable) ✓

---

## 2. Détail des tickets

### T54 — Vault : comparatif N/N-1

**Travaux réalisés :**
- Ajout de la fonction `previousPeriod(dateFrom, dateTo)` utilisant `time.AddDate(-1, 0, 0)` pour le calcul robuste de la période N-1 (gestion automatique du 29 février).
- Extension de la struct `lynkiRubricResponse` avec les champs : `compare`, `lines_previous`, `period_previous_from`, `period_previous_to`, `complete_previous`.
- Modification des deux handlers (`BalanceSheetRubricsHandler`, `IncomeStatementRubricsHandler`) : si `compare=n-1` est présent dans les query params, une seconde agrégation est exécutée sur la période N-1 et les lignes sont renvoyées dans `lines_previous`.
- Pour le CR, `ComputeFormulas` est également appliqué aux lignes N-1.
- Si aucune donnée N-1 n'est disponible : `lines_previous = []`, `complete_previous = false`.
- **Rétrocompatibilité :** sans le paramètre `compare`, la réponse est strictement identique à la version Sprint 08.

**Fichiers modifiés :**
- `sources/vault/internal/handlers/accounting_rubrics.go`

### T55 — Vault : SIG optionnels

**Travaux réalisés :**
- Ajout de 3 formules intermédiaires dans `IncomeStatementFormulas` **avant** `operating_profit` :
  - `lynki.rubric.is.gross_margin` = CA − achats consommés
  - `lynki.rubric.is.value_added` = CA + autres produits − achats − services extérieurs
  - `lynki.rubric.is.ebitda` = CA + autres produits − achats − services ext. − taxes − charges de personnel − autres charges exploitation
- Section : `"exploitation"` (pas `"resultats"` comme operating_profit).
- Ordre de calcul sûr : les SIG n'utilisent que des rubriques d'agrégation en entrée, pas d'autres formules.
- `operating_profit`, `financial_result`, `exceptional_result`, `net_income` restent inchangés.

**Fichiers modifiés :**
- `sources/vault/internal/storage/accounting_rubrics.go`

### T56 — Linky UI : comparatif + SIG + sélecteur de période

**Travaux réalisés :**

1. **Routes proxy enrichies :**
   - `balance-sheet/rubrics/route.ts` et `income-statement/rubrics/route.ts` : ajout des champs `compare`, `lines_previous`, `period_previous_from`, `period_previous_to`, `complete_previous` dans les interfaces. Transmission du paramètre `compare` au Vault.

2. **RubricsBlock étendu :**
   - Nouvelle prop `enableCompare` ; si activé, le fetch inclut `compare=n-1`.
   - **Matching par `rubric_id`** (décision §2.1) : construction d'un `Map<rubric_id, RubricLine>` à partir de `lines_previous`, lookup par clé pour chaque ligne N. Aucun matching par index.
   - Colonnes supplémentaires si comparatif : N-1, Δ (variation absolue), Δ% (variation relative).
   - En-tête de tableau avec les 5 colonnes (Rubrique, N, N-1, Δ, Δ%).
   - Totaux de section N-1 calculés dynamiquement.
   - Badge "Comparatif N/N-1" dans l'en-tête du bloc.
   - Affichage de la période N-1 dans les métadonnées du bloc.

3. **Code couleur sobre (décision §2.2) :**
   - Set `FAVORABLE_UP_IDS` : coloration vert/rouge uniquement sur les produits et formules positives.
   - Toutes les charges et rubriques du bilan : neutre par défaut.
   - Variation < 0.01 ou N-1 absent : gris/muted.

4. **SIG dans le bloc CR :**
   - Set `SIG_IDS` pour identifier visuellement les SIG (badge "SIG", gras).
   - Set `FORMULA_IDS` étendu pour inclure les 3 SIG + les 4 formules existantes.
   - Les SIG remontent naturellement dans la section `exploitation` car leur section est `"exploitation"`.

5. **Sélecteur de période (décision §2.3) :**
   - Dropdown minimal dans le header Synthèse : "Exercice courant" / "Exercice N-1".
   - Fonction `computePeriod` qui décale les dates d'un an si mode N-1.
   - `effectivePeriod` utilisé par tous les blocs de la Synthèse (rubriques, classes, BG, balances tiers), et transmis au drill vers le GL.
   - Quand exercice courant est sélectionné : `enableCompare=true` (affichage comparatif).
   - Quand exercice N-1 est sélectionné : les blocs affichent les données N-1 seules, sans comparatif.

**Fichiers modifiés :**
- `units/dorevia-linky/app/api/accounting/balance-sheet/rubrics/route.ts`
- `units/dorevia-linky/app/api/accounting/income-statement/rubrics/route.ts`
- `units/dorevia-linky/components/AccountingSummaryView.tsx`

### T57 — Exports balances tiers CSV

**Travaux réalisés :**

1. **Handlers Vault :**
   - Nouveau fichier `accounting_aged_balance_export.go` avec `AgedReceivablesExportHandler` et `AgedPayablesExportHandler`.
   - Factorisation via `agedBalanceExportHandler` (même pattern que `rubricExportHandler`).
   - Colonnes CSV : `partner_id`, `partner_name`, 6 tranches d'ancienneté, `total`, `as_of_date`, `tenant`, `referentiel_version`, `coverage`, `generated_at`.
   - Headers HTTP : `X-Lynki-Accounting-Source: vault`, `X-Lynki-Export-Coverage`, `X-Lynki-Export-Complete`.

2. **Routes Vault :**
   - `GET /api/accounting/aged-receivables/export`
   - `GET /api/accounting/aged-payables/export`
   - Enregistrées dans `replay.go`.

3. **Routes proxy Linky :**
   - `app/api/accounting/aged-receivables/export/route.ts`
   - `app/api/accounting/aged-payables/export/route.ts`

4. **UI :**
   - Composant `AgedBalanceExportButton` ajouté dans `AccountingSummaryView.tsx`.
   - Bouton "Exporter CSV" affiché dans chaque `AgedBalanceBlock` si données disponibles.

**Fichiers créés :**
- `sources/vault/internal/handlers/accounting_aged_balance_export.go`
- `units/dorevia-linky/app/api/accounting/aged-receivables/export/route.ts`
- `units/dorevia-linky/app/api/accounting/aged-payables/export/route.ts`

**Fichiers modifiés :**
- `sources/vault/internal/server/replay.go`
- `units/dorevia-linky/components/AccountingSummaryView.tsx`

### T58 — Non-régression + doc

**Contrôles de non-régression :**

| Surface | Résultat |
|---------|----------|
| Surface 4 blocs Synthèse | ✓ Inchangée |
| Drill rubrique → BG filtrée | ✓ Opérationnel |
| BG / GL | ✓ Inchangés |
| Exports rubriques CSV (Bilan, CR) | ✓ Inchangés |
| Exports GL / BG | ✓ Inchangés |
| Balances tiers UI | ✓ Inchangées (+ exports nouveaux) |
| Backward compat classes PCG | ✓ `<details>` accessible |
| `go build ./...` | ✓ Propre |
| `npx next build` | ✓ Propre |

**Réconciliation :**
- Les totaux N dans le mode comparatif correspondent exactement aux totaux sans `compare=n-1` (même agrégation, pas de modification de la requête courante).

---

## 3. Décisions techniques

| Décision | Choix | Justification |
|----------|-------|---------------|
| Matching N/N-1 | Par `rubric_id` uniquement | Robustesse face aux absences ou tris différents |
| Code couleur | Neutre par défaut, coloration sur produits et formules | Évite les faux signaux sur charges et bilan |
| SIG section | `"exploitation"` | Ce sont des étapes intermédiaires de la lecture exploitation |
| Sélecteur de période | 2 choix : courant / N-1 | Version minimale, trim/sem reportés |
| `previousPeriod` | `time.AddDate(-1, 0, 0)` | Gestion native du 29 février par Go |
| Exports tiers | Même pattern que exports rubriques, exports "à date" (`as_of_date`), pas comparatifs | Cohérence de la doctrine Vault, distinction nette avec le comparatif N/N-1 |

---

## 4. Inventaire des fichiers

### Vault (Go)

| Fichier | Action |
|---------|--------|
| `sources/vault/internal/handlers/accounting_rubrics.go` | Modifié (comparatif N/N-1) |
| `sources/vault/internal/storage/accounting_rubrics.go` | Modifié (3 SIG optionnels) |
| `sources/vault/internal/handlers/accounting_aged_balance_export.go` | **Créé** |
| `sources/vault/internal/server/replay.go` | Modifié (routes export tiers) |

### Linky (Next.js)

| Fichier | Action |
|---------|--------|
| `units/dorevia-linky/components/AccountingSummaryView.tsx` | Modifié (comparatif, SIG, sélecteur, export tiers) |
| `units/dorevia-linky/app/api/accounting/balance-sheet/rubrics/route.ts` | Modifié (champs N-1) |
| `units/dorevia-linky/app/api/accounting/income-statement/rubrics/route.ts` | Modifié (champs N-1) |
| `units/dorevia-linky/app/api/accounting/aged-receivables/export/route.ts` | **Créé** |
| `units/dorevia-linky/app/api/accounting/aged-payables/export/route.ts` | **Créé** |

### Documentation

| Fichier | Action |
|---------|--------|
| `ZeDocs/web57/RAPPORT_SPRINT_10_LYNKI.md` | **Créé** (v1.0) |
| `ZeDocs/web57/PLAN_SPRINT_10_LYNKI.md` | Existant (v1.0) |
| `ZeDocs/web57/EXECUTION_TICKETS_SPRINT_10_LYNKI.md` | Existant (v1.0) |
| `ZeDocs/web57/BACKLOG_PHASE2_LYNKI.md` | Mis à jour (v2.2) |
| `ZeDocs/web57/ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md` | Mis à jour (v2.3) |

---

## 5. Gates — état fin Sprint 10

| Gate | État |
|------|------|
| **Gate A** | ✅ inchangée |
| **Gate B** | ✅ close — inchangée |
| **Gate C** | ✅ **quasi-close** — surface Synthèse complète avec lecture comparative N/N-1, SIG, exports tiers. Recette terrain multi-exercice nécessaire pour clôture formelle. |
| **Gate D** | ✅ inchangée |

---

## 6. Éléments reportés

| Élément | Raison | Cible |
|---------|--------|-------|
| Sélecteur trimestre / semestre | Priorité exercice courant/N-1 suffisante pour ce sprint | Sprint 11+ |
| Sélecteur personnalisé | Version minimale prioritaire | Sprint 11+ |
| Code couleur inversé (charges ↓ = favorable) | Requiert validation métier | Sprint 11+ |
| Export comparatif (N/N-1 en CSV) | Non prévu dans ce sprint | Sprint 11+ |
| Persistance URL du sélecteur | Confort non bloquant | Sprint 11+ |

---

## 7. Après ce sprint

Suite logique :

1. **Consolidation multi-sociétés** — lecture agrégée sur plusieurs sociétés.
2. **Comparatifs plus riches** — trimestre, semestre, personnalisé, export comparatif.
3. **Netting tiers V2** — `date_maturity` + `full_reconcile_id` quand migration disponible.
4. **Insights comptables Diva** sur la Synthèse (§9 spec écran — décision produit).
5. **Rejouabilité formelle** (Phase 4) — snapshot de calcul à date.
6. **Gate C close** après recette terrain sur données réelles multi-exercice.

---

*Sprint 10 terminé — la Synthèse comptable Lynki est passée d'une surface de restitution à une **surface de lecture décisionnelle** : comparatif N/N-1, SIG, exports complets.*  
*Précédent : [RAPPORT_SPRINT_09_LYNKI.md](RAPPORT_SPRINT_09_LYNKI.md) **v1.0***

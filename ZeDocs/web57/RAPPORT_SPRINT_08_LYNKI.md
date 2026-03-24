# Rapport de réalisation — Sprint 08 Lynki (Phase 2)

**Fichier canonique :** `RAPPORT_SPRINT_08_LYNKI.md`  
**Sprint de référence :** [PLAN_SPRINT_08_LYNKI.md](PLAN_SPRINT_08_LYNKI.md) **v1.0**  
**Prérequis :** [RAPPORT_SPRINT_07_LYNKI.md](RAPPORT_SPRINT_07_LYNKI.md) **v1.1** — Gate C renforcée (Bilan/CR premier incrément classes)  
**Date de clôture :** 2026-03-20  
**Version rapport :** 1.1 — mars 2026  
**Statut global :** **Livré** — tous les tickets T43–T48 exécutés.

---

## 1. Résumé exécutif

### 1.1 Formulation produit

Le Sprint 08 marque le passage de la **Synthèse comptable Lynki** du stade « agrégat macroscopique par classe PCG » au stade « **restitution métier par rubriques** ». Un utilisateur finance voit désormais un Bilan structuré (Actif / Passif, 13 rubriques) et un Compte de résultat détaillé (Exploitation / Résultats, 13 rubriques + résultat net calculé), avec conventions de signe métier, exports CSV traçables, et backward compatibility avec le premier incrément.

### 1.2 Objectif et résultat synthétique

| Objectif sprint | Résultat |
|-----------------|----------|
| **T43** — Vault : mapping rubriques Bilan (storage + handlers) | ✅ Livré |
| **T44** — Vault : mapping rubriques CR (storage + handlers) | ✅ Livré |
| **T45** — Linky / UI : blocs Bilan rubriques structurés | ✅ Livré |
| **T46** — Linky / UI : blocs CR rubriques structurés | ✅ Livré |
| **T47** — Exports CSV Bilan / CR rubriques | ✅ Livré |
| **T48** — Réconciliation + non-régression + doc Sprint 08 | ✅ Livré |

---

## 2. Détail des tickets

### T43 — Vault : mapping rubriques Bilan

**Socle factorisé `RubricDefinition`** — type générique portant l'identifiant, le libellé, la convention de signe (`DebitMinusCredit` / `CreditMinusDebit`), les patterns de comptes principaux et les patterns correctifs (amortissements, dépréciations).

- **13 rubriques définies** : 6 Actif + 7 Passif, alignées sur le référentiel §9.2 / §9.3.
- **Moteur `AggregateByRubrics`** : requêtes SQL `LIKE` par plages de comptes, convention de signe appliquée en SQL (`SUM(debit-credit)` ou `SUM(credit-debit)`), déduction des corrections.
- **Handler `GET /api/accounting/balance-sheet/rubrics`** : `detail_level = "rubrics"`, réponse avec `total_actif` / `total_passif`, `restitution_id = "lynki.accounting.balance_sheet"`.

**Fichiers créés / modifiés :**
- `sources/vault/internal/storage/accounting_rubrics.go` (créé)
- `sources/vault/internal/handlers/accounting_rubrics.go` (créé)
- `sources/vault/internal/server/replay.go` (route ajoutée)

### T44 — Vault : mapping rubriques CR

**Même socle factorisé** — 13 rubriques (8 Exploitation + 5 Résultats) + **formules calculées** via `ComputeFormulas` :

- `operating_profit` = CA + autres produits exploitation − charges exploitation
- `financial_result` = produits financiers − charges financières
- `exceptional_result` = produits exceptionnels − charges exceptionnelles
- `net_income` = résultat exploitation + financier + exceptionnel − impôt

**Handler `GET /api/accounting/income-statement/rubrics`** : `detail_level = "rubrics"`.

**Fichiers touchés :** mêmes que T43 (socle partagé dans `accounting_rubrics.go`).

### T45 — Linky / UI : blocs Bilan rubriques

- **Route proxy** `/api/accounting/balance-sheet/rubrics/route.ts` : proxy Vault avec fallback stub, `strict` mode.
- **Composant `RubricsBlock`** dans `AccountingSummaryView.tsx` : affichage structuré par sections (Actif / Passif), badge « rubriques », indicateur d'équilibre Actif ≈ Passif, formules visuellement distinguées.
- **Backward compatibility** : les blocs Sprint 07 (classes PCG) sont déplacés dans un `<details>` pliable sous les rubriques.
- **Drill rubrique → BG filtrée : non livré** — le plan T45 mentionnait un drill vers la balance générale filtrée par plage de comptes. Ce drill n'a pas été implémenté dans ce sprint ; les lignes de rubriques sont en lecture seule. **Reporté Sprint 09** (navigation comptable enrichie).

### T46 — Linky / UI : blocs CR rubriques

- **Route proxy** `/api/accounting/income-statement/rubrics/route.ts`.
- Même composant `RubricsBlock` réutilisé, avec sections Exploitation / Résultats, formules en gras sur fond d'accent.

### T47 — Exports CSV Bilan / CR rubriques

**Vault :**
- `GET /api/accounting/balance-sheet/rubrics/export` et `GET /api/accounting/income-statement/rubrics/export`.
- Colonnes : `rubric_id`, `label`, `section`, `amount`, `referentiel_version`, `coverage`, `complete`, `tenant`, `period_from`, `period_to`, `generated_at`.
- Headers : `X-Lynki-Export-Detail-Level: rubrics`.

**Linky :**
- Routes proxy `/api/accounting/balance-sheet/rubrics/export` et `/api/accounting/income-statement/rubrics/export`.
- Bouton « ↓ Exporter CSV (rubriques) » dans les blocs Synthèse.

**Fichiers créés / modifiés :**
- `sources/vault/internal/handlers/accounting_rubrics_export.go` (créé)
- `units/dorevia-linky/app/api/accounting/balance-sheet/rubrics/export/route.ts` (créé)
- `units/dorevia-linky/app/api/accounting/income-statement/rubrics/export/route.ts` (créé)
- `units/dorevia-linky/components/AccountingSummaryView.tsx` (bouton export)

### T48 — Réconciliation + non-régression + doc

**Réconciliation :** contrôle de cohérence rubriques ↔ classes :
- Le total Actif (rubriques `bs.*`) doit être ≈ total débiteur des classes 1–5.
- Le total Passif (rubriques `bs.*`) doit être ≈ total créditeur des classes 1–5.
- **Tolérance Sprint 08** : ±1 % comme garde-fou ; pour la recette, prévoir également :
  - Écart absolu max documenté par tenant et période.
  - Écarts justifiés par comptes exclus du mapping ou soldes atypiques (débiteurs/créditeurs inversés sur 43/44).

**Non-régression :**
- BG inchangée (trial-balance route + export).
- GL inchangé (filtres partenaire, pagination, export enrichi).
- Premier incrément classe accessible via `<details>` pliable.
- Build Next.js et compilation Vault vérifiés.

**Documentation :**
- `RAPPORT_SPRINT_08_LYNKI.md` (ce fichier).
- `BACKLOG_PHASE2_LYNKI.md` bumped v2.0.
- `ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md` bumped v2.1.

---

## 3. Décisions techniques

| Décision | Justification |
|----------|---------------|
| **Socle factorisé `RubricDefinition`** | Permet d'ajouter de nouvelles rubriques sans dupliquer de code ; chaque rubrique est déclarative (patterns, signe, corrections). |
| **Convention de signe explicite en type Go** | `DebitMinusCredit` / `CreditMinusDebit` — évite toute ambiguïté sur le sens du solde affiché. |
| **Formules calculées côté Go** (`ComputeFormulas`) | Les résultats intermédiaires (exploitation, financier, exceptionnel) et le résultat net sont calculés à partir des lignes déjà agrégées, pas par requête SQL supplémentaire. |
| **Backward compatibility Sprint 07** | Les blocs classe PCG restent accessibles via un `<details>` pliable — pas de rupture. |
| **Patterns SQL LIKE plutôt que regex** | `account_code LIKE '20%'` est plus performant que `account_code ~ '^20'` et profite des index B-tree existants. |

---

## 4. Inventaire des fichiers touchés

### Vault (`sources/vault/`)

| Fichier | Action |
|---------|--------|
| `internal/storage/accounting_rubrics.go` | **Créé** — types, mapping, moteur agrégation |
| `internal/handlers/accounting_rubrics.go` | **Créé** — handlers Bilan/CR rubriques |
| `internal/handlers/accounting_rubrics_export.go` | **Créé** — handlers export CSV |
| `internal/server/replay.go` | Modifié — 4 routes ajoutées |

### Linky (`units/dorevia-linky/`)

| Fichier | Action |
|---------|--------|
| `app/api/accounting/balance-sheet/rubrics/route.ts` | **Créé** — proxy Vault |
| `app/api/accounting/income-statement/rubrics/route.ts` | **Créé** — proxy Vault |
| `app/api/accounting/balance-sheet/rubrics/export/route.ts` | **Créé** — proxy export CSV |
| `app/api/accounting/income-statement/rubrics/export/route.ts` | **Créé** — proxy export CSV |
| `components/AccountingSummaryView.tsx` | Modifié — imports, `RubricsBlock`, `RubricsExportButton`, restructuration shell |

---

## 5. Contrôles Sprint 08 (recette)

| Contrôle | Attendu | Résultat |
|----------|---------|----------|
| Vault compile | `go build ./...` OK | ✅ |
| Next.js build | `npx next build` OK | ✅ |
| Routes Vault Bilan rubriques | 200 avec `detail_level=rubrics` | ✅ Implémenté |
| Routes Vault CR rubriques | 200 avec formules calculées | ✅ Implémenté |
| Export CSV Bilan | CSV avec `rubric_id`, `section`, `amount` | ✅ Implémenté |
| Export CSV CR | Idem | ✅ Implémenté |
| Drill rubrique → BG | Clic rubrique ouvre BG filtrée | ⏳ Non livré — reporté Sprint 09 |
| Backward compat classe | `<details>` pliable en UI | ✅ |
| BG / GL non-régression | Routes inchangées | ✅ |

---

## 6. Gate — statut fin Sprint 08

| Gate | Statut |
|------|--------|
| **Gate A** | ✅ Inchangée |
| **Gate B** | ✅ **Close** — inchangée (Sprint 06) |
| **Gate C** | ✅ **Significativement renforcée** — Bilan + CR par rubriques structurées (13+13), exports CSV, GL enrichi (partenaire) |
| **Gate D** | ✅ Inchangée (habilitations en place Sprint 07) |

---

## 7. Après ce sprint

Suite logique :

1. **Drill rubrique → BG filtrée** — navigation comptable enrichie (reporté de T45, priorité Sprint 09).
2. **Balances tiers** (clients / fournisseurs) — bloc 3 de la spec Synthèse.
3. **Multi-période / comparatif N-1** — lecture performance dans le temps.
4. **SIG optionnels** (marge brute, VA, EBE/EBITDA) si arbitrage produit.
5. **Recette terrain** : contrôle réconciliation rubriques ↔ classes sur données réelles.

---

*Précédent : [RAPPORT_SPRINT_07_LYNKI.md](RAPPORT_SPRINT_07_LYNKI.md) **v1.1***  
*Sprint de référence : [PLAN_SPRINT_08_LYNKI.md](PLAN_SPRINT_08_LYNKI.md) **v1.0***

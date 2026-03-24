# Rapport de réalisation — Sprint 09 Lynki (Phase 2)

**Fichier canonique :** `RAPPORT_SPRINT_09_LYNKI.md`  
**Sprint de référence :** [PLAN_SPRINT_09_LYNKI.md](PLAN_SPRINT_09_LYNKI.md) **v1.0**  
**Prérequis :** [RAPPORT_SPRINT_08_LYNKI.md](RAPPORT_SPRINT_08_LYNKI.md) **v1.1** — Gate C significativement renforcée (rubriques Bilan/CR)  
**Date de clôture :** 2026-03-20  
**Version rapport :** 1.0 — mars 2026  
**Statut global :** **Livré** — tous les tickets T49–T53 exécutés.

---

## 1. Résumé exécutif

### 1.1 Formulation produit

Le Sprint 09 **complète la surface Synthèse comptable Lynki** telle que définie dans [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) §3 :

- La **chaîne de preuve** est désormais opérationnelle : **rubrique → balance générale filtrée → grand livre**. Un clic sur une rubrique Bilan ou CR ouvre la BG pré-filtrée sur la plage de comptes concernée.
- Les **balances tiers** — balance clients et balance fournisseurs — sont exposées comme **bloc 3** de la Synthèse, avec 6 tranches d'ancienneté par partenaire.
- La page Synthèse affiche désormais **4 blocs** : Bilan rubriques, Compte de résultat rubriques, Balances tiers (clients + fournisseurs), Balance générale.

### 1.2 Objectif et résultat synthétique

| Objectif sprint | Résultat |
|-----------------|----------|
| **T49** — Drill rubrique → BG filtrée | ✅ Livré |
| **T50** — Vault : balance âgée clients | ✅ Livré |
| **T51** — Vault : balance âgée fournisseurs | ✅ Livré |
| **T52** — Linky : routes + UI bloc Balances tiers | ✅ Livré |
| **T53** — Réconciliation + non-régression + doc | ✅ Livré |

---

## 2. Détail des tickets

### T49 — Drill rubrique → BG filtrée

**Contrat de filtre retenu : `account_prefixes`** — tableau de préfixes séparés par virgules (ex. `20,21,22,23,24,25,26,27`).

**Vault :**
- `TrialBalanceAggregationFiltered` : nouvelle méthode acceptant `accountPrefixes []string`. Génère des clauses SQL `account_code LIKE '20%' OR account_code LIKE '21%' …`.
- Handler `GET /api/accounting/trial-balance` : paramètre optionnel `account_prefixes` (rétrocompatible).

**Linky :**
- Route proxy `/api/accounting/trial-balance` : transmet `account_prefixes` au Vault.
- Réponse rubriques enrichie : chaque `RubricLine` porte un champ `account_filter: string[]` (préfixes sans le `%`).

**UI :**
- Chaque ligne de rubrique non-formule est cliquable (→ BG, indicateur « → BG »).
- Mécanisme par état local dans le shell `AccountingSummaryView` (`drillBG` state).
- `TrialBalanceBlock` accepte `accountPrefixes` et `rubricLabel` en props.
- Titre du bloc BG dynamique (ex. « Balance générale — Immobilisations nettes »).
- Bouton « ← Revenir à la BG complète » pour revenir à la vue non filtrée.

**Fichiers touchés :**
- `sources/vault/internal/storage/trial_balance.go` (modifié)
- `sources/vault/internal/handlers/accounting_trial_balance.go` (modifié)
- `sources/vault/internal/storage/accounting_rubrics.go` (modifié — `AccountFilter` dans `RubricLine`)
- `units/dorevia-linky/app/api/accounting/trial-balance/route.ts` (modifié)
- `units/dorevia-linky/app/api/accounting/balance-sheet/rubrics/route.ts` (modifié — type `RubricLine`)
- `units/dorevia-linky/app/api/accounting/income-statement/rubrics/route.ts` (modifié)
- `units/dorevia-linky/components/AccountingSummaryView.tsx` (modifié — drill, état, props)

### T50 — Vault : balance âgée clients

**Socle factorisé `AgedBalance`** — types partagés clients/fournisseurs.

- `AgedBalanceLine` : `partner_id`, `partner_name`, 6 tranches (`not_due`, `range_0_30`, …, `range_over_180`), `total`.
- `AggregateAgedBalance` : requête SQL avec sous-requête calculant `age_days = as_of_date - line_date`, agrégation par partenaire avec `CASE WHEN` pour chaque tranche.
- **Convention de signe** : clients `D-C` (positif = créance), fournisseurs `C-D` (positif = dette).
- Handler `GET /api/accounting/aged-receivables` : `restitution_id = "lynki.accounting.aged_receivables"`.

**V1 — limites documentées explicitement :**
- Ancienneté basée sur `line_date` (colonne `date_maturity` non disponible dans le schéma).
- Pas de lettrage (`full_reconcile_id` absent) — solde cumulé par partenaire.
- Champ `v1_limitations` dans la réponse JSON pour transparence totale.

### T51 — Vault : balance âgée fournisseurs

Même socle que T50. Handler `GET /api/accounting/aged-payables` : `restitution_id = "lynki.accounting.aged_payables"`. Convention de signe inversée (C-D).

**Fichiers créés :**
- `sources/vault/internal/storage/aged_balance.go`
- `sources/vault/internal/handlers/accounting_aged_balance.go`
- `sources/vault/internal/server/replay.go` (2 routes ajoutées)

### T52 — Linky : routes + UI bloc Balances tiers

**Routes proxy :**
- `/api/accounting/aged-receivables` et `/api/accounting/aged-payables`.

**UI :**
- Composant `AgedBalanceBlock` : tableau par partenaire avec 6 colonnes de tranches + total.
- En-tête avec badge nombre de partenaires, date d'observation, data source.
- Bannière V1 limitations si présente.
- Totaux par tranche en pied de tableau.
- Placement : bloc 3 dans la Synthèse (entre rubriques Bilan/CR et BG), conformément à la spec §3.

**Fichiers créés / modifiés :**
- `units/dorevia-linky/app/api/accounting/aged-receivables/route.ts` (créé)
- `units/dorevia-linky/app/api/accounting/aged-payables/route.ts` (créé)
- `units/dorevia-linky/components/AccountingSummaryView.tsx` (modifié)

### T53 — Réconciliation + non-régression + doc

**Réconciliation :**
- Contrôle rubriques ↔ classes : inchangé depuis Sprint 08 (socle identique).
- Contrôle balances tiers ↔ rubriques Bilan : total balance clients ≈ rubrique `bs.trade_receivables`, total balance fournisseurs ≈ rubrique `bs.trade_payables` (tolérance : le total tiers est plus large car il inclut tous les postes par partenaire, pas seulement les comptes retenus dans la rubrique).

**Non-régression :**
- BG : route trial-balance inchangée sans `account_prefixes` → même comportement.
- GL : inchangé.
- Rubriques Bilan/CR : inchangées (ajout de `account_filter` en `omitempty`).
- Exports CSV : inchangés.
- Build Next.js et compilation Vault vérifiés.

**Documentation :**
- `RAPPORT_SPRINT_09_LYNKI.md` (ce fichier).
- `BACKLOG_PHASE2_LYNKI.md` bumped v2.1.
- `ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md` bumped v2.2.

---

## 3. Décisions techniques

| Décision | Justification |
|----------|---------------|
| **`account_prefixes` comme contrat unique** | Un seul paramètre (tableau CSV) qui couvre tous les cas de filtre rubrique → BG. Rétrocompatible. |
| **Drill par état local** (`drillBG` state) | Plus propre qu'un `router.push` avec query params — évite un rechargement complet de page et maintient le contexte Synthèse. |
| **V1 balances tiers sans lettrage** | `full_reconcile_id` et `date_maturity` absents du schéma `account_move_lines`. V1 honnête : ancienneté approchée sur `line_date`, solde cumulé. Limites documentées dans la réponse JSON. |
| **Convention de signe tiers** | Clients D-C (positif = créance), Fournisseurs C-D (positif = dette). Cohérent avec les conventions Bilan. |

---

## 4. Inventaire des fichiers touchés

### Vault (`sources/vault/`)

| Fichier | Action |
|---------|--------|
| `internal/storage/trial_balance.go` | Modifié — `TrialBalanceAggregationFiltered`, clause `account_prefixes` |
| `internal/storage/accounting_rubrics.go` | Modifié — `AccountFilter` dans `RubricLine` |
| `internal/storage/aged_balance.go` | **Créé** — types et moteur balance âgée |
| `internal/handlers/accounting_trial_balance.go` | Modifié — paramètre `account_prefixes` |
| `internal/handlers/accounting_aged_balance.go` | **Créé** — handlers clients/fournisseurs |
| `internal/server/replay.go` | Modifié — 2 routes ajoutées |

### Linky (`units/dorevia-linky/`)

| Fichier | Action |
|---------|--------|
| `app/api/accounting/trial-balance/route.ts` | Modifié — transmet `account_prefixes` |
| `app/api/accounting/balance-sheet/rubrics/route.ts` | Modifié — type `RubricLine` enrichi |
| `app/api/accounting/income-statement/rubrics/route.ts` | Modifié — idem |
| `app/api/accounting/aged-receivables/route.ts` | **Créé** — proxy Vault |
| `app/api/accounting/aged-payables/route.ts` | **Créé** — proxy Vault |
| `components/AccountingSummaryView.tsx` | Modifié — drill, `AgedBalanceBlock`, restructuration shell |

---

## 5. Contrôles Sprint 09 (recette)

| Contrôle | Attendu | Résultat |
|----------|---------|----------|
| Vault compile | `go build ./...` OK | ✅ |
| Next.js build | `npx next build` OK | ✅ |
| Drill rubrique → BG | Clic rubrique ouvre BG filtrée | ✅ Implémenté |
| BG sans filtre | Inchangée (rétrocompatible) | ✅ |
| Balance clients | Tableau par partenaire, 6 tranches | ✅ Implémenté |
| Balance fournisseurs | Idem | ✅ Implémenté |
| Bloc 3 Synthèse | Entre Bilan/CR et BG | ✅ |
| Rubriques Bilan/CR | Inchangées (+ `account_filter`) | ✅ |
| Exports CSV | Inchangés | ✅ |
| BG / GL non-régression | Routes inchangées | ✅ |

---

## 6. Gate — statut fin Sprint 09

| Gate | Statut |
|------|--------|
| **Gate A** | ✅ Inchangée |
| **Gate B** | ✅ **Close** — inchangée |
| **Gate C** | ✅ **Substantiellement avancée** — surface Synthèse complète (4 blocs + drill rubrique → BG) |
| **Gate D** | ✅ Inchangée |

---

## 7. Après ce sprint

Suite logique :

1. **Multi-période / comparatif N-1** — lecture performance dans le temps.
2. **SIG optionnels** (marge brute, VA, EBE/EBITDA) si arbitrage produit.
3. **Netting tiers sophistiqué** (avoirs, lettrages partiels) quand `full_reconcile_id` / `date_maturity` seront dans le schéma.
4. **Exports balances tiers** CSV.
5. **Réconciliation formalisée** avec seuils d'alerte par tenant.

---

*Précédent : [RAPPORT_SPRINT_08_LYNKI.md](RAPPORT_SPRINT_08_LYNKI.md) **v1.1***  
*Sprint de référence : [PLAN_SPRINT_09_LYNKI.md](PLAN_SPRINT_09_LYNKI.md) **v1.0***

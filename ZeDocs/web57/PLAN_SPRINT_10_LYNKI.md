# Plan Sprint 10 — Lynki (Phase 2)

**Fichier canonique :** `PLAN_SPRINT_10_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** sprint exécutable — suite du [RAPPORT_SPRINT_09_LYNKI.md](RAPPORT_SPRINT_09_LYNKI.md) **v1.0** (surface Synthèse complète — 4 blocs + drill)

**Sources :** [RAPPORT_SPRINT_09_LYNKI.md](RAPPORT_SPRINT_09_LYNKI.md) **v1.0** · [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) **v1.1.1** · [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v2.1** · [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) **v2.2** · [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) **v1.1** (§10.3 SIG optionnels) · [CDC_MASTER_LYNKI.md](CDC_MASTER_LYNKI.md) **v2.2** (§5.3 rejouabilité, §4.4 comparaisons) · **Rapport (squelette) :** [RAPPORT_SPRINT_10_LYNKI.md](RAPPORT_SPRINT_10_LYNKI.md) *(à créer)*

---

## 1. Objectif du sprint

Les Sprints 07–09 ont construit l'**ossature complète** de la Synthèse comptable : rubriques Bilan/CR, drill, balances tiers, exports. La page fonctionne, la chaîne de preuve est opérationnelle.

Le Sprint 10 change de registre : on passe de **« compléter la structure »** à **« enrichir l'usage décisionnel »**. L'objectif est de rendre la Synthèse **exploitable en lecture comparative et en analyse de performance**.

### Objectifs principaux

1. **Comparatif N / N-1** — chaque bloc rubriques (Bilan, CR) affiche le montant de la période courante **et** le montant de la période précédente (même durée, année N-1), avec variation absolue et relative.
2. **SIG optionnels** (§10.3 du référentiel) — Marge brute, Valeur ajoutée, EBE/EBITDA : trois formules intermédiaires calculées côté Vault et exposées dans le bloc CR si les rubriques sont peuplées.
3. **Exports balances tiers** CSV — alignement sur le pattern d'export existant (trial-balance, GL, rubriques).

### Objectifs secondaires

4. **Multi-période UI** — sélecteur de période élargi (exercice N, exercice N-1, trimestre, semestre) sur la page Synthèse, avec persistance en URL.
5. Documentation : ALIGNEMENT, BACKLOG, RAPPORT_SPRINT_10.

**Hors sprint sauf arbitrage :**

- Lettrage / `date_maturity` pour balances tiers V2 — dépend d'une migration de schéma.
- Consolidation multi-sociétés — Sprint 11+.
- Rejouabilité formelle (Phase 4 du plan consolidé).

---

## 2. Périmètre (lots / epics)

| Lot | Epic |
|-----|------|
| **Lot 2 (extension)** | Comparatif N/N-1 — Vault + UI |
| **Lot 2 (extension)** | SIG optionnels — Vault formules + UI |
| **Lot 3 (extension)** | Exports balances tiers CSV |
| **Lot 2 (UI)** | Sélecteur multi-période |
| **0 / transversal** | Non-régression, doc |

---

## 3. Dépendances

```text
Sprint 09 livré (surface Synthèse complète)
        │
        ├──> rubriques Bilan/CR en place
        ├──> balances tiers en place
        ├──> drill opérationnel
        │
        ▼
T54 — Vault : comparatif N/N-1 (double requête rubriques)
        │
        ├──> T55 — Vault : SIG optionnels (formules CR)
        │
        ▼
T56 — Linky / UI : comparatif + SIG dans les blocs Synthèse
        │
        ├──> T57 — Exports balances tiers CSV
        │
        ▼
T58 — Non-régression + doc
```

---

## 4. Tickets (Sprint 10)

| # | Titre | Lot | Dépend de | Statut |
|---|-------|-----|-----------|--------|
| **T54** | **Vault — comparatif N/N-1** | Lot 2 | Sprint 09 | todo |
| | Les handlers rubriques Bilan (`/api/accounting/balance-sheet/rubrics`) et CR (`/api/accounting/income-statement/rubrics`) acceptent un paramètre optionnel `compare=n-1`. Si activé, le Vault exécute une seconde agrégation sur la période N-1 (même durée, année précédente) et renvoie les deux jeux de lignes (`lines` + `lines_previous`). Pas de modification des requêtes existantes — ajout conditionnel. | | | |
| **T55** | **Vault — SIG optionnels** | Lot 2 | T54 (socle partagé) | todo |
| | Ajout de trois formules intermédiaires dans `IncomeStatementFormulas` : `gross_margin` (CA − achats consommés), `value_added` (CA + autres produits − achats − services extérieurs), `ebitda` (produits exploitation − charges exploitation hors dotations). Exposées dans la réponse CR rubriques si les rubriques sous-jacentes sont peuplées. Aligné sur le référentiel §10.3. | | | |
| **T56** | **Linky / UI — comparatif + SIG** | Lot 2 UI | T54 + T55 | todo |
| | Extension du composant `RubricsBlock` pour afficher une colonne N-1 et une colonne variation (Δ absolue, % relatif). Badge « Comparatif N/N-1 ». Les SIG apparaissent comme lignes intermédiaires en gras dans le bloc CR si peuplés. Sélecteur de période élargi (exercice courant / N-1 / trimestre / semestre) dans le shell Synthèse. | | | |
| **T57** | **Exports balances tiers CSV** | Lot 3 | Sprint 09 | todo |
| | `GET /api/accounting/aged-receivables/export` et `/api/accounting/aged-payables/export` côté Vault. Colonnes : `partner_id`, `partner_name`, `not_due`, `range_0_30`, ..., `range_over_180`, `total`, `as_of_date`, `tenant`, `referentiel_version`, `coverage`. Routes proxy Linky + boutons dans les blocs `AgedBalanceBlock`. | | | |
| **T58** | **Non-régression + doc** | transversal | T54–T57 | todo |
| | Non-régression surface complète. ALIGNEMENT, BACKLOG, RAPPORT_SPRINT_10. | | | |

---

## 5. Détail technique

### 5.1 Comparatif N/N-1 (T54)

**Calcul de la période N-1 :**
- Si `date_debut = 2025-01-01` et `date_fin = 2025-12-31`, la période N-1 est `2024-01-01` → `2024-12-31`.
- Règle : même jour/mois, année − 1. Gestion du 29 février si nécessaire.

**Contrat API :**

```json
{
  "detail_level": "rubrics",
  "compare": "n-1",
  "lines": [ ... ],           // période courante
  "lines_previous": [ ... ],  // période N-1 (même structure RubricLine)
  "period_previous_from": "2024-01-01",
  "period_previous_to": "2024-12-31"
}
```

**Implémentation Vault :**
- Si `compare=n-1` dans les query params, exécuter `AggregateByRubrics` une seconde fois avec les dates décalées.
- Retourner les deux jeux de lignes dans la même réponse.
- Si pas de données N-1, `lines_previous` = `[]` et `complete_previous = false`.

### 5.2 SIG optionnels (T55)

Ajout dans `IncomeStatementFormulas` (fichier `accounting_rubrics.go`) :

| ID | Libellé | Formule |
|----|---------|---------|
| `lynki.rubric.is.gross_margin` | Marge brute | `revenue` − `purchases_consumed` |
| `lynki.rubric.is.value_added` | Valeur ajoutée | `revenue` + `other_operating_income` − `purchases_consumed` − `external_services` |
| `lynki.rubric.is.ebitda` | EBE / EBITDA | `revenue` + `other_operating_income` − `purchases_consumed` − `external_services` − `taxes_and_duties` − `payroll` − `other_operating_expenses` |

**Position dans la liste des formules :** insérées **avant** `operating_profit` dans l'ordre de calcul (car `operating_profit` les englobe de fait).

**Condition d'exposition :** toujours calculés si les rubriques sous-jacentes existent. L'UI peut les masquer si le montant est 0 et que les rubriques contributives sont toutes à 0.

### 5.3 UI comparatif (T56)

**Tableau enrichi des rubriques :**

```
┌──────────────────────────────┬───────────┬───────────┬──────┬───────┐
│ Rubrique                     │ N (2025)  │ N-1 (2024)│  Δ   │  Δ %  │
├──────────────────────────────┼───────────┼───────────┼──────┼───────┤
│ Immobilisations nettes       │ 125 000 € │ 118 000 € │+7 000│ +5,9% │
│ Stocks et en-cours           │  42 000 € │  38 500 € │+3 500│ +9,1% │
│ ...                          │           │           │      │       │
└──────────────────────────────┴───────────┴───────────┴──────┴───────┘
```

**Code couleur variations :**
- Vert : variation favorable (produits ↑, charges ↓, actif ↑, dette ↓).
- Rouge : variation défavorable.
- Neutre : variation < 1 % ou données N-1 absentes.

**Sélecteur de période :**
- Dropdown dans le header Synthèse : « Exercice 2025 », « Exercice 2024 », « T1 2025 », « S1 2025 », « Personnalisé ».
- La période sélectionnée met à jour `period.from` / `period.to` et déclenche un rechargement des blocs.

### 5.4 Exports balances tiers (T57)

Même pattern que `accounting_rubrics_export.go` :

```
GET /api/accounting/aged-receivables/export?tenant=...&as_of_date=...&company_id=...
→ Content-Type: text/csv
→ Colonnes: partner_id, partner_name, not_due, range_0_30, ..., total, as_of_date, tenant, referentiel_version, coverage
```

---

## 6. Definition of Done (opérationnelle)

| Ticket | DoD minimum |
|--------|-------------|
| **T54** | Réponse Vault avec `lines_previous` si `compare=n-1` ; pas de régression sans le paramètre |
| **T55** | `gross_margin`, `value_added`, `ebitda` calculés et présents dans la réponse CR si rubriques peuplées |
| **T56** | Colonnes N / N-1 / Δ / Δ% dans les blocs rubriques ; SIG visibles dans le bloc CR ; sélecteur de période fonctionnel |
| **T57** | CSV balance clients + fournisseurs ; même pattern d'export que les rubriques |
| **T58** | Non-régression surface complète ; rapport rédigé |

---

## 7. Recette — contrôles Sprint 10

### 7.1 Comparatif (T54 / T56)

| Contrôle | Attendu |
|----------|---------|
| Bilan N/N-1 | Deux colonnes, variation absolue et relative |
| CR N/N-1 | Idem, avec SIG intermédiaires |
| Pas de données N-1 | Colonne N-1 vide, variation « — » |
| Sans `compare=n-1` | Comportement inchangé (rétrocompatible) |

### 7.2 SIG (T55)

| Contrôle | Attendu |
|----------|---------|
| Marge brute | CA − achats consommés |
| Valeur ajoutée | CA + autres produits − achats − services ext. |
| EBE | Produits exploitation − charges exploitation hors dotations |
| Résultat net | Inchangé (somme exploitation + financier + exceptionnel − impôt) |

### 7.3 Exports tiers (T57)

| Contrôle | Attendu |
|----------|---------|
| CSV clients | Colonnes partenaire + 6 tranches + total + métadonnées |
| CSV fournisseurs | Idem |
| Header | `X-Lynki-Accounting-Source: vault` |

### 7.4 Non-régression (T58)

| Contrôle | Attendu |
|----------|---------|
| Surface 4 blocs | Inchangée |
| Drill rubrique → BG | Inchangé |
| Exports rubriques | Inchangés |
| BG / GL | Inchangés |

---

## 8. Risques

| Risque | Mitigation |
|--------|------------|
| Pas de données sur la période N-1 | Afficher « Données N-1 non disponibles » plutôt qu'un 0 trompeur |
| SIG optionnels = formules fragiles si rubriques vides | Masquer le SIG si toutes les rubriques contributives sont à 0 |
| Performance double requête N/N-1 | Les requêtes rubriques sont légères (agrégats par LIKE) ; acceptable en V1 |
| Sélecteur de période complexe | V1 : dropdown simple avec périodes pré-calculées ; personnalisé si temps |

---

## 9. Sortie attendue (fin de sprint)

* **Comparatif N/N-1** : colonnes N, N-1, Δ, Δ% dans Bilan et CR rubriques ;
* **SIG** : Marge brute + Valeur ajoutée + EBE dans le bloc CR ;
* **Exports tiers** : CSV clients + fournisseurs ;
* **Sélecteur de période** : dropdown exercice / trimestre / semestre ;
* **Surface Synthèse** : 4 blocs + drill + comparatif + SIG — **lecture décisionnelle** ;
* **`RAPPORT_SPRINT_10_LYNKI.md`** rédigé.

---

## 10. Gates — cible fin Sprint 10

| Gate | Cible |
|------|-------|
| **Gate A** | inchangée |
| **Gate B** | **close** — inchangée |
| **Gate C** | **quasi-close** — surface Synthèse complète avec lecture comparative et SIG |
| **Gate D** | inchangée |

---

## 11. Après ce sprint

Suite logique :

1. **Consolidation multi-sociétés** — lecture agrégée sur plusieurs sociétés.
2. **Netting tiers V2** — `date_maturity` + `full_reconcile_id` quand migration disponible.
3. **Rejouabilité formelle** (Phase 4) — snapshot de calcul à date.
4. **Insights comptables Diva** sur la Synthèse (§9 spec écran — décision produit).
5. **Gate C close** après recette terrain sur données réelles multi-exercice.

---

*Document d'exécution — enrichissement décisionnel (comparatif, SIG, exports tiers), aligné CDC §4.4/§5.3 et REFERENTIEL §10.3.*  
*Précédent : [PLAN_SPRINT_09_LYNKI.md](PLAN_SPRINT_09_LYNKI.md) **v1.0** · [RAPPORT_SPRINT_09_LYNKI.md](RAPPORT_SPRINT_09_LYNKI.md) **v1.0***

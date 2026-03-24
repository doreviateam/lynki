# Plan Sprint 08 — Lynki (Phase 2)

**Fichier canonique :** `PLAN_SPRINT_08_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** sprint exécutable — suite du [RAPPORT_SPRINT_07_LYNKI.md](RAPPORT_SPRINT_07_LYNKI.md) **v1.1** (Gate C et D renforcées — §8)

**Sources :** [RAPPORT_SPRINT_07_LYNKI.md](RAPPORT_SPRINT_07_LYNKI.md) **v1.1** · [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) **v1.1.1** · [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v1.9** · [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) **v2.0** · [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) **v1.1** (§9–§10 rubriques) · [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) **v0.5** · **Exécution :** [EXECUTION_TICKETS_SPRINT_08_LYNKI.md](EXECUTION_TICKETS_SPRINT_08_LYNKI.md) *(à créer)* · **Rapport (squelette) :** [RAPPORT_SPRINT_08_LYNKI.md](RAPPORT_SPRINT_08_LYNKI.md) *(à créer)*

---

## 1. Objectif du sprint

Le Sprint 07 a livré un **premier incrément** Bilan / CR agrégé par **classe PCG** (1er chiffre du compte). Ce premier étage a prouvé la chaîne Vault → Linky → Synthèse, mais la lecture reste trop macroscopique pour un utilisateur métier.

Le Sprint 08 fait franchir un palier de **maturité métier** en implémentant les **rubriques** du [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) §9–§10 :

> De « Classe 2 — Comptes d'immobilisations » à « Immobilisations nettes = brut 20–27 − amort. 28–29 ».

### Objectifs principaux

1. **Bilan par rubriques** (`lynki.rubric.bs.*`) — actif et passif avec mapping PCG détaillé (§9.2 / §9.3 du référentiel).
2. **CR par rubriques** (`lynki.rubric.is.*`) — exploitation, résultats intermédiaires, résultat net (§10.2 / §10.3 du référentiel).
3. **Exports CSV Bilan / CR** — cohérence avec l'existant trial-balance/GL export.
4. **UI Synthèse élargie** — blocs Bilan et CR avec rubriques structurées, drill vers la BG par rubrique, signe métier (charges et produits en positif).
5. **Non-régression** — BG, GL, premier incrément classe restent fonctionnels.

### Objectifs secondaires

6. **Réconciliation** : contrôle de cohérence total rubriques Bilan ≈ total classes 1–5 (alerte documentée si écart).
7. Documentation : ALIGNEMENT, BACKLOG, **RAPPORT_SPRINT_08_LYNKI.md**.

**Hors sprint sauf arbitrage :**

- Balances tiers (bloc 3 de la spec Synthèse) — Sprint 09+.
- Multi-période / comparatif N-1 — Sprint 09+.
- SIG optionnels (`gross_margin`, `value_added`, `ebitda`) — exposés en UI uniquement si temps disponible.
- Rejouabilité Phase 4.

---

## 2. Périmètre (lots / epics)

| Lot | Epic |
|-----|------|
| **Lot 2 (extension)** | Bilan rubriques + CR rubriques — mapping PCG référentiel §9–§10 |
| **Lot 3 (extension)** | Exports CSV Bilan / CR |
| **Lot 2 (UI)** | Synthèse — blocs rubriques structurés (actif/passif, exploitation/résultat) |
| **0 / transversal** | Réconciliation, non-régression, doc |

---

## 3. Dépendances

```text
Sprint 07 livré (Gate C renforcée)
        │
        ├──> données partenaire en place (T37/T38)
        ├──> premier incrément Bilan/CR par classe validé (T39/T40)
        │
        ▼
T43 — Vault : mapping rubriques Bilan (storage + handlers)
        │
        ├──> T44 — Vault : mapping rubriques CR (même socle)
        │
        ▼
T45 — Linky : routes + UI rubriques Bilan
        │
        ├──> T46 — Linky : routes + UI rubriques CR
        │
        ▼
T47 — Exports CSV Bilan / CR
        │
        ▼
T48 — Réconciliation + non-régression + doc
```

---

## 4. Tickets (Sprint 08)

| # | Titre | Lot | Dépend de | Statut |
|---|-------|-----|-----------|--------|
| **T43** | **Vault — rubriques Bilan** | Lot 2 | Sprint 07 clos | todo |
| | Mapping PCG → `lynki.rubric.bs.*` (§9.2 actif / §9.3 passif) ; handler `GET /api/accounting/balance-sheet/rubrics` ; requêtes SQL par plages de comptes (20–27, 28–29, 31–37, 39, 411/413…, 50–53, etc.) | | | |
| **T44** | **Vault — rubriques CR** | Lot 2 | T43 (socle partagé) ou parallèle | todo |
| | Mapping PCG → `lynki.rubric.is.*` (§10.2 exploitation / §10.3 résultats) ; handler `GET /api/accounting/income-statement/rubrics` ; formules de résultat (exploitation, financier, exceptionnel, net) | | | |
| **T45** | **Linky / UI — Bilan rubriques** | Lot 2 UI | T43 | todo |
| | Route proxy `/api/accounting/balance-sheet/rubrics` ; bloc Synthèse structuré Actif / Passif avec rubriques, totaux, drill vers BG | | | |
| **T46** | **Linky / UI — CR rubriques** | Lot 2 UI | T44 | todo |
| | Route proxy `/api/accounting/income-statement/rubrics` ; bloc Synthèse structuré Exploitation / Résultats intermédiaires / Résultat net ; affichage métier (charges et produits positifs, résultat algébrique) | | | |
| **T47** | **Exports CSV Bilan / CR** | Lot 3 | T45 + T46 | todo |
| | `GET /api/accounting/balance-sheet/export` et `income-statement/export` ; même pattern que trial-balance/GL export ; boutons dans les blocs Synthèse | | | |
| **T48** | **Réconciliation + doc** | transversal | T43–T47 | todo |
| | Contrôle cohérence rubrique vs classe ; non-régression BG/GL/exports ; ALIGNEMENT, BACKLOG, RAPPORT_SPRINT_08 | | | |

*(T43/T44 parallélisables si le socle SQL rubrique est factorisé dès le début.)*

---

## 5. Détail technique — mapping rubriques

### 5.1 Bilan — rubriques cibles (REFERENTIEL §9)

#### Actif

| Identifiant | Libellé | Comptes PCG | Règle |
|-------------|---------|-------------|-------|
| `bs.fixed_assets` | Immobilisations nettes | 20–27 brut, − 28–29 amort. | SUM(D-C) comptes 20–27, − SUM(D-C) 28–29 |
| `bs.inventory` | Stocks et en-cours nets | 31–37, − 39 dépréc. | SUM(D-C) 31–37, − SUM(D-C) 39 |
| `bs.trade_receivables` | Créances clients | 411, 413, 416, 418 | SUM(D-C) |
| `bs.other_receivables` | Autres créances | 409 déb., 42, 43, 44 déb., 46 déb. | SUM(D-C) soldes débiteurs |
| `bs.cash_and_equivalents` | Trésorerie et équivalents | 50–53, 58 | SUM(D-C) |
| `bs.prepaid_expenses` | Charges constatées d'avance | 486 | SUM(D-C) |

#### Passif

| Identifiant | Libellé | Comptes PCG | Règle |
|-------------|---------|-------------|-------|
| `bs.equity` | Capitaux propres | 10–14 | SUM(C-D) (inversé) |
| `bs.provisions` | Provisions risques et charges | 15 | SUM(C-D) |
| `bs.financial_debt` | Dettes financières | 16, 17 | SUM(C-D) |
| `bs.trade_payables` | Dettes fournisseurs | 401, 403, 408 | SUM(C-D) |
| `bs.tax_social_payables` | Dettes fiscales et sociales | 43 créd., 44 créd. | SUM(C-D) soldes créditeurs |
| `bs.other_payables` | Autres dettes | 46 créd., 467, 468 | SUM(C-D) |
| `bs.deferred_income` | Produits constatés d'avance | 487 | SUM(C-D) |

### 5.2 CR — rubriques cibles (REFERENTIEL §10)

#### Exploitation

| Identifiant | Libellé | Comptes PCG | Signe UI |
|-------------|---------|-------------|----------|
| `is.revenue` | CA / produits d'exploitation | 70, 71, 72, 74 | + |
| `is.other_operating_income` | Autres produits d'exploitation | 75 | + |
| `is.purchases_consumed` | Achats consommés | 60, 603 | + (charge) |
| `is.external_services` | Services extérieurs | 61, 62 | + (charge) |
| `is.taxes_and_duties` | Taxes et impôts | 63 | + (charge) |
| `is.payroll` | Charges de personnel | 64 | + (charge) |
| `is.other_operating_expenses` | Autres charges d'exploitation | 65 | + (charge) |
| `is.depreciation_amortization` | Dotations d'exploitation | 68 | + (charge) |

#### Résultats intermédiaires / net

| Identifiant | Libellé | Formule |
|-------------|---------|---------|
| `is.operating_profit` | Résultat d'exploitation | produits exploitation − charges exploitation |
| `is.financial_result` | Résultat financier | 76 − 66 |
| `is.exceptional_result` | Résultat exceptionnel | 77 − 67 |
| `is.income_tax` | Impôt sur les bénéfices | 69 |
| `is.net_income` | Résultat net | exploitation + financier + exceptionnel − impôt |

### 5.3 Convention de signe

- **Bilan Actif** : solde = SUM(debit - credit) → positif si débiteur (convention comptable naturelle).
- **Bilan Passif** : solde affiché = SUM(credit - debit) → positif si créditeur.
- **CR Produits** : affichés en positif (SUM credit - debit des comptes 7*).
- **CR Charges** : affichées en positif (SUM debit - credit des comptes 6*).
- **Résultat** : algébrique = produits − charges.

---

## 6. Definition of Done (opérationnelle)

| Ticket | DoD minimum |
|--------|-------------|
| **T43** | Endpoint Vault documenté ; rubriques alignées §9 ; `restitution_id` = `lynki.accounting.balance_sheet` ; `detail_level = "rubrics"` dans la réponse |
| **T44** | Idem pour CR ; rubriques alignées §10 ; signe métier correct (§10.4) |
| **T45** | Bloc Synthèse Actif / Passif lisible ; drill vers BG par rubrique ; pas de régression |
| **T46** | Bloc CR structuré ; résultat net calculé ; affichage charges/produits en positif |
| **T47** | Exports CSV cohérents ; mêmes colonnes de traçabilité que les exports existants |
| **T48** | Contrôle cohérence total rubriques ≈ total classes ; ALIGNEMENT, BACKLOG, rapport |

---

## 7. Recette — contrôles Sprint 08

### 7.1 Bilan rubriques (T43 / T45)

| Contrôle | Attendu |
|----------|---------|
| Rubriques actif | 6 rubriques peuplées (ou 0 si pas de données dans la plage) |
| Rubriques passif | 7 rubriques peuplées |
| Total actif | ≈ total classes 1–5 côté débiteur (contrôle ±1 % tolérance arrondi) |
| Drill | Clic rubrique → BG filtrée sur plage de comptes |
| Strict | 502 si Vault indisponible |

### 7.2 CR rubriques (T44 / T46)

| Contrôle | Attendu |
|----------|---------|
| Rubriques exploitation | 8 rubriques |
| Résultat net | = exploitation + financier + exceptionnel − impôt |
| Signe UI | Produits et charges affichés positifs ; résultat algébrique |
| Strict | 502 si Vault indisponible |

### 7.3 Exports (T47)

| Contrôle | Attendu |
|----------|---------|
| Bilan CSV | Rubriques avec identifiant `lynki.rubric.bs.*` + montant + période + tenant + referentiel_version |
| CR CSV | Idem avec `lynki.rubric.is.*` |
| Header | `X-Lynki-Accounting-Source: vault` |

### 7.4 Réconciliation / non-régression (T48)

| Contrôle | Attendu |
|----------|---------|
| BG existante | Inchangée |
| GL existant | Inchangé (filtre partenaire, pagination, export) |
| Premier incrément classe | Toujours accessible (backward compatible) |

---

## 8. Risques

| Risque | Mitigation |
|--------|------------|
| Mapping PCG incomplet ou ambigu (comptes mixtes actif/passif, 43/44 déb./créd.) | Tolérance : afficher rubriques peuplées, ignorer celles à zéro ; documenter les cas limites comme « à valider par dossier » (§9.4 / §10.4 du référentiel) |
| Performance sur agrégation par plages de comptes | Index sur `LEFT(account_code, N)` déjà utilisé Sprint 07 ; requêtes `WHERE account_code LIKE '20%'` plutôt que regex |
| Volume de code (13+ rubriques actif/passif + 13+ CR) | Factoriser un socle `RubricDefinition` (identifiant, libellé, pattern SQL, signe) côté storage |
| Signe métier incorrect (inversion actif/passif) | Tests unitaires par rubrique avec données connues ; contrôle réconciliation classes vs rubriques |

---

## 9. Sortie attendue (fin de sprint)

* **Bilan** : rubriques Actif (6) + Passif (7) = **13 rubriques** structurées, totaux, drill BG ;
* **CR** : rubriques Exploitation (8) + Résultats (5) = **13 rubriques** + résultat net ;
* **Exports** : CSV Bilan + CSV CR ;
* **Synthèse** : page avec 4 blocs (Bilan rubriques, CR rubriques, BG, placeholder balances tiers) ;
* **Réconciliation** : cohérence rubriques ↔ classes documentée ;
* **`RAPPORT_SPRINT_08_LYNKI.md`** rédigé.

---

## 10. Gates — cible fin Sprint 08

| Gate | Cible |
|------|-------|
| **Gate A** | inchangée |
| **Gate B** | **close** — inchangée |
| **Gate C** | **significativement renforcée** — Bilan + CR par rubriques + exports + GL enrichi |
| **Gate D** | inchangée (habilitations déjà en place Sprint 07) |

---

## 11. Après ce sprint

Suite logique :

1. **Balances tiers** (clients / fournisseurs) — bloc 3 de la spec Synthèse.
2. **Multi-période / comparatif N-1** — lecture performance dans le temps.
3. **SIG optionnels** (marge brute, VA, EBE/EBITDA) si arbitrage produit.
4. **Plan Sprint 09** — balances tiers + consolidation produit.

---

*Document d'exécution — extension Bilan / CR au palier rubriques, aligné REFERENTIEL_COMPTABLE §9–§10.*  
*Précédent : [PLAN_SPRINT_07_LYNKI.md](PLAN_SPRINT_07_LYNKI.md) **v1.0** · [RAPPORT_SPRINT_07_LYNKI.md](RAPPORT_SPRINT_07_LYNKI.md) **v1.1***

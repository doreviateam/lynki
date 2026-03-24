# Plan Sprint 09 — Lynki (Phase 2)

**Fichier canonique :** `PLAN_SPRINT_09_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** sprint exécutable — suite du [RAPPORT_SPRINT_08_LYNKI.md](RAPPORT_SPRINT_08_LYNKI.md) **v1.1** (Gate C significativement renforcée — rubriques Bilan/CR)

**Sources :** [RAPPORT_SPRINT_08_LYNKI.md](RAPPORT_SPRINT_08_LYNKI.md) **v1.1** · [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) **v1.1.1** · [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v2.0** · [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) **v2.1** · [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) **v1.1** (§11–§12 balances tiers, §8 drill-down) · [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) **v0.5** (bloc 3 — balances tiers) · **Rapport (squelette) :** [RAPPORT_SPRINT_09_LYNKI.md](RAPPORT_SPRINT_09_LYNKI.md) *(à créer)*

---

## 1. Objectif du sprint

Le Sprint 08 a livré des **restitutions métier par rubriques** (Bilan 13 rubriques, CR 13 rubriques + formules, exports CSV). La Synthèse comptable est structurée, lisible par un utilisateur finance — mais il manque encore :

1. Le **drill rubrique → BG filtrée** (reporté de T45), qui rend la chaîne de preuve opérationnelle : rubrique → comptes → écritures.
2. Les **balances tiers** (bloc 3 de la spec Synthèse §3 / §3.1 / §4), qui complètent la lecture du bilan par une vue orientée recouvrement / décaissement.
3. Un premier palier de **réconciliation terrain** rubriques ↔ classes sur des données réelles.

Le Sprint 09 complète donc la **surface Synthèse comptable** en livrant le dernier bloc manquant et la navigation comptable.

### Objectifs principaux

1. **Drill rubrique → BG filtrée** — clic sur une ligne de rubrique ouvre la balance générale pré-filtrée sur la plage de comptes concernée.
2. **Balances tiers — Vault + Linky + UI** — balance âgée clients (§11) et fournisseurs (§12) avec tranches d'ancienneté.
3. **Bloc Synthèse "Balances tiers"** — intégration dans `AccountingSummaryView.tsx`, lecture complémentaire du bilan.

### Objectifs secondaires

4. **Réconciliation terrain** — contrôle sur un tenant réel : rubriques ↔ classes, avec écarts documentés et justifiés.
5. **Documentation** : ALIGNEMENT, BACKLOG, RAPPORT_SPRINT_09.

**Hors sprint sauf arbitrage :**

- Multi-période / comparatif N-1 — Sprint 10+.
- SIG optionnels (`gross_margin`, `value_added`, `ebitda`) — Sprint 10+.
- Netting tiers (§12.6 du référentiel) — v1 avec netting natif Vault, sophistication ultérieure.
- Balances âgées multi-devises — hors scope v1 (devise de présentation unique).

---

## 2. Périmètre (lots / epics)

| Lot | Epic |
|-----|------|
| **Lot 2 (extension)** | Drill rubrique → BG filtrée (dette T45) |
| **Lot 2 (nouveau)** | Balances tiers — balance âgée clients + fournisseurs (référentiel §11–§12) |
| **Lot 2 (UI)** | Synthèse — bloc 3 "Balances tiers" + drill intégré |
| **0 / transversal** | Réconciliation terrain, non-régression, doc |

---

## 3. Dépendances

```text
Sprint 08 livré (rubriques Bilan/CR + exports)
        │
        ├──> rubriques bs.* / is.* en place avec patterns de comptes
        │
        ▼
T49 — Drill rubrique → BG filtrée (Linky UI)
        │
        ▼
T50 — Vault : balance âgée clients (storage + handlers)
        │
        ├──> T51 — Vault : balance âgée fournisseurs (même socle)
        │
        ▼
T52 — Linky : routes + UI bloc Balances tiers
        │
        ▼
T53 — Réconciliation terrain + non-régression + doc
```

---

## 4. Tickets (Sprint 09)

| # | Titre | Lot | Dépend de | Statut |
|---|-------|-----|-----------|--------|
| **T49** | **Drill rubrique → BG filtrée** | Lot 2 | Sprint 08 | todo |
| | Clic sur une ligne de rubrique Bilan ou CR ouvre la BG (`/accounting/trial-balance?…`) pré-filtrée sur la plage de comptes de la rubrique (ex. `account_from=20&account_to=27` pour les immobilisations). Nécessite un paramètre de filtre par plage de comptes sur la BG existante. | | | |
| **T50** | **Vault — balance âgée clients** | Lot 2 | Sprint 08 | todo |
| | Requête sur `account_move_lines` filtrant les comptes clients (411, 413, 416, 418) avec postes ouverts (non lettrés ou partiellement lettrés). Agrégation par partenaire avec tranches d'ancienneté (non échu, 0–30j, 31–60j, 61–90j, 91–180j, >180j). Handler `GET /api/accounting/aged-receivables`. | | | |
| **T51** | **Vault — balance âgée fournisseurs** | Lot 2 | T50 (socle partagé) | todo |
| | Même pattern que T50 sur les comptes fournisseurs (401, 403, 408). Handler `GET /api/accounting/aged-payables`. | | | |
| **T52** | **Linky — routes + UI bloc Balances tiers** | Lot 2 UI | T50 + T51 | todo |
| | Routes proxy `/api/accounting/aged-receivables` et `/api/accounting/aged-payables`. Composant `AgedBalanceBlock` dans `AccountingSummaryView.tsx` : tableau par partenaire avec tranches d'ancienneté, total par tranche, badge de fraîcheur. Placement en bloc 3 de la Synthèse (après Bilan/CR, avant BG). | | | |
| **T53** | **Réconciliation terrain + doc** | transversal | T49–T52 | todo |
| | Contrôle réconciliation rubriques ↔ classes sur un tenant réel. Non-régression BG/GL/rubriques/exports. ALIGNEMENT, BACKLOG, RAPPORT_SPRINT_09. | | | |

*(T50/T51 parallélisables si le socle "aged balance" est factorisé dès le début.)*

---

## 5. Détail technique

### 5.1 Drill rubrique → BG (T49)

Le composant `RubricsBlock` connaît déjà la liste de `RubricLine` avec `rubric_id`. Côté Vault, chaque `RubricDefinition` porte ses `AccountPatterns`. Il faut :

1. **Vault** : Enrichir la réponse `/api/accounting/balance-sheet/rubrics` et `/api/accounting/income-statement/rubrics` avec un champ `account_filter` par ligne de rubrique (ex. `"20,21,22,23,24,25,26,27"` pour `bs.fixed_assets`).
2. **Linky UI** : Rendre chaque ligne de rubrique cliquable — `router.push` vers la BG filtrée.
3. **BG filtrée** : Ajouter un paramètre de filtre `account_prefix` à la route trial-balance, filtrant sur `LEFT(account_code, 2) = ANY(…)`.

### 5.2 Balances âgées (T50 / T51)

#### Données nécessaires dans `account_move_lines`

- `partner_id`, `partner_name` — déjà disponibles (Sprint 07 T37).
- `date_maturity` (date d'échéance) — **à vérifier** si le connecteur Odoo l'alimente déjà. Sinon, fallback sur `line_date`.
- `full_reconcile_id` / `matching_number` — indicateur de lettrage. **À vérifier** : si non disponible, première version basée sur le solde par partenaire (approximation).

#### Modèle de données

```go
type AgedBalanceLine struct {
    PartnerID   int32   `json:"partner_id"`
    PartnerName string  `json:"partner_name"`
    NotDue      float64 `json:"not_due"`
    Range0_30   float64 `json:"range_0_30"`
    Range31_60  float64 `json:"range_31_60"`
    Range61_90  float64 `json:"range_61_90"`
    Range91_180 float64 `json:"range_91_180"`
    RangeOver180 float64 `json:"range_over_180"`
    Total       float64 `json:"total"`
}

type AgedBalanceResult struct {
    Lines       []AgedBalanceLine
    AsOfDate    string // date d'observation
    Complete    bool
    Coverage    string
}
```

#### Requête SQL (principe)

```sql
SELECT partner_id, partner_name,
       SUM(CASE WHEN age_days IS NULL OR age_days < 0 THEN amount ELSE 0 END) AS not_due,
       SUM(CASE WHEN age_days BETWEEN 0 AND 30 THEN amount ELSE 0 END) AS range_0_30,
       ...
FROM (
    SELECT partner_id, partner_name,
           (observation_date - COALESCE(date_maturity, line_date))::int AS age_days,
           (debit - credit) AS amount
    FROM account_move_lines
    WHERE tenant = $1
      AND line_date <= $2::date
      AND account_code LIKE '411%' OR account_code LIKE '413%' ...
      AND (full_reconcile_id IS NULL OR full_reconcile_id = '')
) sub
GROUP BY partner_id, partner_name
ORDER BY total DESC
```

**Point d'attention :** la première version peut approximer le lettrage par l'absence de `full_reconcile_id`. Si cette colonne n'est pas encore dans le schéma, on travaille sur le solde cumulé par partenaire, ce qui est déjà informatif.

### 5.3 Convention de signe — balances tiers

- **Clients** : montant positif = créance (débit - crédit, signe naturel des comptes 411).
- **Fournisseurs** : montant positif = dette (crédit - débit, inversion pour affichage métier).

### 5.4 UI — bloc Synthèse "Balances tiers"

Placement dans la page :

```
┌─ Synthèse comptable ─────────────────────────┐
│ ┌───────────────┐  ┌───────────────┐          │
│ │ Bilan         │  │ CR            │  rubriques│
│ │ (rubriques)   │  │ (rubriques)   │          │
│ └───────────────┘  └───────────────┘          │
│ ┌──────────────────────────────────┐          │
│ │ Balances tiers                   │  bloc 3  │
│ │   Clients (aged receivables)     │          │
│ │   Fournisseurs (aged payables)   │          │
│ └──────────────────────────────────┘          │
│ ┌──────────────────────────────────┐          │
│ │ Balance générale (BG)            │  bloc 4  │
│ └──────────────────────────────────┘          │
│ <details> Classes PCG (premier incrément)     │
└───────────────────────────────────────────────┘
```

---

## 6. Definition of Done (opérationnelle)

| Ticket | DoD minimum |
|--------|-------------|
| **T49** | Clic rubrique → BG filtrée ; plage de comptes transmise ; pas de régression sur la BG non filtrée |
| **T50** | Endpoint Vault documenté ; tranches d'ancienneté correctes ; `restitution_id = "lynki.accounting.aged_receivables"` |
| **T51** | Idem pour fournisseurs ; `restitution_id = "lynki.accounting.aged_payables"` |
| **T52** | Bloc Synthèse tiers lisible ; total par tranche ; placement correct dans la hiérarchie |
| **T53** | Réconciliation rubriques ↔ classes documentée ; non-régression BG/GL/rubriques/exports ; rapport |

---

## 7. Recette — contrôles Sprint 09

### 7.1 Drill rubrique → BG (T49)

| Contrôle | Attendu |
|----------|---------|
| Clic rubrique Bilan | Ouvre la BG filtrée sur la plage de comptes |
| Clic rubrique CR | Idem |
| BG sans filtre | Inchangée (pas de régression) |

### 7.2 Balance âgée clients (T50)

| Contrôle | Attendu |
|----------|---------|
| Lignes par partenaire | Partenaires avec solde non nul |
| Tranches d'ancienneté | 6 tranches (non échu, 0–30, 31–60, 61–90, 91–180, >180) |
| Total par tranche | Somme cohérente avec rubrique `bs.trade_receivables` (tolérance ±lettrage partiel) |

### 7.3 Balance âgée fournisseurs (T51)

| Contrôle | Attendu |
|----------|---------|
| Lignes par partenaire | Partenaires avec solde non nul |
| Total | Cohérent avec rubrique `bs.trade_payables` (tolérance ±lettrage partiel) |

### 7.4 Bloc UI tiers (T52)

| Contrôle | Attendu |
|----------|---------|
| Placement | Entre Bilan/CR et BG |
| Affichage | Tableau par partenaire, colonnes tranches, total |
| Strict mode | 502 si Vault indisponible |

### 7.5 Non-régression (T53)

| Contrôle | Attendu |
|----------|---------|
| Rubriques Bilan/CR | Inchangées |
| Exports CSV | Inchangés |
| BG / GL | Inchangés |
| Backward compat classes | Toujours accessible |

---

## 8. Risques

| Risque | Mitigation |
|--------|------------|
| `date_maturity` / `full_reconcile_id` absents du schéma `account_move_lines` | V1 basée sur le solde cumulé par partenaire (sans lettrage) ; migration à prévoir si les colonnes manquent |
| Volume de partenaires élevé | Pagination ou top-N par défaut avec option "Voir tout" |
| Netting tiers complexe (avoirs, acomptes) | V1 sans netting sophistiqué ; documenter comme limite Sprint 09 |
| Drill rubrique → BG : filtre par plage de comptes non trivial | Utiliser `account_code LIKE '20%' OR account_code LIKE '21%' …` côté Vault, paramètre `account_prefix` côté Linky |

---

## 9. Sortie attendue (fin de sprint)

* **Drill** : navigation rubrique → BG filtrée opérationnelle ;
* **Balances tiers** : clients (T50) + fournisseurs (T51), 6 tranches d'ancienneté par partenaire ;
* **Synthèse complète** : page avec **4 blocs** (Bilan rubriques, CR rubriques, Balances tiers, BG) — spec §3 remplie ;
* **Réconciliation** : contrôle terrain documenté ;
* **`RAPPORT_SPRINT_09_LYNKI.md`** rédigé.

---

## 10. Gates — cible fin Sprint 09

| Gate | Cible |
|------|-------|
| **Gate A** | inchangée |
| **Gate B** | **close** — inchangée |
| **Gate C** | **substantiellement avancée** — surface Synthèse comptable complète (4 blocs + drill) |
| **Gate D** | inchangée |

---

## 11. Après ce sprint

Suite logique :

1. **Multi-période / comparatif N-1** — lecture performance dans le temps.
2. **SIG optionnels** (marge brute, VA, EBE/EBITDA) si arbitrage produit.
3. **Netting tiers sophistiqué** (avoirs, lettrages partiels) si besoin terrain.
4. **Exports balances tiers** CSV.
5. **Réconciliation formalisée** avec seuils d'alerte par tenant.

---

*Document d'exécution — drill rubrique → BG + balances tiers, aligné REFERENTIEL_COMPTABLE §11–§12 et SPEC_ECRAN_SYNTHESE §3.*  
*Précédent : [PLAN_SPRINT_08_LYNKI.md](PLAN_SPRINT_08_LYNKI.md) **v1.0** · [RAPPORT_SPRINT_08_LYNKI.md](RAPPORT_SPRINT_08_LYNKI.md) **v1.1***

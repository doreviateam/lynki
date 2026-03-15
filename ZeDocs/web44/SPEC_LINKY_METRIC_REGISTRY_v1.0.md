# SPEC — Linky Metric Registry

**Version :** 1.1  
**Date :** 13 mars 2026  
**Produit :** Dorevia Linky  
**Statut :** Spécification technique

---

## 1. Objectif

Définir le **registre des métriques financières** utilisées par les instruments Linky.

Chaque métrique est une **valeur calculée à partir d'événements financiers scellés dans le Dorevia Vault**. Le registre précise :

- l'identifiant et le libellé
- la formule ou le type de calcul
- les dépendances (événements, métriques intermédiaires)
- les événements Vault source

Ce document transforme le cockpit en **moteur d'observation financière** : toute nouvelle métrique doit être enregistrée ici avant implémentation.

---

## 2. Structure d'une métrique

### 2.1 Champs obligatoires

| Champ             | Description                              |
|-------------------|------------------------------------------|
| metric_id         | Identifiant unique                       |
| label             | Libellé affiché                          |
| metric_class      | `base` ou `derived` (voir §2.2)          |
| metric_type       | Nature de la métrique (voir §2.3)        |
| metric_category   | Catégorie fonctionnelle (voir §2.4)      |
| value_type        | Type de valeur (currency, ratio, count)  |
| formula           | Formule de calcul ou type d'agrégation   |
| dependencies      | Métriques ou événements requis           |
| events            | Types d'événements Vault utilisés        |
| calculation_scope | `realtime` ou `batch` (voir §2.5)        |
| unit              | Unité d'affichage                        |
| instrument        | Instrument Linky associé                 |

### 2.2 metric_class

| Valeur   | Description                                      |
|----------|--------------------------------------------------|
| base     | Dérivée directement des événements Vault         |
| derived  | Calculée à partir d'autres métriques             |

### 2.3 metric_type

| Valeur   | Description           |
|----------|-----------------------|
| position | État instantané       |
| flow     | Flux                  |
| exposure | Exposition (risque)   |
| performance | Performance       |

### 2.4 metric_category

| Valeur       | Description     |
|--------------|-----------------|
| liquidity    | Liquidité       |
| activity     | Activité        |
| risk         | Risque          |
| adjustments  | Ajustements     |
| performance  | Performance     |

### 2.5 calculation_scope

| Valeur   | Description                    |
|----------|--------------------------------|
| realtime | Recalculé à la demande / temps réel |
| batch    | Recalculé par période (jour, mois)  |

---

## 3. Références

| Document | Rôle |
|----------|------|
| `SPEC_LINKY_INSTRUMENT_MODEL_v1.0.md` | Définition des instruments |
| `SPEC_LINKY_COCKPIT_INSTRUMENTS_v1.0.md` | Contexte fonctionnel |
| `SPEC_DVIG_EVENT_REGISTRY_v1.0.md` | Nomenclature des événements (à créer) |

---

## 4. Registre des métriques

---

### 4.1 treasury_balance

**Position de trésorerie validée.**

```yaml
metric_id: treasury_balance
label: Solde trésorerie
metric_class: base
metric_type: position
metric_category: liquidity
value_type: currency
formula: balance
  # Solde = Σ(payment.received) - Σ(payment.sent)
  # Position validée par le Vault (rapprochement bancaire)
dependencies: []
events:
  - payment.received
  - payment.sent
calculation_scope: realtime
unit: EUR
instrument: treasury
```

---

### 4.2 commercial_margin

**Marge commerciale (Ventes HT - Achats HT).**

```yaml
metric_id: commercial_margin
label: Marge commerciale
metric_class: derived
metric_type: performance
metric_category: performance
value_type: currency
formula: difference
  # commercial_margin = sales_ht - purchases_ht
dependencies:
  - sales_ht      # Σ(invoice.posted, amount)
  - purchases_ht  # Σ(vendor.bill.posted, amount)
events:
  - invoice.posted
  - vendor.bill.posted
calculation_scope: batch
unit: EUR
instrument: business
```

---

### 4.3 net_cash_flow

**Flux net de trésorerie (Encaissements - Décaissements).**

```yaml
metric_id: net_cash_flow
label: Flux net de trésorerie
metric_class: base
metric_type: flow
metric_category: liquidity
value_type: currency
formula: difference
  # net_cash_flow = Σ(payment.received) - Σ(payment.sent)
dependencies: []
events:
  - payment.received
  - payment.sent
calculation_scope: realtime
unit: EUR
instrument: cash_flow
```

---

### 4.4 working_capital_requirement

**Besoin en fonds de roulement.**

```yaml
metric_id: working_capital_requirement
label: BFR
metric_class: derived
metric_type: exposure
metric_category: liquidity
value_type: currency
formula: formula
  # BFR = créances_clients + stocks - dettes_fournisseurs
  # créances_clients = encours factures clients non soldées
  # stocks = stock.valuation (optionnel)
  # dettes_fournisseurs = encours factures fournisseurs non soldées
dependencies:
  - accounts_receivable
  - stock_valuation    # optionnel
  - accounts_payable
events:
  - invoice.posted
  - vendor.bill.posted
  - payment.received
  - payment.sent
  - stock.valuation    # optionnel
calculation_scope: batch
unit: EUR
instrument: working_capital
```

---

### 4.5 payments_received

**Montant des encaissements.**

```yaml
metric_id: payments_received
label: Paiements reçus
metric_class: base
metric_type: flow
metric_category: activity
value_type: currency
formula: sum
  # Σ(payment.received, amount)
dependencies: []
events:
  - payment.received
calculation_scope: realtime
unit: EUR
instrument: payments
```

---

### 4.6 accounts_receivable

**Encours clients (créances non soldées).**

```yaml
metric_id: accounts_receivable
label: Encours clients
metric_class: base
metric_type: exposure
metric_category: risk
value_type: currency
formula: sum
  # Σ(invoice.posted, open_amount) - Σ(payment.received alloués)
  # Ou : solde des factures clients non soldées
dependencies: []
events:
  - invoice.posted
  - payment.received
calculation_scope: realtime
unit: EUR
instrument: receivables
```

---

### 4.7 vat_due

**TVA à payer.**

```yaml
metric_id: vat_due
label: TVA à payer
metric_class: derived
metric_type: position
metric_category: risk
value_type: currency
formula: difference
  # vat_due = TVA_collectée - TVA_déductible
  # TVA_collectée = Σ(invoice.posted, vat_amount)
  # TVA_déductible = Σ(vendor.bill.posted, vat_amount)
dependencies:
  - vat_collected
  - vat_deductible
events:
  - invoice.posted
  - vendor.bill.posted
calculation_scope: batch
unit: EUR
instrument: taxes
```

---

### 4.8 pos_revenue

**Chiffre d'affaires POS.**

```yaml
metric_id: pos_revenue
label: CA POS
metric_class: base
metric_type: flow
metric_category: activity
value_type: currency
formula: sum
  # Σ(pos.order.closed, amount)
dependencies: []
events:
  - pos.order.closed
calculation_scope: realtime
unit: EUR
instrument: pos_activity
```

---

### 4.9 credit_notes_amount

**Montant des notes de crédit émises.**

```yaml
metric_id: credit_notes_amount
label: Notes de crédit
metric_class: base
metric_type: flow
metric_category: adjustments
value_type: currency
formula: sum
  # Σ(credit.note.issued, amount)
dependencies: []
events:
  - credit.note.issued
calculation_scope: batch
unit: EUR
instrument: credit_notes
```

---

### 4.10 refunds_amount

**Montant des remboursements.**

```yaml
metric_id: refunds_amount
label: Remboursements
metric_class: base
metric_type: flow
metric_category: adjustments
value_type: currency
formula: sum
  # Σ(refund.issued, amount)
dependencies: []
events:
  - refund.issued
calculation_scope: batch
unit: EUR
instrument: refunds
```

---

### 4.11 pos_closure_total

**Total des clôtures de caisse (Z).**

```yaml
metric_id: pos_closure_total
label: Z de caisse
metric_class: base
metric_type: flow
metric_category: activity
value_type: currency
formula: sum
  # Σ(pos.session.closed, total)
dependencies: []
events:
  - pos.session.closed
calculation_scope: realtime
unit: EUR
instrument: pos_closure
```

---

### 4.12 operating_result

**Excédent brut d'exploitation (EBE).**

```yaml
metric_id: operating_result
label: EBE
metric_class: derived
metric_type: performance
metric_category: performance
value_type: currency
formula: formula
  # EBE = CA - achats - charges_opérationnelles
  # CA = Σ(invoice.posted) - Σ(credit.note.issued)
  # achats = Σ(vendor.bill.posted, achats)
  # charges_opérationnelles = Σ(expense.recorded) ou Σ(vendor.bill, charges)
dependencies:
  - revenue
  - purchases
  - operating_expenses
events:
  - invoice.posted
  - vendor.bill.posted
  - credit.note.issued
  - expense.recorded   # ou dérivé de vendor.bill
calculation_scope: batch
unit: EUR
instrument: ebitda
```

---

## 5. Graphe des dépendances

```
                    ERP / POS / Payments
                              │
                              ▼
                         DVIG
                              │
                              ▼
                    ┌───────────────────────────────────┐
                    │         VAULT                     │
                    │  (événements financiers scellés)  │
                    └───────────────────────────────────┘
                              │
                              ▼
                    ┌───────────────────────────────────┐
                    │         Base Metrics              │
                    │  (metric_class: base)             │
                    │  sum, difference, balance        │
                    └───────────────────────────────────┘
                              │
                              ▼
                    ┌───────────────────────────────────┐
                    │         Derived Metrics           │
                    │  (metric_class: derived)          │
                    │  BFR, EBE, commercial_margin      │
                    └───────────────────────────────────┘
                              │
                              ▼
                    ┌───────────────────────────────────┐
                    │         Instruments               │
                    │  (Instrument Model)                │
                    └───────────────────────────────────┘
                              │
                              ▼
                    ┌───────────────────────────────────┐
                    │         Linky Cockpit             │
                    │  (tuiles + cards)                 │
                    └───────────────────────────────────┘
```

---

## 6. Règles d'extension

Pour ajouter une nouvelle métrique :

1. Définir `metric_id`, `label`, `metric_class`, `metric_type`, `metric_category`, `value_type`, `formula`
2. Lister les `dependencies` (métriques ou événements)
3. Lister les `events` Vault requis
4. Définir `calculation_scope` (realtime ou batch)
5. Associer à un `instrument` existant ou nouveau
6. Mettre à jour ce registre avant implémentation

---

## 7. Métriques candidates (extension future)

| metric_id           | label                    | formula   | statut   |
|---------------------|--------------------------|-----------|----------|
| net_margin          | Marge nette              | formula   | À venir  |
| stock_turnover      | Rotation stock           | ratio     | À venir  |
| average_payment_delay| Délai moyen de paiement  | formula   | À venir  |
| customer_risk_score | Score risque client      | formula   | À venir  |

---

## Historique des versions

| Version | Date       | Modifications                                                                 |
|---------|------------|-------------------------------------------------------------------------------|
| 1.0     | 13 mars 26 | Version initiale                                                              |
| 1.1     | 13 mars 26 | metric_type, metric_class, metric_category, calculation_scope ; graphe architecture |

---

*Fin de la spécification*

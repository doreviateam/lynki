# SPEC — Linky Instrument Model

**Version :** 1.1  
**Date :** 13 mars 2026  
**Produit :** Dorevia Linky  
**Statut :** Spécification technique

---

## 1. Objectif

Définir le **modèle structurel des instruments financiers Linky**.

Un instrument est une **vue synthétique calculée à partir d'événements financiers scellés dans le Dorevia Vault**.

Les instruments permettent d'extraire :

- des métriques financières
- des indicateurs synthétiques
- des signaux de pilotage

Chaque instrument repose sur les éléments suivants :

| Élément        | Rôle                    |
|----------------|-------------------------|
| Instrument     | Vue synthétique         |
| Metric         | Valeur calculée         |
| Aggregation    | Méthode de calcul       |
| Time Window    | Période observée        |
| Source Events  | Types d'événements Vault|

---

## 2. Modèle conceptuel

```
Vault Events
      ↓
Aggregation Engine
      ↓
Metric
      ↓
Instrument
      ↓
Cockpit Tile
      ↓
Detailed Card
```

### 2.1 Position de l'Aggregation Engine

L'Aggregation Engine peut être implémenté :

- **dans le Vault** : pour les positions financières (balance, ledger)
- **dans les services analytiques Linky** : pour les indicateurs dérivés (BFR, EBE, ratios)

---

## 3. Structure d'un instrument

Chaque instrument est défini par :

| Champ          | Description                        |
|----------------|------------------------------------|
| instrument_id  | Identifiant unique                 |
| label          | Nom affiché (obligatoire pour l'UI)|
| metric         | Métrique principale                |
| aggregation    | Méthode d'agrégation               |
| time_window    | Période observée                   |
| source_events  | Types d'événements utilisés         |
| unit           | Unité d'affichage                  |
| card_view      | Vue détaillée associée             |

**Convention :** `card_view` est dérivé automatiquement de `instrument_id` (ex. `treasury` → `TreasuryCard`). Pour la v1, cette convention suffit.

---

## 4. Concepts fondamentaux

### 4.1 Metric

Une **metric** est une valeur financière calculée.

**Exemples :**

- trésorerie
- chiffre d'affaires
- flux de paiements
- encours client
- EBE

**Exemple :**

```yaml
metric_id: treasury_balance
type: currency
unit: EUR
```

### 4.2 Aggregation

Méthode utilisée pour calculer la metric.

**Types d'agrégations possibles :**

| Type         | Description           |
|--------------|-----------------------|
| sum          | Somme                 |
| difference   | Différence            |
| ratio        | Ratio                 |
| balance      | Position financière   |
| distribution | Regroupement         |
| formula      | Formule dérivée      |

**Exemple :**

```yaml
aggregation: sum
```

### 4.3 Time Window

Période temporelle sur laquelle l'instrument est calculé.

| Type    | Description        |
|---------|--------------------|
| realtime| Temps réel         |
| day     | Journée            |
| month   | Mois               |
| period  | Période comptable  |
| rolling | Période glissante  |

**Exemple :**

```yaml
time_window: month
```

### 4.4 Source Events

Liste des types d'événements Vault utilisés.

**Référence :** La nomenclature des événements doit être alignée avec le registre DVIG. Voir :

- `SPEC_DVIG_EVENT_REGISTRY_v1.0.md` (à créer)

**Exemples conventionnels :**

- `invoice.posted`
- `payment.received`
- `pos.session.closed`
- `credit.note.issued`

**Exemple :**

```yaml
source_events:
  - invoice.posted
  - payment.received
```

### 4.5 Unité et devise

La v1 du cockpit Linky est **mono-devise**. La devise affichée correspond à la devise principale du tenant. Tous les instruments utilisent `unit: EUR` par défaut.

---


## 5. Définition des 12 instruments

---

### 5.1 TRÉSORERIE

```yaml
instrument_id: treasury
label: TRÉSORERIE
metric: treasury_balance
aggregation: balance
time_window: realtime
source_events:
  - payment.received
  - payment.sent
  # bank.transaction optionnel si disponible
unit: EUR
```

---

### 5.2 BUSINESS

```yaml
instrument_id: business
label: BUSINESS
metric: commercial_margin
aggregation: difference
time_window: month
source_events:
  - invoice.posted
  - vendor.bill.posted
unit: EUR
```

---

### 5.3 CASH

```yaml
instrument_id: cash_flow
label: CASH
metric: net_cash_flow
aggregation: difference
time_window: day
source_events:
  - payment.received
  - payment.sent
unit: EUR
```

---

### 5.4 BFR

> **Note :** BFR partiel si `stock.valuation` non disponible dans le Vault.

```yaml
instrument_id: working_capital
label: BFR
metric: working_capital_requirement
aggregation: formula
time_window: realtime
source_events:
  - invoice.posted
  - vendor.bill.posted
  - stock.valuation  # optionnel selon périmètre Vault
unit: EUR
```

---

### 5.5 PAIEMENTS

```yaml
instrument_id: payments
label: PAIEMENTS
metric: payments_received
aggregation: sum
time_window: day
source_events:
  - payment.received
unit: EUR
```

---

### 5.6 ENCOURS

```yaml
instrument_id: receivables
label: ENCOURS
metric: accounts_receivable
aggregation: sum
time_window: realtime
source_events:
  - invoice.posted
  - payment.received
unit: EUR
```

---

### 5.7 TAXES

```yaml
instrument_id: taxes
label: TAXES
metric: vat_due
aggregation: difference
time_window: month
source_events:
  - invoice.posted
  - vendor.bill.posted
unit: EUR
```

---

### 5.8 POS

```yaml
instrument_id: pos_activity
label: POS
metric: pos_revenue
aggregation: sum
time_window: day
source_events:
  - pos.order.closed
unit: EUR
```

---

### 5.9 NOTES DE CRÉDIT

```yaml
instrument_id: credit_notes
label: CRÉDITS
metric: credit_notes_amount
aggregation: sum
time_window: month
source_events:
  - credit.note.issued
unit: EUR
```

---

### 5.10 REMBOURSEMENTS

```yaml
instrument_id: refunds
label: REMBOURSEMENTS
metric: refunds_amount
aggregation: sum
time_window: month
source_events:
  - refund.issued
unit: EUR
```

---

### 5.11 Z DE CAISSE

```yaml
instrument_id: pos_closure
label: Z CAISSE
metric: pos_closure_total
aggregation: sum
time_window: day
source_events:
  - pos.session.closed
unit: EUR
```

---

### 5.12 EBE

> **Note :** Les charges opérationnelles peuvent être dérivées de `vendor.bill.posted` si `expense.recorded` n'est pas disponible.

```yaml
instrument_id: ebitda
label: EBE
metric: operating_result
aggregation: formula
time_window: month
source_events:
  - invoice.posted
  - vendor.bill.posted
  - expense.recorded  # ou dérivé de vendor.bill
unit: EUR
```

---

## 6. Mapping implémentation

| instrument_id  | Composant Linky              | Statut      |
|----------------|------------------------------|-------------|
| treasury       | TresoreriePositionCard, TreasuryCard | ✓ Implémenté |
| business       | BusinessCard                 | ✓ Implémenté |
| cash_flow      | FluxCashCard                 | ✓ Implémenté |
| working_capital| —                            | À venir     |
| payments       | Intégré dans TreasuryCard    | ✓ Implémenté |
| receivables    | ArByPartner (BusinessCard)   | ✓ Implémenté |
| taxes          | TaxesCard                    | ✓ Implémenté |
| pos_activity   | PosShopsView                 | ✓ Implémenté |
| credit_notes   | CreditNotesCard              | ✓ Implémenté |
| refunds        | RefundsCard                  | ✓ Implémenté |
| pos_closure    | PosComingSoonView (Z caisse) | En cours    |
| ebitda         | —                            | À venir     |

---

## 7. Utilisation dans Linky

Chaque instrument alimente :

```
cockpit tile
      ↓
detailed card
      ↓
analytics view
```

---

## 8. Avantages de ce modèle

**Architecture :**

- extensible
- événementielle
- auditable
- compatible multi-ERP

---

## 9. Extension future

Nouveaux instruments possibles :

- marge nette
- rotation stock
- délai moyen de paiement
- score de risque client

---

---

## Historique des versions

| Version | Date       | Modifications                                      |
|---------|------------|----------------------------------------------------|
| 1.0     | 13 mars 26 | Version initiale                                   |
| 1.1     | 13 mars 26 | label, card_view convention, Aggregation Engine, Event Registry, mapping implémentation, notes BFR/EBE |

---

*Fin de la spécification*

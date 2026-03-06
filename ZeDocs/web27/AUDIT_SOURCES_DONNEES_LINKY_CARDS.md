# Audit des sources de données — Cartes Linky

**Date** : 21 février 2026  
**Contexte** : Vérification de la chaîne données pour toutes les cards du cockpit Linky.

---

## 1. Vue d’ensemble

| Carte Linky | Route Vault | Source réelle | Statut |
|-------------|-------------|---------------|--------|
| **Trésorerie validée** | `/ui/aggregations/treasury` | Odoo (proxy) | ⚠️ Odoo endpoint manquant |
| **Cash** | `payments-in` + `payments-out` | Vault DB ← Odoo/DVIG | ✅ Opérationnel |
| **Business** | `sales` + `purchases` | Vault DB ← Odoo/DVIG | ✅ Opérationnel |
| **Taxes** | `sales` + `purchases` | Vault DB ← Odoo/DVIG | ✅ Opérationnel |
| **Notes de crédit** | `adjustments` | Vault DB ← Odoo/DVIG | ✅ Opérationnel |
| **Remboursements** | `adjustments` | Vault DB ← Odoo/DVIG | ✅ Opérationnel |
| **Points de vente** | `/ui/aggregations/pos-sessions` | — | ❌ Route absente |
| **Z de caisse** | (dérivé pos-sessions ou autre) | — | ❌ Non implémenté |

---

## 2. Détail par carte

### 2.1 Trésorerie validée + En attente de rapprochement

| Élément | Valeur |
|---------|--------|
| **Route Linky** | `GET /api/treasury` → Vault `GET /ui/aggregations/treasury` |
| **Handler Vault** | `TreasuryAggregationHandler` → proxy vers `ODOO_BANK_RECONCILIATION_URL` |
| **Source réelle** | **Odoo** `GET /dorevia/vault/linky_bank_reconciliation` |
| **Données** | `account.bank.statement.line` (is_reconciled, amount) |
| **Statut** | ❌ Endpoint Odoo **non implémenté** → stub 0 € |

---

### 2.2 Cash (Encaissements − Décaissements)

| Élément | Valeur |
|---------|--------|
| **Routes Linky** | `GET /api/payments-in` + `GET /api/payments-out` |
| **Routes Vault** | `GET /ui/aggregations/payments-in` et `payments-out` |
| **Handler Vault** | `PaymentsInAggregationHandler` / `PaymentsOutAggregationHandler` → DB |
| **Source réelle** | **Vault DB** (table documents, type payment) |
| **Origine des données** | Odoo → DVIG (event payment.posted) → Vault POST /api/v1/payments |
| **Statut** | ✅ Opérationnel |

---

### 2.3 Business (Ventes HT − Achats HT)

| Élément | Valeur |
|---------|--------|
| **Routes Linky** | `GET /api/sales` + `GET /api/purchases` |
| **Routes Vault** | `GET /ui/aggregations/sales` et `purchases` |
| **Handler Vault** | `SalesAggregationHandler` / `PurchasesAggregationHandler` → DB |
| **Source réelle** | **Vault DB** (documents, event_type out_invoice / in_invoice) |
| **Origine des données** | Odoo → DVIG (invoice.posted) → Vault POST /api/v1/events |
| **Statut** | ✅ Opérationnel |

---

### 2.4 Taxes (TVA collectée − TVA déductible)

| Élément | Valeur |
|---------|--------|
| **Calcul** | Dérivé de `sales` (total_tax) et `purchases` (total_tax) |
| **Source réelle** | **Vault DB** (même que Business) |
| **Statut** | ✅ Opérationnel |

---

### 2.5 Notes de crédit

| Élément | Valeur |
|---------|--------|
| **Route Linky** | Via `dashboard-metrics` → `fetchJson("/ui/aggregations/adjustments", event_type: credit_note.*)` |
| **Route Vault** | `GET /ui/aggregations/adjustments` |
| **Handler Vault** | `AdjustmentsAggregationHandler` → DB |
| **Source réelle** | **Vault DB** (documents, event_type credit_note.customer.issued / supplier.received) |
| **Origine des données** | Odoo → DVIG → Vault |
| **Statut** | ✅ Opérationnel |

---

### 2.6 Remboursements

| Élément | Valeur |
|---------|--------|
| **Route Linky** | Via `dashboard-metrics` → `fetchJson("/ui/aggregations/adjustments", event_type: refund.*)` |
| **Source réelle** | **Vault DB** (event_type refund.customer.paid / supplier.received) |
| **Statut** | ✅ Opérationnel |

---

### 2.7 Points de vente (POS)

| Élément | Valeur |
|---------|--------|
| **Route Linky** | `fetchJson("/ui/aggregations/pos-sessions", ...)` dans dashboard-metrics |
| **Route Vault** | `GET /ui/aggregations/pos-sessions` |
| **Statut** | ❌ **Route non enregistrée** dans le Vault → 404 → `posRes = null` → `posItems = []` |
| **Données attendues** | Sessions POS (total_sales, vault_status, difference, etc.) |

---

### 2.8 Z de caisse

| Élément | Valeur |
|---------|--------|
| **Source** | Lié aux sessions POS / rapports de caisse |
| **Statut** | ❌ Non implémenté (carte affiche `-`) |

---

## 3. Flux de données — synthèse

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SOURCES OPÉRATIONNELLES                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Odoo (ERP)                                                                │
│   ├── invoice.posted, payment.posted, credit_note.*, refund.*               │
│   │       │                                                                 │
│   │       ▼                                                                 │
│   └── DVIG ──────────────────────► Vault POST /api/v1/events               │
│                                           │                                 │
│                                           ▼                                 │
│                                    Vault DB (documents)                     │
│                                           │                                 │
│                                           ▼                                 │
│   Linky ◄────────────────────────  Vault GET /ui/aggregations/*            │
│           (sales, purchases, payments-in/out, adjustments)                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           SOURCES MANQUANTES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Trésorerie validée :                                                      │
│   Linky → Vault /treasury → Odoo /dorevia/vault/linky_bank_reconciliation  │
│                           ❌ Endpoint Odoo absent                           │
│                                                                             │
│   POS / Z de caisse :                                                       │
│   Linky → Vault /ui/aggregations/pos-sessions                               │
│                           ❌ Route Vault absente                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Actions recommandées

| Priorité | Action | Fichier / composant |
|----------|--------|---------------------|
| P0 | Implémenter l’endpoint Odoo `linky_bank_reconciliation` | Module Odoo (ex. dorevia_vault_connector) |
| P1 | Créer la route Vault `/ui/aggregations/pos-sessions` | `sources/vault/internal/server/replay.go` + handler |
| P2 | Vérifier l’enregistrement de `bank-reconciliation-health` si utilisé | `cmd/vault/main.go` |

---

## 5. Références

- SPEC Indicateur Confiance Rapprochement : `ZeDocs/web15/SPEC_INDICATEUR_CONFIANCE_RAPPROCHEMENT_BANCAIRE_LINKY_v1.0.md`
- RECONCIL (architecture event-based) : `ZeDocs/web16/RECONCIL.md`
- dashboard-metrics : `units/dorevia-linky/app/api/dashboard-metrics/route.ts`

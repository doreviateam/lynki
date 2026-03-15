# SPEC — DVIG Event Registry

**Version :** 1.0  
**Date :** 13 mars 2026  
**Produit :** Dorevia Vault / DVIG  
**Statut :** Spécification de référence

---

## 1. Objectif

Définir la **nomenclature normative des événements financiers** circulant dans le pipeline :

```
ERP / POS
   ↓
DVIG (ingest)
   ↓
VAULT (canonical storage)
   ↓
LINKY (aggregations)
```

Ce registre est la **source unique de vérité** pour :
- les noms des `event_type` acceptés par DVIG
- le mapping vers les types canoniques stockés dans le Vault
- les consommateurs (métriques Linky) de chaque événement

---

## 2. Niveaux d'événements

| Niveau | Description | Qui produit | Qui consomme |
|--------|-------------|-------------|--------------|
| **Raw** | Événements bruts envoyés par l'ERP via DVIG | Odoo / connecteur | DVIG → mapper |
| **Canonical** | Événements normalisés stockés dans le Vault | DVIG (mapper) | Vault / Linky |
| **Adjustment** | Événements d'ajustement (avoirs, remboursements) | Odoo / connecteur | Vault adjustments |
| **Reconciliation** | Événements de rapprochement bancaire | Odoo / connecteur | Vault projection RECONCIL |

---

## 3. Registre des événements

---

### 3.1 Événements de facturation

#### `invoice.posted` _(raw)_

**Emetteur :** Odoo (connecteur `dorevia_vault_connector`)  
**Cible :** DVIG `/ingest`  
**Mapping :** → `invoice_issued` (out_invoice) ou `invoice_refund` (out_refund / in_refund)

| Champ payload | Type | Description |
|---------------|------|-------------|
| `event_type` | string | `"invoice.posted"` |
| `source` | string | `"odoo"` |
| `data.name` | string | Référence facture (ex: `INV/2026/0001`) |
| `data.move_type` | string | `out_invoice`, `in_invoice`, `out_refund`, `in_refund` |
| `data.amount_total` | float | Montant TTC |
| `data.amount_untaxed` | float | Montant HT |
| `data.amount_tax` | float | Montant TVA |
| `data.currency` | string | Code devise (ex: `EUR`) |
| `data.date` | string | Date comptable (ISO 8601) |
| `data.invoice_date` | string | Date facturation (ISO 8601) |
| `data.invoice_date_due` | string | Date d'échéance (ISO 8601) |
| `data.partner_id` | int | Référence partenaire |
| `data.partner_name` | string | Nom partenaire |
| `data.company_id` | int | Identifiant société |
| `data.amount_residual` | float | Montant résiduel (encours) |
| `idempotency_key` | string | SHA256 — déduplication |

**Règle de mapping :**
```
move_type = "out_invoice" → canonical event_type = "invoice_issued"
move_type = "in_invoice"  → canonical event_type = "invoice_issued" (achats)
move_type = "out_refund"  → canonical event_type = "invoice_refund"
move_type = "in_refund"   → canonical event_type = "invoice_refund"
```

**Métriques consommatrices :** `commercial_margin`, `tax_balance`, `receivables_open`

---

#### `invoice_issued` _(canonical)_

**Producteur :** DVIG (mapper `mapInvoicePosted`)  
**Stocké dans :** Vault (`invoices` table)  
**Source raw :** `invoice.posted` (out_invoice / in_invoice)

**Métriques consommatrices :**
- `commercial_margin` : `Σ(amount_untaxed)` ventilé ventes/achats
- `tax_balance` : `Σ(amount_tax)` collecté - déductible
- `receivables_open` : `Σ(amount_residual)` — open invoices

---

#### `invoice_refund` _(canonical)_

**Producteur :** DVIG (mapper, out_refund / in_refund)  
**Stocké dans :** Vault (`invoices` table, `is_refund=true`)  
**Source raw :** `invoice.posted` (refund variant)

**Métriques consommatrices :** `commercial_margin` (déduction), `credit_notes_balance`

---

### 3.2 Événements de paiement

#### `payment.posted` _(raw)_

**Emetteur :** Odoo (connecteur)  
**Cible :** DVIG `/ingest`  
**Mapping :** → `payment_received` (inbound) ou `payment_sent` (outbound)

| Champ payload | Type | Description |
|---------------|------|-------------|
| `event_type` | string | `"payment.posted"` |
| `source` | string | `"odoo"` |
| `data.name` | string | Référence paiement |
| `data.payment_type` | string | `"inbound"` ou `"outbound"` |
| `data.amount` | float | Montant |
| `data.currency` | string | Code devise |
| `data.date` | string | Date paiement (ISO 8601) |
| `data.method` | string | Mode de paiement (`transfer`, `cash`, `check`, ...) |
| `data.is_refund` | bool | Est un remboursement |
| `data.partner_id` | int | Référence partenaire |
| `data.partner_name` | string | Nom partenaire |
| `data.company_id` | int | Identifiant société |
| `idempotency_key` | string | SHA256 — déduplication |

**Règle de mapping :**
```
payment_type = "inbound"  → canonical event_type = "payment_received"
payment_type = "outbound" → canonical event_type = "payment_sent"
```

**Métriques consommatrices :** `treasury_balance`, `cash_flow_net`

---

#### `payment_received` _(canonical)_

**Producteur :** DVIG (mapper `mapPaymentPosted`, inbound)  
**Stocké dans :** Vault (`payments` table)  
**Source raw :** `payment.posted` (inbound)

**Métriques consommatrices :**
- `treasury_balance` : `Σ(amount)` encaissements
- `cash_flow_net` : composante positive

---

#### `payment_sent` _(canonical)_

**Producteur :** DVIG (mapper, outbound)  
**Stocké dans :** Vault (`payments` table)  
**Source raw :** `payment.posted` (outbound)

**Métriques consommatrices :**
- `treasury_balance` : `Σ(amount)` décaissements
- `cash_flow_net` : composante négative

---

### 3.3 Événements d'ajustement

Ces événements transitent par DVIG et sont agrégés via `/ui/aggregations/adjustments`.

#### `credit_note.customer.issued` _(raw + canonical)_

**Emetteur :** Odoo  
**Description :** Avoir émis à un client  
**Métrique consommatrice :** `credit_notes_balance` (côté clients)

---

#### `credit_note.supplier.received` _(raw + canonical)_

**Emetteur :** Odoo  
**Description :** Avoir reçu d'un fournisseur  
**Métrique consommatrice :** `credit_notes_balance` (côté fournisseurs)

---

#### `refund.customer.paid` _(raw + canonical)_

**Emetteur :** Odoo  
**Description :** Remboursement versé à un client  
**Métrique consommatrice :** `refunds_balance` (côté clients)

---

#### `refund.supplier.received` _(raw + canonical)_

**Emetteur :** Odoo  
**Description :** Remboursement reçu d'un fournisseur  
**Métrique consommatrice :** `refunds_balance` (côté fournisseurs)

---

### 3.4 Événements de rapprochement bancaire

#### `bank.move.reconciled` _(raw + canonical)_

**Emetteur :** Odoo (connecteur `dorevia_vault_connector`)  
**Cible :** DVIG `/ingest`  
**Description :** Ligne bancaire rapprochée avec une pièce comptable  
**Stocké dans :** Vault (projection RECONCIL)

| Champ payload | Type | Description |
|---------------|------|-------------|
| `event_type` | string | `"bank.move.reconciled"` |
| `data.move_id` | int | ID ligne bancaire Odoo |
| `data.amount` | float | Montant rapproché |
| `data.date` | string | Date de rapprochement |
| `data.journal_id` | int | Journal comptable |

**Métrique consommatrice :** `treasury_balance` (projection validée)

---

#### `bank.move.unreconciled` _(raw + canonical)_

**Emetteur :** Odoo (connecteur)  
**Description :** Annulation d'un rapprochement bancaire  
**Métrique consommatrice :** `treasury_balance` (déduction projection)

---

### 3.5 Événements POS

#### `pos_session` _(canonical)_

**Emetteur :** Odoo / POS  
**Stocké dans :** Vault (`pos_sessions` table)

| Champ | Type | Description |
|-------|------|-------------|
| `session_id` | string | Identifiant session POS |
| `shop_id` | string | Identifiant point de vente |
| `total_sales` | float | CA total session |
| `total_tickets` | int | Nombre de tickets |
| `cash_total` | float | Total espèces |
| `card_total` | float | Total carte |
| `difference` | float | Écart de caisse |
| `vault_status` | string | `"sealed"` ou `"pending"` |

**Métriques consommatrices :** `pos_sales_total`, `pos_cash_difference`

---

## 4. Tableau récapitulatif

| event_type | Niveau | Direction | Stocké dans | Métriques |
|------------|--------|-----------|-------------|-----------|
| `invoice.posted` | Raw | ERP → DVIG | — | (via mapping) |
| `payment.posted` | Raw | ERP → DVIG | — | (via mapping) |
| `invoice_issued` | Canonical | DVIG → Vault | `invoices` | commercial_margin, tax_balance, receivables_open |
| `invoice_refund` | Canonical | DVIG → Vault | `invoices` | credit_notes_balance |
| `payment_received` | Canonical | DVIG → Vault | `payments` | treasury_balance, cash_flow_net |
| `payment_sent` | Canonical | DVIG → Vault | `payments` | treasury_balance, cash_flow_net |
| `credit_note.customer.issued` | Adjustment | ERP → Vault | `adjustments` | credit_notes_balance |
| `credit_note.supplier.received` | Adjustment | ERP → Vault | `adjustments` | credit_notes_balance |
| `refund.customer.paid` | Adjustment | ERP → Vault | `adjustments` | refunds_balance |
| `refund.supplier.received` | Adjustment | ERP → Vault | `adjustments` | refunds_balance |
| `bank.move.reconciled` | Reconciliation | ERP → Vault | projection RECONCIL | treasury_balance |
| `bank.move.unreconciled` | Reconciliation | ERP → Vault | projection RECONCIL | treasury_balance |
| `pos_session` | Canonical | POS → Vault | `pos_sessions` | pos_sales_total, pos_cash_difference |

---

## 5. Mapping vers le Metric Registry

| event_type(s) | metric_id | Agrégation |
|---------------|-----------|------------|
| `payment_received`, `payment_sent` | `treasury_balance` | Σ(received) - Σ(sent) |
| `invoice_issued`, `invoice_refund` | `commercial_margin` | Σ(ventes_ht) - Σ(achats_ht) |
| `invoice_issued` (out_invoice) | `tax_balance` | Σ(tva_collectee) - Σ(tva_deductible) |
| `invoice_issued` (amount_residual) | `receivables_open` | Σ(amount_residual) — factures ouvertes |
| `payment_received`, `payment_sent` | `cash_flow_net` | Σ(encaissements) - Σ(décaissements) |
| `credit_note.*` | `credit_notes_balance` | Σ(avoirs clients) - Σ(avoirs fournisseurs) |
| `refund.*` | `refunds_balance` | Σ(remb. fournisseurs) - Σ(remb. clients) |
| `pos_session` | `pos_sales_total` | Σ(total_sales) sessions scellées |
| `bank.move.reconciled` | `treasury_balance` | Projection RECONCIL |
| `invoice_issued` (amount_residual) | `working_capital` | Σ(AR_open) - Σ(AP_open) |

---

## 6. Règles de validation

### 6.1 Idempotence

Tout événement DVIG **doit** porter un `idempotency_key` (SHA256 recommandé).  
Le pipeline garantit la déduplication via `UNIQUE(tenant, idempotency_key)` dans `outbox_events`.

### 6.2 Champs obligatoires

Pour tout événement entrant dans DVIG :

| Champ | Règle |
|-------|-------|
| `event_type` | Non vide, valeur dans la liste du registre |
| `source` | Non vide, cohérent avec le tenant |
| `timestamp` | ISO 8601, timezone incluse |
| `data` | Objet non null |

### 6.3 Séquence temporelle

Les événements **doivent être envoyés dans l'ordre chronologique** de leur création côté ERP (`erp_event_captured_at`). Le Vault garantit l'intégrité via le ledger hash chaîné.

### 6.4 Devise

Le champ `currency` doit être un code ISO 4217 valide (ex: `EUR`, `USD`).

---

### 3.6 Événements de paie (nouveau — GO-3)

#### `payroll.charge.posted` _(raw + canonical)_

**Emetteur :** Odoo (module RH — `hr.payslip`)  
**Cible :** DVIG `/ingest`  
**Canonical event_type :** `payroll_charge`  
**Stocké dans :** Vault (`documents`, `odoo_model = 'hr.payslip'`)  
**Endpoint Vault :** `GET /ui/aggregations/payroll`

| Champ payload | Type | Description |
|---------------|------|-------------|
| `event_type` | string | `"payroll.charge.posted"` |
| `source` | string | `"odoo"` |
| `data.name` | string | Référence fiche de paie |
| `data.employee_id` | int | ID employé |
| `data.employee_name` | string | Nom employé |
| `data.total_charges` | float | Coût total employeur (brut + charges patronales) |
| `data.net_salary` | float | Salaire net |
| `data.employer_cost` | float | Charges patronales |
| `data.currency` | string | Code devise |
| `data.date_from` | string | Début période de paie (ISO 8601) |
| `data.date_to` | string | Fin période de paie (ISO 8601) |
| `data.company_id` | int | Identifiant société |
| `idempotency_key` | string | SHA256 — déduplication |

**Métrique consommatrice :** `payroll_charges` → composante EBE  
**EBE complet :** `commercial_margin - payroll_charges - other_charges`

---

## 7. Évolutions prévues

| Événement | Description | Priorité |
|-----------|-------------|----------|
| `ap.open.updated` | Mise à jour encours fournisseurs (AP) | P1 pour BFR complet |
| `stock.valuation.updated` | Valorisation stocks | P2 pour BFR complet |
| `pos.session.closed` | Clôture session POS (Z de caisse) | P2 |

---

## 8. Références

| Document | Rôle |
|----------|------|
| `SPEC_LINKY_METRIC_REGISTRY_v1.0.md` | Métriques consommatrices |
| `SPEC_LINKY_METRIC_ENGINE_v1.0.md` | Moteur d'exécution |
| `sources/vault/internal/replay/mapper.go` | Implémentation du mapping |
| `sources/dvig/dvig/api_fastapi/routes/ingest.py` | Endpoint DVIG |
| `units/odoo/custom-addons/dorevia_vault_connector/` | Connecteur Odoo |

---

## Historique des versions

| Version | Date | Modifications |
|---------|------|---------------|
| 1.0 | 13 mars 2026 | Version initiale — inventaire complet des event_types |

---

*Document de référence normative. Tout nouvel event_type doit être enregistré ici avant implémentation.*

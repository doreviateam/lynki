# Inventaire des données susceptibles d’être envoyées à l’IA (DIVA / Mistral)

**Version :** 1.0  
**Date :** 2026-02-16  
**Scope :** Données par carte KPI — ce qui est envoyé aujourd’hui et ce qui pourrait l’être

**Référence implémentation :**
- `units/dorevia-linky/app/api/dashboard-metrics/route.ts` — agrégation et `_details`
- `units/dorevia-linky/app/api/diva/explain/async/route.ts` — mapping carte → details
- `units/diva/internal/mistral/client.go` — prompt utilisateur et `buildUserPrompt`

**Traçabilité :** Chaque section cartes ci-dessous référence les lignes de code exactes du dépôt.

---

## Données de contexte (toutes les cartes)

Ces données sont envoyées pour chaque requête, quel que soit le mode (cockpit ou carte ciblée).

| Champ | Type | Source | Envoyé |
|-------|------|--------|--------|
| `tenant` | string | Contexte | ✓ |
| `company_id` | number | Contexte | ✓ |
| `date_start` / `date_end` | string (YYYY-MM-DD) | Contexte | ✓ |
| `timezone` | string | Contexte | ✓ |
| `currency` | string | Contexte | ✓ |
| `locale` | string | Contexte | ✓ |

**Traçabilité contexte :** `explain/async/route.ts` L96–101 mappe `context.tenant`, `date_debut`→`date_start`, etc. vers `divaBody.context`.

---

## Inventaire par carte

### 1. Trésorerie validée (`treasury_validated_pct`)

**Tuile KPI :** Fiabilité bancaire (%).

| Donnée | Type | Description | Envoyé | `focus_card_details` |
|--------|------|-------------|--------|----------------------|
| `value` | number \| null | Pourcentage (0–100) | ✓ (Card) | — |
| `formatted` | string | Ex. "0 %", "100 %" | ✓ (Card) | — |
| `label` | string | "Trésorerie validée" | ✓ | — |
| `unit` | string | "%" | ✓ | — |
| **Détails** | | | | |
| `reconciled` | number | Montant rapproché (€) | — | ✓ |
| `unreconciled` | number | Montant en attente de rapprochement (€) | — | ✓ |
| `total` | number | Solde comptable total | — | ✓ |
| `currency` | string | Devise (ex. EUR) | — | ✓ |

**Sources Vault :** `/ui/aggregations/treasury` → `reliability_rate`, `reconciled_balance`, `unreconciled_balance`, `accounting_balance`.

**Traçabilité code :**
- Card : `explain/async/route.ts` L17–31 CARD_MAPPING `dmKey:"treasury"` → `metricsToCards` L33–43.
- Card value/formatted : `dashboard-metrics/route.ts` L135–139 (rawRate, treasuryRatePct), L191–195 (response.treasury).
- _details : `dashboard-metrics/route.ts` L168–170 reconciled/unreconciled/accountingTotal, L174 (treasury dans _details).
- focus_card_details : `explain/async/route.ts` L88–93 (detailsKey:"treasury" → `details[mapping.detailsKey]`).

**Potentiel enrichissement :**
- `reconciliation_rate` (alias de reliability_rate)
- Nombre d’entrées rapprochées / non rapprochées (si exposé par Vault)

---

### 2. Cash (`cash`)

**Tuile KPI :** Solde net encaissements − décaissements.

| Donnée | Type | Description | Envoyé | `focus_card_details` |
|--------|------|-------------|--------|----------------------|
| `value` | number | Net (encaissements − décaissements) | ✓ (Card) | — |
| `formatted` | string | Ex. "+ 12 345,67 €" | ✓ (Card) | — |
| `label` | string | "Cash" | ✓ | — |
| `unit` | string | "EUR" | ✓ | — |
| **Détails** | | | | |
| `encaissements` | number | Total entrées (€) | — | ✓ |
| `decaissements` | number | Total sorties (€) | — | ✓ |
| `net` | number | Encaissements − décaissements | — | ✓ |
| `currency` | string | Devise | — | ✓ |

**Sources Vault :** `/ui/aggregations/payments-in` (total), `/ui/aggregations/payments-out` (total). Vault `storage/aggregations_payments.go` : `PaymentsAggregationResponse.Total`.

**Traçabilité code :**
- Card : `explain/async/route.ts` L24 `dmKey:"cash"`, `detailsKey:"cash"`.
- Value : `dashboard-metrics/route.ts` L142–145 inTotal, outTotal, cashNet ; L195–199 response.cash.
- _details : L175 `cash: { encaissements: inTotal, decaissements: outTotal, net: cashNet, currency }`.
- payments-in/-out : L121–122 `fetchJson("/ui/aggregations/payments-in|payments-out", commonParams)` → `?.total`.

**Potentiel enrichissement :**
- `list=1` : liste des événements (source_id, amount, payment_date) — très volumineux
- Nombre d’opérations
- Ventilation par méthode de paiement (si exposée)

---

### 3. Business (`business`)

**Tuile KPI :** Volume d’activité (ventes − achats).

| Donnée | Type | Description | Envoyé | `focus_card_details` |
|--------|------|-------------|--------|----------------------|
| `value` | number | Net ventes − achats | ✓ (Card) | — |
| `formatted` | string | Ex. "+ 50 000,00 €" | ✓ (Card) | — |
| `label` | string | "Business" | ✓ | — |
| `unit` | string | "EUR" | ✓ | — |
| **Détails** | | | | |
| `ventes` | number | Total ventes HT (€) | — | ✓ |
| `achats` | number | Total achats HT (€) | — | ✓ |
| `net` | number | Ventes − achats | — | ✓ |
| `currency` | string | Devise | — | ✓ |

**Sources Vault :** `/ui/aggregations/sales` (total_ht, total), `/ui/aggregations/purchases` (total_ht, total). Vault `storage/aggregations_sales.go` : `TotalHT`, `TotalTax`, `Total`.

**Traçabilité code :**
- Card : `explain/async/route.ts` L25 `dmKey:"business"`, `detailsKey:"business"`.
- Value : `dashboard-metrics/route.ts` L147–149 salesTotal, purchasesTotal, businessNet ; L200–204 response.business.
- _details : L176 `business: { ventes: salesTotal, achats: purchasesTotal, net: businessNet, currency }`.
- sales/purchases : L122–123 fetchJson → `salesRes?.total_ht ?? salesRes?.total`, `purchasesRes?.total_ht ?? purchasesRes?.total`.

**Potentiel enrichissement :**
- `total_tax` (TVA) ventes / achats (déjà utilisé pour Taxes)
- Nombre de factures / documents
- Montant TTC si disponible

---

### 4. Taxes (`taxes`)

**Tuile KPI :** Flux TVA (TVA collectée − déductible).

| Donnée | Type | Description | Envoyé | `focus_card_details` |
|--------|------|-------------|--------|----------------------|
| `value` | number | TVA collectée − déductible | ✓ (Card) | — |
| `formatted` | string | Ex. "+ 5 000,00 €" | ✓ (Card) | — |
| `label` | string | "Taxes" | ✓ | — |
| `unit` | string | "EUR" | ✓ | — |
| **Détails** | | | | |
| — | — | *Aucun détail dédié actuellement* | — | — |

**Sources Vault :** `/ui/aggregations/sales` → `total_tax`, `/ui/aggregations/purchases` → `total_tax`.  
Calcul côté Linky : `tvaCollectee - tvaDeductible`.

**Traçabilité code :**
- Card : `explain/async/route.ts` L26 `dmKey:"taxes"` — **pas de detailsKey** (donc `focus_card_details` vide).
- Value : `dashboard-metrics/route.ts` L151–153 tvaCollectee, tvaDeductible, taxesFlux ; L205–209 response.taxes.
- Pas de _details.taxes dans l’interface `CardDetails` (route.ts L18–28).

**Potentiel enrichissement :** Ajout d’un bloc `_details.taxes` :
- `tva_collectee` (number)
- `tva_deductible` (number)
- `flux` (number) = collectée − déductible
- `currency` (string)

---

### 5. Notes de crédit (`credit_notes`)

**Tuile KPI :** Flux avoirs (fournisseurs − clients).

| Donnée | Type | Description | Envoyé | `focus_card_details` |
|--------|------|-------------|--------|----------------------|
| `value` | number | Flux (fournisseurs − clients) | ✓ (Card) | — |
| `formatted` | string | Ex. "− 1 200,00 €" | ✓ (Card) | — |
| `label` | string | "Notes de crédit" | ✓ | — |
| `unit` | string | "EUR" | ✓ | — |
| **Détails** | | | | |
| `clients` | number | Avoirs clients émis (€) | — | ✓ |
| `fournisseurs` | number | Avoirs fournisseurs reçus (€) | — | ✓ |
| `flux` | number | fournisseurs − clients | — | ✓ |
| `currency` | string | Devise | — | ✓ |

**Sources Vault :** `/ui/aggregations/adjustments` avec `event_type=credit_note.customer.issued` et `credit_note.supplier.received`. Vault `storage/aggregations_adjustments.go` : `TotalAmount`, `EventCount`.

**Traçabilité code :**
- Card : `explain/async/route.ts` L27 `dmKey:"credit_notes"`, `detailsKey:"credit_notes"`.
- Value : `dashboard-metrics/route.ts` L155–157 creditClient, creditSupplier, creditNotesFlux ; L210–214 response.credit_notes.
- _details : L177–182 `credit_notes: { clients, fournisseurs, flux, currency }`.
- adjustments : L125–126 fetchJson avec `event_type: "credit_note.customer.issued"` et `"credit_note.supplier.received"` → `?.total_amount ?? ?.total`.

---

### 6. Remboursements (`refunds`)

**Tuile KPI :** Flux remboursements (fournisseurs − clients).

| Donnée | Type | Description | Envoyé | `focus_card_details` |
|--------|------|-------------|--------|----------------------|
| `value` | number | Flux (fournisseurs − clients) | ✓ (Card) | — |
| `formatted` | string | Ex. "+ 500,00 €" | ✓ (Card) | — |
| `label` | string | "Remboursements" | ✓ | — |
| `unit` | string | "EUR" | ✓ | — |
| **Détails** | | | | |
| `clients` | number | Remboursements clients (€) | — | ✓ |
| `fournisseurs` | number | Remboursements fournisseurs (€) | — | ✓ |
| `flux` | number | fournisseurs − clients | — | ✓ |
| `currency` | string | Devise | — | ✓ |

**Sources Vault :** `/ui/aggregations/adjustments` avec `event_type=refund.customer.paid` et `refund.supplier.received`.

**Traçabilité code :**
- Card : `explain/async/route.ts` L28 `dmKey:"refunds"`, `detailsKey:"refunds"`.
- Value : `dashboard-metrics/route.ts` L159–161 refundClient, refundSupplier, refundsFlux ; L215–219 response.refunds.
- _details : L183–188 `refunds: { clients, fournisseurs, flux, currency }`.
- adjustments : L126–127 fetchJson avec `event_type: "refund.customer.paid"` et `"refund.supplier.received"`.

---

### 7. POS magasins (`pos_shops`)

**Tuile KPI :** Total ventes POS (sessions scellées).

| Donnée | Type | Description | Envoyé | `focus_card_details` |
|--------|------|-------------|--------|----------------------|
| `value` | number | Total sales POS scellés | ✓ (Card) | — |
| `formatted` | string | Ex. "25 000,00 €" | ✓ (Card) | — |
| `label` | string | "POS magasins" | ✓ | — |
| `unit` | string | "EUR" | ✓ | — |
| **Détails** | | | | |
| — | — | *Aucun détail dédié actuellement* | — | — |

**Sources Vault :** `/ui/aggregations/pos-sessions` → items avec `vault_status === "sealed"`, somme de `total_sales`.

**Traçabilité code :**
- Card : `explain/async/route.ts` L29 `dmKey:"pos_shops"` — **pas de detailsKey** (donc `focus_card_details` vide).
- Value : `dashboard-metrics/route.ts` L164–166 posItems, posTotal (filter vault_status==="sealed", reduce total_sales) ; L220–224 response.pos_shops.
- Pas de _details.pos_shops dans `CardDetails` (route.ts L18–28).
- fetch : L128 `fetchJson("/ui/aggregations/pos-sessions", ...)`.

**Potentiel enrichissement :** Ajout d’un bloc `_details.pos_shops` :
- `sessions_count` (number)
- `total_sales` (number)
- `currency` (string)
- Eventuellement liste des Z-Reports (id, date, montant) — volumineux

---

### 8. Z de caisse (`pos_z`)

**Tuile KPI :** Placeholder (pas encore alimenté).

| Donnée | Type | Description | Envoyé | `focus_card_details` |
|--------|------|-------------|--------|----------------------|
| `value` | null | Non implémenté | ✓ (Card) | — |
| `formatted` | string | "—" | ✓ (Card) | — |
| `label` | string | "Z de caisse" | ✓ | — |
| `unit` | string | "EUR" | ✓ | — |
| **Détails** | | | | |
| — | — | *À définir* | — | — |

**Sources Vault :** Z-Reports, chaînage des tickets POS. Données à spécifier.

**Traçabilité code :**
- Card : `explain/async/route.ts` L30 `dmKey:"pos_z"` — **pas de detailsKey**.
- Value : `dashboard-metrics/route.ts` L225–229 `value: null`, `formatted: "—"`, `valueKind: "placeholder"`. Carte placeholder non alimentée.

---

## Récapitulatif : cartes avec détails vs sans détails

| Carte | `detailsKey` | Détails envoyés à Mistral |
|-------|--------------|---------------------------|
| Trésorerie validée | `treasury` | ✓ reconciled, unreconciled, total, currency |
| Cash | `cash` | ✓ encaissements, decaissements, net, currency |
| Business | `business` | ✓ ventes, achats, net, currency |
| Taxes | — | ✗ Aucun |
| Notes de crédit | `credit_notes` | ✓ clients, fournisseurs, flux, currency |
| Remboursements | `refunds` | ✓ clients, fournisseurs, flux, currency |
| POS magasins | — | ✗ Aucun |
| Z de caisse | — | ✗ Aucun |

---

## Format d’envoi à Mistral

Pour chaque carte :

1. **Toujours :** `Card` avec `key`, `label`, `value`, `formatted`, `unit`.
2. **Si `focus_card` = clé de la carte et `detailsKey` défini :** `focus_card_details` (objet structuré) est ajouté au prompt utilisateur dans une section « Données détaillées pour cet indicateur ».

Exemple pour Trésorerie en focus :

```
Données détaillées pour cet indicateur :
- reconciled : 0
- unreconciled : 145230.50
- total : 145230.50
- currency : EUR
```

---

## Pistes d’enrichissement futur

| Carte | Données à considérer |
|-------|----------------------|
| Taxes | `_details.taxes` : tva_collectee, tva_deductible, flux |
| POS magasins | `_details.pos_shops` : sessions_count, total_sales |
| Z de caisse | Spécification à faire (Z-Reports) |
| Toutes | Période comparée (mois précédent, N-1) pour tendances |
| Toutes | Nombre de documents / opérations sous-jacents (si pertinent) |

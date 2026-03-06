# Exemples réels — Payload IA et dashboard-metrics

**Version :** 1.1  
**Date :** 2026-02-18  
**Référence :** SPEC_DIVA_Insights_v1.0.md §4.4, SPEC_CARD_CONTEXT_IA_v1.md

---

## 1. Réponse `GET /api/dashboard-metrics`

**Appel :** `GET /api/dashboard-metrics?tenant=sarl-la-platine&date_debut=2026-01-01&date_fin=2026-02-16`

```json
{
  "_details": {
    "treasury": {
      "reconciled": 0,
      "unreconciled": 145230.50,
      "total": 145230.50,
      "currency": "EUR"
    },
    "cash": {
      "encaissements": 162000,
      "decaissements": 128000,
      "net": 34000,
      "currency": "EUR"
    },
    "business": {
      "ventes": 85000,
      "achats": 42000,
      "net": 43000,
      "currency": "EUR"
    },
    "credit_notes": {
      "clients": 1200,
      "fournisseurs": 800,
      "flux": -400,
      "currency": "EUR"
    },
    "refunds": {
      "clients": 500,
      "fournisseurs": 2186.84,
      "flux": 1686.84,
      "currency": "EUR"
    }
  },
  "treasury": {
    "value": 0,
    "formatted": "0 %",
    "valueKind": "accent"
  },
  "cash": {
    "value": 34000,
    "formatted": "+ 34 000,00 €",
    "valueKind": "positive"
  },
  "business": {
    "value": 43000,
    "formatted": "+ 43 000,00 €",
    "valueKind": "positive"
  },
  "taxes": {
    "value": 8500,
    "formatted": "+ 8 500,00 €",
    "valueKind": "accent"
  },
  "credit_notes": {
    "value": -400,
    "formatted": "− 400,00 €",
    "valueKind": "negative"
  },
  "refunds": {
    "value": 1686.84,
    "formatted": "+ 1 686,84 €",
    "valueKind": "positive"
  },
  "pos_shops": {
    "value": 12500,
    "formatted": "12 500,00 €",
    "valueKind": "neutral"
  },
  "pos_z": {
    "value": null,
    "formatted": "—",
    "valueKind": "placeholder"
  }
}
```

---

## 2. Payload envoyé à l'IA — Mode **cockpit** (YTD)

Payload "for AI" (riche, inchangé pour Mistral). Optionnel : `schema`, `mode_scope`.

```json
{
  "schema": "dorevia.diva.generate_payload.v1",
  "context": {
    "tenant": "sarl-la-platine",
    "company_id": 0,
    "date_start": "2026-01-01",
    "date_end": "2026-02-16",
    "timezone": "Europe/Paris",
    "currency": "EUR",
    "locale": "fr-FR"
  },
  "dashboard": {
    "cards": [
      { "key": "treasury_validated_pct", "label": "Trésorerie validée", "value": 0, "formatted": "0 %", "unit": "%" },
      { "key": "cash", "label": "Cash", "value": 34000, "formatted": "+ 34 000,00 €", "unit": "EUR" },
      { "key": "business", "label": "Business", "value": 43000, "formatted": "+ 43 000,00 €", "unit": "EUR" },
      { "key": "taxes", "label": "Taxes", "value": 8500, "formatted": "+ 8 500,00 €", "unit": "EUR" },
      { "key": "credit_notes", "label": "Notes de crédit", "value": -400, "formatted": "− 400,00 €", "unit": "EUR" },
      { "key": "refunds", "label": "Remboursements", "value": 1686.84, "formatted": "+ 1 686,84 €", "unit": "EUR" },
      { "key": "pos_shops", "label": "POS magasins", "value": 12500, "formatted": "12 500,00 €", "unit": "EUR" },
      { "key": "pos_z", "label": "Z de caisse", "value": null, "formatted": "—", "unit": "EUR" }
    ]
  },
  "options": {
    "mode": "flash",
    "mode_scope": "cockpit",
    "force_refresh": false
  }
}
```

*En mode cockpit : pas de `focus_card` ni `focus_card_details`.*

---

## 3. Payload envoyé à l'IA — Mode **card** (carte cash avec détails)

```json
{
  "schema": "dorevia.diva.generate_payload.v1",
  "context": {
    "tenant": "sarl-la-platine",
    "company_id": 0,
    "date_start": "2026-01-01",
    "date_end": "2026-02-16",
    "timezone": "Europe/Paris",
    "currency": "EUR",
    "locale": "fr-FR"
  },
  "dashboard": {
    "cards": [
      { "key": "treasury_validated_pct", "label": "Trésorerie validée", "value": 0, "formatted": "0 %", "unit": "%" },
      { "key": "cash", "label": "Cash", "value": 34000, "formatted": "+ 34 000,00 €", "unit": "EUR" },
      { "key": "business", "label": "Business", "value": 43000, "formatted": "+ 43 000,00 €", "unit": "EUR" },
      { "key": "taxes", "label": "Taxes", "value": 8500, "formatted": "+ 8 500,00 €", "unit": "EUR" },
      { "key": "credit_notes", "label": "Notes de crédit", "value": -400, "formatted": "− 400,00 €", "unit": "EUR" },
      { "key": "refunds", "label": "Remboursements", "value": 1686.84, "formatted": "+ 1 686,84 €", "unit": "EUR" },
      { "key": "pos_shops", "label": "POS magasins", "value": 12500, "formatted": "12 500,00 €", "unit": "EUR" },
      { "key": "pos_z", "label": "Z de caisse", "value": null, "formatted": "—", "unit": "EUR" }
    ]
  },
  "options": {
    "mode": "flash",
    "mode_scope": "card",
    "force_refresh": false,
    "focus_card": "cash",
    "focus_card_details": {
      "encaissements": 162000,
      "decaissements": 128000,
      "net": 34000,
      "currency": "EUR"
    }
  }
}
```

---

## 4. hash_input — Objet stable pour payload_hash

Le `payload_hash` est calculé sur **hash_input**, pas sur le payload for AI. Objectif : éviter les changements de hash dus à `formatted`, `label`, floats (ex. 1686.84), espaces, etc.

**Règles :** EUR → centimes (`value_minor`), % → basis points (`value_basis_points`), aucun float. **cards en map complète** (8 clés, même si null — règle « zéro absent »). `locale` et `timezone` **exclus** (dates déjà figées). CARD_VALUE_SCALE : `treasury_validated_pct` → basis_points, reste → minor.

### 4.1 hash_input — cockpit (YTD)

```json
{
  "schema": "dorevia.diva.hash_input.v1",
  "context": {
    "tenant": "sarl-la-platine",
    "company_id": 0,
    "date_start": "2026-01-01",
    "date_end": "2026-02-16",
    "currency": "EUR"
  },
  "mode": "cockpit",
  "cards": {
    "business": { "value_minor": 4300000 },
    "cash": { "value_minor": 3400000 },
    "credit_notes": { "value_minor": -40000 },
    "pos_shops": { "value_minor": 1250000 },
    "pos_z": { "value_minor": null },
    "refunds": { "value_minor": 168684 },
    "taxes": { "value_minor": 850000 },
    "treasury_validated_pct": { "value_basis_points": 0 }
  }
}
```

*EUR → centimes (34 000 € = 3 400 000). % → basis points (0 % = 0 ; 12,34 % = 1234). `pos_z` null reste null. Map : hash naturellement stable.*

### 4.2 hash_input — mode card (focus cash)

```json
{
  "schema": "dorevia.diva.hash_input.v1",
  "context": {
    "tenant": "sarl-la-platine",
    "company_id": 0,
    "date_start": "2026-01-01",
    "date_end": "2026-02-16",
    "currency": "EUR"
  },
  "mode": "card",
  "focus_card": "cash",
  "cards": {
    "business": { "value_minor": 4300000 },
    "cash": { "value_minor": 3400000 },
    "credit_notes": { "value_minor": -40000 },
    "pos_shops": { "value_minor": 1250000 },
    "pos_z": { "value_minor": null },
    "refunds": { "value_minor": 168684 },
    "taxes": { "value_minor": 850000 },
    "treasury_validated_pct": { "value_basis_points": 0 }
  },
  "focus_card_details": {
    "schema": "dorevia.card.cash.details.v1",
    "data": {
      "encaissements_minor": 16200000,
      "decaissements_minor": 12800000,
      "net_minor": 3400000,
      "currency": "EUR"
    }
  }
}
```

### 4.3 CARD_VALUE_SCALE — cards (référence)

| `card_key` | Scale | Champ |
|------------|-------|-------|
| `treasury_validated_pct` | basis_points | `value_basis_points` |
| `cash`, `business`, `taxes`, `credit_notes`, `refunds`, `pos_shops`, `pos_z` | minor | `value_minor` |

### 4.3 bis FOCUS_CARD_DETAILS_SCALE — champs details par carte

| `focus_card` | Schema | Champs `data` (tous `*_minor` + `currency`) |
|--------------|--------|--------------------------------------------|
| `treasury_validated_pct` | `dorevia.card.treasury.details.v1` | `reconciled_minor`, `unreconciled_minor`, `total_minor`, `currency` |
| `cash` | `dorevia.card.cash.details.v1` | `encaissements_minor`, `decaissements_minor`, `net_minor`, `currency` |
| `business` | `dorevia.card.business.details.v1` | `ventes_minor`, `achats_minor`, `net_minor`, `currency` |
| `credit_notes` | `dorevia.card.credit_notes.details.v1` | `clients_minor`, `fournisseurs_minor`, `flux_minor`, `currency` |
| `refunds` | `dorevia.card.refunds.details.v1` | `clients_minor`, `fournisseurs_minor`, `flux_minor`, `currency` |
| `taxes` | — | Pas de details en v1 |
| `pos_shops` | — | Pas de details en v1 |
| `pos_z` | — | Pas de details en v1 |

**Exemples hash_input focus_card_details :**

```json
// cash
"focus_card_details": {
  "schema": "dorevia.card.cash.details.v1",
  "data": {
    "encaissements_minor": 16200000,
    "decaissements_minor": 12800000,
    "net_minor": 3400000,
    "currency": "EUR"
  }
}

// treasury_validated_pct
"focus_card_details": {
  "schema": "dorevia.card.treasury.details.v1",
  "data": {
    "reconciled_minor": 0,
    "unreconciled_minor": 14523050,
    "total_minor": 14523050,
    "currency": "EUR"
  }
}

// business
"focus_card_details": {
  "schema": "dorevia.card.business.details.v1",
  "data": {
    "ventes_minor": 8500000,
    "achats_minor": 4200000,
    "net_minor": 4300000,
    "currency": "EUR"
  }
}

// credit_notes
"focus_card_details": {
  "schema": "dorevia.card.credit_notes.details.v1",
  "data": {
    "clients_minor": 120000,
    "fournisseurs_minor": 80000,
    "flux_minor": -40000,
    "currency": "EUR"
  }
}

// refunds
"focus_card_details": {
  "schema": "dorevia.card.refunds.details.v1",
  "data": {
    "clients_minor": 50000,
    "fournisseurs_minor": 218684,
    "flux_minor": 168684,
    "currency": "EUR"
  }
}
```

### 4.4 Canonicalisation

- Construire `hash_input` avec **cards en map complète** (8 clés, règle zéro absent).
- Conversion float → int : `round_half_away_from_zero(value * 100)` pour EUR.
- Sérialiser en JSON : clés triées lexicographiquement ; pas de float.
- `payload_hash = SHA256(canonical_json(hash_input))`.

---

## 5. Mapping dashboard-metrics → payload IA

| `dashboard-metrics` | `cards[].key` | `focus_card_details` (si focus_card) |
|---------------------|---------------|--------------------------------------|
| `treasury` | `treasury_validated_pct` | `_details.treasury` (reconciled, unreconciled, total, currency) → *_minor |
| `cash` | `cash` | `_details.cash` (encaissements, decaissements, net, currency) → *_minor |
| `business` | `business` | `_details.business` → *_minor |
| `taxes` | `taxes` | — (pas de detailsKey en v1) |
| `credit_notes` | `credit_notes` | `_details.credit_notes` → *_minor |
| `refunds` | `refunds` | `_details.refunds` → *_minor |
| `pos_shops` | `pos_shops` | — |
| `pos_z` | `pos_z` | — |

**Source code :**
- `units/dorevia-linky/app/api/dashboard-metrics/route.ts` — agrégation, `_details`
- `units/dorevia-linky/app/api/diva/explain/async/route.ts` — `CARD_MAPPING`, `metricsToCards`, extraction `focus_card_details`

Le runner et le warmup récupèrent `dashboard-metrics`, construisent le payload for AI, dérivent `hash_input`, calculent `payload_hash`, puis appellent `POST /diva/generate`.

### Pourquoi hash_input sécurise le hash

- Plus de variation due à `formatted` (espaces, signes).
- Plus d'instabilité float (ex. 1686.84).
- Régénération uniquement quand les valeurs métier changent (ou les détails de la carte focus).

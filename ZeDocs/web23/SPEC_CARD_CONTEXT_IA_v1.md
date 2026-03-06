# SPEC — Card Context IA (dorevia.card_context.v1)

**Version :** 1.0  
**Date :** 2026-02-16  
**Scope :** Structure normalisée des données envoyées à l'IA (DIVA/Mistral) pour l'analyse d'une carte KPI

**Schéma JSON :** `schemas/card_context.schema.json`

**Audience :** Analyse financière destinée au **comité de direction (CODIR)** d'une entreprise — synthèse exécutive, concis, orienté décision.

---

## 1. Structure globale

Payload normalisé que l'IA traite (mode focus_card) :

```json
{
  "schema": "dorevia.card_context.v1",
  "context": {
    "tenant": "string",
    "company_id": 0,
    "date_start": "YYYY-MM-DD",
    "date_end": "YYYY-MM-DD",
    "timezone": "Europe/Paris",
    "currency": "EUR",
    "locale": "fr-FR"
  },
  "card": {
    "key": "string",
    "label": "string",
    "unit": "string",
    "value": number | null,
    "formatted": "string"
  },
  "details": {},
  "quality": {
    "confidence": "low|medium|high",
    "data_coverage": "none|partial|full",
    "missing_details": ["series", "breakdown", "counts"]
  }
}
```

---

## 2. Contexte (`context`)

| Champ | Type | Requis | Description |
|-------|------|--------|--------------|
| `tenant` | string | ✓ | Identifiant du tenant |
| `company_id` | integer | | ID entreprise (0 si non filtré) |
| `date_start` | string (YYYY-MM-DD) | ✓ | Début de période |
| `date_end` | string (YYYY-MM-DD) | ✓ | Fin de période |
| `timezone` | string | ✓ | Fuseau (ex. Europe/Paris) |
| `currency` | string | ✓ | Devise (ex. EUR) |
| `locale` | string | ✓ | Locale formatage (ex. fr-FR) |

---

## 3. Carte (`card`)

| Champ | Type | Description |
|-------|------|-------------|
| `key` | string | Clé technique : `treasury_validated_pct`, `cash`, `business`, `taxes`, `credit_notes`, `refunds`, `pos_shops`, `pos_z` |
| `label` | string | Libellé affiché |
| `unit` | string | Unité : `%` ou `EUR` |
| `value` | number \| null | Valeur brute (null si indisponible) |
| `formatted` | string | Valeur formatée (ex. "− 1 686,84 €", "0 %") |

---

## 4. Détails (`details`) par clé de carte

Structure des `details` selon `card.key`. Vide `{}` si aucune donnée enrichie.

### 4.1 `treasury_validated_pct`

```json
{
  "reconciled": 0,
  "unreconciled": 145230.50,
  "total": 145230.50,
  "currency": "EUR"
}
```

### 4.2 `cash`

```json
{
  "encaissements": 125000,
  "decaissements": 98000,
  "net": 27000,
  "currency": "EUR"
}
```

### 4.3 `business`

```json
{
  "ventes": 85000,
  "achats": 35000,
  "net": 50000,
  "currency": "EUR"
}
```

### 4.4 `taxes`

*Pour l'instant non implémenté. Format proposé :*

```json
{
  "tva_collectee": 17000,
  "tva_deductible": 7000,
  "flux": 10000,
  "currency": "EUR"
}
```

### 4.5 `credit_notes` / `refunds`

```json
{
  "clients": 500,
  "fournisseurs": 2186.84,
  "flux": 1686.84,
  "currency": "EUR"
}
```

### 4.6 `pos_shops` / `pos_z`

*Actuellement `{}`. Pistes : `sessions_count`, `total_sales`, `currency`.*

---

## 5. Qualité (`quality`)

Métadonnées pour adapter le comportement de l'IA (prompt, niveau de prudence).

| Champ | Type | Valeurs | Description |
|-------|------|---------|--------------|
| `confidence` | string | `low`, `medium`, `high` | Confiance dans la lecture |
| `data_coverage` | string | `none`, `partial`, `full` | `none` = pas de valeur, `partial` = détails incomplets, `full` = données complètes |
| `missing_details` | string[] | Voir ci-dessous | Enrichissements manquants |

### Valeurs possibles de `missing_details`

| Valeur | Signification |
|--------|---------------|
| `series` | Pas de données temporelles (tendances) |
| `breakdown` | Pas de ventilation (ex. par catégorie) |
| `counts` | Pas de nombre d'opérations |
| `reconciled` | Trésorerie : montant rapproché manquant |
| `unreconciled` | Trésorerie : montant en attente manquant |
| `taxes_detail` | Taxes : TVA collectée/déductible manquantes |

### Exemple

```json
{
  "quality": {
    "confidence": "low",
    "data_coverage": "partial",
    "missing_details": ["counts", "series"]
  }
}
```

---

## 6. Exemples complets

### Remboursements (données complètes)

```json
{
  "schema": "dorevia.card_context.v1",
  "context": {
    "tenant": "sarl-la-platine",
    "company_id": 1,
    "date_start": "2025-01-01",
    "date_end": "2025-01-31",
    "timezone": "Europe/Paris",
    "currency": "EUR",
    "locale": "fr-FR"
  },
  "card": {
    "key": "refunds",
    "label": "Remboursements",
    "unit": "EUR",
    "value": -1686.84,
    "formatted": "− 1 686,84 €"
  },
  "details": {
    "clients": 500,
    "fournisseurs": 2186.84,
    "flux": 1686.84,
    "currency": "EUR"
  },
  "quality": {
    "confidence": "medium",
    "data_coverage": "full",
    "missing_details": []
  }
}
```

### Trésorerie (0 % — données partielles)

```json
{
  "schema": "dorevia.card_context.v1",
  "context": {
    "tenant": "core",
    "company_id": 0,
    "date_start": "2025-01-01",
    "date_end": "2025-01-31",
    "timezone": "Europe/Paris",
    "currency": "EUR",
    "locale": "fr-FR"
  },
  "card": {
    "key": "treasury_validated_pct",
    "label": "Trésorerie validée",
    "unit": "%",
    "value": 0,
    "formatted": "0 %"
  },
  "details": {
    "reconciled": 0,
    "unreconciled": 145230.50,
    "total": 145230.50,
    "currency": "EUR"
  },
  "quality": {
    "confidence": "low",
    "data_coverage": "full",
    "missing_details": ["series"]
  }
}
```

### Z de caisse (aucune donnée)

```json
{
  "schema": "dorevia.card_context.v1",
  "context": { "tenant": "core", "company_id": 0, "date_start": "2025-01-01", "date_end": "2025-01-31", "timezone": "Europe/Paris", "currency": "EUR", "locale": "fr-FR" },
  "card": {
    "key": "pos_z",
    "label": "Z de caisse",
    "unit": "EUR",
    "value": null,
    "formatted": "—"
  },
  "details": {},
  "quality": {
    "confidence": "low",
    "data_coverage": "none",
    "missing_details": ["breakdown", "counts"]
  }
}
```

---

## 7. Traçabilité code (inventaire basé sur analyse du dépôt)

L’inventaire par carte a été construit à partir de l’analyse directe du code :

| Fichier | Rôle |
|---------|------|
| `units/dorevia-linky/app/api/dashboard-metrics/route.ts` | Agrégation des 8 KPIs, construction de `_details` (L174–189), formattage (L191–229) |
| `units/dorevia-linky/app/api/diva/explain/async/route.ts` | CARD_MAPPING (L17–31), `metricsToCards` (L33–43), extraction `focus_card_details` (L88–93) |
| `units/diva/internal/models/models.go` | `Options.FocusCardDetails`, `Card` |
| `units/diva/internal/mistral/client.go` | `buildUserPrompt` (L243–274), `formatDetails` (L277–294), injection détails dans prompt |
| `sources/vault/internal/storage/aggregations_*.go` | Réponses Vault : `Total`, `TotalHT`, `TotalTax`, `TotalAmount` selon endpoint |

Voir `INVENTAIRE_DONNEES_IA_PAR_CARTE.md` pour les références lignes par carte.

---

## 8. Format wire réel (JSON envoyé à DIVA)

La spec §1 décrit un format **normalisé conceptuel**. Le JSON **réel** envoyé par Linky à DIVA est le suivant (extrait de `explain/async/route.ts` L98–114) :

```json
{
  "context": {
    "tenant": "string",
    "company_id": 0,
    "date_start": "YYYY-MM-DD",
    "date_end": "YYYY-MM-DD",
    "timezone": "Europe/Paris",
    "currency": "EUR",
    "locale": "fr-FR"
  },
  "dashboard": {
    "cards": [
      { "key": "treasury_validated_pct", "label": "Trésorerie validée", "value": 0, "formatted": "0 %", "unit": "%" },
      { "key": "cash", "label": "Cash", "value": 27000, "formatted": "+ 27 000,00 €", "unit": "EUR" }
    ]
  },
  "options": {
    "mode": "flash",
    "force_refresh": false,
    "focus_card": "refunds",
    "focus_card_details": { "clients": 500, "fournisseurs": 2186.84, "flux": 1686.84, "currency": "EUR" }
  }
}
```

### Mapping spec ↔ wire

| Spec (normalisé) | Wire (implémenté) | Source code |
|------------------|-------------------|-------------|
| `context` | `context` | Identique |
| `card` (singleton) | `dashboard.cards[]` (toujours 8 cartes) + `options.focus_card` pour cibler | `explain/async` L86, L107 |
| `details` | `options.focus_card_details` | `explain/async` L92–93, L112 |
| `schema` | — | Non envoyé |
| `quality` | — | Non implémenté |
| `card.value` | `value` (number \| null) | `metricsToCards` L40 : `m?.value ?? null` |
| `card.formatted` | `formatted` | `metricsToCards` L41 : `m?.formatted ?? "—"` |

### Structure Card (modèle Go)

Extrait de `units/diva/internal/models/models.go` :

```go
type Card struct {
    Key       string   `json:"key"`
    Label     string   `json:"label"`
    Value     *float64 `json:"value"`
    Formatted string   `json:"formatted,omitempty"`
    Unit      string   `json:"unit"`
}
```

### Transformation vers le prompt Mistral

DIVA ne reçoit pas le JSON brut. `buildUserPrompt` (client.go L249–281) construit un **texte** pour le prompt utilisateur :
- Contexte : tenant, dates, devise
- Cartes : liste "Label : formatted unit"
- Détails : section "Données détaillées" si `focus_card_details` présent (formatDetails)

---

## 9. Mapping implémentation actuelle

| Composant | Rôle |
|-----------|------|
| Linky `dashboard-metrics` | Produit `_details` (treasury, cash, business, credit_notes, refunds) |
| Linky `explain/async` | Construit `divaBody` : context, dashboard.cards, options |
| DIVA Go | Parse `ExplainRequest`, injecte dans prompt Mistral via `buildUserPrompt` |
| **À faire** | Construire et passer l'objet `quality` (optionnel) |

L'objet `quality` n'est pas encore produit côté Linky/DIVA.

---

## 10. Références

- Inventaire : `ZeDocs/web23/INVENTAIRE_DONNEES_IA_PAR_CARTE.md`
- Schéma JSON : `schemas/card_context.schema.json`
- Prompt Trésorerie : `ZeDocs/web23/prompt_1.md`

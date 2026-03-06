# SPEC — Vault UI Aggregations: AR by Partner (Encours & Retard) v1.0

**Date :** 2026-02-22  
**Statut :** Draft (P0)  
**Cible :** `vault.core.doreviateam.com` (service Vault)  
**Consumers :** Linky (UI), DIVA (lecture cockpit), DVIG (enrichissement event/partner)  
**Principe :** Agrégats déterministes, sans IA.

---

## 0. Résumé

Cette spécification définit un endpoint d’agrégation **Accounts Receivable (AR)** par partenaire (client) :

- **Encours client** : factures postées non soldées (reste à payer).
- **Retard** : sous-ensemble encours dont l’échéance est dépassée (overdue).

L’endpoint est **global** (encours + retard) et supporte un filtre `overdue=true` pour ne retourner que les retards.

Objectif : permettre à Linky et DIVA d’identifier **les clients les plus risqués pour la trésorerie** (top encours, top retards) et de produire des analyses (Pareto, concentration, gravité du retard).

---

## 1. Glossaire

- **AR (Accounts Receivable)** : créances clients.
- **Encours (open AR)** : somme des `amount_residual` des factures client non soldées.
- **Overdue (retard)** : facture non soldée avec `invoice_date_due < as_of_date`.
- **as_of_date** : date d’évaluation (par défaut `today`), utilisée pour déterminer le retard.
- **Partner** : client (`res.partner`) identifié par une clé stable `partner_key`.

---

## 2. Endpoint

### 2.1 URI

`GET /ui/aggregations/ar-by-partner`

> Remarque : le chemin suit le pattern existant `sales-by-partner`.

### 2.2 Authentification

- Identique aux endpoints UI Vault existants.
- Le tenant est fourni (query param ou header, selon convention Vault) et **obligatoire**.

### 2.3 Paramètres (query)

| Paramètre | Type | Obligatoire | Défaut | Description |
|---|---:|---:|---:|---|
| `tenant` | string | ✅ | — | Identifiant du tenant (ex: `sarl-la-platine`) |
| `company_id` | int | ❌ | 0 | Société Odoo (0 = consolidé / défaut) |
| `date_from` | date (YYYY-MM-DD) | ❌ | début exercice (si fourni par UI) | Début de fenêtre de sélection (voir §3) |
| `date_to` | date (YYYY-MM-DD) | ❌ | fin exercice (si fourni par UI) | Fin de fenêtre de sélection (voir §3) |
| `as_of_date` | date (YYYY-MM-DD) | ❌ | `today` | Date d’évaluation du retard |
| `overdue` | bool | ❌ | `false` | Si `true` : ne renvoie que les factures en retard |
| `limit` | int | ❌ | 50 | Max partenaires retournés |
| `offset` | int | ❌ | 0 | Pagination |
| `sort` | enum | ❌ | `amount_desc` | `amount_desc` \| `days_desc` \| `count_desc` |
| `min_amount` | number | ❌ | 0 | Filtrer les partenaires avec encours/retard < min_amount |

**Notes importantes :**
- `date_from/date_to` servent à limiter la population de factures considérées (§3).  
- `as_of_date` contrôle la classification overdue, indépendamment de `date_to`.

---

## 3. Population de factures et règles de calcul

### 3.1 Périmètre “Encours”

Une facture est incluse dans l’encours si :

- `event_type` (ou modèle) = **facture client** (ex: `account.move` type `out_invoice`)
- **postée** (ex: `state='posted'`)
- **ouverte** : `amount_residual > 0` (tolérance centimes §3.4)
- appartient à `tenant` (+ `company_id` si applicable)

### 3.2 Filtre temporel (date_from/date_to)

La fenêtre temporelle **s’applique à la date facture** (`invoice_date`) :

- inclure si `invoice_date` ∈ [`date_from`, `date_to`]
- si `date_from/date_to` absents : comportement par défaut = **toute la période disponible** (ou “exercice à date” si le consumer le passe).

> Rationale : l’encours “sur la période” signifie : factures émises pendant la période encore non soldées.

### 3.3 Définition du “Retard” (overdue)

Une facture ouverte est **en retard** si :

- `invoice_date_due` non nul
- `invoice_date_due < as_of_date`
- `amount_residual > 0`

Si `overdue=true` : ne conserver que ces factures.

### 3.4 Tolérance centimes

Pour éviter les faux résiduels dus aux arrondis :

- considérer soldée si `amount_residual <= 0.01` (en devise de la facture)
- considérer ouverte si `amount_residual > 0.01`

La valeur de tolérance est configurable côté Vault (ex: `AR_RESIDUAL_EPS=0.01`).

### 3.5 Avoirs / remboursements

Deux modes possibles (P0 = Mode A) :

- **Mode A (P0, simple)** : exclure `out_refund` de l’AR.  
- **Mode B (P1)** : inclure `out_refund` comme montants négatifs dans l’AR (plus fidèle).

La réponse doit exposer `mode_refunds` pour transparence.

---

## 4. Schéma de réponse

### 4.1 JSON

```json
{
  "schema": "dorevia.ar_by_partner.v1",
  "tenant": "sarl-la-platine",
  "company_id": 0,
  "currency": "EUR",
  "mode_refunds": "exclude_out_refund",
  "filters": {
    "date_from": "2026-01-01",
    "date_to": "2026-12-31",
    "as_of_date": "2026-02-22",
    "overdue": false,
    "limit": 50,
    "offset": 0,
    "sort": "amount_desc",
    "min_amount": 0
  },
  "totals": {
    "open_amount": 49339.92,
    "open_count_invoices": 61,
    "overdue_amount": 14368.12,
    "overdue_count_invoices": 22
  },
  "partners": [
    {
      "partner_key": "partner:odoo:res.partner:1284",
      "partner_name": "EMI",
      "open_amount": 16750.40,
      "open_count_invoices": 7,
      "overdue_amount": 8120.00,
      "overdue_count_invoices": 3,
      "avg_days_overdue": 42,
      "max_days_overdue": 97,
      "oldest_due_date": "2025-11-17",
      "share_percent": 56.50
    }
  ],
  "meta": {
    "generated_at": "2026-02-22T09:12:03Z",
    "data_quality": "low|medium|high",
    "warnings": []
  }
}
```

### 4.2 Champs `partners[]`

| Champ | Type | Description |
|---|---|---|
| `partner_key` | string | Clé stable (tenant+source+id) |
| `partner_name` | string\|null | Nom affichable (peut être null si non encore enrichi) |
| `open_amount` | number | Encours total (reste à payer) |
| `open_count_invoices` | int | Nombre de factures ouvertes |
| `overdue_amount` | number | Encours en retard (sous-ensemble) |
| `overdue_count_invoices` | int | Nombre de factures en retard |
| `avg_days_overdue` | int\|null | Moyenne jours de retard (uniquement si overdue_count>0) |
| `max_days_overdue` | int\|null | Retard max |
| `oldest_due_date` | date\|null | Plus ancienne échéance en retard |
| `share_percent` | number | Part du risque total (sur `overdue_amount` si `overdue=true`, sinon sur `open_amount`) |

### 4.3 `totals`

- `open_*` calculés sur la même population que `partners`.
- `overdue_*` toujours calculés (même si `overdue=true`, ils restent identiques à open dans ce cas).

---

## 5. Tri et pagination

### 5.1 Tri

- `amount_desc` : tri sur `open_amount` (ou `overdue_amount` si `overdue=true`) DESC
- `days_desc` : tri sur `max_days_overdue` DESC (nulls last)
- `count_desc` : tri sur `open_count_invoices` DESC

### 5.2 Pagination

- Appliquer `offset/limit` sur `partners[]`
- `totals` doivent refléter l’ensemble **non paginé** (utile pour ratios)

---

## 6. Comportements UI (Linky)

### 6.1 Utilisation recommandée

- **Vue Business** : tableau “Clients à risque” basé sur `overdue=true`
- **Vue Business** : tableau “Encours clients” basé sur `overdue=false`

### 6.2 Fallback d’affichage `partner_name`

Si `partner_name` est null :

- afficher un label fallback : `partner_key` tronqué (ex: `…:1284`)
- tooltip : “Nom partenaire non renseigné (phase DVIG→Vault en cours)”

---

## 7. Contrats de cohérence (invariants)

1. `overdue_amount <= open_amount`
2. `overdue_count_invoices <= open_count_invoices`
3. `sum(partners.open_amount) ~= totals.open_amount` (tolérance arrondi 0.01)
4. si `overdue=true` : `partners.open_amount == partners.overdue_amount` (population = overdue)

---

## 8. Erreurs et codes HTTP

| Code | Cas | Réponse |
|---:|---|---|
| 200 | OK | JSON v1 |
| 400 | Paramètres invalides | message + champ fautif |
| 401/403 | Auth/ACL | standard Vault |
| 404 | Tenant inconnu | standard Vault |
| 422 | Incohérence de dates | ex: date_from > date_to |
| 500 | Erreur interne | standard |

---

## 9. Performance & indexation (P0)

### 9.1 Objectif

- P95 < 300 ms sur 50 partenaires, dataset TPE (<= 50k events)
- Dégradation maîtrisée via `limit` et `min_amount`

### 9.2 Index recommandés

Sur la table de projection invoices (ou vues) :

- `(tenant, company_id, invoice_date)`
- `(tenant, company_id, invoice_date_due)`
- `(tenant, company_id, partner_key)`
- `(tenant, company_id, state, move_type)`
- `(tenant, company_id, amount_residual)` (optionnel)

---

## 10. Exemples d’appels

### 10.1 Encours (exercice à date)

`GET /ui/aggregations/ar-by-partner?tenant=sarl-la-platine&company_id=0&date_from=2026-01-01&date_to=2026-12-31&as_of_date=2026-02-22&overdue=false&limit=50`

### 10.2 Retards uniquement (top 10)

`GET /ui/aggregations/ar-by-partner?tenant=sarl-la-platine&company_id=0&as_of_date=2026-02-22&overdue=true&limit=10&sort=amount_desc`

---

## 11. Jeux de tests (P0)

### 11.1 Cas nominal

- 3 clients
- factures ouvertes + soldées + partielles
- échéances passées et futures

Vérifier les invariants §7.

### 11.2 Cas sans échéance

- facture ouverte mais `invoice_date_due` null
- compte dans `open`, jamais dans `overdue`

### 11.3 Cas arrondis

- residual = 0.009 → soldé
- residual = 0.02 → ouvert

### 11.4 Cas refunds

- out_refund présent
- vérifier `mode_refunds=exclude_out_refund` (P0)

---

## 12. Notes d’implémentation (DVIG → Vault)

Pour maximiser la qualité :

- S’assurer que `partner_key` est toujours renseigné dans `invoice.posted`
- Enrichir `partner_name` progressivement (phase 1) sur les nouvelles factures
- Option P1 : backfill des anciennes factures (si souhaité)

---

## 13. Changelog

- v1.0 : Endpoint AR by partner (encours + overdue) + filtre `overdue=true`.

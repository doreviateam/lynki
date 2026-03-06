# SPEC — Vault UI Aggregations: AR by Partner (Encours & Retard) v1.0.1

**Date :** 2026-02-22  
**Statut :** Draft (P0) — Sprint 1 terminé (voir compte rendu MOA)  
**Cible :** vault.core.doreviateam.com  
**Consumers :** Linky, DIVA, DVIG  
**Principe :** Agrégats déterministes, sans IA.

---

## 0. Résumé

Cette spécification définit un endpoint d'agrégation **Accounts Receivable (AR)** par partenaire :

- **Encours** = factures postées non soldées (`amount_residual > EPS`).
- **Retard** = sous-ensemble encours avec `invoice_date_due < as_of_date`.

Objectif : identifier les clients à risque pour la trésorerie (concentration, Pareto, gravité).

---

## 1. Endpoint

`GET /ui/aggregations/ar-by-partner`

**Paramètres officiels :** `date_debut` / `date_fin`  
**Alias compat :** `date_from` / `date_to` (warning si utilisés)

**Defaults P0 :**

| Paramètre | Défaut |
|-----------|--------|
| `date_debut` | today - 365 jours |
| `date_fin` | today |
| `as_of_date` | today |
| `overdue` | false |
| `limit` | 50 |

---

## 2. Règles de calcul

### 2.1 Encours

Considérer facture **ouverte** si `amount_residual > EPS` (EPS = 0,01). Inclure dans l'agrégation si :

- `move_type` = `out_invoice`
- `state` = `posted`
- `amount_residual` > EPS (EPS = 0,01)

### 2.2 Retard

- `invoice_date_due` non null
- `invoice_date_due` < `as_of_date`
- `amount_residual` > EPS

### 2.3 Devise (P0)

P0 : **EUR only** (devise tenant), point.  
- **Agrégation** : exclut les factures non-EUR (filtre currency au calcul).  
- **meta.warnings** : au niveau de la **réponse**. Si au moins une facture non-EUR exclue → `meta.warnings += ["multi_currency_ignored_p0"]`.  
Plus simple qu'un flag par invoice.

---

## 3. Schéma de réponse

**Clé P0 :** group by `partner_id`. `partner_key` dérivé côté Vault (facultatif). `partner_name` = attribut d'affichage.

**Champs principaux :**

- `totals.open_amount`
- `totals.overdue_amount`
- `totals.missing_due_date_count`
- `partners[].open_amount`
- `partners[].overdue_amount`
- `partners[].share_percent`
- `meta.freshness` (`event_driven` | `snapshot` | `unknown`) — **règles opérationnelles** :
  - `event_driven` = au moins un document de la population filtrée a `last_residual_event_at IS NOT NULL` (au moins 1 événement `invoice.residual.changed` reçu)
  - `snapshot` = aucun document n'a `last_residual_event_at` non NULL, mais au moins un document ouvert dans la période (residual issu de `invoice.posted` uniquement)
  - `unknown` = population vide (aucun document ouvert) ou cas indéterminable  
  Si `snapshot` : Linky affiche warning « donnée snapshot »
- `meta.data_quality` (`low` | `medium` | `high`)

**Formule share_percent :**

- `overdue=false` : `share_percent = partner.open_amount / totals.open_amount * 100`
- `overdue=true` : `share_percent = partner.overdue_amount / totals.overdue_amount * 100`
- Si dénominateur = 0 → `share_percent` = 0

**Recommandation UX (Linky) :** si `totals.open_amount == 0` → ne pas afficher la section « Clients à risque » (éviter tableaux vides anxiogènes).

---

## 4. Invariants

1. `overdue_amount` <= `open_amount`
2. `overdue_count_invoices` <= `open_count_invoices`
3. Somme `partners.open_amount` ~= `totals.open_amount` (tolérance 0.01)
4. Si `overdue=true` → population = overdue

---

## 5. Index recommandés

- `(tenant, company_id, invoice_date)`
- `(tenant, company_id, invoice_date_due)`
- `(tenant, company_id, partner_id)`
- `(tenant, company_id, amount_residual)`

---

## Annexe A — Event `invoice.residual.changed` v1.0

### Objectif

Maintenir `amount_residual` à jour dans le Vault.

### Event Type

`invoice.residual.changed`

### Payload minimal

- `tenant`
- `company_id`
- `source.model` = `account.move`
- `source.id`
- `invoice.amount_residual`
- `invoice.invoice_date_due`
- `partner.partner_id`
- `change.changed_at`
- `idempotency.event_id`

### Règle d'update Vault

À réception :

- Upsert facture si absente
- Mettre à jour `amount_residual`
- Mettre à jour `invoice_date_due`
- Conserver dernier `changed_at`

### Idempotence

- `event_id` unique par changement
- Ignore si déjà appliqué

### Garde-fou ordre (anti-régression)

Stocker `last_residual_event_at` par document. À réception :  
si `changed_at <= last_residual_event_at` → ignore (no-op).  
Protège contre arrivées asynchrones et replays.

---

## Annexe B — Contrat `documents`

`documents` est une projection déterministe (dernier état connu) d'un flux d'événements immuable.  
`economic_events` reste la source d'historique.

---

## Implémentation

| Phase | Statut | Document |
|-------|--------|----------|
| Sprint 1 — Données (DVIG + Vault) | ✅ Terminé | `COMPTE_RENDU_AR_BY_PARTNER_Sprint1_2026-02-22.md` |
| Sprint 2 — Route residual + idempotence | ✅ Terminé | `sources/vault/internal/handlers/invoices_residual.go` |
| Sprint 3 — Agrégation ar-by-partner | ✅ Terminé | `GET /ui/aggregations/ar-by-partner` |
| Sprint 4 — Linky + DIVA | À venir | — |

---

## Annexe C — Performance

**Source des données :** table `documents` uniquement. Aucune jointure avec `economic_events`.

---

## Changelog

- **v1.0.4** : meta.freshness — règles opérationnelles explicites ; Annexe C performance (documents only)
- **v1.0.3** : EPS explicite ; meta.freshness règles exactes ; meta.warnings au niveau réponse ; UX totals.open_amount==0
- **v1.0.2** : P0 EUR only + meta.warnings multi-currency ; Garde-fou ordre last_residual_event_at ; Contrat documents (Annexe B)
- **v1.0.1** : Alignement date_debut/date_fin ; Default 12 mois glissants ; partner_id P0 ; freshness + data_quality ; missing_due_date_count ; invoice.residual.changed
- **v1.0** : Endpoint AR by partner (encours + overdue) + filtre `overdue=true`

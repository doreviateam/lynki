# Plan d’implémentation — SPEC_DOREVIA_UI_CARD_SALES_v1.0

**Références** : SPEC_DOREVIA_UI_CARD_SALES_v1.0, SPEC_DOREVIA_UI_AGGREGATIONS_v1.0, VERIFICATION_VAULT_DATE_AMOUNT_PAR_SCOPE.

**Tenant cible** : sarl-la-platine.

---

## 1. Vue d’ensemble

| Étape | Contenu | Statut |
|-------|---------|--------|
| 1 | Endpoint `GET /ui/aggregations/sales` dans Vault (read-only) | À faire |
| 2 | Storage : requête agrégation ventes (invoice_date, total_ttc, move_type=out_invoice) | À faire |
| 3 | Auth / RBAC : lecture documents ou rôle dédié UI | À faire |
| 4 | Appsmith : card « Ventes certifiées » + filtres période / granularité | À faire |

---

## 2. Backend (Vault)

### 2.1 Endpoint

- **Méthode** : `GET`
- **Chemin** : `/ui/aggregations/sales`
- **Paramètres** : `date_debut` (obligatoire), `date_fin` (obligatoire), `granularity` (optionnel, défaut `month`), `tenant` (optionnel si déduit du token/header).

### 2.2 Storage

- Nouvelle méthode `SalesAggregation(ctx, tenant, dateFrom, dateTo, granularity)` dans `internal/storage/` :
  - Filtres : `tenant`, `odoo_model = 'account.move'`, `move_type = 'out_invoice'`, `invoice_date BETWEEN dateFrom AND dateTo`, `invoice_date IS NOT NULL`, `total_ttc IS NOT NULL`.
  - Total : `SUM(total_ttc)`.
  - Séries : `GROUP BY date_trunc(granularity, invoice_date)` (day/week/month), format période `YYYY-MM` pour month, idem jour/semaine selon spec.
  - Optionnel : `last_seal_at` = `MAX(created_at)` sur la même base de filtres.

### 2.3 Sécurité

- Lecture seule ; pas d’écriture.
- Données strictement tenant-scoped (filtre `tenant` obligatoire).
- Exposer l’endpoint sous la même auth que les autres APIs Vault (token / RBAC) ; ajouter la route dans `EndpointPermission` avec `PermissionReadDocuments` (ou rôle dédié UI si défini).

---

## 3. Appsmith (card)

### 3.1 Données

- Appel `GET /ui/aggregations/sales?date_debut={{DatePicker1.selectedDate}}&date_fin=...&granularity={{Dropdown1.selectedOptionValue}}`.
- URL de base : service Vault du tenant (ex. `https://vault.sarl-la-platine.doreviateam.com` ou via gateway).

### 3.2 Rendu

- Titre : **Ventes certifiées**.
- Montant principal : `{{Api1.data.total}}` (format devise + décimales).
- Période : libellé « De date_debut à date_fin ».
- Badge : **Données certifiées** + optionnel « Dernier scellement : … » avec `last_seal_at`.

### 3.3 Interactions

- Sélecteur période (date_debut, date_fin).
- Sélecteur granularité (Jour / Semaine / Mois).
- Bouton ou rafraîchissement auto pour recharger l’API.

---

## 4. Definition of Done (rappel spec)

- [ ] Endpoint `/ui/aggregations/sales` opérationnel (réponse JSON conforme spec).
- [ ] Appsmith affiche la card sans erreur.
- [ ] Les filtres période fonctionnent.
- [ ] La granularité modifie l’agrégation (series).
- [ ] Le badge « Données certifiées » est visible.

---

## 5. Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `sources/vault/internal/models/aggregations.go` | Nouveau : types `SalesAggregationResponse`, `SeriesPoint`. |
| `sources/vault/internal/storage/aggregations_sales.go` | Nouveau : méthode `SalesAggregation`. |
| `sources/vault/internal/handlers/aggregations_sales.go` | Nouveau : handler `GET /ui/aggregations/sales`. |
| `sources/vault/internal/auth/rbac.go` | Ajouter route `/ui/aggregations/sales` → PermissionReadDocuments. |
| Point d’entrée Vault (ex. `cmd/vault/main.go` ou équivalent) | Enregistrer `app.Get("/ui/aggregations/sales", handlers.SalesAggregationHandler(db))`. |

---

Version : v1.0

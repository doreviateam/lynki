# Linky — Récolte des données à la demande depuis le Vault

**Principe** : Linky ne dépend ni d'Odoo ni de DVIG. Toutes les données métier sont récoltées **à la demande** (à chaque requête ou polling) depuis le **Vault** via les API routes Next.js qui font proxy vers le Vault.

**Source de vérité** : `GET /api/tenant` retourne toujours `primary_source: "vault"`. Les libellés « Source : Vault » dans l’UI reflètent cette règle.

---

## 1. Flux général

- **Client (navigateur)** : appelle les routes `/api/*` avec paramètres (tenant, date_debut, date_fin, company_id, etc.).
- **API Linky** : chaque route lit `VAULT_URL` (et éventuellement `TENANT_ID` par défaut), puis fait un `fetch` vers le Vault avec `cache: "no-store"` et `revalidate = 0` / `dynamic = "force-dynamic"`.
- **Vault** : répond avec les agrégations ou données système. Aucun appel direct à Odoo depuis Linky.

---

## 2. Cartographie des données (API Linky → Vault)

| Route Linky | Endpoint Vault | Usage |
|-------------|----------------|-------|
| `GET /api/tenant` | — | Retourne `tenant_id`, `primary_source: "vault"` (pas d’appel Vault). |
| `GET /api/companies` | `GET /ui/companies` | Liste des sociétés (tenant). |
| `GET /api/years-with-data` | `GET /ui/aggregations/sales`, purchases, payments-in, payments-out | Années avec données (pour filtres). |
| `GET /api/dashboard-metrics` | `GET /ui/completeness-snapshot`, `/ui/aggregations/treasury`, `/ui/aggregations/adjustments`, sales, purchases, payments-in, payments-out, sales-by-partner, ar-by-partner, `/ui/system/bank-reconciliation-health`, pos-sessions | Grille d’accueil, KPIs, à la demande (paramètres : tenant, date_debut, date_fin, company_id). |
| `GET /api/sales` | `GET /ui/aggregations/sales` | Ventes. |
| `GET /api/purchases` | `GET /ui/aggregations/purchases` | Achats. |
| `GET /api/sales-by-partner` | `GET /ui/aggregations/sales-by-partner` | Pareto ventes. |
| `GET /api/ar-by-partner` | `GET /ui/aggregations/ar-by-partner` | Encours / AR. |
| `GET /api/payments-in` | `GET /ui/aggregations/payments-in` | Encaissements. |
| `GET /api/payments-out` | `GET /ui/aggregations/payments-out` | Décaissements. |
| `GET /api/treasury` | `GET /ui/aggregations/treasury` + `GET /ui/aggregations/payments-completeness` | Trésorerie + contrôle complétude paiements. |
| `GET /api/adjustments` | `GET /ui/aggregations/adjustments` | Avoirs / remboursements. |
| `GET /api/bank-reconciliation-health` | `GET /ui/system/bank-reconciliation-health` | Santé rapprochement bancaire. |
| `GET /api/pos-sessions` | `GET /ui/aggregations/pos-sessions` | Sessions POS. |
| `GET /api/vault-health` | `GET /ui/system/vault-health` | Indicateur confiance vaultage. |
| `GET /api/platform/status` | `GET /ui/completeness-snapshot`, `/ui/system/vault-health` (+ DVIG health) | Badge intégrité plateforme. |

**Tenant** : lorsqu’il est passé en query (`?tenant=o19`), les routes l’utilisent ; sinon elles utilisent `process.env.TENANT_ID` ou la valeur par défaut (ex. `core`). `dashboard-metrics` utilise bien le `tenant` de la requête depuis la correction 2026-03.

---

## 3. Composants UI et récolte à la demande

- **DashboardWithFilters** : appelle `GET /api/dashboard-metrics` avec tenant, période, company_id ; polling selon `DASHBOARD_METRICS_POLL_MS` ; pas de cache serveur (cache: "no-store").
- **TreasuryCardWithPolling** / **TresoreriePositionCardWithPolling** : `GET /api/treasury` avec polling.
- **BusinessCardWithPolling** : `GET /api/sales`, `/api/purchases`, `/api/sales-by-partner`, `/api/ar-by-partner` avec polling ; source affichée = Vault (plus de fallback ERP).
- **FluxCashCardWithPolling** : `GET /api/payments-in`, `/api/payments-out` avec polling.
- **IconGrid** : peut appeler `GET /api/dashboard-metrics` (minimal) si pas de métriques parent.
- **DivaFlashBlock** : `GET /api/diva/insight` (service DIVA, qui s’appuie sur les métriques Vault) ; prewarm/refresh vers DIVA.
- **LinkyFooter** / **IntegrityBadge** : `GET /api/platform/status` pour le statut plateforme.

Tous ces appels sont déclenchés à l’affichage ou au refresh/polling, sans pré-remplissage depuis Odoo.

---

## 4. Services distincts (hors Vault direct)

- **DIVA** (`DIVA_URL`) : insights / explications ; consomme des métriques déjà dérivées du Vault (via dashboard-metrics ou appels similaires). Linky ne lit pas Odoo pour DIVA.
- **DLP** (énergie stratégique, décisions) : `GET /api/dlp/energy-summary`, `/api/dlp/decisions`, etc. — service DLP dédié, pas le Vault métier Odoo.

---

## 5. Code mort ou legacy

- **`app/lib/odoo-metrics.ts`** : `ODOO_METRICS_URL`, `fetchPostedSalesCount`, `fetchPostedPurchasesCount` — **non utilisé** ailleurs dans Linky. Peut être supprimé ou conservé pour référence si un autre usage est prévu.
- **Liens Odoo** : `TreasuryCardWithPolling`, `ReportHeader` utilisent `NEXT_PUBLIC_ODOO_URL` pour des **liens** (ouvrir Odoo en ligne), pas pour récupérer des données. La donnée affichée reste issue du Vault.

---

## 6. Vérifications effectuées (2026-03)

- Routes `sales`, `purchases`, `ar-by-partner`, `sales-by-partner`, `payments-in`, `payments-out`, `treasury`, `adjustments`, `companies`, `years-with-data`, `dashboard-metrics`, `platform/status`, `vault-health`, `bank-reconciliation-health`, `pos-sessions` : **uniquement Vault**, avec `cache: "no-store"` et `dynamic = "force-dynamic"**.
- **dashboard-metrics** : utilisation du `tenant` passé en query (`searchParams.get("tenant")`) en plus de `TENANT_ID` par défaut.
- **BusinessCardWithPolling** : suppression du check legacy `X-Data-Source === "vault-fallback"` ; source affichée = Vault.

---

**Références** : `DOCUMENT_REVUE_CODE_LINKY_VAULT_O19_2026-03.md`, `units/dorevia-linky/app/api/*/route.ts`, composants `*WithPolling.tsx`, `DashboardWithFilters.tsx`.

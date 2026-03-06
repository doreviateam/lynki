# Résumé — Filtre Company Linky + Vault

**Contexte** : Spec SPEC_VAULT_LINKY_COMPANY v1.1, plan FILTRE_LINKY / PLAN_IMPLEMENTATION_FILTRES_LINKY_SCRUM.md (S4).  
**Règle métier** : Un tenant gère au moins une société (1 à n).  
**Date** : 2026-02-07.

---

## 1. Ce qui a été fait

### 1.1 Vault (`sources/vault/`)

| Élément | Détail |
|--------|--------|
| **Migration** | Colonne `company_id` (TEXT, nullable) + index — fichier `migrations/023_add_company_id_to_documents.sql`, appliquée via `migrateCompanyID()` dans le storage Postgres. |
| **Modèle** | `internal/models/document.go` — champ `CompanyID *string` avec `db:"company_id"`. |
| **Storage** | `internal/storage/companies.go` — `ListCompanies(ctx, tenant)` retourne `[]CompanyCount` (company_id, documents_count), tri `ORDER BY company_id ASC`. |
| **Agrégations** | `aggregations_sales.go` et `aggregations_purchases.go` — paramètre `companyID string` ; si non vide, filtre `AND company_id = $4` (documents sans company_id exclus). |
| **INSERT document** | `document_with_evidence.go` — colonne et valeur `company_id` ajoutées à l’INSERT. |
| **Handlers** | `handlers/aggregations_sales.go` et `aggregations_purchases.go` — lecture de `company_id` en query et passage au storage. |
| **Handler companies** | `internal/handlers/companies.go` — `CompaniesHandler(db)` pour GET /ui/companies?tenant=… (réponse JSON liste triée). |
| **Events / ingest** | `handlers/events.go` — lecture de `payload.Payload["company_id"]` et affectation à `doc.CompanyID` (company_id obligatoire pour nouveaux events selon annexe v1.2). |
| **RBAC** | `internal/auth/rbac.go` — endpoint `"/ui/companies"` mappé à `PermissionReadDocuments`. |
| **Point d'entrée** | `cmd/vault/main.go` — config, DB, Fiber, routes `/`, `/health`, `/version`, `/dbhealth`, `/ui/aggregations/sales`, `/ui/aggregations/purchases`, **`/ui/companies`** (CompaniesHandler(db)), graceful shutdown. |

**Build** : `go build ./...` et `go build -o vault ./cmd/vault` réussissent.

**Déploiement (suite possible)** : image `dorevia/vault:v1.5.0-company` construite (routes : health, version, dbhealth, events, proof, ui/aggregations/sales|purchases, **ui/companies**). Compose `tenants/core-stinger/platform/docker-compose.yml` mis à jour ; service `vault-core-stinger` recréé. GET /ui/companies?tenant=sarl-la-platine → 200 et `[]` (liste vide tant qu’aucun document n’a de company_id).

### 1.2 Linky (`units/dorevia-linky/`)

| Élément | Détail |
|--------|--------|
| **API companies** | `app/api/companies/route.ts` — GET /api/companies, proxy vers Vault GET /ui/companies avec **timeout 5 s** (AbortController) ; en erreur/timeout retourne `[]`. |
| **Types** | `app/types/aggregations.ts` — type `CompanyItem` (company_id, documents_count). |
| **API sales / purchases** | `app/api/sales/route.ts` et `app/api/purchases/route.ts` — lecture de `company_id` dans les searchParams et passage au Vault (sauf pour l’appel « global » qui sert à `global_invoices_count`). |
| **ReportHeader** | `components/ReportHeader.tsx` — props `companies`, `companiesLoading`, `selectedCompanyId`, `onCompanyChange` ; filtre Société toujours affiché (invariant : un tenant gère au moins une société) ; select « Tout » + une option par company (display_name ou company_id). |
| **DashboardWithFilters** | `components/DashboardWithFilters.tsx` — state `companies` et `selectedCompanyId` ; au mount, fetch GET /api/companies?tenant=… et mise à jour de `companies` ; passage à ReportHeader et aux cartes de `companyId={selectedCompanyId ?? undefined}`. |
| **Cartes avec polling** | `SalesCardWithPolling.tsx` et `PurchasesCardWithPolling.tsx` — prop `companyId` ; ajout de `company_id` aux paramètres des appels /api/sales et /api/purchases quand renseigné ; `companyId` dans les deps de l’effet (refetch + polling quand la company change). |

**Comportement actuel** : le filtre Société est toujours affiché (sélecteur avec au minimum « Tout ») ; les sociétés sont chargées via GET /api/companies ; pendant le chargement le select est désactivé.

### 1.3 Build et déploiement

- Image Docker **dorevia/linky:latest** construite depuis `units/dorevia-linky` (Next.js 14, output standalone).
- Rendu des artefacts pour **sarl-la-platine** (env **stinger** et **lab**) : Caddyfile, docker-compose platform, docker-compose app (odoo, ui).
- Conteneurs Linky démarrés : `linky_stinger_sarl-la-platine`, `linky_lab_sarl-la-platine`.
- Gateway Caddy : Caddyfile global agrégé et rechargé.

### 1.4 Documentation

- `PLAN_IMPLEMENTATION_FILTRES_LINKY_SCRUM.md` — US-3.1 (filtre Company) cochée, S4 marqué « Livré », Definition of Done mise à jour ; note ajoutée sur l’enregistrement de la route Vault.

---

## 2. Reste à faire (spécification alignée à l’existant)

**Réfs** : SPEC_VAULT_LINKY_COMPANY v1.0 (v1.1), PLAN_IMPLEMENTATION_FILTRES_LINKY_SCRUM.md S4, annexe normative v1.2.  
**Convention** : même format que le plan (US, critères, tâches techniques, fichiers).

---

### 2.1 US-V1 — Exposer GET /ui/companies dans le service Vault (bloquant)

**En tant que** consommateur Linky (ou tout client UI),  
**je veux** que le Vault réponde à GET /ui/companies?tenant=&lt;tenant_id&gt;,  
**afin que** le filtre Company affiche la liste des companies (Tout + options) au lieu de « Company : Non applicable ».

**Critères d’acceptation**
- [x] La route GET /ui/companies est enregistrée dans l’application Fiber qui sert le Vault.
- [x] Le handler utilisé est `handlers.CompaniesHandler(db)` (déjà implémenté dans `sources/vault/internal/handlers/companies.go`).
- [x] Le RBAC pour `"/ui/companies"` est déjà défini dans `internal/auth/rbac.go` (PermissionReadDocuments) ; aucun changement RBAC requis.
- [x] Après déploiement du binaire mis à jour, un appel GET /ui/companies?tenant=sarl-la-platine retourne 200 et un JSON tableau (éventuellement vide) au lieu de 404.

**Tâches techniques**
- Localiser ou créer le **point d’entrée** du service Vault qui construit l’app Fiber et enregistre les routes (ex. `cmd/vault/main.go`). Le Dockerfile `sources/vault/Dockerfile` référence `go build -o vault ./cmd/vault` ; le point d'entrée est `sources/vault/cmd/vault/main.go` (présent dans ce dépôt) et la route GET /ui/companies y est enregistrée.
- Au même endroit que les autres routes UI (ex. `app.Get("/ui/aggregations/sales", ...)`, `app.Get("/ui/aggregations/purchases", ...)`), ajouter :
  ```go
  app.Get("/ui/companies", handlers.CompaniesHandler(db))
  ```
- S’assurer que `db` est la même instance `*storage.DB` que pour les handlers d’agrégations.
- Reconstruire l’image Vault et redéployer le service pour l’environnement cible (ex. lab, stinger).

**Fichiers concernés** : `sources/vault/cmd/vault/main.go`, `sources/vault/internal/handlers/companies.go`, `internal/auth/rbac.go`, `Dockerfile`.  

**Priorité** : P0 — livré. Image `dorevia/vault:v1.5.0-company` construite et déployée sur vault-core-stinger (events, proof, UI companies).

---

### 2.2 US-V2 — Données company_id pour alimenter la liste (liste non vide)

**En tant qu’** utilisateur Linky,  
**je veux** que le sélecteur Company propose au moins une option (en plus de « Tout ») lorsque mon tenant a des documents associés à une société,  
**afin que** je puisse filtrer les indicateurs par company.

**Critères d’acceptation**
- [ ] Les documents insérés ou mis à jour portent un `company_id` au format normatif `<source_system>:<source_company_id>` (spec v1.1, annexe v1.2).
- [ ] `storage.ListCompanies(tenant)` retourne des lignes dès qu’il existe des documents du tenant avec `company_id` non NULL (déjà implémenté dans `internal/storage/companies.go`).
- [ ] Optionnel : pour les documents legacy sans `company_id`, une mise à jour one-shot ou un script peut remplir `company_id` si les règles métier le permettent.

**Tâches techniques**
- Côté **ingest** : les events (POST /api/v1/events) doivent envoyer `company_id` dans le payload ; le handler `handlers/events.go` lit déjà `payload.Payload["company_id"]` et l’affecte à `doc.CompanyID`.
- Côté **connecteur Odoo / DVIG** : s’assurer que chaque event envoyé au Vault contient `company_id` (format normatif) et que la clé d’idempotence inclut company_id (annexe v1.2).
- Si besoin de peupler le passé : script ou migration de données pour mettre à jour `documents.company_id` sur les enregistrements existants (hors périmètre strict du filtre Linky).

**Fichiers concernés** : `sources/vault/internal/handlers/events.go`, connecteur DVIG/Odoo (hors repo Vault si applicable).

**Priorité** : P1 — la route suffit pour afficher le sélecteur avec « Tout » ; P1 pour avoir des options réelles.

**Remédiation legacy** : backfill possible sur les documents existants (company_id NULL). Voir `scripts/backfill_vault_company_id.md` : option 1 = SQL unique company par tenant (ex. `UPDATE documents SET company_id = 'odoo:1' WHERE tenant = 'sarl-la-platine' AND company_id IS NULL`) ; option 2 = dériver depuis payload_json ; option 3 = nouveaux events uniquement (US-V2).

---

### 2.3 Optionnel — Message legacy (US-3.1, phase 2)

**Critère spec** : *« Si filtre company actif et présence de documents legacy (sans company_id) : message non bloquant « Certaines pièces historiques ne sont pas encore associées à une société et sont exclues du périmètre. » »*

**Tâche** : afficher ce message dans l’UI Linky lorsque l’utilisateur a sélectionné une company et que le backend pourrait exclure des documents sans `company_id`. Implémentation différée en phase 2 (non bloquante pour le filtre Company).

**Réf** : PLAN_IMPLEMENTATION_FILTRES_LINKY_SCRUM.md, US-3.1 critère resté [ ].

---

### 2.4 Optionnel — Vérification Odoo / DVIG (spec v1.1)

- Envoi **obligatoire** de `company_id` (format normatif) pour chaque event.
- Clé d’idempotence incluant tenant + source_system + source_document_id + company_id (annexe v1.2).
- À valider dans le dépôt ou la config du connecteur qui envoie les events au Vault.

---

## 3. Synthèse

| Zone | Fait | Reste à faire |
|------|------|----------------|
| **Vault (code)** | Migration, modèle, storage ListCompanies, handler CompaniesHandler, RBAC, agrégations + company_id, ingest company_id | **Enregistrer GET /ui/companies dans le main** |
| **Vault (données)** | — | Documents avec company_id (ingest ou mise à jour legacy) pour que la liste ne soit pas vide |
| **Linky** | Filtre Company (UI + état + passage company_id aux API), timeout/fallback companies | — |
| **Deploy** | Image Linky, render + conteneurs lab/stinger sarl-la-platine | — |
| **Doc / plan** | Plan S4 et US-3.1 mis à jour | — |

**Prochaine action recommandée** : US-V2 (données company_id via ingest / connecteur) pour que le sélecteur Company affiche des options d’options dans le sélecteur.

---

## 4. Backlog restant (aligné plan S4)

| Id | Objectif | Priorité | État |
|----|----------|----------|------|
| **US-V1** | Exposer GET /ui/companies dans le binaire Vault | P0 | Livré (image v1.5.0-company déployée) |
| **US-V2** | Données company_id (ingest / connecteur) pour liste non vide | P1 | À faire |
| **Optionnel** | Message legacy « pièces historiques non associées » (US-3.1) | P2 | Phase 2 |
| **Optionnel** | Vérif. Odoo/DVIG : company_id + idempotence (annexe v1.2) | P2 | À valider |

# Note — Linky, Vault comme gateway unique et offre ERP-agnostique

**Date :** 2026-03-15  
**Contexte :** Analyse des sources de données affichées dans Linky ; alignement avec une offre ERP-agnostique (Vault = seule passerelle).  
**Référence :** Analyse technique codebase Linky + Vault (mars 2026).

**Décision normative :** La décision d’architecture formalisée (statut Accepted) et l’engagement ERP-agnostique figurent dans **ADR-001 — Linky : Vault comme gateway unique (ERP-agnostique)** (ZeDocs/web51/ADR-001_LINKY_VAULT_GATEWAY_UNIQUE.md). La présente note détaille l’état des lieux et la proposition technique.

**Principe normatif :** Linky ne consomme jamais directement un ERP, DLP, DIVA ou tout autre service métier ; il consomme exclusivement des endpoints exposés par le Vault.

---

## 1. Objectif

Définir et documenter le principe selon lequel **toutes les données consommées par Linky transitent exclusivement par le Vault, qui constitue la gateway unique**, afin de :

- Renforcer le positionnement **ERP-agnostique** : un seul contrat d’interface (Linky ↔ Vault).
- Simplifier le déploiement et la sécurité (une seule URL, un seul périmètre).
- Permettre l’évolution ou la substitution des services en aval (DLP, DIVA, Odoo) sans modifier Linky.

---

## 2. État des lieux — sources de données affichées dans Linky

### 2.1 Données provenant exclusivement du Vault (Linky → Vault uniquement)

Les API Linky suivantes sont des **proxys directs** vers le Vault. Aucun autre service n’est appelé par Linky pour ces données.

| Domaine | Route Linky | Route Vault (ou équivalent) | Données affichées |
|--------|-------------|-----------------------------|-------------------|
| Trésorerie | `/api/treasury` | `/ui/aggregations/treasury`, `/ui/aggregations/payments-completeness` | Solde, rapprochement, complétude |
| Ventes | `/api/sales` | `/ui/aggregations/sales` | CA, factures, ratio certifié (posted_sales_count) |
| Achats | `/api/purchases` | `/ui/aggregations/purchases` | Achats, ratio certifié (posted_purchases_count) |
| Business (synthèse) | `/api/dashboard-metrics` | multiples `/ui/aggregations/*` | Toutes les tuiles KPI (sauf DLP) |
| Paie / EBE | `/api/payroll`, `/api/dashboard-metrics` (ebitda) | `/ui/aggregations/payroll` | Charges de personnel, EBE |
| Paiements | `/api/payments-in`, `/api/payments-out` | `/ui/aggregations/payments-in|out` | Encaissements, décaissements |
| Encours / BFR | `/api/ar-by-partner`, dashboard-metrics | `/ui/aggregations/ar-by-partner` | Créances, BFR |
| AP (dettes fournisseurs) | `/api/ap-by-partner` | `/ui/aggregations/ap-by-partner` | Dettes par partenaire |
| Notes de crédit / Remboursements | `/api/adjustments`, dashboard-metrics | `/ui/aggregations/adjustments` | Avoirs, remboursements |
| POS | `/api/pos-sessions` | `/ui/aggregations/pos-sessions` | Sessions, ventes caisse |
| Companies | `/api/companies`, `/api/cockpit/companies` | `/ui/companies` | Sociétés / company_id |
| Complétude / preuves | dashboard-metrics | `/ui/completeness-snapshot`, `/ui/system/vault-health` | Nombre de preuves scellées |
| Évolutions | `/api/ebe-evolution`, `/api/treasury-evolution`, `/api/ar-evolution`, `/api/bfr-evolution` | `/ui/aggregations/ebe-evolution`, treasury-series, ar-series, bfr-series | Séries temporelles |
| Santé rapprochement | `/api/bank-reconciliation-health` | `/ui/system/bank-reconciliation-health` | Lignes non rapprochées, dernière date import |

**Conclusion partielle :** Tous les **montants et indicateurs métier** (KPI des cartes Trésorerie, Business, EBE, Flux net, Paiements, Encours, BFR, Taxes, POS, ratio certifié) **transitent par le Vault** (agrégés et exposés par lui). Le ratio certifié (posted_sales_count / posted_purchases_count) est renvoyé par le Vault dans les réponses sales/purchases (single-source Vault = invoices_count).

---

### 2.2 Écarts actuels — dépendances directes de Linky hors Vault

Deux cas constituent des **écarts à résorber** (dépendances directes de Linky à un service autre que le Vault). Un troisième cas (bank reconciliation health) est déjà conforme (Linky → Vault → Odoo).

#### 2.2.1 DLP — Énergie stratégique

| Élément | Détail |
|--------|--------|
| **Ce qui est affiché** | Tuile « Énergie stratégique » (grille synthèse) ; bloc DLP (cockpit). |
| **Source technique** | Linky appelle **directement** le service DLP (`DLP_URL`). |
| **Routes concernées** | `GET /api/dlp/energy-summary` (Linky) → `GET {DLP_URL}/api/v1/dlp/energy-summary`. Également utilisée dans `dashboard-metrics` pour la tuile strategic_energy. |
| **Variables d’environnement Linky** | `DLP_URL`. |

La donnée affichée (hits, résumé énergie) **ne passe pas par le Vault**. Linky a une dépendance directe à un second service.

#### 2.2.2 DIVA — Bloc flash / insights

| Élément | Détail |
|--------|--------|
| **Ce qui est affiché** | Bloc DIVA (commentaire généré, explications, insights). |
| **Source technique** | Linky appelle **directement** le service DIVA (`DIVA_URL`). |
| **Routes concernées** | `/api/diva/explain`, `/api/diva/explain/async`, `/api/diva/prewarm`, `/api/diva/refresh`, `/api/diva/insight`, `/api/diva/jobs/[contextHash]` → autant d’appels vers `{DIVA_URL}/...`. |
| **Variables d’environnement Linky** | `DIVA_URL`, `DIVA_TIMEOUT_MS`, `DIVA_PREWARM_ENABLED`, etc. |

Le **contenu affiché** (texte généré) est produit par DIVA (Mistral). Les entrées de DIVA peuvent s’appuyer sur des données Vault, mais l’appel HTTP est fait par Linky vers DIVA, pas vers le Vault.

#### 2.2.3 Bank reconciliation health — proxy Odoo côté Vault

| Élément | Détail |
|--------|--------|
| **Ce qui est affiché** | Métadonnées de rapprochement bancaire (dernière date d’import, nombre de lignes non rapprochées, etc.). |
| **Source technique** | Linky appelle **uniquement le Vault** (`GET /ui/system/bank-reconciliation-health`). En revanche, le **Vault** lui-même **proxifie** vers Odoo (config `ODOO_BANK_RECONCILIATION_URL_*`) pour construire la réponse. |
| **Chaîne** | Linky → Vault → Odoo. |

Du point de vue Linky, la donnée **transite** par le Vault (une seule URL). La **source métier** reste Odoo ; pour une offre ERP-agnostique, à terme on peut envisager que le Vault agrège d’autres sources (autre ERP, fichier bancaire, etc.) sans changer Linky. Ce cas est donc **architecturalement conforme** au gateway unique (Linky ne parle qu’au Vault).

**Doctrine réutilisable :** Le fait qu’une donnée transite par le Vault ne préjuge pas de sa source métier d’origine ; il définit uniquement le contrat d’accès consommé par Linky.

---

### 2.3 Synthèse état des lieux

| Type de donnée | Source côté Linky | Conforme « gateway unique » ? |
|----------------|-------------------|-------------------------------|
| KPI métier (trésorerie, business, EBE, flux, encours, BFR, POS, etc.) | Vault uniquement | Oui |
| Ratio certifié (ventes/achats) | Vault (inclus dans sales/purchases) | Oui |
| Bank reconciliation health | Vault (Vault proxy Odoo) | Oui (Linky → Vault uniquement) |
| Tuile Énergie stratégique (DLP) | DLP directement | Non (écart) |
| Bloc DIVA (flash, insights) | DIVA directement | Non (écart) |

La mise en œuvre des proxies DLP et DIVA vise à supprimer ces écarts.

---

## 3. Intérêt pour une offre ERP-agnostique

- **Un seul contrat d’interface** : « Linky consomme uniquement le Vault. » Message clair pour les intégrateurs, les clients et la sécurité.
- **Un seul point d’entrée** : en production, Linky n’a besoin que de `VAULT_URL` (et éventuellement d’auth). DLP et DIVA deviennent des **composants derrière le Vault**, et non des dépendances directes de Linky.
- **Substitution possible** : remplacement ou évolution de DLP ou DIVA sans toucher à Linky, en ne modifiant que le Vault.
- **Cohérence** : aujourd’hui les KPI viennent du Vault ; en routant aussi DLP et DIVA via le Vault, **tout** ce que Linky affiche transite par la même passerelle.

Corriger les exceptions DLP et DIVA est donc **pertinent** pour tenir le message « offre ERP-agnostique, Vault = gateway unique ».

---

## 4. Proposition — Vault comme gateway unique (DLP et DIVA)

### 4.1 Principe

- Linky **n’appelle plus jamais** DLP ni DIVA directement.
- Le Vault **expose des routes** qui :
  - reçoivent les paramètres (tenant, company_id, période, etc.) ;
  - appellent en interne le service DLP ou DIVA (configuré côté Vault) ;
  - renvoient la réponse au client (Linky).

Ainsi, **toutes** les données consommées par Linky **transitent exclusivement par le Vault** (unique point d’appel). Le Vault peut les servir directement ou les proxifier depuis des services aval (DLP, DIVA, Odoo) sans modifier le contrat Linky.

### 4.2 DLP — proposition technique

| Élément | Proposition |
|--------|-------------|
| **Nouvelle route Vault** | `GET /ui/dlp/energy-summary?tenant=…&company_id=…&period_days=…` (ou équivalent aligné sur l’API DLP actuelle). |
| **Comportement** | Le handler Vault appelle `DLP_URL` avec les paramètres (tenant, company_id, period_days), puis retourne la réponse (body + statut). Timeout et erreurs gérés côté Vault (ex. 503 si DLP indisponible). |
| **Config Vault** | `DLP_URL` (et optionnellement `DLP_TIMEOUT_MS`) dans la configuration du Vault. |
| **Côté Linky** | Remplacer tout appel à `DLP_URL` par un appel à `VAULT_URL + /ui/dlp/energy-summary` (ou chemin retenu). Supprimer la variable d’environnement `DLP_URL` de Linky. |
| **Fichiers Linky concernés** | `app/api/dashboard-metrics/route.ts` (appel DLP pour tuile strategic_energy), `app/api/dlp/energy-summary/route.ts` (remplacer par proxy vers Vault). |

### 4.3 DIVA — proposition technique

| Élément | Proposition |
|--------|-------------|
| **Nouvelles routes Vault** | Par exemple : `GET /ui/diva/explain`, `POST /ui/diva/generate`, `GET /ui/diva/insights`, `GET /ui/diva/jobs/:contextHash`, etc., en miroir des routes DIVA utilisées par Linky. |
| **Comportement** | Chaque handler Vault proxy la requête vers `DIVA_URL` (même méthode, query/body transmis, headers utiles). Timeouts et erreurs gérés côté Vault. |
| **Config Vault** | `DIVA_URL`, `DIVA_TIMEOUT_MS`, `DIVA_PREWARM_TIMEOUT_MS`, etc. |
| **Côté Linky** | Remplacer tout appel à `DIVA_URL` par `VAULT_URL + /ui/diva/...`. Supprimer `DIVA_URL` et les variables DIVA de l’environnement Linky. |
| **Fichiers Linky concernés** | `app/api/diva/explain/route.ts`, `app/api/diva/explain/async/route.ts`, `app/api/diva/prewarm/route.ts`, `app/api/diva/refresh/route.ts`, `app/api/diva/insight/route.ts`, `app/api/diva/jobs/[contextHash]/route.ts`. |

### 4.4 Bank reconciliation health

Aucun changement côté Linky : la chaîne Linky → Vault → Odoo reste conforme au gateway unique. Une évolution future peut faire que le Vault agrège d’autres sources (autre ERP, fichiers) sans impact sur Linky.

---

## 5. Bénéfices attendus

| Bénéfice | Description |
|----------|-------------|
| **Message commercial** | « Toutes les données consommées par Linky transitent exclusivement par le Vault, gateway unique. » Offre ERP-agnostique, contrat d’interface unique. |
| **Déploiement** | Linky ne nécessite plus que `VAULT_URL` (et auth si applicable). Moins de variables, moins d’erreurs de config. |
| **Sécurité / périmètre** | Un seul domaine à autoriser (Vault) ; DLP et DIVA ne sont plus exposés directement au front. |
| **Évolution** | Remplacement ou évolution de DLP/DIVA derrière le Vault sans modifier Linky. |
| **Cohérence architecture** | Vault = unique gateway pour toute donnée consommée par Linky (qu’il la produise ou la proxifie). |

---

## 6. Ordre de grandeur des chantiers

| Chantier | Estimation | Commentaire |
|----------|------------|-------------|
| Vault : routes proxy DLP | 1–2 j | Une route (energy-summary), config, tests. |
| Vault : routes proxy DIVA | 2–3 j | Plusieurs routes (explain, generate, insights, jobs), config, timeouts. |
| Linky : bascule DLP vers Vault | 0,5 j | Remplacer URL + supprimer DLP_URL. |
| Linky : bascule DIVA vers Vault | 1 j | Remplacer URL dans toutes les routes diva/* + supprimer DIVA_URL. |
| Recette / doc | 1 j | Vérifier tuile DLP + bloc DIVA ; mettre à jour ZeDocs / runbooks. |

---

## 7. Références et suite

- **Code analysé** : `units/dorevia-linky/app/api/*` (routes), `sources/vault/internal/handlers/*` (agrégations, bank-reconciliation-health).
- **Décision normative** : ADR-001 (ZeDocs/web51/ADR-001_LINKY_VAULT_GATEWAY_UNIQUE.md) — « Linky consomme exclusivement des endpoints exposés par le Vault » ; mise en œuvre des proxies DLP et DIVA pour supprimer les écarts actuels.
- **Runbooks** : mettre à jour les runbooks de déploiement Linky (suppression de DLP_URL et DIVA_URL, uniquement VAULT_URL).

---

*ZeDocs/web51 — Note Linky, Vault gateway unique, offre ERP-agnostique — 2026-03-15.*

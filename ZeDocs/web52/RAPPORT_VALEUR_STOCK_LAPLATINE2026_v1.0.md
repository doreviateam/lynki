# Rapport — Comment aller chercher la valeur du stock pour le tenant laplatine2026

**Version :** 1.2  
**Date :** 2026-03-15  
**Contexte :** ZeDocs/web52 — Exposer la valorisation inventaire (stock) pour laplatine2026 dans Linky.

**Décision :** Retenu **Option B** (snapshots stock en base Vault) — historique en série temporelle, pas d’appel Odoo à la volée, alignement avec les autres agrégations (BFR, trésorerie).

---

## 1. Contexte et état actuel

### 1.1 Stack laplatine2026

- **Tenant :** laplatine2026 (SARL La Platine)
- **ERP :** Odoo 18 (conteneur `odoo_lab_laplatine2026`, base `laplatine2026`)
- **UI :** Linky (conteneur `linky_lab_laplatine2026`), accès via reverse proxy
- **Gateway :** Vault (ADR-001) — Linky ne parle qu’au Vault ; le Vault peut appeler Odoo pour certaines agrégations (ex. rapprochement bancaire)

### 1.2 Où en est le stock aujourd’hui ?

- **Dans Linky :** la carte BFR (Besoin en Fonds de Roulement) affiche **BFR = AR (créances) − AP (dettes)**. Une ligne « Stocks — Valorisation inventaire » est affichée avec le badge **« Hors périmètre »** : la valeur du stock n’est **pas** fournie par le Vault ni par Linky.
- **Dans le Vault :** aucune agrégation ni endpoint dédié à la valorisation du stock. Le BFR exposé (`/ui/aggregations/bfr-series`) est calculé uniquement à partir des snapshots AR/AP en base Vault.
- **Dans Odoo :** la donnée existe (valorisation des stocks), mais n’est pas remontée vers le Vault ni Linky.

**Conclusion :** Pour connaître la valeur du stock pour laplatine2026, il faut la **faire remonter depuis Odoo** jusqu’à Linky, en passant par le Vault (conformité ADR-001).

---

## 2. Où se trouve la donnée « valeur du stock » dans Odoo ?

### 2.1 Modules et modèles

- **Module concerné :** `stock_account` (valorisation comptable des stocks). Sans ce module, Odoo gère les quantités mais pas la valeur.
- **Rapport standard :** *Inventaire → Analyse → Valorisation* (ou *Valuation* ; menu visible en **mode développeur**). Colonnes typiques : Date, Référence, Produit, Quantité, Valeur unitaire, Valeur totale.
- **Modèles utiles (selon version Odoo) :**
  - **stock.valuation.layer** : couches de valorisation (entrées/sorties, coût unitaire, valeur).
  - **report.stock.quantity** (vue SQL) : quantités et valorisation par produit / emplacement / date.
  - **stock.quant** : quantités en stock ; selon la config, un champ de valeur peut être disponible ou dérivé.

La **source de vérité fonctionnelle** est la valorisation d’inventaire Odoo à date, telle qu’exposée par le rapport standard de valorisation (*Inventaire → Analyse → Valorisation*) ; l’implémentation pourra s’appuyer sur `stock.valuation.layer` ou une logique équivalente reproduisant cette sémantique métier.

### 2.2 Méthodes de valorisation Odoo

- **Prix standard** (Standard price)
- **Coût moyen** (AVCO)
- **FIFO** (First In, First Out)

La méthode configurée sur les produits/catégories détermine comment la valeur est calculée ; l’API ou le rapport de valorisation reflète déjà ce choix.

### 2.3 Prérequis côté laplatine2026

- Module **stock_account** (ou équivalent selon édition) installé et configuré sur la base `laplatine2026`.
- Droits en lecture sur les modèles de valorisation pour le compte technique utilisé par le connecteur (ex. `SUPERUSER_ID` ou service dédié).
- **UI Odoo :** le menu *Valorisation* (*Inventaire → Analyse → Valorisation*) n’est visible qu’en **mode développeur** ; le rapport **Stock** (quantités) n’a pas la même sémantique que le rapport **Valorisation** (valeur d’inventaire). Pour le BFR et la valeur de stock affichée dans Linky, la référence est bien la **valorisation**, pas le simple rapport Stock.
- **Valorisation Odoo :** elle peut être **périodique/manuelle** ou **perpétuelle/automatique** ; une valorisation automatique intégrée passe par la configuration comptable dédiée (Comptabilité / Valorisation). Comme le besoin Dorevia est d’**historiser une valeur produite par Odoo**, le présent rapport reste valable dans les deux cas.

---

## 3. Options pour exposer la valeur du stock à Linky

### 3.1 Option A — Variante de référence / non retenue

**Principe :** même pattern que le rapprochement bancaire (Linky → Vault → Odoo).

1. **Odoo**  
   - Nouveau contrôleur HTTP dans `dorevia_vault_connector`, ex. :  
     `GET /dorevia/vault/linky_stock_valuation`  
   - Paramètres : `company_id` (optionnel), `as_of_date` (optionnel, défaut = aujourd’hui), `tenant` (optionnel).  
   - Réponse JSON : ex. `{ "value": 12345.67, "currency": "EUR", "company_id": "odoo:1" }` en sommant la valorisation des stocks de la société.

2. **Vault**  
   - Nouvelle variable de config par tenant, ex. :  
     `ODOO_STOCK_VALUATION_URL_LAPLATINE2026=http://odoo_lab_laplatine2026:8069/dorevia/vault/linky_stock_valuation`  
   - Nouveau handler (ex. `GET /ui/aggregations/stock-valuation`) qui appelle cette URL, avec timeout et gestion d’erreur (503 si Odoo injoignable, 502 si erreur aval).

3. **Linky**  
   - Nouvelle route API (ex. `GET /api/stock-valuation`) qui appelle le Vault `GET /ui/aggregations/stock-valuation`.  
   - Carte BFR (ou carte dédiée « Stock ») : remplacer « Hors périmètre » par la valeur renvoyée par le Vault (et optionnellement afficher une série d’évolution si le Vault expose des points historiques).

**Avantages :** aligné sur l’existant (bank_reconciliation), Linky reste Vault-only, un seul point d’appel Odoo (Vault).

### 3.2 Option B — Snapshots stock en base Vault

**Principe :** Odoo (ou un job) pousse périodiquement la valeur du stock vers le Vault ; le Vault stocke des snapshots (ex. table `stock_valuation_snapshots` : tenant, company_id, as_of_date, value, currency) et expose une agrégation (ex. `GET /ui/aggregations/stock-series`).

**Avantages :** pas d’appel Odoo à la volée ; historique et séries temporelles naturels ; lecture Linky toujours rapide (données déjà en Vault).  
**Inconvénients :** nouveau flux de données (Odoo → Vault), migration/schema Vault, conception du job (fréquence, idempotence).

### 3.3 Option C — Appel direct Odoo depuis Linky

**Principe :** Linky appelle une URL Odoo (ex. fournie par une variable d’environnement) pour récupérer la valeur du stock.

**Inconvénient :** en contradiction avec l’ADR-001 (Linky ne doit pas appeler un service autre que le Vault). **À écarter** pour rester conforme.

---

## 4. Annexe A — Option A (variante de référence, non retenue)

L’**Option A** (controller Odoo + proxy Vault) n’est pas retenue au profit de l’Option B. Elle reste décrite ci‑dessous car elle sert de **référence utile** pour : factoriser la logique de calcul côté Odoo (réutilisable par le job Option B), fournir un endpoint de debug ponctuel, et alimenter la variante B2 (job externe qui appelle Odoo puis pousse vers le Vault).

### 4.1 Étapes techniques (résumé)

| Étape | Zone | Action |
|-------|------|--------|
| 1 | Odoo (dorevia_vault_connector) | Créer `controllers/linky_stock_valuation.py` : route `GET /dorevia/vault/linky_stock_valuation`, lecture de la valorisation (stock.valuation.layer ou report équivalent), filtrage `company_id`, retour JSON `{ value, currency, company_id }`. |
| 2 | Vault | Ajout config `ODOO_STOCK_VALUATION_URL_LAPLATINE2026` (ou générique par tenant). Handler `GET /ui/aggregations/stock-valuation` (paramètres tenant, company_id, as_of_date) qui appelle cette URL et renvoie le JSON normalisé (ou 502/503 en cas d’erreur). |
| 3 | Linky | Route `GET /api/stock-valuation` (proxy vers Vault). Carte BFR : appeler cette API et afficher la valeur du stock à la place de « Hors périmètre » (ou carte dédiée Stock). |
| 4 | Recette | Vérifier sur laplatine2026 que la valeur affichée dans Linky coïncide avec le rapport Valorisation d’Odoo (société, date). |

### 4.2 Détail côté Odoo (controller)

- **Route :** `GET /dorevia/vault/linky_stock_valuation?company_id=odoo:1&as_of_date=2026-03-15`
- **Logique :**  
  - Résolution de la société depuis `company_id` (ex. `odoo:1` → `res.company(1)`).  
  - Requête sur les couches de valorisation (ou le rapport) pour la société, éventuellement filtrées par `as_of_date` (≤ date).  
  - Somme des valeurs, devise de la société.  
  - Réponse : `{ "value": <float>, "currency": "EUR", "company_id": "odoo:1" }`.
- **Sécurité :** auth="public" + contrôle d’origine (IP / reverse proxy) ou token partagé avec le Vault, comme pour `linky_bank_reconciliation`.

### 4.3 Détail côté Vault

- **Config :** par tenant, ex. `ODOO_STOCK_VALUATION_URL_LAPLATINE2026=http://odoo_lab_laplatine2026:8069/dorevia/vault/linky_stock_valuation`. Si l’URL est vide, le handler renvoie 503 `gateway_unconfigured`.
- **Handler :** GET `/ui/aggregations/stock-valuation?tenant=laplatine2026&company_id=odoo:1&as_of_date=YYYY-MM-DD` → appel HTTP vers l’URL configurée avec ces paramètres, timeout (ex. 10 s), retour du JSON ou erreur normalisée.

### 4.4 Détail côté Linky

- **API :** `GET /api/stock-valuation?tenant=laplatine2026&company_id=odoo:1&as_of_date=...` → proxy vers `VAULT_URL/ui/aggregations/stock-valuation` avec les mêmes paramètres.
- **Carte BFR :** aujourd’hui la ligne « Stocks » affiche « Hors périmètre ». Une fois l’API en place, appeler `GET /api/stock-valuation` (même tenant/company que le reste de la carte) et afficher la valeur (et la devise). Optionnel : garder un indicateur « Source : Odoo (via Vault) ».

---

## 4bis. Option B en détail — Snapshots stock en base Vault

Cette section détaille l’**Option B** pour une mise en œuvre par envoi périodique de la valeur du stock depuis Odoo vers le Vault, avec stockage en base et exposition en série temporelle.

**Doctrine :**  
- **Odoo** décide comment la valeur est calculée (méthode de valorisation, règles comptables).  
- **Vault** n’interprète pas la méthode de valorisation ; Vault **historise** la valeur de stock produite par Odoo à une date donnée.  
- **Linky** affiche cette valeur comme snapshot historisé.

Le snapshot de stock ne vise pas à décrire la méthode de valorisation Odoo, mais à **historiser la valeur de stock calculée par Odoo** pour une société donnée à une date donnée.

**Règle canonique :** le snapshot ne stocke **que des valeurs valides**. Si Odoo n'arrive pas à produire une valeur (module désactivé, erreur, pas de donnée), **aucun snapshot n'est écrit** ; l'erreur part dans les logs / monitoring du job.

### 4bis.1 Architecture

```
Odoo (laplatine2026)                    Vault                           Linky
     |                                     |                               |
     |  POST /internal/stock-valuation-    |                               |
     |  snapshot (token interne)           |  stock_valuation_snapshots     |
     |  (body: tenant, company_id,         |  (tenant, company_id,         |
     |   as_of_date, value, currency,      |   as_of_date, value,          |
     |   source)                           |   created_at, updated_at)     |
     | ----------------------------------> |                               |
     |                                     |                               |
     |                                     |  GET /ui/aggregations/        |
     |                                     |  stock-valuation (1 point)     |
     |                                     |  GET /ui/aggregations/        |
     |                                     |  stock-series (série)         |
     |                                     | <-----------------------------|
     |                                     |  { series: [{ period, amount }]}
```

- **Flux d’écriture :** un **job** (côté Odoo ou externe) calcule la valeur du stock (même logique que le controller Option A), puis **pousse** un snapshot vers le Vault (date + valeur + tenant + company_id).
- **Flux de lecture :** Linky appelle le Vault `GET /ui/aggregations/stock-series` (comme pour BFR ou trésorerie) ; le Vault lit sa table de snapshots et renvoie une série `{ period, amount }[]`.

### 4bis.2 Contrat canonique du snapshot

**Cœur métier** (ce qui nous intéresse vraiment) : **`as_of_date`** et **`value`**, plus le contexte **`tenant`** et **`company_id`**. Le reste sert à l’architecture et à l’exploitation.

Payload attendu par l’endpoint d’écriture Vault (POST snapshot) — **contrat minimal** :

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `tenant` | string | oui | Identifiant tenant (ex. `laplatine2026`) — contexte. |
| `company_id` | string | oui | Identifiant société (ex. `odoo:1`) — contexte. |
| `as_of_date` | string (YYYY-MM-DD) | oui | Date de référence de la valorisation (jour clos). |
| `value` | number | oui | Valeur totale du stock calculée par Odoo (montant). |
| `currency` | string | oui | Devise (ex. `EUR`). |
| `source` | string | oui | Source fonctionnelle ; valeur fixe : `odoo.inventory.valuation`. |
**Métadonnée technique optionnelle** (hors contrat canonique, au besoin pour exploitation/audit) : `valuation_method` (`standard` \| `avco` \| `fifo`) — peut être omise ; si présente, elle ne fait pas partie du cœur métier Dorevia (Odoo reste la source de vérité sur la méthode).

**Exemple de body JSON (contrat minimal) :**

```json
{
  "tenant": "laplatine2026",
  "company_id": "odoo:1",
  "as_of_date": "2026-03-15",
  "value": 12345.67,
  "currency": "EUR",
  "source": "odoo.inventory.valuation"
}
```

À l’essentiel absolu, le cœur métier est : `{ "as_of_date": "2026-03-15", "value": 12345.67 }` ; tenant, company_id, currency et source servent à l’architecture et à l’exploitation.

### 4bis.3 Schéma Vault

Nouvelle table alignée sur le contrat minimal (cœur métier + contexte + exploitation), ex. :

```sql
-- Migration Vault : stock_valuation_snapshots
CREATE TABLE IF NOT EXISTS stock_valuation_snapshots (
  id                BIGSERIAL PRIMARY KEY,
  tenant            TEXT NOT NULL,
  company_id        TEXT NOT NULL,       -- ex. "odoo:1"
  as_of_date        DATE NOT NULL,       -- date du snapshot (jour clos)
  value             NUMERIC(18,4) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'EUR',
  source            TEXT NOT NULL DEFAULT 'odoo.inventory.valuation',
  valuation_method  TEXT,                         -- métadonnée optionnelle (hors contrat), ex. 'standard'|'avco'|'fifo'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),   -- première insertion (immuable à l'upsert)
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),   -- dernière modification
  UNIQUE(tenant, company_id, as_of_date)
);

CREATE INDEX idx_stock_valuation_tenant_company_date
  ON stock_valuation_snapshots(tenant, company_id, as_of_date);
```

- **Unicité (tenant, company_id, as_of_date) :** un seul snapshot par jour (ou par période) et par société ; les jobs font un **upsert** (INSERT ... ON CONFLICT DO UPDATE) en ne mettant à jour que `updated_at` (pas `created_at`).

### 4bis.4 Qui pousse les snapshots ?

**Sémantique temporelle : snapshot de clôture quotidienne.** Le job tourne **une fois par nuit** ; `as_of_date` = **jour clos** (date métier figée). La valeur Odoo pour cette date ne change pas après le run ; idempotence garantie (un second run pour la même date produit le même résultat).

**Variante B1 — Job côté Odoo (cron)**

- Dans `dorevia_vault_connector`, un **cron** (ex. quotidien à 2h) :
  - calcule la valeur du stock (même code que le controller Option A) pour chaque société configurée ; en cas d'échec, ne pas poster de snapshot (log + monitoring) ;
  - appelle le Vault `POST /internal/stock-valuation-snapshot` pour enregistrer le snapshot (tenant, company_id, as_of_date=date de clôture, value, currency, source).
- **Endpoint Vault :** `POST /internal/stock-valuation-snapshot` (sécurisé par token interne).

**Variante B2 — Job externe (script / worker)**

- Un script (ex. Python) ou un worker s’exécute périodiquement (cron host, queue job) :
  - appelle Odoo (GET endpoint type Option A, ex. `/dorevia/vault/linky_stock_valuation`) pour obtenir la valeur du jour ;
  - envoie le résultat au Vault (POST snapshot).
- Odoo n’a pas besoin de connaître l’URL du Vault ; seul le job a les deux endpoints (Odoo + Vault).

**Recommandation B :** B1 si on veut tout dans Odoo (un seul endroit pour la logique métier stock) ; B2 si on privilégie un Vault « pull » minimal et des jobs côté plateforme.

### 4bis.5 API Vault (lecture)

- **Écriture :** `POST /internal/stock-valuation-snapshot`  
- **Lecture point :** `GET /ui/aggregations/stock-valuation` — paramètres **obligatoires** : `tenant`, `company_id` ; optionnel : `as_of_date`. Retourne la valeur au dernier snapshot connu (ou au snapshot à la date demandée).  
- **Lecture série :** `GET /ui/aggregations/stock-series` — paramètres **obligatoires** : `tenant`, `company_id`, `date_debut`, `date_fin` (YYYY-MM-DD).  
  Réponse : `{ "series": [ { "period": "2026-03-01", "amount": 12345.67 }, ... ], "currency": "EUR" }` en lisant `stock_valuation_snapshots` filtré par tenant, company_id et plage de dates.

### 4bis.6 Côté Linky

- **GET /api/stock-valuation** : proxy vers Vault `GET /ui/aggregations/stock-valuation` (dernier snapshot ou date demandée).
- **GET /api/stock-evolution** (ou réutilisation d’un bloc « Évolution » existant) : proxy vers Vault `GET /ui/aggregations/stock-series` pour afficher une courbe ou un tableau d’évolution dans le temps.

La carte BFR peut afficher la valeur courante (stock-valuation) et, si besoin, un bloc « Évolution » alimenté par stock-series (comme pour le BFR net).

**Fraîcheur métier (microcopy et non-surpromesse) :**  
La valeur de stock exposée dans Linky correspond au **dernier snapshot disponible** dans le Vault ; elle reflète l’état de la valorisation Odoo à la date `as_of_date` du snapshot, et **non** une interrogation temps réel d’Odoo. Toute microcopy ou libellé dans l’UI doit refléter cette nature snapshotée (ex. « Valeur au … » avec la date du snapshot).

### 4bis.7 Avantages / inconvénients résumés

| Critère | Option B |
|--------|----------|
| **Appel Odoo à la volée** | Non ; calcul fait au moment du job. |
| **Série temporelle** | Native (plusieurs snapshots en base). |
| **Charge Odoo** | Limitée au cron / job. |
| **Fraîcheur** | Dépend de la fréquence du job (ex. quotidien). |
| **Complexité** | Plus élevée : migration Vault, job, idempotence, endpoint d’écriture. |

### 4bis.8 Quand choisir A ou B ?

- **Choisir A** si l’objectif est d’afficher **rapidement** la valeur du stock (et éventuellement une évolution limitée) avec un minimum de changements (controller + proxy Vault + route Linky), sans nouveau schéma ni job.
- **Choisir B** si l’objectif est d’avoir un **historique riche** (série d’évolution stock sur plusieurs mois), de découpler la lecture Linky de la disponibilité d’Odoo, et d’aligner le stock sur le modèle des autres séries Vault (BFR, trésorerie, etc.) déjà en snapshots.

---

## 5. Prérequis et points d’attention

### 5.1 Prérequis laplatine2026

- **Module stock_account** (ou module de valorisation des stocks) installé et activé sur la base `laplatine2026`.
- **Produits** : les produits concernés doivent être en mode « Stockable » et avoir une méthode de valorisation configurée (standard, AVCO, FIFO) pour que la valorisation soit calculée.
- **Réseau :** le conteneur Vault (ex. core-stinger) doit pouvoir joindre `odoo_lab_laplatine2026:8069` (réseau Docker commun, ex. `dorevia-network`).

### 5.2 Points d’attention

- **Performance :** le calcul de la valorisation peut être coûteux sur de grosses bases ; prévoir un timeout côté Vault (ex. 10–15 s) et éventuellement un cache court (ex. 5 min) si besoin.
- **Multi-société :** si laplatine2026 a plusieurs sociétés, `company_id` permet de cibler la société ; le controller Odoo doit filtrer strictement par `company_id`.
- **Évolution :** pour afficher une **série temporelle** (évolution de la valeur du stock dans le temps), il faudrait soit des snapshots en base (Option B), soit que le controller Odoo accepte une plage de dates et renvoie plusieurs points (plus lourd côté Odoo).

---

## 6. Prochaines étapes — Implémentation Option B

Suite à la décision de partir sur l’**Option B**, ordre de mise en œuvre proposé :

| # | Zone | Tâche |
|---|------|--------|
| 1 | Vault | Migration SQL : création table `stock_valuation_snapshots` selon contrat minimal (§ 4bis.2) : tenant, company_id, as_of_date, value, currency, source ; optionnel valuation_method ; created_at (immuable à l'upsert), updated_at ; contrainte d'unicité, index. Pas de colonne status. |
| 2 | Vault | Endpoint d’écriture : `POST /internal/stock-valuation-snapshot` (token interne) — accepte le JSON minimal (tenant, company_id, as_of_date, value, currency, source=`odoo.inventory.valuation`), upsert en base (DO UPDATE ne modifie que updated_at, pas created_at). |
| 3 | Vault | Endpoints de lecture : `GET /ui/aggregations/stock-valuation` (tenant, company_id obligatoires ; as_of_date optionnel) et `GET /ui/aggregations/stock-series` (tenant, company_id, date_debut, date_fin obligatoires). |
| 4 | Odoo (dorevia_vault_connector) | Logique de calcul : Odoo reste la source de vérité (rapport Valorisation ; implémentation via stock.valuation.layer ou équivalent). En cas de succès : produire value, currency et poster le snapshot. En cas d'échec : ne pas écrire de snapshot ; log + monitoring. |
| 5 | Odoo | Job (cron) snapshot de clôture : une fois par nuit, calcule la valeur du stock pour laplatine2026 (company_id=odoo:1), as_of_date = jour clos ; appelle Vault `POST /internal/stock-valuation-snapshot` avec token. Config : URL Vault + token. |
| 6 | Linky | Route `GET /api/stock-valuation` (proxy Vault). Route `GET /api/stock-evolution` (proxy stock-series) si bloc Évolution dédié. |
| 7 | Linky | Carte BFR : appeler stock-valuation et afficher la valeur du stock à la place de « Hors périmètre » ; optionnel bloc Évolution (stock-series). |
| 8 | Recette | Vérifier alignement valeur Linky / dernier snapshot Vault / rapport Valorisation Odoo ; vérifier idempotence du job (relancer le même jour = même valeur). |

---

## 7. Références

- **Spec détaillée Option B (référence d’implémentation) :** ZeDocs/web52/SPEC_VALEUR_STOCK_OPTION_B_LAPLATINE2026_v1.0.md  
- **ADR-001 (Linky Vault-only) :** ZeDocs/web51/ADR-001_LINKY_VAULT_GATEWAY_UNIQUE.md  
- **Rapport implémentation ADR-001 :** ZeDocs/web51/RAPPORT_IMPLEMENTATION_ADR001_DETAILLE_v1.0.md  
- **Connecteur Odoo (bank reconciliation) :** `units/odoo/custom-addons/dorevia_vault_connector/controllers/linky_bank_reconciliation.py`  
- **Carte BFR Linky (stock hors périmètre) :** `units/dorevia-linky/components/WorkingCapitalCard.tsx`  
- **Odoo 18 — Utiliser la valorisation des stocks :** [Using inventory valuation](https://www.odoo.com/documentation/18.0/fr/applications/inventory_and_mrp/inventory/product_management/inventory_valuation/using_inventory_valuation.html) (rapport Valorisation : Date, Quantité, Valeur unitaire, Valeur totale ; valorisation à date).  
- **Odoo 18 — Configuration valorisation automatique :** [Automatic inventory valuation](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/inventory/product_management/inventory_valuation/inventory_valuation_config.html) (méthodes Standard Price, AVCO, FIFO ; méthode de coût au niveau des catégories de produits).
- **Odoo 18 — Comptabilité / valorisation :** [Comptabilité et Facturation](https://www.odoo.com/documentation/18.0/fr/applications/finance/accounting.html) (valorisation périodique/manuelle vs perpétuelle/automatique, configuration dédiée).

---

*ZeDocs/web52 — Rapport valeur du stock laplatine2026 v1.2 — 2026-03-15 — Option B retenue, aligné sur la spec détaillée.*

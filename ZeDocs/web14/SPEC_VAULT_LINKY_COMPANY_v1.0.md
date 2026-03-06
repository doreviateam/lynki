# Spec — Company dans le Vault et filtre Company Linky (v1.1)

**Statut** : Spécification normative (v1.0 + amendements v1.1)  
**Périmètre** : dorevia-vault (évolution schéma + API), Linky (filtre Company), chaîne d’ingest (company_id à l’envoi)  
**Contexte** : Un tenant a **toujours au moins une** organisation ou société (company) associée ; il peut en avoir plusieurs (1 à n). Chaque event vaulté est associé à une company pour permettre le filtre Company dans Linky.

**v1.1** : Format normatif `company_id`, identité logique document, gestion legacy NULL + message UI, contrat endpoint companies, distinction filtre / couverture, stratégie libellé, principes architecturaux. Réf. ZeDocs/web14/EVALUATION_AMENDEMENTS_SPEC_COMPANY_v1.1.md.

**Annexe normative** : ZeDocs/web14/ANNEXE_NORMATIVE_CONTRAINTES_ARCHITECTURALES_COMPANY_v1.2.md (invariants immutabilité company_id, idempotence, stabilité GET /ui/companies — obligatoire pour toute nouvelle implémentation).

---

## 1. Objectif

- **Vault** : Stocker et exposer la **company** associée à chaque document vaulté, sans modifier les documents déjà scellés.
- **Linky** : Afficher et filtrer par **Company** en en-tête (axe contexte : Tenant, Company, Période), en s’appuyant sur les données Vault.

---

## 2. Principes architecturaux

- **La preuve porte le contexte.** Hiérarchie canonique : **Tenant** (univers de vérité) → **Company** (entité juridique) → **Période** (fenêtre de lecture).
- **Aucune modification des documents déjà vaultés** : colonne `company_id` nullable ; pas de re-signature ni re-hash historique ; backfill optionnel ultérieur si besoin.
- **Immutabilité du `company_id`** (annexe normative v1.2) : une fois un document ingesté avec un `company_id`, ce champ est **immuable** ; toute correction passe par annulation métier / contre-écriture / nouveau document vaulté.

---

## 3. Règles métier

- Un **tenant** a **toujours au moins une** company (organisation / société) ; il peut en avoir plusieurs (1 à n). Pas de tenant sans company.
- Chaque **document vaulté** est associé à une **company_id** (une seule company par document), au format normatif défini ci-dessous.
- **Documents legacy** (`company_id = NULL`) :
  - **Aucun filtre company** (option « Tout ») : documents NULL **inclus** dans les agrégations.
  - **Filtre company actif** : documents NULL **exclus** du périmètre.

---

## 4. Format normatif `company_id` (v1.1)

Pour garantir l’unicité globale, la cohabitation multi-ERP et la traçabilité, le champ **`company_id`** DOIT suivre le format :

```
<source_system>:<source_company_id>
```

**Exemples**

- `odoo.stinger.sarl-la-platine:1`
- `odoo.prod.clientX:3`
- `sap.eu.clusterA:COMPANY_002`

**Règles**

- **source_system** : identifiant de la source (ex. `odoo.<env>.<tenant>` pour Odoo). Caractères recommandés : alphanumériques, points, tirets. Pas d’espace.
- **source_company_id** : identifiant de la company dans le système source (nombre, code, UUID selon la source).
- La chaîne complète est stockée en **TEXT** dans le Vault.

**Chaîne amont** (Odoo / DVIG) : doit produire et envoyer ce format à chaque envoi vers le Vault (company de la facture ou société courante).

---

## 5. Identité logique document (v1.1)

L’identité logique d’un document inclut :

- **tenant**
- **source_id** (ou clé d’idempotence fournie)
- **company_id** (si disponible)

**Idempotence** : la clé d’idempotence fournie par l’émetteur (DVIG) DOIT être construite en incluant le **company_id** (ex. hash ou concaténation tenant + source_id + company_id), afin d’éviter les collisions inter-company pour un même `source_id`. Le Vault s’appuie sur cette clé pour déduplication et retry/replay.

---

## 6. Évolution du Vault (dorevia-vault)

### 6.1 Données

- **Modèle document** : ajout du champ **`company_id`** (nullable, TEXT), au format `<source_system>:<source_company_id>`.
- **Migration** : nouvelle migration ajoutant la colonne `company_id` sur la table des documents (sans mise à jour des lignes existantes).
- **Rétrocompatibilité** : les documents existants ont `company_id = NULL` ; ils restent inclus dans les agrégations quand aucun filtre `company_id` n’est passé (« Tout »).

### 6.2 Ingest

- **`company_id` obligatoire pour tout nouvel event** : pour tout document ou event ingéré après l’entrée en vigueur de cette règle, le champ **`company_id`** est **obligatoire** dans le payload (format normatif). Le Vault rejette ou considère invalide tout ingest sans `company_id` pour les flux concernés (events, validation factures, etc.).
- Documents **legacy** (déjà en base sans `company_id`) : inchangés ; `company_id` reste NULL et reste accepté en lecture / agrégations sans filtre company.
- **Chaîne amont** (Odoo / DVIG) : envoyer la company au format normatif à chaque envoi vers le Vault.

### 6.3 API agrégations

- **GET /ui/aggregations/sales** et **GET /ui/aggregations/purchases** :
  - Nouveau paramètre de requête **optionnel** : **`company_id`**.
  - Si `company_id` est fourni : filtrer les documents par `tenant` + `company_id` + dates. Documents avec `company_id = NULL` **exclus**.
  - Si `company_id` n’est pas fourni : filtrer par `tenant` + dates uniquement ; tous les documents du tenant, y compris `company_id = NULL`.
- **Période** : les paramètres **`date_debut`** / **`date_fin`** (et champs de réponse **`from`** / **`to`**) représentent la **période de filtre** demandée. Les champs **`effective_from`** / **`effective_to`** (déjà exposés) représentent la **couverture réelle** des documents (min/max `invoice_date`). En-tête Linky = période sélectionnée ; cartes = couverture réelle si besoin d’affichage explicite.

### 6.4 Endpoint Companies (contrat minimal v1.1)

- **GET /ui/companies?tenant=&lt;tenant_id&gt;**
- **Réponse minimale** (tableau d’objets) :

```json
[
  { "company_id": "odoo.stinger.sarl-la-platine:1", "documents_count": 124 },
  { "company_id": "odoo.stinger.sarl-la-platine:2", "documents_count": 8 }
]
```

- **Tri** (annexe normative v1.2) : la liste DOIT être triée de façon stable par `company_id` (ex. `ORDER BY company_id ASC`).
- Objectifs : alimenter le sélecteur Linky, debug fonctionnel, pas de dépendance à un référentiel externe pour la liste.

---

## 7. Évolution de Linky

- **En-tête** : afficher le **filtre Company** à côté de Tenant et Période (contexte explicite).
- **Valeur par défaut** : **« Tout »** — toutes les sociétés du tenant. Aucun `company_id` envoyé aux API.
- **Company sélectionnée = invariant de session UI** : la valeur choisie (Tout ou une company) est un **invariant de session** : elle reste effective pour toute la session / la visite jusqu’à changement explicite par l’utilisateur. Pas de réinitialisation automatique (ex. à la navigation ou au refetch des cartes). Tous les appels (sales, purchases, polling) utilisent la même company sélectionnée tant qu’elle n’est pas modifiée.
- **Comportement** :
  - Sélecteur avec **option par défaut « Tout »** + une entrée par company (données fournies par GET /ui/companies).
  - Si l’utilisateur choisit une company : passer **`company_id`** aux appels **/api/sales** et **/api/purchases**.
  - **Timeout fallback GET /ui/companies** : l’appel à GET /ui/companies doit être soumis à un **timeout** (valeur à définir, ex. 5 s). En cas de **timeout** ou d’erreur réseau / 5xx : comportement de fallback — affichage **« Company : Non applicable »** ou sélecteur réduit à « Tout » uniquement, sans bloquer le reste du dashboard. Les cartes continuent d’utiliser le filtre période ; aucun `company_id` n’est envoyé aux agrégations tant que la liste companies n’est pas disponible.
  - En cas d’indisponibilité durable de l’endpoint companies : affichage dégradé **« Company : Non applicable »** ou masquage temporaire du filtre.
- **Documents legacy** : lorsque le filtre company est actif et qu’il existe des documents avec `company_id = NULL` dans le tenant, afficher un message **non bloquant** :
  - *« Certaines pièces historiques ne sont pas encore associées à une société et sont exclues du périmètre. »*
- **Libellé company** : en **v1** afficher le **company_id** brut dans le sélecteur ; en **v1.1+** un mapping optionnel (Odoo, API Dorevia, référentiel) pourra fournir un libellé lisible.
- Les **cartes** (Ventes, Achats) et l’**indicateur Certifié** reflètent le périmètre (tenant + company éventuelle + période).

---

## 8. Ordre de mise en œuvre suggéré

1. **Vault** : migration + champ `company_id` (TEXT, format normatif), ingest accepte `company_id`, agrégations acceptent le paramètre `company_id`.
2. **Vault** : endpoint **GET /ui/companies** (contrat minimal).
3. **Odoo / DVIG** : envoi de `company_id` au format normatif ; clé d’idempotence incluant company_id.
4. **Linky** : filtre Company (sélecteur « Tout » par défaut), appel GET /ui/companies, passage de `company_id` aux agrégations, message UI pour documents legacy si besoin.

---

## 9. Références

- **Annexe normative (contraintes obligatoires)** : ZeDocs/web14/ANNEXE_NORMATIVE_CONTRAINTES_ARCHITECTURALES_COMPANY_v1.2.md  
- Filtres Linky : ZeDocs/web14/FILTRE_LINKY.md  
- Plan d’implémentation : ZeDocs/web14/PLAN_IMPLEMENTATION_FILTRES_LINKY_SCRUM.md (S4 Company)  
- Indicateur Certifié : ZeDocs/web14/INDICATEUR_CERTIFIE_LINKY.md  
- Évaluation amendements v1.1 : ZeDocs/web14/EVALUATION_AMENDEMENTS_SPEC_COMPANY_v1.1.md  
- Vault : `sources/vault/` (models, handlers, storage, migrations)

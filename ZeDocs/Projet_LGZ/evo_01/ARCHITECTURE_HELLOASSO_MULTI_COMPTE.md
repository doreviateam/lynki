# Architecture HelloAsso multi-compte (par association / société Odoo)

| | |
|---|---|
| **Statut** | Évolution d’architecture — cible de mise en œuvre (LGZ / RGL et au-delà) |
| **Périmètre** | Connecteur, synchros adhésion & billetterie, données importées, crons, UX paramétrage |

## Formulation de référence

> Nous mettons en œuvre une **architecture multi-compte HelloAsso**. Chaque association doit pouvoir disposer de **son propre compte HelloAsso** dans Odoo. Les flux **Adhésion** et **Billetterie** ne doivent **plus** reposer sur une **configuration globale unique** (`ir.config_parameter` ou équivalent implicite), mais sur un **compte HelloAsso** rattaché à la **société Odoo** concernée. Les synchronisations, les données importées et les écritures futures (ex. comptabilité) doivent **conserver** ce rattachement (**compte** + **société**).

**Contexte LGZ / RGL :** au minimum, **LGZ** et **RGL** sont deux **sociétés Odoo** distinctes, chacune avec **son** organisation HelloAsso, **son** mode test/production, **ses** identifiants API, et **ses** synchros adhésion + billetterie.

**Implémentation actuelle — Paramètres, affichage, ICP :** voir [note Paramètres HelloAsso](./note_parametres_helloasso_res_config.md) (champ `helloasso_oauth_key`, masquage de la clé, règles multi-sociétés sur les paramètres globaux historiques).

---

## 1. Schéma de données — modèle `dorevia.helloasso.account`

Nom technique proposé : **`dorevia.helloasso.account`** (libellé utilisateur : *Compte HelloAsso* ou *Liaison HelloAsso*).

### 1.1 Champs obligatoires et identité

| Champ technique | Type Odoo | Obligatoire | Description |
|-----------------|-----------|-------------|-------------|
| `name` | `Char` | oui | Libellé métier (ex. « HelloAsso — LGZ », « HelloAsso — RGL »). |
| `company_id` | `Many2one` → `res.company` | oui | Société Odoo à laquelle ce compte est rattaché. |
| `active` | `Boolean` | non (défaut `True`) | Désactive le compte sans supprimer l’historique. |

### 1.2 Environnement et organisation API

| Champ technique | Type Odoo | Obligatoire | Description |
|-----------------|-----------|-------------|-------------|
| `environment` | `Selection` | oui | Valeurs : `sandbox` \| `production`. Équivalent actuel du booléen « bac à sable ». |
| `organization_slug` | `Char` | oui | `organizationSlug` des chemins API v5 HelloAsso. Index conseillé. |

**Contrainte d’unicité logique (à figer en SQL ou Python) :**

- `unique(company_id, environment, organization_slug)` **ou**, si une société ne peut avoir qu’un seul compte actif par environnement : règle métier explicite dans la doc et contrainte adaptée.

*Recommandation* : **`unique(company_id, environment, organization_slug)`** pour autoriser plusieurs comptes par société uniquement si slugs/environnements diffèrent (cas rare) ; sinon règle produit « **un compte actif par société et par environnement** » via contrainte SQL partielle ou validation Python.

### 1.3 Identifiants OAuth (client credentials)

| Champ technique | Type Odoo | Obligatoire | Description |
|-----------------|-----------|-------------|-------------|
| `client_id` | `Char` | oui (si synchro activée) | Client ID HelloAsso. |
| `client_secret` | `Char` | oui (si synchro activée) | Secret ; affichage masqué en UI ; droits restreints (`groups`). |

*Optionnel plus tard* : chiffrement at-rest ou `secrets` dédié ; hors périmètre du schéma minimal.

### 1.4 Stockage token (optionnel — phase 2+)

| Champ technique | Type Odoo | Obligatoire | Description |
|-----------------|-----------|-------------|-------------|
| `access_token` | `Char` / `Text` | non | Jeton courant si décision de le persister (sinon obtenu à la volée). |
| `access_token_expiry` | `Datetime` | non | Expiration indicative pour renouvellement. |

*Décision MVP* : **ne pas stocker** le token par défaut ; le client HTTP obtient un jeton à chaque synchro (comportement actuel). Les champs peuvent exister mais rester vides jusqu’à optimisation.

### 1.5 Périmètre d’usage du compte (flags)

| Champ technique | Type Odoo | Défaut | Description |
|-----------------|-----------|--------|-------------|
| `use_for_members` | `Boolean` | `True` | Autorise synchro **adhésions** (Membership) pour ce compte. |
| `use_for_ticketing` | `Boolean` | `True` | Autorise **inventaire billetterie** + **import commandes** pour ce compte. |

Un compte peut être limité à un seul flux si besoin (ex. billetterie seule).

### 1.6 Paramètres billetterie par défaut (MVP)

Réutilisables comme aujourd’hui au niveau « préférences » du compte (évite de multiplier les ICP) :

| Champ technique | Type Odoo | Défaut | Description |
|-----------------|-----------|--------|-------------|
| `billetterie_default_form_type` | `Char` | `Event` | Type de campagne par défaut (API). |
| `billetterie_default_form_slug` | `Char` | vide | Slug campagne optionnel pour actions par défaut. |

### 1.7 Affichage (optionnel)

| Champ technique | Type Odoo | Description |
|-----------------|-----------|-------------|
| `organization_display_name` | `Char` | Nom lisible pour listes / légendes (comme aujourd’hui côté paramètres). |

### 1.8 Relations sortantes (résumé)

- **Un** `dorevia.helloasso.account` → **une** `res.company` (obligatoire).
- Les enregistrements métier synchronisés pointent vers ce compte (voir §2).

---

## 2. Extensions des modèles métier existants

### 2.1 Adhésions / `res.partner`

Les champs HelloAsso déjà présents sur le contact restent pertinents pour le **dernier état** ou l’agrégat ; la **cible architecture** ajoute la **source** :

| Ajout proposé | Type | Règle |
|---------------|------|--------|
| `helloasso_account_id` | `Many2one` → `dorevia.helloasso.account` | Renseigné à l’import / mise à jour depuis une synchro **adhésion** pour ce compte. `company_id` du partenaire aligné sur `account.company_id` (ou règle multi-sociétés explicite). |

**Point de vigilance — contact unique par e-mail, adhésions multiples :**

- **Un** `res.partner` peut correspondre à **une** personne (e-mail).
- Plusieurs **adhésions** (lignes métier ou historique) peuvent exister pour **plusieurs associations** / **plusieurs comptes HelloAsso**.
- Le modèle logique cible :

> **1 contact** ↔ **n adhésions** (flux / historique) rattachées à **n associations** / **n comptes HelloAsso**.

Tant que le MVP ne porte pas de modèle « ligne d’adhésion » séparé, les champs actuels sur `res.partner` représentent **la dernière** synchro pertinente ; l’introduction de `helloasso_account_id` permet de savoir **quel compte** a produit la dernière mise à jour. Les évolutions ultérieures (table d’historique par compte + saison) s’appuient sur ce rattachement.

**Règle de recherche à la synchro (brouillon) :**

1. Filtrer les partenaires par **périmètre société** : `company_id` ∈ {société du compte, False} selon politique (recommandé : **priorité** `company_id = account.company_id`).
2. Recherche par `helloasso_external_id` **dans ce périmètre**.
3. Sinon recherche par e-mail **dans ce périmètre** ; si ambiguïté → log + skip (comportement actuel à généraliser par compte).
4. Création : `company_id = account.company_id`, `helloasso_account_id = account.id`.

### 2.2 Billetterie — inventaire `dorevia.helloasso.billetterie.form`

| Ajout proposé | Type | Règle |
|---------------|------|--------|
| `helloasso_account_id` | `Many2one` | Obligatoire pour les **nouvelles** lignes ; renseigné à l’inventaire. |
| `company_id` | `Many2one` → `res.company` | Related ou synchronisé avec `account.company_id` pour requêtes / règles d’accès. |

**Contrainte d’unicité à faire évoluer :**

- Aujourd’hui : `unique(use_sandbox, organization_slug, form_type, form_slug)`.
- Cible : **`unique(helloasso_account_id, form_type, form_slug)`** ou inclure `company_id` + `environment` pour éviter les collisions inter-comptes.

*À trancher* : garder `use_sandbox` sur la ligne ou le déduire de `account.environment` pour simplifier.

### 2.3 Billetterie — commandes `dorevia.helloasso.billetterie.order`

| Ajout proposé | Type | Règle |
|---------------|------|--------|
| `helloasso_account_id` | `Many2one` | Dérivé du formulaire catalogue ou de la synchro. |
| `company_id` | `Many2one` | Aligné sur le compte / formulaire. |

Adapter la contrainte `helloasso_order_id_unique` : passer à **`unique(helloasso_account_id, helloasso_order_id)`** (un même id commande API peut théoriquement exister sur deux organisations différentes).

### 2.4 Lignes de commande / autres

Même principe : traçabilité **implicite** via `order_id` → compte, ou champ direct si utile pour requêtes.

---

## 3. Connecteur / client API

### 3.1 Principe

- **Ne plus** lire `ir.config_parameter` comme **source principale** des credentials en production.
- Toute exécution d’appel API reçoit explicitement un **compte** (recordset `dorevia.helloasso.account`) ou un **DTO** construit depuis ce record (slug, environment, client_id, client_secret).

### 3.2 Signature cible (conceptuelle)

- `fetch_client_credentials_token(account)` ou `fetch_client_credentials_token(client_id, client_secret, environment)`.
- Les fonctions existantes (`fetch_form_payments_page`, `fetch_organization_forms`, etc.) prennent **slug + token + sandbox flag** ; le **sandbox flag** est dérivé de `account.environment`.

### 3.3 Migration depuis l’existant

- **Phase transitoire** : repli sur `ir.config_parameter` **uniquement** si aucun compte n’est défini (migration de bases anciennes), puis bascule obligatoire vers comptes.
- **Intermédiaire déjà posé en code** : champs sur `res.company` + helper `get_helloasso_connection_params` — à **remplacer** par résolution **`helloasso.account`** pour la société courante (ou compte sélectionné), pas comme état final.

---

## 4. Règles de synchronisation

### 4.1 Périmètre d’exécution

- Chaque synchro (adhésion, inventaire billetterie, import commandes) est lancée **pour un `dorevia.helloasso.account` donné** (ou pour une liste de comptes).
- `env` : utiliser `env.with_company(account.company_id)` pour créations `res.partner` et règles multi-sociétés.

### 4.2 Cron adhésions (Members)

1. Lister `dorevia.helloasso.account` avec `active=True`, `use_for_members=True`, credentials + slug valides.
2. Pour chaque compte : exécuter la synchro paiements Membership **dans le contexte** `account.company_id`.
3. Journaliser par compte (id / nom) dans les logs existants.

### 4.3 Cron billetterie

1. Lister les comptes `active`, `use_for_ticketing=True`, credentials + slug valides.
2. Pour chaque compte : inventaire formulaires (ex. `Event`) puis import commandes par ligne d’inventaire **rattachée à ce compte** (domaine sur `helloasso_account_id`).

### 4.4 Actions manuelles (Paramètres / boutons)

- Les actions « Tester la connexion », « Synchroniser », etc. s’appliquent au **compte sélectionné** (fiche compte) ou au **compte par défaut** de la société courante — **à définir en UX** (recommandation : pas de magie : toujours une fiche compte explicite).

### 4.5 Règles de cohérence

- Un formulaire billetterie ne peut être synchronisé qu’avec le **même** `organization_slug` et **environment** que son `helloasso_account_id`.
- Refus explicite si l’utilisateur tente d’importer avec un compte qui ne correspond pas à la ligne catalogue.

---

## 5. UX paramétrage

- Menu / entrée **Comptes HelloAsso** : liste + fiche (formulaire).
- Filtres par **société** ; création guidée « un compte pour LGZ », « un compte pour RGL ».
- Retrait progressif du message impliquant **une seule** organisation / **une seule** connexion dans l’aide et les landings.

---

## 6. Lots d’implémentation (alignement exécution)

| Lot | Contenu |
|-----|--------|
| **1** | **En cours / partiellement livré** : modèle `dorevia.helloasso.account` + droits + vues + menu Administration + migration post-init (société → compte) + résolution prioritaire dans `get_helloasso_connection_params` + champ `helloasso_account_id` sur `res.partner` + crons adhésion/billetterie itérant les comptes actifs (repli société/ICP si aucun compte). *Suite lot 1* : retirer le repli ICP comme source nominale, finaliser contraintes billetterie avec `helloasso_account_id` sur inventaire/commandes. |
| **2** | Refactor connecteur : appels paramétrés par compte (plus de lecture globale comme chemin nominal). |
| **3** | Portage flux adhésion & billetterie : écriture `helloasso_account_id` + `company_id` sur objets concernés ; contraintes uniques révisées. |
| **4** | Crons : itération sur comptes actifs (members + ticketing). |
| **5** | UI liste/fiche comptes + lien depuis Paramètres / app HelloAsso. |
| **6** | Documentation (aide, arborescence, backlog) + suppression des formulations « connexion unique ». |

---

## 7. Références croisées

* Backlog menu / UX : [backlog_impl_menu_helloasso_odoo.md](./backlog_impl_menu_helloasso_odoo.md)
* Cartographie flux : [cartographie_flux_helloasso_odoo.md](./cartographie_flux_helloasso_odoo.md)

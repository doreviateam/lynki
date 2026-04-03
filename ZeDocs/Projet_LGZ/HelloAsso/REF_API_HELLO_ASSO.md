# Note interne — Référence API HelloAsso

## Connecteur HelloAsso → Odoo (adhérents)

| | |
|---|---|
| **Version** | 0.3.2 |
| **Date** | Avril 2026 |
| **Statut** | Référence technique interne — à recouper avec la doc en ligne au fil des évolutions HelloAsso |
| **Objet** | Consolider les éléments confirmés de l’API HelloAsso utiles au cadrage et à la spécification du connecteur adhérents |
| **Documents liés** | [Big Picture](./Big_Picture_HelloAsso.md) ; [SPEC adhérents](./SPEC_DOREVIA_HELLOASSO_ADHERENT.md) ; [ADR arbitrage](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_ODOO_ADHERENTS.md) |

**Synthèse :** cette note confirme la **faisabilité technique** d’un connecteur HelloAsso → Odoo sur le périmètre adhérents (**API v5**, **OAuth 2.0**, **sandbox**, **formulaires**, **commandes**, **paiements**, **notifications**), mais **ne remplace pas** l’**audit des formulaires réels** ni les **arbitrages métier** sur l’**éligibilité** et le **point de vérité** du flux. ([API Overview][1])

---

## 1. Objet de la note

Cette note a pour objet de **sécuriser la base documentaire** utilisée pour le cadrage et la spécification du connecteur **HelloAsso → Odoo** sur le périmètre **adhérents**.

Elle ne remplace pas la spécification.

Elle sert à distinguer :

* ce qui est **confirmé** par la documentation officielle HelloAsso ;
* ce qui constitue encore une **hypothèse d’exploitation** ;
* ce qui devra être **vérifié** sur les formulaires et comptes réellement utilisés par les associations concernées.

**Limite :** la doc HelloAsso évolue (référence, schémas, droits). En cas d’écart, **la documentation en ligne et le changelog HelloAsso font foi** pour l’implémentation.

---

## 2. Éléments confirmés dans la documentation HelloAsso

### 2.1. Version et environnements

HelloAsso expose une **API v5** avec deux environnements distincts :

| Environnement | Base URL API |
|---------------|----------------|
| **Production** | `https://api.helloasso.com/v5` |
| **Sandbox** | `https://api.helloasso-sandbox.com/v5` |

La documentation recommande d’utiliser le **sandbox** pour tester une intégration (organisation de test, cartes virtuelles, etc.). ([API Overview][1])

La même page d’overview mentionne aussi une **API « Plus Billetterie »** distincte ; le périmètre **billetterie** reste hors scope du connecteur adhérents tel que cadré dans la spec.

### 2.2. Authentification (OAuth 2.0)

L’API utilise **OAuth 2.0**. Il faut un **client API** (**client ID** et **secret**), configuré depuis l’espace d’administration HelloAsso pour les associations, puis obtenir un **jeton d’accès** pour appeler l’API. ([API Overview][1])

**Obtenir les jetons (extrait documenté) :**

* **Client credentials** : `POST` avec `grant_type=client_credentials` (usage courant pour un connecteur serveur).
* **Refresh token** : une fois obtenu, la doc indique de **préférer le rafraîchissement** au rejeu systématique des client credentials.
* **Authorization code** : réservé aux **partenaires** pour certains accès avec consentement utilisateur.

**Endpoints de token :** la doc « Getting started » documente explicitement `POST https://api.helloasso.com/oauth2/token` pour l’obtention et le rafraîchissement des jetons. Pour le **sandbox**, l’overview indique la base `https://api.helloasso-sandbox.com` : le point de terminaison OAuth suit en principe le **même chemin** (`/oauth2/token`) sur cet hôte — **à confirmer** sur la doc au moment de l’implémentation (l’extrait « Getting started » relu ne montre pas d’exemple sandbox explicite pour cette URL). ([Getting started — authentification][7], [API Overview][1])

**Cycle de vie et contraintes d’usage (doc « Getting started ») :**

| Élément | Détail documenté |
|---------|------------------|
| `access_token` | Environ **30 minutes** de validité ; usage avec `Authorization: Bearer …` |
| `refresh_token` | Environ **1 mois** ; chaîne de renouvellement à chaque refresh |
| Règle importante | Il **n’est pas permis** de redemander un `access_token` via **client credentials à chaque appel** : il faut utiliser le **`refresh_token`** (sous peine de non-conformité aux règles HelloAsso) |
| Limite | **20** `access_token` valides **en simultané** par clé API (documenté) |

([Getting started][7])

**Associations vs partenaires :**

* **Association** : client créé depuis le compte (ex. **Mon compte → Intégrations et API** selon les libellés actuels) ; accès en principe limité à **son** organisation.
* **Partenaire** : autre processus (contact documenté : partenariats@helloasso.org). ([API Overview][1])

### 2.3. Privilèges et rôles (nuance importante)

Pour les **associations**, la doc d’overview indique des **privilèges** associés au client, notamment **`AccessPublicData`**, **`AccessTransactions`** et **`Checkout`**. ([API Overview][1])

**Point à ne pas confondre :** certaines routes (ex. **commandes** d’un formulaire) exigent en plus des **rôles utilisateur** côté API (`FormAdmin`, `OrganizationAdmin`, etc.) et des privilèges listés sur la fiche de l’endpoint (ex. `AccessTransactions`, `Language`). L’**association** peut obtenir ces rôles avec son client ; un **partenaire** peut devoir passer par le flux d’autorisation. Vérifier systématiquement la fiche OpenAPI de chaque route utilisée. ([Référence — commandes d’un formulaire][2])

### 2.4. Périmètre « adhésions » (formulaires et `formType`)

Les routes formulaires / commandes utilisent un paramètre de chemin **`formType`**. La documentation HelloAsso confirme l’existence d’un **périmètre API** autour des **formulaires** et des **transactions** (commandes, paiements) associées à ces formulaires, ce qui **légitime** un connecteur côté adhésions au sens large.

HelloAsso documente un endpoint permettant de lister les **types de formulaires** pour une organisation (`…/formTypes`) : c’est le support attendu pour connaître les **valeurs réelles** de `formType` sur un compte donné. ([formTypes][5])

**Prudence :** la valeur exacte à utiliser pour les formulaires d’adhésion (ex. un libellé type `Membership` dans l’écosystème HelloAsso) doit être **confirmée** lors de l’**audit des formulaires réels** et, le cas échéant, sur la **doc ou les schémas** où cette valeur apparaît explicitement — les extraits génériques de parcours formulaires / commandes ne suffisent pas à **prouver** seuls la chaîne de caractères utilisée pour chaque association.

Le point de terminaison **`formTypes`** est la **première source à interroger** sur un compte réel pour **objectiver** les valeurs de **`formType`** avant tout développement. ([formTypes][5])

---

## 3. Familles d’API pertinentes pour le connecteur adhérents

### 3.1. Formulaires

Endpoints pour lister / détailler les **formulaires** d’une organisation et leurs métadonnées publiques — utiles pour identifier un **périmètre de formulaires d’adhésion**, à **affiner** selon les comptes et formulaires utilisés, et pour préparer le **routage** (structure, campagne, slug). ([API Overview][1])

### 3.2. Commandes

Endpoints pour obtenir les **commandes** associées à un formulaire (`…/forms/{formType}/{formSlug}/orders`). Pertinents pour suivre les souscriptions sur un formulaire relevant du périmètre adhésion tel qu’identifié sur le terrain. ([Référence — commandes][2])

### 3.3. Paiements

Endpoints pour les **paiements** liés à un formulaire et le **détail d’un paiement** — utiles pour qualifier l’état transactionnel et croiser avec la **règle métier d’éligibilité** du flux (cf. spec §2.2). ([Référence — paiements][3])

### 3.4. Notifications / webhooks

HelloAsso permet de définir une **URL de notification** ; les types **`Order`**, **`Payment`**, **`Form`**, **`Organization`** sont documentés (paramètre `notificationType` ; si absent, toutes les notifications). Configuration côté compte association (**Intégrations et API**) ou mécanismes **partenaires** selon le cas. ([Notifications webhook][4])

**Exploitation :** le corps des notifications s’appuie sur un champ **`eventType`** pour distinguer les événements ; des exemples de payloads sont fournis dans la doc. ([Notifications webhook][4], [exemples de notifications][6])

**Politique de retry (doc notifications) :** si l’URL ne renvoie pas **HTTP 200**, HelloAsso **réessaie** la livraison. L’intervalle entre deux tentatives suit la formule documentée `min(48h, 3 * 2 ** attempt)` (l’exposant porte sur le numéro de tentative `attempt`). Le **premier** délai est de **3 secondes** ; la doc indique jusqu’à **16** tentatives, avec un délai cumulé d’environ **27 heures** dans ce scénario. À prendre en compte pour l’**idempotence** et la **reprise**. ([Notifications webhook][4])

Les retries HelloAsso imposent que le traitement des notifications soit conçu comme **idempotent par événement métier reçu** : un même événement peut être livré plusieurs fois ; le connecteur ne doit pas appliquer deux fois l’effet métier (création / mise à jour) sans garde-fou. Cela découle directement de la politique de retry documentée.

---

## 4. Ce que cela permet d’affirmer pour le projet

À ce stade, on peut considérer comme **acquis** :

1. **Une API officielle v5** existe, avec **sandbox**, **OAuth 2.0** et documentation centralisée sur **dev.helloasso.com**. ([API Overview][1])
2. HelloAsso couvre un **périmètre** cohérent pour les **adhésions** au sens large : **formulaires** paramétrés par **`formType`**, **commandes** et **paiements** associés, et endpoint de **types de formulaires** pour inspection par organisation — la **valeur** de `formType` pour les adhésions sur chaque compte reste à **valider en audit**. ([API Overview][1], [formTypes][5])
3. Le connecteur peut s’appuyer sur **plusieurs niveaux de lecture** : formulaires, commandes, paiements, et **notifications**. ([Notifications webhook][4])
4. Une architecture **hybride** (notification + réconciliation planifiée) reste **cohérente** avec les mécanismes documentés — à valider selon contraintes projet. ([Notifications webhook][4])

---

## 5. Points qui restent à trancher ou vérifier

La documentation publique confirme les briques techniques, mais **ne suffit pas** à figer seule la modélisation métier du connecteur.

### 5.1. Point d’entrée métier exact du flux

Quelle ressource fait foi pour une **adhésion éligible** : **commande**, **paiement**, **ligne de commande**, **combinaison** ? À trancher avec le métier et les payloads réels.

### 5.2. Règle exacte d’entrée dans le flux

Formaliser avec le métier ce qui correspond à l’**état métier « validé »** (cf. spec) : création de commande, paiement autorisé, autre — en cohérence avec les **notifications** `Order` / `Payment` et les champs API.

### 5.3. Réalité des formulaires et des droits

Sur les **comptes réels** des structures :

* structures, slugs, formulaires d’adhésion actifs ;
* **valeurs `formType`** et champs exposés ;
* signaux de **routage** LGZ / RGL / CCC ;
* champs disponibles pour **rapprochement** et **segmentation** ;
* confirmation que le client API dispose des **rôles** nécessaires sur les routes retenues.

---

## 6. Conséquences directes pour la spec

La documentation technique confirme les **briques d’intégration** (API, auth, lecture commandes / paiements, notifications), mais **ne tranche pas à elle seule** le **point de vérité métier** du flux adhésion : ce choix devra être **arrêté** entre **commande**, **paiement**, ou **combinaison** des deux (et éventuellement d’autres objets), en cohérence avec les arbitrages de la spec et l’audit des formulaires.

La spécification peut en outre affirmer sans excès de risque :

* API **v5**, **sandbox**, **OAuth 2.0** documentés ;
* existence de routes autour des **formulaires**, **commandes**, **paiements** et des parcours **adhésion** au sens large ;
* possibilité de **notifications** pour déclencher ou compléter un flux ;

et doit continuer à traiter comme **arbitrage** le **point d’entrée métier exact** et la **règle d’éligibilité**, alignés sur cette note et sur l’audit terrain.

---

## 7. Recommandation de travail

1. **Référencer dans le projet** (spec §11, ADR §5) : URL exacte des pages utilisées, **date d’accès** ou **version du changelog** HelloAsso consultée.
2. **Tester dans le sandbox** : obtention de jetons, appel des routes **formTypes** puis **commandes** (et **paiements** si besoin) sur un **formulaire d’adhésion** dont le **`formType`** aura été identifié sur l’environnement de test.
3. **Auditer** les formulaires et comptes **réels** des associations pour figer règle d’éligibilité, routage, rapprochement et **valeurs `formType`** effectives.
4. **Architecture** : envisager notifications + batch de réconciliation si les contraintes le permettent ; garantir **idempotence** face aux retries webhook (cf. §3.4).

---

## 8. Synthèse

HelloAsso documente une **API v5** (production et **sandbox**), une authentification **OAuth 2.0** avec cycle de vie de jetons et contraintes d’usage, des routes autour des **formulaires** (dont **types** par organisation), **commandes** et **paiements**, et des **notifications** typées avec politique de **retry** documentée (formule d’intervalle, HTTP 200 requis).

Cela **légitime** le cadrage du connecteur adhérents. Le **cœur du travail restant** est métier et terrain : **éligibilité**, **point de vérité** (commande vs paiement vs combinaison), **routage**, **valeurs de types de formulaires** sur les comptes réels, et **droits** effectifs sur les routes utilisées. En pratique, **`GET …/formTypes`** (cf. §2.4) précède toute décision figée sur les **`formType`** utilisés en intégration.

---

## 9. Liens de référence canoniques (sans paramètres de tracking)

Utiliser ces URLs comme base ; en cas de 404 ou de redirection, repartir de [dev.helloasso.com](https://dev.helloasso.com/).

| # | Sujet | URL |
|---|--------|-----|
| [1] | API Overview (base URLs, OAuth, privilèges associations, checkout) | https://dev.helloasso.com/docs/api-overview |
| [2] | Obtenir les commandes d’un formulaire | https://dev.helloasso.com/reference/get_organizations-organizationslug-forms-formtype-formslug-orders |
| [3] | Paiements d’un formulaire | https://dev.helloasso.com/reference/get_organizations-organizationslug-forms-formtype-formslug-payments |
| [4] | Notifications / webhook | https://dev.helloasso.com/docs/notifications-webhook |
| [5] | Types de formulaires pour une organisation | https://dev.helloasso.com/reference/get_organizations-organizationslug-formtypes |
| [6] | Exemples de notifications | https://dev.helloasso.com/docs/notification-exemple |
| [7] | S’authentifier (client credentials, refresh, durées, limites) | https://dev.helloasso.com/docs/getting-started |

**Catalogue complet des endpoints :** https://dev.helloasso.com/reference

---

## Historique des versions de cette note

| Version | Date | Modifications |
|---------|------|----------------|
| 0.1 | Avril 2026 | Première consolidation |
| 0.2 | Avril 2026 | Liens canoniques (suppression des `utm_*`), OAuth et cycle de vie des jetons, rôles/privilèges sur les routes, retries webhook, API billetterie signalée hors scope, lien formTypes, tableau de références §9, liens vers SPEC/ADR |
| 0.3 | Avril 2026 | **Synthèse** en tête ; prudence sur la valeur **`formType` / adhésion** (§2.4, §4, §5.3, §7–8) ; **retry** webhook explicite (formule, 16 tentatives, ~27 h) ; **§6** : point de vérité métier doc vs arbitrage ; formulation **§3.1** alignée audit formulaires |
| 0.3.1 | Avril 2026 | **Synthèse** : ajout explicite des **formulaires** dans la liste des briques ; **§2.4** : `formTypes` comme première source à interroger sur un compte réel ; **§8** : rappel opérationnel lié à `formTypes` |
| 0.3.2 | Avril 2026 | **§2.2** : `refresh_token` — libellé **« environ 1 mois »** (alignement doc HelloAsso) ; **§3.4** : idempotence **par événement métier** face aux retries ; renvoi ADR **§5** (ex-§4) pour la référence doc dans les recommandations |

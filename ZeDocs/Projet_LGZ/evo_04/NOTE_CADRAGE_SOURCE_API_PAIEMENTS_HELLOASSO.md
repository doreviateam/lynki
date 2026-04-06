# Note De Cadrage — Source API Paiements HelloAsso

## Objet

Cette note ouvre le lot `evo_04` en documentant la **source API réelle** déjà mobilisable pour alimenter `dorevia.helloasso.payment`.

Elle ne décrit pas encore l'import API final. Elle fixe d'abord :

- l'endpoint déjà disponible dans le connecteur ;
- les champs de payload déjà confirmés par le code existant ;
- les écarts connus avec le mapping CSV MVP validé ;
- les points à confirmer avant de coder l'import API.

## 1. Endpoint confirmé dans le code

Le connecteur expose déjà une lecture paginée des paiements de formulaire via :

- fonction : `fetch_form_payments_page(...)`
- fichier : `units/odoo/custom-addons/dorevia_helloasso_connector/models/helloasso_client.py`
- route :
  `/v5/organizations/{organizationSlug}/forms/{formType}/{formSlug}/payments`

Paramètres déjà gérés :

- `organizationSlug`
- `formType`
- `formSlug`
- `pageIndex`
- `pageSize`
- `Authorization: Bearer <token>`

Retour actuel :

- `items`
- `total`
- `raw` (corps JSON brut si HTTP 200)

## 2. Ce que le code existant lit déjà dans le payload API

Le module adhérents exploite déjà plusieurs champs du payload `payment` dans :

- `units/odoo/custom-addons/dorevia_helloasso_members/models/helloasso_sync.py`

Champs déjà confirmés comme lisibles ou tentés en lecture :

### 2.1. Identité du paiement

- `payment.id`
- `payment.state`
- `payment.amount`

### 2.2. Rattachement commande / formulaire

- `payment.order.id`
- `payment.order.formType`

### 2.3. Payeur

- `payment.payer.email`
- `payment.payer.firstName`
- `payment.payer.lastName`

### 2.4. Dates

Le code lit déjà, par ordre de repli :

1. `payment.date`
2. `payment.orderDate`
3. `payment.authorizationDate`
4. `payment.cashOutDate`
5. `payment.updateDate`
6. `payment.meta.createdAt`
7. `payment.meta.updatedAt`
8. `payment.order.date`
9. `payment.order.orderDate`
10. `payment.order.createdAt`

### 2.5. Moyen de paiement

Le code lit déjà :

- `payment.paymentMeans`
- repli : `payment.paymentOffLineMean`

## 3. Écart principal entre API observée par le code et CSV MVP

Le CSV MVP validé contient plus d'informations directement exploitables que ce que le code API actuel lit déjà.

### 3.1. Champs bien alignés avec le CSV

On peut déjà cartographier proprement :

- identifiant paiement
- identifiant commande
- payeur
- montant total
- date du paiement
- type de campagne ou rattachement formulaire partiel
- moyen de paiement brut
- statut brut du paiement

### 3.2. Champs encore incertains côté API

À ce stade, on n'a pas encore confirmé dans un payload réel API :

- un équivalent simple de `Versé`
- un équivalent simple de `Date du versement`
- les montants détaillés :
  - tarif
  - options
  - don supplémentaire
  - remise
- le nom exact de la campagne au même niveau de confort que dans le CSV
- le type de campagne au même niveau de confort que dans le CSV

### 3.3. Tableau de lecture des écarts CSV / API

| Donnée métier MVP | CSV MVP | API à ce stade |
|---|---|---|
| Référence paiement | équivalent confirmé | équivalent confirmé |
| Référence commande | équivalent confirmé | équivalent confirmé |
| Email payeur | équivalent confirmé | équivalent confirmé |
| Prénom / nom payeur | équivalent confirmé | équivalent confirmé |
| Statut brut du paiement | équivalent confirmé | équivalent confirmé |
| Moyen de paiement brut | équivalent confirmé | équivalent confirmé |
| Date du paiement | équivalent confirmé | équivalent confirmé avec chaîne de repli |
| Montant total | équivalent confirmé | équivalent probable, unité à confirmer |
| Versé | équivalent confirmé | pas d'équivalent confirmé à ce stade |
| Date du versement | équivalent confirmé | pas d'équivalent confirmé à ce stade |
| Nom de campagne | équivalent confirmé | équivalent probable, source exacte à confirmer |
| Type de campagne | équivalent confirmé | équivalent probable, source exacte à confirmer |
| Montant du tarif | équivalent confirmé | pas d'équivalent confirmé à ce stade |
| Montant des options | équivalent confirmé | pas d'équivalent confirmé à ce stade |
| Don supplémentaire | équivalent confirmé | pas d'équivalent confirmé à ce stade |
| Montant de remise | équivalent confirmé | pas d'équivalent confirmé à ce stade |

## 4. Premier mapping API → `dorevia.helloasso.payment`

Le tableau ci-dessous ne retient que ce qui est déjà raisonnablement confirmé par :

- le connecteur existant ;
- la synchro adhérents ;
- la note de référence API HelloAsso.

| Source API | Champ Odoo cible | Règle de transformation | Statut |
|---|---|---|---|
| `payment.id` | `helloasso_payment_ref` | cast texte, trim | confirmé |
| `payment.order.id` | `helloasso_order_ref` | cast texte, trim | confirmé |
| contexte d'import | `helloasso_account_id` | fourni par l'appelant | confirmé |
| `helloasso_account_id.company_id` | `company_id` | déduction depuis le compte | confirmé |
| `helloasso_account_id.company_id.currency_id` | `currency_id` | déduction depuis la société | confirmé |
| `payment.state` | `payment_status_raw` | conserver la valeur brute | confirmé |
| `payment.state` | `payment_status` | normalisation MVP à définir côté mapper API | à coder |
| `payment.paymentMeans` | `payment_method_raw` | conserver la valeur brute | confirmé |
| `payment.paymentMeans` / `payment.paymentOffLineMean` | `payment_method` | normalisation MVP à définir côté mapper API | à coder |
| chaîne de repli dates déjà utilisée par le code | `payment_date` | parseur datetime HelloAsso existant | confirmé |
| `payment.payer.firstName` | `payer_firstname` | trim | confirmé |
| `payment.payer.lastName` | `payer_lastname` | trim | confirmé |
| `payment.payer.email` | `payer_email` | trim + minuscule | confirmé |
| `payment.amount` | `amount_total` | conversion à confirmer selon unité API | partiel |
| payload JSON complet | `source_payload` | sérialisation fidèle | confirmé |

## 5. Point de vigilance sur le montant API

Le code adhérents traite actuellement `payment.amount` comme un montant en **centimes** et le convertit en euros en divisant par `100`.

Conséquence :

- ce comportement est une bonne hypothèse de départ ;
- mais il doit être **reconfirmé** sur un payload réel de paiement utilisé pour `dorevia.helloasso.payment`.

Tant que ce point n'est pas observé sur un cas API réel, il faut garder cette conversion comme :

- **hypothèse technique forte**
- mais **pas encore preuve finale de mapping**

## 6. Écarts de doctrine à éviter

Le lot API ne doit pas modifier la doctrine validée par le lot CSV.

On conserve donc :

- le même modèle `dorevia.helloasso.payment`
- la même idempotence sur `helloasso_account_id + helloasso_payment_ref`
- le même filtre MVP `paiement plateforme`
- la même lecture Odoo

La seule différence admise est :

- la **source** d'alimentation : API au lieu de CSV

## 7. Ce qu'il reste à confirmer avant de coder l'import API

### 7.1. Payload réel

Il faut observer au moins un payload réel `payment` issu de l'endpoint API pour confirmer :

- la structure exacte des champs ;
- l'unité du montant ;
- la présence ou non d'un statut de versement ;
- la présence ou non d'une date de versement ;
- la présence ou non des montants détaillés.

### 7.2. Règle de qualification MVP

Il faudra vérifier quelles valeurs API correspondent réellement à :

- paiement plateforme en ligne
- paiement hors ligne

afin d'aligner le mapper API avec la logique CSV déjà validée.

### 7.3. Niveau de détail campagne

Il faudra confirmer où récupérer de façon fiable :

- le nom de campagne
- le type de campagne

depuis le payload `payment`, le sous-objet `order`, ou le contexte formulaire.

## 8. Recommandation de suite

La prochaine étape du lot doit être :

1. observer un payload API réel de paiement ;
2. compléter ce mapping avec les champs réellement constatés ;
3. coder ensuite un mapper API dédié ;
4. seulement après, brancher le service d'import API.

## 9. Synthèse

Le projet dispose déjà d'un endpoint API paiements exploitable et d'une première lecture partielle du payload via la synchro adhérents.

On peut donc affirmer que :

- la source API des paiements existe déjà dans le socle ;
- le futur import API pourra réutiliser une partie importante du raisonnement du lot CSV ;
- mais plusieurs champs utiles au MVP paiement restent encore à confirmer sur un payload réel, en particulier :
  - unité du montant
  - statut de versement
  - date de versement
  - montants détaillés
  - nom/type de campagne

Cette note sert donc de **base de cartographie initiale**, avant observation d'un payload API réel et avant codage du mapper API.

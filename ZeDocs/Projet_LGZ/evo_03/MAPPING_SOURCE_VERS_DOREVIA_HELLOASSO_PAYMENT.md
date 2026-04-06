# Mapping source → `dorevia.helloasso.payment`

## Statut

Mapping MVP de référence.

## Objet

Définir le mapping cible entre une ligne de paiement HelloAsso et le modèle Odoo :

`dorevia.helloasso.payment`

Le document fixe :

- les champs source HelloAsso réellement utilisés ;
- les champs cibles Odoo ;
- les règles de transformation ;
- le caractère MVP de chaque donnée.

## Hypothèse source retenue

Le mapping MVP s'appuie sur l'objet **payment** renvoyé par l'API HelloAsso v5 sur :

`GET /organizations/{organizationSlug}/forms/{formType}/{formSlug}/payments`

Le mapping doit tolérer :

- camelCase ;
- PascalCase ;
- certains replis déjà observés dans le code existant.

## Doctrine générale

Pour chaque donnée utile, distinguer :

1. la valeur brute source HelloAsso ;
2. la valeur normalisée Odoo ;
3. les booléens métier dérivés utiles au MVP.

Le payload source doit être conservé pour permettre une relecture fidèle.

## Mapping MVP principal

| Champ source HelloAsso | Champ cible Odoo | Règle de transformation | Statut MVP |
|---|---|---|---|
| `payment.id` / `Id` | `helloasso_payment_ref` | conversion en texte ; identifiant stable | requis |
| `order.id` / `Order.Id` | `helloasso_order_ref` | conversion en texte | requis |
| compte HelloAsso de la synchro | `helloasso_account_id` | fourni par le contexte de synchro, pas par le payload seul | requis |
| société du compte HelloAsso | `company_id` | dérivée de `helloasso_account_id.company_id` | requis |
| `order.formSlug` / slug du formulaire synchronisé | hors modèle MVP immédiat | utile plus tard si besoin de traçabilité plus fine | optionnel |
| titre formulaire / campagne | `campaign_name` | reprendre le titre HelloAsso connu ; sinon nom lisible du formulaire | requis |
| `order.formType` | `campaign_type` | conversion en texte normalisé | requis |
| `payment.state` | `payment_status_raw` | conserver la valeur brute source | requis |
| `payment.state` | `payment_status` | normalisation MVP simple | requis |
| `payment.paymentMeans` / `PaymentMeans` | `payment_method_raw` | conserver la valeur brute source | requis |
| `payment.paymentMeans` / `paymentOffLineMean` | `payment_method` | normalisation simple lisible | requis |
| `payment.date` ; repli `orderDate`, `authorizationDate`, `cashOutDate`, `updateDate`, `meta.createdAt`, `meta.updatedAt`, `order.date`, `order.createdAt` | `payment_date` | conversion via parseur datetime HelloAsso | requis |
| `payment.cashOutState` ou champ équivalent si disponible | `payout_status_raw` | conserver la valeur brute si fournie | utile |
| statut de versement source | `payout_status` | normalisation simple : versé / non versé / inconnu | utile |
| `payment.cashOutDate` ou équivalent | `payout_date` | conversion datetime si disponible | utile |
| `payment.amount` | `amount_total` | conversion centimes → montant décimal Odoo | requis |
| `payer.firstName` | `payer_firstname` | trim simple | requis |
| `payer.lastName` | `payer_lastname` | trim simple | requis |
| `payer.email` | `payer_email` | trim + lowercase | requis |
| payload complet payment | `source_payload` | sérialisation fidèle JSON | requis |

## Champs dérivés MVP

| Source / règle | Champ cible Odoo | Règle | Statut MVP |
|---|---|---|---|
| statut + moyen de paiement | `payment_kind` | `online` ou `offline` | requis |
| statut + moyen de paiement | `is_platform_payment` | vrai si paiement encaissé par HelloAsso | requis |
| statut + moyen de paiement | `is_offline_payment` | vrai si paiement seulement déclaré | requis |

## Règles de normalisation MVP

### 1. Références

- `helloasso_payment_ref` : toujours stocké comme texte ;
- `helloasso_order_ref` : toujours stocké comme texte.

## 2. Dates

Utiliser le parseur HelloAsso déjà présent dans le projet.

Ordre de priorité recommandé :

1. `payment.date`
2. `payment.orderDate`
3. `payment.authorizationDate`
4. `payment.cashOutDate`
5. `payment.updateDate`
6. `payment.meta.createdAt`
7. `payment.meta.updatedAt`
8. `order.date`
9. `order.orderDate`
10. `order.createdAt`

## 3. Montants

Hypothèse MVP :

- les montants HelloAsso sont lus en centimes ;
- conversion en décimal Odoo avec division par 100 ;
- stockage dans `amount_total`.

## 4. Statut du paiement

Conserver deux niveaux :

- `payment_status_raw` : valeur brute HelloAsso ;
- `payment_status` : valeur normalisée MVP.

Normalisation MVP recommandée :

- `Paid` / `Authorized` / équivalent plateforme confirmé → `paid`
- `Pending` / équivalent attente → `pending`
- `Refunded` / équivalent remboursement → `refunded`
- autres cas non stabilisés → valeur lisible ou `unknown`

## 5. Statut de versement

Conserver deux niveaux :

- `payout_status_raw`
- `payout_status`

Normalisation MVP simple :

- versé → `paid_out`
- non versé → `not_paid_out`
- hors ligne → `offline`
- non connu → `unknown`

## 6. Moyen de paiement

Conserver deux niveaux :

- `payment_method_raw`
- `payment_method`

Normalisation MVP simple attendue :

- carte bancaire plateforme → `card`
- virement hors ligne → `bank_transfer_offline`
- chèque → `check`
- espèce → `cash`
- autre / non reconnu → libellé source conservé

## 7. Qualification métier MVP

### Paiement plateforme

`is_platform_payment = True` si :

- le paiement est marqué comme payé ou équivalent plateforme ;
- et le moyen de paiement correspond à un moyen encaissé par HelloAsso.

### Paiement hors ligne

`is_offline_payment = True` si :

- le statut ou le moyen de paiement indique un paiement hors ligne ;
- ou si HelloAsso ne détient pas les fonds.

### Règle de cohérence

Dans le MVP :

- `is_platform_payment` et `is_offline_payment` ne doivent pas être vrais en même temps ;
- `payment_kind` doit refléter cette qualification.

## Rattachement société / compte

Le rattachement ne doit jamais reposer sur une lecture globale de la base.

Règle MVP :

- la fonction de synchro reçoit un `helloasso_account_id` ;
- `company_id` est déduit du compte ;
- le payload source ne décide pas seul de la société cible.

## Politique sur les champs absents

### Requis pour créer la ligne

À minima :

- `helloasso_payment_ref`
- `helloasso_account_id`
- `company_id`

### Requis pour un paiement exploitable MVP

À minima :

- `amount_total`
- `payment_date`
- `payment_status`
- `payment_method`
- `payer_email`

Si l'un de ces champs manque, deux stratégies possibles :

- soit ignorer la ligne dans le MVP ;
- soit créer la ligne avec statut de revue manuelle dans un lot suivant.

Pour le MVP initial, la stratégie la plus simple est l'exclusion des lignes incomplètes.

## Données hors périmètre immédiat

Les champs suivants peuvent être gardés pour plus tard sans être obligatoires au premier lot :

- ventilation tarif / options / don ;
- commentaire ;
- détails fins de reversement ;
- rattachement comptable ;
- lien direct avec commande billetterie ou contact adhésion.

## Décision de mapping MVP

Le MVP doit distinguer systématiquement :

- valeur brute HelloAsso ;
- valeur normalisée Odoo ;
- qualification métier plateforme / hors ligne.

Le modèle `dorevia.helloasso.payment` doit donc être alimenté avec un mapping simple, stable et explicite avant toute implémentation de la synchronisation.

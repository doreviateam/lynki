# Mapping — Payload API observé vers `dorevia.helloasso.payment`

## Statut

Mapping fondé sur une **observation réelle** du payload API HelloAsso sur le lab.

## Objet

Ce document complète la note de cadrage source API en partant d'un **payment** réellement observé via :

- `HelloAsso`
- `Paiement`
- `Observer payload API`

Contexte observé :

- organisation : `testdorevia`
- `formType` : `Event`
- `formSlug` : `BilletterieTestDoreviaGLZ`
- environnement : sandbox

## 1. Champs confirmés dans le payload observé

Le payload observé confirme la présence des champs suivants :

### 1.1. Au niveau racine `payment`

- `amount`
- `cashOutState`
- `date`
- `id`
- `installmentNumber`
- `items`
- `meta`
- `order`
- `payer`
- `paymentMeans`
- `refundOperations`
- `state`

### 1.2. Dans `payment.order`

- `id`
- `date`
- `formSlug`
- `formType`
- `organizationName`
- `organizationSlug`
- `organizationType`
- `organizationIsUnderColucheLaw`
- `formName`

### 1.3. Dans `payment.meta`

- `createdAt`
- `updatedAt`

## 2. Points désormais confirmés pour le MVP

### 2.1. Références

On peut confirmer :

- `payment.id` → `helloasso_payment_ref`
- `payment.order.id` → `helloasso_order_ref`

### 2.2. Campagne

Le payload observé confirme :

- `payment.order.formName` comme source réaliste pour `campaign_name`
- `payment.order.formType` comme source réaliste pour `campaign_type`
- `payment.order.formSlug` comme information de traçabilité utile, même si le modèle MVP ne le stocke pas encore

### 2.3. Payeur

Le sous-objet `payer` est bien présent.

On confirme donc :

- `payer.firstName` → `payer_firstname`
- `payer.lastName` → `payer_lastname`
- `payer.email` → `payer_email`

### 2.4. Dates

Le champ `payment.date` est bien présent au format ISO complet.

Le repli existant du projet reste cohérent, mais sur le cas observé, la source principale de `payment_date` est bien :

- `payment.date`

### 2.5. Statut de versement

Le payload observé confirme enfin un vrai candidat pour le versement :

- `payment.cashOutState`

Donc :

- `cashOutState` → `payout_status_raw`
- une normalisation MVP `cashOutState` → `payout_status` devient maintenant légitime

## 3. Mapping confirmé à partir du payload observé

| Payload API observé | Champ Odoo cible | Règle retenue |
|---|---|---|
| `payment.id` | `helloasso_payment_ref` | cast texte |
| `payment.order.id` | `helloasso_order_ref` | cast texte |
| contexte d'import | `helloasso_account_id` | fourni par l'appelant |
| `helloasso_account_id.company_id` | `company_id` | déduit du compte |
| `helloasso_account_id.company_id.currency_id` | `currency_id` | déduit de la société |
| `payment.order.formName` | `campaign_name` | texte brut trimé |
| `payment.order.formType` | `campaign_type` | texte brut trimé |
| `payment.state` | `payment_status_raw` | conserver la valeur brute |
| `payment.state` | `payment_status` | normalisation MVP à coder |
| `payment.cashOutState` | `payout_status_raw` | conserver la valeur brute |
| `payment.cashOutState` | `payout_status` | normalisation MVP à coder |
| `payment.paymentMeans` | `payment_method_raw` | conserver la valeur brute |
| `payment.paymentMeans` | `payment_method` | normalisation MVP à coder |
| `payment.date` | `payment_date` | parseur datetime HelloAsso |
| `payer.firstName` | `payer_firstname` | trim |
| `payer.lastName` | `payer_lastname` | trim |
| `payer.email` | `payer_email` | trim + minuscule |
| payload complet `payment` | `source_payload` | sérialisation JSON fidèle |

## 4. Sujet encore partiel : `amount`

Le payload observé confirme la présence du champ :

- `payment.amount`

En revanche, la capture seule ne suffit pas à démontrer définitivement si :

- la valeur est exprimée en centimes,
- ou déjà dans l'unité monétaire finale.

Donc, à ce stade :

- la règle `amount / 100` reste l'hypothèse la plus cohérente avec le code existant ;
- mais elle doit être validée en comparant la valeur brute du payload avec le montant attendu du paiement observé dans HelloAsso.

## 5. Sujet encore ouvert : `payout_date`

Le payload observé confirme `cashOutState`, mais ne prouve pas encore un champ de date de versement exploitable dans le premier écran observé.

Donc :

- `payout_status_raw` est désormais confirmé ;
- `payout_date` reste encore à confirmer sur un autre payload ou via lecture complète si présent ailleurs.

## 6. Sujets hors confirmation à ce stade

Les éléments suivants restent non confirmés dans le payload observé :

- `amount_tariff`
- `amount_options`
- `amount_extra_donation`
- `amount_discount`
- un équivalent direct simple du CSV pour `Date du versement`

Ils restent donc hors contrat MVP API initial tant qu'ils ne sont pas observés clairement.

## 7. Conséquence pour le mapper API

Le futur mapper API peut maintenant être fondé sur des champs réellement observés pour :

- références
- payeur
- campagne
- statut du paiement
- statut de versement brut
- moyen de paiement
- date du paiement
- payload brut

Le mapper API devra encore traiter explicitement :

- la conversion de `amount`
- la normalisation de `state`
- la normalisation de `cashOutState`
- la normalisation de `paymentMeans`

## 8. Décision de travail

À partir de cette observation, le prochain pas raisonnable est :

1. coder un mapper API MVP ;
2. conserver le même modèle `dorevia.helloasso.payment` ;
3. conserver la même idempotence ;
4. conserver le filtre `paiement plateforme` déjà validé par le lot CSV.

## 9. Synthèse

Le payload API observé confirme que l'API HelloAsso fournit déjà les briques nécessaires pour alimenter `dorevia.helloasso.payment` dans un lot MVP :

- identifiant paiement
- identifiant commande
- campagne
- payeur
- date du paiement
- statut du paiement
- moyen de paiement
- statut brut de versement
- payload source complet

Le point technique principal restant à sécuriser avant le mapper est la règle exacte de conversion de `amount`.

Le reste du lot peut désormais avancer sur une base de données observées, et non plus seulement supposées.

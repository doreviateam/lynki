# Spécification du mapper — `dorevia.helloasso.payment`

## Statut

Spécification de développement MVP.

## Objet

Définir le contrat de la future fonction de mapping entre une ligne source HelloAsso et un dictionnaire de valeurs Odoo compatible avec :

`dorevia.helloasso.payment`

Le mapper ne crée pas lui-même l'enregistrement. Il prépare les champs bruts, les champs normalisés et les booléens métier dérivés.

## Entrées attendues

Le mapper reçoit :

- une ligne source HelloAsso ;
- un `helloasso_account` ;
- éventuellement un mode source :
  - `csv`
  - `api`

## Sortie attendue

Le mapper retourne un dictionnaire `vals` prêt pour `create()` ou `write()` sur :

`dorevia.helloasso.payment`

## Données de contexte obligatoires

Le mapper ne cherche pas la société dans la ligne source.

Il reçoit :

- `helloasso_account_id`
- `company_id = helloasso_account.company_id`
- `currency_id = company.currency_id`

## Fonctions de transformation à prévoir

### 1. `_normalize_csv_decimal(value)`

Rôle :

- convertir `45,00` en `45.00` ;
- retourner `False` si la valeur est vide dans le MVP.

Utilisation :

- `amount_total`
- `amount_tariff`
- `amount_options`
- `amount_extra_donation`
- `amount_discount`

### 2. `_parse_payment_csv_datetime(value)`

Rôle :

- parser `03/04/2026 18:23:13` ;
- parser `03/04/2026`.

Règle retenue :

- si heure absente, utiliser `00:00:00` en heure locale Odoo.

### 3. `_normalize_payment_status(raw_status)`

Exemples MVP :

- `Payé` → `paid`
- `Hors Ligne` → `offline`
- autre → `unknown`

### 4. `_normalize_payout_status(raw_payout_status)`

Exemples MVP :

- `Oui` → `paid_out`
- `Non` → `not_paid_out`
- `Hors Ligne` → `offline`
- vide → `unknown`

### 5. `_normalize_payment_method(raw_method)`

Exemples MVP :

- `Carte bancaire` → `card`
- `Virement bancaire` → `bank_transfer_offline`
- `Espèce` → `cash`
- autre → `unknown` ou libellé source nettoyé

### 6. `_qualify_payment(payment_status_raw, payment_method_raw, payout_status_raw)`

Rôle :

- déduire `payment_kind`
- déduire `is_platform_payment`
- déduire `is_offline_payment`

Règle MVP :

- `Payé + Carte bancaire` → `online`, plateforme
- `Hors Ligne + Virement bancaire` → `offline`, hors ligne
- `Hors Ligne + Espèce` → `offline`, hors ligne

## Contrat de mapping MVP

À partir d'une ligne source CSV, le mapper doit produire au minimum :

- `helloasso_payment_ref`
- `helloasso_order_ref`
- `helloasso_account_id`
- `company_id`
- `currency_id`
- `campaign_name`
- `campaign_type`
- `payment_kind`
- `payment_date`
- `payment_status_raw`
- `payment_status`
- `payout_status_raw`
- `payout_status`
- `payout_date`
- `payment_method_raw`
- `payment_method`
- `amount_total`
- `amount_tariff`
- `amount_options`
- `amount_extra_donation`
- `amount_discount`
- `payer_firstname`
- `payer_lastname`
- `payer_email`
- `source_payload`
- `is_platform_payment`
- `is_offline_payment`

## Politique MVP de filtrage

Le filtrage métier ne doit pas être caché dans le code d'import.

Le mapper doit permettre au service appelant de décider explicitement :

- si la ligne est éligible au MVP ;
- ou si elle est hors périmètre.

Pour cela, le plus simple est que le mapper fournisse :

- `is_platform_payment`
- `is_offline_payment`

Puis que le service d'import applique la règle :

- importer seulement `is_platform_payment = True`

## Politique sur les champs absents

Si les champs suivants manquent, la ligne ne doit pas entrer dans le MVP :

- `Référence paiement`
- `Montant total`
- `Date du paiement`
- `Statut du paiement`
- `Moyen de paiement`

Le service d'import pourra compter ces lignes comme ignorées.

## Politique de payload source

Le mapper doit conserver la ligne source dans `source_payload`.

Dans le cas CSV :

- stocker une représentation sérialisée fidèle de la ligne ;
- ne pas perdre les colonnes non encore utilisées.

## Critère de fin pour le mapper MVP

Le mapper est considéré prêt quand :

- une ligne `Payé + Carte bancaire` produit des `vals` cohérents et importables ;
- une ligne `Hors Ligne + Virement bancaire` est qualifiée hors ligne ;
- une ligne `Hors Ligne + Espèce` est qualifiée hors ligne ;
- les montants et dates sont correctement convertis ;
- les champs bruts et normalisés sont bien distincts.

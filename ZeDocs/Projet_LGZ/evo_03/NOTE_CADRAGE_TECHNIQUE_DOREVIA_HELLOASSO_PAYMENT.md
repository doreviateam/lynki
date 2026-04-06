# Note de cadrage technique — `dorevia.helloasso.payment`

## Statut

Cadrage technique court pour MVP.

## Objet

Créer un objet métier dédié dans Odoo pour stocker les paiements HelloAsso utiles au suivi interne :

`dorevia.helloasso.payment`

L'objectif est de disposer d'un pivot simple, stable et idempotent avant tout traitement comptable plus poussé.

## Positionnement

Le modèle `dorevia.helloasso.payment` ne remplace pas la comptabilité Odoo.

Dans le MVP, il sert à :

- relire les paiements HelloAsso dans Odoo ;
- rattacher chaque paiement à la bonne société ;
- relier le paiement à son compte HelloAsso et à sa campagne ;
- distinguer les paiements plateforme des paiements hors ligne ;
- constituer une base propre pour les lots suivants.

## Périmètre MVP

Le MVP porte sur les paiements HelloAsso en ligne réellement encaissés par la plateforme.

Le MVP ne vise pas encore :

- la création d'écritures comptables ;
- le rapprochement bancaire automatisé ;
- la gestion complète des reversements ;
- le traitement métier complet des paiements hors ligne.

## Modèle cible

Le modèle recommandé est :

`dorevia.helloasso.payment`

### Champs MVP à prévoir

- `helloasso_payment_ref`
- `helloasso_order_ref`
- `company_id`
- `helloasso_account_id`
- `campaign_name`
- `campaign_type`
- `payment_kind`
- `payment_date`
- `payment_status`
- `payout_status`
- `payout_date`
- `payment_method`
- `amount_total`
- `payer_firstname`
- `payer_lastname`
- `payer_email`
- `source_payload`
- `currency_id`
- `active`

### Champs de qualification utiles

- `is_platform_payment`
- `is_offline_payment`

## Règle d'unicité

La clé d'idempotence recommandée pour le MVP est :

- unicité sur `helloasso_account_id` + `helloasso_payment_ref`

Cette forme est plus robuste qu'une unicité sur la seule référence paiement dans une architecture multi-compte.

## Règles MVP de sélection

Dans le premier lot, ne retenir que les paiements HelloAsso en ligne.

Règle simple :

- paiement marqué comme payé ;
- moyen de paiement plateforme, par exemple carte bancaire.

À exclure du flux MVP :

- paiements hors ligne ;
- espèces ;
- chèques ;
- virements hors ligne.

## Règles MVP de rattachement

Chaque paiement importé doit être rattaché explicitement :

- à la bonne société Odoo ;
- au bon compte HelloAsso.

Le rattachement ne doit pas reposer sur une lecture globale de la base.

## Règles MVP de transformation

À l'import, prévoir au minimum :

- conversion des montants HelloAsso en décimal métier ;
- conversion des dates HelloAsso ;
- conservation du payload source ;
- normalisation simple des statuts utiles ;
- réimport idempotent sans doublon.

## Restitution Odoo minimale

Le MVP doit permettre une vue liste simple avec les colonnes suivantes :

- Réf paiement
- Réf commande
- Société
- Campagne
- Date du paiement
- Payeur
- Montant
- Statut du paiement
- Versé
- Date du versement

## Principe d'implémentation

Le bon ordre d'implémentation est le suivant :

1. créer le modèle `dorevia.helloasso.payment` ;
2. implémenter l'import idempotent ;
3. filtrer strictement les paiements plateforme en ligne ;
4. exposer une vue liste simple ;
5. traiter plus tard les reversements, rapprochements et écritures comptables.

## Décision de cadrage

Le prochain lot HelloAsso peut s'ouvrir sur cette base :

`dorevia.helloasso.payment` devient l'objet pivot du futur flux paiements HelloAsso dans Odoo, avant toute intégration comptable plus avancée.

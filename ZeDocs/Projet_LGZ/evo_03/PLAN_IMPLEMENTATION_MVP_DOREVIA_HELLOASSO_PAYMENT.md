# Plan d'implémentation MVP — `dorevia.helloasso.payment`

## Statut

Plan d'implémentation MVP.

## Objectif

Mettre en place un premier flux Odoo simple pour stocker et relire les paiements HelloAsso en ligne, sans ouvrir tout de suite le chantier comptable.

## Principe

Le lot MVP doit produire un objet métier stable, idempotent et lisible :

`dorevia.helloasso.payment`

Le lot ne doit pas chercher à traiter dès maintenant :

- la comptabilité automatique ;
- le rapprochement bancaire ;
- les reversements comptables complets ;
- tous les cas métiers hors ligne.

## Étape 1 — Créer le modèle métier

Créer le modèle :

`dorevia.helloasso.payment`

### À faire

- créer le modèle Python ;
- définir les champs MVP retenus ;
- ajouter `company_id`, `helloasso_account_id`, `currency_id`, `active` ;
- ajouter les booléens `is_platform_payment` et `is_offline_payment` ;
- définir l'ordre de tri par date de paiement décroissante.

### Résultat attendu

Le modèle existe et peut stocker un paiement HelloAsso comme objet métier autonome.

## Étape 2 — Poser l'idempotence

### À faire

- définir la contrainte d'unicité sur :
  - `helloasso_account_id`
  - `helloasso_payment_ref`
- préparer la logique `create or update` à l'import.

### Résultat attendu

Une même ligne HelloAsso réimportée ne crée pas de doublon.

## Étape 3 — Cadrer le mapping source → Odoo

### À faire

- identifier dans la réponse HelloAsso les champs réellement utilisés ;
- mapper les champs MVP :
  - référence paiement ;
  - référence commande ;
  - société ;
  - compte HelloAsso ;
  - campagne ;
  - type de campagne ;
  - date ;
  - statut ;
  - moyen de paiement ;
  - montant ;
  - payeur ;
  - versement ;
- conserver le payload source.

### Résultat attendu

Le mapping d'import est explicite, stable et compréhensible.

## Étape 4 — Filtrer le périmètre MVP

### À faire

- ne retenir que les paiements HelloAsso en ligne ;
- marquer clairement :
  - `is_platform_payment`
  - `is_offline_payment`
- exclure du premier lot :
  - hors ligne ;
  - espèces ;
  - chèques ;
  - virements hors ligne.

### Résultat attendu

Le flux MVP ne mélange pas les paiements plateforme et les paiements hors ligne.

## Étape 5 — Implémenter le service d'import

### À faire

- créer une fonction de synchronisation dédiée ;
- la faire travailler dans le contexte du compte HelloAsso ;
- rattacher explicitement chaque ligne à :
  - `helloasso_account_id`
  - `company_id`
- gérer les conversions :
  - montants ;
  - dates ;
  - statuts ;
- appliquer l'idempotence.

### Résultat attendu

Le flux d'import produit des enregistrements `dorevia.helloasso.payment` cohérents et rattachés à la bonne société.

## Étape 6 — Exposer une lecture Odoo minimale

### À faire

- créer une vue liste ;
- créer une vue formulaire simple ;
- afficher au minimum :
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
- ajouter un menu clair dans le périmètre HelloAsso.

### Résultat attendu

L'utilisateur peut consulter les paiements HelloAsso utiles depuis Odoo sans ambiguïté.

## Étape 7 — Poser la sécurité et le périmètre société

### À faire

- ajouter les règles d'accès cohérentes avec la société active ;
- vérifier l'alignement entre :
  - compteurs éventuels ;
  - vues ;
  - règles d'accès ;
- éviter toute lecture globale multi-sociétés non voulue.

### Résultat attendu

Le flux paiements respecte la logique multi-sociétés déjà posée dans HelloAsso.

## Étape 8 — Ajouter un minimum de tests

### À faire

- test de création simple ;
- test de réimport sans doublon ;
- test de rattachement à la bonne société ;
- test d'exclusion d'un paiement hors ligne ;
- test de conversion montant/date ;
- test de filtre sur paiement plateforme.

### Résultat attendu

Le MVP est sécurisé sur les cas essentiels.

## Étape 9 — Préparer la suite sans l'ouvrir

### À documenter, sans traiter dans ce lot

- reversements HelloAsso ;
- rapprochement bancaire ;
- lien éventuel avec comptabilité Odoo ;
- traitement métier des paiements hors ligne ;
- articulation future avec adhésions et billetterie.

### Résultat attendu

Le MVP reste maîtrisé et n'embarque pas prématurément la complexité comptable.

## Ordre recommandé d'exécution

1. modèle ;
2. unicité ;
3. mapping ;
4. filtre MVP ;
5. import ;
6. vues ;
7. sécurité ;
8. tests.

## Critère de fin de lot MVP

Le lot peut être considéré comme terminé quand :

- un paiement HelloAsso en ligne importé crée ou met à jour un `dorevia.helloasso.payment` ;
- le rattachement société et compte HelloAsso est correct ;
- le réimport ne crée pas de doublon ;
- un paiement hors ligne n'entre pas dans le flux MVP ;
- la lecture Odoo est disponible dans une vue simple et exploitable.

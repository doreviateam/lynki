# Big Picture — Paiements HelloAsso vers Odoo

## Version

0.1

## Statut

Cadrage MVP

## Objet

Définir la logique cible de remontée des paiements HelloAsso vers Odoo, en distinguant clairement :

* les paiements en ligne réellement encaissés par HelloAsso ;
* les paiements hors ligne simplement déclarés dans HelloAsso ;
* les reversements éventuels de HelloAsso vers le compte bancaire.

L’objectif n’est pas de lancer immédiatement une automatisation comptable complète, mais de poser un cadre métier simple, cohérent et exploitable.

---

## 1. Intention générale

HelloAsso reste le canal public de collecte.

Odoo devient le référentiel interne de lecture, de rattachement et de suivi des paiements utiles à l’association.

Le principe retenu est le suivant :

* un paiement HelloAsso doit pouvoir être relu dans Odoo comme un fait métier rattaché à une société, une campagne et un payeur ;
* seuls les paiements en ligne encaissés par HelloAsso entrent dans un futur circuit de reversement ;
* les paiements hors ligne restent des traces métier utiles, mais ne doivent pas être confondus avec des flux financiers HelloAsso à reverser.

---

## 2. Distinction structurante à retenir

### 2.1. Paiement en ligne HelloAsso

Exemple typique :

* statut du paiement : `Payé`
* moyen de paiement : `Carte bancaire`
* versé : `Oui` ou `Non`

Lecture métier :

* HelloAsso a bien encaissé le paiement ;
* le paiement est un vrai flux plateforme ;
* le statut `Versé / Non versé` indique si les fonds ont déjà été reversés à l’association.

### 2.2. Paiement hors ligne déclaré dans HelloAsso

Exemple typique :

* statut du paiement : `Hors Ligne`
* moyen de paiement : `Espèce`, `Virement bancaire`, éventuellement `Chèque`
* versé : `Hors Ligne`

Lecture métier :

* HelloAsso ne détient pas les fonds ;
* HelloAsso sert seulement de registre de campagne ;
* il n’y a pas de reversement HelloAsso à attendre.

### 2.3. Conséquence de modélisation

Les paiements en ligne et les paiements hors ligne peuvent coexister dans le même export HelloAsso, mais ils ne doivent pas être interprétés de la même façon dans Odoo.

---

## 3. Périmètre MVP retenu

Le MVP porte sur la synchronisation des paiements HelloAsso **en ligne** vers Odoo.

Le MVP vise à permettre dans Odoo :

* la consultation des paiements HelloAsso en ligne ;
* le rattachement de ces paiements à la bonne société ;
* la lecture du statut de paiement ;
* la lecture du statut de versement ;
* la lecture du contexte de campagne et du payeur.

Le MVP ne vise pas encore :

* la comptabilisation automatique ;
* la gestion comptable complète des reversements ;
* le rapprochement bancaire automatisé ;
* le traitement complet des paiements hors ligne dans ce même flux.

---

## 4. Doctrine de séparation des flux

### 4.1. Flux HelloAsso à synchroniser dans le MVP

À inclure dans le premier lot :

* les paiements en ligne réellement encaissés par HelloAsso ;
* en pratique, les lignes de type `Payé` avec un moyen de paiement plateforme, par exemple `Carte bancaire`.

### 4.2. Flux à exclure du premier lot

À exclure du flux de synchronisation paiements HelloAsso en ligne :

* les lignes `Hors Ligne` ;
* les espèces ;
* les virements bancaires hors ligne ;
* les chèques hors ligne.

Ces flux restent utiles métier, mais ils relèvent d’un autre circuit.

### 4.3. Vérité comptable

La vérité de caisse et la vérité bancaire restent dans Odoo.

En conséquence :

* les espèces se gèrent dans Odoo via la caisse ;
* les virements se gèrent dans Odoo via la banque ;
* HelloAsso ne doit pas être lu comme une caisse.

---

## 5. Modèle métier cible dans Odoo

Le modèle recommandé est un modèle dédié, par exemple :

`dorevia.helloasso.payment`

Ce modèle a pour rôle de stocker les paiements HelloAsso synchronisés comme objets métiers internes.

### Champs minimaux recommandés

* `helloasso_payment_ref`
* `helloasso_order_ref`
* `company_id`
* `helloasso_account_id`
* `campaign_name`
* `campaign_type`
* `payment_kind`
* `payment_date`
* `payment_status`
* `payout_status`
* `payout_date`
* `payment_method`
* `amount_total`
* `amount_tariff`
* `amount_options`
* `amount_extra_donation`
* `amount_discount`
* `payer_firstname`
* `payer_lastname`
* `payer_email`
* `comment`

### Champs techniques utiles

* `source_payload`
* `import_batch_id`
* `active`

### Règle d’unicité

La référence de paiement HelloAsso doit servir de clé d’idempotence.

Une même ligne réimportée ne doit pas créer de doublon.

---

## 6. Données minimales visibles dans l’export HelloAsso

Les colonnes métier les plus structurantes sont :

* Référence commande
* Référence paiement
* Montant total
* Date du paiement
* Statut du paiement
* Versé
* Date du versement
* Campagne
* Type de campagne
* Moyen de paiement
* Nom payeur
* Prénom payeur
* Email payeur

D’autres colonnes restent utiles comme détails :

* Montant du tarif
* Montant des options
* Don supplémentaire
* Montant du code promo
* Commentaire

---

## 7. Règles de transformation MVP

### 7.1. Sélection

Ne retenir dans le premier lot que les paiements en ligne.

Règle simple :

* `Statut du paiement = Payé`
* et moyen de paiement de type plateforme, par exemple `Carte bancaire`

### 7.2. Qualification

Prévoir un indicateur simple de qualification interne, par exemple :

* `is_platform_payment`
* `is_offline_payment`

### 7.3. Normalisation

Prévoir à l’import :

* la conversion des montants au format décimal ;
* la conversion des dates HelloAsso ;
* la normalisation des valeurs de statut.

### 7.4. Société

Chaque paiement importé doit être rattaché explicitement à la bonne société Odoo.

Le rattachement doit reposer sur le compte HelloAsso concerné et non sur une lecture globale.

---

## 8. Lecture fonctionnelle attendue dans Odoo

Dans Odoo, l’utilisateur doit pouvoir lire rapidement :

* le paiement HelloAsso ;
* la société concernée ;
* la campagne ;
* le payeur ;
* le montant ;
* le statut du paiement ;
* le statut de versement.

### Vue liste minimale

Colonnes utiles :

* Réf paiement
* Réf commande
* Société
* Campagne
* Date du paiement
* Payeur
* Montant
* Statut du paiement
* Versé
* Date du versement

### Filtres utiles

* société
* campagne
* type de campagne
* payé / non payé
* versé / non versé
* période

---

## 9. Portée comptable à ce stade

Le MVP ne crée pas encore d’écriture comptable automatique.

Mais il prépare une doctrine comptable future fondée sur la distinction suivante :

### 9.1. Paiement HelloAsso en ligne

Lecture future possible :

* paiement constaté sur la plateforme ;
* potentiellement porté dans un compte d’attente HelloAsso ;
* puis soldé lors du reversement.

### 9.2. Paiement hors ligne

Lecture :

* trace métier utile ;
* pas de reversement HelloAsso attendu ;
* traitement comptable dans les circuits normaux Odoo, pas dans le flux HelloAsso.

---

## 10. Non-objectifs du MVP

Le MVP n’a pas pour objet :

* de faire de HelloAsso une caisse ;
* de synchroniser automatiquement les paiements hors ligne ;
* de générer automatiquement les écritures comptables ;
* de traiter les reversements bancaires ;
* de résoudre dès maintenant tous les sujets de rapprochement partenaire ou analytique.

---

## 11. Lecture LGZ / RGL / CCC

La logique de séparation doit rester la suivante :

* LGZ et RGL sont les périmètres société structurants ;
* CCC ne constitue pas une société autonome ;
* CCC doit être lu comme un sous-périmètre métier de LGZ.

En conséquence :

* la synchronisation des paiements doit d’abord respecter la séparation LGZ / RGL ;
* si un paiement concerne CCC, il doit être rattaché à LGZ puis distingué par campagne ou logique métier.

---

## 12. Étapes recommandées

### Étape 1

Cadrer le modèle `dorevia.helloasso.payment`.

### Étape 2

Définir le mapping CSV HelloAsso → champs Odoo.

### Étape 3

Créer un import CSV manuel, idempotent.

### Étape 4

Tester sur le lab avec un export réel HelloAsso.

### Étape 5

Évaluer ensuite un lot complémentaire sur :

* reversements HelloAsso ;
* journal HelloAsso ;
* compte d’attente ;
* rapprochement bancaire.

---

## 13. Synthèse

Le point clé est le suivant :

* HelloAsso peut fournir une matière de paiement très utile à Odoo ;
* mais il faut distinguer clairement paiement plateforme et paiement hors ligne ;
* le premier lot doit se concentrer sur les paiements en ligne, par société, sans lancer trop tôt la compta automatique.

La ligne directrice retenue est donc :

> synchroniser dans Odoo les paiements HelloAsso en ligne comme objets métiers internes, en distinguant explicitement le statut de paiement et le statut de versement, dans un périmètre société clair.

# Note d’arborescence fonctionnelle — Menu HelloAsso dans Odoo

## Objet

Documenter l’arborescence HelloAsso désormais livrée dans Odoo, avec une séparation plus nette entre :

- la consultation métier ;
- les flux billetterie ;
- les paiements ;
- les outils de configuration et d’import.

Cette note remplace les anciennes formulations centrées sur `Aide` et `Adhésion` au premier niveau, qui ne correspondent plus à l’état actuel du module.

## Principe produit

Le menu HelloAsso doit rester un point d’entrée simple pour l’utilisateur courant, tout en assumant que le projet sait maintenant traiter plusieurs objets métier :

- les contacts adhérents ;
- les événements / billetteries ;
- les commandes ;
- les paiements.

La navigation doit donc distinguer :

- ce que l’on consulte au quotidien ;
- ce que l’on déclenche de façon plus technique ;
- ce qui relève du paramétrage.

## Arborescence cible actuelle

```text
HelloAsso
- Contact
  - Adhérents
- Billetterie
  - Billetteries
  - Commandes
- Paiement
  - Paiements
- Configuration
  - Paiements
    - Importer un CSV
    - Importer via l'API
    - Observer payload API
```

## Lecture fonctionnelle

### 1. Contact

- `Adhérents` ouvre la vue métier des contacts synchronisés depuis HelloAsso.
- Le choix du terme `Contact` en premier niveau permet de mieux refléter la nature réelle de la donnée Odoo affichée.

### 2. Billetterie

- `Billetteries` expose l’inventaire des formulaires / événements HelloAsso connus dans Odoo.
- `Commandes` expose les commandes importées pour ces formulaires.

### 3. Paiement

- `Paiements` est la vue de consultation métier des paiements HelloAsso importés dans Odoo.
- Ce menu correspond à l’objet pivot `dorevia.helloasso.payment`.

### 4. Configuration

- `Configuration > Paiements` regroupe les outils techniques ou semi-techniques autour du flux paiement.
- `Importer un CSV` reste utile pour la recette, le secours et les imports manuels ponctuels.
- `Importer via l'API` est la voie manuelle nominale pour lancer le flux API MVP.
- `Observer payload API` est un outil d’observation / debug, sans création de données métier.

## Paramètres hors app HelloAsso

L’objet technique `Comptes HelloAsso` n’a plus vocation à apparaître dans le parcours standard.

La doctrine visée est :

- `Paramètres > HelloAsso` : configuration simple et courante ;
- `Paramètres > Technique > Dorevia > Comptes HelloAsso` : configuration technique / avancée.

Cette séparation évite de confondre :

- l’écran fonctionnel de configuration courante ;
- et le support technique multi-compte sous-jacent.

## Landing HelloAsso

La landing HelloAsso en racine d’application reste le point d’entrée d’orientation.

Elle doit désormais refléter au minimum les objets réellement disponibles :

- contacts adhérents ;
- billetteries / événements ;
- commandes ;
- paiements.

Elle n’a pas vocation à redevenir une fiche technique.

## Conclusion

L’arborescence HelloAsso est maintenant organisée selon une logique plus stable :

- lecture métier en premier ;
- outils techniques plus bas dans la hiérarchie ;
- configuration avancée tenue à distance du parcours courant.

Cette structure constitue désormais la base de navigation de référence pour les évolutions suivantes du périmètre HelloAsso.

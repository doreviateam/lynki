# Note de livraison — UX landing HelloAsso

| | |
|---|---|
| **Objet** | Landing d’orientation HelloAsso dans Odoo : lecture simple, synthèse par société active, accès rapides vers les objets métier réellement disponibles. |
| **Module** | `dorevia_helloasso_billetterie` |
| **Branche** | `web60-w60-103-tresorerie-contour-etat` |

## 1. Intention

La racine de l’app HelloAsso ne doit pas être une fiche technique, mais une page d’orientation lisible pour l’utilisateur courant.

Elle doit répondre rapidement à quatre questions :

- de quelle société parle-t-on ;
- quel est l’état général de la connexion HelloAsso ;
- quels flux existent déjà dans Odoo ;
- où aller ensuite.

## 2. Ce que la landing affiche désormais

La landing HelloAsso affiche désormais :

- la société active ;
- le statut de connexion ;
- un aperçu chiffré des flux disponibles ;
- des accès rapides ;
- un état de connexion synthétique ;
- des points à vérifier ;
- une aide rapide.

Les flux reflétés dans la page sont maintenant :

- contacts adhérents ;
- billetteries / événements ;
- commandes ;
- paiements.

## 3. Compteurs et accès rapides

Les compteurs exposés sur la landing couvrent désormais :

- les contacts synchronisés ;
- les campagnes en base ;
- les commandes importées ;
- les paiements importés.

Les accès rapides pointent vers :

- `Adhérents`
- `Billetteries`
- `Commandes`
- `Paiements`
- `Paramètres HelloAsso`

## 4. Positionnement UX

La landing reste :

- sobre ;
- lisible ;
- orientée usage ;
- non technique dans sa formulation.

Elle n’a pas vocation à exposer :

- les détails OAuth ;
- les objets multi-compte ;
- les assistants de debug ;
- les outils d’import avancés.

Ces éléments relèvent d’entrées plus techniques dans l’arborescence.

## 5. État actuel de référence

La landing HelloAsso est maintenant cohérente avec l’arborescence applicative actuelle :

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

## 6. Conclusion

La landing HelloAsso sert désormais de façade d’orientation sur un périmètre plus complet qu’au lot initial.

Elle ne se limite plus à l’adhésion et à la billetterie :
elle reflète aussi l’existence du flux paiements, tout en gardant une présentation simple et centrée sur la société active.

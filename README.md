# lynki

Repository historique d'implementation et de lab du projet Dorevia.

Ce repository n'est pas un des nouveaux repositories de refondation. Il sert de base historique, de terrain d'experimentation et de source de reprise selective pour la suite du programme.

## Cartographie des repositories

Le projet est desormais pense autour de trois repositories distincts:

- `lynki`
  Depot historique d'implementation et de lab
- `dorevia-saas-lynki`
  Repository de refondation de la couche SaaS de lecture et de pilotage
- `dorevia-saas-vault`
  Repository de refondation du noyau SaaS de preuve, d'integrite et de tracabilite

Le point central est le suivant:

- `lynki` ne doit pas etre confondu avec `dorevia-saas-lynki`
- `lynki` ne doit pas etre confondu avec `dorevia-saas-vault`
- les nouveaux repositories de refondation ne doivent pas etre deduits automatiquement de l'organisation historique de `lynki`

## Role de ce repository historique

`lynki` conserve pour l'instant:

- des implementations existantes
- des briques de laboratoire et de recette
- des connecteurs, scripts, structures de tenants et environnements historiques
- des morceaux de surface produit et de noyau technique encore co-localises

Ce repository peut servir de source d'analyse, de comparaison et de reprise, mais il ne constitue pas a lui seul l'architecture cible des nouveaux repos.

## Regle de migration

La migration depuis `lynki` vers les repositories de refondation doit etre:

- selective
- progressive
- documentee
- non destructive

Donc:

- pas de copie aveugle
- pas de refactor brutal du repository historique
- pas de deduction automatique des frontieres cibles a partir des dossiers historiques

## Orientation des reprises

Les reprises doivent etre triees selon leur responsabilite:

- ce qui releve de la surface SaaS de lecture et de pilotage ira vers `dorevia-saas-lynki`
- ce qui releve du noyau de preuve, d'integrite et de tracabilite ira vers `dorevia-saas-vault`
- ce qui reste ambigu, hybride, transitoire ou simplement utile au lab peut rester provisoirement dans `lynki`

## Odoo CE

Odoo CE reste la source ERP privilegiee au depart, mais cette priorite ne doit pas conduire a:

- reduire la future couche SaaS Lynki a un addon Odoo
- confondre les roles entre surface produit et noyau de confiance
- imposer une dependance identitaire structurelle a Odoo dans les repos de refondation

## Documentation utile

- [ADR frontiere Lynki / Vault](/Users/doreviateam/lynki/docs/adr/ADR-001-frontiere-lynki-vault.md)
- [Guide de migration](/Users/doreviateam/lynki/docs/migration/README.md)

## Intention immediate

Dans ce repository historique:

- on conserve l'existant
- on clarifie la cartographie des repos
- on prepare une migration par reprise selective
- on ne deplace pas de code tant que les cibles et contrats ne sont pas stabilises

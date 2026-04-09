# Migration depuis `lynki`

Ce document decrit une methode simple, progressive et non destructive pour migrer depuis le repository historique `lynki` vers les repositories de refondation:

- `dorevia-saas-lynki`
- `dorevia-saas-vault`

Il ne decrit pas un plan de copie brute. Il sert a organiser une reprise selective.

## Principe general

La bonne approche n'est pas:

- recopier des dossiers entiers parce qu'ils existent deja dans `lynki`
- reconstituer `dorevia-saas-lynki` ou `dorevia-saas-vault` en suivant automatiquement l'arborescence historique
- lancer un refactor brutal du depot historique

La bonne approche est:

1. identifier une capacite ou une responsabilite
2. determiner son repo cible
3. extraire seulement ce qui est utile a cette cible
4. redocumenter la brique dans son nouveau contexte
5. laisser le reste en place tant que la separation n'est pas assez claire

## Methode simple

### Etape 1. Partir d'une responsabilite, pas d'un dossier

Commencer par une question de responsabilite:

- est-ce de la surface SaaS de lecture et de pilotage
- est-ce du noyau de preuve, d'integrite et de tracabilite
- est-ce un element hybride ou historique qui ne doit pas encore bouger

### Etape 2. Qualifier la brique

Pour chaque brique candidate, decrire brievement:

- son role metier
- ses dependances
- son lien eventuel avec Odoo CE
- son lien eventuel avec Vault
- son niveau de couplage au tenant, a l'environnement ou au lab

### Etape 3. Choisir une destination

- si la brique sert la lecture, le pilotage, les parcours de surface ou les modeles de consultation, elle est candidate pour `dorevia-saas-lynki`
- si la brique sert la preuve, l'integrite, la verification, la tracabilite ou le coffre de confiance, elle est candidate pour `dorevia-saas-vault`
- si la brique reste melangee, instable, experimentale ou trop dependante de l'histoire du repo, elle reste provisoirement dans `lynki`

### Etape 4. Reprendre par petits lots

La migration doit se faire par petits lots:

- une capacite
- un contrat
- un connecteur
- une documentation

Pas par gros blocs de dossiers.

### Etape 5. Ne rien casser dans `lynki`

Tant qu'une reprise n'est pas stabilisee dans un repo de refondation:

- ne pas supprimer la source historique
- ne pas reorganiser massivement `lynki`
- ne pas faire semblant que la cible est deja en place

## A reprendre dans `dorevia-saas-lynki`

Cette categorie concerne ce qui releve de la future couche SaaS de lecture et de pilotage:

- interfaces de consultation
- parcours utilisateur de surface
- modeles de lecture et d'indicateurs
- orchestration de donnees pour la lecture
- administration produit et configuration de surface
- gestion applicative du multi-tenant
- connecteurs d'acces aux sources, dont Odoo CE, lorsqu'ils servent la lecture et le pilotage

Regle utile:

- Odoo CE y est traite comme source privilegiee au depart
- mais `dorevia-saas-lynki` ne doit pas etre reconstruit comme un simple addon Odoo

## A reprendre dans `dorevia-saas-vault`

Cette categorie concerne ce qui releve du futur noyau SaaS de preuve, d'integrite et de tracabilite:

- mecanismes de preuve
- logique d'integrite
- signatures, verifications et chainages
- registres ou ledgers de confiance
- conservation verifiable d'artefacts
- contrats d'exposition des preuves et etats de verification

Regle utile:

- Vault ne doit pas etre deduit automatiquement de l'organisation historique de `lynki`
- une brique ne va pas dans Vault parce qu'elle se trouve aujourd'hui dans un certain dossier
- elle va dans Vault seulement si sa responsabilite releve clairement du noyau de confiance

## A laisser provisoirement dans `lynki`

Doivent rester provisoirement dans `lynki`:

- les briques hybrides melangeant surface, integration et logique technique
- les scripts de lab ou d'exploitation encore trop dependants du contexte historique
- les structures de tenants et d'environnements non encore recadrees
- les elements de test, de recette ou de comparaison utiles a la transition
- tout composant dont la responsabilite cible reste ambiguë

Regle utile:

- laisser provisoirement dans `lynki` n'est pas un echec
- c'est une decision de prudence qui evite une migration prematuree ou destructive

## Resume de la posture

La migration depuis `lynki` vers les repos de refondation doit rester:

- guidee par les responsabilites
- progressive
- documentee
- reversible a court terme
- non destructive

A ce stade, aucun code n'est deplace par ce document. Il sert uniquement de cadre de tri et de reprise selective.

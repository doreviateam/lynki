# ADR-001 - Frontiere Lynki / Vault

- Statut: accepte
- Date: 2026-04-09

## Contexte

Dorevia construit deux repositories distincts avec des responsabilites differentes:

- `dorevia-saas-lynki`: surface SaaS de lecture et de pilotage financier
- `dorevia-saas-vault`: noyau de confiance et de verification

Le risque principal a ce stade est un brouillage des frontieres:

- soit en reduisant Lynki a une simple projection UI d'Odoo
- soit en faisant de Lynki un duplicat partiel des responsabilites de Vault
- soit en couplant trop tot l'identite produit a l'ERP source

Cette ADR fixe la frontiere fondatrice entre Lynki et Vault.

## Decision

Lynki et Vault sont deux systemes distincts, relies par contrat, avec une separation stricte des responsabilites.

### Lynki porte

- la surface produit
- les interfaces de lecture et de pilotage
- les services applicatifs de consultation
- l'orchestration des flux de surface
- les modeles de lecture et d'indicateurs
- la gestion produit du multi-tenant
- les connecteurs vers les systemes sources et vers Vault

### Vault porte

- le noyau de confiance
- la preuve d'integrite
- les mecanismes de signature et de verification
- les registres, ledgers et chainages de confiance
- la conservation verifiable des artefacts relevant du coffre

### Regle de frontiere

Lynki peut consommer, exposer ou mettre en forme des donnees, preuves ou etats provenant de Vault, mais Lynki ne re-implemente pas la logique de confiance de Vault.

Vault ne porte pas la responsabilite de la surface produit Lynki, de ses parcours utilisateurs, ni de ses modeles de pilotage metier.

## Place d'Odoo CE

Odoo CE est la source privilegiee au depart pour les donnees ERP, en particulier pour l'alimentation initiale des donnees financieres et des objets de gestion necessaires au pilotage.

Cette priorite ne change pas la frontiere d'architecture:

- Odoo CE est une source
- Lynki est le produit
- Vault est le noyau de confiance

En consequence:

- Lynki ne doit pas etre modele comme un module Odoo
- l'identite utilisateur de Lynki ne doit pas dependre structurellement de l'identite Odoo
- les permissions produit de Lynki ne doivent pas etre definies uniquement par les roles Odoo
- les contrats de donnees Odoo doivent etre traites comme des interfaces de connecteur

La formulation "sans dependance identitaire" signifie que Lynki doit pouvoir evoluer vers:

- une authentification propre
- des regles d'autorisation propres
- des parcours multi-tenant propres
- l'integration future d'autres sources que Odoo CE

## Consequences

### Consequences positives

- clarifie la responsabilite de chaque repo
- protege Lynki d'un couplage excessif a Odoo
- protege Vault d'une dilution vers la logique produit
- facilite une architecture multi-tenant plus lisible
- prepare l'ouverture a d'autres sources de donnees

### Contraintes assumees

- il faut definir des contrats explicites entre Lynki et Vault
- il faut definir des contrats explicites entre Lynki et Odoo CE
- certaines informations existent potentiellement dans plusieurs couches, mais pas avec la meme responsabilite
- la commodite court terme ne justifie pas un glissement de frontiere

## Implications de conception

### Pour Lynki

- privilegier des modeles de lecture et de pilotage orientes produit
- encapsuler l'acces a Odoo CE dans des connecteurs ou adaptateurs
- encapsuler l'acces a Vault dans des contrats de verification et de consultation
- faire du tenant une dimension explicite des interfaces et services

### Pour Vault

- exposer des contrats stables de confiance et de verification
- ne pas absorber la logique de presentation ni les besoins UX de Lynki

### Pour les futures contributions

- toute fonctionnalite melangeant lecture metier et logique de preuve doit etre decoupee avant implementation
- toute proposition d'authentification basee uniquement sur Odoo doit etre consideree comme transitoire et explicitement justifiee
- tout nouveau connecteur source doit respecter la meme frontiere que le connecteur Odoo CE

## Alternatives ecartees

### Alternative 1: Lynki comme simple front Odoo

Rejetee car elle reduit le produit a une extension de l'ERP, empeche l'autonomie du modele produit et fragilise l'ouverture multi-source.

### Alternative 2: Lynki integre les fonctions critiques de Vault

Rejetee car elle brouille la souverainete du noyau de confiance, augmente le risque d'architecture et affaiblit la lisibilite de responsabilite entre les deux repositories.

### Alternative 3: Odoo comme fournisseur d'identite principal de Lynki

Rejetee comme choix structurant par defaut. Une federation ou un pont transitoire peut exister tactiquement, mais l'architecture cible de Lynki ne doit pas dependre identitairement d'Odoo.

## Suite

Les ADR suivantes devraient preciser:

1. le modele multi-tenant de reference
2. les contrats entre Lynki et Vault
3. les contrats entre Lynki et Odoo CE
4. la strategie d'authentification et d'autorisation propre a Lynki

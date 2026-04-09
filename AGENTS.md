# AGENTS.md

Ce fichier cadre les interventions automatisees et humaines dans le repository historique `lynki`.

## Nature du repository

`lynki` est un depot historique d'implementation et de lab.

Il ne doit pas etre interprete comme:

- le futur `dorevia-saas-lynki`
- le futur `dorevia-saas-vault`
- une architecture cible proprement separee entre surface produit et noyau de confiance

## Cartographie a respecter

Le projet distingue desormais trois repositories:

- `lynki`: repository historique
- `dorevia-saas-lynki`: refondation de la couche SaaS de lecture et de pilotage
- `dorevia-saas-vault`: refondation du noyau SaaS de preuve, d'integrite et de tracabilite

Toute intervention dans `lynki` doit respecter cette distinction.

## Regles d'intervention

### 1. Ne pas confondre historique et refondation

- Ne pas presenter `lynki` comme si c'etait deja `dorevia-saas-lynki`.
- Ne pas presenter `lynki` comme si c'etait deja `dorevia-saas-vault`.
- Ne pas deduire automatiquement l'architecture cible a partir de l'organisation actuelle du depot.

### 2. Favoriser la reprise selective

- Identifier les briques par responsabilite.
- Documenter ce qui releve de la future surface SaaS Lynki.
- Documenter ce qui releve du futur noyau Vault.
- Laisser dans `lynki` ce qui est encore hybride, transitoire, experimental ou mal decoupe.

### 3. Eviter les mouvements destructifs

- Pas de migration implicite par renommage massif.
- Pas de copie aveugle de dossiers entiers vers les nouveaux repos.
- Pas de refactor brutal du depot historique pour "simuler" la cible.

### 4. Odoo CE comme source privilegiee, pas comme centre unique

- Odoo CE reste la source ERP privilegiee au depart.
- Cela ne justifie pas de modeler automatiquement les repos de refondation comme de simples extensions Odoo.
- Les dimensions produit, confiance, identite et tenancy doivent etre pensees au bon niveau de responsabilite.

## Ce qu'un agent doit faire ici

Avant toute proposition importante:

1. verifier si le sujet concerne `lynki`, `dorevia-saas-lynki` ou `dorevia-saas-vault`
2. expliciter si le travail est documentaire, preparatoire ou effectivement implementatif
3. privilegier une methode de migration progressive et non destructive
4. ne deplacer aucun code sans demande explicite

## Documentation associee

- [Guide de migration](/Users/doreviateam/lynki/docs/migration/README.md)
- [ADR frontiere Lynki / Vault](/Users/doreviateam/lynki/docs/adr/ADR-001-frontiere-lynki-vault.md)

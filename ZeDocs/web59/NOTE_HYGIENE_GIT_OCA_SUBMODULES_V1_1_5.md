# V1.1-5 — Hygiène Git OCA (submodules)

Date: 24 mars 2026

## Constat

Le dépôt principal contient des entrées Git de type `gitlink` (mode `160000`) pour:

- `sources/oca/account-analytic`
- `sources/oca/dms`
- `sources/oca/stock-logistics-barcode`

Les répertoires existent localement avec leur propre `.git`, mais le dépôt principal ne contenait pas de fichier `.gitmodules`.

Conséquence: les commandes liées aux submodules pouvaient échouer avec un message de mapping manquant.

## Décision

Conserver ces 3 dépendances OCA en **submodules explicites**.

## Action réalisée

Ajout de `.gitmodules` avec les URLs d'origine:

- `https://github.com/OCA/account-analytic.git`
- `https://github.com/OCA/dms.git`
- `https://github.com/OCA/stock-logistics-barcode.git`

## Vérification

- Les SHA `gitlink` indexés correspondent aux `HEAD` locaux des 3 dépôts imbriqués.
- L'état devient explicite et reproductible pour les opérations Git/release.

## Règle de suite

- Toute mise à jour de ces composants doit passer par un update du commit submodule (gitlink), pas par copie ad-hoc.
- En cas d'ajout d'un nouveau dépôt imbriqué, ajouter son entrée dans `.gitmodules` dans la même passe.

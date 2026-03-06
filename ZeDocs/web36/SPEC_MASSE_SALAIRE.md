# SPEC --- Intégration Masse Salariale (5 SMIC) --- MVP Gouvernance

Date : 2026-03-03\
Version : v1.0\
Statut : P0 --- Démo & Gouvernance\
ERP cible : Odoo\
Impact Vault : Aucun changement d'architecture

------------------------------------------------------------------------

## 1. Objectif

Intégrer 5 salaires au SMIC (Janvier, Février, Mars 2026) afin de
permettre le calcul d'un indicateur de couverture salariale dans le
cockpit Linky.

Cette spécification ne couvre pas la gestion RH ni les bulletins de
paie.

------------------------------------------------------------------------

## 2. Hypothèses financières

Hypothèse de travail :

-   SMIC brut mensuel ≈ 1 770 €
-   Coût employeur estimé ≈ 2 150 €
-   5 salariés

Masse salariale mensuelle estimée :

2 150 € × 5 = 10 750 €

Répartition simplifiée pour écriture comptable :

-   641 --- Salaires : 8 850 €
-   645 --- Charges sociales : 1 900 € Total : 10 750 €

------------------------------------------------------------------------

## 3. Périmètre temporel

Mois concernés : - Janvier 2026 - Février 2026 - Mars 2026

------------------------------------------------------------------------

## 4. Procédure ERP (Odoo)

### 4.1 Écritures d'Opérations Diverses

Pour chaque mois :

Journal : Opérations diverses\
Date : fin de mois

Écriture :

Débit : - 641 --- Salaires : 8 850 € - 645 --- Charges sociales : 1 900
€

Crédit : - 421 --- Personnel : 7 000 € - 431 --- URSSAF : 3 750 €

Condition : Débit = Crédit = 10 750 €

------------------------------------------------------------------------

### 4.2 Paiements banque

Pour chaque mois :

-   Paiement du compte 421 → Banque
-   Paiement du compte 431 → Banque

Résultat attendu : - Diminution du solde bancaire - Paiements capturés
par Vault - Impact visible sur Position validée

Total paiements sur 3 mois : 32 250 €

------------------------------------------------------------------------

## 5. Calcul Cockpit (Linky)

### 5.1 Masse salariale moyenne

Moyenne des comptes 641 + 645 sur Janvier, Février, Mars :

(10 750 + 10 750 + 10 750) / 3 = 10 750 €

------------------------------------------------------------------------

### 5.2 Indicateur Couverture Salariale

Couverture (mois) =

Position validée (Vault) ÷ 10 750 €

Exemple :

Position validée : 31 800 € Couverture : 2,95 mois

------------------------------------------------------------------------

## 6. Contraintes d'architecture

-   Aucune modification Vault
-   Aucun nouveau schéma
-   Aucun nouveau endpoint
-   Calcul effectué côté Linky
-   Données source exclusivement issues de l'ERP et paiements banque

------------------------------------------------------------------------

## 7. Definition of Done

✔ 3 OD créées (Jan--Mar 2026)\
✔ 6 paiements banque enregistrés\
✔ Paiements visibles dans Vault\
✔ Position validée impactée\
✔ Indicateur de couverture calculable

------------------------------------------------------------------------

## 8. Conclusion

Cette intégration permet de relier :

Position validée (preuve financière) → Responsabilité employeur (masse
salariale)

Sans complexifier l'architecture ni introduire de module RH.

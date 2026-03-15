# Ticket Scrum — Intégration des OD de paie dans le calcul EBE

**ID proposé :** LINKY-EBE-OD-01
**Titre :** Intégrer les OD de paie dans le calcul EBE et corriger le message fonctionnel associé
**Type :** User Story / Correction fonctionnelle
**Priorité :** Haute
**Produit :** Dorevia Linky / Vault
**Périmètre :** Calcul EBE, mapping comptable, microcopy UI

---

## 1. Contexte

Dans le modèle comptable réel de La Platine, la paie n’est pas produite via un module Payroll dédié ni via des bulletins de paie intégrés au Vault.
Elle est comptabilisée par **OD de paie** dans Odoo.

Les écritures observées montrent notamment :

* compte **641100 Salaires et appointements** au débit
* compte **645100 Cotisations à l’URSSAF** au débit
* comptes **421*** et **431*** en contrepartie au crédit

Exemples visibles sur les OD :

* **31/01/2026** : charge de personnel = **10 750,00 €**
* **28/02/2026** : charge de personnel = **10 750,00 €**

Soit un cumul théorique **YTD 2026 au 28/02 = 21 500,00 €** de charges de personnel.

---

## 2. Problème

La tuile **EBE** n’affiche pas de montant.
Dans le détail, l’interface indique un message de type :

> **Aucun bulletin dans le Vault**

Ce message n’est pas adapté au modèle métier réel.

Le problème n’est pas une absence de paie dans Odoo, mais le fait que le moteur EBE **ne prend pas encore en compte les charges de personnel saisies en OD comptables**.

---

## 3. Hypothèse de cause

Le moteur EBE semble aujourd’hui dépendre d’une source de type :

* bulletin de paie
* ou événement payroll dédié

alors que, dans ce cas d’usage, la source disponible est :

* **écriture comptable OD de paie**

Il manque donc un **mapping comptable explicite** permettant d’alimenter la composante “charges de personnel” de l’EBE à partir des écritures générales.

---

## 4. Objectif

Permettre au moteur EBE d’intégrer les **charges de personnel issues des OD comptables**, sans dépendre exclusivement d’un module Payroll ou d’un bulletin scellé.

---

## 5. Règles fonctionnelles attendues

### 5.1 Comptes à intégrer

Doivent être pris en compte dans la composante **charges de personnel EBE** :

* **641*** : salaires et appointements
* **645*** : cotisations sociales patronales / charges sociales

### 5.2 Comptes à exclure

Ne doivent **pas** être comptabilisés comme charges EBE :

* **421*** : personnel – rémunérations dues
* **431*** : sécurité sociale
* plus généralement les comptes de **contrepartie de bilan / dettes sociales**

### 5.3 Sens comptable attendu

Pour les comptes de charges retenus :

* prendre les mouvements **au débit**
* neutraliser les cas anormaux ou inversés selon la règle comptable retenue
* éviter tout double comptage si une écriture d’ajustement ou d’extourne existe

### 5.4 Période de rattachement

Les charges doivent être rattachées selon la **date comptable de l’écriture** utilisée par les autres agrégats Linky.

### 5.5 Résultat métier attendu

Si des OD de paie existent sur la période, la composante **charges de personnel** doit être alimentée et contribuer au calcul de l’EBE.

---

## 6. Conséquence UI / microcopy

### 6.1 Message actuel à corriger

Le message :

> **Aucun bulletin dans le Vault**

est trompeur lorsque la paie est saisie en OD.

### 6.2 Message temporaire recommandé

Tant que l’intégration n’est pas active, afficher plutôt :

> **Charges de personnel présentes en OD comptables, non encore intégrées au calcul EBE**

### 6.3 Message après intégration

Une fois l’intégration active, ne plus afficher de bloc d’alerte sur l’absence de bulletins si les OD comptables suffisent à calculer la composante.

---

## 7. Exemple de calcul attendu

À partir des OD montrées :

### Janvier 2026

* 641100 = **8 850,00 €**
* 645100 = **1 900,00 €**
* charges de personnel janvier = **10 750,00 €**

### Février 2026

* 641100 = **8 850,00 €**
* 645100 = **1 900,00 €**
* charges de personnel février = **10 750,00 €**

### Cumul exercice à date au 28/02/2026

* charges de personnel cumulées = **21 500,00 €**

Si la marge brute affichée est **55 260,02 €**, alors un **EBE partiel après paie** pourrait devenir :

**55 260,02 € − 21 500,00 € = 33 760,02 €**

Sous réserve des autres composantes encore incomplètes.

---

## 8. Critères d’acceptation

### AC1 — Détection comptable

Étant donné une OD contenant des lignes **641*** et **645***,
quand le moteur calcule l’EBE sur la période,
alors ces montants sont pris en compte comme **charges de personnel**.

### AC2 — Exclusion des contreparties

Étant donné une OD de paie contenant aussi des lignes **421*** et **431***,
quand le moteur calcule l’EBE,
alors ces lignes ne sont **pas** ajoutées aux charges EBE.

### AC3 — Cumul période

Étant donné plusieurs OD de paie sur plusieurs mois,
quand l’utilisateur consulte “Exercice à date”,
alors les charges de personnel sont **cumulées correctement** sur la période sélectionnée.

### AC4 — Affichage EBE

Étant donné que toutes les composantes minimales requises sont présentes,
quand l’utilisateur ouvre la card EBE,
alors la tuile affiche un **montant** et non `—`.

### AC5 — Message exact

Étant donné que la paie existe en OD mais n’est pas encore intégrée,
quand l’utilisateur ouvre le détail EBE,
alors l’interface n’affiche **pas** “Aucun bulletin dans le Vault”,
mais un message adapté au modèle comptable réel.

### AC6 — Pas de régression

Les cas où la paie provient d’une source payroll dédiée continuent de fonctionner sans régression.

---

## 9. Notes d’implémentation proposées

### Backend / Vault

* ajouter un mapping comptable “charges de personnel” basé sur les comptes **641*** et **645*** ;
* rattacher ce mapping à la composante EBE ;
* prévoir un mécanisme clair d’extourne / annulation / correction.

### Front / Linky

* corriger la microcopy du bloc “composantes manquantes” ;
* distinguer si besoin :

  * **EBE complet**
  * **EBE partiel**
  * **EBE indisponible**

### Observabilité

* journaliser le montant détecté par période pour la composante paie ;
* rendre visible la source : **OD comptable**.

---

## 10. Définition of Done

Le ticket est terminé lorsque :

* le moteur EBE prend en compte les **OD de paie** ;
* les comptes **641*** et **645*** sont correctement intégrés ;
* les comptes **421*** et **431*** sont exclus ;
* la microcopy erronée sur les bulletins est corrigée ;
* un test sur le cas La Platine permet de retrouver **21 500,00 €** de charges de personnel cumulées au 28/02/2026 ;
* la tuile EBE reflète un comportement cohérent avec les données présentes.

---

## 11. Version backlog ultra courte

**Intégrer la paie saisie par OD dans le calcul EBE.**
Le moteur doit reconnaître les comptes **641***/**645*** comme charges de personnel, exclure les comptes de contrepartie (**421***/**431***), et remplacer le message “Aucun bulletin dans le Vault”, non adapté au modèle comptable réel.

---

## 12. Clôture Lot 2 (2026-03-15)

**Lot 2 (Backend Vault + Front Linky)** : **clos le 2026-03-15.**

Livré, déployé et validé sur le périmètre OD La Platine. Recette v1.0 = flux de paie par OD comptables ; module Paie à installer ultérieurement en ERP, scénarios source payslip N/A hors périmètre. Références : RAPPORT_AVANCEMENT_EBE_OD_PAYROLL_2026-03-15.md, RESULTATS_RECETTE_EBE_OD_PAYROLL_2026-03-15.md, SPEC_RECETTE_EBE_OD_PAYROLL_BACKEND_FRONT_v1.0.md.

---

Faire la **version spec normative v1.0 en markdown propre**, avec ton formalisme habituel Dorevia.

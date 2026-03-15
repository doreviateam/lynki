# SPEC_BACKEND_VAULT_EBE_OD_PAYROLL_v1.0

**Document :** `SPEC_BACKEND_VAULT_EBE_OD_PAYROLL_v1.0.md`  
**Répertoire cible :** `ZeDocs/web50/`  
**Date :** 2026-03-15  
**Produit :** Dorevia Vault / Linky  
**Statut :** Spécification backend normative  
**Objet :** Intégration des OD de paie dans la chaîne d’agrégation EBE

---

## 1. Objectif

Étendre le backend Vault afin que la composante **charges de personnel** utilisée par l’EBE ne dépende plus exclusivement de la source **payroll / hr.payslip**, mais puisse également être alimentée par les **OD comptables de paie** issues d’Odoo.

Le système doit reconnaître les charges de personnel à partir des écritures comptables pertinentes, en particulier :

- **641*** : salaires et appointements
- **645*** : charges sociales

et exclure les comptes de contrepartie de bilan, notamment :

- **421*** : personnel – rémunérations dues
- **431*** : sécurité sociale

---

## 2. Contexte

L’architecture actuelle EBE repose sur la source :

- `odoo_model = "hr.payslip"`
- événement canonique : `payroll.charge.posted`

Quand aucun bulletin n’est disponible, le frontend Linky affiche un état de type :

- EBE proxy
- message : *« Aucun bulletin dans le Vault »*

Or, pour le tenant **La Platine**, la paie est saisie en **OD comptables** dans Odoo, et non via le module Payroll.

Des écritures existent déjà avec :

- **641100** Salaires et appointements
- **645100** Cotisations à l’URSSAF
- contreparties **421000** / **431000**

Exemple confirmé sur `laplatine2026` :

- **31/01/2026** : 10 750,00 €
- **28/02/2026** : 10 750,00 €
- **Cumul YTD au 28/02/2026** : **21 500,00 €**

---

## 3. Problème à résoudre

Le backend Vault ne lit aujourd’hui **aucune OD comptable** pour alimenter la composante paie.

Conséquences :

1. les charges de personnel réellement présentes dans Odoo ne remontent pas dans l’EBE ;
2. l’EBE reste partiel / proxy ;
3. le message UI associé devient trompeur dans un contexte de paie saisie en OD.

Le correctif attendu est donc backend avant tout : **rendre l’agrégation payroll capable de consommer une source comptable OD**.

---

## 4. Périmètre

### 4.1 Inclus

- lecture des OD comptables pertinentes pour les charges de personnel ;
- agrégation des comptes **641*** et **645*** ;
- exclusion des comptes de contrepartie **421*** et **431*** ;
- rattachement des montants par **date comptable** ;
- enrichissement de l’API Vault utilisée par Linky ;
- mise à disposition d’un indicateur de source pour le frontend.

### 4.2 Exclus

- refonte générale du moteur EBE ;
- traitement complet de toutes les charges externes de l’EBE ;
- écriture d’un moteur analytique multi-plan comptable ;
- ingestion d’autres systèmes de paie externes ;
- modification du modèle Odoo de saisie des OD.

---

## 5. Principe métier

### 5.1 Règle métier centrale

Une OD comptable de paie doit être interprétée comme une source valide de **charges de personnel** pour l’EBE si elle contient des lignes de charges sur des comptes commençant par :

- `641`
- `645`

Ces montants doivent alimenter la même composante métier que celle aujourd’hui alimentée par `hr.payslip`.

### 5.2 Règle d’exclusion

Les comptes de passif / contrepartie ne doivent pas être interprétés comme charges EBE, même s’ils sont présents dans la même OD.

En particulier :

- `421*`
- `431*`

ne participent jamais au calcul des charges de personnel EBE.

---

## 6. Modèle de calcul attendu

### 6.1 Source comptable OD

Pour une période donnée, la charge de personnel issue des OD correspond à la somme **nette signée** des mouvements éligibles sur :

- `641*`
- `645*`

rattachés à la **date comptable** de l’écriture.

### 6.2 Sens comptable

Règle de normalisation :

- un **débit** sur `641*` ou `645*` augmente la charge ;
- un **crédit** sur `641*` ou `645*` diminue la charge.

Formule ligne par ligne :

```text
net_signed_amount = debit - credit
````

Formule agrégée sur la période :

```text
personnel_charges_od = SUM(debit - credit) sur comptes 641* et 645*
```

Cette règle permet de gérer naturellement :

* corrections ;
* annulations ;
* extournes ;
* écritures inversées.

### 6.3 Extournes

Aucune logique spéciale d’extourne ne doit être déduite uniquement à partir du journal ou d’un libellé.

Le backend doit privilégier une règle robuste et simple :

* **tout mouvement éligible est pris en net signé**
* donc une extourne au crédit vient automatiquement réduire la charge

### 6.4 Période de rattachement

Les montants doivent être rattachés à la **date comptable** (`date`) de l’écriture Odoo, selon la même convention que les autres agrégats Linky.

### 6.5 Grain d’agrégation

Le grain minimal exploitable doit permettre :

* agrégation totale période ;
* série temporelle par mois / semaine / jour selon besoins EBE evolution ;
* comptage des écritures contributives.

---

## 7. Stratégie de source

### 7.1 Sources possibles

Après implémentation, la composante charges de personnel pourra provenir de :

* `payslip`
* `od`
* éventuellement `mixed` à terme

### 7.2 Priorité de lecture

Pour cette v1.0, le backend doit éviter tout **double comptage** entre source payroll bulletin et source OD.

Règle retenue :

* si la source `payslip` est utilisée sur la période, elle reste prioritaire ;
* la source `od` ne doit pas s’ajouter par-dessus si elle couvre le même besoin métier sans mécanisme de réconciliation explicite.

### 7.3 Politique anti double comptage

Pour cette version, la règle la plus sûre est :

```text
Si payroll source = payslip disponible sur la période
→ utiliser payslip comme source de référence
→ ne pas additionner OD

Sinon
→ utiliser OD si des écritures 641*/645* existent
→ sinon source = none
```

### 7.4 Valeurs de source exposées

Le backend doit exposer un indicateur :

* `payroll_source = "payslip" | "od" | "none"`

Le mode `mixed` est volontairement hors périmètre v1.0.

---

## 8. Données backend à exploiter

### 8.1 Source Odoo attendue

Les OD de paie proviennent des écritures comptables Odoo, à partir des lignes d’écriture (`account.move.line` ou équivalent ingéré côté Vault selon l’architecture déjà en place).

### 8.2 Champs nécessaires

Au minimum, le backend doit pouvoir exploiter :

* identifiant d’écriture
* identifiant de ligne
* date comptable
* code compte
* débit
* crédit
* journal
* état comptabilisé
* tenant / société
* devise si applicable

### 8.3 Contrainte de statut

Seules les écritures **comptabilisées / postées** doivent être prises en compte.

Les brouillons ne doivent pas contribuer aux agrégats.

---

## 9. Contrat fonctionnel de l’agrégat payroll

### 9.1 Endpoint concerné

L’endpoint actuellement utilisé par Linky pour la paie doit être enrichi, sans casser l’usage existant :

```text
GET /ui/aggregations/payroll
```

### 9.2 Réponse attendue v1.0

Exemple de réponse cible :

```json
{
  "total": 21500.00,
  "currency": "EUR",
  "count": 2,
  "payroll_source": "od",
  "payroll_unavailable": false,
  "breakdown": {
    "accounts_641": 17700.00,
    "accounts_645": 3800.00
  },
  "period": {
    "from": "2026-01-01",
    "to": "2026-02-28"
  }
}
```

### 9.3 Compatibilité

Le backend doit préserver la compatibilité descendante avec les consommateurs existants :

* `total`
* `count`
* sémantique globale de la route

Les nouveaux champs peuvent être ajoutés sans rupture :

* `payroll_source`
* `payroll_unavailable`
* `breakdown`

---

## 10. Impact attendu sur EBE evolution

### 10.1 Endpoint concerné

Le calcul de la série EBE côté API / frontend consomme une composante payroll.
Après implémentation, cette composante doit refléter :

* la source `payslip` si disponible ;
* sinon la source `od` si disponible ;
* sinon indisponible.

### 10.2 Règle de calcul

La formule EBE existante reste inchangée :

```text
EBE = ventes - achats - charges_de_personnel
```

Seule la **source** de `charges_de_personnel` est enrichie.

### 10.3 Effet attendu sur La Platine

Sur la période YTD au 28/02/2026 :

* charges de personnel OD = **21 500,00 €**
* si marge brute = **55 260,02 €**
* alors EBE après paie = **33 760,02 €**

Sous réserve des autres composantes hors périmètre.

---

## 11. Règles de mapping comptable

### 11.1 Comptes inclus v1.0

Comptes commençant par :

* `641`
* `645`

### 11.2 Comptes exclus explicitement

Comptes commençant par :

* `421`
* `431`

### 11.3 Règle de robustesse

Même si `421*` et `431*` ne sont pas dans le périmètre des comptes inclus, ils sont explicitement listés comme exclus pour lever toute ambiguïté métier et documentaire.

### 11.4 Extensibilité

Le mapping devra être implémenté de manière extensible pour permettre l’ajout futur de comptes complémentaires si besoin, sans refonte complète.

Exemple souhaitable :

```text
include_prefixes = ["641", "645"]
exclude_prefixes = ["421", "431"]
```

---

## 12. Cas limites à gérer

### 12.1 Écriture mixte non standard

Si une OD contient à la fois des lignes éligibles et des lignes non éligibles, seules les lignes `641*` / `645*` sont prises.

### 12.2 Correction comptable

Si une correction passe par un crédit sur `641*` ou `645*`, elle réduit bien la charge par le calcul net signé.

### 12.3 Mois sans OD ni bulletin

Le backend doit retourner :

* `total = 0`
* `count = 0`
* `payroll_source = "none"`
* `payroll_unavailable = true`

### 12.4 Présence simultanée payslip + OD

Pour v1.0 :

* utiliser `payslip`
* ignorer `od` pour l’agrégat principal
* prévoir journalisation technique de ce cas pour observabilité

---

## 13. Observabilité et traçabilité

Le backend doit journaliser de manière exploitable :

* la source retenue : `payslip`, `od`, `none`
* le nombre d’écritures contributives
* le total 641
* le total 645
* la période agrégée
* le cas de coexistence `payslip + od` si rencontré

Objectif :

* faciliter le support ;
* expliquer les chiffres Linky ;
* simplifier les vérifications métier sur tenant.

---

## 14. Critères d’acceptation techniques

### AC1 — Détection OD

Étant donné une période contenant des écritures postées avec lignes `641*` et `645*`,
quand l’agrégat payroll est calculé,
alors le total inclut ces lignes en net signé.

### AC2 — Exclusion contreparties

Étant donné la présence simultanée de lignes `421*` et `431*`,
quand l’agrégat payroll est calculé,
alors ces lignes n’impactent pas le total charges de personnel.

### AC3 — Rattachement période

Étant donné deux OD de paie datées du 31/01/2026 et 28/02/2026,
quand l’utilisateur consulte la période du 01/01/2026 au 28/02/2026,
alors le total vaut **21 500,00 €** pour le tenant La Platine.

### AC4 — Source exposée

Étant donné une période sans payslip mais avec OD de paie,
quand le backend répond sur `/ui/aggregations/payroll`,
alors `payroll_source = "od"`.

### AC5 — Compatibilité payslip

Étant donné une période avec données `hr.payslip`,
quand l’agrégat payroll est calculé,
alors la logique existante continue de fonctionner sans régression.

### AC6 — Aucun double comptage

Étant donné une période où payslip et OD coexistent,
quand l’agrégat payroll est calculé en v1.0,
alors le total principal n’additionne pas les deux sources.

### AC7 — Indisponibilité explicite

Étant donné une période sans payslip ni OD de paie,
quand l’agrégat payroll est calculé,
alors `payroll_source = "none"` et `payroll_unavailable = true`.

---

## 15. Définition of Done

Le ticket backend est terminé lorsque :

* l’agrégat payroll sait consommer les OD comptables ;
* les comptes `641*` et `645*` sont pris en compte ;
* les comptes `421*` et `431*` sont exclus ;
* la règle de calcul en net signé est en place ;
* l’API `/ui/aggregations/payroll` expose `payroll_source` ;
* la chaîne EBE peut utiliser la source `od` en absence de `payslip` ;
* le cas La Platine retourne **21 500,00 €** au 28/02/2026 ;
* aucun double comptage n’est constaté quand une source payslip existe ;
* les logs techniques permettent d’expliquer la source et le total.

---

## 16. Recommandations d’implémentation

### 16.1 Côté Vault

Créer ou étendre une fonction d’agrégation dédiée à la composante paie capable de :

1. chercher d’abord la source `payslip` ;
2. sinon calculer la source `od` à partir des écritures comptables ;
3. retourner un objet d’agrégation unifié.

### 16.2 Architecture cible

Préférer une architecture en deux sous-agrégats :

* `PayrollFromPayslips(...)`
* `PayrollFromAccountingOD(...)`

puis un orchestrateur :

* `PayrollAggregation(...)`

Cela évite de mélanger les logiques et rend la stratégie de priorité explicite.

### 16.3 Frontend

Le frontend ne doit pas avoir à redeviner la source.
La logique de vérité doit venir du backend via `payroll_source`.

---

## 17. Hors périmètre explicite pour v1.0

Cette spécification ne couvre pas :

* le rapprochement intelligent payslip vs OD ;
* la fusion de sources multiples ;
* l’analytique par salarié ;
* l’identification fine de natures de paie hors 641/645 ;
* les imports de paie tiers ;
* l’explication détaillée DIVA sur les composantes paie.

---

## 18. Résumé exécutable

Pour v1.0, le backend Vault doit :

* conserver la source `payslip` existante ;
* ajouter une source de repli `od` basée sur les comptes `641*` et `645*` ;
* exclure `421*` et `431*` ;
* calculer les montants en **net signé** (`debit - credit`) ;
* exposer `payroll_source = "payslip" | "od" | "none"` ;
* alimenter l’EBE avec cette composante sans double comptage.

---

**Fait** — Voir PLAN_IMPLEMENTATION_VAULT_EBE_OD_PAYROLL_v1.0.md (implémentation 2026-03-15 ; validé sur périmètre OD La Platine, recette continue ouverte).

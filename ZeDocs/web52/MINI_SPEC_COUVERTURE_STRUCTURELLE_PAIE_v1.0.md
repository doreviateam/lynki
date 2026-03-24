

# MINI_SPEC_COUVERTURE_STRUCTURELLE_PAIE_v1.0

**Date :** 15 mars 2026
**Produit :** Dorevia Linky
**Périmètre :** Card Trésorerie
**Statut :** Règle métier de référence

## 1. Objectif

Définir la règle métier de **couverture structurelle** pour la card Trésorerie, en précisant le traitement des **OD de salaire**.

## 2. Principe métier

La **couverture structurelle** mesure la part de la trésorerie qui peut déjà être **expliquée par des charges structurelles reconnues**, même si ces charges ne sont pas encore validées par un flux bancaire rapproché.

Elle ne mesure donc pas la preuve cash stricte.
Elle mesure un **niveau d’explicabilité économique structurelle**.

## 3. Décision normative

### 3.1 Règle principale

**Toute charge structurelle constatée en comptabilité doit contribuer à la couverture structurelle dès son enregistrement.**

### 3.2 Cas explicite de la paie

Les écritures de **paie constatée** doivent être reconnues comme **charges structurelles**.

En conséquence :

* une **OD de salaire** doit alimenter la couverture structurelle ;
* cette contribution existe **même si le paiement bancaire du salaire n’a pas encore été observé** ;
* l’absence de flux bancaire ne doit pas annuler la contribution structurelle de la paie.

## 4. Distinction avec la couverture probante

### 4.1 Couverture structurelle

Répond à la question :

> “Une partie de la trésorerie est-elle déjà explicable par des charges normales, récurrentes et structurelles de l’activité ?”

### 4.2 Couverture probante

Répond à la question :

> “Cette lecture est-elle validée par des preuves cash ou des rapprochements forts ?”

## 5. Typologie des charges structurelles candidates

Peuvent contribuer à la couverture structurelle si elles sont reconnues et qualifiées :

* paie ;
* charges sociales ;
* loyer ;
* abonnements critiques ;
* remboursements récurrents contractualisés ;
* autres charges fixes récurrentes validées par la règle métier.

## 6. Règles d’alimentation

### 6.1 Sources acceptées

La couverture structurelle peut être alimentée par :

* écritures comptables constatées ;
* OD qualifiées ;
* événements Vault catégorisés comme charges structurelles.

### 6.2 Condition minimale

Pour qu’un événement contribue à la couverture structurelle, il doit être :

* daté ;
* rattaché à la période de lecture ;
* reconnu comme appartenant à une **catégorie structurelle autorisée**.

### 6.3 Indépendance vis-à-vis du cash

La contribution structurelle est **indépendante** de :

* l’existence d’un paiement bancaire déjà rapproché ;
* l’état de validation probante ;
* la présence d’un justificatif cash complet.

## 7. Règle spécifique paie

### 7.1 Inclusion

Les OD de salaire doivent être incluses dans la couverture structurelle.

### 7.2 Effet attendu

Dès qu’une OD de salaire existe sur la période :

* la couverture structurelle ne doit plus rester à zéro ;
* elle doit augmenter selon le moteur de calcul retenu ;
* la card Trésorerie doit refléter cette contribution.

### 7.3 Non-condition

Le paiement effectif en banque n’est **pas requis** pour cette contribution.

## 8. Cas à exclure

Ne doivent pas contribuer à la couverture structurelle :

* écritures non qualifiées ;
* OD techniques sans signification économique métier ;
* écritures exceptionnelles ou non récurrentes non classées structurelles ;
* ajustements purement comptables sans portée économique sur le cycle courant.

## 9. Conséquence UI / narration

Si des OD de salaire sont présentes et reconnues :

* la mention **“Couverture structurelle : Non disponible”** ou **0** devient incorrecte ;
* la card doit afficher une valeur **strictement positive** ;
* la narration Diva peut indiquer que la trésorerie est **partiellement expliquée par des charges structurelles constatées**, notamment la paie.

## 10. Exemple métier

### Cas

* OD de salaire comptabilisée sur la période ;
* paiement bancaire non encore observé ;
* couverture probante encore partielle.

### Résultat attendu

* **couverture structurelle > 0**
* **couverture probante** peut rester faible
* la card doit distinguer :

  * ce qui est **structurellement explicable**
  * de ce qui est **cash-probant**

## 11. Critères d’acceptation

### AC1

Si une OD de salaire qualifiée existe sur la période, la couverture structurelle doit être supérieure à zéro.

### AC2

La couverture structurelle ne doit pas dépendre de la présence d’un paiement bancaire rapproché.

### AC3

La couverture probante peut rester inchangée même si la couverture structurelle augmente.

### AC4

L’interface ne doit pas afficher “Non disponible” pour la couverture structurelle lorsqu’au moins une charge structurelle reconnue est présente.

### AC5

La présence d’une charge structurelle reconnue doit être **distinguée** du montant qui la compose ; l’API ne doit pas assimiler implicitement « couverture structurelle » et « montant de paie ». Le montant est la base explicative de la couverture, il n’épuise pas la notion.

### AC6

L’interface doit permettre d’identifier au moins la **catégorie** structurelle ayant déclenché la disponibilité de la couverture (ex. paie).

## 12. Formule d’intention produit

> **La paie est une charge structurelle. Dès qu’elle est constatée, elle contribue à la couverture structurelle, même avant observation du paiement bancaire associé.**

---
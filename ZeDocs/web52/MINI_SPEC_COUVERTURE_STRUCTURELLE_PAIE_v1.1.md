# MINI_SPEC_COUVERTURE_STRUCTURELLE_PAIE_v1.1

**Date :** 15 mars 2026  
**Produit :** Dorevia Linky  
**Périmètre :** Card Trésorerie  
**Statut :** Règle métier de référence (évolution v1.0 → indicateur %)

**Changement principal (v1.1) :** La couverture structurelle est affichée en **pourcentage** (x %), pas en binaire (« Présente » / « Non disponible »). Le montant des charges structurelles reste la base explicative ; le **ratio** devient l’indicateur de pilotage.

---

## 1. Objectif

Définir la règle métier de **couverture structurelle** pour la card Trésorerie : **montant** des charges structurelles constatées + **ratio** (part de la trésorerie de référence expliquée par ces charges).

---

## 2. Formule produit

### 2.1 Ratio de couverture structurelle

> **Couverture structurelle (%) = min(100, charges structurelles constatées / trésorerie de référence × 100)**

### 2.2 Trésorerie de référence

Sur cette card, la référence retenue est :

> **la trésorerie validée Vault** (`position.validated_balance`).

Donc :

> `structural_coverage_ratio = min(100, structural_charges_amount / treasury_validated_amount × 100)`

avec `treasury_validated_amount` = trésorerie validée Vault (positif pour le calcul).

### 2.3 Exemple

* Charges structurelles constatées = **21 500,00 €**
* Trésorerie validée Vault = **118 179,42 €**
* **Couverture structurelle ≈ 18,2 %**

---

## 3. Modèle API

### 3.1 Champs exposés

| Champ | Type | Rôle |
|-------|------|------|
| `structural_charges_amount` | number \| null | Montant des charges structurelles constatées (base explicative). |
| `structural_charges_breakdown` | objet | Détail par catégorie (ex. `{ "payroll": 21500 }`). |
| `structural_coverage_ratio` | number \| null | Ratio en % (0–100), valeur affichée pour « Couverture structurelle ». |

### 3.2 Champ optionnel / interne

* `structural_coverage_available` (booléen) peut rester **interne** ou **optionnel** pour la logique métier ; **il ne doit plus être la valeur affichée** en UI. L’affichage repose sur `structural_coverage_ratio`.

---

## 4. Règles d’affichage UI

Ligne **Couverture structurelle** :

* Si `structural_charges_amount > 0` et dénominateur (trésorerie validée) exploitable > 0 → afficher **x %** (ratio calculé, ex. **18,2 %**).
* Si `structural_charges_amount = 0` → afficher **0 %**.
* Si le dénominateur n’est pas exploitable (null, 0 ou absent) → afficher **—**.

On sort du binaire « Présente » / « Non disponible ».

---

## 5. Structure card (résumé)

* **Charges structurelles constatées** → **21 500,00 €** (montant)
* **Couverture structurelle** → **18,2 %** (ratio)
* **Couverture probante** → **25 %** (inchangé)
* **Position validée (mois)** → inchangé

---

## 6. Critères d’acceptation (mis à jour)

### AC1
Si des charges structurelles reconnues (ex. OD paie) existent sur la période, la couverture structurelle doit être **supérieure à zéro** (ratio > 0 ou au minimum montant > 0).

### AC2
La couverture structurelle ne doit pas dépendre de la présence d’un paiement bancaire rapproché.

### AC3
La couverture probante peut rester inchangée même si la couverture structurelle augmente.

### AC4
L’interface affiche un **pourcentage** (x % ou 0 %) pour la couverture structurelle lorsque le calcul est possible ; **—** uniquement si le dénominateur n’est pas exploitable.

### AC5
L’API distingue **montant** (`structural_charges_amount`) et **ratio** (`structural_coverage_ratio`) ; pas d’assimilation à un seul champ.

### AC6
L’interface permet d’identifier la **catégorie** structurelle (ex. paie) via tooltip ou libellé sur la ligne Charges structurelles constatées.

### AC7 (v1.1)
Le ratio est plafonné à 100 % : `structural_coverage_ratio = min(100, ratio_calculé)`.

---

## 7. Référence v1.0

Les §§ 1–3 (objectif, principe métier, décision normative), 4 (distinction couverture structurelle / probante), 5–8 (typologie, règles d’alimentation, paie, cas exclus) de la v1.0 restent inchangés. La v1.1 modifie l’**indicateur affiché** (passage au %) et le **modèle API** (ajout de `structural_coverage_ratio`).

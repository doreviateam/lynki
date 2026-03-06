# SPEC --- Carte « Trésorerie Validée » v4.0

**Date :** 25 February 2026 **Statut :** Référence officielle\
**Positionnement :** Mesure probante de la trésorerie bancaire\
**Modèle actuel :** Seules les lignes réconciliées sont vaultées

------------------------------------------------------------------------

## 1. Objectif

La carte « Trésorerie validée » mesure exclusivement la position
bancaire confirmée par rapprochement et scellée dans le Vault.

Elle distingue :

-   La position validée (Vault)
-   L'exposition non validée (ERP uniquement)
-   Le niveau de fiabilité bancaire
-   Le solde comptable ERP (comparatif)

------------------------------------------------------------------------

## 2. Hypothèse structurante

Dans le modèle actuel :

-   Seules les lignes **réconciliées** sont vaultées
-   Les lignes non réconciliées ne sont pas stockées dans le Vault
-   Le Vault représente uniquement la trésorerie confirmée par la banque

Conséquence :\
Le Vault ne contient que des flux validés.

------------------------------------------------------------------------

## 3. Modèle financier

### 3.1 Règles de signe

  Type           Signe
  -------------- -------
  Encaissement   \+
  Décaissement   −

Tous les montants doivent être stockés signés.

------------------------------------------------------------------------

## 4. Données exploitées

### 4.1 Données Vault

Source : événement `reconciliation.validated`

    validated_balance = SUM(signed_amount)

Définition :\
Somme des flux bancaires confirmés et scellés.

------------------------------------------------------------------------

### 4.2 Données ERP (Odoo)

    erp_balance = odoo.bank_account.balance

Définition :\
Solde bancaire comptable incluant lignes réconciliées et non
réconciliées.

⚠ Non scellé\
⚠ Affichage comparatif uniquement

------------------------------------------------------------------------

## 5. Indicateurs calculés

### 5.1 Trésorerie validée

    validated_balance

Position bancaire confirmée et scellée.

------------------------------------------------------------------------

### 5.2 Exposition non validée

    unvalidated_exposure = erp_balance - validated_balance

Montant présent dans l'ERP mais non confirmé par rapprochement bancaire.

------------------------------------------------------------------------

### 5.3 Fiabilité bancaire

    bank_reliability = ABS(validated_balance) / ABS(erp_balance)

Si `erp_balance = 0` → fiabilité = 100 %

Définition :\
Part de la position ERP réellement validée par la banque.

------------------------------------------------------------------------

## 6. Structure UI recommandée

### 💰 Trésorerie validée

Montant : `validated_balance`\
Sous-texte : Position confirmée et scellée

------------------------------------------------------------------------

### ⚠ Exposition non validée

Montant : `unvalidated_exposure`\
Sous-texte : Présente dans l'ERP mais non validée

------------------------------------------------------------------------

### 📊 Fiabilité bancaire

`bank_reliability %`\
Affichage en barre de progression

------------------------------------------------------------------------

### 🏦 Solde comptable ERP

`erp_balance`\
Sous-texte : Vision comptable non probante

------------------------------------------------------------------------

## 7. Règles métier

1.  Un flux ne peut être compté qu'une seule fois.
2.  Les montants doivent être stockés signés.
3.  Multi-comptes bancaires → agrégation par tenant.
4.  Toute annulation de rapprochement doit invalider le flux vaulté si
    applicable.

------------------------------------------------------------------------

## 8. Cas limites

### Aucun flux

-   validated_balance = 0
-   erp_balance = 0
-   fiabilité = 100 %

### Écart important

Si `ABS(unvalidated_exposure)` dépasse un seuil configurable → badge
d'alerte.

------------------------------------------------------------------------

## 9. Positionnement stratégique

Vault = vérité bancaire probante\
ERP = vision opérationnelle

La carte mesure :

-   Ce qui est confirmé
-   Ce qui reste exposé
-   Le niveau de confiance bancaire

# Dorevia Linky — Navigation principale
Version 1.0  
Statut : validée  
Objectif : structurer la navigation de Linky selon une logique **cognitive**, lisible et non trompeuse.

---

## 1. Principe directeur

> **La navigation n’est pas fonctionnelle, elle est cognitive.**

L’utilisateur ne navigue pas par fonctionnalités techniques,  
mais par **questions de pilotage**.

Chaque onglet doit répondre à une question simple, naturelle, et universelle pour un·e dirigeant·e ou un·e RAF.

---

## 2. Structure de navigation retenue

### 1️⃣ Tout  
**Question utilisateur :**  
> *« Donne-moi la photo complète sur la période. »*

**Contenu affiché :**
- Cash
- Business
- Taxes
- Notes de crédit
- Remboursements

**Rôle :**
- Vue de pilotage globale
- Vue de démonstration
- Lecture mensuelle ou hebdomadaire

👉 Vue par défaut.

---

### 2️⃣ Cash  
**Question utilisateur :**  
> *« Combien d’argent est réellement entré et sorti ? »*

**Inclure :**
- Encaissements
- Décaissements
- Remboursements clients
- Remboursements fournisseurs
- Flux Cash

**Exclure :**
- Notes de crédit
- Business HT
- Taxes non encaissées

**Définition :**  
Flux de trésorerie **réels**, basés sur des événements cash.

---

### 3️⃣ Business  
**Question utilisateur :**  
> *« Mon activité crée-t-elle de la valeur ? »*

**Inclure :**
- Ventes HT
- Achats HT
- Flux Business

**Exclure :**
- Taxes
- Remboursements
- Notes de crédit

**Définition :**  
Lecture de l’activité économique **avant corrections**.

---

### 4️⃣ Corrections  
**Question utilisateur :**  
> *« Qu’est-ce qui a modifié l’histoire ? »*

**Inclure :**
- Notes de crédit clients
- Notes de crédit fournisseurs
- Remboursements clients
- Remboursements fournisseurs

**Définition :**  
Événements correctifs **visibles, tracés, et non destructifs**.  
Aucune correction ne réécrit le passé : elle s’ajoute comme un événement.

---

## 3. Logique d’ordre des onglets

Ordre retenu :

1. Tout  
2. Cash  
3. Business  
4. Corrections  

**Justification cognitive :**
1. Vision globale
2. Survie (trésorerie)
3. Performance (activité)
4. Rigueur (corrections)

Cet ordre correspond à la lecture naturelle d’un·e dirigeant·e.

---

## 4. Règles de conception (non négociables)

- Aucun onglet ne doit masquer un autre
- Aucun chiffre n’annule un événement passé
- Les flux sont **additifs**, pas recomposés
- Cash ≠ Business ≠ Corrections
- Même à 0 €, une card reste visible (le silence est une information)

---

## 5. Objectif produit

Cette navigation permet :
- une lecture immédiate et honnête,
- une démonstration claire en rendez-vous,
- une auditabilité naturelle,
- une montée en charge sans ajouter d’onglets.

Dorevia Linky n’est pas un dashboard comptable,  
c’est une **grammaire de lecture de la réalité financière**.

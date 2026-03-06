# SPEC — Complétude avant affichage

**Version :** 1.0  
**Date :** 2026-03-03  
**Statut :** Projeté  
**Périmètre :** Linky (cockpit financier)  
**Persona cible :** CFO (ex. Véréna, La Platine)

---

## 1. Position produit

### 1.1 Contexte

Dans un système fondé sur des données probantes, les cartes ne doivent jamais précéder la complétude des preuves.

Les cartes ne sont pas des estimations.  
Elles sont la conséquence d’un socle validé.

### 1.2 Formulation synthétique

> **Dans Dorevia, les cartes financières ne sont calculées et affichées que lorsque la complétude des preuves pour le périmètre sélectionné est validée.**  
> **À défaut, le système indique clairement que la synchronisation est en cours.**

### 1.3 Point de vue persona (CFO)

*Je ne cherche pas une tendance. Je cherche une base de décision.*

*Je veux savoir une chose simple : est-ce que les chiffres que je vois représentent la réalité complète de ma période ?*

Si toutes les preuves ne sont pas remontées et scellées, les cartes ne reflètent pas la réalité — elles reflètent un état intermédiaire. En finance, un état intermédiaire peut conduire à une mauvaise décision.

---

## 2. Règle produit

| Élément | Définition |
|--------|------------|
| **Les cartes** | Conséquence — rendu des données |
| **Les preuves** | Condition — socle validé |
| **Invariant** | Sans complétude des preuves, il n’y a pas d’indicateur stratégique |

---

## 3. Définition de la complétude

### 3.1 Sources constitutives

La complétude est validée lorsque **toutes** les sources suivantes ont répondu pour le périmètre sélectionné (tenant, société, `date_debut`, `date_fin`) :

| Source | Endpoint Vault | Données |
|--------|----------------|---------|
| Ventes | `/ui/aggregations/sales` | factures clients (invoices_count) |
| Achats | `/ui/aggregations/purchases` | factures fournisseurs (invoices_count) |
| Encaissements | `/ui/aggregations/payments-in` | paiements entrants (payment_count) |
| Décaissements | `/ui/aggregations/payments-out` | paiements sortants (payment_count) |
| POS | `/ui/aggregations/pos-sessions` | sessions caisse (items) |

### 3.2 Critère de validation

```
sealed_count_complete = true
  ⟺
  sales OK ∧ purchases OK ∧ paymentsIn OK ∧ paymentsOut OK ∧ pos OK
```

Une source est « OK » si l’endpoint a répondu avec succès et que la structure attendue est présente (ex. `invoices_count` pour sales, `items` pour pos).

### 3.3 Référence technique actuelle

L’API `GET /api/dashboard-metrics` expose déjà :
- `sealed_count_complete` : boolean
- `sealed_count_sources` : `{ sales, purchases, paymentsIn, paymentsOut, pos }`

---

## 4. Comportement attendu

### 4.1 Complétude validée (`sealed_count_complete === true`)

| Élément | Comportement |
|---------|--------------|
| **Badge** | Affichage « X preuves scellées » (vert) |
| **Cartes** | Calcul et affichage des 8 KPIs (Trésorerie, Cash, Business, etc.) |
| **Grille** | Toutes les cartes accessibles |
| **DIVA** | Analyse disponible |

### 4.2 Complétude non validée (`sealed_count_complete === false`)

| Élément | Comportement |
|---------|--------------|
| **Badge** | Non affiché ou indicateur neutre « Synchronisation en cours » |
| **Cartes** | **Non affichées** — aucun KPI stratégique |
| **Zone principale** | Message explicite : « Synchronisation des preuves en cours… » |
| **DIVA** | Non déclenchée (pas de base complète) |

### 4.3 États intermédiaires

| Situation | Affichage |
|-----------|-----------|
| Chargement initial | « Synchronisation des preuves en cours… » |
| Retry en cours (après échec partiel) | « Synchronisation des preuves en cours… » (pas de compteur partiel) |
| Erreur irrécupérable (timeout après retries) | « Impossible de garantir la complétude des données. Réessayez plus tard. » |

---

## 5. Contraintes techniques

### 5.1 Budget temps

| Contrainte | Valeur | Justification |
|------------|--------|---------------|
| Complétude garantie | < 5 s | L’utilisateur ne doit pas rafraîchir manuellement |
| Retry backend | 2 tours | Tour 1 : 5 sources en parallèle ; Tour 2 : sources en échec uniquement |
| Retry frontend | 1 fois après 2 s | Si `sealed_count_complete === false` au premier fetch |

### 5.2 Antipatterns à éviter

- Indicateur qui évolue à chaque rafraîchissement
- Compteur dont la portée est incompréhensible (ex. « 143 preuves (partiel) » alors que le total attendu est 525)
- Carte affichée avec valeur « 100 % » alors que le socle n’est pas garanti
- Affichage de cartes avec données partielles

---

## 6. Interface utilisateur

### 6.1 État « Synchronisation en cours »

- Texte : « Synchronisation des preuves en cours… »
- Ton neutre, pas d’alarme
- Optionnel : indicateur de chargement (spinner discret)
- **Aucun chiffre** (pas de `sealed_count` partiel, pas de pourcentage)

### 6.2 Transition vers affichage des cartes

- Dès que `sealed_count_complete === true`, affichage immédiat des cartes
- Pas de délai artificiel
- Le badge « X preuves scellées » peut apparaître en même temps que les cartes

### 6.3 Erreur durable

- Si après retries (backend + frontend) la complétude n’est toujours pas atteinte :
  - Message : « Impossible de garantir la complétude des données. Réessayez plus tard. »
  - Bouton « Réessayer » pour relancer le fetch

---

## 7. Compatibilité avec les specs existantes

### 7.1 Carte Paiements (SPEC_CARTE_PAIEMENTS)

La Carte Paiements a son propre contrôle de complétude (ERP vs Vault).  
**Hiérarchie :** La présente spec (complétude globale des 5 sources) est un **préalable**. Si `sealed_count_complete === false`, aucune carte — y compris la Carte Paiements — n’est affichée. Si `sealed_count_complete === true`, la Carte Paiements applique ensuite ses règles propres (§3.2 de sa spec).

### 7.2 Autres cartes

Trésorerie, Cash, Business, Taxes, Notes de crédit, Remboursements, POS, Z de caisse : toutes soumises à la règle « complétude avant affichage ».

---

## 8. Résumé exécutif

| Question | Réponse |
|----------|---------|
| **Quand afficher les cartes ?** | Uniquement lorsque `sealed_count_complete === true` |
| **Que montrer sinon ?** | « Synchronisation des preuves en cours… » |
| **Pourquoi ?** | Une vérité partielle, en finance, est une source d’erreur. La confiance du CFO repose sur la certitude explicite. |
| **Contrainte UX** | Complétude visée en < 5 s (retries backend + frontend) |

---

*Spec rédigée à partir de la position produit « Complétude avant affichage » — vision CFO (Véréna, La Platine).*

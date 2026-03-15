# SPEC — Priorisation clients / AR by Partner — Linky

**Version :** 1.0  
**Date :** 13 mars 2026  
**Produit :** Dorevia Linky  
**Périmètre :** Cockpit Business — bloc *Encours client / exposition par partenaire* et bloc *Clients à risque*  
**Statut :** Spécification fonctionnelle

---

## 1. Objectif

Améliorer le bloc **AR by Partner** dans Linky pour répondre à deux besoins métier :

1. **Distinguer le stock de retard actuel** du **comportement historique de paiement**.
2. **Hiérarchiser les tableaux par importance métier**, afin que le dirigeant / CFO comprenne immédiatement :
   - où se concentre l’exposition,
   - quels partenaires doivent être traités en priorité,
   - quels clients présentent un comportement structurellement dégradé.

Cette évolution doit transformer un affichage de type “liste comptable” en **outil de décision**.

---

## 2. Problème actuel

L’écran actuel expose correctement :
- l’**encours** par partenaire,
- le **montant en retard**,
- les **jours de retard** actuels,
- la **part relative** dans le total.

En revanche, il manque deux éléments structurants :

### 2.1. Absence de métrique de comportement historique
Le champ **“jours de retard”** décrit uniquement la situation du **stock ouvert** à date.  
Il ne permet pas de répondre à la question :

> “Ce client paie-t-il habituellement en retard, ou s’agit-il d’un incident ponctuel ?”

Il faut donc ajouter un **délai moyen de paiement** par partenaire.

### 2.2. Hiérarchisation encore trop tabulaire
Les tableaux sont aujourd’hui lisibles, mais pas suffisamment **priorisés**.  
Ils doivent exprimer une logique métier différente :

- **Tableau 1** : concentration de l’exposition
- **Tableau 2** : ordre de traitement / priorité de relance

---

## 3. Principes fonctionnels

Le bloc sera désormais structuré en **deux vues complémentaires** :

### Vue A — Exposition client
Question métier :
> “Où est concentré mon risque clients ?”

Cette vue doit prioriser les **gros enjeux économiques**.

### Vue B — Priorité de relance
Question métier :
> “Qui dois-je traiter en premier ?”

Cette vue doit prioriser les **cas les plus critiques pour le cash et la maîtrise du risque**.

---

## 4. Définitions métier

## 4.1. Encours
Montant total ouvert du partenaire à la date d’observation (`as_of`), qu’il soit échu ou non.

**Nom de métrique :** `open_amount`

---

## 4.2. En retard
Montant total ouvert du partenaire dont la date d’échéance est dépassée à `as_of`.

**Nom de métrique :** `overdue_amount`

---

## 4.3. Jours de retard actuel
Ancienneté du **plus ancien retard ouvert** du partenaire, exprimée en jours au-delà de la date d’échéance.

**Nom de métrique :** `overdue_max_days`

Règle :
- calculé uniquement sur les créances actuellement en retard ;
- si aucun retard, valeur nulle.

**Libellé UI recommandé :** `Pire retard`

> Remarque : le libellé “Jours de retard” peut être conservé, mais “Pire retard” raconte mieux la logique décisionnelle.

---

## 4.4. Retard moyen pondéré actuel
Moyenne pondérée des jours de retard sur les créances ouvertes en retard, pondérée par le montant.

**Nom de métrique :** `overdue_avg_days`

Règle :
- calculé uniquement sur les créances actuellement en retard ;
- pondération par montant ;
- si aucun retard, valeur nulle.

**Libellé UI recommandé :** `Retard moyen pondéré`

---

## 4.5. Délai moyen de paiement (nouvelle métrique)
Mesure historique du comportement de paiement du partenaire sur les **factures soldées**.

**Nom de métrique :** `payment_delay_avg_days`

### Définition
Pour chaque facture soldée sur la fenêtre d’observation :
- point de départ = **date d’échéance**
- point d’arrivée = **date de paiement complet**

Formule unitaire :
`payment_delay_days = payment_date - due_date`

Interprétation :
- `0 j` = payé à l’échéance
- `+12 j` = payé 12 jours après échéance
- `-3 j` = payé 3 jours avant échéance

### Fenêtre recommandée
- **12 derniers mois glissants** par défaut
- option de paramétrage futur : 6 mois / 12 mois

### Règles
- calculé uniquement sur les pièces totalement payées ;
- si la date d’échéance est absente, fallback possible sur la date de facture **uniquement si nécessaire et explicitement documenté** ;
- si historique insuffisant, valeur nulle.

### Garde-fou recommandé
Exiger un **minimum de 3 factures soldées** sur la fenêtre pour afficher une valeur fiable.  
Sinon :
- valeur technique = `null`
- rendu UI = `n.d.`

**Libellé UI recommandé :** `Délai moyen de paiement`

---

## 4.6. Part de l’exposition totale
Poids du partenaire dans l’exposition totale affichée.

**Nom de métrique :** `share_pct`

Formule :
`share_pct = open_amount / total_open_amount`

---

## 5. Structure cible de l’interface

## 5.1. Bloc 1 — Encours client / exposition par partenaire

### Finalité
Visualiser la concentration de l’encours et le niveau d’exposition par partenaire.

### Colonnes recommandées
1. `Partenaire`
2. `Encours`
3. `En retard`
4. `Délai moyen de paiement`
5. `Pire retard`
6. `%`

### Tri par défaut
Tri principal :
1. `open_amount` décroissant

Tri secondaire :
2. `overdue_amount` décroissant

Tri tertiaire :
3. `overdue_max_days` décroissant

### Justification
Cette vue doit d’abord raconter le **poids business**, pas la criticité fine.  
Un gros client légèrement en retard doit apparaître avant un tout petit client très en retard.

### Comportement attendu
- les partenaires sans retard restent visibles ;
- le champ `En retard` peut être affiché à `—` si nul ;
- le champ `Pire retard` peut être affiché à `—` si nul ;
- le champ `Délai moyen de paiement` peut être affiché à `n.d.` si insuffisance d’historique.

---

## 5.2. Bloc 2 — Clients à risque

### Finalité
Fournir un **ordre de traitement** clair pour les relances et l’attention dirigeante.

### Colonnes recommandées
1. `Rang`
2. `Partenaire`
3. `En retard`
4. `Délai moyen de paiement`
5. `Pire retard`
6. `Priorité`
7. `%`

> Variante légère acceptable :
> supprimer `Rang` ou `%` si la densité visuelle devient excessive.

### Population affichée
Uniquement les partenaires avec :
- `overdue_amount > 0`

### Tri par défaut
Tri principal :
1. `priority_score` décroissant

Tri secondaire :
2. `overdue_amount` décroissant

Tri tertiaire :
3. `overdue_max_days` décroissant

Tri quaternaire :
4. `payment_delay_avg_days` décroissant

### Justification
Cette vue ne doit pas simplement refléter le montant ou le délai, mais une **synthèse de criticité métier**.

---

## 6. Score de priorité de relance

## 6.1. Objectif
Produire une lecture immédiatement actionnable :
- **Critique**
- **Élevée**
- **Moyenne**
- **Faible**

## 6.2. Inputs du score
Le score doit combiner :
- `overdue_amount`
- `overdue_max_days`
- `payment_delay_avg_days`

## 6.3. Logique recommandée
Version initiale simple, robuste et lisible.

### Sous-score montant en retard
- `0 point` : `< 500 €`
- `1 point` : `500 € à < 2 000 €`
- `2 points` : `2 000 € à < 10 000 €`
- `3 points` : `>= 10 000 €`

### Sous-score ancienneté du retard actuel
- `0 point` : `< 15 j`
- `1 point` : `15 j à < 30 j`
- `2 points` : `30 j à < 60 j`
- `3 points` : `>= 60 j`

### Sous-score comportement historique
Basé sur `payment_delay_avg_days` :
- `0 point` : `<= 0 j`
- `1 point` : `> 0 j à <= 15 j`
- `2 points` : `> 15 j à <= 30 j`
- `3 points` : `> 30 j`

Si `payment_delay_avg_days` est indisponible :
- utiliser `1 point` par défaut **ou**
- exclure le composant et recalculer sur les dimensions disponibles.

### Score final
`priority_score = amount_score + overdue_score + history_score`

Amplitude cible :
- min = 0
- max = 9

## 6.4. Mapping score -> priorité
- `0 à 2` → `Faible`
- `3 à 4` → `Moyenne`
- `5 à 6` → `Élevée`
- `7 à 9` → `Critique`

## 6.5. Couleurs / rendu UI
- `Critique` → accent chaud fort
- `Élevée` → ambre
- `Moyenne` → ton intermédiaire
- `Faible` → ton discret

> Important : la couleur doit accompagner la lecture, pas la remplacer.

---

## 7. Résumé éditorial au-dessus du bloc “Clients à risque”

Le bloc “Clients à risque” doit être précédé d’un résumé court, orienté décision.

### Contenu recommandé
- `Montant en retard total`
- `Nombre de partenaires à risque`
- `Retard moyen pondéré`
- `Plus ancien retard`
- `Nb partenaires > 30 j`
- `Nb partenaires > 60 j`

### Exemple de rendu
- **Clients à risque :** `28 681,34 € · 4 partenaires`
- `Retard moyen pondéré : 31 j`
- `Plus ancien retard : 195 j`
- `1 partenaire > 60 j · 1 partenaire > 30 j`

Ce résumé doit rester compact et servir de **header analytique**.

---

## 8. Sémantique UI recommandée

Pour éviter toute confusion, distinguer explicitement :

### Situation ouverte actuelle
- `En retard`
- `Retard moyen pondéré`
- `Pire retard`

### Comportement historique
- `Délai moyen de paiement`

### Recommandation
Ne pas utiliser “jours de retard” pour parler à la fois :
- du retard courant,
- et du comportement historique.

Ces notions doivent rester séparées.

---

## 9. Contrat de données cible

## 9.1. Totaux
Le payload total peut être enrichi comme suit :

```json
{
  "totals": {
    "open_amount": 50200.89,
    "overdue_amount": 28681.34,
    "overdue_avg_days": 31,
    "overdue_max_days": 195,
    "partners_count": 5,
    "partners_overdue_count": 4,
    "partners_over_30d_count": 1,
    "partners_over_60d_count": 1
  }
}
```

## 9.2. Items partenaires
Chaque item partenaire doit pouvoir exposer :

```json
{
  "partner_id": 123,
  "partner_name": "EXPORT MY ISLAND",
  "open_amount": 19139.23,
  "overdue_amount": 12589.31,
  "overdue_avg_days": 195,
  "overdue_max_days": 195,
  "payment_delay_avg_days": 42,
  "share_pct": 38.1,
  "priority_score": 8,
  "priority_label": "Critique"
}
```

> Note : `payment_delay_avg_days`, `priority_score` et `priority_label` sont les ajouts principaux de cette spec.

---

## 10. Règles d’affichage

## 10.1. Valeurs nulles
- montant nul → `—` si la ligne reste affichée
- délai indisponible → `n.d.`
- retard indisponible → `—`

## 10.2. Arrondis
- montants : format monétaire standard UI
- jours : entier arrondi
- pourcentages : 1 décimale

## 10.3. Cohérence visuelle
- les montants à risque gardent un accent visuel fort ;
- la colonne de priorité ne doit pas surcharger ;
- éviter de dupliquer visuellement deux tableaux trop similaires.

---

## 11. Logique de lecture attendue

À l’issue de cette refonte, l’utilisateur doit pouvoir lire le bloc ainsi :

### Bloc haut
> “Mes plus gros clients exposés sont X, Y, Z.”

### Bloc bas
> “Le client à traiter d’abord est X, puis Y, puis Z.”

### Interprétation métier facilitée
Exemples de cas que l’écran doit permettre de distinguer :
- **gros client, retard encore jeune** ;
- **client moyen mais très ancien retard** ;
- **client petit mais structurellement mauvais payeur** ;
- **client exposé mais historiquement bon payeur**.

---

## 12. Priorité de mise en œuvre

## P0 — indispensable
- ajout `payment_delay_avg_days`
- ajout `priority_score`
- tri différencié entre les deux tableaux
- libellés UI clarifiés

## P1 — recommandé
- `priority_label`
- résumé enrichi du bloc “Clients à risque”
- gestion explicite du `n.d.` historique

## P2 — amélioration future
- tri utilisateur interactif
- filtres temporels (6 mois / 12 mois)
- badges contextuels type :
  - `retard ponctuel`
  - `retard structurel`
  - `forte exposition`

---

## 13. Décision produit

La vue **Encours client** doit rester une vue de **concentration du risque**.  
La vue **Clients à risque** doit devenir une vue de **priorisation d’action**.

Le cockpit Linky ne doit pas seulement montrer des chiffres :
il doit **ordonner l’attention dirigeante**.

---

## 14. Résumé exécutif

Cette spec introduit trois changements structurants :

1. **Ajout du délai moyen de paiement**
   - pour mesurer le comportement historique du partenaire.

2. **Tri métier différencié**
   - tableau d’exposition trié par poids économique,
   - tableau de risque trié par priorité d’action.

3. **Score de priorité**
   - pour transformer une liste comptable en file d’arbitrage.

Le résultat attendu est un bloc plus lisible, plus crédible CFO, et surtout plus utile en pilotage.

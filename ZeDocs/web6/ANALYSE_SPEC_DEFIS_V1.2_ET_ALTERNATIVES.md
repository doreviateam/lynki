# Analyse — SPEC Défis v1.2 et Alternatives

**Date :** 2026-01-21  
**Problème :** La SPEC v1.2 (layout 2 colonnes avec cartes intégrées) ne fonctionne pas visuellement avec l'implémentation

---

## 🔍 Problèmes identifiés

### 1. Layout 2 colonnes avec cartes intégrées
**Problème :**
- Les 4 cartes dans une colonne de 60-65% sont trop serrées
- Le message + cartes dans la même colonne crée une hiérarchie confuse
- La statistique à droite paraît déconnectée du contenu principal
- Difficile à lire et à suivre visuellement

### 2. Organisation du contenu
- Trop d'éléments dans la colonne gauche (message intro + message core + 4 cartes)
- Les cartes perdent en impact visuel quand elles sont trop petites
- La statistique isolée à droite ne crée pas de connexion avec les défis

---

## 💡 Alternatives proposées

### **Alternative 1 : Layout vertical classique (recommandée)**

**Structure :**
```
┌─────────────────────────────────────┐
│  [Header Centré]                    │
│  - Titre H2 uniquement              │
├─────────────────────────────────────┤
│  [Message développé - Pleine largeur]│
│  - Message intro                    │
│  - Message core                     │
├─────────────────────────────────────┤
│  [Statistique visuelle - Centrée]   │
│  - 68%                              │
├─────────────────────────────────────┤
│  [4 cartes - Grid 2×2]              │
│  ┌──────┬──────┐                    │
│  │ Carte│ Carte│                    │
│  │  1   │  2   │                    │
│  ├──────┼──────┤                    │
│  │ Carte│ Carte│                    │
│  │  3   │  4   │                    │
│  └──────┴──────┘                    │
├─────────────────────────────────────┤
│  [Footer Centré]                    │
│  - Texte transition                 │
│  - 2 CTAs                           │
└─────────────────────────────────────┘
```

**Avantages :**
- ✅ Hiérarchie claire et lisible
- ✅ Les cartes ont plus d'espace (pleine largeur)
- ✅ Message et statistique bien visibles
- ✅ Flow naturel de lecture (haut → bas)
- ✅ Plus facile à implémenter et maintenir

---

### **Alternative 2 : Layout avec statistique intégrée**

**Structure :**
```
┌─────────────────────────────────────┐
│  [Header Centré]                    │
├─────────────────────────────────────┤
│  [Message + Statistique - 2 colonnes]│
│  ┌──────────────┬─────────────────┐ │
│  │ Message      │ Statistique     │ │
│  │ intro/core   │ 68%             │ │
│  └──────────────┴─────────────────┘ │
├─────────────────────────────────────┤
│  [4 cartes - Grid 2×2 - Pleine lg] │
├─────────────────────────────────────┤
│  [Footer Centré]                    │
└─────────────────────────────────────┘
```

**Avantages :**
- ✅ Message et statistique côte à côte (connexion visuelle)
- ✅ Cartes en pleine largeur (plus d'impact)
- ✅ Layout équilibré

---

### **Alternative 3 : Layout avec statistique en header**

**Structure :**
```
┌─────────────────────────────────────┐
│  [Header avec statistique]          │
│  ┌──────────────┬─────────────────┐ │
│  │ Titre        │ Statistique 68% │ │
│  └──────────────┴─────────────────┘ │
├─────────────────────────────────────┤
│  [Message développé - Pleine largeur]│
├─────────────────────────────────────┤
│  [4 cartes - Grid 2×2]              │
├─────────────────────────────────────┤
│  [Footer Centré]                    │
└─────────────────────────────────────┘
```

**Avantages :**
- ✅ Statistique très visible dès le début
- ✅ Message et cartes bien séparés
- ✅ Hiérarchie claire

---

## 🎯 Recommandation

**Alternative 1 (Layout vertical classique)** est recommandée car :
1. ✅ Plus lisible et accessible
2. ✅ Hiérarchie visuelle claire
3. ✅ Les cartes ont plus d'impact en pleine largeur
4. ✅ Flow naturel de lecture
5. ✅ Plus facile à maintenir et responsive

---

## 📋 Prochaines étapes

1. Valider l'alternative choisie
2. Créer une nouvelle SPEC basée sur l'alternative
3. Implémenter le nouveau layout
4. Tester et ajuster

---

**Fin du document**

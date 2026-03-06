# 💡 Améliorations proposées — SPEC v1.3

**Date :** 2026-01-19  
**Basé sur :** Évaluation de la SPEC Harmonisation UX Cartes de Statuts v1.3

---

## 🎯 Améliorations de la spécification

### 1. Clarifier la règle des 2 lignes

**Actuel :**
> Maximum **2 lignes visibles**

**Proposé :**
> Maximum **2 lignes visibles** (subtitle + kicker combinés)  
> Chaque ligne ne doit pas dépasser **1 ligne de texte** (utilisation de `-webkit-line-clamp: 1`)

**Raison :** Plus précis, évite les ambiguïtés

---

### 2. Ajouter un exemple visuel des slots

**Ajout proposé :**

```
┌─────────────────────────┐
│  [Badge]        [Close] │  ← Z-index 2-3
│                         │
│      [Icône]            │  ← Slot A (56px fixe)
│                         │
│      [Titre]            │  ← Slot B (min 44px)
│                         │
│   [Subtitle ligne 1]    │  ← Slot C.1 (min 28px, line-clamp: 1)
│   [Kicker ligne 2]      │  ← Slot C.2 (min 28px, line-clamp: 1)
│                         │
│  ─────────────────────  │  ← Séparateur (visible si ouvert)
│                         │
│  [Détails techniques]   │  ← Slot D (hidden si fermé)
└─────────────────────────┘
```

---

### 3. Préciser la gestion de `hidden` avec les transitions

**Ajout proposé :**

> **Note technique :** L'attribut `hidden` doit être géré **après** la transition CSS pour éviter les conflits. Utiliser un `setTimeout` ou un `transitionend` event listener.

**Exemple de code :**

```javascript
// Ajouter hidden après la transition de fermeture
detail.addEventListener('transitionend', function(e) {
    if (e.propertyName === 'max-height' && !card.classList.contains('is-open')) {
        detail.setAttribute('hidden', true);
    }
});
```

---

### 4. Ajouter une section "États visuels"

**Ajout proposé :**

### États visuels

| État | Apparence | Comportement |
|------|-----------|--------------|
| **Fermé** | Fond gradient subtil, ombre légère | Clic = ouverture |
| **Hover (fermé)** | Élévation +6px, ombre renforcée, scale 1.01 | Badge rotate 5deg, icône scale 1.1 |
| **Ouvert** | Ombre forte, élévation -4px | Détails visibles, bouton fermer affiché |
| **Autres cartes (une ouverte)** | Opacité 0.5, scale 0.98 | Atténuation visuelle |

---

### 5. Clarifier la cohérence sémantique

**Actuel :**
> ❌ `data-status="valided"`  
> ✅ `data-status="validated"`  
> ou  
> ✅ `data-status="valide"`

**Proposé :**
> **Recommandation :** Utiliser `data-status="validated"` (anglais) pour cohérence avec le reste du codebase et le tracking analytics.  
> **Alternative :** `data-status="valide"` (français) si le projet privilégie la francisation.

**Raison :** Évite l'indécision, donne une recommandation claire

---

### 6. Ajouter une section "Tests de validation"

**Ajout proposé :**

### Tests de validation

#### Test 1 : Lecture rapide
- [ ] Temps de compréhension < 5 secondes
- [ ] Message mémorisé après 1 lecture
- [ ] Aucun jargon technique visible en fermé

#### Test 2 : Alignement visuel
- [ ] Toutes les cartes ont la même hauteur en fermé
- [ ] Les icônes sont alignées horizontalement
- [ ] Les titres sont alignés horizontalement
- [ ] Les textes ne débordent pas (line-clamp fonctionne)

#### Test 3 : Accessibilité
- [ ] Navigation clavier complète (TAB, ENTER, SPACE)
- [ ] Lecteur d'écran annonce correctement les états
- [ ] Focus visible sur tous les éléments interactifs
- [ ] `hidden` présent quand fermé, absent quand ouvert

#### Test 4 : Responsive
- [ ] Desktop : 3 colonnes alignées
- [ ] Tablet : 2 colonnes, pas de débordement
- [ ] Mobile : 1 colonne, texte lisible
- [ ] Slots restent alignés sur tous les breakpoints

---

### 7. Ajouter une section "Cas limites"

**Ajout proposé :**

### Cas limites

#### Texte trop long
Si le contenu dépasse 2 lignes :
- Utiliser `text-overflow: ellipsis`
- Tronquer avec `...`
- **Ne jamais** laisser déborder

#### Contenu détaillé trop long
Si plus de 5 items :
- Limiter à 5 items maximum
- Utiliser un scroll interne si nécessaire
- **Ne jamais** dépasser la hauteur max de la carte

#### Mobile très petit (<375px)
- Réduire les paddings à 1rem
- Réduire la taille des icônes à 2rem
- Badge à 24px au lieu de 28px

---

### 8. Préciser les animations

**Ajout proposé :**

### Animations — Détails techniques

| Animation | Durée | Easing | Propriétés |
|-----------|-------|--------|------------|
| **Ouverture** | 200ms | `ease-out` | `max-height`, `opacity`, `padding` |
| **Fermeture** | 150ms | `ease-in` | `max-height`, `opacity`, `padding` |
| **Hover** | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` | `transform`, `box-shadow` |
| **Badge hover** | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` | `transform` (scale + rotate) |
| **Icône hover** | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` | `transform` (scale) |

**Note :** Toutes les animations doivent respecter `prefers-reduced-motion: reduce`

---

### 9. Ajouter une section "Performance"

**Ajout proposé :**

### Performance

#### Optimisations CSS
- Utiliser `will-change` sur les éléments animés (optionnel)
- Éviter les `reflow` en utilisant `transform` plutôt que `top/left`
- Utiliser `opacity` pour les transitions de visibilité

#### Optimisations JS
- Debounce les événements si nécessaire (non requis actuellement)
- Utiliser `requestAnimationFrame` pour les animations complexes (non requis actuellement)
- Éviter les `querySelector` répétés (déjà optimisé)

---

### 10. Ajouter un glossaire

**Ajout proposé :**

### Glossaire

| Terme | Définition |
|-------|------------|
| **Slot** | Zone visuelle fixe avec dimensions définies |
| **Line-clamp** | Propriété CSS limitant le nombre de lignes affichées |
| **Hidden** | Attribut HTML masquant un élément des lecteurs d'écran |
| **Accordéon exclusif** | Un seul élément ouvert à la fois |
| **Progressive disclosure** | Principe UX : montrer peu, révéler à la demande |

---

## 📋 Résumé des améliorations

| Amélioration | Priorité | Impact |
|--------------|----------|--------|
| Clarifier règle 2 lignes | P1 | Moyen |
| Exemple visuel slots | P2 | Faible |
| Gestion `hidden` avec transitions | P1 | Moyen |
| Section états visuels | P2 | Faible |
| Clarifier cohérence sémantique | P0 | Élevé |
| Section tests de validation | P1 | Moyen |
| Section cas limites | P1 | Moyen |
| Détails animations | P2 | Faible |
| Section performance | P2 | Faible |
| Glossaire | P2 | Faible |

---

## ✅ Recommandation finale

La spécification v1.3 est **très bonne** mais pourrait bénéficier de :

1. **Clarifications techniques** (gestion `hidden`, line-clamp)
2. **Exemples visuels** (schéma des slots)
3. **Tests de validation** (checklist pratique)
4. **Cas limites** (gestion des erreurs)

Ces ajouts rendraient la spec **100% implémentable** sans ambiguïté.

---

**Fin des améliorations proposées**

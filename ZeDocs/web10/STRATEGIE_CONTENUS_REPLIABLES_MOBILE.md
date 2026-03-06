# 🎯 Stratégie — Contenus repliables sur mobile

**Date :** 25 janvier 2026  
**Objectif :** Définir la stratégie optimale pour améliorer l'expérience mobile

---

## 🧭 Principe directeur

> **"Réduire le scroll sans cacher l'essentiel"**

**Objectifs :**
- ✅ Améliorer le temps de chargement perçu
- ✅ Réduire la friction cognitive
- ✅ Maintenir l'accessibilité de l'information clé
- ✅ Respecter le principe mobile-first

---

## 📊 Analyse des options

### Option A : Accordéons partout (agressif)
**Approche :** Replier toutes les sections possibles  
**Avantages :** Scroll minimal  
**Inconvénients :** Risque de cacher des informations importantes, friction supplémentaire  
**Verdict :** ❌ **Trop agressif**

### Option B : Aucun repli (conservateur)
**Approche :** Garder tout visible  
**Avantages :** Aucune friction, tout accessible  
**Inconvénients :** Scroll long, risque de décrochage  
**Verdict :** ⚠️ **Pas optimal pour mobile**

### Option C : Repli sélectif (équilibré) ⭐ **RECOMMANDÉ**
**Approche :** Replier uniquement les contenus secondaires ou répétitifs  
**Avantages :** Équilibre entre réduction du scroll et accessibilité  
**Inconvénients :** Nécessite un jugement UX  
**Verdict :** ✅ **Optimal**

---

## 🎯 Stratégie recommandée : "Repli progressif"

### Phase 1 : Quick wins (Impact élevé, complexité faible)

#### 1.1 Liste des features du hero — "Voir plus"
**Pourquoi :**
- ✅ Impact immédiat sur la hauteur du hero
- ✅ Les 3 premiers items sont les plus importants
- ✅ Implémentation simple (bouton toggle)

**Implémentation :**
```
[✓] Preuves vérifiables en temps réel
[✓] Zéro manipulation humaine
[✓] Intégré naturellement avec Odoo
[▶ Voir plus de features] (3 items cachés)
```

**Critères de succès :**
- Hero visible sans scroll sur 80% des mobiles
- Taux de clic "Voir plus" > 30%

---

### Phase 2 : Optimisation des sections (Impact moyen, complexité moyenne)

#### 2.1 Section Fonctionnement — Accordéon simple
**Pourquoi :**
- ✅ Les 3 cartes sont complémentaires, pas essentielles simultanément
- ✅ Permet de se concentrer sur un point à la fois
- ✅ Réduit le scroll vertical

**Implémentation :**
- Accordéon simple (un seul item ouvert)
- Par défaut : premier item ouvert
- Animation douce (0.3s)

**Critères de succès :**
- Réduction de 40% de la hauteur de la section
- Taux d'interaction > 50% (au moins un item ouvert)

#### 2.2 Section Conformité — Accordéon simple
**Pourquoi :**
- ✅ 3 cartes similaires en structure
- ✅ Informations complémentaires, pas critiques simultanément
- ✅ Cohérence avec la section Fonctionnement

**Implémentation :**
- Même pattern que Section Fonctionnement
- Par défaut : premier item ouvert

---

### Phase 3 : Affinage (si nécessaire)

#### 3.1 A/B Testing
**Métriques à suivre :**
- Temps passé sur la page
- Taux de scroll jusqu'au formulaire
- Taux de conversion (soumission formulaire)
- Taux de rebond

**Hypothèses à tester :**
- Accordéons ouverts par défaut vs fermés
- Nombre d'items visibles dans le hero (3 vs 4)
- Animation rapide (0.2s) vs douce (0.4s)

---

## 🚫 Ce qu'il ne faut PAS replier

### Contenus critiques (toujours visibles)
1. **Titre principal (H1)** : Message clé
2. **Sous-titre hero** : Proposition de valeur
3. **Boutons CTA** : Actions principales
4. **Formulaire de contact** : Objectif de conversion
5. **Points de garantie** : Rassurants, doivent rester visibles

### Principe
> Si le contenu est nécessaire pour comprendre la proposition de valeur, il ne doit pas être replié.

---

## 📐 Règles de design

### 1. Indicateurs visuels clairs
- ✅ Icône chevron (▶ / ▼) pour indiquer l'état
- ✅ Texte "Voir plus" / "Voir moins" explicite
- ✅ Animation douce (0.3s ease)

### 2. Accessibilité
- ✅ `aria-expanded` pour les accordéons
- ✅ `aria-controls` pour lier header → content
- ✅ Navigation clavier (Tab, Enter, Escape)

### 3. Performance
- ✅ Transitions CSS (pas de JavaScript lourd)
- ✅ `will-change: transform` pour les animations
- ✅ Désactiver les animations si `prefers-reduced-motion`

---

## 🎨 Pattern d'implémentation

### Structure HTML
```html
<div class="v2-accordion" data-mobile-only="true">
  <div class="v2-accordion-item">
    <button class="v2-accordion-header" aria-expanded="true" aria-controls="content-1">
      <span>Titre</span>
      <span class="v2-accordion-icon">▼</span>
    </button>
    <div class="v2-accordion-content" id="content-1">
      Contenu...
    </div>
  </div>
</div>
```

### CSS (mobile-first)
```css
/* Desktop : affichage normal */
.v2-accordion {
  display: block;
}

@media (min-width: 768px) {
  .v2-accordion[data-mobile-only="true"] .v2-accordion-item {
    /* Désactiver l'accordéon sur desktop */
  }
}

/* Mobile : accordéon actif */
@media (max-width: 767px) {
  .v2-accordion-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
  }
  
  .v2-accordion-item[aria-expanded="true"] .v2-accordion-content {
    max-height: 1000px;
  }
}
```

---

## 📊 Plan d'implémentation

### Sprint 1 : Hero features (1-2h)
- [ ] Ajouter bouton "Voir plus" / "Voir moins"
- [ ] JavaScript toggle simple
- [ ] CSS pour animation
- [ ] Test sur mobile réel

### Sprint 2 : Section Fonctionnement (2-3h)
- [ ] Transformer grille en accordéon (mobile)
- [ ] JavaScript pour gestion accordéon
- [ ] CSS animations
- [ ] Test UX

### Sprint 3 : Section Conformité (1-2h)
- [ ] Réutiliser pattern Section Fonctionnement
- [ ] Adaptation contenu
- [ ] Test final

**Total estimé :** 4-7h

---

## ✅ Critères de succès

### Métriques quantitatives
- 📉 **Réduction du scroll** : -30% minimum
- ⏱️ **Temps jusqu'au CTA** : -20% minimum
- 👆 **Taux d'interaction** : > 40% (au moins un accordéon ouvert)
- 📱 **Taux de conversion mobile** : Stable ou amélioré

### Métriques qualitatives
- ✅ Pas de confusion utilisateur
- ✅ Navigation intuitive
- ✅ Performance perçue améliorée
- ✅ Accessibilité maintenue

---

## 🎯 Recommandation finale

**Stratégie : "Repli progressif sélectif"**

1. **Commencer par Phase 1** (Hero features) — Quick win
2. **Évaluer l'impact** (métriques, feedback)
3. **Poursuivre Phase 2** si résultats positifs
4. **Affiner Phase 3** selon les données

**Principe :** 
> "Moins c'est mieux, mais l'essentiel doit rester visible"

---

**Document créé le :** 25 janvier 2026

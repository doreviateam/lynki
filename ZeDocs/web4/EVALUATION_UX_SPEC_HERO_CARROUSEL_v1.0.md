# 🎨 Évaluation UX — SPEC Hero Carrousel "Vérité financière"

**Version** : v1.0  
**Date** : 2026-01-20  
**Évaluateur** : UX Designer  
**Spec originale** : SPEC — HERO Carrousel "Vérité financière" v1.0

---

## ✅ Points Forts

### 1. Structure claire
- **3 slides distinctes** avec objectifs précis (Positionnement → Différenciation → Bénéfice)
- **Progression logique** : Quoi → Comment → Pourquoi
- **Objectif mesurable** : "En moins de 8 secondes"

### 2. Considérations techniques
- Accessibilité prévue (reduced-motion, clavier, ARIA)
- Analytics intégrés
- Comportement interactif (pause au hover, swipe mobile)

### 3. Ligne éditoriale
- Messages clairs : preuve, certitude, temps réel
- Interdits bien définis (pas de promesses magiques)

---

## ⚠️ Points d'Attention & Améliorations

### 1. **Slide 2 — Ton trop agressif**

**Problème** :
> "Ici, on ne triture pas les chiffres. On les prouve."

**Analyse UX** :
- Ton confrontant qui peut créer de la défiance
- Implique que les concurrents "triturent" les chiffres
- Peut être perçu comme agressif par certains CFO

**Recommandation** :
```
Option A (neutre) :
"Vos données financières, scellées à la source."

Option B (orienté valeur) :
"Chaque opération devient une preuve vérifiable."

Option C (orienté processus) :
"Collecte automatique. Sécurisation native. Preuves exploitables."
```

**Verdict** : Préférer **Option B** — plus positif, orienté bénéfice.

---

### 2. **Surcharge cognitive — Slide 3**

**Problème** :
- 5 bullets dans le slide 3
- Risque de surcharge visuelle
- Temps de lecture estimé : ~12-15 secondes (dépassement objectif 8s)

**Recommandation** :
**Réduire à 3 bullets maximum** par slide :

**Slide 3 — Version optimisée** :
- Trésorerie certifiée en temps réel
- TVA & CA fiables, vérifiables
- Du solo-entrepreneur à l'ETI

**Note** : L'IA souveraine peut être mentionnée dans le sous-titre plutôt qu'en bullet.

---

### 3. **Timing du carrousel — 7 secondes**

**Problème** :
- 7s peut être trop court pour lire 3 bullets + titre + sous-titre
- Risque de frustration si l'utilisateur n'a pas fini de lire

**Recommandation** :
- **Slide 1** : 8 secondes (contenu plus dense)
- **Slide 2** : 7 secondes
- **Slide 3** : 8 secondes (5 bullets → 3 bullets)

**Alternative** : Timing adaptatif selon longueur du contenu (min 7s, max 10s)

---

### 4. **Hiérarchie visuelle non définie**

**Problème** :
- Pas de spécification des tailles de police
- Pas de contraste défini
- Risque de confusion sur l'élément à lire en premier

**Recommandation** :
```
Hiérarchie visuelle proposée :

1. Badge (top) : 0.875rem, couleur secondaire
2. Titre (H1) : clamp(2rem, 4vw, 3rem), gras, couleur primaire
3. Sous-titre : clamp(1.1rem, 1.5vw, 1.25rem), couleur gris foncé
4. Bullets : clamp(0.95rem, 1.1vw, 1rem), couleur gris moyen
5. CTA : Bouton primaire, taille standard
```

---

### 5. **Badge trop long sur mobile**

**Problème** :
> "Infrastructure de vérité financière"

- 35 caractères → risque de débordement sur mobile
- Peut nécessiter 2 lignes

**Recommandation** :
```
Option A (abrégé) :
"Vérité financière"

Option B (2 lignes) :
"Infrastructure de<br>
vérité financière"

Option C (badge conditionnel) :
Desktop : "Infrastructure de vérité financière"
Mobile : "Vérité financière"
```

**Verdict** : Préférer **Option C** — responsive, meilleure UX mobile.

---

### 6. **CTA incohérents entre slides**

**Problème** :
- Slide 1 : "Voir la démo"
- Slide 2 : "Comment ça marche"
- Slide 3 : "Demander une démo"

**Analyse UX** :
- Crée de la confusion sur l'action attendue
- L'utilisateur peut se demander quelle est la "vraie" CTA

**Recommandation** :
**Option A — CTA unique** (recommandé) :
- Tous les slides : "👉 Voir la démo"
- Cohérence = clarté

**Option B — CTA secondaire** :
- Slide 1 : "👉 Voir la démo" (principal) + "Comment ça marche" (secondaire)
- Slide 2 : "👉 Voir la démo" (principal) + "En savoir plus" (secondaire)
- Slide 3 : "👉 Demander une démo" (principal) + "Voir les tarifs" (secondaire)

**Verdict** : Préférer **Option A** — simplicité, clarté, meilleure conversion.

---

### 7. **État initial non défini**

**Problème** :
- Quel slide afficher au chargement ?
- Slide 1 par défaut ? Dernière vue ? Aléatoire ?

**Recommandation** :
- **Slide 1** par défaut (positionnement)
- **Pas de rotation automatique** pendant les 3 premières secondes (temps de lecture)
- **Reprendre rotation** après 3s d'inactivité

---

### 8. **Manque de feedback visuel**

**Problème** :
- Pas de mention d'indicateurs de progression
- Pas de mention de dots de navigation

**Recommandation** :
- **Dots de navigation** : 3 points en bas du carrousel
- **Indicateur de progression** : barre de progression animée (optionnel)
- **Flèches de navigation** : gauche/droite (desktop uniquement)

---

### 9. **Responsive design non spécifié**

**Problème** :
- Pas de mention du comportement sur tablette/mobile
- Risque de débordement de contenu

**Recommandation** :
```
Breakpoints proposés :

Mobile (< 768px) :
- Badge : 1 ligne ("Vérité financière")
- Titre : clamp(1.75rem, 5vw, 2.25rem)
- Bullets : 2-3 maximum
- Dots : visibles, touch-friendly (min 44x44px)

Tablette (768px - 991px) :
- Badge : 1 ligne (version complète si espace)
- Titre : clamp(2rem, 4vw, 2.75rem)
- Bullets : 3-4 maximum

Desktop (≥ 992px) :
- Badge : version complète
- Titre : clamp(2.5rem, 4vw, 3rem)
- Bullets : 3-5 selon slide
```

---

### 10. **Accessibilité — Améliorations**

**Recommandations supplémentaires** :
- **Focus visible** : Outline clair sur dots et flèches
- **Skip link** : Permettre de sauter le carrousel (screen readers)
- **Alt text** : Si images/icônes, descriptions accessibles
- **Contraste** : Vérifier ratio 4.5:1 minimum (WCAG AA)

---

## 📊 Recommandations Prioritaires

### P0 (Critique)
1. ✅ **Réduire bullets Slide 3** (5 → 3)
2. ✅ **CTA cohérents** (tous "Voir la démo")
3. ✅ **Badge responsive** (version mobile courte)

### P1 (Important)
4. ✅ **Timing adaptatif** (7-10s selon contenu)
5. ✅ **Hiérarchie visuelle** définie
6. ✅ **État initial** spécifié

### P2 (Amélioration)
7. ✅ **Feedback visuel** (dots, progression)
8. ✅ **Responsive breakpoints** détaillés
9. ✅ **Ton Slide 2** (moins agressif)

---

## 🎯 Version Améliorée — Slide 2

### Slide 2 — Différenciation (Version optimisée)

**Titre** (Option recommandée) :
> Chaque opération devient une preuve vérifiable.

**Sous-titre** :
> Collecte automatique → sécurisation native → preuves exploitables  
> Le paiement prouve, l'ERP s'aligne.

**Bullets** (3 maximum) :
- Factures, paiements, écritures
- Journal immuable
- Aucune retouche manuelle

**CTA** : 👉 Voir la démo

---

## 📐 Spécifications Techniques Recommandées

### Timing
- **Slide 1** : 8 secondes
- **Slide 2** : 7 secondes
- **Slide 3** : 8 secondes
- **Pause initiale** : 3 secondes (pas de rotation)
- **Animation** : fade 400ms (conforme spec)

### Navigation
- **Dots** : 3 points, espacement 12px, taille 10px (actif) / 8px (inactif)
- **Flèches** : Desktop uniquement, taille 48x48px (touch target)
- **Swipe** : Mobile activé, seuil 50px

### Accessibilité
- **ARIA labels** :
  - `aria-label="Carrousel Hero - Slide {n} sur 3"`
  - `aria-live="polite"` sur le conteneur
  - `role="tablist"` sur les dots
- **Clavier** : Tab, Enter, Flèches gauche/droite
- **Reduced motion** : Pas d'animation fade, transition instantanée

---

## 🎨 Hiérarchie Visuelle Détaillée

```
┌─────────────────────────────────────┐
│ [Badge] Infrastructure de...        │ ← 0.875rem, couleur secondaire
│                                     │
│ Titre principal                     │ ← clamp(2rem, 4vw, 3rem), gras
│                                     │
│ Sous-titre descriptif               │ ← clamp(1.1rem, 1.5vw, 1.25rem)
│                                     │
│ • Bullet 1                          │ ← clamp(0.95rem, 1.1vw, 1rem)
│ • Bullet 2                          │
│ • Bullet 3                          │
│                                     │
│ [👉 Voir la démo]                   │ ← Bouton primaire
│                                     │
│ [•] [•] [•]                         │ ← Dots navigation
└─────────────────────────────────────┘
```

---

## ✅ Critères d'Acceptation Améliorés

### Fonctionnels
- [ ] 3 slides fonctionnelles avec rotation automatique
- [ ] Navigation dots fonctionnelle (clavier + souris)
- [ ] Swipe mobile activé
- [ ] Pause au hover/interaction
- [ ] Timing adaptatif (7-10s)

### Contenu
- [ ] Mentions : preuve, zéro manipulation, LNE2026, NF525
- [ ] Maximum 3 bullets par slide
- [ ] CTA cohérents ("Voir la démo" partout)
- [ ] Badge responsive (version mobile courte)

### Accessibilité
- [ ] Support prefers-reduced-motion
- [ ] Navigation clavier complète
- [ ] ARIA labels explicites
- [ ] Contraste WCAG AA (4.5:1)

### Performance
- [ ] Temps de chargement < 2s
- [ ] Animation fluide (60fps)
- [ ] Pas de layout shift (CLS)

### Analytics
- [ ] Événements trackés : hero_slide_view, hero_cta_click, hero_nav_click
- [ ] Paramètres : slide_number, cta_type, nav_type

---

## 🎯 Verdict Global

### Note : 7.5/10

**Points forts** :
- Structure claire et logique
- Objectifs mesurables
- Considérations accessibilité

**Points à améliorer** :
- Réduction de la surcharge cognitive
- Cohérence des CTA
- Responsive design détaillé
- Ton moins agressif (Slide 2)

### Recommandation finale

**✅ Approuver avec modifications** :
1. Appliquer les recommandations P0 (critiques)
2. Tester avec utilisateurs (A/B test si possible)
3. Itérer selon feedback

---

**Fin de l'évaluation**

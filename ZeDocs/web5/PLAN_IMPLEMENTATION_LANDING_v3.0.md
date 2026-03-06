# PLAN D'IMPLÉMENTATION — Landing Page Dorevia-Vault v3.0

**Version** : v3.0  
**Date** : 2026-01-20  
**Statut** : Plan d'action  
**Base** : SPEC Landing Page v3.0 + Documents techniques

---

## 📋 Vue d'ensemble

### Objectif
Implémenter la landing page Dorevia-Vault v3.0 selon les spécifications complètes, en remplaçant ou adaptant l'implémentation actuelle (v2.1).

### Durée estimée totale
**15-20 heures** (2-3 jours de développement)

### Documents de référence
- `SPEC_LANDING_DOREVIA_VAULT_v3.0.md` — Contenu éditorial
- `WIREFRAME_LANDING_DOREVIA_VAULT_v1.0.md` — Layout visuel
- `SPEC_TECHNIQUE_LANDING_v3.0.md` — Spécifications techniques
- `SPEC_CONTENU_FINAL_v3.0.md` — Textes finaux
- `SPEC_DESIGN_SYSTEM_v3.0.md` — Design tokens et composants
- `ANALYSE_EXPERT_SPEC_LANDING_v3.0.md` — Recommandations

---

## 🎯 Phases d'implémentation

### Phase 0 — Préparation (1-2h)

**Objectif** : Préparer l'environnement et analyser l'existant

#### Tâches

1. **Analyse de l'existant**
   - [ ] Identifier les fichiers à modifier
   - [ ] Lister les sections à remplacer
   - [ ] Identifier les sections à conserver
   - [ ] Vérifier les dépendances CSS/JS
   - **Temps** : 30 min

2. **Backup**
   - [ ] Créer une branche Git : `feature/landing-v3.0`
   - [ ] Backup du template actuel : `home/index.html.twig.backup`
   - [ ] Backup des CSS existants
   - **Temps** : 15 min

3. **Structure de fichiers**
   - [ ] Créer structure CSS pour v3.0
   - [ ] Créer structure JS pour v3.0
   - [ ] Préparer dossier images si nécessaire
   - **Temps** : 30 min

4. **Review des specs**
   - [ ] Lire toutes les specs
   - [ ] Identifier les incohérences
   - [ ] Clarifier les points d'attention
   - **Temps** : 30 min

**Livrables** :
- Branche Git créée
- Backup effectué
- Structure de fichiers prête
- Points d'attention identifiés

---

### Phase 1 — Design System (2-3h)

**Objectif** : Implémenter le design système de base

#### Tâches

1. **Design Tokens CSS**
   - [ ] Créer fichier `public/assets/css/design-tokens.css`
   - [ ] Implémenter variables CSS (couleurs, typographie, espacements)
   - [ ] Tester les contrastes WCAG
   - **Temps** : 1h
   - **Fichier** : `SPEC_DESIGN_SYSTEM_v3.0.md` §1

2. **Composants UI de base**
   - [ ] Implémenter boutons (primary, secondary, white)
   - [ ] Implémenter cartes (base, avec icône)
   - [ ] Implémenter badges
   - [ ] Tester tous les états (hover, focus, active, disabled)
   - **Temps** : 1h
   - **Fichier** : `SPEC_DESIGN_SYSTEM_v3.0.md` §2

3. **Layout et responsive**
   - [ ] Implémenter container responsive
   - [ ] Implémenter système de sections
   - [ ] Tester breakpoints (mobile, tablette, desktop)
   - **Temps** : 30 min
   - **Fichier** : `SPEC_DESIGN_SYSTEM_v3.0.md` §3-4

4. **Animations de base**
   - [ ] Implémenter animations (fadeIn, slideUp, spin)
   - [ ] Ajouter support `prefers-reduced-motion`
   - **Temps** : 30 min
   - **Fichier** : `SPEC_DESIGN_SYSTEM_v3.0.md` §5

**Livrables** :
- `design-tokens.css` créé
- Composants UI fonctionnels
- Layout responsive testé
- Animations implémentées

**Tests** :
- [ ] Vérifier contraste WCAG AA
- [ ] Tester tous les breakpoints
- [ ] Tester navigation clavier
- [ ] Tester reduced motion

---

### Phase 2 — Header et Hero (2-3h)

**Objectif** : Implémenter le header sticky et la section Hero

#### Tâches

1. **Header sticky**
   - [ ] Implémenter structure HTML selon spec technique
   - [ ] Ajouter styles CSS (sticky, backdrop-filter)
   - [ ] Implémenter menu mobile (hamburger)
   - [ ] Implémenter JavaScript sticky header
   - **Temps** : 1h
   - **Fichiers** : 
     - `SPEC_TECHNIQUE_LANDING_v3.0.md` §2.1
     - `SPEC_CONTENU_FINAL_v3.0.md` §2

2. **Hero Section**
   - [ ] Implémenter structure HTML complète
   - [ ] Ajouter badge souveraineté (responsive)
   - [ ] Implémenter headline "Des chiffres vrais. Enfin."
   - [ ] Implémenter sous-titre (desktop + mobile)
   - [ ] Ajouter bullets (3 points)
   - [ ] Implémenter 2 CTAs (principal + secondaire)
   - [ ] Ajouter mention IA discrète
   - [ ] Ajouter visual (dashboard screenshot)
   - **Temps** : 1.5h
   - **Fichiers** :
     - `SPEC_TECHNIQUE_LANDING_v3.0.md` §2.2
     - `SPEC_CONTENU_FINAL_v3.0.md` §3
     - `WIREFRAME_LANDING_DOREVIA_VAULT_v1.0.md` §B

3. **CSS Hero**
   - [ ] Implémenter styles Hero selon design system
   - [ ] Responsive (mobile, tablette, desktop)
   - [ ] Animations (fade-in au chargement)
   - **Temps** : 30 min

**Livrables** :
- Header sticky fonctionnel
- Hero complet avec tous les éléments
- Responsive testé

**Tests** :
- [ ] Header reste visible au scroll
- [ ] Menu mobile fonctionnel
- [ ] Hero responsive (mobile, tablette, desktop)
- [ ] CTAs cliquables et trackés

---

### Phase 3 — Sections principales (4-5h)

**Objectif** : Implémenter les sections de contenu principales

#### Tâches

1. **Section Le défi**
   - [ ] Implémenter structure HTML
   - [ ] Ajouter 4 cartes challenges (icônes + titres)
   - [ ] Ajouter message conséquence
   - [ ] Ajouter message positif
   - [ ] Implémenter CSS
   - **Temps** : 45 min
   - **Fichiers** :
     - `SPEC_TECHNIQUE_LANDING_v3.0.md` §2.3
     - `SPEC_CONTENU_FINAL_v3.0.md` §4

2. **Section La solution**
   - [ ] Implémenter structure HTML
   - [ ] Ajouter 3 cartes solution
   - [ ] Ajouter résultat "Horodatée • Traçable • Vérifiable → Une preuve"
   - [ ] Implémenter CSS
   - **Temps** : 45 min
   - **Fichiers** :
     - `SPEC_TECHNIQUE_LANDING_v3.0.md` §2.4
     - `SPEC_CONTENU_FINAL_v3.0.md` §5

3. **Section Ce que ça change**
   - [ ] Implémenter structure HTML
   - [ ] Ajouter 4 cartes bénéfices
   - [ ] Ajouter message "Vous reprenez le contrôle"
   - [ ] Implémenter CSS
   - **Temps** : 45 min
   - **Fichiers** :
     - `SPEC_TECHNIQUE_LANDING_v3.0.md` §2.5
     - `SPEC_CONTENU_FINAL_v3.0.md` §6

4. **Section Notre conviction**
   - [ ] Implémenter structure HTML
   - [ ] Ajouter message principal
   - [ ] Ajouter liste 3 points
   - [ ] Ajouter encadré conformité (LNE 2026 • NF525)
   - [ ] Implémenter CSS
   - **Temps** : 45 min
   - **Fichiers** :
     - `SPEC_TECHNIQUE_LANDING_v3.0.md` §2.6
     - `SPEC_CONTENU_FINAL_v3.0.md` §7

5. **Section Comment ça marche**
   - [ ] Implémenter structure HTML (3 étapes)
   - [ ] Ajouter flèches entre étapes
   - [ ] Implémenter CSS
   - **Temps** : 45 min
   - **Fichiers** :
     - `SPEC_TECHNIQUE_LANDING_v3.0.md` §2.7
     - `SPEC_CONTENU_FINAL_v3.0.md` §8

**Livrables** :
- 5 sections principales implémentées
- Toutes les cartes fonctionnelles
- Responsive testé

**Tests** :
- [ ] Toutes les sections visibles
- [ ] Cartes alignées correctement
- [ ] Responsive mobile/tablette/desktop
- [ ] Animations au scroll fonctionnelles

---

### Phase 4 — Sections complémentaires (2-3h)

**Objectif** : Implémenter les sections de ciblage et différenciation

#### Tâches

1. **Section Pour qui**
   - [ ] Implémenter structure HTML (4 cartes)
   - [ ] Ajouter icônes et titres
   - [ ] Implémenter CSS
   - **Temps** : 30 min
   - **Fichiers** :
     - `SPEC_TECHNIQUE_LANDING_v3.0.md` §2.8
     - `SPEC_CONTENU_FINAL_v3.0.md` §9

2. **Section Pourquoi c'est différent**
   - [ ] Implémenter structure HTML (4 cartes)
   - [ ] Ajouter message "Pas de boîte noire"
   - [ ] Implémenter CSS
   - **Temps** : 30 min
   - **Fichiers** :
     - `SPEC_TECHNIQUE_LANDING_v3.0.md` §2.9
     - `SPEC_CONTENU_FINAL_v3.0.md` §10

3. **Section Ce qu'est Dorevia-Vault**
   - [ ] Implémenter structure HTML
   - [ ] Ajouter message principal
   - [ ] Ajouter 3 piliers
   - [ ] Implémenter CSS
   - **Temps** : 30 min
   - **Fichiers** :
     - `SPEC_TECHNIQUE_LANDING_v3.0.md` §2.10
     - `SPEC_CONTENU_FINAL_v3.0.md` §11

4. **CTA Final**
   - [ ] Implémenter structure HTML
   - [ ] Ajouter titre "Prêt à passer aux chiffres prouvés ?"
   - [ ] Ajouter 2 CTAs
   - [ ] Implémenter CSS
   - **Temps** : 30 min
   - **Fichiers** :
     - `SPEC_TECHNIQUE_LANDING_v3.0.md` §2.11
     - `SPEC_CONTENU_FINAL_v3.0.md` §12

5. **Footer**
   - [ ] Implémenter structure HTML (4 colonnes)
   - [ ] Ajouter navigation, ressources, contact, légales
   - [ ] Implémenter CSS
   - **Temps** : 30 min
   - **Fichiers** :
     - `SPEC_TECHNIQUE_LANDING_v3.0.md` §2.12
     - `SPEC_CONTENU_FINAL_v3.0.md` §13

**Livrables** :
- Toutes les sections complémentaires implémentées
- Footer complet
- CTA final fonctionnel

**Tests** :
- [ ] Toutes les sections visibles
- [ ] Footer responsive
- [ ] CTAs fonctionnels

---

### Phase 5 — JavaScript et interactions (2-3h)

**Objectif** : Implémenter toutes les fonctionnalités JavaScript

#### Tâches

1. **Navigation**
   - [ ] Smooth scroll vers ancres
   - [ ] Header sticky avec changement d'état
   - [ ] Menu mobile toggle
   - **Temps** : 1h
   - **Fichier** : `SPEC_TECHNIQUE_LANDING_v3.0.md` §4.2

2. **Tracking Analytics**
   - [ ] Intégrer GA4 (si pas déjà fait)
   - [ ] Track CTA clicks (Hero, CTA final)
   - [ ] Track scroll depth (sections)
   - [ ] Track time on page
   - **Temps** : 1h
   - **Fichier** : `SPEC_TECHNIQUE_LANDING_v3.0.md` §4.2

3. **Animations au scroll**
   - [ ] Intersection Observer pour sections
   - [ ] Fade-in animations
   - [ ] Slide-up animations
   - [ ] Respect `prefers-reduced-motion`
   - **Temps** : 1h
   - **Fichier** : `SPEC_TECHNIQUE_LANDING_v3.0.md` §4.2

**Livrables** :
- Navigation fonctionnelle
- Analytics tracking actif
- Animations au scroll

**Tests** :
- [ ] Smooth scroll fonctionnel
- [ ] Header sticky fonctionnel
- [ ] Menu mobile fonctionnel
- [ ] Analytics events envoyés
- [ ] Animations fonctionnelles

---

### Phase 6 — Formulaires et intégrations (1-2h)

**Objectif** : Implémenter les formulaires et intégrations

#### Tâches

1. **Formulaire de contact**
   - [ ] Créer structure HTML formulaire
   - [ ] Implémenter validation JavaScript
   - [ ] Ajouter messages d'erreur/succès
   - [ ] Implémenter envoi (backend)
   - **Temps** : 1h
   - **Fichiers** :
     - `SPEC_TECHNIQUE_LANDING_v3.0.md` §2 (formulaire)
     - `SPEC_CONTENU_FINAL_v3.0.md` §14

2. **Intégrations**
   - [ ] Vérifier intégration CRM (si applicable)
   - [ ] Vérifier intégration email
   - [ ] Tester flux complet
   - **Temps** : 30 min

**Livrables** :
- Formulaire fonctionnel
- Validation côté client
- Envoi backend fonctionnel

**Tests** :
- [ ] Validation formulaires
- [ ] Messages d'erreur affichés
- [ ] Messages de succès affichés
- [ ] Envoi fonctionnel

---

### Phase 7 — Optimisations et polish (2-3h)

**Objectif** : Optimiser performance, accessibilité, SEO

#### Tâches

1. **Performance**
   - [ ] Optimiser images (WebP, lazy loading)
   - [ ] Critical CSS inline
   - [ ] JavaScript déferré
   - [ ] Minifier CSS/JS
   - [ ] Tester Lighthouse score (objectif 90+)
   - **Temps** : 1h
   - **Fichier** : `SPEC_TECHNIQUE_LANDING_v3.0.md` §6

2. **Accessibilité**
   - [ ] Vérifier tous les ARIA labels
   - [ ] Tester navigation clavier complète
   - [ ] Vérifier contraste WCAG AA
   - [ ] Tester avec lecteur d'écran
   - **Temps** : 1h
   - **Fichier** : `SPEC_TECHNIQUE_LANDING_v3.0.md` §5

3. **SEO**
   - [ ] Ajouter tous les meta tags
   - [ ] Optimiser title et description
   - [ ] Ajouter OG tags
   - [ ] Vérifier canonical URL
   - [ ] Ajouter structured data (si applicable)
   - **Temps** : 30 min
   - **Fichiers** :
     - `SPEC_TECHNIQUE_LANDING_v3.0.md` §7
     - `SPEC_CONTENU_FINAL_v3.0.md` §1

4. **Polish final**
   - [ ] Vérifier tous les textes (pas de placeholders)
   - [ ] Vérifier tous les alt text images
   - [ ] Tester sur différents navigateurs
   - [ ] Tester sur différents devices
   - [ ] Corriger bugs visuels
   - **Temps** : 30 min

**Livrables** :
- Performance optimisée (Lighthouse 90+)
- Accessibilité WCAG AA
- SEO optimisé
- Page prête pour production

**Tests** :
- [ ] Lighthouse score 90+
- [ ] Accessibilité validée
- [ ] SEO vérifié
- [ ] Cross-browser testé
- [ ] Cross-device testé

---

## 📁 Structure de fichiers

### Fichiers à créer/modifier

```
units/sylius/
├── templates/
│   └── home/
│       └── index.html.twig          [MODIFIER] - Template principal
├── public/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── design-tokens.css    [CRÉER] - Design tokens
│   │   │   ├── landing-v3.css       [CRÉER] - Styles landing v3.0
│   │   │   └── hero.css              [MODIFIER] - Styles Hero
│   │   ├── js/
│   │   │   ├── landing-v3.js        [CRÉER] - JS principal
│   │   │   ├── smooth-scroll.js     [CRÉER] - Smooth scroll
│   │   │   ├── sticky-header.js     [CRÉER] - Header sticky
│   │   │   ├── analytics.js         [CRÉER] - Analytics tracking
│   │   │   └── scroll-animations.js [CRÉER] - Animations scroll
│   │   └── images/
│   │       ├── hero-dashboard.png   [AJOUTER] - Visual Hero
│   │       └── og-dorevia-vault.png [AJOUTER] - OG image
```

---

## ✅ Checklist globale

### Préparation
- [ ] Branche Git créée
- [ ] Backup effectué
- [ ] Structure de fichiers prête
- [ ] Specs lues et comprises

### Implémentation
- [ ] Design system implémenté
- [ ] Header et Hero implémentés
- [ ] Toutes les sections implémentées
- [ ] JavaScript fonctionnel
- [ ] Formulaires fonctionnels

### Qualité
- [ ] Performance optimisée (Lighthouse 90+)
- [ ] Accessibilité WCAG AA
- [ ] SEO optimisé
- [ ] Responsive testé
- [ ] Cross-browser testé

### Contenu
- [ ] Tous les textes finaux
- [ ] Alt text sur toutes images
- [ ] Meta tags complets
- [ ] Messages formulaires

### Tests
- [ ] Tests fonctionnels
- [ ] Tests responsive
- [ ] Tests accessibilité
- [ ] Tests performance
- [ ] Tests cross-browser

---

## 🚀 Ordre d'exécution recommandé

### Sprint 1 (Jour 1 - 6-8h)
1. Phase 0 — Préparation
2. Phase 1 — Design System
3. Phase 2 — Header et Hero

**Livrable** : Header + Hero fonctionnels

### Sprint 2 (Jour 2 - 6-8h)
4. Phase 3 — Sections principales
5. Phase 4 — Sections complémentaires

**Livrable** : Toutes les sections implémentées

### Sprint 3 (Jour 3 - 4-6h)
6. Phase 5 — JavaScript et interactions
7. Phase 6 — Formulaires et intégrations
8. Phase 7 — Optimisations et polish

**Livrable** : Landing page complète et optimisée

---

## 📊 Métriques de succès

### Performance
- [ ] Lighthouse Performance : 90+
- [ ] Lighthouse Accessibility : 90+
- [ ] Lighthouse Best Practices : 90+
- [ ] Lighthouse SEO : 90+
- [ ] Temps de chargement : < 3s

### Fonctionnel
- [ ] Toutes les sections visibles
- [ ] Navigation fonctionnelle
- [ ] Formulaires fonctionnels
- [ ] CTAs trackés
- [ ] Responsive sur tous devices

### Qualité
- [ ] Pas d'erreurs console
- [ ] Pas d'erreurs CSS
- [ ] Accessibilité validée
- [ ] SEO validé

---

## ⚠️ Points d'attention

### Migration depuis v2.1
- ⚠️ **Message différent** : "Des chiffres vrais. Enfin." vs "Infrastructure de vérité financière"
- ⚠️ **Structure différente** : Sections réorganisées
- ⚠️ **Nouveau design system** : Tokens et composants à créer

### Dépendances
- ✅ Bootstrap (déjà présent)
- ✅ Symfony/Twig (déjà présent)
- ⚠️ GA4 (vérifier intégration)
- ⚠️ Images (dashboard screenshot à créer/obtenir)

### Risques
- ⚠️ **Temps sous-estimé** : Prévoir buffer 20%
- ⚠️ **Images manquantes** : Dashboard screenshot, OG image
- ⚠️ **Intégrations** : CRM/Email à vérifier

---

## 🔧 Commandes utiles

### Git
```bash
# Créer branche
git checkout -b feature/landing-v3.0

# Backup
cp units/sylius/templates/home/index.html.twig units/sylius/templates/home/index.html.twig.backup

# Commit
git add .
git commit -m "feat: Landing page v3.0 - Phase X"
```

### Symfony
```bash
# Vider cache
cd units/sylius
docker compose exec php-fpm php bin/console cache:clear

# Assets
docker compose exec php-fpm php bin/console assets:install
```

### Tests
```bash
# Lighthouse (CLI)
lighthouse http://localhost --view

# Accessibilité
npm install -g pa11y
pa11y http://localhost
```

---

## 📝 Notes d'implémentation

### Ordre des sections (selon spec)
1. Header (sticky)
2. Hero
3. Le défi
4. La solution
5. Ce que ça change
6. Notre conviction
7. Comment ça marche
8. Pour qui
9. Pourquoi c'est différent
10. Ce qu'est Dorevia-Vault
11. CTA Final
12. Footer

### Priorités
- **P0** : Hero, Sections principales, Navigation
- **P1** : Sections complémentaires, JavaScript
- **P2** : Optimisations, Polish

---

## 🎯 Critères de validation finale

### Fonctionnel
- [ ] Toutes les sections présentes et visibles
- [ ] Navigation fonctionnelle (smooth scroll, menu mobile)
- [ ] CTAs fonctionnels et trackés
- [ ] Formulaires fonctionnels avec validation
- [ ] Responsive sur mobile, tablette, desktop

### Qualité
- [ ] Lighthouse score 90+ sur tous les critères
- [ ] Accessibilité WCAG AA validée
- [ ] SEO optimisé (meta tags, title, description)
- [ ] Pas d'erreurs console
- [ ] Cross-browser compatible

### Contenu
- [ ] Tous les textes finaux (pas de placeholders)
- [ ] Alt text sur toutes les images
- [ ] Messages formulaires complets
- [ ] Meta tags SEO complets

---

**Fin du Plan d'Implémentation v3.0**

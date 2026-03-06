# 💻 Code Exemples — Animations & Effets Visuels

**Version :** v1.0  
**Date :** 24 janvier 2026  
**Complément de :** ANALYSE_DESIGN_OBOT_AI.md

---

## 1. CSS — Animations et transitions

### 1.1 Variables CSS complètes

```css
/* À ajouter dans landing-v2-final.css */

:root {
  /* Couleurs améliorées */
  --bg: #FFFFFF;
  --bg-surface: #FAFAFA;
  --bg-panel: #F9FAFB;
  --text: #111827;
  --text-muted: #6B7280;
  --text-muted2: #9CA3AF;
  --accent: #2563EB;
  --accent-soft: #EFF6FF;
  --line: #E5E7EB;
  
  /* Espacement */
  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 24px;
  --spacing-lg: 32px;
  --spacing-xl: 48px;
  --spacing-2xl: 64px;
  --spacing-3xl: 96px;
  
  /* Transitions */
  --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Ombres */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.15);
  
  /* Bordures */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
}
```

### 1.2 Keyframes animations

```css
/* Fade in up (apparition depuis le bas) */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fade in (simple apparition) */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Slide in from left */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Slide in from right */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Pulse subtil */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.02);
  }
}

/* Float amélioré */
@keyframes softFloat {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  33% {
    transform: translateY(-8px) rotate(1deg);
  }
  66% {
    transform: translateY(-4px) rotate(-1deg);
  }
}

/* Shimmer (effet de brillance) */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}
```

### 1.3 Classes utilitaires

```css
/* Animation on scroll */
.animate-on-scroll {
  opacity: 0;
  animation: fadeInUp 0.8s var(--transition-base) forwards;
}

.animate-on-scroll-delay-1 {
  animation-delay: 0.1s;
}

.animate-on-scroll-delay-2 {
  animation-delay: 0.2s;
}

.animate-on-scroll-delay-3 {
  animation-delay: 0.3s;
}

/* Hover lift effect */
.hover-lift {
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Link avec underline animé */
.link-underline {
  position: relative;
  text-decoration: none;
  color: var(--text);
}

.link-underline::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--accent);
  transition: width var(--transition-base);
}

.link-underline:hover {
  color: var(--accent);
}

.link-underline:hover::after {
  width: 100%;
}

/* Card avec hover effect */
.card-interactive {
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.card-interactive:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* Button press effect */
.btn-press {
  transition: transform var(--transition-fast);
}

.btn-press:active {
  transform: scale(0.98);
}

/* Icon rotation on hover */
.icon-rotate {
  transition: transform var(--transition-base);
}

.icon-rotate:hover {
  transform: rotate(15deg);
}
```

### 1.4 Header sticky amélioré

```css
/* Header avec backdrop blur */
.v2-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
  transition: box-shadow var(--transition-base), background var(--transition-base);
}

.v2-header.scrolled {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
```

### 1.5 Sections avec espacement amélioré

```css
/* Section avec animation */
.section {
  padding: 80px 0;
  opacity: 0;
  animation: fadeInUp 0.8s var(--transition-base) forwards;
}

@media (min-width: 992px) {
  .section {
    padding: 120px 0;
  }
}

/* Container optimisé */
.v2-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (min-width: 768px) {
  .v2-container {
    padding: 0 48px;
  }
}
```

---

## 2. JavaScript — Interactions

### 2.1 Scroll reveal avec Intersection Observer

```javascript
// Observer pour les animations au scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-on-scroll');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observer tous les éléments avec la classe
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.section, .card, .feature, .blog-card').forEach(el => {
    observer.observe(el);
  });
});
```

### 2.2 Header scroll detection

```javascript
// Détecter le scroll pour le header
let lastScroll = 0;
const header = document.querySelector('.v2-header');

if (header) {
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    
    if (currentScroll > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  });
}
```

### 2.3 Smooth scroll pour les ancres

```javascript
// Smooth scroll pour les liens d'ancrage
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});
```

### 2.4 Parallax subtil (optionnel)

```javascript
// Parallax subtil pour le hero
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const hero = document.querySelector('.hero-visual');
  
  if (hero) {
    const speed = scrolled * 0.5;
    hero.style.transform = `translateY(${speed}px)`;
  }
});
```

### 2.5 Counter animation (pour les statistiques)

```javascript
// Animer les compteurs
function animateCounter(element, target, duration = 2000) {
  let start = 0;
  const increment = target / (duration / 16);
  
  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start);
    }
  }, 16);
}

// Utilisation avec Intersection Observer
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = parseInt(entry.target.dataset.target);
      animateCounter(entry.target, target);
      counterObserver.unobserve(entry.target);
    }
  });
});

document.querySelectorAll('.counter').forEach(counter => {
  counterObserver.observe(counter);
});
```

---

## 3. Exemples d'utilisation dans les templates

### 3.1 Hero section avec animations

```twig
{# Dans home/index.html.twig #}
<section class="hero">
    <div class="v2-container">
        <div class="hero-grid">
            <div class="hero-text animate-on-scroll">
                {# Contenu #}
            </div>
            <div class="hero-visual animate-on-scroll animate-on-scroll-delay-1">
                {# Image avec animation float #}
                <img src="..." alt="..." style="animation: softFloat 6s ease-in-out infinite;">
            </div>
        </div>
    </div>
</section>
```

### 3.2 Cartes avec hover effect

```twig
{# Cartes de fonctionnalités #}
<div class="feature-card card-interactive animate-on-scroll">
    <h3>Titre</h3>
    <p>Description</p>
</div>
```

### 3.3 Liens avec underline animé

```twig
{# Navigation ou liens #}
<a href="#" class="link-underline">Lien avec effet</a>
```

### 3.4 Boutons avec press effect

```twig
{# Boutons CTA #}
<a href="#" class="btn btn-primary btn-press">Action</a>
```

---

## 4. Optimisations performance

### 4.1 Utiliser will-change avec parcimonie

```css
/* À utiliser uniquement sur les éléments animés */
.hero-visual {
  will-change: transform;
}

/* Retirer will-change après l'animation */
.animate-on-scroll {
  will-change: opacity, transform;
}

.animate-on-scroll.animated {
  will-change: auto;
}
```

### 4.2 Utiliser transform au lieu de top/left

```css
/* ✅ Bon (GPU accelerated) */
.element {
  transform: translateY(-4px);
}

/* ❌ Éviter (reflow) */
.element {
  top: -4px;
}
```

### 4.3 Réduire les animations sur mobile

```css
/* Désactiver les animations complexes sur mobile */
@media (max-width: 768px) {
  .animate-on-scroll {
    animation: none;
    opacity: 1;
  }
  
  .hover-lift:hover {
    transform: none;
  }
}
```

### 4.4 Prefers-reduced-motion

```css
/* Respecter les préférences utilisateur */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 5. Checklist d'intégration

### Étape 1 : Ajouter les variables CSS
- [ ] Copier les variables dans `landing-v2-final.css`
- [ ] Vérifier la compatibilité avec les variables existantes

### Étape 2 : Ajouter les keyframes
- [ ] Copier les @keyframes dans le fichier CSS
- [ ] Tester chaque animation individuellement

### Étape 3 : Ajouter les classes utilitaires
- [ ] Implémenter `.animate-on-scroll`
- [ ] Implémenter `.hover-lift`
- [ ] Implémenter `.link-underline`
- [ ] Implémenter `.card-interactive`

### Étape 4 : Ajouter le JavaScript
- [ ] Créer un fichier `animations.js` ou ajouter dans le template
- [ ] Implémenter Intersection Observer
- [ ] Implémenter header scroll detection
- [ ] Tester sur différents navigateurs

### Étape 5 : Appliquer aux templates
- [ ] Ajouter les classes aux sections
- [ ] Tester les animations au scroll
- [ ] Vérifier les performances

### Étape 6 : Optimisations
- [ ] Ajouter `prefers-reduced-motion`
- [ ] Réduire les animations sur mobile
- [ ] Optimiser avec `will-change`
- [ ] Tester les performances (Lighthouse)

---

## 6. Notes importantes

### Performance
- ⚠️ Limiter le nombre d'éléments animés simultanément
- ⚠️ Utiliser `transform` et `opacity` (GPU accelerated)
- ⚠️ Éviter d'animer `width`, `height`, `top`, `left`

### Accessibilité
- ✅ Toujours respecter `prefers-reduced-motion`
- ✅ S'assurer que les animations ne sont pas essentielles
- ✅ Tester avec un lecteur d'écran

### Compatibilité
- ✅ Tester sur Chrome, Firefox, Safari, Edge
- ✅ Vérifier sur mobile (iOS, Android)
- ✅ Tester avec différentes tailles d'écran

---

**Document créé le :** 24 janvier 2026  
**Version :** 1.0  
**Usage :** Code prêt à l'emploi pour améliorer les animations de Dorevia-Vault

# SPEC DESIGN SYSTÈME — Landing Page Dorevia-Vault v3.0

**Version** : v3.0  
**Date** : 2026-01-20  
**Statut** : Final  
**Base** : SPEC Landing Page v3.0 + Wireframe v1.0

---

## 1. Design Tokens

### 1.1 Couleurs

#### Couleurs primaires

```css
:root {
    /* Bleu Dorevia */
    --color-primary: #2f57d7;
    --color-primary-dark: #1e40af;
    --color-primary-light: #3b82f6;
    --color-primary-lighter: #60a5fa;
    
    /* Bleu gradient */
    --color-gradient-start: #2f57d7;
    --color-gradient-end: #1e40af;
}
```

#### Couleurs secondaires

```css
:root {
    /* Jaune accent */
    --color-accent: #fbbf24;
    --color-accent-dark: #f59e0b;
    
    /* Gris neutres */
    --color-gray-50: #f8fafc;
    --color-gray-100: #f1f5f9;
    --color-gray-200: #e2e8f0;
    --color-gray-300: #cbd5e1;
    --color-gray-400: #94a3b8;
    --color-gray-500: #64748b;
    --color-gray-600: #475569;
    --color-gray-700: #334155;
    --color-gray-800: #1e293b;
    --color-gray-900: #0f172a;
}
```

#### Couleurs sémantiques

```css
:root {
    /* Texte */
    --color-text-primary: #1e293b;
    --color-text-secondary: #64748b;
    --color-text-tertiary: #94a3b8;
    --color-text-inverse: #ffffff;
    
    /* Backgrounds */
    --color-bg-primary: #ffffff;
    --color-bg-secondary: #f8fafc;
    --color-bg-hero: #2f57d7;
    --color-bg-overlay: rgba(15, 23, 42, 0.5);
    
    /* États */
    --color-success: #10b981;
    --color-error: #ef4444;
    --color-warning: #f59e0b;
    --color-info: #3b82f6;
}
```

#### Contraste WCAG

**Texte sur fond clair** :
- Texte principal : `#1e293b` sur `#ffffff` = **12.6:1** ✅ AAA
- Texte secondaire : `#64748b` sur `#ffffff` = **4.8:1** ✅ AA

**Texte sur fond sombre** :
- Texte inverse : `#ffffff` sur `#2f57d7` = **4.2:1** ✅ AA
- Texte accent : `#fbbf24` sur `#2f57d7` = **3.1:1** ⚠️ (utiliser uniquement pour accents)

---

### 1.2 Typographie

#### Familles de polices

```css
:root {
    /* Police principale */
    --font-family-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    
    /* Police monospace (code) */
    --font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
}
```

#### Tailles de police

```css
:root {
    /* Headings */
    --font-size-h1: clamp(2.5rem, 6vw, 4rem);      /* 40-64px */
    --font-size-h2: clamp(2rem, 4vw, 3rem);        /* 32-48px */
    --font-size-h3: clamp(1.5rem, 3vw, 2rem);      /* 24-32px */
    --font-size-h4: clamp(1.25rem, 2vw, 1.5rem);   /* 20-24px */
    
    /* Body */
    --font-size-base: 1rem;                        /* 16px */
    --font-size-lg: 1.125rem;                      /* 18px */
    --font-size-sm: 0.875rem;                      /* 14px */
    --font-size-xs: 0.75rem;                       /* 12px */
}
```

#### Line heights

```css
:root {
    --line-height-tight: 1.2;
    --line-height-normal: 1.5;
    --line-height-relaxed: 1.75;
    --line-height-loose: 2;
}
```

#### Font weights

```css
:root {
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
    --font-weight-extrabold: 800;
    --font-weight-black: 900;
}
```

#### Letter spacing

```css
:root {
    --letter-spacing-tight: -0.02em;
    --letter-spacing-normal: 0;
    --letter-spacing-wide: 0.05em;
}
```

---

### 1.3 Espacements

#### Spacing scale

```css
:root {
    --spacing-0: 0;
    --spacing-1: 0.25rem;   /* 4px */
    --spacing-2: 0.5rem;     /* 8px */
    --spacing-3: 0.75rem;    /* 12px */
    --spacing-4: 1rem;       /* 16px */
    --spacing-5: 1.25rem;    /* 20px */
    --spacing-6: 1.5rem;     /* 24px */
    --spacing-8: 2rem;       /* 32px */
    --spacing-10: 2.5rem;    /* 40px */
    --spacing-12: 3rem;      /* 48px */
    --spacing-16: 4rem;      /* 64px */
    --spacing-20: 5rem;      /* 80px */
    --spacing-24: 6rem;      /* 96px */
}
```

#### Padding sections

```css
:root {
    --section-padding-y: 5rem;        /* 80px desktop */
    --section-padding-y-mobile: 3.75rem; /* 60px mobile */
    --section-padding-x: 1.25rem;      /* 20px */
}
```

#### Gaps

```css
:root {
    --gap-xs: 0.5rem;      /* 8px */
    --gap-sm: 1rem;        /* 16px */
    --gap-md: 1.5rem;      /* 24px */
    --gap-lg: 2rem;        /* 32px */
    --gap-xl: 3rem;        /* 48px */
}
```

---

### 1.4 Bordures

#### Border radius

```css
:root {
    --radius-none: 0;
    --radius-sm: 0.25rem;    /* 4px */
    --radius-md: 0.5rem;     /* 8px */
    --radius-lg: 0.75rem;    /* 12px */
    --radius-xl: 1rem;       /* 16px */
    --radius-2xl: 1.5rem;    /* 24px */
    --radius-full: 9999px;   /* Pill */
}
```

#### Border width

```css
:root {
    --border-width-0: 0;
    --border-width-1: 1px;
    --border-width-2: 2px;
    --border-width-4: 4px;
}
```

---

### 1.5 Ombres

```css
:root {
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

---

### 1.6 Transitions

```css
:root {
    --transition-fast: 150ms;
    --transition-base: 200ms;
    --transition-slow: 300ms;
    --transition-slower: 500ms;
    
    --easing-linear: linear;
    --easing-ease-in: ease-in;
    --easing-ease-out: ease-out;
    --easing-ease-in-out: ease-in-out;
    --easing-cubic: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 2. Composants UI

### 2.1 Boutons

#### Bouton primaire

```css
.ud-main-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.5;
    color: #ffffff;
    background-color: var(--color-primary);
    border: none;
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-base) var(--easing-cubic);
    text-decoration: none;
}

.ud-main-btn:hover {
    background-color: var(--color-primary-dark);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.ud-main-btn:focus {
    outline: 3px solid var(--color-accent);
    outline-offset: 2px;
}

.ud-main-btn:active {
    transform: translateY(0);
}
```

#### Bouton blanc (sur fond sombre)

```css
.ud-white-btn {
    background-color: #ffffff;
    color: var(--color-primary);
}

.ud-white-btn:hover {
    background-color: var(--color-gray-50);
    color: var(--color-primary-dark);
}
```

#### Bouton secondaire

```css
.ud-secondary-btn {
    background-color: transparent;
    color: var(--color-primary);
    border: 2px solid var(--color-primary);
}

.ud-secondary-btn:hover {
    background-color: var(--color-primary);
    color: #ffffff;
}
```

#### États boutons

```css
/* Disabled */
.ud-main-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
}

/* Loading */
.ud-main-btn.loading {
    position: relative;
    color: transparent;
}

.ud-main-btn.loading::after {
    content: '';
    position: absolute;
    width: 1rem;
    height: 1rem;
    top: 50%;
    left: 50%;
    margin-left: -0.5rem;
    margin-top: -0.5rem;
    border: 2px solid currentColor;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 0.6s linear infinite;
}
```

---

### 2.2 Cartes

#### Carte de base

```css
.card {
    background-color: var(--color-bg-primary);
    border-radius: var(--radius-xl);
    padding: 2rem;
    box-shadow: var(--shadow-md);
    transition: all var(--transition-base) var(--easing-cubic);
}

.card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
}
```

#### Carte avec icône

```css
.card-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    text-align: center;
}

.card-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 0.5rem;
    text-align: center;
}

.card-desc {
    font-size: 1rem;
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    text-align: center;
}
```

---

### 2.3 Badges

#### Badge souveraineté

```css
.hero-badge {
    display: inline-block;
    padding: 0.5rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #ffffff;
    background-color: rgba(255, 255, 255, 0.18);
    border-radius: var(--radius-full);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}
```

#### Badge conformité

```css
.compliance-badge {
    display: inline-block;
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-primary);
    background-color: var(--color-gray-100);
    border-radius: var(--radius-md);
}
```

---

### 2.4 Formulaires

#### Input

```css
.form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    line-height: 1.5;
    color: var(--color-text-primary);
    background-color: var(--color-bg-primary);
    border: 2px solid var(--color-gray-300);
    border-radius: var(--radius-md);
    transition: all var(--transition-base) var(--easing-cubic);
}

.form-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(47, 87, 215, 0.1);
}

.form-input::placeholder {
    color: var(--color-text-tertiary);
}

.form-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

#### Label

```css
.form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 0.5rem;
}
```

#### Message d'erreur

```css
.form-error {
    display: block;
    font-size: 0.875rem;
    color: var(--color-error);
    margin-top: 0.25rem;
}
```

---

## 3. Layout

### 3.1 Container

```css
.container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.25rem;
}

@media (min-width: 576px) {
    .container {
        max-width: 540px;
    }
}

@media (min-width: 768px) {
    .container {
        max-width: 720px;
    }
}

@media (min-width: 992px) {
    .container {
        max-width: 960px;
    }
}

@media (min-width: 1200px) {
    .container {
        max-width: 1200px;
    }
}
```

### 3.2 Sections

```css
.ud-section {
    padding: var(--section-padding-y) 0;
}

@media (max-width: 767.98px) {
    .ud-section {
        padding: var(--section-padding-y-mobile) 0;
    }
}
```

---

## 4. Responsive Breakpoints

```css
/* Mobile first */
:root {
    --breakpoint-sm: 576px;
    --breakpoint-md: 768px;
    --breakpoint-lg: 992px;
    --breakpoint-xl: 1200px;
    --breakpoint-2xl: 1400px;
}

/* Media queries */
@media (min-width: 576px) { /* Small devices */ }
@media (min-width: 768px) { /* Medium devices */ }
@media (min-width: 992px) { /* Large devices */ }
@media (min-width: 1200px) { /* Extra large devices */ }
```

---

## 5. Animations

### 5.1 Fade in

```css
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.fade-in {
    animation: fadeIn var(--transition-slow) var(--easing-ease-out);
}
```

### 5.2 Slide up

```css
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.slide-up {
    animation: slideUp var(--transition-slow) var(--easing-ease-out);
}
```

### 5.3 Spin (loading)

```css
@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
```

---

## 6. États des composants

### 6.1 Hover

```css
.hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
}

.hover-scale:hover {
    transform: scale(1.05);
}
```

### 6.2 Focus

```css
.focus-ring:focus {
    outline: 3px solid var(--color-accent);
    outline-offset: 2px;
}
```

### 6.3 Active

```css
.active-press:active {
    transform: translateY(0) scale(0.98);
}
```

---

## 7. Accessibilité

### 7.1 Reduced motion

```css
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

### 7.2 Focus visible

```css
:focus-visible {
    outline: 3px solid var(--color-accent);
    outline-offset: 2px;
}
```

---

## 8. Checklist implémentation

### Design tokens
- [ ] Couleurs définies et testées (contraste WCAG)
- [ ] Typographie complète (tailles, weights, line-heights)
- [ ] Espacements cohérents
- [ ] Bordures et ombres définies
- [ ] Transitions standardisées

### Composants
- [ ] Boutons (tous états)
- [ ] Cartes (hover, focus)
- [ ] Badges
- [ ] Formulaires (inputs, labels, erreurs)
- [ ] Navigation

### Layout
- [ ] Container responsive
- [ ] Sections avec padding cohérent
- [ ] Grid system

### Responsive
- [ ] Breakpoints définis
- [ ] Mobile first implémenté
- [ ] Tous breakpoints testés

### Accessibilité
- [ ] Reduced motion supporté
- [ ] Focus visible
- [ ] Contraste WCAG AA

---

**Fin de la SPEC Design Système v3.0**

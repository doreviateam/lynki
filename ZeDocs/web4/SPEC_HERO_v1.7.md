
# SPEC OFFICIELLE — HERO Dorevia-Vault v1.7
**Date** : 2026-01-18  
**Statut** : 🟢 **Phase 1, 2 & 3 complétées**  
**Base** : v1.6  
**Auteur** : Dorevia Team  
**Scope** : Header + Hero uniquement  

---

# 1. Contexte

Cette version v1.7 formalise les **améliorations techniques et UX** issues de l’audit réalisé sur le Hero v1.6.

Objectif :
- Pérenniser le code
- Améliorer l’accessibilité
- Optimiser les performances
- Préparer l’évolutivité produit

---

# 2. État actuel (v1.6)

Le Hero :
- Remplit son rôle business
- Message clair
- Schéma pédagogique
- Full viewport fonctionnel

Dette technique identifiée :
- Styles inline massifs
- `onclick` inline
- Resize non debounced
- Animations non contrôlées

---

# 3. Dette technique

| Problème | Impact |
|-----------|--------|
| Styles inline | Maintenance difficile |
| `onclick` | Risque XSS |
| WOW.js | Reflows |
| Pas de preload | Performance |
| Pas de prefers-reduced-motion | Accessibilité |
| Pas de tests E2E | Régressions possibles |

---

# 4. Roadmap d’amélioration

## Phase 1 — Refactor critique (P0) ✅

- [x] Extraire tous les styles inline vers CSS
- [x] Créer un fichier `hero.css`
- [x] Supprimer `onclick`
- [x] Ajouter listeners JS propres
- [x] Ajouter focus visible
- [x] Debounce resize

## Phase 2 — UX & Responsive (P1) ✅

- [x] Hover cards
- [x] clamp() fonts
- [x] Breakpoints intermédiaires
- [x] Loading state CTA
- [x] prefers-reduced-motion

## Phase 3 — Qualité produit (P2) ✅

- [x] Lighthouse > 90 (preload CSS, optimisations)
- [x] Tests Cypress
- [x] Lazy loading sections
- [x] Tracking scroll

---

# 5. Architecture cible

```
/assets/css/hero.css
/assets/js/hero.js
/templates/home/index.html.twig
```

---

# 6. Patch CSS (hero.css)

```css
.hero-badge { ... }
.hero-product-name { ... }
.hero-title { ... }
.hero-desc { ... }
.hero-schema { ... }
.schema-card { ... }
.step-badge { ... }

/* Focus */
.hero-cta:focus {
  outline: 3px solid #fbbf24;
}

/* Motion */
@media (prefers-reduced-motion: reduce) {
  .wow { animation: none; }
}

/* Hover */
.schema-card {
  transition: transform .3s ease, box-shadow .3s ease;
}
.schema-card:hover {
  transform: translateY(-4px);
}
```

---

# 7. Patch JS (hero.js)

```javascript
function setHeaderHeightVar() {
  const header = document.querySelector('.ud-header');
  if (!header) return;
  document.documentElement.style.setProperty(
    '--header-h',
    header.offsetHeight + 'px'
  );
}

function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

document.addEventListener('DOMContentLoaded', setHeaderHeightVar);
window.addEventListener('resize', debounce(setHeaderHeightVar,150));

/* Tracking */
document.querySelectorAll('.hero-cta').forEach(btn => {
  btn.addEventListener('click', () => {
    if(window.trackEvent){
      trackEvent('CTA','click','hero');
    }
  });
});
```

---

# 8. Accessibilité

- ARIA labels
- Focus visible
- Respect reduced-motion
- Contraste WCAG AA

---

# 9. Tests

Scénarios Cypress :

- Hero visible au load
- Menu + hero = 100vh
- CTA cliquables
- Mobile OK

---

# 10. KPIs

- Taux clic CTA
- Temps passé hero
- Scroll depth

---

# 11. Checklist release

- [ ] CSS externalisé
- [ ] JS propre
- [ ] Lighthouse OK
- [ ] Tests verts
- [ ] Validation UX

---

# 12. Statut

| Élément | Statut |
|--------|--------|
| Copywriting | ✅ |
| Layout | ✅ |
| CSS refactor | ✅ |
| JS refactor | ✅ |
| Responsive (clamp + breakpoints) | ✅ |
| Lazy loading | ✅ |
| Tracking scroll | ✅ |
| Tests Cypress | ✅ |
| Lighthouse optimisations | ✅ |

---

**Fin SPEC v1.7**

# 🔍 Analyse de Cohérence Technique — Site Dorevia-Vault

**Date** : 2026-01-19  
**Objectif** : Rendre le site techniquement cohérent  
**Portée** : Structure, templates, assets, configuration

---

## 📊 État des lieux

### 1. Structure des Templates

#### ✅ Points positifs
- Structure claire : `templates/` avec sous-dossiers par fonctionnalité
- Composants réutilisables : `components/whatsapp-button.html.twig`
- Layout centralisé : `layout.html.twig`

#### ⚠️ Problèmes identifiés

**1.1 Templates dupliqués/redondants**
```
templates/
├── home/index.html.twig          ✅ Actif (HomeController)
├── landing/index.html.twig       ⚠️  Redondant ? (LandingController redirecte)
├── landing/index_old.html.twig  ❌ Fichier obsolète
├── landing/index.html.twig.backup ❌ Backup à supprimer
└── base.html.twig                ⚠️  Non utilisé ?
```

**Action** : 
- Vérifier si `landing/index.html.twig` est utilisé
- Supprimer les fichiers obsolètes
- Clarifier `base.html.twig` vs `layout.html.twig`

**1.2 Incohérence d'extension**
- `home/index.html.twig` : `extends 'layout.html.twig'` ✅
- `landing/index.html.twig` : À vérifier
- `base.html.twig` : Rôle non clair

---

### 2. Contrôleurs et Routes

#### ⚠️ Problèmes identifiés

**2.1 Redondance LandingController / HomeController**
```php
// LandingController.php
#[Route('/landing', name: 'landing')]
public function index(): Response {
    return $this->redirectToRoute('home', [], 301);
}

// HomeController.php
#[Route('/accueil', name: 'home')]
#[Route('/', name: 'home_redirect')] // Redirect vers /accueil
```

**Problème** : Double redirection inutile (`/` → `/accueil`, `/landing` → `/accueil`)

**Action** : 
- Supprimer `LandingController` si non utilisé
- Simplifier les routes

**2.2 Routes multiples pour même fonctionnalité**
- `PricingController` et `PricingPageController` : Redondance ?

---

### 3. Organisation des Assets CSS

#### ⚠️ Problèmes identifiés

**3.1 Structure CSS fragmentée**
```
css/
├── bootstrap.min.css          ✅ Framework
├── animate.css                ✅ Animations
├── lineicons.css              ✅ Icônes
├── ud-styles.css              ✅ Styles globaux (compilé depuis SCSS)
├── hero.css                   ⚠️  Section spécifique
├── section-comment.css        ⚠️  Section spécifique
├── status-cards.css           ⚠️  Section spécifique
└── whatsapp-button.css        ⚠️  Composant spécifique
```

**Problème** : Pas de structure claire (global vs section vs composant)

**Action** : Réorganiser en :
```
css/
├── vendor/              (bootstrap, animate, lineicons)
├── base/                (ud-styles, variables)
├── components/          (whatsapp-button, status-cards)
└── sections/            (hero, section-comment)
```

**3.2 Chargement CSS dans layout.html.twig**
- CSS chargé dans `layout.html.twig` (global)
- CSS additionnel dans `home/index.html.twig` (block stylesheets)
- **Incohérence** : Certains CSS chargés globalement, d'autres par page

**Action** : Standardiser le chargement

---

### 4. Organisation des Assets JavaScript

#### ⚠️ Problèmes identifiés

**4.1 Structure JS fragmentée**
```
js/
├── bootstrap.bundle.min.js    ✅ Framework
├── wow.min.js                 ✅ Animations
├── main.js                    ⚠️  Fonctions globales ?
├── hero.js                    ⚠️  Section spécifique
├── hero-analytics.js          ⚠️  Analytics spécifique
├── status-cards.js            ⚠️  Composant spécifique
├── header-auto-hide.js        ⚠️  Composant spécifique
└── whatsapp-button.js         ⚠️  Composant spécifique
```

**Problème** : Pas de structure claire

**Action** : Réorganiser en :
```
js/
├── vendor/              (bootstrap, wow)
├── core/                (main.js, analytics)
├── components/          (whatsapp-button, status-cards, header-auto-hide)
└── sections/           (hero)
```

**4.2 Chargement JS**
- Tous les JS chargés dans `layout.html.twig` (global)
- Pas de lazy loading
- Pas de condition de chargement par page

**Action** : Optimiser le chargement (lazy, conditionnel)

---

### 5. Configuration et Variables

#### ⚠️ Problèmes identifiés

**5.1 Numéro WhatsApp hardcodé**
```javascript
// whatsapp-button.js ligne 10
const WHATSAPP_NUMBER = '594690123456'; // Hardcodé
```

**Problème** : Devrait être une variable d'environnement ou config Symfony

**Action** : 
- Créer variable d'environnement `WHATSAPP_NUMBER`
- Injecter via Twig dans le template

**5.2 Google Analytics ID hardcodé**
```twig
{# layout.html.twig ligne 31 #}
gtag('config', 'G-XXXXXXXXXX', {...});
```

**Problème** : ID placeholder, pas de configuration

**Action** : Variable d'environnement `GA_MEASUREMENT_ID`

---

### 6. Accessibilité

#### ⚠️ Problèmes identifiés

**6.1 ARIA labels incohérents**
- Bouton WhatsApp : `aria-label="Contacter via WhatsApp"` ✅
- Header navigation : Pas d'ARIA labels sur les liens
- Status cards : ARIA labels présents ✅
- Back to top : Pas d'ARIA label

**Action** : Auditer et uniformiser tous les ARIA labels

**6.2 Navigation clavier**
- Bouton WhatsApp : Support clavier ✅
- Status cards : Support clavier ✅
- Header : À vérifier

---

### 7. Performance

#### ⚠️ Problèmes identifiés

**7.1 Preload CSS partiel**
```twig
{# layout.html.twig #}
<link rel="preload" href="{{ asset('assets/css/bootstrap.min.css') }}" as="style" />
<link rel="preload" href="{{ asset('assets/css/ud-styles.css') }}" as="style" />
```

**Problème** : Pas de preload pour les CSS critiques additionnels (hero.css, etc.)

**Action** : Ajouter preload pour CSS critiques par page

**7.2 Chargement JS non optimisé**
- Tous les JS chargés sur toutes les pages
- Pas de `defer`/`async` cohérent
- Pas de lazy loading

**Action** : Optimiser le chargement JS

**7.3 Images non optimisées**
- Pas de lazy loading d'images
- Pas de format WebP
- Pas de responsive images (srcset)

---

### 8. SEO

#### ⚠️ Problèmes identifiés

**8.1 Meta robots noindex**
```twig
{# layout.html.twig ligne 12 #}
<meta name="robots" content="noindex, nofollow">
```

**Problème** : Site en noindex (normal pour lab, mais à vérifier pour prod)

**Action** : Conditionner selon environnement

**8.2 Meta tags par page**
- `home/index.html.twig` : Meta tags via variables ✅
- Autres pages : À vérifier

**Action** : Auditer toutes les pages

---

### 9. Sécurité

#### ⚠️ Problèmes identifiés

**9.1 CSP (Content Security Policy)**
- Pas de CSP headers visibles
- Scripts inline (Google Analytics)

**Action** : Implémenter CSP

**9.2 External scripts**
- Google Analytics : Script externe ✅
- Pas de SRI (Subresource Integrity) pour scripts externes

**Action** : Ajouter SRI si possible

---

### 10. Code Quality

#### ⚠️ Problèmes identifiés

**10.1 Commentaires et documentation**
- Code bien commenté ✅
- Mais pas de documentation globale de l'architecture

**Action** : Créer README technique

**10.2 Duplication de code**
- Styles inline dans templates (ex: `style="..."`)
- Logique JS dupliquée potentiellement

**Action** : Auditer et factoriser

---

## 🎯 Plan d'Action Priorisé

### P0 — Critique (À faire immédiatement)

1. **Supprimer fichiers obsolètes**
   - `landing/index_old.html.twig`
   - `landing/index.html.twig.backup`
   - Vérifier et supprimer `LandingController` si non utilisé

2. **Clarifier structure templates**
   - Définir rôle de `base.html.twig` vs `layout.html.twig`
   - Standardiser l'extension des templates

3. **Configurer variables d'environnement**
   - `WHATSAPP_NUMBER`
   - `GA_MEASUREMENT_ID`

### P1 — Important (Cette semaine)

4. **Réorganiser assets CSS/JS**
   - Créer structure claire (vendor/base/components/sections)
   - Mettre à jour les imports

5. **Optimiser chargement assets**
   - Preload CSS critiques
   - Lazy load JS non critiques
   - Conditionner chargement par page

6. **Uniformiser accessibilité**
   - Auditer tous les ARIA labels
   - Vérifier navigation clavier partout

### P2 — Amélioration (Ce mois)

7. **Performance**
   - Lazy loading images
   - Optimisation images (WebP)
   - Minification CSS/JS en prod

8. **SEO**
   - Conditionner meta robots selon environnement
   - Auditer meta tags toutes pages
   - Sitemap complet

9. **Sécurité**
   - Implémenter CSP
   - Ajouter SRI si possible

---

## 📝 Checklist de Cohérence

### Templates
- [ ] Un seul layout principal (`layout.html.twig`)
- [ ] Tous les templates étendent le layout
- [ ] Pas de fichiers obsolètes
- [ ] Structure claire et logique

### Assets CSS
- [ ] Structure organisée (vendor/base/components/sections)
- [ ] Chargement cohérent (global vs page)
- [ ] Preload CSS critiques
- [ ] Pas de duplication

### Assets JS
- [ ] Structure organisée
- [ ] Chargement optimisé (defer/async)
- [ ] Lazy loading si possible
- [ ] Pas de duplication

### Configuration
- [ ] Variables d'environnement pour configs sensibles
- [ ] Pas de valeurs hardcodées
- [ ] Configuration centralisée

### Accessibilité
- [ ] ARIA labels partout
- [ ] Navigation clavier fonctionnelle
- [ ] Contraste WCAG AA
- [ ] `prefers-reduced-motion` respecté

### Performance
- [ ] Preload assets critiques
- [ ] Lazy load non critiques
- [ ] Images optimisées
- [ ] Minification en prod

### SEO
- [ ] Meta tags complets toutes pages
- [ ] Robots.txt selon environnement
- [ ] Sitemap à jour

### Sécurité
- [ ] CSP headers
- [ ] SRI si possible
- [ ] Pas de scripts inline non sécurisés

---

## 🚀 Prochaines Étapes

1. **Créer document de spécification technique** (architecture, conventions)
2. **Implémenter corrections P0**
3. **Réorganiser assets (P1)**
4. **Audit complet accessibilité (P1)**
5. **Optimisations performance (P2)**

---

**Fin de l'analyse**

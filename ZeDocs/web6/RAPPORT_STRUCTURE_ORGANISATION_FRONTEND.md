# 📊 Rapport — Structure et Organisation du Code Frontend
## Dorevia-Vault Landing Page

**Date :** 2026-01-21  
**Projet :** Landing Page Dorevia-Vault  
**Framework :** Symfony 6 + Twig  
**Statut :** Analyse complète

---

## 📁 Structure actuelle des fichiers

### 1. Organisation des répertoires

```
units/sylius/
├── public/assets/
│   ├── css/              (11 fichiers CSS)
│   ├── js/               (10 fichiers JS)
│   ├── images/           (organisé par section)
│   ├── fonts/            (LineIcons)
│   └── scss/             (fichiers sources SCSS - non utilisés actuellement)
├── templates/
│   ├── layout.html.twig  (layout principal)
│   ├── base.html.twig    (layout de base Symfony)
│   ├── home/
│   │   └── index.html.twig (page d'accueil)
│   ├── components/       (composants réutilisables)
│   └── [autres pages]/
└── src/
    └── Controller/        (contrôleurs Symfony)
```

---

## 🎨 Organisation CSS

### Structure actuelle

```
public/assets/css/
├── bootstrap.min.css          ✅ Vendor (framework)
├── animate.css                ✅ Vendor (animations)
├── lineicons.css              ✅ Vendor (icônes)
├── ud-styles.css              ✅ Base (styles globaux compilés)
├── design-tokens.css          ✅ Base (tokens de design)
├── hero.css                   ⚠️  Section spécifique
├── landing-v3.css             ⚠️  Section spécifique (très volumineux)
├── section-comment.css        ⚠️  Section spécifique
├── status-cards.css           ⚠️  Composant
├── whatsapp-button.css        ⚠️  Composant
└── hero-carousel.css          ⚠️  Section spécifique
```

### Chargement CSS

**Dans `layout.html.twig` (global) :**
```twig
{# CSS Vendor #}
- bootstrap.min.css
- animate.css
- lineicons.css

{# CSS Base #}
- ud-styles.css

{# CSS Components #}
- whatsapp-button.css
```

**Dans `home/index.html.twig` (par page) :**
```twig
{% block stylesheets %}
- design-tokens.css
- landing-v3.css
- hero.css
- section-comment.css
{% endblock %}
```

### ⚠️ Problèmes identifiés

1. **Pas de structure claire** : Tous les fichiers CSS sont à la racine de `/css/`
2. **Mélange de responsabilités** : Vendor, base, components et sections mélangés
3. **Fichier `landing-v3.css` trop volumineux** : ~2400 lignes, mélange plusieurs sections
4. **Duplication potentielle** : Styles qui pourraient être partagés
5. **Chargement incohérent** : Certains CSS chargés globalement, d'autres par page

---

## 📜 Organisation JavaScript

### Structure actuelle

```
public/assets/js/
├── bootstrap.bundle.min.js    ✅ Vendor (framework)
├── wow.min.js                 ✅ Vendor (animations)
├── main.js                    ⚠️  Core (fonctions globales)
├── smooth-scroll.js           ⚠️  Core (fonction utilitaire)
├── hero.js                    ⚠️  Section spécifique
├── hero-analytics.js          ⚠️  Section spécifique
├── hero-carousel.js           ⚠️  Section spécifique
├── landing-v3.js             ⚠️  Section spécifique
├── header-auto-hide.js        ⚠️  Composant (désactivé)
├── status-cards.js            ⚠️  Composant
└── whatsapp-button.js         ⚠️  Composant
```

### Chargement JavaScript

**Dans `layout.html.twig` (global) :**
```twig
{# JS Vendor #}
- bootstrap.bundle.min.js
- wow.min.js

{# JS Core #}
- main.js

{# JS Components #}
- whatsapp-button.js
- header-auto-hide.js (commenté/désactivé)
```

**Dans `home/index.html.twig` (par page) :**
```twig
{% block javascripts %}
- landing-v3.js
{% endblock %}
```

### ⚠️ Problèmes identifiés

1. **Pas de structure claire** : Tous les fichiers JS sont à la racine de `/js/`
2. **Séparation floue** : Difficile de distinguer core, components et sections
3. **Fichiers hero multiples** : `hero.js`, `hero-analytics.js`, `hero-carousel.js` (pourrait être consolidé)
4. **Chargement incohérent** : Certains JS chargés globalement, d'autres par page

---

## 📄 Organisation des Templates

### Structure actuelle

```
templates/
├── layout.html.twig           ✅ Layout principal (header, footer, structure)
├── base.html.twig             ✅ Layout de base Symfony (non utilisé)
├── home/
│   └── index.html.twig        ✅ Page d'accueil (landing page)
├── components/
│   └── whatsapp-button.html.twig  ✅ Composant réutilisable
├── blog/
│   ├── index.html.twig
│   └── show.html.twig
├── contact/
│   └── index.html.twig
├── features/
│   └── index.html.twig
├── how-it-works/
│   └── index.html.twig
├── pricing/
│   └── index.html.twig
└── privacy/
    └── index.html.twig
```

### ⚠️ Problèmes identifiés

1. **Template `home/index.html.twig` très volumineux** : ~730 lignes
2. **Pas de composants réutilisables** : Sections répétées dans le template principal
3. **Mélange de responsabilités** : HTML, structure, contenu tout mélangé
4. **Pas de partials** : Sections qui pourraient être extraites en composants

---

## 🔍 Analyse détaillée

### 1. Fichier `landing-v3.css` (problématique)

**Taille :** ~2400 lignes  
**Contenu :**
- Styles pour section Défis
- Styles pour section Solution
- Styles pour section Pour qui
- Styles pour section Cas d'usage
- Styles pour section Conformité
- Styles pour section Contact
- Styles globaux mélangés

**Problème :** Un seul fichier contient tous les styles de toutes les sections, rendant la maintenance difficile.

**Recommandation :** Séparer en fichiers par section :
- `sections/defis.css`
- `sections/solution.css`
- `sections/pour-qui.css`
- etc.

### 2. Fichier `home/index.html.twig` (problématique)

**Taille :** ~730 lignes  
**Contenu :**
- Hero section
- Section Défis
- Section Solution
- Section Pour qui
- Section Cas d'usage
- Section Conformité
- Section Contact
- Footer

**Problème :** Tout le contenu de la landing page dans un seul fichier.

**Recommandation :** Extraire chaque section en composant/partial :
- `components/sections/hero.html.twig`
- `components/sections/defis.html.twig`
- `components/sections/solution.html.twig`
- etc.

### 3. Chargement des assets

**Problème :** Incohérence entre chargement global et par page.

**Actuel :**
- CSS Vendor/Base/Components → `layout.html.twig` (global)
- CSS Sections → `home/index.html.twig` (par page)
- JS Vendor/Core/Components → `layout.html.twig` (global)
- JS Sections → `home/index.html.twig` (par page)

**Recommandation :** Standardiser le chargement :
- Vendor/Base toujours global
- Components/Sections toujours par page (via blocks)

---

## ✅ Points positifs

1. **Séparation logique dans `layout.html.twig`** : Commentaires clairs (Vendor, Base, Components, Sections)
2. **Utilisation de blocks Twig** : `{% block stylesheets %}` et `{% block javascripts %}` pour l'extensibilité
3. **Preload CSS critiques** : Optimisation pour Lighthouse
4. **Versioning des assets** : Paramètre `?v=20260121` pour forcer le rechargement
5. **Composants réutilisables** : `whatsapp-button.html.twig` comme exemple

---

## 🎯 Recommandations

### Priorité 1 : Réorganisation CSS

**Action :** Créer une structure claire

```
public/assets/css/
├── vendor/
│   ├── bootstrap.min.css
│   ├── animate.css
│   └── lineicons.css
├── base/
│   ├── design-tokens.css
│   └── ud-styles.css
├── components/
│   ├── whatsapp-button.css
│   └── status-cards.css
└── sections/
    ├── hero.css
    ├── defis.css
    ├── solution.css
    ├── pour-qui.css
    ├── cas-usage.css
    ├── conformite.css
    ├── contact.css
    └── section-comment.css
```

**Avantages :**
- Structure claire et maintenable
- Facilite la localisation des styles
- Permet le chargement conditionnel par section

### Priorité 2 : Réorganisation JavaScript

**Action :** Créer une structure claire

```
public/assets/js/
├── vendor/
│   ├── bootstrap.bundle.min.js
│   └── wow.min.js
├── core/
│   ├── main.js
│   └── smooth-scroll.js
├── components/
│   ├── whatsapp-button.js
│   ├── header-auto-hide.js
│   └── status-cards.js
└── sections/
    ├── hero.js (consolider hero-analytics.js et hero-carousel.js)
    └── landing-v3.js
```

**Avantages :**
- Structure claire et maintenable
- Consolidation des fichiers hero
- Facilite la localisation des scripts

### Priorité 3 : Extraction des sections en composants

**Action :** Extraire les sections du template principal

```
templates/
├── layout.html.twig
├── home/
│   └── index.html.twig (orchestration)
└── components/
    ├── sections/
    │   ├── hero.html.twig
    │   ├── defis.html.twig
    │   ├── solution.html.twig
    │   ├── pour-qui.html.twig
    │   ├── cas-usage.html.twig
    │   ├── conformite.html.twig
    │   └── contact.html.twig
    └── whatsapp-button.html.twig
```

**Avantages :**
- Templates plus maintenables
- Réutilisabilité des sections
- Facilite les tests et la maintenance

### Priorité 4 : Standardisation du chargement

**Action :** Créer un système de chargement cohérent

**Dans `layout.html.twig` :**
```twig
{# CSS Vendor - toujours global #}
{# CSS Base - toujours global #}
{# CSS Components - toujours global #}
{% block stylesheets %}
  {# CSS Sections - chargés par page #}
{% endblock %}
```

**Dans `home/index.html.twig` :**
```twig
{% block stylesheets %}
  {{ parent() }}
  <link rel="stylesheet" href="{{ asset('assets/css/sections/hero.css') }}" />
  <link rel="stylesheet" href="{{ asset('assets/css/sections/defis.css') }}" />
  {# etc. #}
{% endblock %}
```

---

## 📊 Métriques actuelles

### Fichiers CSS
- **Total :** 11 fichiers
- **Lignes totales :** 10 188 lignes
- **Plus gros fichier :** `landing-v3.css` (55 KB, ~2400 lignes)
- **Taille totale :** ~150 KB (estimé)

### Fichiers JavaScript
- **Total :** 10 fichiers
- **Plus gros fichier :** `main.js` (5.2 KB)
- **Taille totale :** ~200 KB (estimé)

### Templates
- **Total :** ~15 fichiers
- **Plus gros fichier :** `home/index.html.twig` (728 lignes)

---

## 🔄 Plan d'action recommandé

### Phase 1 : Réorganisation CSS (1-2 jours)
1. Créer la structure de dossiers (`vendor/`, `base/`, `components/`, `sections/`)
2. Déplacer les fichiers existants
3. Découper `landing-v3.css` en fichiers par section
4. Mettre à jour les références dans les templates

### Phase 2 : Réorganisation JavaScript (1 jour)
1. Créer la structure de dossiers
2. Déplacer les fichiers existants
3. Consolider les fichiers hero
4. Mettre à jour les références dans les templates

### Phase 3 : Extraction des sections (2-3 jours)
1. Extraire chaque section en composant Twig
2. Mettre à jour `home/index.html.twig` pour utiliser les composants
3. Tester chaque section individuellement

### Phase 4 : Standardisation (1 jour)
1. Standardiser le chargement des assets
2. Documenter la structure
3. Créer un guide de contribution

---

## 📝 Conclusion

**État actuel :** Structure fonctionnelle mais peu organisée  
**Objectif :** Structure claire, maintenable et scalable  
**Effort estimé :** 5-7 jours de travail

**Priorités :**
1. ✅ Réorganisation CSS (impact immédiat sur la maintenance)
2. ✅ Extraction des sections (impact sur la maintenabilité)
3. ✅ Réorganisation JavaScript (impact sur la performance)
4. ✅ Standardisation (impact sur la cohérence)

---

## 📝 Code des sections de la landing page

### Section 1 : Hero

**Fichier :** `templates/home/index.html.twig` (lignes 157-253)  
**ID :** `#home`  
**Classes CSS :** `ud-hero`

```twig
<!-- ====== Hero Start ====== -->
<section class="ud-hero" id="home">
    <div class="container">
        <!-- Badge et titre centrés sur toute la largeur -->
        <div class="row">
            <div class="col-lg-12">
                <div class="ud-hero-header-centered">
                    <!-- Badge responsive -->
                    <span class="tag hero-badge hero-badge--centered">
                        <span class="badge-desktop">🇫🇷 Infrastructure souveraine de vérité financière</span>
                        <span class="badge-mobile">🇫🇷 Infrastructure souveraine</span>
                    </span>
                    <!-- H1 -->
                    <h1 class="ud-hero-title ud-hero-title--centered">
                        Des chiffres vrais. Enfin.
                    </h1>
                </div>
            </div>
        </div>
        
        <div class="row align-items-center">
            <!-- Col gauche -->
            <div class="col-lg-6 col-md-12">
                <div class="ud-hero-content wow fadeInUp" data-wow-delay=".2s">
                    <!-- Baseline (H2) -->
                    <h2 class="ud-hero-subtitle hero-desc">
                        <span class="hero-subtitle-desktop">
                            Dorevia-Vault sécurise vos données financières<br class="hero-break-md">
                            pour vous permettre de piloter votre entreprise<br class="hero-break-lg">
                            avec des informations fiables, prouvées.
                        </span>
                        <span class="hero-subtitle-mobile">
                            Pilotez avec des données fiables, sécurisées et vérifiables.
                        </span>
                    </h2>

                    <!-- Bullets -->
                    <ul class="hero-bullets" role="list">
                        <li>Preuves vérifiables en temps réel</li>
                        <li>Zéro manipulation humaine</li>
                        <li>Intégré naturellement avec Odoo</li>
                        <li>Compatible ERP open-source</li>
                        <li>Propulsé par une plateforme souveraine</li>
                    </ul>
                </div>
            </div>

            <!-- Col droite - Visual -->
            <div class="col-lg-6 col-md-12">
                <div class="ud-hero-visual wow fadeInUp" data-wow-delay=".35s">
                    <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80&auto=format&fit=crop" 
                         alt="Dashboard Dorevia-Vault - Visualisation des données financières en temps réel"
                         class="hero-dashboard-image"
                         loading="lazy"
                         width="800"
                         height="600">
                </div>
            </div>
        </div>
        
        <!-- Footer Hero : CTAs et mention IA centrés -->
        <div class="row">
            <div class="col-lg-12">
                <div class="ud-hero-footer-centered">
                    <!-- CTAs -->
                    <div class="ud-hero-buttons ud-hero-buttons--centered">
                        <a href="#cta-final" 
                           class="ud-main-btn ud-white-btn hero-cta hero-cta-primary"
                           aria-label="Voir la démonstration de Dorevia-Vault">
                            👉 Voir la démo
                        </a>
                        <a href="{{ path('contact') }}" 
                           class="ud-main-btn ud-white-btn hero-cta hero-cta-secondary"
                           aria-label="Parlez-nous de votre projet">
                            Parlez-nous de votre projet
                        </a>
                    </div>

                    <!-- Mention IA souveraine -->
                    <p class="hero-ai-mention hero-ai-mention--centered">
                        Assisté en lecture seule par DIVA, notre IA souveraine.
                    </p>
                </div>
            </div>
        </div>
    </div>
</section>
<!-- ====== Hero End ====== -->
```

**Caractéristiques :**
- Layout 2 colonnes (texte à gauche, image à droite)
- Header centré (badge + titre)
- Footer centré (CTAs + mention IA)
- Responsive avec breakpoints
- Optimisé 100vh sur desktop

---

### Section 2 : Défis du pilotage financier

**Fichier :** `templates/home/index.html.twig` (lignes 255-398)  
**ID :** `#defis-pilotage`  
**Classes CSS :** `ud-challenges ud-section dv-section dv-defis`

```twig
<!-- ====== Section 2 : Défis du pilotage financier Start ====== -->
<section id="defis-pilotage" class="ud-challenges ud-section dv-section dv-defis" role="region" aria-label="Défis du pilotage financier">
    <div class="container dv-container">
        
        <!-- En-tête de section -->
        <header class="dv-section__head text-center">
            <h2 class="ud-section-title-heading dv-title">Pourquoi vos chiffres ne sont pas fiables aujourd'hui</h2>
        </header>

        <!-- Message développé (2 colonnes sur desktop) -->
        <div class="dv-message-block">
            <div class="dv-message-text">
                <p class="dv-message-intro">
                    Vous avez des outils.<br>
                    Vous avez des équipes.<br>
                    Pourtant, vous doutez encore de vos chiffres.
                </p>
                <p class="dv-message-core">
                    Le problème n'est pas votre ERP.<br>
                    Ce n'est pas votre comptable.<br>
                    C'est <strong>le délai et la fragilité</strong> entre ce qui se passe réellement<br>
                    et ce que vous voyez dans vos tableaux de bord.
                </p>
                
                <!-- 4 sous-sections (cartes) dans la colonne gauche -->
                <div class="dv-grid dv-grid--4 dv-grid--inline">
                    
                    <!-- Carte 1 : Chiffres en retard -->
                    <article class="dv-card challenge-card">
                        <div class="dv-card__icon challenge-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z"/>
                            </svg>
                        </div>
                        <h3 class="dv-card__title challenge-title">Vous pilotez avec du retard</h3>
                        <p class="dv-card__text challenge-detail">
                            Clôtures mensuelles à J+15, J+30, parfois J+45. Vous prenez des décisions <strong>sur le passé</strong>.
                        </p>
                        <blockquote class="dv-card-quote">
                            <p>"Vous pilotez en regardant dans le rétroviseur."</p>
                        </blockquote>
                        <div class="dv-metric challenge-metric">
                            <div class="dv-metric__value metric-value">15–45 jours</div>
                            <div class="dv-metric__label metric-label">délai moyen de disponibilité</div>
                        </div>
                    </article>

                    <!-- Carte 2 : Excel bricolés -->
                    <article class="dv-card challenge-card">
                        <div class="dv-card__icon challenge-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 19V5" stroke-linecap="round"/>
                                <path d="M4 19h16" stroke-linecap="round"/>
                                <path d="M8 15v-4" stroke-linecap="round"/>
                                <path d="M12 15V7" stroke-linecap="round"/>
                                <path d="M16 15v-6" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <h3 class="dv-card__title challenge-title">Excel est au cœur des processus</h3>
                        <p class="dv-card__text challenge-detail">
                            Exports manuels. Versions multiples. Corrections à la main. Dépendance à une personne clé.
                        </p>
                        <blockquote class="dv-card-quote">
                            <p>"Le moindre départ devient un risque."</p>
                        </blockquote>
                        <div class="dv-metric challenge-metric">
                            <div class="dv-metric__value metric-value">73%</div>
                            <div class="dv-metric__label metric-label">des PME utilisent encore Excel</div>
                        </div>
                    </article>

                    <!-- Carte 3 : Chiffres ajustés -->
                    <article class="dv-card challenge-card">
                        <div class="dv-card__icon challenge-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 20h9" stroke-linecap="round"/>
                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h3 class="dv-card__title challenge-title">Les chiffres sont ajustés après coup</h3>
                        <p class="dv-card__text challenge-detail">
                            Recalculs. Corrections manuelles. La confiance s'effondre.
                        </p>
                        <blockquote class="dv-card-quote">
                            <p>"Vous doutez de vos propres chiffres."</p>
                        </blockquote>
                        <div class="dv-metric challenge-metric">
                            <div class="dv-metric__value metric-value">68%</div>
                            <div class="dv-metric__label metric-label">des dirigeants doutent de leurs chiffres</div>
                        </div>
                    </article>

                    <!-- Carte 4 : Stress des contrôles -->
                    <article class="dv-card challenge-card">
                        <div class="dv-card__icon challenge-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" stroke-linejoin="round"/>
                                <path d="M14 2v6h6" stroke-linejoin="round"/>
                                <path d="M8 13h8M8 17h6" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <h3 class="dv-card__title challenge-title">Les justificatifs restent difficiles à produire</h3>
                        <p class="dv-card__text challenge-detail">
                            Impossible de fournir une preuve immédiate. Temps perdu à expliquer, reconstruire, justifier.
                        </p>
                        <blockquote class="dv-card-quote">
                            <p>"Vous subissez au lieu d'anticiper."</p>
                        </blockquote>
                        <div class="dv-metric challenge-metric">
                            <div class="dv-metric__value metric-value">+10 Md€</div>
                            <div class="dv-metric__label metric-label">de redressements par an</div>
                        </div>
                    </article>

                </div>
            </div>
            <div class="dv-message-visual">
                <div class="dv-message-stat">
                    <div class="dv-stat-value">68%</div>
                    <div class="dv-stat-label">des dirigeants doutent de leurs chiffres</div>
                </div>
            </div>
        </div>

        <!-- Footer : Transition vers Solution -->
        <div class="dv-cta-block">
            <p class="dv-cta-transition">
                La bonne nouvelle ?<br>
                Ce problème n'est pas une fatalité.
            </p>
            <div class="dv-cta-buttons">
                <a href="#solution" class="dv-btn dv-btn--primary ud-menu-scroll" aria-label="Découvrir la solution Dorevia-Vault">
                    Découvrir la solution
                </a>
                <a href="#contact" class="dv-btn dv-btn--secondary ud-menu-scroll" aria-label="Parler à un expert Dorevia-Vault">
                    Parler à un expert (15 min)
                </a>
            </div>
        </div>

    </div>
</section>
<!-- ====== Section 2 : Défis du pilotage financier End ====== -->
```

**Caractéristiques :**
- Layout 2 colonnes (message + cartes à gauche, statistique à droite)
- 4 cartes en grid 2×2 dans la colonne gauche
- Statistique visuelle (68%) dans la colonne droite
- Footer avec texte de transition et 2 CTAs

---

### Section 3 : La solution Dorevia-Vault

**Fichier :** `templates/home/index.html.twig` (lignes 400-490)  
**ID :** `#solution`  
**Classes CSS :** `ud-solution ud-section dv-section dv-solution`

```twig
<!-- ====== Section 3 : La solution Dorevia-Vault Start ====== -->
<section class="ud-solution ud-section dv-section dv-solution" id="solution" role="region" aria-label="La solution Dorevia-Vault">
    <div class="container dv-container">
        <header class="dv-section__head text-center">
            <p class="dv-kicker">La solution</p>
            <h2 class="ud-section-title-heading dv-title">Des chiffres fiables par défaut</h2>
            <p class="ud-section-subtitle-text dv-subtitle">
                Dorevia-Vault transforme vos opérations financières en <strong>preuves vérifiables</strong>,<br>
                automatiquement, sans changer vos habitudes.
            </p>
        </header>
        {# 3 cartes horizontales selon SPEC #}
        <div class="row mt-5">
            <div class="col-lg-4 col-md-4 mb-4">
                <div class="solution-block-card dv-card">
                    <div class="solution-block-icon" aria-hidden="true">🔄</div>
                    <h3 class="solution-block-title">Capture automatique</h3>
                    <p class="solution-block-desc">
                        Les événements financiers sont enregistrés en arrière-plan depuis votre ERP.<br>
                        <strong>Zéro ressaisie.</strong>
                    </p>
                    <div class="solution-block-includes">
                        <p class="includes-label"><strong>Inclus :</strong></p>
                        <ul class="includes-list">
                            <li>Factures émises / validées</li>
                            <li>Paiements encaissés</li>
                            <li>Écritures clés</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="col-lg-4 col-md-4 mb-4">
                <div class="solution-block-card dv-card">
                    <div class="solution-block-icon" aria-hidden="true">🔒</div>
                    <h3 class="solution-block-title">Sécurisation probante</h3>
                    <p class="solution-block-desc">
                        Chaque événement est <strong>horodaté</strong> et scellé par empreinte.<br>
                        Toute modification devient détectable.
                    </p>
                    <div class="solution-block-guarantees">
                        <p class="guarantees-label"><strong>Garanties :</strong></p>
                        <ul class="guarantees-list">
                            <li>Intégrité des données</li>
                            <li>Traçabilité complète</li>
                            <li>Audit simplifié</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="col-lg-4 col-md-4 mb-4">
                <div class="solution-block-card dv-card">
                    <div class="solution-block-icon" aria-hidden="true">✅</div>
                    <h3 class="solution-block-title">Preuves vérifiables</h3>
                    <p class="solution-block-desc">
                        En cas de contrôle, vous produisez une preuve <strong>immédiate</strong>, claire et exploitable.
                    </p>
                    <div class="solution-block-features">
                        <p class="features-label"><strong>Fonctionnalités :</strong></p>
                        <ul class="features-list">
                            <li>Historique consultable</li>
                            <li>Justificatifs reliés</li>
                            <li>Export en un clic</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        {# Call-To-Action selon SPEC #}
        <div class="row mt-5">
            <div class="col-lg-10 mx-auto text-center">
                <div class="solution-cta-block">
                    <h3 class="solution-cta-title">Voir Dorevia-Vault sur un cas réel</h3>
                    <p class="solution-cta-microcopy">30 minutes. Sans engagement. On part de votre contexte.</p>
                    <div class="solution-cta-buttons">
                        <a href="{{ path('contact') }}" 
                           class="ud-main-btn dv-btn cta-primary"
                           aria-label="Demander une démonstration de Dorevia-Vault">
                            Demander une démo
                        </a>
                        <a href="#preuves-conformite" 
                           class="ud-main-btn ud-secondary-btn dv-btn cta-secondary ud-menu-scroll"
                           aria-label="Comprendre la preuve">
                            Comprendre la preuve
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
<!-- ====== Section 3 : La solution Dorevia-Vault End ====== -->
```

**Caractéristiques :**
- Header avec kicker, titre et sous-titre
- 3 cartes horizontales (Capture, Sécurisation, Preuves)
- CTA block avec 2 boutons

---

### Section 4 : Pour qui ?

**Fichier :** `templates/home/index.html.twig` (lignes 492-538)  
**ID :** `#pour-qui`  
**Classes CSS :** `ud-personas ud-section`

```twig
<!-- ====== Section 4 : Pour qui ? Start ====== -->
<section class="ud-personas ud-section" id="pour-qui" role="region" aria-label="Pour qui">
    <div class="container">
        <div class="row">
            <div class="col-lg-12">
                <div class="ud-section-title text-center">
                    <h2 class="ud-section-title-heading">Pour qui ?</h2>
                </div>
            </div>
        </div>
        <div class="row mt-5">
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="persona-card">
                    <div class="persona-icon" aria-hidden="true">👔</div>
                    <h3 class="persona-role">Dirigeant</h3>
                    <p class="persona-objective"><strong>Objectif :</strong> Piloter en temps réel, dormir tranquille</p>
                    <p class="persona-benefit"><strong>Bénéfice :</strong> Décisions basées sur des chiffres fiables, sérénité</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="persona-card">
                    <div class="persona-icon" aria-hidden="true">📊</div>
                    <h3 class="persona-role">CFO / RAF</h3>
                    <p class="persona-objective"><strong>Objectif :</strong> Fournir des indicateurs fiables au dirigeant</p>
                    <p class="persona-benefit"><strong>Bénéfice :</strong> Automatisation, gain de temps, preuves immédiates</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="persona-card">
                    <div class="persona-icon" aria-hidden="true">📚</div>
                    <h3 class="persona-role">Expert-comptable</h3>
                    <p class="persona-objective"><strong>Objectif :</strong> Vérifier la conformité rapidement</p>
                    <p class="persona-benefit"><strong>Bénéfice :</strong> Audit efficace, vérification sans accès aux données</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="persona-card">
                    <div class="persona-icon" aria-hidden="true">⚙️</div>
                    <h3 class="persona-role">Responsable administratif</h3>
                    <p class="persona-objective"><strong>Objectif :</strong> Automatiser les contrôles et justifications</p>
                    <p class="persona-benefit"><strong>Bénéfice :</strong> Réduction des risques, conformité garantie</p>
                </div>
            </div>
        </div>
    </div>
</section>
<!-- ====== Section 4 : Pour qui ? End ====== -->
```

**Caractéristiques :**
- 4 cartes personas en grid 4 colonnes
- Chaque carte : icône, rôle, objectif, bénéfice

---

### Section 5 : Cas d'usage

**Fichier :** `templates/home/index.html.twig` (lignes 540-582)  
**ID :** `#cas-usage`  
**Classes CSS :** `ud-use-cases ud-section`

```twig
<!-- ====== Section 5 : Cas d'usage Start ====== -->
<section class="ud-use-cases ud-section" id="cas-usage" role="region" aria-label="Cas d'usage">
    <div class="container">
        <div class="row">
            <div class="col-lg-12">
                <div class="ud-section-title text-center">
                    <h2 class="ud-section-title-heading">Cas d'usage</h2>
                </div>
            </div>
        </div>
        <div class="row mt-5">
            <div class="col-lg-6 col-md-6 mb-4">
                <div class="use-case-simple-card">
                    <div class="use-case-simple-icon">📊</div>
                    <h3 class="use-case-simple-title">Suivi CA en temps réel</h3>
                    <p class="use-case-simple-desc">Votre chiffre d'affaires certifié et vérifiable, disponible instantanément.</p>
                </div>
            </div>
            <div class="col-lg-6 col-md-6 mb-4">
                <div class="use-case-simple-card">
                    <div class="use-case-simple-icon">📈</div>
                    <h3 class="use-case-simple-title">TVA due instantanée</h3>
                    <p class="use-case-simple-desc">Calcul automatique de la TVA due, traçable et prouvable.</p>
                </div>
            </div>
            <div class="col-lg-6 col-md-6 mb-4">
                <div class="use-case-simple-card">
                    <div class="use-case-simple-icon">💵</div>
                    <h3 class="use-case-simple-title">Factures payées / émises</h3>
                    <p class="use-case-simple-desc">Suivi en temps réel de vos factures, avec preuve d'intégrité.</p>
                </div>
            </div>
            <div class="col-lg-6 col-md-6 mb-4">
                <div class="use-case-simple-card">
                    <div class="use-case-simple-icon">📤</div>
                    <h3 class="use-case-simple-title">Export vers expert-comptable</h3>
                    <p class="use-case-simple-desc">Transmission sécurisée des données certifiées à votre expert.</p>
                </div>
            </div>
        </div>
    </div>
</section>
<!-- ====== Section 5 : Cas d'usage End ====== -->
```

**Caractéristiques :**
- 4 cartes en grid 2×2
- Chaque carte : icône, titre, description

---

### Section 6 : Preuves & conformité

**Fichier :** `templates/home/index.html.twig` (lignes 584-701)  
**ID :** `#preuves-conformite`  
**Classes CSS :** `ud-compliance ud-section`

```twig
<!-- ====== Section 6 : Preuves & conformité Start ====== -->
<section class="ud-compliance ud-section" id="preuves-conformite" role="region" aria-label="Preuves et conformité">
    <div class="container">
        <div class="row">
            <div class="col-lg-12">
                <div class="ud-section-title text-center">
                    <h2 class="ud-section-title-heading">Preuves & conformité</h2>
                </div>
            </div>
        </div>
        <div class="row mt-5">
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="compliance-feature-card">
                    <div class="compliance-feature-icon">🔍</div>
                    <h3 class="compliance-feature-title">Traçabilité</h3>
                    <p class="compliance-feature-desc">Historique complet de toutes les opérations, immuable et vérifiable.</p>
                </div>
            </div>
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="compliance-feature-card">
                    <div class="compliance-feature-icon">🔒</div>
                    <h3 class="compliance-feature-title">Intégrité</h3>
                    <p class="compliance-feature-desc">Empreinte cryptographique garantissant qu'aucune modification n'est possible.</p>
                </div>
            </div>
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="compliance-feature-card">
                    <div class="compliance-feature-icon">📋</div>
                    <h3 class="compliance-feature-title">NF525</h3>
                    <p class="compliance-feature-desc">Conformité native à la norme française d'archivage électronique.</p>
                </div>
            </div>
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="compliance-feature-card">
                    <div class="compliance-feature-icon">📜</div>
                    <h3 class="compliance-feature-title">LNE 2026</h3>
                    <p class="compliance-feature-desc">Préparation à la facturation électronique obligatoire dès 2026.</p>
                </div>
            </div>
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="compliance-feature-card">
                    <div class="compliance-feature-icon">📦</div>
                    <h3 class="compliance-feature-title">Archivage probant</h3>
                    <p class="compliance-feature-desc">Conservation 10 ans minimum, avec preuve d'intégrité permanente.</p>
                </div>
            </div>
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="compliance-feature-card">
                    <div class="compliance-feature-icon">✅</div>
                    <h3 class="compliance-feature-title">Vérifiabilité</h3>
                    <p class="compliance-feature-desc">Un tiers peut vérifier les preuves sans accès aux données sensibles.</p>
                </div>
            </div>
        </div>
        {# Section 8bis : Contexte réglementaire - une opportunité #}
        <div class="row mt-5" id="contexte-reglementaire-opportunite">
            <div class="col-lg-10 mx-auto">
                <div class="regulatory-opportunity-block">
                    <h3 class="regulatory-opportunity-title">Contexte réglementaire : une opportunité</h3>
                    <p class="regulatory-opportunity-hook">
                        La réglementation n'est plus un frein.<br>
                        C'est une opportunité de reprendre le contrôle.
                    </p>
                    <div class="row mt-5">
                        <div class="col-lg-4 col-md-6 mb-4">
                            <div class="opportunity-benefit-card">
                                <div class="opportunity-benefit-icon">🚀</div>
                                <h4 class="opportunity-benefit-title">Avantage compétitif</h4>
                                <p class="opportunity-benefit-desc">La conformité devient un levier de création de valeur</p>
                            </div>
                        </div>
                        <div class="col-lg-4 col-md-6 mb-4">
                            <div class="opportunity-benefit-card">
                                <div class="opportunity-benefit-icon">💰</div>
                                <h4 class="opportunity-benefit-title">Anticiper aujourd'hui</h4>
                                <p class="opportunity-benefit-desc">Évite les coûts de demain</p>
                            </div>
                        </div>
                        <div class="col-lg-4 col-md-6 mb-4">
                            <div class="opportunity-benefit-card">
                                <div class="opportunity-benefit-icon">✅</div>
                                <h4 class="opportunity-benefit-title">Données exploitables</h4>
                                <p class="opportunity-benefit-desc">Vos données deviennent prouvées et exploitables</p>
                            </div>
                        </div>
                    </div>
                    <div class="row mt-4">
                        <div class="col-lg-6 mb-3">
                            <div class="business-benefit-item">
                                <strong>Crédibilité renforcée</strong><br>
                                <span class="benefit-detail">auprès des partenaires</span>
                            </div>
                        </div>
                        <div class="col-lg-6 mb-3">
                            <div class="business-benefit-item">
                                <strong>Sérénité</strong><br>
                                <span class="benefit-detail">en cas de contrôle</span>
                            </div>
                        </div>
                        <div class="col-lg-6 mb-3">
                            <div class="business-benefit-item">
                                <strong>Image d'entreprise</strong><br>
                                <span class="benefit-detail">structurée et moderne</span>
                            </div>
                        </div>
                        <div class="col-lg-6 mb-3">
                            <div class="business-benefit-item">
                                <strong>Conformité native</strong><br>
                                <span class="benefit-detail">NF525, LNE 2026, e-facturation</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
<!-- ====== Section 6 : Preuves & conformité End ====== -->
```

**Caractéristiques :**
- 6 cartes de conformité en grid 3×2
- Sous-section "Contexte réglementaire : une opportunité" (8bis)
- 3 cartes d'opportunités + 4 items de bénéfices business

---

### Section 7 : Call to Action Final

**Fichier :** `templates/home/index.html.twig` (lignes 703-721)  
**ID :** `#cta-final`  
**Classes CSS :** `ud-cta-final ud-section`

```twig
<!-- ====== Section 7 : Call to Action Start ====== -->
<section class="ud-cta-final ud-section" id="cta-final" role="region" aria-label="Appel à l'action">
    <div class="container">
        <div class="row">
            <div class="col-lg-10 mx-auto text-center">
                <h2 class="cta-final-title">Prêt à passer aux chiffres prouvés ?</h2>
                <div class="cta-final-buttons">
                    <a href="{{ path('contact') }}" 
                       class="ud-main-btn cta-final-primary"
                       aria-label="Demander une démonstration de Dorevia-Vault">
                        Demander une démo
                    </a>
                </div>
                <p class="cta-final-microcopy">30 minutes. Sans engagement.</p>
            </div>
        </div>
    </div>
</section>
<!-- ====== Section 7 : Call to Action End ====== -->
```

**Caractéristiques :**
- Section simple et centrée
- Titre, CTA principal, microcopy

---

## 📊 Résumé des sections

| Section | ID | Lignes | Structure | Éléments |
|---------|-----|--------|-----------|----------|
| Hero | `#home` | 157-253 | 2 colonnes | Badge, titre, description, bullets, image, CTAs |
| Défis | `#defis-pilotage` | 255-398 | 2 colonnes | Message, 4 cartes, statistique, footer |
| Solution | `#solution` | 400-490 | Pleine largeur | Header, 3 cartes, CTA block |
| Pour qui | `#pour-qui` | 492-538 | Grid 4×1 | 4 cartes personas |
| Cas d'usage | `#cas-usage` | 540-582 | Grid 2×2 | 4 cartes use cases |
| Conformité | `#preuves-conformite` | 584-701 | Grid 3×2 + sous-section | 6 cartes + section 8bis |
| CTA Final | `#cta-final` | 703-721 | Centré | Titre, CTA, microcopy |

**Total :** 7 sections principales + 1 sous-section (8bis)

---

**Fin du rapport**

# SPEC TECHNIQUE — Landing Page Dorevia-Vault v3.0

**Version** : v3.0  
**Date** : 2026-01-20  
**Statut** : Draft  
**Base** : SPEC Landing Page v3.0 + Wireframe v1.0

---

## 1. Structure HTML

### 1.1 Architecture générale

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <!-- Meta tags, title, CSS -->
</head>
<body>
    <!-- Header (sticky) -->
    <header class="ud-header" id="main-header">
        <!-- Navigation -->
    </header>

    <!-- Hero Section -->
    <section class="ud-hero" id="home">
        <!-- Hero content -->
    </section>

    <!-- Section Le défi -->
    <section class="ud-challenge" id="challenge">
        <!-- Challenge content -->
    </section>

    <!-- Section La solution -->
    <section class="ud-solution" id="solution">
        <!-- Solution content -->
    </section>

    <!-- Section Ce que ça change -->
    <section class="ud-benefits" id="benefits">
        <!-- Benefits content -->
    </section>

    <!-- Section Notre conviction -->
    <section class="ud-conviction" id="conviction">
        <!-- Conviction content -->
    </section>

    <!-- Section Comment ça marche -->
    <section class="ud-how-it-works" id="how-it-works">
        <!-- How it works content -->
    </section>

    <!-- Section Pour qui -->
    <section class="ud-pour-qui" id="pour-qui">
        <!-- Pour qui content -->
    </section>

    <!-- Section Pourquoi c'est différent -->
    <section class="ud-differentiation" id="differentiation">
        <!-- Differentiation content -->
    </section>

    <!-- Section Ce qu'est Dorevia-Vault -->
    <section class="ud-positioning" id="positioning">
        <!-- Positioning content -->
    </section>

    <!-- CTA Final -->
    <section class="ud-cta-final" id="cta-final">
        <!-- Final CTA -->
    </section>

    <!-- Footer -->
    <footer class="ud-footer" id="footer">
        <!-- Footer content -->
    </footer>

    <!-- Scripts -->
    <script src="..."></script>
</body>
</html>
```

---

## 2. Structure détaillée par section

### 2.1 Header (sticky)

```html
<header class="ud-header" id="main-header" role="banner">
    <div class="container">
        <nav class="navbar navbar-expand-lg">
            <!-- Logo -->
            <a class="navbar-brand" href="/" aria-label="Dorevia-Vault - Accueil">
                <span>Dorevia-Vault</span>
            </a>

            <!-- Menu toggle (mobile) -->
            <button class="navbar-toggler" 
                    type="button" 
                    aria-label="Menu navigation"
                    aria-expanded="false"
                    aria-controls="navbarNav">
                <span class="toggler-icon"></span>
            </button>

            <!-- Navigation -->
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav mx-auto" role="menubar">
                    <li class="nav-item" role="none">
                        <a class="nav-link" href="#challenge" role="menuitem">Pourquoi</a>
                    </li>
                    <li class="nav-item" role="none">
                        <a class="nav-link" href="#solution" role="menuitem">Solution</a>
                    </li>
                    <li class="nav-item" role="none">
                        <a class="nav-link" href="#pour-qui" role="menuitem">Pour qui</a>
                    </li>
                    <li class="nav-item" role="none">
                        <a class="nav-link" href="#how-it-works" role="menuitem">Comment ça marche</a>
                    </li>
                </ul>

                <!-- CTA Header -->
                <div class="ud-header-cta">
                    <a href="#cta-final" 
                       class="ud-main-btn ud-white-btn"
                       aria-label="Voir la démonstration">
                        Voir la démo
                    </a>
                </div>
            </div>
        </nav>
    </div>
</header>
```

**Classes CSS** :
- `.ud-header` : Container principal
- `.navbar` : Navigation Bootstrap
- `.nav-link` : Liens navigation
- `.ud-header-cta` : Container CTA header

---

### 2.2 Hero Section

```html
<section class="ud-hero" id="home" role="region" aria-label="Hero Dorevia-Vault">
    <div class="container">
        <div class="row align-items-center">
            <!-- Colonne gauche : Contenu -->
            <div class="col-lg-6 col-md-12">
                <div class="ud-hero-content">
                    <!-- Badge -->
                    <span class="tag hero-badge" aria-label="Infrastructure souveraine">
                        <span class="badge-desktop">🇫🇷 Infrastructure souveraine de vérité financière</span>
                        <span class="badge-mobile">🇫🇷 Infrastructure souveraine</span>
                    </span>

                    <!-- Headline -->
                    <h1 class="ud-hero-title">
                        Des chiffres vrais. Enfin.
                    </h1>

                    <!-- Sous-titre -->
                    <h2 class="ud-hero-subtitle hero-desc">
                        <span class="hero-subtitle-desktop">
                            Dorevia-Vault sécurise vos données financières<br class="hero-break-md">
                            pour vous permettre de piloter votre entreprise<br class="hero-break-lg">
                            avec des informations fiables et prouvées.
                        </span>
                        <span class="hero-subtitle-mobile">
                            Pilotez avec des données fiables, sécurisées et vérifiables.
                        </span>
                    </h2>

                    <!-- Bullets -->
                    <ul class="hero-bullets" role="list">
                        <li>Preuves vérifiables en temps réel</li>
                        <li>Zéro manipulation humaine</li>
                        <li>Compatible ERP open-source</li>
                    </ul>

                    <!-- CTAs -->
                    <div class="ud-hero-buttons">
                        <a href="#cta-final" 
                           class="ud-main-btn ud-white-btn hero-cta hero-cta-primary"
                           aria-label="Voir la démonstration de Dorevia-Vault">
                            👉 Voir la démo
                        </a>
                        <a href="{{ path('contact') }}" 
                           class="ud-main-btn ud-white-btn hero-cta hero-cta-secondary"
                           aria-label="Parler de votre projet">
                            Parler de votre projet
                        </a>
                    </div>

                    <!-- Mention IA -->
                    <p class="hero-ai-mention">
                        Assisté par une IA souveraine en lecture seule<br>
                        <span class="hero-ai-note">(elle explique, ne modifie jamais)</span>
                    </p>
                </div>
            </div>

            <!-- Colonne droite : Visual -->
            <div class="col-lg-6 col-md-12">
                <div class="ud-hero-visual" aria-hidden="true">
                    <img src="{{ asset('assets/images/hero-dashboard.png') }}" 
                         alt="Dashboard Dorevia-Vault - Visualisation données en temps réel"
                         class="hero-dashboard-image"
                         loading="lazy">
                </div>
            </div>
        </div>
    </div>
</section>
```

**Classes CSS** :
- `.ud-hero` : Section hero
- `.ud-hero-content` : Container contenu
- `.hero-badge` : Badge souveraineté
- `.ud-hero-title` : Headline H1
- `.ud-hero-subtitle` : Sous-titre H2
- `.hero-bullets` : Liste à puces
- `.ud-hero-buttons` : Container CTAs
- `.hero-cta-primary` : CTA principal
- `.hero-cta-secondary` : CTA secondaire
- `.hero-ai-mention` : Mention IA
- `.ud-hero-visual` : Container visual

---

### 2.3 Section Le défi

```html
<section class="ud-challenge" id="challenge" role="region" aria-label="Le défi du pilotage financier">
    <div class="container">
        <div class="row">
            <div class="col-lg-12">
                <div class="ud-section-title text-center">
                    <h2 class="ud-section-title-heading">Le défi du pilotage financier</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-xl-3 col-lg-3 col-md-6 col-sm-6 mb-4">
                <div class="challenge-card">
                    <div class="challenge-icon" aria-hidden="true">📊</div>
                    <h3 class="challenge-title">Chiffres en retard</h3>
                </div>
            </div>
            <div class="col-xl-3 col-lg-3 col-md-6 col-sm-6 mb-4">
                <div class="challenge-card">
                    <div class="challenge-icon" aria-hidden="true">📋</div>
                    <h3 class="challenge-title">Tableaux bricolés</h3>
                </div>
            </div>
            <div class="col-xl-3 col-lg-3 col-md-6 col-sm-6 mb-4">
                <div class="challenge-card">
                    <div class="challenge-icon" aria-hidden="true">✏️</div>
                    <h3 class="challenge-title">Corrections manuelles</h3>
                </div>
            </div>
            <div class="col-xl-3 col-lg-3 col-md-6 col-sm-6 mb-4">
                <div class="challenge-card">
                    <div class="challenge-icon" aria-hidden="true">😰</div>
                    <h3 class="challenge-title">Stress des contrôles</h3>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-12 text-center">
                <p class="challenge-consequence">
                    ➜ Vous décidez sans certitude.
                </p>
                <p class="challenge-message">
                    Vous méritez mieux que du flou.
                </p>
            </div>
        </div>
    </div>
</section>
```

**Classes CSS** :
- `.ud-challenge` : Section challenge
- `.challenge-card` : Carte challenge
- `.challenge-icon` : Icône challenge
- `.challenge-title` : Titre challenge
- `.challenge-consequence` : Conséquence
- `.challenge-message` : Message positif

---

### 2.4 Section La solution

```html
<section class="ud-solution" id="solution" role="region" aria-label="Ce que fait Dorevia-Vault">
    <div class="container">
        <div class="row">
            <div class="col-lg-12">
                <div class="ud-section-title text-center">
                    <h2 class="ud-section-title-heading">Ce que fait Dorevia-Vault</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="solution-card">
                    <div class="solution-icon" aria-hidden="true">🔄</div>
                    <h3 class="solution-title">Capture automatique</h3>
                    <p class="solution-desc">des événements financiers</p>
                </div>
            </div>
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="solution-card">
                    <div class="solution-icon" aria-hidden="true">🔒</div>
                    <h3 class="solution-title">Sécurisation probante</h3>
                    <p class="solution-desc">horodatage et empreinte</p>
                </div>
            </div>
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="solution-card">
                    <div class="solution-icon" aria-hidden="true">🚫</div>
                    <h3 class="solution-title">Aucune modification</h3>
                    <p class="solution-desc">après coup</p>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-12 text-center">
                <div class="solution-result">
                    <span class="solution-attribute">Horodatée</span>
                    <span class="solution-separator">•</span>
                    <span class="solution-attribute">Traçable</span>
                    <span class="solution-separator">•</span>
                    <span class="solution-attribute">Vérifiable</span>
                    <span class="solution-arrow">→</span>
                    <span class="solution-proof">Une preuve</span>
                </div>
            </div>
        </div>
    </div>
</section>
```

**Classes CSS** :
- `.ud-solution` : Section solution
- `.solution-card` : Carte solution
- `.solution-icon` : Icône solution
- `.solution-title` : Titre solution
- `.solution-desc` : Description solution
- `.solution-result` : Résultat (preuve)
- `.solution-attribute` : Attribut (horodatée, etc.)
- `.solution-proof` : Texte "Une preuve"

---

### 2.5 Section Ce que ça change

```html
<section class="ud-benefits" id="benefits" role="region" aria-label="Ce que ça change pour vous">
    <div class="container">
        <div class="row">
            <div class="col-lg-12">
                <div class="ud-section-title text-center">
                    <h2 class="ud-section-title-heading">Grâce à Dorevia-Vault :</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-xl-3 col-lg-3 col-md-6 col-sm-6 mb-4">
                <div class="benefit-card">
                    <div class="benefit-icon" aria-hidden="true">💰</div>
                    <h3 class="benefit-title">Trésorerie réelle</h3>
                </div>
            </div>
            <div class="col-xl-3 col-lg-3 col-md-6 col-sm-6 mb-4">
                <div class="benefit-card">
                    <div class="benefit-icon" aria-hidden="true">📈</div>
                    <h3 class="benefit-title">Performance temps réel</h3>
                </div>
            </div>
            <div class="col-xl-3 col-lg-3 col-md-6 col-sm-6 mb-4">
                <div class="benefit-card">
                    <div class="benefit-icon" aria-hidden="true">✅</div>
                    <h3 class="benefit-title">Décisions sur faits</h3>
                </div>
            </div>
            <div class="col-xl-3 col-lg-3 col-md-6 col-sm-6 mb-4">
                <div class="benefit-card">
                    <div class="benefit-icon" aria-hidden="true">😌</div>
                    <h3 class="benefit-title">Sérénité face aux contrôles</h3>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-12 text-center">
                <p class="benefit-message">
                    ➜ Vous reprenez le contrôle.
                </p>
            </div>
        </div>
    </div>
</section>
```

**Classes CSS** :
- `.ud-benefits` : Section benefits
- `.benefit-card` : Carte bénéfice
- `.benefit-icon` : Icône bénéfice
- `.benefit-title` : Titre bénéfice
- `.benefit-message` : Message final

---

### 2.6 Section Notre conviction

```html
<section class="ud-conviction" id="conviction" role="region" aria-label="Notre conviction">
    <div class="container">
        <div class="row">
            <div class="col-lg-10 mx-auto">
                <div class="ud-section-title text-center">
                    <h2 class="ud-section-title-heading">La conformité devient un avantage</h2>
                </div>
                <div class="conviction-content">
                    <p class="conviction-message">
                        En respectant les normes réglementaires dès la conception,
                        vos chiffres deviennent fiables par design.
                    </p>
                    <ul class="conviction-list">
                        <li>Pas de retraitement</li>
                        <li>Pas de correction</li>
                        <li>Pas de doute</li>
                    </ul>
                    <p class="conviction-result">
                        Les données sont justes dès la source.
                    </p>
                </div>
                <div class="conviction-compliance">
                    <p class="compliance-label">Conformité :</p>
                    <span class="compliance-badge">LNE 2026</span>
                    <span class="compliance-separator">•</span>
                    <span class="compliance-badge">NF525</span>
                    <p class="compliance-note">(détails techniques en bas de page)</p>
                </div>
            </div>
        </div>
    </div>
</section>
```

**Classes CSS** :
- `.ud-conviction` : Section conviction
- `.conviction-content` : Contenu conviction
- `.conviction-message` : Message principal
- `.conviction-list` : Liste points
- `.conviction-result` : Résultat
- `.conviction-compliance` : Encadré conformité
- `.compliance-badge` : Badge conformité

---

### 2.7 Section Comment ça marche

```html
<section class="ud-how-it-works" id="how-it-works" role="region" aria-label="Comment ça marche">
    <div class="container">
        <div class="row">
            <div class="col-lg-12">
                <div class="ud-section-title text-center">
                    <h2 class="ud-section-title-heading">Comment ça marche</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-4 col-md-4 mb-4">
                <div class="how-it-works-step">
                    <div class="step-number" aria-label="Étape 1">1️⃣</div>
                    <h3 class="step-title">Vous travaillez normalement</h3>
                    <p class="step-desc">Factures, paiements, écritures</p>
                </div>
            </div>
            <div class="col-lg-4 col-md-4 mb-4">
                <div class="how-it-works-step">
                    <div class="step-arrow" aria-hidden="true">→</div>
                </div>
            </div>
            <div class="col-lg-4 col-md-4 mb-4">
                <div class="how-it-works-step">
                    <div class="step-number" aria-label="Étape 2">2️⃣</div>
                    <h3 class="step-title">Dorevia-Vault agit</h3>
                    <p class="step-desc">Capture & sécurisation en arrière-plan</p>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-4 col-md-4 mb-4">
                <div class="how-it-works-step">
                    <div class="step-arrow" aria-hidden="true">→</div>
                </div>
            </div>
            <div class="col-lg-4 col-md-4 mb-4">
                <div class="how-it-works-step">
                    <div class="step-number" aria-label="Étape 3">3️⃣</div>
                    <h3 class="step-title">Vous exploitez des chiffres prouvés</h3>
                    <p class="step-desc">Pilotage, reporting, contrôle</p>
                </div>
            </div>
        </div>
    </div>
</section>
```

**Classes CSS** :
- `.ud-how-it-works` : Section how it works
- `.how-it-works-step` : Étape processus
- `.step-number` : Numéro étape
- `.step-title` : Titre étape
- `.step-desc` : Description étape
- `.step-arrow` : Flèche entre étapes

---

### 2.8 Section Pour qui

```html
<section class="ud-pour-qui" id="pour-qui" role="region" aria-label="Pour qui">
    <div class="container">
        <div class="row">
            <div class="col-lg-12">
                <div class="ud-section-title text-center">
                    <h2 class="ud-section-title-heading">POUR QUI</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-xl-3 col-lg-3 col-md-6 col-sm-6 mb-4">
                <div class="pour-qui-card">
                    <div class="pour-qui-icon" aria-hidden="true">👤</div>
                    <h3 class="pour-qui-title">Indépendants</h3>
                </div>
            </div>
            <div class="col-xl-3 col-lg-3 col-md-6 col-sm-6 mb-4">
                <div class="pour-qui-card">
                    <div class="pour-qui-icon" aria-hidden="true">🏢</div>
                    <h3 class="pour-qui-title">PME</h3>
                </div>
            </div>
            <div class="col-xl-3 col-lg-3 col-md-6 col-sm-6 mb-4">
                <div class="pour-qui-card">
                    <div class="pour-qui-icon" aria-hidden="true">🏭</div>
                    <h3 class="pour-qui-title">ETI</h3>
                </div>
            </div>
            <div class="col-xl-3 col-lg-3 col-md-6 col-sm-6 mb-4">
                <div class="pour-qui-card">
                    <div class="pour-qui-icon" aria-hidden="true">🔌</div>
                    <h3 class="pour-qui-title">ERP open-source</h3>
                </div>
            </div>
        </div>
    </div>
</section>
```

**Classes CSS** :
- `.ud-pour-qui` : Section pour qui
- `.pour-qui-card` : Carte cible
- `.pour-qui-icon` : Icône cible
- `.pour-qui-title` : Titre cible

---

### 2.9 Section Pourquoi c'est différent

```html
<section class="ud-differentiation" id="differentiation" role="region" aria-label="Pourquoi c'est différent">
    <div class="container">
        <div class="row">
            <div class="col-lg-12">
                <div class="ud-section-title text-center">
                    <h2 class="ud-section-title-heading">POURQUOI C'EST DIFFÉRENT</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-6 col-md-6 mb-4">
                <div class="differentiation-card">
                    <div class="differentiation-icon" aria-hidden="true">✅</div>
                    <h3 class="differentiation-title">Conformité intégrée par design</h3>
                </div>
            </div>
            <div class="col-lg-6 col-md-6 mb-4">
                <div class="differentiation-card">
                    <div class="differentiation-icon" aria-hidden="true">🔓</div>
                    <h3 class="differentiation-title">Open-source auditable</h3>
                </div>
            </div>
            <div class="col-lg-6 col-md-6 mb-4">
                <div class="differentiation-card">
                    <div class="differentiation-icon" aria-hidden="true">🏛️</div>
                    <h3 class="differentiation-title">Indépendant des éditeurs</h3>
                </div>
            </div>
            <div class="col-lg-6 col-md-6 mb-4">
                <div class="differentiation-card">
                    <div class="differentiation-icon" aria-hidden="true">🔐</div>
                    <h3 class="differentiation-title">Vos données sous votre contrôle</h3>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-12 text-center">
                <p class="differentiation-message">
                    ➜ Pas de boîte noire.
                </p>
            </div>
        </div>
    </div>
</section>
```

**Classes CSS** :
- `.ud-differentiation` : Section differentiation
- `.differentiation-card` : Carte différenciation
- `.differentiation-icon` : Icône différenciation
- `.differentiation-title` : Titre différenciation
- `.differentiation-message` : Message final

---

### 2.10 Section Ce qu'est Dorevia-Vault

```html
<section class="ud-positioning" id="positioning" role="region" aria-label="Ce qu'est Dorevia-Vault">
    <div class="container">
        <div class="row">
            <div class="col-lg-10 mx-auto">
                <div class="ud-section-title text-center">
                    <h2 class="ud-section-title-heading">Ce qu'est Dorevia-Vault</h2>
                </div>
                <div class="positioning-content text-center">
                    <p class="positioning-main-message">
                        ➜ Une infrastructure de confiance pour vos chiffres financiers.
                    </p>
                </div>
                <div class="row">
                    <div class="col-lg-4 col-md-6 mb-4">
                        <div class="positioning-pillar">
                            <div class="pillar-icon" aria-hidden="true">🔒</div>
                            <h3 class="pillar-title">Données sécurisées</h3>
                            <p class="pillar-desc">dès la source</p>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4">
                        <div class="positioning-pillar">
                            <div class="pillar-icon" aria-hidden="true">✅</div>
                            <h3 class="pillar-title">Preuves vérifiables</h3>
                            <p class="pillar-desc">en continu</p>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4">
                        <div class="positioning-pillar">
                            <div class="pillar-icon" aria-hidden="true">📊</div>
                            <h3 class="pillar-title">Pilotage basé sur</h3>
                            <p class="pillar-desc">des faits</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
```

**Classes CSS** :
- `.ud-positioning` : Section positioning
- `.positioning-content` : Contenu positioning
- `.positioning-main-message` : Message principal
- `.positioning-pillar` : Pilier positioning
- `.pillar-icon` : Icône pilier
- `.pillar-title` : Titre pilier
- `.pillar-desc` : Description pilier

---

### 2.11 CTA Final

```html
<section class="ud-cta-final" id="cta-final" role="region" aria-label="Appel à l'action final">
    <div class="container">
        <div class="row">
            <div class="col-lg-10 mx-auto text-center">
                <h2 class="cta-final-title">Prêt à passer aux chiffres prouvés ?</h2>
                <div class="cta-final-buttons">
                    <a href="{{ path('contact') }}" 
                       class="ud-main-btn ud-white-btn cta-final-primary"
                       aria-label="Voir la démonstration de Dorevia-Vault">
                        👉 Voir la démo
                    </a>
                    <a href="{{ path('contact') }}" 
                       class="ud-main-btn ud-white-btn cta-final-secondary"
                       aria-label="Parler de votre projet">
                        Parler de votre projet
                    </a>
                </div>
            </div>
        </div>
    </div>
</section>
```

**Classes CSS** :
- `.ud-cta-final` : Section CTA final
- `.cta-final-title` : Titre CTA final
- `.cta-final-buttons` : Container boutons
- `.cta-final-primary` : CTA principal
- `.cta-final-secondary` : CTA secondaire

---

### 2.12 Footer

```html
<footer class="ud-footer" id="footer" role="contentinfo">
    <div class="container">
        <div class="row">
            <div class="col-lg-3 col-md-6 mb-4">
                <h3 class="footer-title">Dorevia-Vault</h3>
                <p class="footer-desc">Infrastructure de vérité financière</p>
            </div>
            <div class="col-lg-3 col-md-6 mb-4">
                <h4 class="footer-section-title">Navigation</h4>
                <ul class="footer-links">
                    <li><a href="#challenge">Pourquoi</a></li>
                    <li><a href="#solution">Solution</a></li>
                    <li><a href="#pour-qui">Pour qui</a></li>
                    <li><a href="#how-it-works">Comment ça marche</a></li>
                </ul>
            </div>
            <div class="col-lg-3 col-md-6 mb-4">
                <h4 class="footer-section-title">Ressources</h4>
                <ul class="footer-links">
                    <li><a href="/docs">Documentation</a></li>
                    <li><a href="/git">Open-source</a></li>
                    <li><a href="/github">Git</a></li>
                </ul>
            </div>
            <div class="col-lg-3 col-md-6 mb-4">
                <h4 class="footer-section-title">Contact</h4>
                <ul class="footer-links">
                    <li><a href="{{ path('contact') }}">Contact</a></li>
                    <li><a href="https://linkedin.com/company/dorevia">LinkedIn</a></li>
                </ul>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-12">
                <div class="footer-bottom">
                    <p class="footer-legal">
                        <a href="/legal">Mentions légales</a> |
                        <a href="/privacy">Politique de confidentialité</a> |
                        <a href="/cgu">CGU</a>
                    </p>
                    <p class="footer-copyright">
                        © 2026 Dorevia-Vault. Tous droits réservés.
                    </p>
                </div>
            </div>
        </div>
    </div>
</footer>
```

**Classes CSS** :
- `.ud-footer` : Footer
- `.footer-title` : Titre footer
- `.footer-section-title` : Titre section footer
- `.footer-links` : Liste liens footer
- `.footer-bottom` : Bas footer
- `.footer-legal` : Liens légaux
- `.footer-copyright` : Copyright

---

## 3. Classes CSS principales

### 3.1 Naming convention

**Préfixe** : `ud-` (Udesly Design System)

**Structure** :
- `.ud-{section}` : Section principale
- `.{section}-{element}` : Élément dans section
- `.{section}-{element}-{variant}` : Variante élément

**Exemples** :
- `.ud-hero` : Section hero
- `.hero-title` : Titre dans hero
- `.hero-cta-primary` : CTA principal dans hero

---

### 3.2 Classes utilitaires

```css
/* Layout */
.ud-section-title : Titre de section
.ud-section-title-heading : Heading de section
.container : Container Bootstrap
.row : Row Bootstrap
.col-* : Colonnes Bootstrap

/* Buttons */
.ud-main-btn : Bouton principal
.ud-white-btn : Bouton blanc
.ud-secondary-btn : Bouton secondaire

/* Cards */
.{section}-card : Carte générique
.{section}-icon : Icône dans carte
.{section}-title : Titre dans carte
.{section}-desc : Description dans carte

/* Responsive */
.d-none : Display none
.d-md-inline : Display inline medium+
.hero-break-md : Break line medium+
.hero-break-lg : Break line large+
```

---

## 4. JavaScript

### 4.1 Fonctionnalités requises

**Navigation** :
- Smooth scroll vers ancres
- Header sticky avec changement d'état au scroll
- Menu mobile toggle

**Tracking** :
- Analytics (GA4) : événements CTA
- Scroll depth tracking
- Time on page

**Interactions** :
- Animations au scroll (fade-in, slide-up)
- Hover effects sur cartes
- Focus states accessibles

---

### 4.2 Structure JavaScript

```javascript
// main.js
document.addEventListener('DOMContentLoaded', function() {
    // Navigation
    initSmoothScroll();
    initStickyHeader();
    initMobileMenu();
    
    // Tracking
    initAnalytics();
    initScrollTracking();
    
    // Animations
    initScrollAnimations();
    
    // Formulaires
    initFormValidation();
});

// smooth-scroll.js
function initSmoothScroll() {
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
}

// sticky-header.js
function initStickyHeader() {
    const header = document.querySelector('.ud-header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.classList.add('sticky');
        } else {
            header.classList.remove('sticky');
        }
        
        lastScroll = currentScroll;
    });
}

// analytics.js
function initAnalytics() {
    // Track CTA clicks
    document.querySelectorAll('.hero-cta, .cta-final-primary, .cta-final-secondary').forEach(cta => {
        cta.addEventListener('click', function() {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'cta_click', {
                    'event_category': 'Engagement',
                    'event_label': this.textContent.trim(),
                    'value': 1
                });
            }
        });
    });
}

// scroll-tracking.js
function initScrollTracking() {
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'section_view', {
                        'event_category': 'Engagement',
                        'event_label': sectionId,
                        'value': 1
                    });
                }
            }
        });
    }, { threshold: 0.5 });
    
    sections.forEach(section => observer.observe(section));
}
```

---

## 5. Accessibilité

### 5.1 ARIA Labels

**Régions** :
- `role="region"` sur toutes les sections
- `aria-label` sur sections avec titre non explicite

**Navigation** :
- `role="menubar"` sur navigation principale
- `role="menuitem"` sur liens navigation
- `aria-expanded` sur menu mobile toggle

**Images** :
- `alt` text descriptif pour toutes les images
- `aria-hidden="true"` sur images décoratives

---

### 5.2 Navigation clavier

**Tab order** :
1. Header navigation
2. Hero CTA
3. Sections dans l'ordre
4. Footer links

**Focus visible** :
- Outline 3px sur focus
- Contraste suffisant (WCAG AA)

---

## 6. Performance

### 6.1 Optimisations

**Images** :
- Format WebP avec fallback
- Lazy loading sur images below fold
- Sizes appropriés (srcset)

**CSS** :
- Critical CSS inline dans `<head>`
- CSS non-critique chargé asynchrone

**JavaScript** :
- Code splitting par section si nécessaire
- Déferré (`defer`) pour scripts non-critiques

---

## 7. SEO

### 7.1 Meta tags

```html
<head>
    <title>Dorevia-Vault - Des chiffres vrais. Enfin. | Infrastructure de vérité financière</title>
    <meta name="description" content="Dorevia-Vault sécurise vos données financières pour vous permettre de piloter votre entreprise avec des informations fiables et prouvées. Compatible ERP open-source.">
    <meta name="keywords" content="vérité financière, données sécurisées, ERP open-source, preuves vérifiables, conformité LNE 2026, NF525">
    <meta property="og:title" content="Dorevia-Vault - Des chiffres vrais. Enfin.">
    <meta property="og:description" content="Infrastructure de vérité financière pour toutes les entreprises">
    <meta property="og:image" content="/assets/images/og-image.png">
    <meta property="og:url" content="https://dorevia-vault.com">
    <link rel="canonical" href="https://dorevia-vault.com">
</head>
```

---

## 8. Checklist d'implémentation

### HTML
- [ ] Structure sémantique correcte
- [ ] Tous les IDs uniques
- [ ] Classes CSS selon convention
- [ ] ARIA labels présents
- [ ] Alt text sur toutes images

### CSS
- [ ] Classes selon naming convention
- [ ] Responsive breakpoints
- [ ] États hover/focus
- [ ] Contraste WCAG AA

### JavaScript
- [ ] Smooth scroll fonctionnel
- [ ] Header sticky fonctionnel
- [ ] Menu mobile fonctionnel
- [ ] Analytics tracking
- [ ] Scroll tracking

### Accessibilité
- [ ] Navigation clavier complète
- [ ] Focus visible
- [ ] ARIA labels
- [ ] Contraste couleurs

### Performance
- [ ] Images optimisées
- [ ] CSS critical inline
- [ ] JavaScript déferré
- [ ] Lazy loading images

### SEO
- [ ] Meta tags complets
- [ ] Title optimisé
- [ ] Description optimisée
- [ ] Canonical URL

---

**Fin de la SPEC Technique v3.0**

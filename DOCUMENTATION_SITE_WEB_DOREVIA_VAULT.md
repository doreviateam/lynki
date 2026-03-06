# 📘 Documentation Site Web — Dorevia-Vault

**Version** : 1.0  
**Date** : 2026-01-19  
**Projet** : Landing Page Dorevia-Vault  
**URL LAB** : https://sylius.lab.core.doreviateam.com

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Architecture Technique](#2-architecture-technique)
3. [Structure du Projet](#3-structure-du-projet)
4. [Pages et Routes](#4-pages-et-routes)
5. [Fonctionnalités](#5-fonctionnalités)
6. [Composants UI](#6-composants-ui)
7. [Intégrations](#7-intégrations)
8. [Configuration](#8-configuration)
9. [Entités de Données](#9-entités-de-données)
10. [Formulaires](#10-formulaires)
11. [Services Métier](#11-services-métier)
12. [Commandes Symfony](#12-commandes-symfony)
13. [Assets et Frontend](#13-assets-et-frontend)
14. [Accessibilité](#14-accessibilité)
15. [SEO](#15-seo)
16. [Performance](#16-performance)
17. [Déploiement](#17-déploiement)
18. [Maintenance](#18-maintenance)
19. [Tests](#19-tests)
20. [Sécurité](#20-sécurité)
21. [RGPD](#21-rgpd)
22. [Troubleshooting](#22-troubleshooting)
23. [Évolutions Futures](#23-évolutions-futures)
24. [Références](#24-références)

---

## 1. Vue d'Ensemble

### 1.1 Description

**Dorevia-Vault** est une plateforme de coffre-fort numérique pour PME françaises, garantissant la traçabilité et la conformité fiscale des documents financiers.

**Site web** : Landing page marketing présentant la solution, ses bénéfices, et permettant la capture de leads.

### 1.2 Promesse Produit

> "De la vente à la banque, chaque décision devient une preuve"

### 1.3 Objectifs du Site

- **Marketing** : Présenter la solution Dorevia-Vault
- **Lead Generation** : Capturer des contacts qualifiés
- **Éducation** : Expliquer le fonctionnement (Validé → Scellé → Prouvé)
- **Confiance** : Démontrer la conformité et la sécurité

---

## 2. Architecture Technique

### 2.1 Stack Technologique

| Composant | Technologie | Version |
|-----------|------------|---------|
| **Framework** | Symfony | 6.4.* |
| **Template Engine** | Twig | 3.x |
| **Base de données** | PostgreSQL | 16 |
| **ORM** | Doctrine | 2.16 |
| **Frontend** | Bootstrap 5 | - |
| **CSS** | Custom + SCSS | - |
| **JavaScript** | Vanilla JS | ES6+ |
| **Reverse Proxy** | Nginx | Alpine |
| **HTTPS** | Caddy | 2.x |
| **Containerisation** | Docker Compose | - |

### 2.2 Architecture Applicative

```
┌─────────────────────────────────────────────────────────┐
│                    Caddy (HTTPS)                         │
│         sylius.lab.core.doreviateam.com                  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    Nginx (Reverse Proxy)                │
│              Headers sécurité, compression               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              PHP-FPM 8.2 (Symfony 6.4)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Controllers  │  │   Services   │  │   Entities   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Forms      │  │ Repositories │  │  Commands   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌──────────────┐            ┌──────────────────┐
│  PostgreSQL  │            │   Odoo CRM API    │
│   (Leads)    │            │  (Synchronisation)│
└──────────────┘            └──────────────────┘
```

### 2.3 Services Docker

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| **php-fpm** | Custom (PHP 8.2) | - | Application Symfony |
| **nginx** | nginx:alpine | - | Reverse proxy |
| **postgres** | postgres:16 | 5432 | Base de données |
| **cron** | php:8.2-fpm-alpine | - | Nettoyage RGPD quotidien |

---

## 3. Structure du Projet

### 3.1 Arborescence

```
units/sylius/
├── config/                      # Configuration Symfony
│   ├── packages/               # Packages (doctrine, framework, etc.)
│   │   ├── parameters.yaml     # Paramètres globaux (WhatsApp, GA)
│   │   ├── security.yaml       # Sécurité
│   │   └── ...
│   └── routes.yaml             # Routes principales
│
├── src/                         # Code source
│   ├── Command/                # Commandes Symfony
│   │   ├── CleanupLeadsCommand.php      # Nettoyage RGPD
│   │   ├── SeedBlogArticlesCommand.php  # Seed blog
│   │   └── UpdateBlogArticlesImagesCommand.php
│   │
│   ├── Controller/             # Contrôleurs
│   │   ├── Admin/              # Administration (EasyAdmin)
│   │   │   ├── DashboardController.php
│   │   │   ├── LeadCrudController.php
│   │   │   └── ArticleCrudController.php
│   │   ├── HomeController.php           # Page d'accueil
│   │   ├── ContactController.php       # Page contact
│   │   ├── LeadController.php          # Traitement formulaire
│   │   ├── BlogController.php          # Blog
│   │   ├── PricingController.php       # Tarifs
│   │   ├── PrivacyController.php       # Confidentialité
│   │   ├── SitemapController.php      # Sitemap XML
│   │   └── HealthController.php       # Health check
│   │
│   ├── Entity/                 # Entités Doctrine
│   │   ├── Lead.php            # Lead (formulaire contact)
│   │   └── Article.php         # Article blog
│   │
│   ├── Repository/             # Repositories Doctrine
│   │   ├── LeadRepository.php
│   │   └── ArticleRepository.php
│   │
│   ├── Form/                   # Formulaires Symfony
│   │   └── LeadType.php        # Formulaire de contact
│   │
│   ├── Service/                # Services métier
│   │   ├── OdooLeadSyncService.php  # Synchronisation Odoo
│   │   └── MarkdownService.php      # Conversion Markdown
│   │
│   └── EventSubscriber/         # Event Subscribers
│       └── SecurityHeadersSubscriber.php  # Headers sécurité
│
├── templates/                   # Templates Twig
│   ├── layout.html.twig        # Layout principal
│   ├── base.html.twig          # Template Symfony (non utilisé)
│   ├── components/             # Composants réutilisables
│   │   └── whatsapp-button.html.twig
│   ├── home/                   # Page d'accueil
│   │   └── index.html.twig
│   ├── contact/                # Page contact
│   │   └── index.html.twig
│   ├── blog/                   # Blog
│   │   ├── index.html.twig
│   │   └── show.html.twig
│   ├── pricing/                # Tarifs
│   │   └── index.html.twig
│   ├── privacy/                # Confidentialité
│   │   └── index.html.twig
│   └── README_TEMPLATES.md     # Documentation templates
│
├── public/                      # Assets publics
│   └── assets/
│       ├── css/                # Styles
│       │   ├── vendor/         # Frameworks (bootstrap, animate)
│       │   ├── base/           # Styles globaux (ud-styles)
│       │   ├── components/     # Composants (whatsapp-button, status-cards)
│       │   └── sections/       # Sections (hero, section-comment)
│       ├── js/                 # Scripts JavaScript
│       │   ├── vendor/         # Frameworks (bootstrap, wow)
│       │   ├── core/           # Fonctions globales (main)
│       │   ├── components/     # Composants (whatsapp-button, header-auto-hide, status-cards)
│       │   └── sections/      # Sections (hero, hero-analytics)
│       ├── images/             # Images
│       └── fonts/              # Polices (LineIcons)
│
├── migrations/                  # Migrations Doctrine
│   └── Version20260116000001.php
│
├── tests/                       # Tests
│   ├── Unit/                   # Tests unitaires
│   ├── Functional/             # Tests fonctionnels
│   └── e2e/                    # Tests end-to-end (Cypress)
│
├── docker-compose.yml           # Services Docker
├── Dockerfile                   # Image PHP-FPM
├── nginx.conf                   # Configuration Nginx
└── README.md                    # Documentation principale
```

---

## 4. Pages et Routes

### 4.1 Routes Publiques

| Route | URL | Contrôleur | Template | Description |
|-------|-----|------------|----------|-------------|
| `home` | `/accueil` | `HomeController::index()` | `home/index.html.twig` | Page d'accueil principale |
| `home_redirect` | `/` | `HomeController::redirectToHome()` | - | Redirection vers `/accueil` |
| `contact` | `/contact` | `ContactController::index()` | `contact/index.html.twig` | Page contact |
| `lead_submit` | `/lead` (POST) | `LeadController::submit()` | - | Traitement formulaire |
| `blog_index` | `/blog` | `BlogController::index()` | `blog/index.html.twig` | Liste articles |
| `blog_show` | `/blog/{slug}` | `BlogController::show()` | `blog/show.html.twig` | Détail article |
| `pricing` | `/pricing` | `PricingController::index()` | `pricing/index.html.twig` | Page tarifs |
| `privacy_index` | `/privacy` | `PrivacyController::index()` | `privacy/index.html.twig` | Confidentialité |
| `sitemap` | `/sitemap.xml` | `SitemapController::sitemap()` | - | Sitemap XML |
| `healthz` | `/healthz` | `HealthController::health()` | - | Health check |

### 4.2 Routes API

| Route | URL | Contrôleur | Description |
|-------|-----|------------|-------------|
| `api_pricing_plans` | `/api/pricing/plans` (GET) | `PricingController::plans()` | Liste des plans tarifaires |
| `api_pricing_calculate` | `/api/pricing/calculate` (POST) | `PricingController::calculate()` | Calcul de tarif |

### 4.3 Routes Administration

| Route | URL | Contrôleur | Description |
|-------|-----|------------|-------------|
| `admin` | `/admin` | `DashboardController::index()` | Dashboard EasyAdmin |
| `admin_leads` | `/admin?crudAction=index&crudControllerFqcn=...` | `LeadCrudController` | Gestion leads |
| `admin_articles` | `/admin?crudAction=index&crudControllerFqcn=...` | `ArticleCrudController` | Gestion articles |

### 4.4 Routes Désactivées (One-Page)

| Route | URL | Contrôleur | Statut |
|-------|-----|------------|--------|
| `blog_index` | `/blog` | `BlogController::index()` | Désactivé (commenté) |
| `blog_show` | `/blog/{slug}` | `BlogController::show()` | Désactivé (commenté) |
| `features` | `/fonctionnalites` | `FeaturesController::index()` | Désactivé (commenté) |
| `how_it_works` | `/comment-ca-marche` | `HowItWorksController::index()` | Désactivé (commenté) |
| `pricing` | `/tarifs` | `PricingPageController::index()` | Désactivé (commenté) |

**Note** : Ces routes sont désactivées car le site est en mode "one-page" (tout sur `/accueil`).

### 4.5 Routes Obsolètes

| Route | URL | Contrôleur | Statut |
|-------|-----|------------|--------|
| `landing_index` | `/landing` | `LandingController::index()` | Redirige vers `home` (301) |

---

## 5. Fonctionnalités

### 5.1 Page d'Accueil (`/accueil`)

**Route** : `home` (`/accueil`)  
**Contrôleur** : `HomeController::index()`  
**Template** : `home/index.html.twig`

**Sections** (dans l'ordre) :
1. **Hero** : 
   - Badge : "🇫🇷 Infrastructure souveraine"
   - H1 : "Sécurisez votre facturation et votre POS."
   - H2 (Baseline) : "Dorevia‑Vault aligne votre système comptable et votre caisse avec les exigences de traçabilité attendues par l'administration française."
   - Description : "Chaque facture et chaque encaissement sont horodatés, scellés et conservés de manière inaltérable."
   - CTA : "Demander une démo", "Voir comment ça marche"
   - Schéma visuel : 3 cartes interactives (Valider, Sceller, Prouver)

2. **Section "Comment ça fonctionne"** (`#how-it-works`) :
   - Titre : "Comment ça fonctionne"
   - Sous-titre : "Automatique. En arrière-plan. Sans rien changer pour vous."
   - 3 cartes pédagogiques :
     - **VALIDER** (dans votre ERP) : Facture validée, Paiement encaissé
     - **SCELLER** (Dorevia-Vault agit) : Horodatage, Empreinte cryptographique, Journal immuable
     - **PROUVER** (quand vous voulez) : Export de preuve, Vérification indépendante, Opposable en cas de contrôle
   - Conclusion : "Vous ne changez rien. Vous gagnez une preuve."
   - CTA : "👉 Voir la démo"

3. **Contexte** : Pourquoi maintenant (réglementation, statistiques)

4. **Problème** : Besoins des entrepreneurs (preuves fiables, documents traçables, etc.)

5. **Solution** : Bénéfices Dorevia-Vault

6. **Bénéfices métier** : Grille de 4 bénéfices (Sérénité, Crédibilité, etc.)

7. **CTA Final** : Appel à l'action (Demander une démo, Nous contacter)

**Composants** :
- Menu navigation (auto-hide au scroll)
- Bouton WhatsApp (flottant)
- Back to top

### 5.2 Formulaire de Contact (`/contact`)

**Route** : `contact` (`/contact`)  
**Contrôleur** : `ContactController::index()`  
**Template** : `contact/index.html.twig`

**Fonctionnalités** :
- Formulaire avec validation Symfony
- Honeypot anti-spam (champ `website` caché)
- Rate limiting (10 requêtes/heure par IP)
- Synchronisation automatique vers Odoo CRM
- Messages de succès/erreur (affichage dynamique)
- Tracking Google Analytics

**Champs** (via `LeadType`) :
- **Email** (requis) : Validation email
- **Message** (requis) : 10-2000 caractères
- **Entreprise** (optionnel) : Nom de l'enseigne
- **Website** (honeypot, caché) : Anti-spam

**Traitement** :
- Route : `lead_submit` (`POST /lead`)
- Contrôleur : `LeadController::submit()`
- Actions :
  1. Validation formulaire
  2. Rate limiting
  3. Création Lead en base
  4. Synchronisation Odoo (asynchrone, non bloquante)
  5. Retour JSON (succès/erreur)

### 5.3 Blog (`/blog`)

**Routes** : 
- `blog_index` (`/blog`) - **Désactivée** (commentée, one-page)
- `blog_show` (`/blog/{slug}`) - **Désactivée** (commentée, one-page)

**Contrôleur** : `BlogController`

**Fonctionnalités** (si activées) :
- Liste articles avec pagination (10 par page)
- Article featured (premier article en hero)
- Détail article avec contenu Markdown converti en HTML
- Navigation précédent/suivant
- Structured data (JSON-LD BlogPosting)
- Images lazy loading (`loading="lazy"`)
- Temps de lecture estimé (calculé automatiquement)
- Compteur de vues

**Note** : Routes désactivées car site en mode one-page. Code conservé pour activation future.

### 5.4 Page Tarifs (`/pricing`)

**Route** : `pricing` (`/pricing`) - **Désactivée** (commentée, one-page)  
**Contrôleur** : `PricingPageController` / `PricingController`

**API Pricing** (actives) :
- `api_pricing_plans` (GET `/api/pricing/plans`) : Liste des plans tarifaires
- `api_pricing_calculate` (POST `/api/pricing/calculate`) : Calcul de tarif personnalisé

**Note** : Routes pages désactivées, mais API disponibles pour intégration future.

### 5.5 Page Confidentialité (`/privacy`)

**Route** : `privacy_index` (`/privacy`)  
**Contrôleur** : `PrivacyController::index()`  
**Template** : `privacy/index.html.twig`

**Contenu** : Politique de confidentialité RGPD
- Base légale : Intérêt légitime
- Conservation : 24 mois maximum
- Droits utilisateur : Accès, rectification, suppression
- Contact : `privacy@doreviateam.com`

---

## 6. Composants UI

### 6.1 Header / Navigation

**Fonctionnalités** :
- Logo cliquable (retour accueil)
- Menu : "Comment ça marche", "Contact"
- CTA : "Demander une démo"
- Auto-hide au scroll down
- Réapparition au scroll up ou survol haut

**Fichiers** :
- CSS : `hero.css` (`.ud-header`)
- JS : `header-auto-hide.js`

### 6.2 Hero Section

**Contenu** :
- Badge : "🇫🇷 Infrastructure souveraine"
- H1 : "Sécurisez votre facturation et votre POS."
- H2 (Baseline) : "Dorevia‑Vault aligne votre système comptable et votre caisse avec les exigences de traçabilité attendues par l'administration française."
- Description : "Chaque facture et chaque encaissement sont horodatés, scellés et conservés de manière inaltérable."
- CTA : "Demander une démo", "Voir comment ça marche"
- Schéma visuel : 3 cartes (Valider, Sceller, Prouver)

**Fichiers** :
- CSS : `hero.css`
- JS : `hero.js`, `hero-analytics.js`

### 6.3 Section "Comment ça fonctionne"

**Contenu** :
- Titre : "Comment ça fonctionne"
- Sous-titre : "Automatique. En arrière-plan. Sans rien changer pour vous."
- 3 cartes :
  1. **VALIDER** (dans votre ERP) : Facture validée, Paiement encaissé
  2. **SCELLER** (Dorevia-Vault agit) : Horodatage, Empreinte cryptographique, Journal immuable
  3. **PROUVER** (quand vous voulez) : Export de preuve, Vérification indépendante, Opposable en cas de contrôle
- Conclusion : "Vous ne changez rien. Vous gagnez une preuve."
- CTA : "👉 Voir la démo"

**Fichiers** :
- CSS : `section-comment.css`
- Template : `home/index.html.twig` (section `#how-it-works`)

### 6.4 Status Cards (Cartes de Statuts)

**Fonctionnalités** :
- Accordion exclusif (une seule carte ouverte)
- 3 statuts : Validé, Scellé, Prouvé
- Animations fluides
- Accessibilité (ARIA, clavier)

**Fichiers** :
- CSS : `status-cards.css`
- JS : `status-cards.js`
- Template : Intégré dans `home/index.html.twig`

### 6.5 Bouton WhatsApp

**Fonctionnalités** :
- Bouton flottant (bas droite)
- Messages contextuels selon page
- Badge disponibilité (heures ouvrables)
- Tracking intégré

**Fichiers** :
- CSS : `whatsapp-button.css`
- JS : `whatsapp-button.js`
- Template : `components/whatsapp-button.html.twig`

### 6.6 Footer

**Contenu** :
- Copyright : "© 2026 Dorevia-Vault. Tous droits réservés."
- Lien : Politique de confidentialité

### 6.7 Back to Top

**Fonctionnalité** : Bouton flottant retour en haut

---

## 7. Intégrations

### 7.1 Odoo CRM

**Service** : `OdooLeadSyncService`

**Fonctionnalité** : Synchronisation automatique des leads vers Odoo CRM

**Mapping** :
- `email` → `email_from` et `name`
- `role` → `function`
- `message` → `description`
- `utm_source` → `source_id` (création si absent)
- `utm_campaign` → `campaign_id` (création si absent)

**Configuration** :
- Variables : `ODOO_URL`, `ODOO_DB`, `ODOO_API_USER`, `ODOO_API_PASSWORD`, `ODOO_TEAM_ID`, `ODOO_USER_ID`

### 7.2 Google Analytics

**Fonctionnalité** : Tracking des événements

**Événements trackés** :
- `whatsapp_button_viewed`
- `whatsapp_button_clicked`
- `CTA` (clics boutons)
- `Lead` (soumission formulaire)

**Configuration** :
- Variable : `GA_MEASUREMENT_ID`
- Format : `G-XXXXXXXXXX`

### 7.3 WhatsApp

**Fonctionnalité** : Contact direct via WhatsApp

**Configuration** :
- Variable : `WHATSAPP_NUMBER`
- Format : `594XXXXXXXX` (sans +, sans espaces)

---

## 8. Configuration

### 8.1 Variables d'Environnement

| Variable | Description | Exemple | Obligatoire |
|----------|-------------|---------|-------------|
| `APP_ENV` | Environnement Symfony | `prod`, `dev` | ✅ |
| `APP_DEBUG` | Mode debug | `0`, `1` | ✅ |
| `DEPLOY_ENV` | Environnement déploiement | `lab`, `prod` | ✅ |
| `DATABASE_URL` | URL PostgreSQL | `postgresql://user:pass@host:5432/db` | ✅ |
| `ODOO_URL` | URL Odoo | `https://odoo.lab.core.doreviateam.com` | ⚠️ |
| `ODOO_DB` | Base Odoo | `odoo_db` | ⚠️ |
| `ODOO_API_USER` | User API Odoo | `sylius_api_user` | ⚠️ |
| `ODOO_API_PASSWORD` | Password API Odoo | `secure_password` | ⚠️ |
| `ODOO_TEAM_ID` | ID équipe Odoo | `1` | ⚠️ |
| `ODOO_USER_ID` | ID commercial Odoo | `1` | ⚠️ |
| `WHATSAPP_NUMBER` | Numéro WhatsApp | `594690123456` | ⚠️ |
| `GA_MEASUREMENT_ID` | Google Analytics | `G-XXXXXXXXXX` | ⚠️ |

### 8.2 Configuration Symfony

**Fichiers principaux** :
- `config/packages/framework.yaml` : Framework Symfony
- `config/packages/doctrine.yaml` : Doctrine ORM
- `config/packages/security.yaml` : Sécurité
- `config/packages/parameters.yaml` : Paramètres globaux
- `config/packages/rate_limiter.yaml` : Rate limiting

### 8.3 Sécurité

**Headers HTTP** (via `SecurityHeadersSubscriber`) :
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: ...` (CSP complet)
- `Permissions-Policy: ...`

**Protection CSRF** : Activée sur tous les formulaires

**Rate Limiting** : 10 requêtes/heure par IP sur `/lead` (POST)

**Honeypot** : Champ `website` invisible pour bloquer bots

---

## 9. Entités de Données

### 9.1 Lead

**Table** : `leads`

**Champs** :
- `id` (integer, auto-increment)
- `public_uuid` (GUID, unique) - UUID public pour identification externe
- `email` (string, 255) - **Obligatoire**, unique
- `message` (text) - **Obligatoire** (10-2000 caractères)
- `company_name` (string, 255, nullable) - Nom de l'enseigne
- `role` (string, 50, nullable) - Valeurs : `dirigeant`, `daf`, `expert_comptable`, `responsable_admin`, `autre`
- `stack` (string, 255, nullable) - Stack technique
- `volume` (text, nullable) - Volume de factures
- `fiscal_country` (string, 50, nullable) - Valeurs : `france`, `autre`
- `siret` (string, 14, nullable) - SIRET (14 chiffres)
- `website` (string, nullable) - **Honeypot** (champ caché anti-spam)
- `utm_source` (string, 255, nullable) - Source UTM
- `utm_campaign` (string, 255, nullable) - Campagne UTM
- `utm_medium` (string, 255, nullable) - Medium UTM
- `utm_content` (string, 255, nullable) - Content UTM
- `referrer` (text, nullable) - Referrer HTTP
- `status` (string, 50, default: 'new') - Valeurs : `new`, `contacted`, `qualified`, `converted`, `archived`
- `ip_hash` (string, 255, nullable) - Hash de l'IP (anonymisation)
- `user_agent` (text, nullable) - User Agent
- `created_at` (datetime_immutable) - Date de création
- `odoo_lead_id` (integer, nullable) - ID du lead dans Odoo
- `odoo_sync_status` (string, 20, nullable) - Valeurs : `success`, `failed`, `pending`
- `odoo_synced_at` (datetime_immutable, nullable) - Date de synchronisation Odoo

**Méthodes** :
- `canSyncToOdoo(): bool` - Vérifie si le lead peut être synchronisé
- `markAsSynced(int $odooLeadId): self` - Marque comme synchronisé
- `markAsSyncFailed(): self` - Marque comme échec
- `markAsSyncPending(): self` - Marque comme en attente

**Relations** : Aucune

### 9.2 Article

**Table** : `articles`

**Index** :
- `idx_article_slug` : Index sur `slug`
- `idx_article_status_published` : Index composite sur `status` et `published_at`

**Champs** :
- `id` (integer, auto-increment)
- `public_uuid` (GUID, unique) - UUID public pour identification externe
- `title` (string, 255) - **Obligatoire**
- `slug` (string, 255, unique) - **Obligatoire**, pour URL
- `content` (text) - **Obligatoire**, contenu Markdown
- `excerpt` (text, nullable) - Extrait/description courte
- `author` (string, 255) - **Obligatoire**
- `published_at` (datetime_immutable, nullable) - Date de publication (null = brouillon)
- `status` (string, 50, default: 'draft') - Valeurs : `draft`, `published`, `archived`
- `meta_description` (text, nullable) - Meta description SEO
- `meta_keywords` (string, 500, nullable) - Meta keywords SEO
- `cover_image` (string, 500, nullable) - URL image de couverture
- `created_at` (datetime_immutable) - Date de création
- `updated_at` (datetime_immutable) - Date de mise à jour
- `views` (integer, default: 0) - Nombre de vues

**Méthodes** :
- `isPublished(): bool` - Vérifie si l'article est publié
- `getReadingTime(): int` - Calcule le temps de lecture (minutes, basé sur 200 mots/min)
- `incrementViews(): self` - Incrémente le compteur de vues

**Relations** : Aucune

**Note** : Le contenu Markdown est converti en HTML via `MarkdownService` avant affichage.

---

## 10. Formulaires

### 10.1 LeadType (Formulaire de Contact)

**Fichier** : `src/Form/LeadType.php`

**Champs** :
- **Email** (`EmailType`) : Obligatoire, validation email
- **Message** (`TextareaType`) : Obligatoire, 10-2000 caractères
- **Entreprise** (`TextType`) : Optionnel, nom de l'enseigne
- **Rôle** (`ChoiceType`) : Optionnel, valeurs : `dirigeant`, `daf`, `expert_comptable`, `responsable_admin`, `autre`
- **Website** (`HiddenType`) : Honeypot anti-spam, non mappé à l'entité

**Sécurité** :
- CSRF : Activé (`csrf_token_id: 'lead_form'`)
- Honeypot : Champ `website` caché (`display: none`, `tabindex: -1`)

**Validation** :
- Contraintes Symfony (`Assert\NotBlank`, `Assert\Email`, `Assert\Length`, `Assert\Choice`)
- Messages d'erreur personnalisés

---

## 11. Services Métier

### 11.1 OdooLeadSyncService

**Rôle** : Synchroniser les leads vers Odoo CRM

**Méthodes** :
- `syncLeadToOdoo(Lead $lead): void` : Synchronise un lead vers Odoo

**Fonctionnalités** :
- Création automatique des sources marketing (`utm_source` → `crm.utm.source`)
- Création automatique des campagnes (`utm_campaign` → `crm.utm.campaign`)
- Mapping des champs (email, role, message, etc.)
- Gestion des erreurs : Loggées mais n'empêchent pas création lead
- Statut de synchronisation : `success`, `failed`, `pending`

**Configuration** :
- Variables : `ODOO_URL`, `ODOO_DB`, `ODOO_API_USER`, `ODOO_API_PASSWORD`, `ODOO_TEAM_ID`, `ODOO_USER_ID`
- Protocole : XML-RPC

### 11.2 MarkdownService

**Rôle** : Convertir Markdown en HTML

**Utilisation** : Articles blog

**Fonctionnalités** :
- Conversion Markdown → HTML
- Support syntaxe Markdown standard

---

## 12. Commandes Symfony

### 11.1 CleanupLeadsCommand

**Commande** : `app:cleanup-leads`

**Rôle** : Nettoyer les leads > 24 mois (RGPD)

**Exécution** : CRON quotidien (2h du matin)

### 11.2 SeedBlogArticlesCommand

**Commande** : `app:seed-blog-articles`

**Rôle** : Créer des articles de blog de test

### 11.3 UpdateBlogArticlesImagesCommand

**Commande** : `app:update-blog-articles-images`

**Rôle** : Mettre à jour les images des articles

---

## 13. Assets et Frontend

### 12.1 Organisation CSS

**Structure logique** (commentaires dans templates) :
- **Vendor** : Bootstrap, Animate.css, LineIcons
- **Base** : `ud-styles.css` (styles globaux)
- **Components** : `whatsapp-button.css`, `status-cards.css`
- **Sections** : `hero.css`, `section-comment.css`

### 12.2 Organisation JavaScript

**Structure logique** :
- **Vendor** : Bootstrap, WOW.js
- **Core** : `main.js` (fonctions globales)
- **Components** : `whatsapp-button.js`, `header-auto-hide.js`, `status-cards.js`
- **Sections** : `hero.js`, `hero-analytics.js`

### 12.3 Optimisations

- **Preload CSS** : CSS critiques (bootstrap, ud-styles, hero, section-comment, status-cards)
- **Defer JS** : Tous les scripts en `defer`
- **Lazy loading** : Images blog avec `loading="lazy"`

---

## 14. Accessibilité

### 13.1 ARIA Labels

- Navigation : `role="menubar"`, `role="menuitem"`, `aria-label`
- Boutons : `aria-label` descriptifs
- Images décoratives : `aria-hidden="true"`
- Status cards : `aria-expanded`, `aria-controls`

### 13.2 Navigation Clavier

- Support Tab + Enter partout
- Focus visible (`:focus-visible`)
- Skip links (si nécessaire)

### 13.3 Contraste

- WCAG AA minimum
- Couleurs vérifiées

### 13.4 Animations

- Respect `prefers-reduced-motion`
- Animations désactivables

---

## 15. SEO

### 14.1 Meta Tags

- **Title** : Par page (block `title`)
- **Description** : Par page (block `meta_description`)
- **Keywords** : Par page (block `meta_keywords`)
- **Robots** : Conditionnel selon environnement

### 14.2 Open Graph

- `og:type`, `og:title`, `og:description`, `og:url`, `og:site_name`, `og:locale`

### 14.3 Twitter Cards

- `twitter:card`, `twitter:title`, `twitter:description`

### 14.4 Sitemap

- Route : `/sitemap.xml`
- Format : XML standard
- URLs : Dynamiques (utilise requête actuelle)

### 14.5 Structured Data

- Articles blog : JSON-LD (BlogPosting)

---

## 16. Performance

### 15.1 Optimisations Appliquées

- Preload CSS critiques
- Defer sur tous les JS
- Lazy loading images (blog)
- Compression Nginx
- Cache headers

### 15.2 Métriques Cibles

- Lighthouse Score : > 90
- First Contentful Paint : < 1.5s
- Time to Interactive : < 3s

---

## 17. Déploiement

### 16.1 Environnement LAB

**URL** : https://sylius.lab.core.doreviateam.com

**Configuration** :
- `APP_ENV=prod`
- `DEPLOY_ENV=lab`
- `APP_DEBUG=0`

### 16.2 Commandes Déploiement

```bash
# Démarrer services
cd units/sylius
docker compose up -d

# Migrations
docker compose exec php-fpm php bin/console doctrine:migrations:migrate

# Vider cache
docker compose exec php-fpm php bin/console cache:clear

# Vérifier santé
curl https://sylius.lab.core.doreviateam.com/healthz
```

---

## 18. Maintenance

### 17.1 CRON RGPD

**Service** : `cron` (Docker)

**Commande** : `app:cleanup-leads`

**Fréquence** : Quotidien (2h du matin)

**Action** : Supprime leads > 24 mois

### 17.2 Logs

**Emplacement** : `docker compose logs php-fpm`

**Niveaux** : INFO, WARNING, ERROR

### 17.3 Sauvegarde

**Base de données** :
```bash
docker compose exec postgres pg_dump -U sylius sylius_db > backup.sql
```

---

## 19. Tests

### 18.1 Tests Unitaires

**Emplacement** : `tests/Unit/`

**Couverture** : Entités, Services

### 18.2 Tests Fonctionnels

**Emplacement** : `tests/Functional/`

**Couverture** : Contrôleurs

### 18.3 Tests E2E

**Emplacement** : `tests/e2e/`

**Framework** : Cypress

**Objectif** : Couverture > 80%

---

## 20. Sécurité

### 19.1 Headers Sécurité

Voir section [8.3 Configuration - Sécurité](#83-sécurité)

### 19.2 Rate Limiting

- **Endpoint** : `POST /lead`
- **Limite** : 10 requêtes/heure par IP
- **Configuration** : `config/packages/rate_limiter.yaml`

### 19.3 CSRF

- Protection activée sur tous les formulaires
- Token généré automatiquement par Symfony

### 19.4 Honeypot

- Champ `website` invisible
- Bloque les bots automatiquement

---

## 21. RGPD

### 20.1 Conservation

- **Durée** : 24 mois maximum
- **Nettoyage** : Automatique (CRON quotidien)

### 20.2 Base Légale

- **Intérêt légitime** : Traitement des demandes commerciales

### 20.3 Droits Utilisateur

- Accès, rectification, suppression
- Contact : `privacy@doreviateam.com`
- Page : `/privacy`

---

## 22. Troubleshooting

### 21.1 Services ne démarrent pas

```bash
docker compose logs
docker network ls | grep dorevia-network
```

### 21.2 Erreur PostgreSQL

- Vérifier service `postgres` démarré
- Vérifier `DATABASE_URL`
- Vérifier réseau Docker

### 21.3 Erreur Odoo

- Vérifier logs : `docker compose logs php-fpm | grep Odoo`
- Vérifier variables `ODOO_*`
- Tester connexion manuellement

---

## 23. Évolutions Futures

### 23.1 Performance

- [ ] Minification CSS/JS en prod
- [ ] Format WebP pour images
- [ ] Service Worker (PWA)

### 23.2 SEO

- [ ] Structured data toutes pages
- [ ] Canonical URLs
- [ ] Hreflang si multilingue

### 23.3 Fonctionnalités

- [ ] Chatbot léger
- [ ] Newsletter
- [ ] Calculatrice ROI

---

## 24. Références

### 24.1 Documentation Interne

- `units/sylius/README.md` : Documentation principale du projet
- `units/sylius/templates/README_TEMPLATES.md` : Structure et conventions templates
- `ZeDocs/web4/` : Spécifications UX/UI et analyses

### 24.2 Technologies

- [Symfony 6.4 Documentation](https://symfony.com/doc/6.4/)
- [Doctrine ORM](https://www.doctrine-project.org/)
- [Twig](https://twig.symfony.com/)
- [Bootstrap 5](https://getbootstrap.com/)
- [Docker Compose](https://docs.docker.com/compose/)

### 24.3 Standards et Bonnes Pratiques

- **Accessibilité** : [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- **SEO** : [Google Search Central](https://developers.google.com/search)
- **Sécurité** : [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- **RGPD** : [CNIL](https://www.cnil.fr/)

---

## 25. Résumé Exécutif

### 25.1 Technologies Clés

- **Backend** : Symfony 6.4 (PHP 8.2)
- **Base de données** : PostgreSQL 16
- **Frontend** : Bootstrap 5 + Custom CSS/JS
- **Containerisation** : Docker Compose
- **Reverse Proxy** : Nginx + Caddy (HTTPS)

### 25.2 Fonctionnalités Principales

- ✅ Landing page marketing complète
- ✅ Formulaire de contact avec validation
- ✅ Synchronisation automatique Odoo CRM
- ✅ Blog (routes désactivées, code présent)
- ✅ Administration EasyAdmin
- ✅ Bouton WhatsApp contextuel
- ✅ Menu navigation auto-hide
- ✅ Accessibilité (ARIA, clavier)
- ✅ SEO (Open Graph, Twitter Cards, Sitemap)
- ✅ Sécurité (CSP, rate limiting, honeypot)

### 25.3 Points Forts

- ✅ Architecture moderne (Symfony 6.4)
- ✅ Code propre et documenté
- ✅ Tests (unitaires, fonctionnels, e2e)
- ✅ Configuration externalisée
- ✅ Accessibilité respectée
- ✅ Performance optimisée
- ✅ Sécurité renforcée

---

**Fin de la documentation**

# Analyse de la Structure Actuelle du Site

**Date** : 2026-01-20  
**Objectif** : Analyser la structure actuelle et proposer une réorganisation complète

---

## 📊 État Actuel

### Pages Actives

| Route | URL | Template | Statut | Description |
|-------|-----|----------|--------|-------------|
| `home` | `/accueil` | `home/index.html.twig` | ✅ Actif | Landing page complète (3 sections principales) |
| `contact` | `/contact` | `contact/index.html.twig` | ✅ Actif | Formulaire de contact |
| `privacy_index` | `/privacy` | `privacy/index.html.twig` | ✅ Actif | Politique de confidentialité |
| `sitemap` | `/sitemap.xml` | - | ✅ Actif | Sitemap XML |
| `health_check` | `/healthz` | - | ✅ Actif | Health check |
| `home_redirect` | `/` | - | ✅ Actif | Redirection 301 vers `/accueil` |

### Pages Désactivées (One-Page)

| Route | URL | Template | Statut | Raison |
|-------|-----|----------|--------|--------|
| `blog_index` | `/blog` | `blog/index.html.twig` | ❌ Désactivé | Mode one-page |
| `blog_show` | `/blog/{slug}` | `blog/show.html.twig` | ❌ Désactivé | Mode one-page |
| `features` | `/fonctionnalites` | `features/index.html.twig` | ❌ Désactivé | Mode one-page |
| `how_it_works` | `/comment-ca-marche` | `how-it-works/index.html.twig` | ❌ Désactivé | Mode one-page |
| `pricing` | `/tarifs` | `pricing/index.html.twig` | ❌ Désactivé | Mode one-page |

### Structure Actuelle de la Landing Page (`/accueil`)

**Hero** (conservé)

**Section 1 : Le problème** (`id="problem"`)
- Sous-section 1.1 : Les défis du pilotage financier (`id="defis-pilotage"`)
- Sous-section 1.2 : Contexte réglementaire (`id="contexte-reglementaire"`)

**Section 2 : La solution** (`id="solution"`)
- Sous-section 2.1 : Ce que fait Dorevia-Vault (`id="ce-que-fait"`)
- Sous-section 2.2 : Comment ça marche (`id="comment-ca-marche"`)
- Sous-section 2.3 : Les bénéfices (`id="benefices"`)
- Sous-section 2.4 : Notre conviction (`id="notre-conviction"`)

**Section 3 : Pour vous** (`id="for-you"`)
- Sous-section 3.1 : Pour qui (`id="pour-qui"`)
- Sous-section 3.2 : Pourquoi c'est différent (`id="pourquoi-different"`)
- Sous-section 3.3 : Pourquoi nous faire confiance (`id="pourquoi-confiance"`)
- Sous-section 3.4 : Crédibilité (`id="credibilite"`)

**CTA Final**

### Menu de Navigation Actuel

- **Défi** (dropdown)
  - Les défis du pilotage financier
  - Contexte réglementaire
- **Solution** (dropdown)
  - Ce que fait Dorevia-Vault
  - Comment ça marche
  - Les bénéfices
  - Notre conviction
- **Pour vous** (dropdown)
  - Pour qui
  - Pourquoi c'est différent
  - Pourquoi nous faire confiance
  - Crédibilité
- **Contact** (lien direct)

---

## 🎯 Problèmes Identifiés

1. **Structure one-page uniquement** : Tout le contenu est sur une seule page
2. **Pages désactivées** : Plusieurs templates existent mais ne sont pas utilisés
3. **Navigation complexe** : Menu avec dropdowns peut être amélioré
4. **Pas de séparation claire** : Contenu mélangé sur une seule page
5. **SEO limité** : Une seule page = moins d'opportunités SEO

---

## 💡 Questions pour la Réorganisation

Avant de proposer une nouvelle structure, j'ai besoin de clarifier :

1. **Souhaitez-vous garder le mode one-page** ou passer à un site multi-pages ?
2. **Quelles pages doivent être accessibles** depuis le menu principal ?
3. **Faut-il activer les pages désactivées** (blog, features, how-it-works, pricing) ?
4. **Quelle est la priorité** : simplicité (one-page) ou SEO/UX (multi-pages) ?
5. **Le menu doit-il rester avec dropdowns** ou préférez-vous une navigation plus simple ?

---

## 📋 Prochaines Étapes

En attente de vos réponses pour proposer une structure optimale.

# 📋 Plan d'Implémentation Scrum — Landing Page Dorevia-Vault v2.0 (Version Lean)

**Date de création :** 2026-01-22  
**Version :** v1.1 (Lean)  
**Référence :** `SPEC_REFONTE_V2.0_COMPLETE.md`  
**Durée estimée totale :** 2-3 sprints (2-3 semaines)  
**Approche :** Lean — Livrer vite, itérer court

---

## 🎯 Principe directeur

> **Livrer vite une home qui convertit, puis améliorer.**  
On privilégie la preuve, la clarté du message et l'action commerciale avant l'exhaustivité fonctionnelle.

---

## ❌ Ce que nous évitons

- ❌ Projets longs (8–10 semaines)
- ❌ Over-engineering (dashboard complexe, WCAG AA dès V1)
- ❌ Pages secondaires lourdes avant validation marché
- ❌ Ton trop "fondateur" ou émotionnel

---

## 🎯 Objectif du projet

Refondre la landing page Dorevia-Vault selon la spécification v2.0 avec un ton B2B professionnel, en passant de 7+ sections à 4 sections focalisées. **Approche Lean : livrer vite, itérer court.**

---

## ✅ Ce que nous visons

- ✅ Home en **4 sections**
- ✅ Ton **B2B sérieux** (CFO / dirigeants)
- ✅ Preuve concrète (captures, schéma, démo réelle)
- ✅ Conversion rapide (CTA clairs)
- ✅ Itération courte

---

## 📊 Vue d'ensemble (Version Lean)

### Sprints prévus

| Sprint | Durée | Objectif principal | Story Points |
|--------|-------|-------------------|--------------|
| **Sprint 0** | 2-3 jours | Préparation & Setup | 3 SP |
| **Sprint 1** | 1 semaine | Home v2 publiable | 8 SP |
| **Sprint 2** | 1 semaine | Crédibilité & Performance | 5 SP |
| **Sprint 3** | Optionnel | Contenu SEO (pages secondaires) | 5 SP |

**Total estimé :** 16 SP (Sprints 0-2) + 5 SP optionnel = **21 SP max** (≈ 2-3 semaines)

**Règle d'or :** Preuve > discours. Si tu peux montrer → tu montres. Si tu peux mesurer → tu affiches.

---

## 🏃 Sprint 0 : Préparation & Setup (Lean)

**Durée :** 2-3 jours  
**Story Points :** 3 SP  
**Objectif :** Être prêt à livrer rapidement

### User Stories

#### US-0.1 : Setup environnement de développement
**Story Points :** 1 SP  
**Priorité :** P0 (Critique)

**Description :**
En tant que développeur, je veux un environnement de développement configuré pour pouvoir commencer l'implémentation.

**Tâches :**
- [ ] Créer branche Git `feature/landing-v2-refonte`
- [ ] Configurer environnement local (serveur de dev, hot-reload)
- [ ] Installer dépendances minimales
- [ ] Créer structure de dossiers (assets, styles)

**Définition of Done :**
- Environnement fonctionnel
- Hot-reload opérationnel
- Build OK

---

#### US-0.2 : Préparer assets minimum section Preuve
**Story Points :** 2 SP  
**Priorité :** P0 (Critique)

**Description :**
En tant que développeur, je veux avoir les assets minimum nécessaires pour la section Preuve avant de commencer l'implémentation.

**Tâches :**
- [ ] Créer schéma SVG du flux Odoo → DVIG → Vault (minimum requis)
- [ ] 1 capture Odoo réelle (si disponible, sinon placeholder)
- [ ] Préparer lien vers démo interactive (si disponible)

**Définition of Done :**
- Schéma SVG créé et fonctionnel
- Au moins 1 asset réel ou placeholder acceptable
- Aucun lien mort

**Risque :** Si assets non disponibles, utiliser placeholders avec schéma SVG (acceptable pour Sprint 1)

---

#### US-0.3 : Créer routes pages secondaires (vides)
**Story Points :** 1 SP  
**Priorité :** P1 (Haute)

**Description :**
En tant que développeur, je veux créer les routes des pages secondaires (vides) pour éviter les liens morts.

**Tâches :**
- [ ] Créer routes vides :
  - [ ] `/manifeste` (template minimal)
  - [ ] `/pour-qui` (template minimal)
  - [ ] `/cas-usage` (template minimal)
  - [ ] `/conformite` (template minimal)
- [ ] Ajouter routes dans le router (si framework)

**Définition of Done :**
- 4 routes créées (pages vides acceptables)
- Navigation vers ces pages fonctionnelle (pas de 404)
- Layout minimal cohérent

**Note :** Contenu complet des pages → Sprint 3 (optionnel, après validation marché)

---

### Sprint 0 - Backlog

| US | Titre | SP | Priorité | Statut |
|----|-------|----|----------|--------|
| US-0.1 | Setup environnement | 1 | P0 | À faire |
| US-0.2 | Préparer assets minimum | 2 | P0 | À faire |
| US-0.3 | Créer routes pages secondaires | 1 | P1 | À faire |

**Total Sprint 0 :** 4 SP (3 SP prévus, ajustement possible)

---

## 🏃 Sprint 1 : Home v2 publiable (Lean)

**Durée :** 1 semaine  
**Story Points :** 8 SP  
**Objectif :** Mettre en ligne une home B2B complète avec 4 sections

### User Stories

#### US-1.1 : Implémenter Hero (version figée)
**Story Points :** 2 SP  
**Priorité :** P0 (Critique)

**Description :**
En tant qu'utilisateur, je veux voir un Hero impactant pour comprendre immédiatement la valeur de Dorevia-Vault.

**Tâches :**
- [ ] Intégrer le Hero existant (figé selon SPEC)
- [ ] Adapter wording : "événements financiers" (au lieu de "opérations")
- [ ] Badges : Preuves vérifiables, Zéro manipulation, ERP-agnostique, Souverain
- [ ] Dashboard visuel simplifié (placeholder acceptable pour Sprint 1)
- [ ] Responsive : Stack vertical sur mobile

**Définition of Done :**
- Hero fonctionnel
- Wording B2B conforme
- Responsive testé (desktop, mobile)
- Dashboard placeholder acceptable (amélioration → Sprint 2)

**Acceptance Criteria :**
- Texte "événements financiers" présent
- 4 badges visibles
- Mobile : stack vertical fonctionnel
- Pas de lien mort

---

#### US-1.2 : Implémenter section Positionnement
**Story Points :** 3 SP  
**Priorité :** P0 (Critique)

**Description :**
En tant qu'utilisateur, je veux comprendre le positionnement unique de Dorevia-Vault avec des messages clairs et factuels.

**Tâches :**
- [ ] Créer structure HTML section Positionnement
- [ ] Intégrer messages clés B2B :
  - [ ] "Votre ERP produit en continu..."
  - [ ] "nativement probantes" (en gras)
  - [ ] "conformes aux exigences LNE 2026 / NF525" (en gras)
- [ ] Créer 2 cartes :
  - [ ] Carte 1 : "ERP + événements" avec flux visuel
  - [ ] Carte 2 : "Preuve automatisée" avec texte B2B
- [ ] CTA "Voir la démo" (bouton secondaire, centré après grid)
- [ ] Styles CSS : `.dv-position`, `.dv-card`, `.dv-flow`
- [ ] Responsive : Grid → Stack sur mobile

**Définition of Done :**
- Section Positionnement complète
- Wording B2B conforme
- 2 cartes avec titres courts
- CTA positionné correctement
- Responsive fonctionnel

**Acceptance Criteria :**
- Titre "L'ERP est votre matière première..." présent
- 3 paragraphes avec messages clés
- 2 cartes côte à côte (desktop)
- Flux visuel ERP → Événements → Preuves
- CTA "Voir la démo" visible et fonctionnel

---

#### US-1.3 : Implémenter section Preuve
**Story Points :** 2 SP  
**Priorité :** P0 (Critique)

**Description :**
En tant qu'utilisateur, je veux voir une preuve concrète que le produit existe et fonctionne.

**Tâches :**
- [ ] Créer structure HTML section Preuve
- [ ] Intégrer message B2B : "Accédez à une démonstration réelle sur une instance en production."
- [ ] Classe CSS : `.proof-hook` (18px, normal, muted)
- [ ] Grid layout : visuel à gauche, liste à droite
- [ ] Liste sans emojis (4 items)
- [ ] Intégrer assets (schéma SVG minimum, capture si disponible)
- [ ] CTA "Voir la démo" (bouton primaire)
- [ ] Microcopy : "Instance réelle • 30 minutes • Sans engagement"
- [ ] Responsive : Stack vertical sur mobile

**Définition of Done :**
- Section Preuve complète
- Message B2B conforme
- Liste sans emojis
- Assets minimum intégrés (schéma SVG au minimum)
- Responsive fonctionnel

---

#### US-1.4 : Implémenter section Conversation & CTA
**Story Points :** 2 SP  
**Priorité :** P0 (Critique)

**Description :**
En tant qu'utilisateur, je veux pouvoir échanger sur mon contexte et accéder facilement aux CTAs de conversion.

**Tâches :**
- [ ] Créer structure HTML section Conversation & CTA
- [ ] Titre : "Échangeons sur votre contexte"
- [ ] Accroche : "ERP • Process • Volumétrie • Contraintes"
- [ ] Message de transparence B2B :
  - [ ] "Chaque demande est analysée pour qualifier votre environnement et valider l'adéquation produit."
  - [ ] "Réponse rapide. Aucun démarchage automatique."
- [ ] 2 CTAs hiérarchisés :
  - [ ] CTA primaire : "Voir la démo"
  - [ ] CTA secondaire : "Présenter votre projet"
- [ ] Microcopy : "30 minutes • sans engagement"
- [ ] Styles : centré, `.dv-transparency` avec text-align: left
- [ ] Responsive : adaptation mobile

**Définition of Done :**
- Section Conversation & CTA complète
- Wording B2B conforme
- 2 CTAs fonctionnels
- Responsive fonctionnel

---

#### US-1.5 : Navigation + Footer
**Story Points :** 1 SP  
**Priorité :** P0 (Critique)

**Description :**
En tant qu'utilisateur, je veux une navigation claire vers toutes les sections et pages du site.

**Tâches :**
- [ ] Mettre à jour menu principal :
  - [ ] Ancres : `#positionnement`, `#preuve`, `#conversation-cta`
  - [ ] Liens pages secondaires : `/manifeste`, `/pour-qui`, `/cas-usage`, `/conformite`
- [ ] Mettre à jour footer avec liens
- [ ] Responsive : hamburger menu sur mobile

**Définition of Done :**
- Navigation fonctionnelle
- Tous les liens fonctionnels
- Hamburger menu fonctionnel (mobile)

**Description :**
En tant que développeur, je veux des styles CSS cohérents pour la section Positionnement qui respectent le design system.

**Tâches :**
- [ ] Créer styles `.dv-position`
- [ ] Styles cartes : `.dv-card` (fond, bordure, ombre)
- [ ] Styles flux : `.dv-flow`, `.dv-pill`, `.dv-arrow`
- [ ] Hiérarchie typographique (titres, paragraphes, gras)
- [ ] Espacements cohérents (margin-top: 32px pour grid)
- [ ] Responsive : media queries pour mobile

**Définition of Done :**
- Styles CSS complets
- Design system respecté
- Responsive testé
- Pas de conflits CSS

---

### Sprint 1 - Backlog

| US | Titre | SP | Priorité | Statut |
|----|-------|----|----------|--------|
| US-1.1 | Hero (version figée) | 2 | P0 | À faire |
| US-1.2 | Section Positionnement | 3 | P0 | À faire |
| US-1.3 | Section Preuve | 2 | P0 | À faire |
| US-1.4 | Section Conversation & CTA | 2 | P0 | À faire |
| US-1.5 | Navigation + Footer | 1 | P0 | À faire |

**Total Sprint 1 :** 10 SP (8 SP prévus, ajustement possible)

**DoD Sprint 1 :**
- [ ] 4 sections complètes
- [ ] Wording B2B validé
- [ ] CTAs fonctionnels
- [ ] Mobile OK
- [ ] Aucun lien mort

---

## 🏃 Sprint 2 : Crédibilité & Performance (Lean)

**Durée :** 1 semaine  
**Story Points :** 5 SP  
**Objectif :** Renforcer la preuve et la confiance, optimiser la performance

### User Stories

#### US-2.1 : Renforcer preuve réelle
**Story Points :** 2 SP  
**Priorité :** P0 (Critique)

**Description :**
En tant qu'utilisateur, je veux voir des preuves réelles (captures, vidéo) pour renforcer ma confiance.

**Tâches :**
- [ ] Remplacer placeholders par :
  - [ ] Captures réelles Odoo (si disponibles)
  - [ ] Mini-vidéo (optionnel, si disponible)
  - [ ] Schéma SVG amélioré si nécessaire
- [ ] Micro-copy finalisée et validée
- [ ] Vérifier cohérence visuelle

**Définition of Done :**
- Preuve réelle visible (au moins captures)
- Placeholders remplacés
- Micro-copy validée

---

#### US-2.2 : Optimisation performance
**Story Points :** 2 SP  
**Priorité :** P1 (Haute)

**Description :**
En tant qu'utilisateur, je veux une page qui charge rapidement pour une bonne expérience.

**Tâches :**
- [ ] Optimiser images :
  - [ ] Conversion WebP
  - [ ] Compression
  - [ ] Lazy loading
- [ ] Minifier CSS et JS
- [ ] Optimiser fonts (preload si nécessaire)
- [ ] Vérifier Core Web Vitals :
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1

**Définition of Done :**
- Lighthouse score ~85-90 (acceptable pour V1)
- Images optimisées
- CSS/JS minifiés
- LCP < 2.5s

---

#### US-2.3 : Accessibilité basique + Tracking
**Story Points :** 1 SP  
**Priorité :** P1 (Haute)

**Description :**
En tant que développeur, je veux une accessibilité basique et un tracking opérationnel pour mesurer l'impact.

**Tâches :**
- [ ] Accessibilité basique :
  - [ ] Navigation clavier fonctionnelle
  - [ ] Contrastes vérifiés
  - [ ] Headings propres (h1, h2, h3)
- [ ] Tracking :
  - [ ] Clics sur CTAs
  - [ ] Scroll depth
  - [ ] Événements de conversion

**Définition of Done :**
- Navigation clavier OK
- Contrastes conformes (basique)
- Tracking opérationnel
- Événements testés

---

### Sprint 2 - Backlog

| US | Titre | SP | Priorité | Statut |
|----|-------|----|----------|--------|
| US-2.1 | Renforcer preuve réelle | 2 | P0 | À faire |
| US-2.2 | Optimisation performance | 2 | P1 | À faire |
| US-2.3 | Accessibilité basique + Tracking | 1 | P1 | À faire |

**Total Sprint 2 :** 5 SP

**DoD Sprint 2 :**
- [ ] Preuve réelle visible
- [ ] Lighthouse ~85-90
- [ ] Tracking opérationnel
- [ ] Accessibilité basique OK

---

## 🏃 Sprint 3 : Contenu SEO (Optionnel)

**Durée :** 1 semaine (si nécessaire)  
**Story Points :** 5 SP  
**Objectif :** Profondeur de contenu pour SEO  
**⚠️ Seulement après validation marché**

### User Stories

#### US-3.1 : Compléter pages secondaires
**Story Points :** 5 SP  
**Priorité :** P2 (Nice to have)

**Description :**
En tant qu'utilisateur, je veux accéder à des pages secondaires complètes pour approfondir ma compréhension.

**Tâches :**
- [ ] Compléter `/pour-qui` (extrait ancienne section)
- [ ] Compléter `/cas-usage` (extrait ancienne section)
- [ ] Compléter `/conformite` (extrait ancienne section)
- [ ] Compléter `/manifeste` (contenu complet)
- [ ] Layout cohérent avec la home
- [ ] Navigation breadcrumb
- [ ] Responsive

**Définition of Done :**
- 4 pages complètes
- Contenu structuré
- Layout cohérent
- Navigation fonctionnelle

**⚠️ Note :** Sprint optionnel, seulement après validation marché (Sprints 1-2)

---

### Sprint 3 - Backlog

| US | Titre | SP | Priorité | Statut |
|----|-------|----|----------|--------|
| US-3.1 | Pages secondaires complètes | 5 | P2 | Optionnel |

**Total Sprint 3 :** 5 SP (optionnel)

---

## 🏃 Déploiement (intégré dans Sprint 2)

**Durée :** 0.5 jour  
**Objectif :** Mettre en ligne la refonte

**Note :** Le déploiement est intégré dans le Sprint 2 (fin de semaine). Pas de sprint dédié pour rester lean.

### Tâches de déploiement (intégrées Sprint 2)

**Tâches :**
- [ ] Préparer environnement de staging
- [ ] Déployer sur staging
- [ ] Tests fonctionnels rapides :
  - [ ] Navigation (ancres, liens)
  - [ ] CTAs fonctionnels
  - [ ] Responsive (desktop, mobile)
  - [ ] Cross-browser basique (Chrome, Firefox)
- [ ] Déployer sur production
- [ ] Vérifier post-déploiement
- [ ] Monitorer erreurs (24-48h)

**Définition of Done :**
- Déploiement réussi
- Site accessible en production
- Pas d'erreurs critiques
- Monitoring en place

---

## 📊 Backlog global (Version Lean)

### Priorisation

**P0 (Critique) - Must Have :**
- US-0.1, US-0.2 : Setup + Assets minimum
- US-1.1, US-1.2, US-1.3, US-1.4, US-1.5 : Home 4 sections complète
- US-2.1 : Preuve réelle
- Déploiement (intégré Sprint 2)

**P1 (Haute) - Should Have :**
- US-0.3 : Routes pages secondaires (vides OK)
- US-2.2, US-2.3 : Performance + Accessibilité basique + Tracking

**P2 (Nice to Have) - Optionnel :**
- US-3.1 : Pages secondaires complètes (après validation marché)
- Dashboard Hero avancé (amélioration future)
- WCAG AA complet (amélioration future)

---

## 🎯 Définition of Done (globale - Version Lean)

Une user story est considérée comme "Done" quand :

- [ ] Code implémenté et fonctionnel
- [ ] Code review effectuée et validée (si applicable)
- [ ] Tests fonctionnels basiques passent
- [ ] Responsive testé (desktop, mobile minimum)
- [ ] Wording B2B conforme
- [ ] Accessibilité basique (navigation clavier, contrastes)
- [ ] Performance acceptable (Lighthouse ~85-90 pour V1)
- [ ] Pas de régression
- [ ] Aucun lien mort

**Note :** Version Lean = standards pragmatiques pour livrer vite. Améliorations futures possibles.

---

## 📈 Métriques de succès (Version Lean)

### KPIs techniques (V1)

- **Performance :** Lighthouse score ~85-90 (acceptable pour V1)
- **Accessibilité :** Basique (navigation clavier, contrastes)
- **Responsive :** Fonctionnel desktop + mobile
- **Bugs :** 0 bug critique en production

### KPIs métier

- **Scroll après Hero :** > 60% des visiteurs
- **Clic sur "Voir la démo" :** > 5% des visiteurs
- **Messages entrants :** > 2% des visiteurs
- **RDV qualifiés :** > 1% des visiteurs

**Tracking :** Mettre en place dès Sprint 2 pour mesurer l'impact

---

## ⚠️ Risques identifiés (Version Lean)

### Risque 1 : Assets section Preuve non disponibles
**Impact :** ⚠️ MOYEN (acceptable avec placeholder)  
**Probabilité :** ⚠️ MOYENNE  
**Mitigation :** 
- Schéma SVG du flux (minimum requis, Sprint 0)
- Placeholders acceptables pour Sprint 1
- Amélioration avec captures réelles → Sprint 2

### Risque 2 : Retard sur Sprint 1
**Impact :** ⚠️ ÉLEVÉ  
**Probabilité :** ⚠️ MOYENNE  
**Mitigation :**
- Scope réduit (4 sections seulement)
- Dashboard simplifié (placeholder OK)
- Prioriser P0 uniquement
- Ajuster scope si nécessaire (pages secondaires → Sprint 3 optionnel)

### Risque 3 : Performance Lighthouse < 85
**Impact :** ⚠️ FAIBLE (acceptable pour V1)  
**Probabilité :** ⚠️ FAIBLE  
**Mitigation :**
- Optimisation basique (Sprint 2)
- Lighthouse ~85-90 acceptable pour V1
- Amélioration future possible

---

## 🔄 Rituels Scrum

### Daily Standup
**Fréquence :** Quotidien (15 min)  
**Questions :**
- Qu'ai-je fait hier ?
- Que vais-je faire aujourd'hui ?
- Y a-t-il des blocages ?

### Sprint Planning
**Fréquence :** Début de chaque sprint (2h)  
**Objectif :** Sélectionner les user stories du sprint, détailler les tâches

### Sprint Review
**Fréquence :** Fin de chaque sprint (1h)  
**Objectif :** Présenter les fonctionnalités terminées, recueillir feedback

### Sprint Retrospective
**Fréquence :** Fin de chaque sprint (1h)  
**Objectif :** Améliorer le processus, identifier les problèmes

---

## 📝 Notes d'implémentation

### Technologies recommandées

- **Framework :** (à définir selon stack existant)
- **CSS :** Variables CSS, Grid, Flexbox
- **Graphiques :** Chart.js ou D3.js pour dashboard
- **Optimisation :** WebP, lazy loading, minification

### Standards de code

- **HTML :** Sémantique, accessibilité (ARIA)
- **CSS :** BEM ou similar, variables CSS
- **JS :** ES6+, commentaires si nécessaire
- **Git :** Commits atomiques, messages clairs

---

## 🏁 Résumé (Version Lean)

**Durée totale estimée :** 2-3 semaines (Sprints 0-2)  
**Story Points totaux :** 16 SP (Sprints 0-2) + 5 SP optionnel (Sprint 3) = **21 SP max**  
**Équipe recommandée :** 1 développeur frontend

**Avantages de l'approche Lean :**
- ✅ Livraison rapide (2 semaines)
- ✅ Apprentissage marché immédiat
- ✅ Itérations courtes
- ✅ Crédibilité immédiate
- ✅ Évite over-engineering

**Prochaine étape :** Valider le plan avec l'équipe, lancer Sprint 0 (2-3 jours).

---

## 📌 Règle d'or Lean

> **Preuve > discours**  
Si tu peux montrer → tu montres.  
Si tu peux mesurer → tu affiches.

**Ton éditorial B2B :**
- ❌ À éviter : "Je lis tous les messages", "Je te montre"
- ✅ Version B2B : "Échangeons sur votre contexte", "Chaque demande est analysée..."

---

**Fin du plan d'implémentation Scrum**

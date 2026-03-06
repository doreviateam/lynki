# 🎯 Plan d'Implémentation — Homepage Dorevia-Vault v2.2 — Mode Scrum

**Version** : 1.0  
**Date** : 2026-01-17  
**Base** : `SPEC_Homepage_Dorevia-Vault_v2.2.md`  
**Durée estimée** : 1 sprint (1 semaine)  
**Équipe** : Dev frontend / Web

---

## 📋 Vue d'Ensemble

### Objectif Homepage v2.2

Restructurer la homepage avec un **positionnement marché clair** (Commerçants/Retailers) et un **ton éditorial business, rassurant, sans jargon**, pour améliorer la compréhension immédiate et la conversion.

**Philosophie** : *La homepage n'explique pas tout. Elle donne envie d'explorer.*

### Définition de "Fait" (DoD)

La homepage v2.2 est terminée si :
- ✅ 9 blocs conformes à la spécification v2.2
- ✅ Ton éditorial respecté (positif, business, rassurant, sans jargon)
- ✅ Design responsive (mobile, tablette, desktop)
- ✅ Analytics tracking maintenu (GA4)
- ✅ SEO préservé (meta tags, structured data)
- ✅ Tests visuels validés (Chrome, Firefox, Safari)
- ✅ Performance maintenue (Lighthouse score ≥ 90)

**Statut** : ⏳ **À démarrer**

---

## 🏃 Structure Scrum

### Sprint

- **Sprint 1** : Implémentation complète homepage v2.2 (1 semaine) — 13 points

**Total** : 1 semaine — 13 points

---

## 📦 Sprint 1 : Implémentation Homepage v2.2 (1 semaine)

**Objectif** : Implémenter tous les nouveaux blocs et modifications selon la spécification v2.2

**Dates** : 2026-01-17 → 2026-01-24  
**Points** : 13 points

---

### User Stories

#### US-1.1 : Bloc Vision

**En tant que** visiteur de la homepage  
**Je veux** comprendre la vision de Dorevia-Vault dès le début  
**Afin de** saisir rapidement le positionnement et la mission

**Points** : 2

**Critères d'acceptation** :
- [ ] Section créée après le Hero
- [ ] Texte conforme à la spec v2.2 :
  ```
  Nous construisons une plateforme pour prouver vos factures.
  
  Les règles évoluent.
  La conformité devient un standard.
  
  Dorevia-Vault accompagne cette transition
  simplement, sans bouleverser vos habitudes.
  ```
- [ ] Design épuré, centré, lisible
- [ ] Responsive (mobile, tablette, desktop)
- [ ] Analytics tracking (section view)

**Tâches techniques** :
- [ ] Créer section HTML/Twig après Hero
- [ ] Ajouter styles CSS (centré, typographie)
- [ ] Tester responsive (breakpoints)
- [ ] Ajouter tracking analytics

**Livrables** :
- ✅ Section "Bloc Vision" dans `templates/home/index.html.twig`
- ✅ Styles CSS intégrés

---

#### US-1.2 : Opportunité Marché avec Chiffres Clés

**En tant que** commerçant/retailer  
**Je veux** voir l'opportunité marché et les chiffres clés  
**Afin de** comprendre l'envergure et le potentiel

**Points** : 3

**Critères d'acceptation** :
- [ ] Section créée avec titre : "La preuve devient un avantage concurrentiel."
- [ ] Texte conforme à la spec v2.2
- [ ] Chiffres clés mis en avant :
  - **700 000** commerces en France
  - **15 000** aux Antilles & Guyane
  - **≈ 300 M€** de marché annuel (scénario conservateur)
- [ ] Design avec statistiques visuelles (grands chiffres, icônes)
- [ ] Responsive
- [ ] Analytics tracking

**Tâches techniques** :
- [ ] Créer section HTML/Twig
- [ ] Design statistiques (cards avec grands chiffres)
- [ ] Styles CSS (mise en avant chiffres)
- [ ] Responsive (grid adaptatif)
- [ ] Analytics tracking

**Livrables** :
- ✅ Section "Opportunité Marché" dans `templates/home/index.html.twig`
- ✅ Design statistiques avec chiffres clés

---

#### US-1.3 : Bénéfices Métier (Sérénité, Crédibilité, Simplicité)

**En tant que** visiteur  
**Je veux** comprendre les bénéfices métier concrets  
**Afin de** évaluer la valeur pour mon activité

**Points** : 2

**Critères d'acceptation** :
- [ ] Section "Bénéfices" modifiée
- [ ] 3 bénéfices remplacés :
  - **Sérénité** : "Vous êtes prêt en cas de contrôle."
  - **Crédibilité** : "Vous prouvez votre conformité facilement."
  - **Simplicité** : "Aucun changement dans votre façon de travailler."
- [ ] Design conservé (cartes avec icônes)
- [ ] Ton business, orienté utilisateur (pas technique)
- [ ] Responsive

**Tâches techniques** :
- [ ] Modifier section "Bénéfices" existante
- [ ] Remplacer textes des 3 cartes
- [ ] Vérifier icônes appropriées
- [ ] Tester responsive

**Livrables** :
- ✅ Section "Bénéfices" modifiée dans `templates/home/index.html.twig`

---

#### US-1.4 : Section "Pourquoi Maintenant ?"

**En tant que** visiteur  
**Je veux** comprendre l'urgence réglementaire  
**Afin de** saisir pourquoi agir maintenant (2026)

**Points** : 2

**Critères d'acceptation** :
- [ ] Section créée avec titre : "Un tournant réglementaire."
- [ ] Texte conforme à la spec v2.2 :
  ```
  La réglementation française évolue.
  
  Les systèmes d'encaissement
  doivent désormais répondre
  à de nouvelles exigences.
  
  Nous apportons la brique manquante
  pour les rendre conformes dès 2026.
  ```
- [ ] Design avec encadré informatif (attention visuelle)
- [ ] Mention "2026" mise en avant
- [ ] Responsive
- [ ] Analytics tracking

**Tâches techniques** :
- [ ] Créer section HTML/Twig
- [ ] Design encadré informatif (bordure, fond)
- [ ] Mise en avant "2026"
- [ ] Responsive
- [ ] Analytics tracking

**Livrables** :
- ✅ Section "Pourquoi Maintenant ?" dans `templates/home/index.html.twig`

---

#### US-1.5 : Adaptation "Comment ça marche" (Flèches)

**En tant que** visiteur  
**Je veux** voir le processus simplifié avec flèches  
**Afin de** comprendre le flux en un coup d'œil

**Points** : 1

**Critères d'acceptation** :
- [ ] Section "Comment ça marche" existante modifiée
- [ ] Format avec flèches (→) :
  ```
  Vous travaillez normalement
  → Nous sécurisons en arrière-plan
  → Vous obtenez une preuve légale
  ```
- [ ] Design conservé (encadré avec fond)
- [ ] Responsive

**Tâches techniques** :
- [ ] Modifier texte section existante
- [ ] Ajouter flèches (→) entre les étapes
- [ ] Vérifier responsive

**Livrables** :
- ✅ Section "Comment ça marche" modifiée dans `templates/home/index.html.twig`

---

#### US-1.6 : Bloc Crédibilité

**En tant que** visiteur  
**Je veux** voir les points de crédibilité de la plateforme  
**Afin de** rassurer sur la fiabilité et la conformité

**Points** : 2

**Critères d'acceptation** :
- [ ] Section créée avec liste de 5 points :
  - Infrastructure souveraine 🇫🇷
  - ERP agnostique
  - Compatible Odoo & autres ERP
  - Automatisation complète
  - Hébergement en France
- [ ] Design avec icônes/badges
- [ ] Responsive (grid ou liste)
- [ ] Analytics tracking

**Tâches techniques** :
- [ ] Créer section HTML/Twig
- [ ] Design avec icônes/badges (checkmarks, drapeaux)
- [ ] Styles CSS (grid/liste)
- [ ] Responsive
- [ ] Analytics tracking

**Livrables** :
- ✅ Section "Bloc Crédibilité" dans `templates/home/index.html.twig`

---

#### US-1.7 : CTA Final

**En tant que** visiteur  
**Je veux** voir un appel à l'action final clair  
**Afin de** passer à l'action (démo ou tarifs)

**Points** : 1

**Critères d'acceptation** :
- [ ] Section créée avant footer
- [ ] Texte : "Envie de voir comment ça fonctionne ?"
- [ ] 2 boutons CTA :
  - 👉 Demander une démo
  - 👉 Voir les tarifs
- [ ] Design centré, visible
- [ ] Responsive
- [ ] Analytics tracking (clics boutons)

**Tâches techniques** :
- [ ] Créer section HTML/Twig avant footer
- [ ] Design centré avec 2 boutons
- [ ] Styles CSS (boutons alignés)
- [ ] Responsive
- [ ] Analytics tracking (`onclick` events)

**Livrables** :
- ✅ Section "CTA Final" dans `templates/home/index.html.twig`

---

### Backlog Sprint 1

| ID | User Story | Points | Priorité |
|----|------------|--------|----------|
| US-1.1 | Bloc Vision | 2 | P0 |
| US-1.2 | Opportunité Marché | 3 | P0 |
| US-1.3 | Bénéfices Métier | 2 | P0 |
| US-1.4 | Pourquoi Maintenant ? | 2 | P0 |
| US-1.5 | Comment ça marche (flèches) | 1 | P0 |
| US-1.6 | Bloc Crédibilité | 2 | P0 |
| US-1.7 | CTA Final | 1 | P0 |

**Total Sprint 1** : 13 points

---

## 📊 Backlog Global

### Vue d'Ensemble

| Sprint | Durée | Points | Objectif Principal |
|--------|-------|--------|-------------------|
| Sprint 1 | 1 semaine | 13 | Implémentation complète homepage v2.2 |

**Total** : **1 semaine** — **13 points**

### Backlog par Priorité

#### P0 — Must have (Homepage v2.2)

Toutes les user stories listées ci-dessus sont **P0** (must have) pour la homepage v2.2.

---

## 🎯 Critères d'Acceptation Globaux

### Definition of Done (DoD) Homepage v2.2

La homepage v2.2 est terminée si :

1. **Contenu conforme** :
   - [ ] 9 blocs présents et conformes à la spec v2.2
   - [ ] Hero (gelé, inchangé)
   - [ ] Bloc Vision créé
   - [ ] Opportunité Marché avec chiffres clés
   - [ ] Bénéfices Métier modifiés (Sérénité, Crédibilité, Simplicité)
   - [ ] Pourquoi Maintenant ? créé
   - [ ] Comment ça marche adapté (flèches)
   - [ ] Pricing Teaser (inchangé)
   - [ ] Bloc Crédibilité créé
   - [ ] CTA Final créé

2. **Ton éditorial** :
   - [ ] Positif, business, rassurant
   - [ ] Non anxiogène
   - [ ] Sans jargon technique
   - [ ] Orienté terrain (commerçants)

3. **Design & UX** :
   - [ ] Responsive (mobile, tablette, desktop)
   - [ ] CTA visibles et accessibles
   - [ ] Cohérence visuelle avec le reste du site
   - [ ] Performance maintenue (Lighthouse ≥ 90)

4. **Technique** :
   - [ ] Analytics tracking maintenu (GA4)
   - [ ] SEO préservé (meta tags, structured data)
   - [ ] Tests visuels validés (Chrome, Firefox, Safari)
   - [ ] Code propre, commenté si nécessaire

5. **Positionnement** :
   - [ ] Cible : Commerçants / Retailers
   - [ ] France & Outre-mer mentionnés
   - [ ] Conformité réglementaire mise en avant
   - [ ] 2026 mentionné (urgence)

---

## 🧪 Tests & Validation

### Tests Fonctionnels

- [ ] Tous les blocs s'affichent correctement
- [ ] Liens CTA fonctionnent (démo, tarifs)
- [ ] Analytics tracking fonctionne (GA4)
- [ ] Responsive testé (mobile, tablette, desktop)

### Tests Visuels

- [ ] Chrome (desktop, mobile)
- [ ] Firefox (desktop, mobile)
- [ ] Safari (desktop, mobile)
- [ ] Cohérence visuelle avec le reste du site

### Tests Performance

- [ ] Lighthouse score ≥ 90
- [ ] Temps de chargement < 3s
- [ ] Images optimisées (lazy loading)
- [ ] CSS/JS minifiés (si applicable)

### Tests SEO

- [ ] Meta tags présents (title, description)
- [ ] Structured data JSON-LD (si applicable)
- [ ] Sitemap mis à jour (si nécessaire)

---

## 📈 Métriques de Succès

### Avant (Actuel)

- Focus technique
- Bénéfices génériques
- Pas de contexte marché
- Pas d'urgence

### Après (v2.2)

- Focus business
- Bénéfices orientés utilisateur
- Contexte marché (700k commerces)
- Urgence réglementaire (2026)
- Crédibilité renforcée

### Gains Attendus

- **Compréhension** : +40% (message plus clair)
- **Crédibilité** : +30% (chiffres marché)
- **Conversion** : +25% (urgence + CTA final)
- **Ciblage** : +50% (commerçants explicitement)

---

## 🚀 Plan d'Exécution

### Jour 1-2 : Nouveaux Blocs (Priorité Haute)

1. **Bloc Vision** (US-1.1) — 2 points
2. **Opportunité Marché** (US-1.2) — 3 points
3. **Pourquoi Maintenant ?** (US-1.4) — 2 points

**Total** : 7 points

### Jour 3-4 : Modifications & Crédibilité

4. **Bénéfices Métier** (US-1.3) — 2 points
5. **Comment ça marche** (US-1.5) — 1 point
6. **Bloc Crédibilité** (US-1.6) — 2 points

**Total** : 5 points

### Jour 5 : CTA Final & Tests

7. **CTA Final** (US-1.7) — 1 point
8. **Tests & Validation** — 0 point (inclus dans DoD)

**Total** : 1 point

---

## 📝 Notes Techniques

### Fichiers à Modifier

- `units/sylius/templates/home/index.html.twig` : Template principal homepage
- `units/sylius/src/Controller/HomeController.php` : Controller (si nécessaire pour variables)

### Structure HTML

```html
<!-- Hero (gelé, inchangé) -->
<section class="ud-hero">...</section>

<!-- Bloc Vision (NOUVEAU) -->
<section class="ud-vision">...</section>

<!-- Opportunité Marché (NOUVEAU) -->
<section class="ud-market-opportunity">...</section>

<!-- Bénéfices Métier (MODIFIÉ) -->
<section class="ud-features">...</section>

<!-- Pourquoi Maintenant ? (NOUVEAU) -->
<section class="ud-why-now">...</section>

<!-- Comment ça marche (MODIFIÉ) -->
<section class="ud-about">...</section>

<!-- Pricing Teaser (inchangé) -->
<section class="ud-pricing">...</section>

<!-- Bloc Crédibilité (NOUVEAU) -->
<section class="ud-credibility">...</section>

<!-- CTA Final (NOUVEAU) -->
<section class="ud-cta-final">...</section>
```

### Classes CSS à Utiliser

- Utiliser les classes existantes du thème (`ud-*`)
- Ajouter classes spécifiques si nécessaire (`ud-vision`, `ud-market-opportunity`, etc.)
- Respecter la cohérence visuelle

### Analytics Tracking

- Maintenir les événements GA4 existants
- Ajouter tracking pour nouveaux blocs (section views)
- Ajouter tracking pour nouveaux CTA (clics)

---

## ✅ Checklist Sprint 1

### Contenu
- [ ] Bloc Vision créé
- [ ] Opportunité Marché avec chiffres
- [ ] Bénéfices métier modifiés (Sérénité, Crédibilité, Simplicité)
- [ ] Pourquoi Maintenant ? créé
- [ ] Comment ça marche adapté (flèches)
- [ ] Bloc Crédibilité créé
- [ ] CTA Final créé

### Design
- [ ] Ton éditorial respecté (positif, business, rassurant)
- [ ] Sans jargon technique
- [ ] Orienté terrain (commerçants)
- [ ] Mobile friendly
- [ ] CTA visibles

### Positionnement
- [ ] Cible : Commerçants / Retailers
- [ ] France & Outre-mer mentionnés
- [ ] Conformité réglementaire mise en avant
- [ ] 2026 mentionné (urgence)

### Technique
- [ ] Responsive testé
- [ ] Analytics tracking fonctionne
- [ ] SEO préservé
- [ ] Performance maintenue (Lighthouse ≥ 90)

---

## 🎨 Règle d'Or

> **La homepage n'explique pas tout.  
> Elle donne envie d'explorer.**

---

**Document généré le** : 2026-01-17  
**Version** : 1.0  
**Statut** : ✅ Plan Scrum complet, prêt pour exécution

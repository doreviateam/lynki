# Plan d’implémentation — Blog v3 homogène et professionnel

**Objectif :** Un blog visuellement homogène et professionnel (liste + article), aligné sur la spec Korben-like.  
**Référence :** ZeDocs/web11/korben_like.md  
**Périmètre :** pages blog (index + article), CSS, composants, gouvernance des styles.  
**Date :** 2026-01.

---

## 1. Principes directeurs

| Principe | Application |
|----------|-------------|
| **Mobile-first prioritaire** | Les styles de base ciblent le mobile (petit viewport). Les breakpoints `@media (min-width: …)` ajoutent progressivement espace, taille et mise en page pour tablette puis desktop. Pas de « desktop d’abord puis réduction pour mobile ». |
| **Une seule source de vérité** | Typo, couleurs et espacements définis dans un seul fichier CSS (blog-v3 ou section dédiée). Aucune règle typographique en `!important` dans les templates. |
| **Homogénéité** | Même palette, même police (Inter), même rythme vertical et largeur de lecture entre index et article. |
| **Professionnalisme** | Hiérarchie claire, code blocks lisibles, CTA et encadrés sobres, pas de césures automatiques en français. |
| **Étapes testables** | Chaque phase livrable et vérifiable (critères d’acceptation). |

---

## 2. Vue d’ensemble des phases

| Phase | Intitulé | Livrable principal | Durée estimée |
|-------|----------|--------------------|---------------|
| **S0** | Fondations CSS (design system blog) | Fichier `blog-v3.css` + variables, zéro typo inline en Twig | 0,5 j |
| **S1** | Page article v3 | Article seul au rendu Korben-like, propre et lisible | 1 j |
| **S2** | Page index alignée | Liste au même style (cartes, titres, méta), cohérente avec l’article | 1 j |
| **S3** | Composants (encadrés, takeaways, CTA) | Blocs réutilisables stylés de façon homogène | 0,5 j |
| **S4** | Finalisation (SEO, cache, recette) | JSON-LD, OG, nettoyage, checklist de recette | 0,5 j |

**Total estimé :** 3,5 jours.

### 2.1 Breakpoints recommandés (mobile-first)

| Breakpoint | Usage |
|------------|--------|
| **Base (défaut)** | Mobile : typo 16–16.5px, padding 16–18px, 1 colonne, pleine largeur. |
| **`min-width: 601px`** | Tablette / petit desktop : 18px, padding 24–32px, colonne max-width 720px ou 860px ; grille index 2 colonnes. |
| **`min-width: 900px`** | Desktop : grille index 3 colonnes, espacements éventuellement augmentés. |

Tout le CSS blog v3 doit être rédigé en partant du mobile (sans media query) puis en ajoutant des `@media (min-width: …)` pour les écrans plus larges.

### 2.2 Influence du mobile-first sur le plan

| Aspect | Influence |
|--------|-----------|
| **Ordre d’écriture du CSS** | Dans chaque phase (S0–S4), écrire d’abord les règles **sans** media query ( = mobile ), puis ajouter les blocs `@media (min-width: 601px)` et `@media (min-width: 900px)` pour enrichir. |
| **Variables (S0)** | Les tokens de base reflètent le mobile (ex. `--blog3-size: 16px`), avec des surcharges possibles en breakpoint ou des variables dédiées (ex. `--blog3-size-md: 18px`) pour le desktop. |
| **Phase S1 (article)** | Base = 16–16.5px, padding 18px 16px, colonne 100% ; pas de max-width en base. Breakpoint 601px = 18px, padding 32px 18px, max-width colonne. |
| **Phase S2 (index)** | Base = 1 colonne, cartes pleine largeur ; 601px = 2 colonnes ; 900px = 3 colonnes. Même logique : base mobile, puis `min-width`. |
| **Phase S3 (composants)** | Encadrés, takeaways, CTA : padding et typo en base mobile, puis éventuellement plus d’espace en `min-width: 601px`. |
| **Recette (S4)** | La checklist doit inclure une **vérification mobile en premier** (viewport étroit, tactile), puis tablette puis desktop. |
| **Règle à éviter** | Ne pas introduire de `@media (max-width: …)` pour « corriger le mobile » : le défaut est déjà le mobile. |

En résumé : le mobile-first **ne change pas l’ordre des phases** (S0 → S1 → S2 → S3 → S4), mais **impose la façon d’écrire le CSS** (base = mobile, breakpoints = `min-width`) et **priorise la recette mobile** en S4.

### 2.3 Facteurs qui influencent le plan

| Facteur | Influence sur le plan |
|--------|------------------------|
| **Spec `korben_like.md`** | Définit les objectifs, la typo (Inter, 16→18px), les breakpoints, l’ordre des blocs (breadcrumb, H1, méta, takeaways, corps, CTA…), les encadrés et le style des takeaways. Toutes les phases S0–S4 s’y alignent. |
| **Approche mobile-first** | Impose l’ordre d’écriture du CSS (base = mobile, puis `min-width: 601px` / `900px`), les variables S0 orientées mobile, et une recette S4 qui vérifie d’abord le mobile. |
| **Choix à acter (§ 8)** | Largeur colonne (720 vs 860px), thème Prism (clair vs dark), source des takeaways (BDD vs parsing), encadrés (HTML dans Markdown vs placeholders) — impactent S0/S1/S3. |
| **État actuel (blog-v2)** | Nettoyage des styles inline et `!important` dans `show.html.twig` (S0), reprise des bonnes parties dans `blog-v3.css` sans tout casser. |
| **SEO et accessibilité** | JSON-LD, OG, hiérarchie Hn, liens visibles — pris en charge en S4 et reflétés dans la structure des templates (S1/S2). |
| **Homogénéité index / article** | Même design system (couleurs, typo, espacements) pour S0, S1 et S2 ; pas de « style article » vs « style liste » divergents. |

En pratique : le plan est **piloté par la spec** et le **mobile-first** ; les **choix § 8** et l’**existant** précisent comment l’appliquer dans le code.

---

## 3. Phase S0 — Fondations CSS (design system blog)

### 3.1 Objectif
Centraliser les choix visuels du blog dans un seul fichier, sans conflit avec les styles inline du template.

### 3.2 Tâches

| # | Tâche | Fichier(s) | Détail |
|---|--------|------------|--------|
| S0.1 | Créer `blog-v3.css` (ou section « Blog v3 » en bas de `blog-v2.css`) | `units/sylius/public/assets/css/blog-v3.css` | Variables CSS : `--blog3-font`, `--blog3-size`, `--blog3-line`, `--blog3-color`, `--blog3-muted`, `--blog3-max-width`, `--blog3-radius`. |
| S0.2 | Définir les variables (design tokens) | idem | **Mobile-first :** base = 16px, padding 16–18px, line-height 1.75. Variables pour couleurs (#111, #555). Breakpoint `min-width: 601px` pour 18px et max-width colonne (720px ou 860px). |
| S0.3 | Supprimer les règles typographiques inline en `!important` dans `show.html.twig` | `units/sylius/templates/blog/show.html.twig` | Garder uniquement : masque header/footer, éventuellement 1 règle de layout très ciblée (ex. conteneur pleine largeur). Supprimer : font-family, font-size, line-height, color en !important. |
| S0.4 | Charger `blog-v3.css` après `blog-v2.css` sur les pages blog | `show.html.twig`, `index.html.twig` | `<link rel="stylesheet" href="{{ asset('assets/css/blog-v3.css') }}?v={{ 'now'|date('U') }}" />` |

### 3.3 Critères d’acceptation S0
- [ ] Aucune règle typo (font-size, font-family, line-height, color) en `!important` dans les blocs `<style>` des templates blog.
- [ ] Les variables ou règles de base du blog sont dans un seul fichier CSS.
- [ ] La page article s’affiche sans régression visuelle majeure (les styles v3 prennent le relais).

---

## 4. Phase S1 — Page article v3

### 4.1 Objectif
Page article au rendu Korben-like : colonne de lecture, méta une ligne, typo et code homogènes.

### 4.2 Tâches

| # | Tâche | Fichier(s) | Détail |
|---|--------|------------|--------|
| S1.1 | Appliquer le patch CSS « Korben-like » (Annexe A) en **mobile-first** | `blog-v3.css` | **Base (mobile) :** font-size 16px ou 16.5px, padding 18px 16px, hyphens none, titres H2/H3 proportionnés, blockquote, listes, liens soulignés. **Breakpoint min-width: 601px :** 18px, padding 32px 18px, colonne max-width 720px ou 860px. |
| S1.2 | Styles corps article (`.article-content`) | idem | Base mobile (16–16.5px), puis 18px en `min-width: 601px`. line-height 1.75, couleur #111, code inline fond #f4f4f4, `pre` fond clair ou dark cohérent. |
| S1.3 | Breadcrumb + méta + titre | idem + `show.html.twig` | Breadcrumb minimal. Méta une ligne (ou wrap propre sur mobile). Titre H1 : base ~1.6rem, puis 2rem en `min-width: 601px`. |
| S1.4 | Conteneur pleine largeur pour la colonne article | `blog-v3.css` | `.blog-article-pandoc .blog-v2-container` en width 100% / max-width 100%. Colonne article : 100% en base, max-width 720px/860px uniquement en `min-width: 601px`. |
| S1.5 | Breakpoints article (mobile-first) | `blog-v3.css` | Pas de `max-width` pour « mobile » : le défaut est mobile. Utiliser `@media (min-width: 601px)` pour tablette/desktop (typo, padding, max-width colonne). |
| S1.6 | Cohérence Prism / blocs de code | `blog-v3.css` + évent. `show.html.twig` | Soit thème Prism clair + `pre` fond clair, soit prism-tomorrow + `pre` dark ; supprimer le mélange. |

### 4.3 Ordre des blocs dans le template (vérification)
Vérifier que l’ordre dans `show.html.twig` est bien :
1. Breadcrumb  
2. H1  
3. Meta line  
4. Chapeau (si présent)  
5. Cover image (si présent)  
6. *(Takeaways — Phase S3)*  
7. Corps `{{ html_content|raw }}`  
8. CTA doux  
9. Author box  
10. Share  
11. Related articles  
12. Retour blog / footer  

### 4.4 Critères d’acceptation S1
- [ ] Colonne article centrée, max-width 720px ou 860px, fond blanc ou #fdfdfd.
- [ ] Typo Inter 18px, line-height 1.75, pas de césure auto.
- [ ] Liens dans le corps soulignés, visibles.
- [ ] Code inline et blocs de code lisibles et homogènes (clair ou dark, pas les deux).
- [ ] Méta sur une ligne, breadcrumb minimal.

---

## 5. Phase S2 — Page index alignée

### 5.1 Objectif
Liste d’articles visuellement alignée avec la page article : mêmes tokens (typo, couleurs, espacements), cartes sobres et professionnelles.

### 5.2 Tâches

| # | Tâche | Fichier(s) | Détail |
|---|--------|------------|--------|
| S2.1 | Réutiliser les variables / tokens du blog v3 pour l’index | `blog-v3.css` | Titres de section, cartes, méta (date, catégorie, temps de lecture) avec les mêmes couleurs et tailles que l’article. |
| S2.2 | Style des cartes article (index) | idem | Cartes : fond blanc, bordure légère, border-radius cohérent avec v3, titre en Inter, extrait en couleur secondaire, lien « Lire » discret (souligné ou couleur d’accent). |
| S2.3 | Hero / article à la une | idem | Si conservé : même palette et typo ; pas d’emojis ou style « marketing » qui casse l’homogénéité. |
| S2.4 | Grille et espacements (mobile-first) | idem | **Base :** 1 colonne, gap et padding cohérents avec l’article. **min-width: 601px** : 2 colonnes ; **min-width: 900px** : 3 colonnes. Même tokens que l’article. |
| S2.5 | Filtres / recherche (si présents) | idem | Boutons ou liens discrets, même famille de couleurs. |

### 5.3 Critères d’acceptation S2
- [ ] Index utilise la même police, couleurs et rythme que la page article.
- [ ] Cartes lisibles, titre + extrait + méta + lien clair.
- [ ] Pas de rupture visuelle entre « clic sur un article » et « page article » (même univers graphique).

---

## 6. Phase S3 — Composants (encadrés, takeaways, CTA)

### 6.1 Objectif
Encadrés pédagogiques, bloc « Ce qu’il faut retenir » et CTA doux stylés de façon homogène et professionnelle.

### 6.2 Tâches

| # | Tâche | Fichier(s) | Détail |
|---|--------|------------|--------|
| S3.1 | Bloc Takeaways (si champ ou parsing disponible) | `show.html.twig` + `blog-v3.css` | Section « Ce qu’il faut retenir » avec liste (Annexe B korben_like.md). Styles : fond #f6f6f6, bordure #e9e9e9, padding 14px 16px, titre 1rem bold. |
| S3.2 | Styles encadrés `blog-encadre-*` | `blog-v3.css` | Classes : `blog-encadre`, `blog-encadre-title`, `blog-encadre-body` ; variantes retient, pourquoi, check, exemple (Annexe C korben_like.md). |
| S3.3 | CTA doux | `blog-v3.css` + `components/blog-cta-doux.html.twig` | Boutons et lien discrets, couleurs cohérentes avec le blog (pas de violet/bleu agressif si le reste est sobre). |
| S3.4 | Author box + Share | `blog-v3.css` | Bloc auteur compact ; zone partage en petits liens, même gris que la méta. |

### 6.3 Critères d’acceptation S3
- [ ] Takeaways (si affichés) utilisent le style défini dans la spec.
- [ ] Encadrés (À retenir, Pourquoi, Check, Exemple) sont reconnaissables et cohérents entre eux.
- [ ] CTA en bas d’article présent et non intrusif.

---

## 7. Phase S4 — Finalisation (SEO, cache, recette)

### 7.1 Objectif
SEO en ordre, pas de régression, recette de validation.

### 7.2 Tâches

| # | Tâche | Fichier(s) | Détail |
|---|--------|------------|--------|
| S4.1 | Vérifier JSON-LD (BlogPosting sur article, Blog sur index) | `show.html.twig`, `index.html.twig` | Titre, description, auteur, date, image, URL. |
| S4.2 | Vérifier Open Graph (optionnel mais recommandé) | layout ou blocks | og:title, og:description, og:image sur la page article. |
| S4.3 | Cache busting CSS | templates blog | `?v={{ 'now'|date('U') }}` sur blog-v3.css (déjà en place si suivi du plan). |
| S4.4 | Checklist de recette | — | Document court : vérification visuelle desktop/mobile, liens, partage, CTA, 2–3 articles différents. |

### 7.3 Critères d’acceptation S4
- [ ] JSON-LD valide (outil Google ou équivalent).
- [ ] Aucune régression sur liste et article après rechargement forcé.
- [ ] Recette exécutée et notée (OK / à corriger).

---

## 8. Choix à acter avant de démarrer

| Sujet | Option A | Option B | Recommandation |
|-------|----------|----------|----------------|
| **Largeur colonne article** | 720px | 860px | 720px (très lisible, style Korben classique). |
| **Blocs de code** | Prism clair + `pre` fond clair | Prism dark + `pre` dark | Tout clair pour homogénéité avec fond blanc. |
| **Takeaways** | Champ BDD `takeaways[]` | Parsing Markdown (section dédiée) | Champ BDD si possible ; sinon parsing. |
| **Encadrés dans le contenu** | HTML autorisé dans Markdown | Placeholders + JS | Placeholders + JS pour garder le Markdown propre. |

---

## 9. Fichiers impactés (résumé)

| Fichier | S0 | S1 | S2 | S3 | S4 |
|---------|----|----|----|----|----|
| `public/assets/css/blog-v3.css` | Création, variables | Patch article | Styles index | Encadrés, CTA, takeaways | — |
| `templates/blog/show.html.twig` | Nettoyage inline | Ordre blocs, méta | — | Bloc takeaways (si oui) | Vérif JSON-LD |
| `templates/blog/index.html.twig` | Charger blog-v3.css | — | Styles, cartes | — | Vérif JSON-LD |
| `templates/components/blog-cta-doux.html.twig` | — | — | — | Styles CTA | — |

---

## 10. Ordre d’exécution recommandé

1. **Acter les choix** (§ 8).  
2. **S0** : Créer `blog-v3.css`, variables, retirer typo inline de `show.html.twig`, charger blog-v3.css.  
3. **S1** : Appliquer le patch article (Annexe A), ajuster conteneur, méta, breadcrumb, Prism.  
4. **S2** : Aligner l’index (cartes, hero, grille) avec blog-v3.css.  
5. **S3** : Takeaways, encadrés, CTA, author/share.  
6. **S4** : SEO, cache, checklist de recette.

---

**Référence :** ZeDocs/web11 — Spec : korben_like.md.

# SPEC — Blog v3 “Korben-like” (Sylius + Pandoc)

**Version :** v1.0  
**Date :** 2026-01-29  
**Statut :** Proposition (référence de travail)  
**Périmètre :** pages blog (index + article), rendu Markdown→HTML (Pandoc/MarkdownService), styles CSS, composants (encadrés, CTA, takeaways), SEO.  
**Inspiration UX :** Blog “Korben” (lecture web-magazine : simple, lisible, code propre).  
**Approche responsive :** **Mobile-first prioritaire** — styles de base pour mobile, breakpoints `min-width` pour tablette et desktop.

---

## 0) Contexte et intention

Le rendu actuel “Pandoc/Georgia” donne parfois une sensation “PDF/doc”, avec un style trop littéraire (serif, 20px, césures `hyphens:auto`) et des conflits entre CSS externe et styles inline.

L’objectif de Blog v3 est d’obtenir un rendu **web magazine**, lisible et moderne :
- colonne confortable (ni trop étroite “livre”, ni trop large),
- typographie sans-serif,
- hiérarchie claire,
- liens visibles,
- code blocks cohérents,
- CTA discrets mais présents.

---

## 1) Objectifs

### 1.1 UX (lecture)
- Lecture fluide desktop + mobile.
- Apparence “web magazine” (pas “Pandoc/PDF”).
- Hiérarchie : **H1 → méta → chapeau → takeaways → corps**.
- Code blocks lisibles et harmonisés avec Prism.

### 1.2 Business (conversion douce)
- Renforcer crédibilité Dorevia-Vault (expertise).
- Convertir sans agresser : “démo / checklist / contact”.
- SEO long terme : structure Hn, schema.org, maillage interne.

### 1.3 Non-objectifs
- Pas de redesign global du site.
- Pas de changement d’outil de conversion Markdown (on garde MarkdownService/Pandoc).
- Pas d’éditeur WYSIWYG.

---

## 2) Principes de design “Korben-like”

### 2.1 Typo & rythme (mobile-first)
- Police : **Inter / system**.
- **Base (mobile) :** 16px ou 16.5px, padding 16–18px, colonne pleine largeur.
- **Breakpoint min-width: 601px :** 18px, padding 24–32px, **max-width 720px ou 860px** (ou 70–80ch).
- Interligne : **1.7–1.8** partout.

### 2.2 Lisibilité
- **Désactiver la césure FR** : `hyphens: none`.
- Liens visibles : soulignement + offset.
- Marges verticales régulières.
- Titres (H2/H3) bien marqués.

### 2.3 Code
- Inline code sur fond léger.
- Code blocks : fond clair et sobre **OU** fond dark cohérent (éviter les clashes).
- Prism conservé, mais thème + fond `pre` cohérents.

---

## 3) Architecture des pages

### 3.1 Article (show)
**Fichier :** `units/sylius/templates/blog/show.html.twig`

**Ordre recommandé :**
1. Breadcrumb
2. **H1** titre
3. **Meta line** (date, auteur, catégorie, *temps de lecture*)
4. Chapeau (optionnel)
5. Cover image (optionnel)
6. **Takeaways** “Ce qu’il faut retenir” (si fourni)
7. Corps HTML converti (`{{ html_content|raw }}`)
8. CTA doux (`components/blog-cta-doux.html.twig`)
9. Author box
10. Share
11. Related articles
12. Footer blog

### 3.2 Index (liste)
Objectif : rendu “magazine” (cartes sobres, titre lisible, extrait, date, catégorie).

---

## 4) Modèle de contenu (Article)

### 4.1 Champs backend (attendus)
- `title` (H1)
- `slug`
- `publishedAt`
- `author`
- `category`
- `chapeau` (HTML court)
- `coverImage` (1200×600 recommandé)
- `metaDescription` (obligatoire)
- `metaKeywords` (optionnel)
- `contentMarkdown` (source)
- `takeaways[]` (**nouveau / recommandé**) : 3–6 bullets
- `readingTime` (calculé : mots/220, arrondi) — optionnel mais recommandé

### 4.2 Conventions Markdown
- Le H1 est rendu par Twig → **pas de H1 dans le Markdown**.
- Le Markdown commence par un texte d’intro puis **H2/H3**.
- Code blocks avec fences : ```lang
- Tables autorisées.

---

## 5) Encadrés pédagogiques

### 5.1 But
Rendre l’article didactique sans l’alourdir : “Pourquoi”, “À retenir”, “Check”, “Exemple”.

### 5.2 Format recommandé (HTML dans Markdown)
On autorise des blocs HTML dans le Markdown (puisque rendu via `|raw`) :

```html
<div class="blog-encadre blog-encadre-retient">
  <div class="blog-encadre-title">À retenir</div>
  <div class="blog-encadre-body">
    …texte…
  </div>
</div>
```

Variantes :
- `blog-encadre-retient`
- `blog-encadre-pourquoi`
- `blog-encadre-check`
- `blog-encadre-exemple`

### 5.3 Alternative (placeholders + JS)
Si tu préfères les placeholders (ex : `<div class="blog-encadre-placeholder" data-type="retient">…</div>`), un script peut les transformer en encadrés stylés. (Optionnel — déjà amorcé dans ton template.)

---

## 6) CSS — Gouvernance

### 6.1 Règle d’or
**Aucune règle typographique “inline” en `!important`** dans Twig, sinon le CSS externe ne peut pas piloter le rendu.

Inline autorisé uniquement pour :
- masquer header/footer si nécessaire,
- ajuster des cas spécifiques “page blog only”.

### 6.2 Lieu
- Ajouter un fichier dédié : `assets/css/blog-v3.css`
- Ou ajouter une section “Blog v3” en bas de `blog-v2.css` (plus simple en migration).

---

## 7) Prism / Code blocks

### 7.1 Décision recommandée
- Thème Prism **clair** (cohérent avec fond clair).
- `pre` en fond clair (gris léger) + bordure subtile.

### 7.2 Alternative dark
Si tu gardes `prism-tomorrow`, alors :
- `pre` doit être dark,
- inline code doit rester lisible (fond neutre).

---

## 8) SEO & metadata

### 8.1 Obligatoire
- `<title>` unique (Twig `block title`)
- `meta_description`
- OpenGraph (title/desc/image) — recommandé
- JSON-LD `BlogPosting`

### 8.2 Structure Hn
- H1 = titre (Twig)
- H2/H3 = Markdown converti
- pas de H1 dans Markdown

### 8.3 Maillage interne
- “Dans la même catégorie”
- 1–2 liens vers articles connexes
- 1 lien vers landing page (Dorevia-Vault) de façon naturelle

---

## 9) CTA (conversion douce)

### 9.1 Composant `blog-cta-doux`
Contenu minimal :
- Bouton primaire : “Voir une preuve réelle” / “Voir une démo”
- Bouton secondaire : “Télécharger la checklist”
- Lien : “Nous contacter”

### 9.2 Emplacements
- fin d’article (obligatoire)
- optionnel : après takeaways si article très long

---

## 10) Critères d’acceptation (DoD)

### 10.1 Visuel
- Desktop : `max-width` ~ 860px, `font-size` 18px, `line-height` 1.75
- Mobile : 16.5px, marges 16–18px
- **Aucune césure auto**
- Liens soulignés visibles
- Code blocks lisibles et homogènes

### 10.2 Contenu
- Le “pourquoi” est compris en < 15 secondes.
- Takeaways présent si fourni.
- CTA en bas de page présent.

### 10.3 Tech
- Pas de styles inline typographiques bloquants.
- JSON-LD valide.
- Pas de régression sur Prism.

---

## 11) Plan d’implémentation (macro)

1. Ajouter CSS Blog v3 (patch ci-dessous)
2. Nettoyer inline styles dans `show.html.twig` (retirer Georgia/20px/!important)
3. Ajouter bloc Twig `takeaways` + CSS
4. Harmoniser Prism (thème clair recommandé)
5. Ajouter styles `blog-encadre-*`
6. Tester sur 3 articles (court / long / code)
7. Ajustements responsive

---

# ANNEXE A — Patch CSS “Korben-like” (Blog v3)

> À coller en bas de `blog-v2.css` (ou dans `blog-v3.css`).  
> Objectif : lecture web-magazine, sans serif, sans césures, code propre.

```css
/* =========================================================
   Blog v3 — Skin "Korben-like" (lecture web magazine)
   ========================================================= */

.blog-v2.blog-article-pandoc { background: #fff !important; }

/* Mobile-first : base = mobile */
.blog-article-pandoc .blog-article-pandoc-page{
  width: 100%;
  margin: 0 auto;
  padding: 24px 16px;
  box-sizing: border-box;
  hyphens: none;
  overflow-wrap: break-word;
  word-break: normal;
  text-rendering: optimizeLegibility;
}
@media (min-width: 601px){
  .blog-article-pandoc .blog-article-pandoc-page{
    max-width: 860px;
    width: 92vw;
    padding: 32px 18px;
  }
}

.blog-article-pandoc .blog-article-title{
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif !important;
  font-weight: 800 !important;
  font-size: 2.1rem !important;
  line-height: 1.15 !important;
  margin: 0 0 10px 0 !important;
}

.blog-article-pandoc .blog-article-meta-bar{
  display:flex; gap:10px; align-items:center; flex-wrap:wrap;
  margin: 0 0 18px 0;
}

.blog-article-pandoc .blog-article-meta{
  color:#555; font-size:0.95rem; margin:0;
}

.blog-article-pandoc .blog-article-category-inline{
  font-size:0.85rem;
  padding:4px 10px;
  border-radius:999px;
  border:1px solid #ddd;
  color:#333;
}

.blog-article-pandoc .article-content{
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif !important;
  font-size: 16.5px !important;   /* base mobile */
  line-height: 1.75 !important;
  color:#111 !important;
}

.blog-article-pandoc .article-content p{ margin: 0 0 1.05em 0 !important; }

.blog-article-pandoc .article-content a{
  color:#111;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.blog-article-pandoc .article-content a:hover{ opacity:0.85; }

.blog-article-pandoc .article-content h2{
  font-size: 1.5rem;
  margin: 1.6em 0 0.6em 0;
  line-height: 1.25;
}
.blog-article-pandoc .article-content h3{
  font-size: 1.2rem;
  margin: 1.2em 0 0.5em 0;
  line-height: 1.3;
}

.blog-article-pandoc .article-content ul,
.blog-article-pandoc .article-content ol{
  padding-left: 1.25em !important;
  margin: 0.75em 0 1.25em 0 !important;
}

.blog-article-pandoc .article-content blockquote{
  margin: 1.2em 0;
  padding: 0.2em 0 0.2em 1em;
  border-left: 4px solid #e6e6e6;
  color: #555;
}

.blog-article-pandoc .article-content :not(pre) > code{
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 0.95em;
  background: #f4f4f4;
  padding: 0.15em 0.35em;
  border-radius: 6px;
}

.blog-article-pandoc .article-content pre{
  background: #f6f6f6;
  border: 1px solid #e9e9e9;
  border-radius: 10px;
  padding: 14px 16px;
  overflow: auto;
  margin: 1em 0 1.4em 0;
}
.blog-article-pandoc .article-content pre code{
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 0.95em;
  line-height: 1.55;
}

.blog-article-pandoc .article-content hr{
  border:none;
  height: 1px;
  background:#e5e5e5;
  margin: 1.6em 0;
}

/* Mobile-first : breakpoint tablette/desktop */
@media (min-width: 601px){
  .blog-article-pandoc .blog-article-title{ font-size: 2.1rem; }
  .blog-article-pandoc .article-content{ font-size: 18px; }
}
```

---

# ANNEXE B — Twig : bloc “Ce qu’il faut retenir” (takeaways)

À insérer dans `show.html.twig` après le chapeau / cover, avant `html_content`.

```twig
{% if article.takeaways is defined and article.takeaways %}
  <section class="blog-takeaways" aria-label="Ce qu’il faut retenir">
    <h2 class="blog-takeaways-title">Ce qu’il faut retenir</h2>
    <ul class="blog-takeaways-list">
      {% for item in article.takeaways %}
        <li>{{ item }}</li>
      {% endfor %}
    </ul>
  </section>
{% endif %}
```

CSS associé :

```css
.blog-takeaways{
  background:#f6f6f6;
  border:1px solid #e9e9e9;
  border-radius:12px;
  padding:14px 16px;
  margin:18px 0 22px;
}
.blog-takeaways-title{
  margin:0 0 10px 0;
  font-size:1rem;
  font-weight:800;
}
.blog-takeaways-list{
  margin:0;
  padding-left:1.1em;
}
.blog-takeaways-list li{
  margin:0.35em 0;
}
```

---

# ANNEXE C — Encadrés pédagogiques “blog-encadre-*”

À coller dans le CSS (Blog v3) :

```css
.blog-encadre{
  border: 1px solid #e9e9e9;
  background: #fafafa;
  border-radius: 12px;
  padding: 14px 16px;
  margin: 18px 0 22px;
}
.blog-encadre-title{
  font-weight: 800;
  margin: 0 0 8px 0;
  font-size: 0.95rem;
}
.blog-encadre-body{
  margin: 0;
  color: #333;
  font-size: 0.98em;
}

/* Variantes légères */
.blog-encadre-retient{ background:#f6f6f6; }
.blog-encadre-pourquoi{ background:#fff7ed; border-color:#fed7aa; }
.blog-encadre-check{ background:#f0fdf4; border-color:#bbf7d0; }
.blog-encadre-exemple{ background:#eff6ff; border-color:#bfdbfe; }
```

Exemple à mettre dans ton Markdown :

```html
<div class="blog-encadre blog-encadre-check">
  <div class="blog-encadre-title">✅ Résultat attendu</div>
  <div class="blog-encadre-body">
    Vous voyez le statut <strong>Protégée</strong> et une preuve horodatée dans la fiche facture.
  </div>
</div>
```

---

# ANNEXE D — Nettoyage inline styles (recommandation)

Dans `show.html.twig`, conserver inline uniquement pour :
- masquer `.ud-header` et `.ud-footer` si nécessaire,
- contraintes de layout spécifiques.

Supprimer les règles typographiques en `!important` (font-family, font-size, line-height, color) pour laisser Blog v3 piloter l’esthétique.

---

**Référence interne :** ZeDocs/web11  

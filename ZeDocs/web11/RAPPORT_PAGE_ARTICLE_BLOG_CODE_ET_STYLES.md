# Rapport — Code et styles de la page article blog (Odoo / Dorevia Vault)

**Page concernée :** article « Comment connecter Odoo à Dorevia Vault pour sceller et prouver vos factures »  
**Fichiers sources :** `units/sylius/templates/blog/show.html.twig`, `units/sylius/public/assets/css/blog-v2.css`, `units/sylius/scripts/create_article_odoo_dorevia_vault.php`  
**Date du rapport :** 2026-01.

---

## Sommaire

1. [Template Twig (structure et contenu HTML)](#1-template-twig)
2. [Styles inline (dans le template)](#2-styles-inline-dans-le-template)
3. [CSS externe — section article Pandoc](#3-css-externe-blog-v2css)
4. [Contenu Markdown de l’article](#4-contenu-markdown-de-larticle)

---

## 1. Template Twig (structure et contenu HTML)

**Fichier :** `units/sylius/templates/blog/show.html.twig`

```twig
{% extends 'layout.html.twig' %}

{% block title %}{{ page_title }}{% endblock %}
{% block meta_description %}{{ page_description }}{% endblock %}
{% block meta_keywords %}{{ article.metaKeywords }}{% endblock %}

{% block stylesheets %}
    {{ parent() }}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('assets/css/landing-v2-final.css') }}?v={{ 'now'|date('U') }}" />
    <link rel="stylesheet" href="{{ asset('assets/css/blog-v2.css') }}?v={{ 'now'|date('U') }}" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" />
    <style>
        body { background: #fdfdfd !important; }
        .ud-header, .ud-footer { display: none !important; }
        /* Article blog — colonne large et homogène */
        .blog-v2.blog-article-pandoc { background: #fdfdfd !important; }
        .blog-article-pandoc .blog-article-pandoc-page {
            max-width: min(52em, 92vw) !important;
            width: 100% !important;
            margin-left: auto !important;
            margin-right: auto !important;
            padding: 2rem 1.5rem !important;
            box-sizing: border-box !important;
        }
        .blog-article-pandoc .article-content.blog-article-body {
            font-family: Georgia, serif !important;
            font-size: 20px !important;
            line-height: 1.5 !important;
            color: #1a1a1a !important;
        }
        .blog-article-pandoc .article-content p { margin: 1em 0 !important; }
        .blog-article-pandoc .article-content h1,
        .blog-article-pandoc .article-content h2,
        .blog-article-pandoc .article-content h3,
        .blog-article-pandoc .article-content h4 { margin-top: 1.4em !important; color: #1a1a1a !important; }
        .blog-article-pandoc .article-content ul,
        .blog-article-pandoc .article-content ol { padding-left: 1.7em !important; margin-top: 1em !important; }
        .blog-article-pandoc .article-content blockquote {
            margin: 1em 0 1em 1.7em !important;
            padding-left: 1em !important;
            border-left: 2px solid #e6e6e6 !important;
            color: #606060 !important;
        }
        .blog-article-pandoc .article-content code {
            font-family: Menlo, Monaco, 'Lucida Console', Consolas, monospace !important;
            font-size: 85% !important;
        }
        .blog-article-pandoc .blog-article-title {
            font-family: Georgia, serif !important;
            color: #1a1a1a !important;
        }
        @media (max-width: 600px) {
            .blog-article-pandoc .blog-article-pandoc-page { padding: 1em !important; font-size: 0.9em !important; }
            .blog-article-pandoc .blog-article-title { font-size: 1.8em !important; }
        }
    </style>
    {# JSON-LD BlogPosting pour SEO — non reproduit ici #}
{% endblock %}

{% block body %}
<div class="blog-v2 blog-article-pandoc">
    <article class="blog-article-pandoc-article">
        <div class="blog-v2-container">
            <div class="blog-article-page blog-article-pandoc-page">
                <nav class="blog-article-breadcrumb" aria-label="Fil d'Ariane">
                    <a href="{{ path('home') }}">Accueil</a>
                    <span class="blog-breadcrumb-sep" aria-hidden="true"> » </span>
                    <a href="{{ path('blog_index') }}">Blog</a>
                    {% if article.category %}
                        <span class="blog-breadcrumb-sep" aria-hidden="true"> » </span>
                        <a href="{{ path('blog_index', {category: article.category}) }}">{{ article.category }}</a>
                    {% endif %}
                    <span class="blog-breadcrumb-sep" aria-hidden="true"> » </span>
                    <strong class="blog-breadcrumb-current">{{ article.title|slice(0, 60) }}{% if article.title|length > 60 %}…{% endif %}</strong>
                </nav>

                <h1 class="blog-article-title">{{ article.title }}</h1>

                <div class="blog-article-meta-bar">
                    <p class="blog-article-meta">
                        {% set mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'] %}
                        {{ article.publishedAt|date('j') }} {{ mois[article.publishedAt|date('n') - 1] }} {{ article.publishedAt|date('Y') }} par <strong>{{ article.author }}</strong>
                    </p>
                    {% if article.category %}
                        <span class="blog-article-category-inline">{{ article.category }}</span>
                    {% endif %}
                    <div class="blog-article-share-inline">
                        <span class="blog-article-share-label">Partager cet article</span>
                        <a href="..." class="blog-article-share-btn">Twitter</a>
                        <a href="..." class="blog-article-share-btn">LinkedIn</a>
                        <a href="mailto:..." class="blog-article-share-btn">Email</a>
                    </div>
                </div>

                {% if article.chapeau %}<div class="blog-article-chapeau">{{ article.chapeau|raw }}</div>{% endif %}
                {% if article.coverImage %}
                    <img src="{{ article.coverImage }}" alt="" class="blog-article-cover" loading="lazy" width="1200" height="600">
                {% endif %}

                <div class="article-content blog-article-body">
                    {{ html_content|raw }}
                </div>

                {% include 'components/blog-cta-doux.html.twig' %}

                <div class="blog-article-author-box">
                    <p class="blog-article-author-name">{{ article.author }}</p>
                    <p class="blog-article-author-bio">Équipe Dorevia-Vault. Nous concevons une infrastructure de preuve financière…</p>
                </div>

                <div class="article-share">
                    <h3 class="article-share-title">Partager cet article</h3>
                    <div class="article-share-buttons">
                        <a href="..." class="article-share-button twitter">Twitter</a>
                        <a href="..." class="article-share-button linkedin">LinkedIn</a>
                        <a href="mailto:..." class="article-share-button email">Envoyer par email</a>
                    </div>
                </div>

                {% if related_articles|length > 0 %}
                    <div class="blog-related-articles">
                        <h2 class="blog-related-title">Dans la même catégorie</h2>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 28px;">
                            {% for related in related_articles %}
                                <a href="{{ path('blog_show', {slug: related.slug}) }}" class="blog-related-card">…</a>
                            {% endfor %}
                        </div>
                    </div>
                {% endif %}

                <div style="text-align: center; margin-top: 4rem;">
                    <a href="{{ path('blog_index') }}" class="blog-newsletter-button">← Retour au blog</a>
                </div>
            </div>
        </div>
    </article>
    {% include 'components/footer-blog.html.twig' %}
</div>
{% endblock %}

{% block javascripts %}
    {{ parent() }}
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const placeholders = document.querySelectorAll('.blog-encadre-placeholder');
            placeholders.forEach(function(placeholder) { /* encadrés définition / à retenir / exemple */ });
        });
    </script>
{% endblock %}
```

---

## 2. Styles inline (dans le template)

Extrait du bloc `<style>` de `show.html.twig` (styles critiques pour la page article) :

| Règle | Valeur |
|--------|--------|
| `body` | `background: #fdfdfd !important` |
| `.blog-v2.blog-article-pandoc` | `background: #fdfdfd !important` |
| `.blog-article-pandoc .blog-article-pandoc-page` | `max-width: min(52em, 92vw) !important; width: 100%; margin: auto; padding: 2rem 1.5rem; box-sizing: border-box` |
| `.blog-article-pandoc .article-content.blog-article-body` | `font-family: Georgia, serif; font-size: 20px; line-height: 1.5; color: #1a1a1a` |
| Paragraphes, titres, listes | `margin: 1em 0` / `margin-top: 1.4em`, `padding-left: 1.7em` |
| `blockquote` | `border-left: 2px solid #e6e6e6; color: #606060; padding-left: 1em` |
| `code` | `font-family: Menlo, Monaco, 'Lucida Console', Consolas, monospace; font-size: 85%` |
| `.blog-article-title` | `font-family: Georgia, serif; color: #1a1a1a` |
| `@media (max-width: 600px)` | `padding: 1em; font-size: 0.9em` ; titre `1.8em` |

---

## 3. CSS externe (blog-v2.css)

**Fichier :** `units/sylius/public/assets/css/blog-v2.css`  
**Section :** « Page article — mise en page inspirée Pandoc »

```css
/* ========== Page article — mise en page inspirée Pandoc (lecture longue) ========== */
.blog-v2.blog-article-pandoc {
  background: #fdfdfd !important;
}

.blog-article-pandoc .blog-article-pandoc-article {
  padding: 60px 0 80px;
}

.blog-article-pandoc .blog-article-pandoc-page {
  max-width: min(52em, 92vw);
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  box-sizing: border-box;
  hyphens: auto;
  overflow-wrap: break-word;
  text-rendering: optimizeLegibility;
  font-kerning: normal;
}

@media (max-width: 600px) {
  .blog-article-pandoc .blog-article-pandoc-page {
    font-size: 0.9em;
    padding: 1em;
  }
  .blog-article-pandoc .blog-article-title {
    font-size: 1.8em;
  }
}

@media print {
  .blog-v2.blog-article-pandoc {
    background-color: transparent;
    color: #000;
  }
  .blog-article-pandoc .blog-article-pandoc-page {
    font-size: 12pt;
  }
  .blog-article-pandoc .article-content p,
  .blog-article-pandoc .article-content h2,
  .blog-article-pandoc .article-content h3 {
    orphans: 3;
    widows: 3;
  }
  .blog-article-pandoc .article-content h2,
  .blog-article-pandoc .article-content h3,
  .blog-article-pandoc .article-content h4 {
    page-break-after: avoid;
  }
}

/* Corps de l'article — typo Pandoc */
.blog-article-pandoc .article-content {
  font-family: Georgia, serif;
  font-size: 20px;
  line-height: 1.5;
  color: #1a1a1a;
}

.blog-article-pandoc .article-content p {
  margin: 1em 0;
}

.blog-article-pandoc .article-content a {
  color: #1a1a1a;
}

.blog-article-pandoc .article-content a:visited {
  color: #1a1a1a;
}

.blog-article-pandoc .article-content a:hover {
  text-decoration: underline;
}

.blog-article-pandoc .article-content img {
  max-width: 100%;
  height: auto;
}

.blog-article-pandoc .article-content h1,
.blog-article-pandoc .article-content h2,
.blog-article-pandoc .article-content h3,
.blog-article-pandoc .article-content h4,
.blog-article-pandoc .article-content h5,
.blog-article-pandoc .article-content h6 {
  margin-top: 1.4em;
  color: #1a1a1a;
}

.blog-article-pandoc .article-content h5,
.blog-article-pandoc .article-content h6 {
  font-size: 1em;
  font-style: italic;
}

.blog-article-pandoc .article-content h6 {
  font-weight: normal;
}

.blog-article-pandoc .article-content ol,
.blog-article-pandoc .article-content ul {
  padding-left: 1.7em;
  margin-top: 1em;
}

.blog-article-pandoc .article-content li > ol,
.blog-article-pandoc .article-content li > ul {
  margin-top: 0;
}

.blog-article-pandoc .article-content blockquote {
  margin: 1em 0 1em 1.7em;
  padding-left: 1em;
  border-left: 2px solid #e6e6e6;
  color: #606060;
}

.blog-article-pandoc .article-content code {
  font-family: Menlo, Monaco, 'Lucida Console', Consolas, monospace;
  font-size: 85%;
  margin: 0;
  white-space: pre-wrap;
}

.blog-article-pandoc .article-content pre {
  margin: 1em 0;
  overflow: auto;
}

.blog-article-pandoc .article-content pre code {
  padding: 0;
  overflow: visible;
  overflow-wrap: normal;
}

.blog-article-pandoc .article-content hr {
  background-color: #1a1a1a;
  border: none;
  height: 1px;
  margin: 1em 0;
}

/* Tableaux — style Pandoc */
.blog-article-pandoc .article-content table {
  margin: 1em 0;
  border-collapse: collapse;
  width: 100%;
  overflow-x: auto;
  display: block;
  font-variant-numeric: lining-nums tabular-nums;
}

.blog-article-pandoc .article-content tbody {
  margin-top: 0.5em;
  border-top: 1px solid #1a1a1a;
  border-bottom: 1px solid #1a1a1a;
}

.blog-article-pandoc .article-content th {
  border-top: 1px solid #1a1a1a;
  padding: 0.25em 0.5em;
}

.blog-article-pandoc .article-content td {
  padding: 0.125em 0.5em 0.25em 0.5em;
}

/* Partage / auteur */
.blog-article-pandoc .article-share {
  background: transparent;
  border: none;
  border-top: 1px solid #e6e6e6;
  padding: 2em 0;
  margin: 2em 0;
  text-align: center;
}

.blog-article-pandoc .article-share-title {
  font-size: 1em;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 1rem;
}

.blog-article-pandoc .article-share-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.blog-article-pandoc .article-share-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  color: #1a1a1a;
  border: 1px solid #1a1a1a;
  background: transparent;
  transition: all 0.2s ease;
}

.blog-article-pandoc .article-share-button:hover {
  background: #1a1a1a;
  color: #fdfdfd;
}

.blog-article-pandoc .blog-article-title {
  font-family: Georgia, serif;
  font-size: 1.8em;
  font-weight: 700;
  color: #1a1a1a;
  margin-top: 0;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

.blog-article-pandoc .blog-article-breadcrumb,
.blog-article-pandoc .blog-article-meta-bar {
  color: #606060;
  font-size: 0.9em;
}

.blog-article-pandoc .blog-article-breadcrumb a,
.blog-article-pandoc .blog-article-meta-bar a {
  color: #1a1a1a;
}

.blog-article-pandoc .blog-article-author-box {
  border-top: 1px solid #e6e6e6;
  padding-top: 1.5em;
  margin-top: 2em;
}

.blog-article-pandoc .blog-article-author-name {
  font-weight: 700;
  color: #1a1a1a;
}

.blog-article-pandoc .blog-article-author-bio {
  color: #606060;
  font-size: 0.9em;
}
```

---

## 4. Contenu Markdown de l’article

**Source :** variable `$content` dans `units/sylius/scripts/create_article_odoo_dorevia_vault.php`  
Ce Markdown est converti en HTML par le backend (MarkdownService) puis affiché dans `{{ html_content|raw }}`.

```markdown
Dans la majorité des ERP, une facture validée reste une simple donnée : elle peut être modifiée, supprimée ou remplacée sans laisser de trace exploitable juridiquement.

En cas d'audit, de contrôle fiscal ou de litige, cela complique la preuve d'intégrité des chiffres.

**Dorevia Vault** change cette réalité en transformant chaque facture validée dans Odoo en une **preuve financière scellée, horodatée et vérifiable** — automatiquement, sans manipulation humaine.

👉 Dans ce guide, vous apprendrez à :

- connecter votre instance Odoo à Dorevia Vault
- sécuriser vos factures sans changer d'ERP
- visualiser des preuves directement dans Odoo

---

## 🎯 Pourquoi la preuve financière est devenue stratégique

Sceller une facture permet de :

- garantir qu'elle n'a pas été modifiée après validation
- disposer d'une preuve opposable en cas de contrôle
- fiabiliser trésorerie et états financiers
- simplifier conformité et audits

> Vos chiffres deviennent fiables par conception.

---

## 🧩 Vue d'ensemble du fonctionnement

```
Odoo → DVIG → Dorevia Vault → Preuve financière
```

### DVIG — passerelle sécurisée

Reçoit chaque validation de facture depuis Odoo.

### Dorevia Vault — coffre-fort de preuve

Scelle, horodate et stocke les preuves de manière immuable.

Chaque entreprise (tenant) dispose :

- d'une identité unique
- d'un accès sécurisé dédié

👉 Isolation + traçabilité garanties.

---

## 📦 Prérequis avant de commencer

### Obligatoire

- Module Odoo `account`
- Module `dorevia_vault_connector`

### Recommandé

- `queue_job`
- `dorevia_posted_lock`

---

## 🏷 Étape 1 — Identifier votre instance Odoo

### Pourquoi cette étape ?

Pour que Dorevia Vault sache **quelle entreprise envoie les données**.

### Format

```
odoo.<environnement>.<tenant>
```

### Exemple

```
odoo.lab.lglz
```

- `odoo` = ERP source
- `lab` = environnement
- `lglz` = entreprise

### ✅ Résultat attendu

Votre instance est reconnue comme source officielle.

---

## 🔑 Étape 2 — Générer un token sécurisé dédié

### Pourquoi ?

Chaque entreprise possède sa propre clé chiffrée pour éviter toute confusion ou fraude de flux.

```bash
python -m dvig.cli.token_gen --tenant lglz --univers odoo --output token
python -m dvig.cli.token_gen --tenant lglz --univers odoo --output yaml
```

Ajoutez le bloc YAML au fichier DVIG et rechargez le service.

### ✅ Résultat attendu

Un accès sécurisé unique pour votre tenant.

---

## ⚙ Étape 3 — Configurer Odoo

Dans **Paramètres → Technique → Paramètres système** :

### Connexion DVIG

- `dorevia.dvig.url`
- `dorevia.dvig.source`
- `dorevia.dvig.token`

### Connexion Vault

- `dorevia.vault.url`
- `dorevia.vault.token`

### ✅ Résultat attendu

Odoo est connecté à l'infrastructure de preuve.

---

## 🧪 Étape 4 — Générer votre première preuve financière

1. Créez une facture client
2. Validez-la

Après quelques secondes :

- **Protection en cours**
- puis **Protégée**
- une preuve horodatée apparaît

🎉 Votre facture est désormais inaltérable.

---

## 🚑 Dépannage rapide

- **Rien ne se passe** — paramètres manquants : vérifier la configuration
- **403 TENANT_MISMATCH** — mauvais token : générer un token dédié
- **401 Unauthorized** — token invalide : régénérer
- **Erreur serveur** — DVIG : consulter les logs

---

## 📈 Ce que ce branchement change concrètement

### Avant

- données modifiables
- audits complexes
- confiance fragile

### Après

- preuves financières automatiques
- traçabilité totale
- conformité facilitée
- chiffres fiables

---

## 🧠 En résumé

> Chaque facture validée dans Odoo devient une preuve financière scellée, vérifiable et opposable.

Dorevia Vault transforme votre ERP en **infrastructure de confiance financière**.

---

## 👉 Aller plus loin

- 📥 Télécharger la checklist complète
- 🎥 Voir une démonstration réelle en 2 minutes
- 📞 Contacter l'équipe Dorevia Vault

---

### 🎯 Pourquoi cette approche est différente

- Aucun changement d'ERP
- Aucune manipulation humaine
- Sécurité by design
- Scalabilité multi-entreprises
```

---

*Rapport généré à partir des fichiers du dépôt dorevia-plateform. Référence : ZeDocs/web11.*

# 📁 Structure des Templates — Dorevia-Vault

## Architecture

### Layout principal
- **`layout.html.twig`** : Layout principal utilisé par toutes les pages
  - Header, Footer, scripts globaux
  - Blocs : `title`, `meta_description`, `stylesheets`, `javascripts`, `body`
  - **Utilisé par** : Tous les templates de pages

### Template de base Symfony
- **`base.html.twig`** : Template par défaut Symfony (non utilisé)
  - Conservé pour compatibilité Symfony
  - **Ne pas utiliser** : Utiliser `layout.html.twig` à la place

### Templates de pages
Tous les templates de pages étendent `layout.html.twig` :

```
templates/
├── home/index.html.twig          → Page d'accueil
├── contact/index.html.twig       → Page contact
├── pricing/index.html.twig       → Page tarifs
├── blog/index.html.twig          → Liste articles
├── blog/show.html.twig           → Détail article
├── features/index.html.twig      → Page fonctionnalités
├── how-it-works/index.html.twig  → Page comment ça marche
└── privacy/index.html.twig       → Page confidentialité
```

### Composants réutilisables
```
templates/components/
└── whatsapp-button.html.twig     → Bouton WhatsApp (inclus dans layout)
```

### Templates obsolètes
- ❌ `landing/index_old.html.twig` → **SUPPRIMÉ**
- ❌ `landing/index.html.twig.backup` → **SUPPRIMÉ**
- ⚠️ `landing/index.html.twig` → Conservé mais non utilisé (LandingController redirige)

## Convention d'utilisation

### Pour créer une nouvelle page
1. Créer le template dans le dossier approprié
2. Étendre `layout.html.twig`
3. Utiliser les blocs disponibles :
   ```twig
   {% extends 'layout.html.twig' %}
   
   {% block title %}Mon titre{% endblock %}
   {% block meta_description %}Ma description{% endblock %}
   
   {% block stylesheets %}
       {# CSS spécifiques à la page #}
   {% endblock %}
   
   {% block body %}
       {# Contenu de la page #}
   {% endblock %}
   
   {% block javascripts %}
       {# JS spécifiques à la page #}
   {% endblock %}
   ```

### Pour créer un composant réutilisable
1. Créer dans `templates/components/`
2. Utiliser `{% include 'components/mon-composant.html.twig' %}`

## Notes importantes

- **Ne jamais utiliser** `base.html.twig` directement
- **Toujours étendre** `layout.html.twig` pour les pages
- **CSS/JS globaux** : Dans `layout.html.twig`
- **CSS/JS spécifiques** : Dans le bloc `stylesheets`/`javascripts` de la page

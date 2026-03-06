# Approche d'intégration — Lov'Arbitre dans Dorevia Platform

## 🎯 Objectif

Intégrer le site web **Lov'Arbitre** (tenant: `lovable44`) dans la plateforme Dorevia en utilisant l'infrastructure Symfony/Sylius existante.

---

## 📐 Comment je m'y suis pris

### 1. Analyse de la plateforme existante

**Ressources identifiées :**
- **Unit Sylius** : Framework Symfony avec Twig (`units/sylius/`)
- **Système de routing** : Routes Symfony avec attributs `#[Route()]`
- **Gestion des assets** : Fonction `{{ asset() }}` de Symfony
- **Structure de templates** : Organisation par namespace (`templates/`)
- **Système de tenants** : Structure dans `/tenants/` (pour isolation future)

### 2. Architecture choisie

**Approche : Site standalone dans l'unit Sylius**

**Pourquoi cette approche ?**
- ✅ Réutilise l'infrastructure Symfony existante
- ✅ Pas besoin de créer un nouveau tenant complet
- ✅ Isolation via un contrôleur et des templates dédiés
- ✅ Facile à maintenir et étendre

**Structure créée :**
```
units/sylius/
├── src/Controller/
│   └── LovableController.php          # Nouveau contrôleur
├── templates/
│   └── lovable/
│       └── lovarbitre.html.twig        # Template standalone
└── public/assets/
    ├── css/
    │   └── lovarbitre.css              # Styles extraits
    └── images/
        └── lovarbitre-logo.png         # Logo (à fournir)
```

### 3. Étapes d'implémentation

#### A. Contrôleur Symfony (`LovableController.php`)
- **Route** : `/lovarbitre`
- **Nom de route** : `lovable_lovarbitre`
- **Méthode** : Retourne le template avec les variables nécessaires
- **Isolation** : Contrôleur dédié, pas de conflit avec les routes existantes

#### B. Extraction du CSS (`lovarbitre.css`)
- Tous les styles du `<style>` extraits dans un fichier séparé
- Variables CSS conservées (`:root`)
- Responsive inclus (media queries)
- **Avantage** : Maintenance facilitée, cache navigateur

#### C. Template Twig (`lovarbitre.html.twig`)
- **Standalone** : Template complet avec `<html>`, `<head>`, `<body>`
- **Pourquoi standalone ?** : Évite les conflits de styles avec `layout.html.twig`
- Conversion HTML → Twig :
  - Chemins statiques → `{{ asset('assets/...') }}`
  - Meta tags avec variables Twig
  - JavaScript conservé tel quel (fonctionne côté client)

#### D. Gestion des assets
- CSS : `public/assets/css/lovarbitre.css`
- Logo : `public/assets/images/lovarbitre-logo.png` (à fournir)
- Utilisation de `{{ asset() }}` pour tous les chemins

---

## 🔧 Ressources de la plateforme utilisées

### Infrastructure Symfony
- ✅ **Routing** : Système de routes Symfony standard
- ✅ **Templating** : Moteur Twig
- ✅ **Asset management** : Fonction `asset()` pour les chemins
- ✅ **Cache** : Système de cache Symfony (vidé après modifications)

### Structure existante
- ✅ **Unit Sylius** : Framework déjà en place
- ✅ **Docker** : Services PHP-FPM, Nginx déjà configurés
- ✅ **Organisation** : Structure de templates par namespace

### Non utilisé (pour l'instant)
- ❌ **Layout commun** : Template standalone pour éviter conflits
- ❌ **Système de tenants** : Pas de tenant dédié créé (peut être fait plus tard)
- ❌ **Base de données** : Pas nécessaire pour cette landing page

---

## 📦 Fichiers créés

1. **`units/sylius/src/Controller/LovableController.php`**
   - Contrôleur avec route `/lovarbitre`
   - Retourne le template avec variables

2. **`units/sylius/templates/lovable/lovarbitre.html.twig`**
   - Template complet standalone
   - HTML converti en Twig
   - JavaScript de démo intégré

3. **`units/sylius/public/assets/css/lovarbitre.css`**
   - Tous les styles extraits
   - Variables CSS conservées
   - Responsive inclus

4. **`ZeDocs/lovableProject/PLAN_INTEGRATION_LOVARBITRE.md`**
   - Plan détaillé de l'intégration

5. **`ZeDocs/lovableProject/README_LOGO.md`**
   - Instructions pour le logo

---

## 🚀 Accès au site

**URL** : `http://sylius.lab.core.doreviateam.com/lovarbitre`

**Route Symfony** : `lovable_lovarbitre`

---

## 🔄 Prochaines étapes possibles

### Court terme
1. **Placer le logo** : Ajouter `lovarbitre-logo.png` dans `public/assets/images/`
2. **Tester** : Vérifier le rendu et la démo interactive
3. **Ajuster** : Corriger les styles si nécessaire

### Moyen terme
1. **Formulaire de contact** : Intégrer avec `ContactController` si besoin
2. **Analytics** : Ajouter Google Analytics (comme pour Dorevia-Vault)
3. **SEO** : Optimiser les meta tags, sitemap

### Long terme (si besoin d'isolation complète)
1. **Créer un tenant dédié** : `tenants/lovable44/`
2. **Configuration DNS** : Sous-domaine dédié si nécessaire
3. **Isolation complète** : Environnements lab/stinger/prod séparés

---

## 💡 Avantages de cette approche

1. **Rapidité** : Intégration en quelques fichiers
2. **Simplicité** : Pas de configuration complexe
3. **Maintenabilité** : Code organisé et séparé
4. **Réutilisabilité** : Structure claire pour d'autres projets
5. **Compatibilité** : Utilise l'infrastructure existante

---

## ⚠️ Points d'attention

1. **Logo manquant** : Le logo doit être ajouté pour que le site soit complet
2. **Template standalone** : Pas d'héritage de `layout.html.twig` (volontaire pour éviter conflits)
3. **JavaScript** : Démo mock côté client (pas de backend pour l'instant)
4. **Routes** : Route `/lovarbitre` accessible, pas de sous-domaine dédié

---

## 📝 Notes techniques

- **Cache** : Vidé après création (`php bin/console cache:clear`)
- **Services** : PHP-FPM redémarré pour prendre en compte les changements
- **Assets** : Versioning CSS avec `?v=20260122` pour forcer le rechargement
- **Responsive** : Media queries incluses dans le CSS

---

## ✅ État actuel

**Fichiers créés** : ✅  
**Contrôleur** : ✅  
**Template** : ✅  
**CSS** : ✅  
**Route** : ✅  
**Cache vidé** : ✅  

**À faire** :
- [ ] Ajouter le logo `lovarbitre-logo.png`
- [ ] Tester le site sur `/lovarbitre`
- [ ] Ajuster les styles si nécessaire

# Plan d'intégration — Lov'Arbitre (tenant: lovable44)

## 📋 Vue d'ensemble

Intégration du site web **Lov'Arbitre** dans la plateforme Dorevia pour le tenant `lovable44`.

**Objectif** : Créer un site web standalone (one-page) avec le design fourni, intégré dans l'architecture Symfony/Sylius existante.

---

## 🏗️ Architecture proposée

### 1. Structure des fichiers

```
units/sylius/
├── src/Controller/
│   └── LovableController.php          # Nouveau contrôleur pour Lov'Arbitre
├── templates/
│   └── lovable/
│       └── lovarbitre.html.twig       # Template principal
└── public/assets/
    ├── css/
    │   └── lovarbitre.css             # Styles extraits du HTML
    └── images/
        └── lovarbitre-logo.png        # Logo (à fournir)

ZeDocs/lovableProject/
├── PLAN_INTEGRATION_LOVARBITRE.md     # Ce document
└── SPEC_LOVARBITRE.md                 # Spécification détaillée
```

### 2. Approche technique

#### A. Contrôleur Symfony
- **Route** : `/lovable/lovarbitre` ou `/lovarbitre`
- **Nom de route** : `lovable_lovarbitre`
- **Méthode** : Standalone (pas d'extends layout pour éviter conflits de styles)

#### B. Template Twig
- Template standalone avec `<html>`, `<head>`, `<body>` complets
- Conversion du HTML fourni en syntaxe Twig
- Adaptation des chemins d'assets avec `{{ asset() }}`
- Intégration des fonctions Symfony (routes, formulaires si nécessaire)

#### C. CSS
- Extraction de tous les styles `<style>` dans `lovarbitre.css`
- Variables CSS conservées
- Responsive inclus

#### D. JavaScript
- Conservation du script de démo interactive
- Adaptation pour fonctionner dans le contexte Symfony

### 3. Intégration avec la plateforme

#### A. Routing
- Route dédiée dans `LovableController`
- Pas de conflit avec les routes existantes
- Accessible via : `http://sylius.lab.core.doreviateam.com/lovarbitre`

#### B. Assets
- Logo à placer dans `public/assets/images/lovarbitre-logo.png`
- CSS dans `public/assets/css/lovarbitre.css`
- Utilisation de `{{ asset() }}` pour les chemins

#### C. Tenant
- Le tenant `lovable44` est identifié dans le code HTML via `meta name="x-tenant" content="lovable2026"`
- Pour l'instant, intégration dans l'unit `sylius` existante
- Possibilité future de créer un tenant dédié si nécessaire

---

## 📝 Étapes d'implémentation

### Étape 1 : Créer le contrôleur
- Créer `LovableController.php`
- Définir la route `/lovarbitre`
- Retourner le template

### Étape 2 : Extraire et créer le CSS
- Extraire tous les styles du `<style>` dans `lovarbitre.css`
- Adapter les chemins si nécessaire

### Étape 3 : Créer le template Twig
- Convertir le HTML en Twig
- Remplacer les chemins statiques par `{{ asset() }}`
- Adapter les liens et formulaires pour Symfony

### Étape 4 : Gérer le logo
- Créer le dossier `public/assets/images/` si nécessaire
- Documenter où placer le logo

### Étape 5 : Tester
- Vérifier le rendu
- Tester la démo interactive
- Vérifier le responsive

---

## 🔧 Ressources utilisées

### De la plateforme Dorevia
- **Unit Sylius** : Framework Symfony/Twig existant
- **Système de routing** : Routes Symfony standard
- **Asset management** : Système `asset()` de Symfony
- **Structure de templates** : Organisation Twig

### Nouveau pour Lov'Arbitre
- Contrôleur dédié
- Template standalone
- CSS spécifique
- JavaScript de démo (mock)

---

## 🎯 Avantages de cette approche

1. **Isolation** : Le site Lov'Arbitre est indépendant du site Dorevia-Vault
2. **Réutilisabilité** : Structure claire pour d'autres projets similaires
3. **Maintenabilité** : CSS et JS séparés, code organisé
4. **Compatibilité** : Utilise l'infrastructure Symfony existante
5. **Flexibilité** : Facile à étendre ou modifier

---

## 📦 Fichiers à créer

1. `units/sylius/src/Controller/LovableController.php`
2. `units/sylius/templates/lovable/lovarbitre.html.twig`
3. `units/sylius/public/assets/css/lovarbitre.css`
4. `ZeDocs/lovableProject/SPEC_LOVARBITRE.md` (optionnel)

---

## 🚀 Prochaines étapes

Une fois cette structure créée, on pourra :
- Ajouter un formulaire de contact si nécessaire
- Intégrer avec le système de leads existant
- Ajouter des analytics
- Créer un tenant dédié si besoin d'isolation complète

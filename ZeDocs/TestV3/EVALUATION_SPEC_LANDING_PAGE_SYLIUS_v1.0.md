# 📋 Évaluation — SPEC Landing Page Dorevia-Vault (Sylius) v1.0

**Date** : 2026-01-15  
**Évaluateur** : Assistant IA  
**Statut SPEC** : Draft complet  
**Cible** : `sylius.lab.core.doreviateam.com`

---

## 🎯 Résumé Exécutif

La spécification présente une **vision claire et structurée** pour une landing page mobile-first destinée à recruter des early adopters et collecter des leads. Le périmètre V1 est **bien délimité** et les objectifs sont **réalistes**.

**Verdict global** : ✅ **FAISABLE** avec quelques points d'attention à clarifier avant implémentation.

**Points forts** :
- Périmètre V1 bien défini (inclus/exclu clairs)
- Architecture technique cohérente avec la plateforme existante
- Modèle économique simple et compréhensible
- Sécurité et RGPD pris en compte

**Points d'attention** :
- Intégration avec l'architecture plateforme existante (nouveau "univers" Sylius)
- Gestion des leads (base de données, modèle)
- Configuration Caddy pour nouveau domaine
- Structure de packaging (`units/sylius/`)

---

## 1. Analyse Structurelle

### 1.1 Clarté et Complétude ✅

**Forces** :
- ✅ Sections bien structurées (18 sections numérotées)
- ✅ Contexte et intention clairement exprimés
- ✅ Périmètre V1 explicite (inclus/exclu)
- ✅ Parcours utilisateur défini
- ✅ Modèle de données Lead détaillé

**Manques mineurs** :
- ⚠️ Pas de wireframes/mockups (mais acceptable pour V1)
- ⚠️ Pas de spécification détaillée du contenu des sections (hero, problème, etc.)
- ⚠️ Pas de définition des "rôles" dans le formulaire (liste de valeurs ?)

**Recommandation** : Ajouter un tableau de valeurs possibles pour le champ `role` (ex: `comptable`, `dirigeant`, `développeur`, `autre`).

---

## 2. Cohérence Technique avec la Plateforme

### 2.1 Architecture Existante

**Contexte actuel** :
- ✅ Plateforme utilise **Caddy** comme reverse proxy (gateway)
- ✅ Architecture Docker Compose par tenant/environnement
- ✅ Réseau Docker `dorevia-network` pour isolation
- ✅ Structure `units/` pour services (ex: `units/odoo/`, `units/gateway/`)
- ✅ Pattern de nommage : `<univers>.<env>.<tenant>.doreviateam.com`

**Cohérence** :
- ✅ **Sylius = nouveau "univers"** (comme `odoo`)
- ✅ URL proposée : `sylius.lab.core.doreviateam.com` → ✅ **COHÉRENT**
- ✅ Structure `units/sylius/` → ✅ **COHÉRENT**
- ✅ Caddy reverse proxy → ✅ **COHÉRENT**

**Point d'attention** :
- ⚠️ **Tenant "core"** : La spec mentionne `sylius.lab.core.doreviateam.com`
  - Le tenant `core` existe déjà dans la plateforme (DVIG/Vault partagés)
  - ✅ **COHÉRENT** : Sylius LAB serait un service partagé pour tous les tenants

### 2.2 Services Docker

**Spécification** :
```
Services : - DB - PHP-FPM - Nginx
```

**Analyse** :
- ✅ **Sylius standard** utilise Symfony + PHP-FPM + Nginx
- ⚠️ **Clarification nécessaire** : 
  - Sylius est une application Symfony complète
  - Nginx sert de reverse proxy vers PHP-FPM
  - Base de données : MariaDB ou PostgreSQL (spec mentionne les deux)

**Recommandation** : 
- Choisir **PostgreSQL** pour cohérence avec le reste de la plateforme (Odoo, Vault utilisent PostgreSQL)
- Structure Docker Compose standard Sylius :
  ```yaml
  services:
    db:          # PostgreSQL
    php-fpm:     # Application Sylius
    nginx:       # Reverse proxy vers PHP-FPM
  ```

### 2.3 Configuration Caddy

**Spécification** :
```
Record A : sylius.lab.core → IP serveur LAB
```

**Analyse** :
- ✅ **Cohérent** avec le pattern existant
- ⚠️ **Action requise** : Ajouter route dans `units/gateway/Caddyfile` :
  ```caddy
  sylius.lab.core.doreviateam.com {
    reverse_proxy sylius_lab_core:80  # ou port Nginx
  }
  ```

**Point d'attention** :
- Le Caddyfile est actuellement **généré automatiquement** par `lib/render/render_caddyfile.sh`
- ⚠️ **Nouveau "univers" Sylius** nécessite adaptation du script de génération
- **Alternative** : Ajout manuel dans Caddyfile (comme pour services spéciaux)

**Recommandation** : 
- Pour V1, ajout **manuel** dans Caddyfile (rapide)
- Pour V2+, intégrer Sylius dans le système de génération automatique

---

## 3. Modèle de Données Lead

### 3.1 Champs Définis ✅

**Champs proposés** :
- `id` → ✅ Standard
- `created_at` → ✅ Standard
- `email` (obligatoire) → ✅ Standard
- `role` (obligatoire) → ⚠️ **À clarifier** (liste de valeurs ?)
- `stack` → ✅ Optionnel (bon pour segmentation)
- `volume` → ✅ Optionnel (bon pour qualification)
- `message` → ✅ Optionnel (bon pour feedback)
- `utm_source` → ✅ **Excellent** pour tracking marketing
- `utm_campaign` → ✅ **Excellent** pour tracking marketing
- `referrer` → ✅ Standard
- `status` → ⚠️ **À clarifier** (valeurs possibles ?)

**Recommandations** :
1. **Champ `role`** : Définir liste de valeurs (ex: `comptable`, `dirigeant`, `développeur`, `consultant`, `autre`)
2. **Champ `status`** : Définir workflow (ex: `new`, `contacted`, `qualified`, `converted`, `archived`)
3. **Champ `volume`** : Format ? (nombre de factures/mois ? texte libre ?)

### 3.2 Entité Sylius

**Question** : Comment modéliser le Lead dans Sylius ?

**Options** :
1. **Entity Sylius standard** : Créer `App\Entity\Lead` (recommandé)
2. **Plugin Sylius** : Créer plugin dédié (overkill pour V1)
3. **Table SQL brute** : Non recommandé (perd avantages Symfony)

**Recommandation** : **Option 1** — Entity Symfony standard avec :
- Doctrine ORM
- Repository pour requêtes
- Form Symfony pour validation
- API REST optionnelle (pour V1.1+)

---

## 4. Sécurité

### 4.1 Mesures Proposées ✅

**Spécification** :
- ✅ CSRF
- ✅ Rate limiting
- ✅ Honeypot anti-spam
- ✅ HTTPS only

**Analyse** :
- ✅ **CSRF** : Natif Symfony (form tokens)
- ✅ **Rate limiting** : Symfony Rate Limiter (disponible depuis Symfony 5.2)
- ✅ **Honeypot** : Facile à implémenter (champ caché)
- ✅ **HTTPS** : Géré par Caddy (Let's Encrypt automatique)

**Recommandations** :
1. **Rate limiting** : 
   - Formulaire lead : 5 soumissions/heure par IP
   - Endpoint `/healthz` : Pas de limite
2. **Honeypot** : Champ `website` (invisible CSS) — si rempli → rejet silencieux
3. **Validation email** : Format + domaine valide (pas de vérification existence)

---

## 5. RGPD

### 5.1 Conformité ✅

**Spécification** :
- ✅ Mention légale sous formulaire
- ✅ Lien page privacy
- ✅ Conservation 24 mois max
- ✅ Droit suppression

**Analyse** :
- ✅ **Mentions légales** : Standard, facile à implémenter
- ✅ **Page `/privacy`** : Route simple, contenu statique
- ⚠️ **Conservation 24 mois** : Nécessite **tâche CRON** pour suppression automatique
- ⚠️ **Droit suppression** : Nécessite **endpoint admin** ou **email** pour demande

**Recommandations** :
1. **CRON de nettoyage** : Tâche Symfony Console exécutée quotidiennement
   ```php
   // App\Command\CleanupLeadsCommand
   // Supprime leads créés il y a > 24 mois
   ```
2. **Droit suppression** : 
   - **V1** : Email `privacy@doreviateam.com` avec demande manuelle
   - **V1.1+** : Endpoint admin avec authentification

---

## 6. SEO

### 6.1 Éléments Proposés ✅

**Spécification** :
- ✅ Title + description
- ✅ OpenGraph
- ✅ noindex en LAB

**Analyse** :
- ✅ **Title + description** : Standard, facile
- ✅ **OpenGraph** : Sylius supporte nativement (via Twig)
- ✅ **noindex LAB** : Meta tag `<meta name="robots" content="noindex">`

**Recommandations** :
1. **Title** : `"Dorevia-Vault — La preuve commence quand l'humain valide"`
2. **Description** : `"Plateforme de sécurisation numérique des factures. De la vente à la banque, chaque décision devient une preuve."`
3. **OpenGraph** : Image de partage (logo Dorevia-Vault)

---

## 7. Tests

### 7.1 Scénarios Définis ✅

**Spécification** :
- ✅ GET / → 200
- ✅ POST /lead valide → insert DB
- ✅ invalid → erreurs affichées
- ✅ honeypot → rejet silencieux

**Analyse** :
- ✅ **Tests fonctionnels** bien définis
- ⚠️ **Manque** : Tests de performance, tests de sécurité (rate limiting)

**Recommandations** :
1. **Tests PHPUnit** : 
   - `testLandingPageReturns200()`
   - `testLeadCreationValid()`
   - `testLeadCreationInvalid()`
   - `testHoneypotRejection()`
   - `testRateLimiting()`
2. **Tests E2E** (optionnel V1) : Playwright/Cypress pour parcours complet

---

## 8. Points d'Attention Techniques

### 8.1 Structure de Packaging

**Spécification** :
```
units/sylius/
  docker-compose.yml
  nginx.conf
  .env.example
  README.md
```

**Analyse** :
- ✅ **Cohérent** avec structure existante (`units/odoo/`, `units/gateway/`)
- ⚠️ **Manque** : 
  - Structure source code Sylius (où placer ?)
  - Configuration Symfony (`config/`, `.env`)

**Recommandation** :
```
units/sylius/
  docker-compose.yml          # Services DB, PHP-FPM, Nginx
  nginx.conf                  # Configuration Nginx
  .env.example                # Variables d'environnement
  README.md                   # Documentation
  src/                        # Code source Sylius (optionnel, si custom)
  config/                     # Configuration Symfony (si custom)
```

**Alternative** : Utiliser image Sylius officielle avec volumes pour customisations minimales.

### 8.2 Environnement LAB

**Spécification** :
```
Environnements : - APP_ENV=prod - APP_DEBUG=0
```

**Analyse** :
- ⚠️ **Contradiction** : `APP_ENV=prod` mais environnement = `LAB`
- **Clarification** : 
  - `APP_ENV=prod` = Mode production Symfony (pas de debug, cache activé)
  - `LAB` = Environnement de déploiement (vs STINGER, PROD)

**Recommandation** : 
- ✅ **Garder** `APP_ENV=prod` et `APP_DEBUG=0` (performance)
- ✅ **Ajouter** variable `DEPLOY_ENV=lab` pour distinction si nécessaire

### 8.3 Base de Données

**Spécification** :
```
MariaDB / PostgreSQL
```

**Analyse** :
- ⚠️ **Choix à faire** : MariaDB ou PostgreSQL ?
- **Recommandation** : **PostgreSQL** pour cohérence avec :
  - Odoo (PostgreSQL)
  - Vault (PostgreSQL)
  - Stack technique unifiée

---

## 9. Modèle Économique

### 9.1 Pricing Affiché ✅

**Spécification** :
```
Abonnement mensuel fixe
- usage : 0,60 € par cycle complet de facture
Message clé : "Vous payez ce que vous prouvez."
```

**Analyse** :
- ✅ **Message clair** et différenciant
- ✅ **Prix simple** à comprendre
- ⚠️ **Clarification** : 
  - "Abonnement mensuel fixe" + "0,60 € par cycle" = modèle hybride ?
  - Y a-t-il un abonnement de base + usage, ou uniquement usage ?

**Recommandation** : Clarifier dans la spec :
- **Option A** : Abonnement fixe mensuel (ex: 29€/mois) + 0,60€/cycle
- **Option B** : Uniquement 0,60€/cycle (pas d'abonnement fixe)
- **Option C** : Abonnement fixe avec X cycles inclus, puis 0,60€/cycle supplémentaire

---

## 10. Contenu Landing Page

### 10.1 Sections Définies ✅

**Spécification** :
```
Sections : hero, problème, urgence, solution, flux, intégrations, cibles, pricing, FAQ, CTA.
```

**Analyse** :
- ✅ **Structure complète** et logique
- ⚠️ **Manque** : Contenu détaillé de chaque section

**Recommandations** :
1. **Hero** : 
   - Titre : "De la vente à la banque, chaque décision devient une preuve."
   - Sous-titre : "Plateforme Dorevia-Vault — Sécurisation numérique des factures"
   - CTA : "Demander l'accès anticipé"
2. **Problème** : Risques de falsification, perte de traçabilité
3. **Urgence** : Conformité légale, contrôles fiscaux
4. **Solution** : Dorevia-Vault = scellement numérique + journal infalsifiable
5. **Flux** : Schéma visuel (validation → scellement → attestation)
6. **Intégrations** : Odoo (embarqué), architecture ERP-agnostique
7. **Cibles** : Comptables, dirigeants TPE/PME, développeurs
8. **Pricing** : 0,60€/cycle (détaillé)
9. **FAQ** : Questions fréquentes (5-10 questions)
10. **CTA final** : Formulaire lead

---

## 11. Roadmap

### 11.1 V1.1 ✅

**Spécification** :
- Notification email
- Export CSV
- Analytics

**Analyse** :
- ✅ **Réaliste** et utile
- **Recommandations** :
  - **Notification email** : Symfony Mailer (SMTP)
  - **Export CSV** : Endpoint admin `/admin/leads/export`
  - **Analytics** : Google Analytics 4 ou Plausible (RGPD-friendly)

### 11.2 V2 & V3 ✅

**Analyse** :
- ✅ **Évolution logique** vers e-commerce
- ⚠️ **V3 Checkout** : Nécessitera intégration paiement (Stripe, PayPal)

---

## 12. Recommandations Globales

### 12.1 Avant Implémentation

**Actions prioritaires** :
1. ✅ **Clarifier** liste de valeurs pour `role` (champ Lead)
2. ✅ **Clarifier** workflow pour `status` (champ Lead)
3. ✅ **Choisir** PostgreSQL (cohérence plateforme)
4. ✅ **Définir** contenu détaillé des sections landing page
5. ✅ **Clarifier** modèle économique (abonnement fixe ? ou uniquement usage ?)
6. ✅ **Définir** structure source code Sylius (image officielle ? custom ?)

### 12.2 Architecture Technique Recommandée

**Structure** :
```
units/sylius/
  docker-compose.yml          # DB (PostgreSQL), PHP-FPM, Nginx
  nginx.conf                  # Config Nginx
  .env.example                # Variables d'environnement
  README.md                   # Documentation déploiement
  src/                        # Code custom (Entity Lead, Controller, Forms)
    Entity/
      Lead.php
    Controller/
      LandingController.php
      LeadController.php
    Form/
      LeadType.php
  config/
    routes.yaml               # Routes Symfony
    services.yaml             # Services Symfony
```

**Services Docker** :
```yaml
services:
  db:
    image: postgres:16
    # ...
  php-fpm:
    image: sylius/sylius:latest  # ou image custom
    # ...
  nginx:
    image: nginx:alpine
    # ...
```

### 12.3 Intégration Caddy

**Action** : Ajouter dans `units/gateway/Caddyfile` :
```caddy
sylius.lab.core.doreviateam.com {
  reverse_proxy sylius_lab_core_nginx:80
  encode gzip zstd
  header {
    -Server
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    X-XSS-Protection "1; mode=block"
  }
}
```

---

## 13. Faisabilité

### 13.1 Estimation Effort

**V1 (Landing + Formulaire Lead)** :
- **Backend** (Entity, Controller, Forms) : 4-6h
- **Frontend** (Twig templates, CSS) : 8-12h
- **Docker** (Compose, Nginx) : 2-3h
- **Caddy** (Configuration) : 1h
- **Tests** : 2-3h
- **Documentation** : 1-2h

**Total estimé** : **18-27h** (2-3 jours développeur)

### 13.2 Risques

**Risques faibles** :
- ✅ Architecture standard Sylius
- ✅ Pas de complexité technique majeure
- ✅ Intégration Caddy simple

**Risques moyens** :
- ⚠️ **Premier déploiement Sylius** dans la plateforme (apprentissage)
- ⚠️ **Génération Caddyfile** : Ajout manuel ou adaptation script ?

**Mitigation** :
- Utiliser image Sylius officielle (moins de custom)
- Ajout manuel Caddyfile pour V1 (rapide)
- Tests en local avant déploiement LAB

---

## 14. Conclusion

### 14.1 Verdict Final

✅ **SPEC VALIDÉE** avec recommandations mineures.

**Points forts** :
- Vision claire et structurée
- Périmètre V1 réaliste
- Architecture cohérente avec plateforme
- Sécurité et RGPD pris en compte

**Actions avant implémentation** :
1. Clarifier champs `role` et `status` (Lead)
2. Définir contenu détaillé sections landing
3. Choisir PostgreSQL (cohérence)
4. Clarifier modèle économique (abonnement fixe ?)

**Faisabilité** : ✅ **EXCELLENTE** (2-3 jours développeur)

---

## 15. Checklist Pré-Implémentation

- [ ] Clarifier liste valeurs `role` (Lead)
- [ ] Définir workflow `status` (Lead)
- [ ] Choisir PostgreSQL (confirmé)
- [ ] Rédiger contenu détaillé sections landing
- [ ] Clarifier modèle économique (abonnement fixe ?)
- [ ] Définir structure source code Sylius
- [ ] Préparer DNS (record A `sylius.lab.core`)
- [ ] Préparer configuration Caddy
- [ ] Créer répertoire `units/sylius/`
- [ ] Préparer image Docker Sylius (officielle ou custom)

---

**Fin du rapport d'évaluation**

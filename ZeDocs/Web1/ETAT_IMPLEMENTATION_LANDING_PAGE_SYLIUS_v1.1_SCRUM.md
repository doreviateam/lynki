# 📊 État d'Implémentation — Landing Page Dorevia-Vault (Sylius) v1.1 — Mode Scrum

**Version** : 1.1  
**Dernière mise à jour** : 2026-01-15  
**Base** : `PLAN_IMPLEMENTATION_LANDING_PAGE_SYLIUS_v1.1_SCRUM.md`  
**Statut global** : ⏳ **À démarrer** — 0/52 points (0%)

---

## 📋 Vue d'Ensemble

### Progression Globale

| Sprint | Statut | Points | Complétion | Date Début | Date Fin |
|--------|--------|--------|------------|------------|----------|
| **Sprint 1** | ⏳ Prêt | 0/18 | 0% | - | - |
| **Sprint 2** | ⏸️ En attente | 0/21 | 0% | - | - |
| **Sprint 3** | ⏸️ En attente | 0/13 | 0% | - | - |
| **Total** | - | **0/52** | **0%** | - | - |

### Légende des Statuts

- ✅ **Terminé** : User Story complétée, tous les critères d'acceptation validés
- 🟡 **En cours** : User Story en cours d'exécution
- ⏳ **Prêt** : User Story prête à démarrer (prérequis remplis)
- ⏸️ **En attente** : User Story en attente de dépendances
- ❌ **Bloqué** : User Story bloquée (problème à résoudre)

---

## 📦 Sprint 1 : Infrastructure + Backend (1 semaine)

**Statut** : ⏳ **Prêt**  
**Dates** : -  
**Points** : 0/18 (0%)

### User Stories

#### US-1.1 : Structure de packaging — units/sylius/

**Statut** : ⏳ **Prêt**  
**Points** : 0/2

**Critères d'acceptation** :
- [ ] Répertoire `units/sylius/` créé
- [ ] Structure complète :
  - `docker-compose.yml`
  - `nginx.conf`
  - `.env.example`
  - `README.md`
  - `src/` (Entity, Controller, Form, Service, Command)
  - `config/` (routes, services, packages)
- [ ] Documentation structure dans `README.md`

**Tâches techniques** :
- [ ] Créer répertoire `units/sylius/`
- [ ] Créer structure de dossiers (`src/Entity/`, `src/Controller/`, etc.)
- [ ] Documenter structure dans `README.md`
- [ ] Créer `.gitignore` si nécessaire

**Livrables** :
- [ ] Structure `units/sylius/` complète
- [ ] `README.md` avec documentation structure

---

#### US-1.2 : Configuration Docker Compose — Services postgres, php-fpm, nginx

**Statut** : ⏳ **Prêt**  
**Points** : 0/5

**Critères d'acceptation** :
- [ ] `docker-compose.yml` créé avec 3 services :
  - `postgres` (PostgreSQL 16)
  - `php-fpm` (PHP 8.2+ avec extensions Symfony)
  - `nginx` (reverse proxy vers PHP-FPM)
- [ ] Réseau Docker `dorevia-network` configuré
- [ ] Volumes persistants pour PostgreSQL
- [ ] Variables d'environnement via `.env`
- [ ] Healthchecks configurés
- [ ] Services démarrent correctement (`docker-compose up -d`)

**Tâches techniques** :
- [ ] Créer `docker-compose.yml` avec services
- [ ] Configurer image PostgreSQL 16
- [ ] Configurer image PHP-FPM (Sylius/Symfony)
- [ ] Configurer image Nginx Alpine
- [ ] Configurer réseau Docker `dorevia-network`
- [ ] Créer volumes pour données PostgreSQL
- [ ] Créer `.env.example` avec toutes les variables
- [ ] Tester démarrage services

**Livrables** :
- [ ] `docker-compose.yml` fonctionnel
- [ ] `.env.example` complet

---

#### US-1.3 : Configuration Nginx — Reverse proxy vers PHP-FPM

**Statut** : ⏳ **Prêt**  
**Points** : 0/2

**Critères d'acceptation** :
- [ ] `nginx.conf` créé avec configuration Symfony standard
- [ ] Reverse proxy vers `php-fpm:9000`
- [ ] Support PHP-FPM (fastcgi_pass)
- [ ] Configuration pour fichiers statiques
- [ ] Headers sécurité de base
- [ ] Nginx démarre et route correctement

**Tâches techniques** :
- [ ] Créer `nginx.conf` avec configuration Symfony
- [ ] Configurer `fastcgi_pass` vers PHP-FPM
- [ ] Configurer gestion fichiers statiques
- [ ] Ajouter headers sécurité (X-Content-Type-Options, etc.)
- [ ] Tester configuration Nginx

**Livrables** :
- [ ] `nginx.conf` fonctionnel

---

#### US-1.4 : Entity Lead Doctrine — Modèle de données complet

**Statut** : ⏳ **Prêt**  
**Points** : 0/5

**Critères d'acceptation** :
- [ ] Entity `Lead` créée dans `src/Entity/Lead.php`
- [ ] Tous les champs définis :
  - `id` (auto-increment)
  - `createdAt` (DateTime)
  - `email` (string, obligatoire)
  - `role` (string, obligatoire, enum: dirigeant, daf, comptable, cabinet, retail, it_integrateur, autre)
  - `stack` (string, nullable)
  - `volume` (text, nullable)
  - `message` (text, nullable)
  - `utmSource` (string, nullable)
  - `utmCampaign` (string, nullable)
  - `referrer` (text, nullable)
  - `status` (string, default='new', enum: new, contacted, qualified, converted, archived)
  - `odooLeadId` (integer, nullable)
  - `odooSyncedAt` (DateTime, nullable)
  - `odooSyncStatus` (string, nullable: success, failed, pending)
- [ ] Migration Doctrine créée et exécutée
- [ ] Repository `LeadRepository` créé
- [ ] Validation Symfony (Assert) sur champs obligatoires

**Tâches techniques** :
- [ ] Créer `src/Entity/Lead.php` avec annotations Doctrine
- [ ] Définir tous les champs avec types et contraintes
- [ ] Ajouter validation Symfony (Assert\Email, Assert\NotBlank, etc.)
- [ ] Créer `src/Repository/LeadRepository.php`
- [ ] Générer migration Doctrine (`php bin/console doctrine:migrations:diff`)
- [ ] Exécuter migration (`php bin/console doctrine:migrations:migrate`)
- [ ] Tester création Lead via Doctrine

**Livrables** :
- [ ] Entity `Lead` complète
- [ ] Migration Doctrine exécutée
- [ ] Repository `LeadRepository`

---

#### US-1.5 : Controllers de base — Routes GET /, GET /privacy, GET /healthz

**Statut** : ⏳ **Prêt**  
**Points** : 0/4

**Critères d'acceptation** :
- [ ] `LandingController` créé avec route `GET /`
- [ ] `PrivacyController` créé avec route `GET /privacy`
- [ ] `HealthController` créé avec route `GET /healthz`
- [ ] Routes configurées dans `config/routes.yaml` ou annotations
- [ ] Templates Twig de base créés (même vides)
- [ ] Routes répondent avec code 200

**Tâches techniques** :
- [ ] Créer `src/Controller/LandingController.php`
- [ ] Créer `src/Controller/PrivacyController.php`
- [ ] Créer `src/Controller/HealthController.php`
- [ ] Configurer routes dans `config/routes.yaml`
- [ ] Créer templates Twig de base (`templates/landing/index.html.twig`, etc.)
- [ ] Tester routes avec `curl` ou navigateur

**Livrables** :
- [ ] 3 controllers créés
- [ ] Routes fonctionnelles
- [ ] Templates Twig de base

---

### Backlog Sprint 1

| ID | User Story | Points | Statut | Priorité |
|----|------------|--------|--------|----------|
| US-1.1 | Structure de packaging | 2 | ⏳ Prêt | P0 |
| US-1.2 | Configuration Docker Compose | 5 | ⏳ Prêt | P0 |
| US-1.3 | Configuration Nginx | 2 | ⏳ Prêt | P0 |
| US-1.4 | Entity Lead Doctrine | 5 | ⏳ Prêt | P0 |
| US-1.5 | Controllers de base | 4 | ⏳ Prêt | P0 |

**Total Sprint 1** : 0/18 points (0%)

---

## 📦 Sprint 2 : Frontend + Intégration Odoo (1 semaine)

**Statut** : ⏸️ **En attente**  
**Dates** : -  
**Points** : 0/21 (0%)

### User Stories

#### US-2.1 : Formulaire Lead Symfony — FormType avec validation

**Statut** : ⏸️ **En attente**  
**Points** : 0/3

**Critères d'acceptation** :
- [ ] `LeadType` créé dans `src/Form/LeadType.php`
- [ ] Tous les champs du formulaire :
  - `email` (EmailType, obligatoire)
  - `role` (ChoiceType, obligatoire, 7 valeurs)
  - `stack` (TextType, optionnel)
  - `volume` (TextareaType, optionnel)
  - `message` (TextareaType, optionnel)
  - `website` (HiddenType, honeypot anti-spam)
- [ ] Validation Symfony (Assert\Email, Assert\NotBlank)
- [ ] CSRF protection activée
- [ ] Formulaire testé (validation, erreurs)

**Tâches techniques** :
- [ ] Créer `src/Form/LeadType.php`
- [ ] Définir tous les champs avec types Symfony
- [ ] Ajouter validation (Assert)
- [ ] Configurer CSRF dans `config/packages/security.yaml`
- [ ] Créer template Twig pour formulaire
- [ ] Tester validation formulaire

**Livrables** :
- [ ] `LeadType` fonctionnel
- [ ] Validation complète

---

#### US-2.2 : Controller Lead — POST /lead avec traitement

**Statut** : ⏸️ **En attente**  
**Points** : 0/4

**Critères d'acceptation** :
- [ ] `LeadController` créé avec route `POST /lead`
- [ ] Traitement formulaire (handleRequest)
- [ ] Validation formulaire
- [ ] Vérification honeypot (champ `website` vide)
- [ ] Sauvegarde Lead dans base de données
- [ ] Récupération UTM parameters (utm_source, utm_campaign, referrer)
- [ ] Appel service Odoo sync (asynchrone, ne bloque pas)
- [ ] Message de confirmation utilisateur
- [ ] Gestion erreurs (affichage erreurs validation)

**Tâches techniques** :
- [ ] Créer `src/Controller/LeadController.php`
- [ ] Implémenter méthode `submit()` pour POST /lead
- [ ] Traiter formulaire avec `handleRequest()`
- [ ] Vérifier honeypot (si `website` rempli → rejet silencieux)
- [ ] Sauvegarder Lead via EntityManager
- [ ] Récupérer UTM depuis request
- [ ] Appeler `OdooLeadSyncService::syncLeadToOdoo()`
- [ ] Retourner réponse JSON ou redirection avec message
- [ ] Tester soumission formulaire

**Livrables** :
- [ ] `LeadController` fonctionnel
- [ ] Traitement formulaire complet

---

#### US-2.3 : Service Intégration Odoo — OdooLeadSyncService

**Statut** : ⏸️ **En attente**  
**Points** : 0/5

**Critères d'acceptation** :
- [ ] `OdooLeadSyncService` créé dans `src/Service/OdooLeadSyncService.php`
- [ ] Client Odoo (XML-RPC ou REST API) configuré
- [ ] Méthode `syncLeadToOdoo(Lead $lead)` implémentée
- [ ] Mapping champs Lead → crm.lead Odoo :
  - `email` → `email_from` et `name`
  - `role` → `function`
  - `message` → `description`
  - `utm_source` → `source_id` (relation)
  - `utm_campaign` → `campaign_id` (relation)
  - Autres champs dans `description`
- [ ] Gestion erreurs (log, ne bloque pas création lead Sylius)
- [ ] Mise à jour Lead avec `odooLeadId`, `odooSyncedAt`, `odooSyncStatus`
- [ ] Configuration via variables d'environnement (ODOO_URL, ODOO_DB, etc.)

**Tâches techniques** :
- [ ] Créer `src/Service/OdooLeadSyncService.php`
- [ ] Implémenter client Odoo (XML-RPC recommandé)
- [ ] Créer méthode `mapLeadToOdoo(Lead $lead): array`
- [ ] Implémenter `syncLeadToOdoo()` avec try/catch
- [ ] Logger toutes les erreurs
- [ ] Mettre à jour Lead après sync réussie
- [ ] Configurer variables d'environnement
- [ ] Tester intégration Odoo (mock ou réel)

**Livrables** :
- [ ] `OdooLeadSyncService` fonctionnel
- [ ] Intégration Odoo opérationnelle

---

#### US-2.4 : Landing Page Frontend — Template Twig mobile-first

**Statut** : ⏸️ **En attente**  
**Points** : 0/6

**Critères d'acceptation** :
- [ ] Template `templates/landing/index.html.twig` créé
- [ ] Sections marketing complètes :
  - Hero (titre, sous-titre, CTA)
  - Problème
  - Urgence
  - Solution
  - Flux (schéma visuel)
  - Intégrations
  - Cibles
  - Pricing (0,60€/cycle)
  - FAQ
  - CTA final (formulaire lead)
- [ ] Design mobile-first (responsive)
- [ ] CSS moderne (Tailwind CSS ou CSS custom)
- [ ] Formulaire lead intégré dans page
- [ ] SEO : title, meta description, OpenGraph
- [ ] Meta robots noindex (LAB)

**Tâches techniques** :
- [ ] Créer template Twig principal
- [ ] Rédiger contenu sections (ou utiliser placeholder)
- [ ] Intégrer formulaire lead dans template
- [ ] Ajouter CSS (Tailwind ou custom)
- [ ] Rendre responsive (mobile-first)
- [ ] Ajouter meta tags SEO
- [ ] Ajouter OpenGraph tags
- [ ] Tester affichage mobile et desktop

**Livrables** :
- [ ] Template landing page complet
- [ ] Design mobile-first

---

#### US-2.5 : Page Privacy — Template RGPD

**Statut** : ⏸️ **En attente**  
**Points** : 0/2

**Critères d'acceptation** :
- [ ] Template `templates/privacy/index.html.twig` créé
- [ ] Contenu RGPD complet :
  - Responsable traitement
  - Données collectées
  - Finalités traitement
  - Conservation (24 mois)
  - Droits utilisateur (accès, rectification, suppression)
  - Contact : privacy@doreviateam.com
- [ ] Lien depuis formulaire lead
- [ ] Design cohérent avec landing page

**Tâches techniques** :
- [ ] Créer template privacy
- [ ] Rédiger contenu RGPD
- [ ] Ajouter lien dans formulaire lead
- [ ] Tester affichage

**Livrables** :
- [ ] Page privacy complète

---

#### US-2.6 : Configuration Caddy — Route sylius.lab.core

**Statut** : ⏸️ **En attente**  
**Points** : 0/1

**Critères d'acceptation** :
- [ ] Route ajoutée dans `units/gateway/Caddyfile` :
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
- [ ] HTTPS automatique (Let's Encrypt)
- [ ] Compression activée
- [ ] Headers sécurité configurés
- [ ] Caddy rechargé et route fonctionnelle

**Tâches techniques** :
- [ ] Ajouter route dans `units/gateway/Caddyfile`
- [ ] Configurer reverse_proxy vers service Nginx
- [ ] Configurer compression et headers
- [ ] Recharger Caddy (`docker-compose restart gateway`)
- [ ] Tester accès HTTPS

**Livrables** :
- [ ] Route Caddy configurée
- [ ] HTTPS fonctionnel

---

### Backlog Sprint 2

| ID | User Story | Points | Statut | Priorité |
|----|------------|--------|--------|----------|
| US-2.1 | Formulaire Lead Symfony | 3 | ⏸️ En attente | P0 |
| US-2.2 | Controller Lead POST /lead | 4 | ⏸️ En attente | P0 |
| US-2.3 | Service Intégration Odoo | 5 | ⏸️ En attente | P0 |
| US-2.4 | Landing Page Frontend | 6 | ⏸️ En attente | P0 |
| US-2.5 | Page Privacy RGPD | 2 | ⏸️ En attente | P0 |
| US-2.6 | Configuration Caddy | 1 | ⏸️ En attente | P0 |

**Total Sprint 2** : 0/21 points (0%)

---

## 📦 Sprint 3 : Sécurité + RGPD + Tests + Documentation (1 semaine)

**Statut** : ⏸️ **En attente**  
**Dates** : -  
**Points** : 0/13 (0%)

### User Stories

#### US-3.1 : Rate Limiting — 5 req/h/IP

**Statut** : ⏸️ **En attente**  
**Points** : 0/2

**Critères d'acceptation** :
- [ ] Rate limiting configuré dans `config/packages/security.yaml`
- [ ] Limite : 5 requêtes/heure par IP sur route `POST /lead`
- [ ] Endpoint `/healthz` exempt de rate limiting
- [ ] Réponse HTTP 429 (Too Many Requests) si limite dépassée
- [ ] Message d'erreur utilisateur clair
- [ ] Tests rate limiting

**Tâches techniques** :
- [ ] Configurer Symfony Rate Limiter dans `config/packages/security.yaml`
- [ ] Créer limiter `lead_form` (5 req/h)
- [ ] Appliquer limiter sur route `POST /lead`
- [ ] Exempter route `/healthz`
- [ ] Gérer réponse 429 dans controller
- [ ] Tester rate limiting (curl avec plusieurs requêtes)

**Livrables** :
- [ ] Rate limiting fonctionnel
- [ ] Tests rate limiting

---

#### US-3.2 : Honeypot Anti-Spam — Champ website caché

**Statut** : ⏸️ **En attente**  
**Points** : 0/1

**Critères d'acceptation** :
- [ ] Champ `website` (HiddenType) ajouté au formulaire
- [ ] Champ invisible via CSS (`display: none`)
- [ ] Vérification dans controller : si `website` rempli → rejet silencieux
- [ ] Log tentative spam (optionnel)
- [ ] Tests honeypot

**Tâches techniques** :
- [ ] Ajouter champ `website` dans `LeadType` (HiddenType)
- [ ] Masquer champ via CSS dans template
- [ ] Vérifier dans `LeadController` : si `website` non vide → retourner 200 (silencieux)
- [ ] Logger tentative spam (optionnel)
- [ ] Tester honeypot (soumission avec `website` rempli)

**Livrables** :
- [ ] Honeypot fonctionnel
- [ ] Tests honeypot

---

#### US-3.3 : CRON Nettoyage RGPD — Suppression leads > 24 mois

**Statut** : ⏸️ **En attente**  
**Points** : 0/3

**Critères d'acceptation** :
- [ ] Commande `CleanupLeadsCommand` créée dans `src/Command/CleanupLeadsCommand.php`
- [ ] Supprime les leads créés il y a plus de 24 mois
- [ ] Log nombre de leads supprimés
- [ ] Commande exécutable via `php bin/console app:cleanup-leads`
- [ ] Configuration CRON pour exécution quotidienne
- [ ] Tests commande

**Tâches techniques** :
- [ ] Créer `src/Command/CleanupLeadsCommand.php`
- [ ] Implémenter logique : `createdAt < now() - 24 months`
- [ ] Supprimer leads via EntityManager
- [ ] Logger résultats
- [ ] Configurer CRON dans `docker-compose.yml` ou système
- [ ] Tester commande manuellement

**Livrables** :
- [ ] Commande `CleanupLeadsCommand` fonctionnelle
- [ ] CRON configuré

---

#### US-3.4 : Tests Unitaires et Fonctionnels — PHPUnit

**Statut** : ⏸️ **En attente**  
**Points** : 0/4

**Critères d'acceptation** :
- [ ] Tests PHPUnit configurés
- [ ] Tests unitaires :
  - `testLeadEntityValidation()`
  - `testOdooLeadSyncServiceMapping()`
  - `testOdooLeadSyncServiceErrorHandling()`
- [ ] Tests fonctionnels :
  - `testLandingPageReturns200()`
  - `testLeadCreationValid()`
  - `testLeadCreationInvalid()`
  - `testLeadCreationSyncsToOdoo()`
  - `testLeadCreationHandlesOdooFailure()`
  - `testHoneypotRejection()`
  - `testRateLimiting()`
  - `testPrivacyPageReturns200()`
  - `testHealthzReturns200()`
- [ ] Couverture de code > 80%
- [ ] Tous les tests passent

**Tâches techniques** :
- [ ] Configurer PHPUnit dans `phpunit.xml.dist`
- [ ] Créer `tests/Unit/` et `tests/Functional/`
- [ ] Écrire tests unitaires Entity Lead
- [ ] Écrire tests unitaires OdooLeadSyncService (avec mocks)
- [ ] Écrire tests fonctionnels controllers
- [ ] Exécuter tests (`php bin/phpunit`)
- [ ] Vérifier couverture code

**Livrables** :
- [ ] Suite de tests complète
- [ ] Tous les tests passent

---

#### US-3.5 : Documentation Déploiement — README.md

**Statut** : ⏸️ **En attente**  
**Points** : 0/2

**Critères d'acceptation** :
- [ ] `README.md` complet dans `units/sylius/`
- [ ] Sections :
  - Prérequis
  - Installation
  - Configuration (.env)
  - Déploiement
  - Variables d'environnement
  - Intégration Odoo (configuration)
  - Tests
  - Troubleshooting
- [ ] Exemples de commandes
- [ ] Schéma architecture (optionnel)

**Tâches techniques** :
- [ ] Créer `README.md` structuré
- [ ] Documenter installation et configuration
- [ ] Documenter variables d'environnement
- [ ] Documenter intégration Odoo
- [ ] Ajouter exemples commandes
- [ ] Ajouter section troubleshooting

**Livrables** :
- [ ] `README.md` complet

---

#### US-3.6 : Configuration DNS — Record A sylius.lab.core

**Statut** : ⏸️ **En attente**  
**Points** : 0/1

**Critères d'acceptation** :
- [ ] Record A créé : `sylius.lab.core` → IP serveur LAB
- [ ] DNS propagé et résolu
- [ ] Test accès : `curl https://sylius.lab.core.doreviateam.com`
- [ ] Certificat SSL automatique (Let's Encrypt via Caddy)

**Tâches techniques** :
- [ ] Créer record A dans DNS provider
- [ ] Vérifier résolution DNS (`dig sylius.lab.core.doreviateam.com`)
- [ ] Tester accès HTTPS
- [ ] Vérifier certificat SSL

**Livrables** :
- [ ] DNS configuré et fonctionnel

---

### Backlog Sprint 3

| ID | User Story | Points | Statut | Priorité |
|----|------------|--------|--------|----------|
| US-3.1 | Rate Limiting | 2 | ⏸️ En attente | P0 |
| US-3.2 | Honeypot Anti-Spam | 1 | ⏸️ En attente | P0 |
| US-3.3 | CRON Nettoyage RGPD | 3 | ⏸️ En attente | P0 |
| US-3.4 | Tests Unitaires et Fonctionnels | 4 | ⏸️ En attente | P0 |
| US-3.5 | Documentation Déploiement | 2 | ⏸️ En attente | P0 |
| US-3.6 | Configuration DNS | 1 | ⏸️ En attente | P0 |

**Total Sprint 3** : 0/13 points (0%)

---

## 📊 Récapitulatif Détaillé

### Progression par Catégorie

| Catégorie | User Stories | Points | Complétion |
|-----------|--------------|--------|------------|
| Infrastructure | 3 | 9 | 0% |
| Backend | 2 | 9 | 0% |
| Frontend | 2 | 8 | 0% |
| Intégration Odoo | 1 | 5 | 0% |
| Sécurité | 2 | 3 | 0% |
| RGPD | 1 | 3 | 0% |
| Tests | 1 | 4 | 0% |
| Documentation | 1 | 2 | 0% |
| Configuration | 2 | 2 | 0% |
| **Total** | **16** | **52** | **0%** |

### Blocages Identifiés

Aucun blocage actuellement.

### Notes et Remarques

- **Date de création** : 2026-01-15
- **Statut initial** : À démarrer
- **Prérequis** : Voir checklist pré-démarrage dans plan d'implémentation

---

**Dernière mise à jour** : 2026-01-15

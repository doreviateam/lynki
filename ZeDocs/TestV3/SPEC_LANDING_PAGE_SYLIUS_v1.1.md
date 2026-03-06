# SPEC --- Landing Page Dorevia-Vault (Sylius) --- LAB

**Version** : v1.1  
**Statut** : Validée (post audit)  
**Cible** : sylius.lab.core.doreviateam.com

------------------------------------------------------------------------

## 1. Contexte & intention

La plateforme **Dorevia-Vault** dispose déjà d'un prototype fonctionnel.
Cette SPEC décrit la mise en œuvre d'une **landing page mobile-first,
single page**, hébergée via **Sylius**, intégrée à la
Dorevia-Plateforme.

Objectifs : - présenter la proposition de valeur, - recruter des early
adopters, - créer automatiquement des leads exploitables.

Principes : - Toujours parler de **plateforme Dorevia-Vault** - Promesse
centrale :\
**« De la vente à la banque, chaque décision devient une preuve »** -
Capture des événements validés par l'humain - **Odoo embarqué
aujourd'hui** / **ERP-agnostique par design**

------------------------------------------------------------------------

## 2. Objectifs

### Objectif principal

-   Déployer une landing LAB sécurisée
-   Formulaire d'accès anticipé
-   Intégration CRM (Odoo)

### Objectifs secondaires

-   Qualification marketing
-   Centralisation commerciale
-   Préparation future e-commerce

------------------------------------------------------------------------

## 3. Périmètre V1

### Inclus

-   Page unique `/`
-   Sections marketing complètes
-   Formulaire lead
-   Création automatique d'un lead Odoo
-   Page `/privacy`
-   Endpoint `/healthz`

### Exclu

-   Paiement
-   Authentification
-   Abonnements
-   Multi-langue

------------------------------------------------------------------------

## 4. Modèle économique

> Modèle hybride :\
> **Abonnement mensuel + usage**

Usage : \> **0,60 € par cycle complet de facture**

Détail : - validation - envoi - encaissement - réconciliation

------------------------------------------------------------------------

## 5. Parcours utilisateur

1.  Arrivée landing
2.  Lecture message
3.  CTA
4.  Remplissage formulaire
5.  Stockage Sylius
6.  Création automatique lead Odoo
7.  Message confirmation

------------------------------------------------------------------------

## 6. Architecture

-   Sylius (Symfony)
-   PostgreSQL
-   Docker Compose
-   Reverse proxy Caddy

URL : https://sylius.lab.core.doreviateam.com

------------------------------------------------------------------------

## 7. DNS

A record : sylius.lab.core → IP serveur LAB

------------------------------------------------------------------------

## 8. Reverse Proxy

-   HTTPS obligatoire
-   compression gzip/zstd
-   headers sécurité
-   reverse vers Nginx Sylius

------------------------------------------------------------------------

## 9. Packaging

    units/sylius/
      docker-compose.yml
      nginx.conf
      .env.example
      README.md
      src/
      config/

------------------------------------------------------------------------

## 10. Déploiement

Services : - postgres - php-fpm - nginx

ENV : - APP_ENV=prod - APP_DEBUG=0 - DEPLOY_ENV=lab

------------------------------------------------------------------------

## 11. Routes

-   GET /
-   POST /lead
-   GET /privacy
-   GET /healthz

------------------------------------------------------------------------

## 12. Modèle Lead

### Champs

-   id
-   created_at
-   email (obligatoire)
-   role (obligatoire)
-   stack
-   volume
-   message
-   utm_source
-   utm_campaign
-   referrer
-   status

### Valeurs role

    dirigeant
    daf
    comptable
    cabinet
    retail
    it_integrateur
    autre

### Workflow status

    new
    contacted
    qualified
    converted
    archived

------------------------------------------------------------------------

## 13. RGPD

-   mention légale
-   page privacy
-   conservation 24 mois
-   CRON nettoyage automatique
-   email : privacy@doreviateam.com

------------------------------------------------------------------------

## 14. Sécurité

-   CSRF
-   honeypot
-   rate limit : 5 req/h/IP
-   HTTPS only

------------------------------------------------------------------------

## 15. SEO

-   title
-   meta description
-   open graph
-   robots noindex en LAB

------------------------------------------------------------------------

## 16. Intégration Odoo

À chaque création de lead Sylius : - appel API Odoo - création
crm.lead - utilisateur API dédié

------------------------------------------------------------------------

## 17. Tests

-   GET / → 200
-   POST /lead → insert DB
-   POST /lead → création Odoo
-   honeypot → rejet
-   rate limit → 429

------------------------------------------------------------------------

## 18. Roadmap

### V1.1

-   notification email
-   export CSV
-   analytics souverain

### V2

-   pages pricing
-   use cases
-   calendrier

### V3

-   checkout
-   facturation auto

------------------------------------------------------------------------

## 19. Estimation

18--27h dev

------------------------------------------------------------------------

## 20. Signature

Plateforme **Dorevia-Vault**\
« La preuve commence quand l'humain valide »

# 🎯 Plan d'Implémentation — Landing Page Dorevia-Vault (Sylius) v1.1 — Mode Scrum

**Version** : 1.1  
**Date** : 2026-01-15  
**Base** : `SPEC_LANDING_PAGE_SYLIUS_v1.1.md` (Validée post audit)  
**Durée estimée** : 3 sprints (3 semaines)  
**Équipe** : Dev plateforme / Web

---

## 📋 Vue d'Ensemble

### Objectif SPEC v1.1

Déployer une **landing page mobile-first, single page** hébergée via **Sylius**, intégrée à la Dorevia-Plateforme, avec formulaire de capture de leads et intégration automatique Odoo CRM.

**Philosophie** : *Présenter la proposition de valeur, recruter des early adopters, créer automatiquement des leads exploitables.*

### Tenant de Référence

Le tenant **`core`** sera utilisé comme tenant de référence pour la SPEC v1.1.  
URL : `https://sylius.lab.core.doreviateam.com`

### Définition de "Fait" (DoD)

La SPEC v1.1 est terminée si :
- Landing page déployée et accessible (HTTPS, mobile-first)
- Formulaire lead fonctionnel avec validation complète
- Entity Lead Doctrine complète
- Intégration Odoo opérationnelle
- Sécurité implémentée (CSRF, honeypot, rate limiting)
- RGPD conforme (page privacy, CRON nettoyage 24 mois)
- Routes fonctionnelles
- Tests unitaires et fonctionnels OK
- Documentation complète
- Configuration Caddy + DNS OK

**Statut** : ⏳ **À démarrer**

---

## 🏃 Structure Scrum

### Sprints

- Sprint 1 : Infrastructure + Backend — 18 points
- Sprint 2 : Frontend + Intégration Odoo — 21 points
- Sprint 3 : Sécurité + RGPD + Tests + Documentation — 13 points

**Total** : **52 points**

---

## 📦 Sprint 1 — Infrastructure + Backend

**Objectif** : Base technique prête.

**User Stories** :
- US-1.1 Structure packaging
- US-1.2 Docker Compose
- US-1.3 Nginx
- US-1.4 Entity Lead
- US-1.5 Controllers

---

## 📦 Sprint 2 — Frontend + Intégration Odoo

**Objectif** : Landing fonctionnelle + sync CRM.

**User Stories** :
- US-2.1 Formulaire Symfony
- US-2.2 Controller POST /lead
- US-2.3 Service Odoo sync
- US-2.4 Frontend landing
- US-2.5 Page privacy
- US-2.6 Configuration Caddy

---

## 📦 Sprint 3 — Sécurité + RGPD + Tests + Documentation

**User Stories** :
- US-3.1 Rate limiting
- US-3.2 Honeypot
- US-3.3 CRON RGPD
- US-3.4 Tests PHPUnit
- US-3.5 Documentation
- US-3.6 DNS

---

## 📊 Récapitulatif

Sprint 1 : 18 pts  
Sprint 2 : 21 pts  
Sprint 3 : 13 pts  
**Total : 52 pts**

---

## 📌 Stack

- Sylius / Symfony
- PostgreSQL
- Docker
- Caddy
- Nginx
- PHPUnit

---

## 🔐 Variables ENV

```env
APP_ENV=prod
DEPLOY_ENV=lab

DATABASE_URL=postgresql://sylius:password@postgres:5432/sylius_db

ODOO_URL=https://odoo.lab.core.doreviateam.com
ODOO_DB=odoo_db
ODOO_API_USER=sylius_api_user
ODOO_API_PASSWORD=secure_password
```

---

## ✍️ Signature

Plateforme **Dorevia-Vault**  
> La preuve commence quand l'humain valide

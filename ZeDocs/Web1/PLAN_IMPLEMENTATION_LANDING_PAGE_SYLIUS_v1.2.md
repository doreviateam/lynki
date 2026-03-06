# 🎯 PLAN D'IMPLÉMENTATION COMPLET — Landing Page Plateforme Dorevia‑Vault (Sylius)
**Version** : 1.2  
**Date** : 2026-01-16  
**Statut** : Prêt à exécuter  
**Durée** : 3 sprints (3 semaines)  
**Base** : SPEC_LANDING_PAGE_SYLIUS_v1.1.md  
**Auteur** : Dorevia Team

---

# 1. Contexte

La plateforme **Dorevia‑Vault** vise à sécuriser et prouver les opérations financières.  
Cette landing page constitue le **premier point d'entrée commercial** de la plateforme.

Promesse :
> **« De la vente à la banque, chaque décision devient une preuve »**

Principes :
- Toujours parler de **plateforme Dorevia‑Vault**
- Odoo embarqué aujourd'hui
- ERP-agnostique par design
- La preuve commence quand l'humain valide

---

# 2. Objectifs

## Objectif principal
- Déployer une landing page mobile-first
- Capturer des leads qualifiés
- Synchronisation CRM automatique (Odoo)

## Objectifs secondaires
- Qualification marketing
- Centralisation commerciale
- Préparation future e-commerce

---

# 3. Définition de Fait (DoD)

Le projet est terminé si :
- Landing en HTTPS
- Formulaire valide + anti-spam
- Base PostgreSQL opérationnelle
- Entity Lead complète
- Sync Odoo non bloquante
- RGPD respecté
- Logs exploitables
- Tests >80% couverture
- Documentation complète
- Monitoring OK

---

# 4. Architecture

```
Caddy (HTTPS)
    ↓
Nginx
    ↓
PHP‑FPM (Sylius)
    ↓
PostgreSQL
        ↓
      Odoo API
```

---

# 5. Structure projet

```
units/sylius/
 ├─ docker-compose.yml
 ├─ nginx.conf
 ├─ .env.example
 ├─ README.md
 ├─ src/
 │   ├─ Entity/
 │   ├─ Repository/
 │   ├─ Controller/
 │   ├─ Form/
 │   ├─ Service/
 │   ├─ Command/
 ├─ config/
 ├─ templates/
 └─ tests/
```

---

# 6. Variables ENV

```env
APP_ENV=prod
DEPLOY_ENV=lab

DATABASE_URL=postgresql://sylius:password@postgres:5432/sylius_db

ODOO_URL=https://odoo.lab.core.doreviateam.com
ODOO_DB=odoo_db
ODOO_API_USER=sylius_api_user
ODOO_API_PASSWORD=secure_password
ODOO_TEAM_ID=1
ODOO_USER_ID=1
```

---

# 7. Sprints détaillés

## 🟦 SPRINT 1 — Infrastructure & Backend (18 pts)

### US-1.1 Structure projet (2 pts)
- Création arborescence
- README
- .gitignore

### US-1.2 Docker Compose (5 pts)
Services :
- postgres:16
- php-fpm 8.2
- nginx alpine

Healthchecks, volumes, réseau dorevia-network

### US-1.3 Nginx (2 pts)
- fastcgi_pass
- headers sécurité
- static files

### US-1.4 Entity Lead (5 pts)
Champs :
- id
- public_uuid
- created_at
- email
- role
- stack
- volume
- message
- utm_source
- utm_campaign
- utm_medium
- utm_content
- referrer
- status
- ip_hash
- user_agent
- odoo_lead_id
- odoo_sync_status
- odoo_synced_at

Workflow :
new → contacted → qualified → converted → archived

Migration + repository + validations

### US-1.5 Controllers (4 pts)
- GET /
- GET /privacy
- GET /healthz

---

## 🟧 SPRINT 2 — Frontend & Odoo (21 pts)

### US-2.1 Formulaire (3 pts)
- CSRF
- honeypot
- validations

### US-2.2 POST /lead (4 pts)
- save DB
- flash message
- utm capture
- status=pending

### US-2.3 Odoo Sync (5 pts)
- XML-RPC
- mapping champs
- création source/campaign si absents
- logs
- gestion erreurs

### US-2.4 Frontend (6 pts)
Sections :
- Hero
- Problème
- Solution
- Flux
- Pricing
- FAQ
- CTA

Mobile-first
SEO + OG

### US-2.5 Privacy (2 pts)
- RGPD
- base légale
- contact

### US-2.6 Caddy (1 pt)
- HTTPS
- compression
- headers

---

## 🟥 SPRINT 3 — Sécurité & Qualité (13 pts)

### US-3.1 Rate limit (2 pts)
10 req/h/IP

### US-3.2 Honeypot (1 pt)

### US-3.3 CRON RGPD (3 pts)
Suppression >24 mois

### US-3.4 Tests (4 pts)
- unitaires
- fonctionnels

### US-3.5 Documentation (2 pts)
README complet

### US-3.6 DNS (1 pt)

---

# 8. Sécurité

- HTTPS only
- CSRF
- honeypot
- rate limiting
- headers sécurité

---

# 9. RGPD

- Privacy page
- Conservation 24 mois
- CRON nettoyage
- Base légale : intérêt légitime
- Sous-traitants : hébergeur

---

# 10. Observabilité

Logs :
- création lead
- sync Odoo
- erreurs

---

# 11. KPI

- taux conversion
- erreurs sync
- temps réponse

---

# 12. Roadmap

V1.2 :
- email notif
- export CSV
- analytics

V2 :
- pricing pages
- use cases

V3 :
- checkout

---

# 13. Estimation

20–30h dev

---

# 14. Signature

Plateforme **Dorevia‑Vault**  
> La preuve commence quand l'humain valide

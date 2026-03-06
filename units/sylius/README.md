# Landing Page Dorevia-Vault (Sylius)

**Version** : 1.2  
**Statut** : En développement  
**URL LAB** : https://sylius.lab.core.doreviateam.com

---

## 📋 Vue d'Ensemble

Landing page mobile-first pour la plateforme **Dorevia-Vault**, hébergée via **Sylius** (Symfony), avec formulaire de capture de leads et intégration automatique Odoo CRM.

**Promesse** : *« De la vente à la banque, chaque décision devient une preuve »*

---

## 🏗️ Structure du Projet

```
units/sylius/
 ├─ docker-compose.yml          # Services Docker (postgres, php-fpm, nginx)
 ├─ nginx.conf                  # Configuration Nginx
 ├─ .env.example                # Variables d'environnement (template)
 ├─ README.md                   # Cette documentation
 ├─ .gitignore                  # Fichiers ignorés par Git
 ├─ src/
 │   ├─ Entity/                 # Entités Doctrine (Lead, etc.)
 │   ├─ Repository/             # Repositories Doctrine
 │   ├─ Controller/             # Controllers Symfony
 │   ├─ Form/                   # Formulaires Symfony
 │   ├─ Service/                # Services métier (OdooLeadSyncService, etc.)
 │   └─ Command/                # Commandes Symfony (CRON RGPD, etc.)
 ├─ config/
 │   ├─ packages/               # Configuration packages Symfony
 │   └─ routes.yaml             # Routes Symfony
 ├─ templates/                  # Templates Twig
 │   ├─ landing/                # Templates landing page
 │   └─ privacy/                 # Templates page privacy
 └─ tests/                      # Tests PHPUnit
     ├─ Unit/                   # Tests unitaires
     └─ Functional/            # Tests fonctionnels
```

---

## 📋 Prérequis

- **Docker** & **Docker Compose** (version 3.8+)
- **Réseau Docker** : `dorevia-network` (créer avec `docker network create dorevia-network` si absent)
- **PostgreSQL 16** (géré via Docker Compose)
- **PHP 8.2+** avec extensions Symfony (géré via Docker Compose)
- **Caddy** (reverse proxy, géré par `units/gateway/`)

---

## 🚀 Installation

### 1. Configuration initiale

```bash
# Se placer dans le répertoire du projet
cd units/sylius

# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos valeurs
nano .env  # ou vim, code, etc.
```

### 2. Variables d'environnement

Configurer les variables dans `.env` (voir section [Variables d'Environnement](#-variables-denvironnement)).

### 3. Démarrer les services

```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier le statut
docker-compose ps

# Voir les logs
docker-compose logs -f
```

### 4. Initialiser la base de données

```bash
# Créer les migrations Doctrine (si nécessaire)
docker-compose exec php-fpm php bin/console doctrine:migrations:diff

# Exécuter les migrations
docker-compose exec php-fpm php bin/console doctrine:migrations:migrate
```

---

## 🚢 Déploiement

### Déploiement LAB

1. **Vérifier la configuration Caddy** :
   - Route `sylius.lab.core.doreviateam.com` configurée dans `units/gateway/Caddyfile`
   - Recharger Caddy : `docker-compose -f units/gateway/docker-compose.yml restart caddy`

2. **Démarrer les services Sylius** :
   ```bash
   cd units/sylius
   docker-compose up -d
   ```

3. **Vérifier la santé** :
   ```bash
   curl https://sylius.lab.core.doreviateam.com/healthz
   ```

### Déploiement Production

1. **Variables d'environnement** :
   - `APP_ENV=prod`
   - `APP_DEBUG=0`
   - `DEPLOY_ENV=prod`
   - Configurer `ODOO_URL` pour l'instance Odoo production

2. **Sécurité** :
   - Vérifier que HTTPS est activé (Caddy)
   - Vérifier les headers sécurité
   - Vérifier le rate limiting

3. **Monitoring** :
   - Configurer les logs (centralisation)
   - Configurer les alertes (healthz endpoint)

### CRON RGPD

Le service CRON est configuré dans `docker-compose.yml` pour exécuter quotidiennement la commande de nettoyage :

```bash
# Exécution manuelle (pour test)
docker-compose exec php-fpm php bin/console app:cleanup-leads

# Vérifier les logs CRON
docker-compose logs cron
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Caddy (HTTPS)                         │
│         sylius.lab.core.doreviateam.com                  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    Nginx (Reverse Proxy)                │
│              Headers sécurité, compression               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              PHP-FPM (Symfony/Sylius)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Controllers  │  │   Services   │  │   Entities   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌──────────────┐            ┌──────────────────┐
│  PostgreSQL  │            │   Odoo CRM API    │
│   (Leads)    │            │  (Synchronisation)│
└──────────────┘            └──────────────────┘
```

---

## 🔧 Développement

### Commandes utiles

```bash
# Démarrer les services
docker-compose up -d

# Voir les logs (tous les services)
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f php-fpm
docker-compose logs -f nginx
docker-compose logs -f postgres

# Arrêter les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker-compose down -v

# Accéder au container PHP-FPM
docker-compose exec php-fpm bash

# Exécuter les migrations Doctrine
docker-compose exec php-fpm php bin/console doctrine:migrations:diff
docker-compose exec php-fpm php bin/console doctrine:migrations:migrate

# Exécuter les tests
docker-compose exec php-fpm php bin/phpunit

# Tests avec couverture
docker-compose exec php-fpm php bin/phpunit --coverage-html coverage/

# Nettoyage RGPD (commande manuelle)
docker-compose exec php-fpm php bin/console app:cleanup-leads

# Vérifier la santé
curl http://localhost/healthz  # Depuis le container
curl https://sylius.lab.core.doreviateam.com/healthz  # Depuis l'extérieur
```

---

## 📝 Variables d'Environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `APP_ENV` | Environnement Symfony | `prod` |
| `DEPLOY_ENV` | Environnement déploiement | `lab` |
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `ODOO_URL` | URL instance Odoo | `https://odoo.lab.core.doreviateam.com` |
| `ODOO_DB` | Base de données Odoo | `odoo_db` |
| `ODOO_API_USER` | Utilisateur API Odoo | `sylius_api_user` |
| `ODOO_API_PASSWORD` | Mot de passe API Odoo | `secure_password` |
| `ODOO_TEAM_ID` | ID équipe commerciale Odoo | `1` |
| `ODOO_USER_ID` | ID commercial par défaut Odoo | `1` |

---

## 🔗 Intégration Odoo

Le service `OdooLeadSyncService` synchronise automatiquement les leads créés dans Sylius vers Odoo CRM (`crm.lead`).

**Mapping des champs** :
- `email` → `email_from` et `name`
- `role` → `function`
- `message` → `description`
- `utm_source` → `source_id` (création si absent)
- `utm_campaign` → `campaign_id` (création si absent)

**Gestion des erreurs** : Les erreurs de synchronisation sont loggées mais n'empêchent pas la création du lead dans Sylius.

---

## 🧪 Tests

```bash
# Exécuter tous les tests
docker-compose exec php-fpm php bin/phpunit

# Tests unitaires uniquement
docker-compose exec php-fpm php bin/phpunit tests/Unit

# Tests fonctionnels uniquement
docker-compose exec php-fpm php bin/phpunit tests/Functional

# Avec couverture de code
docker-compose exec php-fpm php bin/phpunit --coverage-html coverage/
```

**Objectif** : Couverture de code > 80%

---

## 🔒 Sécurité

- **HTTPS** : Obligatoire (géré par Caddy)
- **CSRF** : Protection activée sur tous les formulaires
- **Honeypot** : Champ `website` invisible pour bloquer les bots
- **Rate Limiting** : 10 requêtes/heure par IP sur `POST /lead`
- **Headers sécurité** : X-Content-Type-Options, X-Frame-Options, X-XSS-Protection

---

## 📊 RGPD

- **Conservation** : 24 mois maximum
- **CRON nettoyage** : Exécution quotidienne (`CleanupLeadsCommand`)
- **Base légale** : Intérêt légitime
- **Droits utilisateur** : Accès, rectification, suppression (contact : privacy@doreviateam.com)
- **Page privacy** : `/privacy`

---

## 🐛 Troubleshooting

### Services ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs

# Vérifier le réseau Docker
docker network ls | grep dorevia-network
```

### Erreur de connexion PostgreSQL

- Vérifier que le service `postgres` est démarré
- Vérifier `DATABASE_URL` dans `.env`
- Vérifier que le réseau `dorevia-network` est configuré

### Erreur de synchronisation Odoo

- Vérifier les logs : `docker-compose logs php-fpm | grep Odoo`
- Vérifier les variables `ODOO_*` dans `.env`
- Vérifier que l'utilisateur API Odoo a les droits `crm.lead` (create, write)
- Tester la connexion Odoo manuellement :
  ```bash
  docker-compose exec php-fpm php -r "
    \$url = 'https://odoo.lab.core.doreviateam.com/xmlrpc/2/common';
    \$ch = curl_init(\$url);
    curl_setopt(\$ch, CURLOPT_RETURNTRANSFER, true);
    \$result = curl_exec(\$ch);
    var_dump(\$result);
  "
  ```

### Rate limiting trop strict

- Vérifier la configuration dans `config/packages/rate_limiter.yaml`
- Vérifier les logs : `docker-compose logs php-fpm | grep "Rate limit"`
- Pour tester : envoyer plusieurs requêtes depuis la même IP

### Erreur CRON

- Vérifier que le service `cron` est démarré : `docker-compose ps cron`
- Vérifier les logs CRON : `docker-compose logs cron`
- Tester la commande manuellement : `docker-compose exec php-fpm php bin/console app:cleanup-leads`

### Problème de réseau Docker

```bash
# Vérifier que le réseau existe
docker network ls | grep dorevia-network

# Créer le réseau si absent
docker network create dorevia-network

# Vérifier la connectivité
docker-compose exec php-fpm ping postgres
docker-compose exec php-fpm ping nginx
```

---

## 📚 Documentation Complémentaire

- **Plan d'implémentation** : `ZeDocs/Web1/PLAN_IMPLEMENTATION_LANDING_PAGE_SYLIUS_v1.2.md`
- **État d'avancement** : `ZeDocs/Web1/ETAT_IMPLEMENTATION_LANDING_PAGE_SYLIUS_v1.2.md`
- **Spécification** : `ZeDocs/Web1/SPEC_LANDING_PAGE_SYLIUS_v1.1.md`
- **Évaluation** : `ZeDocs/Web1/EVALUATION_SPEC_LANDING_PAGE_SYLIUS_v1.1.md`

## 🔄 Maintenance

### Mise à jour

```bash
# Arrêter les services
docker-compose down

# Mettre à jour le code (via Git)
git pull

# Redémarrer les services
docker-compose up -d

# Exécuter les migrations si nécessaire
docker-compose exec php-fpm php bin/console doctrine:migrations:migrate
```

### Sauvegarde

```bash
# Sauvegarder la base de données
docker-compose exec postgres pg_dump -U sylius sylius_db > backup_$(date +%Y%m%d).sql

# Restaurer la base de données
docker-compose exec -T postgres psql -U sylius sylius_db < backup_YYYYMMDD.sql
```

---

## ✍️ Signature

Plateforme **Dorevia-Vault**  
> La preuve commence quand l'humain valide

# 🏗️ Création Instance Sylius Indépendante — Tenant lovable44

**Date** : 2026-01-22  
**Objectif** : Créer une instance Sylius structurellement indépendante pour le tenant `lovable44`

---

## ✅ Structure créée

```
tenants/lovable44/
├── apps/
│   └── sylius/
│       └── lab/
│           └── docker-compose.yml    # Instance indépendante
└── state/
    └── manifest.json
```

---

## 🔧 Configuration

### 1. Docker Compose (`tenants/lovable44/apps/sylius/lab/docker-compose.yml`)

**Conteneurs créés** :
- `sylius_lab_lovable44_postgres` : Base de données PostgreSQL dédiée
- `sylius_lab_lovable44_php-fpm` : PHP-FPM dédié
- `sylius_lab_lovable44_nginx` : Nginx dédié

**Base de données** :
- Nom : `sylius_lab_lovable44_db`
- Volume : `sylius_lab_lovable44_postgres_data`

**Code source** :
- Volumes montés depuis `units/sylius/` (partage du code, isolation des données)

---

## 🔄 Modifications effectuées

### 1. Caddyfile (`units/gateway/Caddyfile`)
- ✅ Route `sylius.lab.lovable44.doreviateam.com` → `sylius_lab_lovable44_nginx:80`
- ✅ Plus de routage vers `sylius_lab_core_nginx`

### 2. HomeController (`units/sylius/src/Controller/HomeController.php`)
- ✅ Retour à la version normale (Dorevia-Vault uniquement)
- ✅ Suppression de la détection de hostname

### 3. Instance lovable44
- ✅ `tenants/lovable44/apps/sylius/lab/docker-compose.yml` créé
- ✅ Conteneurs nommés avec préfixe `sylius_lab_lovable44_*`
- ✅ Base de données séparée

---

## 🚀 Déploiement

### 1. Démarrer l'instance lovable44

```bash
cd /opt/dorevia-plateform/tenants/lovable44/apps/sylius/lab
docker compose up -d
```

### 2. Initialiser la base de données

```bash
docker compose exec php-fpm php bin/console doctrine:database:create --if-not-exists
docker compose exec php-fpm php bin/console doctrine:schema:create
```

### 3. Recharger Caddy

```bash
cd /opt/dorevia-plateform/units/gateway
docker compose restart caddy
```

---

## ✅ Vérification

### 1. Vérifier les conteneurs

```bash
docker ps | grep lovable44
```

**Conteneurs attendus** :
- `sylius_lab_lovable44_postgres`
- `sylius_lab_lovable44_php-fpm`
- `sylius_lab_lovable44_nginx`

### 2. Vérifier l'accès

```bash
curl -I https://sylius.lab.lovable44.doreviateam.com
```

**Résultat attendu** : HTTP 200

---

## 📊 Isolation obtenue

| Élément | core | lovable44 | Statut |
|---------|------|-----------|--------|
| **Conteneurs** | `sylius_lab_core_*` | `sylius_lab_lovable44_*` | ✅ Séparés |
| **Base de données** | `sylius_db` | `sylius_lab_lovable44_db` | ✅ Séparées |
| **Volumes** | `sylius_lab_core_*` | `sylius_lab_lovable44_*` | ✅ Séparés |
| **Code source** | `units/sylius/` | `units/sylius/` (partagé) | ⚠️ Partagé |
| **Nginx** | `sylius_lab_core_nginx` | `sylius_lab_lovable44_nginx` | ✅ Séparés |

**Note** : Le code source est partagé via volumes montés, mais les données et l'exécution sont complètement isolées.

---

## 🎯 Résultat

✅ **Isolation structurelle complète** :
- Conteneurs Docker séparés
- Bases de données séparées
- Volumes séparés
- Pas d'impact mutuel

✅ **Conforme à l'architecture Dorevia** :
- Structure `tenants/<tenant>/apps/<univers>/<env>/`
- Naming convention respectée
- Isolation par tenant garantie

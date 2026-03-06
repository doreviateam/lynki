# 📘 Spécification Détaillée — Implémentation Actuelle Dorevia Platform

**Version** : 1.0  
**Date** : 2025-01-29  
**Statut** : Spécification de référence — État actuel de l'implémentation  
**Périmètre** : Architecture, déploiement, configuration, processus opérationnels

---

## 📋 Table des Matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture](#2-architecture)
3. [Structure des Répertoires](#3-structure-des-répertoires)
4. [CLI `dorevia.sh`](#4-cli-doreviash)
5. [Processus de Déploiement](#5-processus-de-déploiement)
6. [Conventions de Nommage](#6-conventions-de-nommage)
7. [Configuration et Templates](#7-configuration-et-templates)
8. [Réseau et Isolation](#8-réseau-et-isolation)
9. [Flux de Données](#9-flux-de-données)
10. [Sécurité et Tokens](#10-sécurité-et-tokens)
11. [Gestion des Modules OCA](#11-gestion-des-modules-oca)
12. [Gateway et Routage](#12-gateway-et-routage)
13. [Volumes et Persistance](#13-volumes-et-persistance)
14. [Codes d'Erreur](#14-codes-derreur)

---

## 1. Vue d'ensemble

### 1.1 Description

La plateforme Dorevia est une **infrastructure multi-tenant** qui permet de déployer et gérer des applications (notamment Odoo) de manière isolée par tenant, avec des services partagés (DVIG, Vault) et une gateway centralisée (Caddy) pour le routage HTTPS.

### 1.2 Composants Principaux

- **Gateway globale** : Caddy (reverse proxy HTTPS, certificats Let's Encrypt automatiques)
- **Services Platform** (par tenant) : DVIG, Vault, Vault DB
- **Applications** (par tenant + environnement) : Odoo LAB, STINGER, PROD
- **CLI d'orchestration** : `dorevia.sh`

### 1.3 Principes d'Architecture

- **Isolation par tenant** : Chaque tenant a ses propres services, bases de données, volumes
- **Isolation par environnement** : LAB, STINGER, PROD sont complètement séparés
- **Génération depuis templates** : Configuration générée automatiquement depuis templates
- **Exécution directe** : CLI exécute directement les déploiements (pas de séparation intention/exécution)

---

## 2. Architecture

### 2.1 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    GATEWAY (Caddy)                           │
│              HTTPS automatique (Let's Encrypt)               │
│         Routage par domaine → Services Docker                 │
│         Container: gateway-caddy                             │
│         Ports: 80, 443                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │     RÉSEAU DOCKER (dorevia-network)    │
        │     External: true                     │
        └───────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Tenant CORE  │   │ Tenant DIDO  │   │ Tenant ROZAS │
│              │   │              │   │              │
│ Platform:    │   │ Platform:    │   │ Platform:    │
│ - DVIG       │   │ - DVIG       │   │ - DVIG       │
│ - Vault      │   │ - Vault      │   │ - Vault      │
│ - Vault DB   │   │ - Vault DB   │   │ - Vault DB   │
│              │   │              │   │              │
│ Apps Odoo:   │   │ Apps Odoo:   │   │ Apps Odoo:   │
│ - LAB        │   │ - LAB        │   │ - LAB        │
│ - STINGER    │   │ - STINGER    │   │ - STINGER    │
│ - PROD       │   │ - PROD       │   │ - PROD       │
└──────────────┘   └──────────────┘   └──────────────┘
```

### 2.2 Couches d'Orchestration

#### Couche 0 : Gateway Globale

- **Service** : Caddy (reverse proxy HTTPS)
- **Container** : `gateway-caddy`
- **Réseau** : `dorevia-network`
- **Ports exposés** : `80`, `443`
- **Configuration** : `units/gateway/Caddyfile` (manuellement édité)
- **Volumes** :
  - `caddy_data` : Certificats Let's Encrypt
  - `caddy_config` : Configuration Caddy

#### Couche 1 : Services Platform (par tenant)

- **Services** : DVIG, Vault, Vault DB
- **Isolation** : Par tenant (containers, volumes, DB séparés)
- **Réseau** : `dorevia-network`
- **Compose project** : `dorevia_<tenant>_platform`
- **Containers** :
  - `dvig-<tenant>`
  - `vault-<tenant>`
  - `vault-db-<tenant>`

#### Couche 2 : Applications (par tenant + environnement)

- **Applications** : Odoo (univers `odoo`)
- **Environnements** : `lab`, `stinger`, `prod`
- **Isolation** : Par tenant ET par environnement (DB, volumes, containers séparés)
- **Réseau** : `dorevia-network`
- **Compose project** : `dorevia_<univers>_<env>_<tenant>`
- **Containers** :
  - `odoo_<env>_<tenant>`
  - `odoo_db_<env>_<tenant>`

---

## 3. Structure des Répertoires

### 3.1 Arborescence Complète

```
/opt/dorevia-plateform/
├── bin/
│   └── dorevia.sh              # CLI d'orchestration
├── units/
│   ├── gateway/
│   │   ├── Caddyfile           # Configuration routage HTTPS (manuel)
│   │   └── docker-compose.yml  # Container Caddy
│   └── odoo/
│       └── custom-addons/       # Modules métier Odoo
│           └── bin/
│               └── oca_flatten.sh  # Script symlinks OCA
├── sources/
│   ├── oca/                    # Modules OCA (read-only, 412 modules)
│   ├── dvig/                   # Code source DVIG
│   └── vault/                  # Code source Vault
├── tenants/
│   ├── <tenant>/
│   │   ├── platform/
│   │   │   ├── docker-compose.yml.template  # Template services partagés
│   │   │   └── docker-compose.yml          # Généré depuis template
│   │   ├── apps/
│   │   │   └── <univers>/      # odoo
│   │   │       ├── lab/
│   │   │       │   ├── docker-compose.yml.template
│   │   │       │   ├── docker-compose.yml  # Généré
│   │   │       │   ├── odoo.conf.template
│   │   │       │   └── odoo.conf           # Généré
│   │   │       ├── stinger/     # Même structure
│   │   │       └── prod/        # Même structure
│   │   ├── secrets/
│   │   │   └── dvig.tokens.yml  # Tokens DVIG (hors Git, permissions 0400)
│   │   └── state/
│   │       └── manifest.json    # Métadonnées (partiel)
└── ZeDocs/                     # Documentation
```

### 3.2 Répertoires Clés

#### `bin/dorevia.sh`

Script Bash principal d'orchestration. Contient toute la logique de :
- Validation (tenant, univers, env)
- Génération de configuration depuis templates
- Déploiement Docker Compose
- Gestion des tokens DVIG

#### `units/gateway/`

Configuration de la gateway globale Caddy :
- `Caddyfile` : Configuration de routage (édité manuellement)
- `docker-compose.yml` : Définition du container Caddy

#### `tenants/<tenant>/platform/`

Services partagés par tenant :
- `docker-compose.yml.template` : Template avec variables `{{TENANT}}`, `{{ROOT_DIR}}`
- `docker-compose.yml` : Généré depuis template

#### `tenants/<tenant>/apps/<univers>/<env>/`

Application par univers et environnement :
- `docker-compose.yml.template` : Template avec variables multiples
- `docker-compose.yml` : Généré depuis template
- `odoo.conf.template` : Template configuration Odoo
- `odoo.conf` : Généré depuis template

#### `tenants/<tenant>/secrets/`

Secrets (hors Git, permissions strictes) :
- `dvig.tokens.yml` : Tokens DVIG (source de vérité unique)

---

## 4. CLI `dorevia.sh`

### 4.1 Vue d'Ensemble

**Fichier** : `bin/dorevia.sh`  
**Langage** : Bash  
**Version** : 1.0  
**Mode d'exécution** : Direct (pas de séparation intention/exécution)

### 4.2 Structure

```bash
#!/bin/bash
# dorevia.sh - Orchestrateur de Plateforme Dorevia
# Version: 1.0

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TENANTS_DIR="$ROOT_DIR/tenants"

# Codes d'erreur
E01=1  # paramètre invalide
E02=2  # invariant violé
E03=3  # dépendance manquante
E04=4  # platform down
E05=5  # ressource occupée
E06=6  # opération destructive sans flag --purge
```

### 4.3 Commandes Disponibles

#### Gateway

```bash
dorevia.sh gateway up          # Démarre gateway globale (Caddy)
dorevia.sh gateway status      # Affiche statut gateway
dorevia.sh gateway down         # Stoppe gateway
dorevia.sh gateway reload       # Recharge configuration Caddy
```

#### Platform (par tenant)

```bash
dorevia.sh platform up <tenant>          # Démarre services partagés
dorevia.sh platform status <tenant>     # Affiche statut
dorevia.sh platform down <tenant>       # Stoppe services
dorevia.sh platform destroy <tenant> [--purge]  # Détruit (--purge pour volumes)
```

#### App (par univers + env + tenant)

```bash
dorevia.sh app up <univers> <env> <tenant>      # Démarre application
dorevia.sh app status <univers> <env> <tenant>   # Affiche statut
dorevia.sh app down <univers> <env> <tenant>     # Stoppe application
dorevia.sh app reset <univers> <env> <tenant> [--purge]  # Reset (--purge requis)
dorevia.sh app destroy <univers> <env> <tenant> [--purge]  # Détruit
```

#### Token DVIG

```bash
dorevia.sh token issue <univers> <env> <tenant> [--force]  # Crée token
dorevia.sh token list <tenant>                             # Liste tokens
dorevia.sh token revoke <tenant> <token_id>                # Révoque token
dorevia.sh token rotate <univers> <env> <tenant> [--revoke-old]  # Rotation
```

#### Utilitaires

```bash
dorevia.sh help      # Aide
dorevia.sh version   # Version
dorevia.sh doctor    # Vérifie prérequis
```

### 4.4 Fonctions Principales

#### Validation

```bash
validate_tenant()    # Slug DNS: [a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?
validate_env()       # lab|stinger|prod
validate_univers()   # odoo (v1.0)
```

#### Génération depuis Templates

```bash
generate_platform_compose()  # Génère docker-compose.yml platform depuis template
generate_app_compose()        # Génère docker-compose.yml app depuis template
generate_app_odoo_conf()     # Génère odoo.conf depuis template
```

**Variables de template** :
- `{{TENANT}}` : Nom du tenant
- `{{ROOT_DIR}}` : Chemin racine du projet
- `{{UNIVERS}}` : Univers (odoo)
- `{{ENV}}` : Environnement (lab|stinger|prod)
- `{{SOURCE}}` : `univers.env.tenant`
- `{{DB_NAME}}` : `odoo_<env>_<tenant>`
- `{{COMPOSE_PROJECT}}` : `dorevia_<univers>_<env>_<tenant>`
- `{{VOLUME_DB}}` : Nom volume DB
- `{{VOLUME_DB_NAME}}` : Nom Docker volume DB
- `{{VOLUME_DATA}}` : Nom volume data
- `{{VOLUME_DATA_NAME}}` : Nom Docker volume data

#### Vérifications

```bash
check_dorevia_network()   # Vérifie/crée réseau dorevia-network
check_gateway()           # Vérifie gateway démarrée (prérequis)
check_platform_up()      # Vérifie platform démarrée (prérequis app)
check_container_conflicts()  # Détecte conflits containers
```

#### Validation Images

```bash
validate_app_image()  # Refuse :latest en STINGER/PROD (E02)
```

### 4.5 Processus d'Exécution

#### Exemple : `dorevia.sh app up odoo lab core`

1. **Validation** :
   - `validate_univers("odoo")`
   - `validate_env("lab")`
   - `validate_tenant("core")`

2. **Vérifications prérequis** :
   - `check_gateway()` → Vérifie `gateway-caddy` running
   - `check_platform_up("core")` → Vérifie `dvig-core`, `vault-core` running
   - `check_dorevia_network()` → Vérifie/crée réseau

3. **Génération identifiants** (logique implicite dans script) :
   ```bash
   source="odoo.lab.core"
   db_name="odoo_lab_core"
   volume_db="odoo_lab_core_db"
   volume_data="odoo_lab_core_data"
   compose_project="dorevia_odoo_lab_core"
   ```

4. **Génération configuration** :
   - `generate_app_compose()` → Génère `docker-compose.yml` depuis template
   - `generate_app_odoo_conf()` → Génère `odoo.conf` depuis template

5. **Validation image** :
   - `validate_app_image("lab", "odoo:18.0-20250819")` → Vérifie pas `:latest` en STINGER/PROD

6. **Déploiement** :
   ```bash
   cd "$app_dir"
   docker compose -p "$compose_project" up -d
   ```

**Caractéristique** : Exécution directe, pas de séparation intention/exécution.

---

## 5. Processus de Déploiement

### 5.1 Déploiement Gateway

```bash
dorevia.sh gateway up
```

**Processus** :
1. Vérifie `units/gateway/docker-compose.yml` existe
2. Vérifie/crée réseau `dorevia-network`
3. `cd units/gateway && docker compose up -d`
4. Container `gateway-caddy` démarre
5. Caddy lit `Caddyfile` et obtient certificats Let's Encrypt

**Prérequis** :
- Docker, Docker Compose installés
- Ports 80/443 disponibles
- DNS configuré (enregistrements A pointant vers serveur)

### 5.2 Déploiement Platform (par tenant)

```bash
dorevia.sh platform up <tenant>
```

**Processus** :
1. Validation tenant (slug DNS)
2. Vérification gateway démarrée
3. Vérification/création réseau `dorevia-network`
4. Génération `docker-compose.yml` depuis template (si absent)
5. Vérification fichier tokens : `tenants/<tenant>/secrets/dvig.tokens.yml`
6. Vérification conflits containers (avertissement)
7. `cd tenants/<tenant>/platform && docker compose -p dorevia_<tenant>_platform up -d`

**Services démarrés** :
- `dvig-<tenant>` : Port 8080 (interne)
- `vault-<tenant>` : Port 8080 (interne)
- `vault-db-<tenant>` : PostgreSQL (interne)

**URLs** :
- `https://dvig.<tenant>.doreviateam.com`
- `https://vault.<tenant>.doreviateam.com`

### 5.3 Déploiement App (par univers + env + tenant)

```bash
dorevia.sh app up <univers> <env> <tenant>
```

**Processus** :
1. Validation univers, env, tenant
2. Vérification gateway démarrée
3. Vérification platform démarrée
4. Vérification/création réseau
5. Génération identifiants (logique implicite) :
   - `source = univers.env.tenant`
   - `db_name = odoo_<env>_<tenant>`
   - `volume_db = odoo_<env>_<tenant>_db`
   - `volume_data = odoo_<env>_<tenant>_data`
   - `compose_project = dorevia_<univers>_<env>_<tenant>`
6. Création répertoire `tenants/<tenant>/apps/<univers>/<env>`
7. Génération `docker-compose.yml` depuis template (si absent)
8. Génération `odoo.conf` depuis template (si absent)
9. Validation image (refuse `:latest` en STINGER/PROD)
10. `cd tenants/<tenant>/apps/<univers>/<env> && docker compose -p <compose_project> up -d`

**Services démarrés** :
- `odoo_<env>_<tenant>` : Odoo (port 8069 interne)
- `odoo_db_<env>_<tenant>` : PostgreSQL (port 5432 interne)

**URL** :
- `https://<univers>.<env>.<tenant>.doreviateam.com`

**Exemple** :
- `https://odoo.lab.core.doreviateam.com`

### 5.4 Ordre de Déploiement Recommandé

1. **Gateway** : `dorevia.sh gateway up`
2. **Platform** : `dorevia.sh platform up <tenant>`
3. **Tokens** : `dorevia.sh token issue <univers> <env> <tenant>` (pour chaque env)
4. **Apps** : `dorevia.sh app up <univers> <env> <tenant>` (pour chaque env)

---

## 6. Conventions de Nommage

### 6.1 Containers

#### Gateway
- `gateway-caddy` (global, unique)

#### Platform (par tenant)
- `dvig-<tenant>`
- `vault-<tenant>`
- `vault-db-<tenant>`

#### Apps (par univers + env + tenant)
- `odoo_<env>_<tenant>`
- `odoo_db_<env>_<tenant>`

**Exemples** :
- `odoo_lab_core`
- `odoo_db_lab_core`
- `dvig-core`
- `vault-core`

### 6.2 Volumes Docker

#### Platform
- `vault_db_<tenant>_data` : Base de données Vault
- `vault_storage_<tenant>` : Stockage fichiers Vault
- `vault_ledger_<tenant>` : Ledger Vault
- `vault_audit_<tenant>` : Audit Vault
- `dvig_logs_<tenant>` : Logs DVIG

#### Apps
- `odoo_<env>_<tenant>_db` : Base de données Odoo
- `odoo_<env>_<tenant>_data` : Filestore Odoo
- `oca_extra_addons` : Modules OCA (partagé entre tous les tenants)

**Exemples** :
- `odoo_lab_core_db`
- `odoo_lab_core_data`
- `vault_db_core_data`

### 6.3 Bases de Données PostgreSQL

#### Platform
- `dorevia_vault` (par tenant)

#### Apps
- `odoo_<env>_<tenant>`

**Exemples** :
- `odoo_lab_core`
- `odoo_stinger_core`
- `odoo_prod_core`

### 6.4 Compose Projects

#### Platform
- `dorevia_<tenant>_platform`

#### Apps
- `dorevia_<univers>_<env>_<tenant>`

**Exemples** :
- `dorevia_core_platform`
- `dorevia_odoo_lab_core`

### 6.5 URLs (Domaines)

#### Apps
- `<univers>.<env>.<tenant>.doreviateam.com`

**Exemples** :
- `odoo.lab.core.doreviateam.com`
- `odoo.stinger.core.doreviateam.com`
- `odoo.prod.core.doreviateam.com`

#### Services Partagés
- `<service>.<tenant>.doreviateam.com` (⚠️ pas d'env)

**Exemples** :
- `dvig.core.doreviateam.com`
- `vault.core.doreviateam.com`

### 6.6 Source (Identité DVIG)

Format : `<univers>.<env>.<tenant>`

**Exemples** :
- `odoo.lab.core`
- `odoo.stinger.core`
- `odoo.prod.core`

### 6.7 Tokens DVIG

Format ID : `tok_<env>_<tenant>_<nnn>`

**Exemples** :
- `tok_lab_core_001`
- `tok_stinger_core_001`
- `tok_prod_core_001`

---

## 7. Configuration et Templates

### 7.1 Templates Platform

**Fichier** : `tenants/<tenant>/platform/docker-compose.yml.template`

**Variables** :
- `{{TENANT}}` : Nom du tenant
- `{{ROOT_DIR}}` : Chemin racine (`/opt/dorevia-plateform`)

**Génération** :
```bash
sed -e "s|{{TENANT}}|$tenant|g" \
    -e "s|{{ROOT_DIR}}|$ROOT_DIR|g" \
    "$template" > "$output"
```

**Résultat** : `tenants/<tenant>/platform/docker-compose.yml`

### 7.2 Templates App

**Fichier** : `tenants/<tenant>/apps/<univers>/<env>/docker-compose.yml.template`

**Variables** :
- `{{UNIVERS}}` : Univers (odoo)
- `{{ENV}}` : Environnement (lab|stinger|prod)
- `{{TENANT}}` : Tenant
- `{{SOURCE}}` : `univers.env.tenant`
- `{{DB_NAME}}` : `odoo_<env>_<tenant>`
- `{{COMPOSE_PROJECT}}` : `dorevia_<univers>_<env>_<tenant>`
- `{{VOLUME_DB}}` : Nom volume DB
- `{{VOLUME_DB_NAME}}` : Nom Docker volume DB
- `{{VOLUME_DATA}}` : Nom volume data
- `{{VOLUME_DATA_NAME}}` : Nom Docker volume data
- `{{ROOT_DIR}}` : Chemin racine

**Génération** :
```bash
sed -e "s|{{UNIVERS}}|$univers|g" \
    -e "s|{{ENV}}|$env|g" \
    -e "s|{{TENANT}}|$tenant|g" \
    -e "s|{{SOURCE}}|$source|g" \
    -e "s|{{DB_NAME}}|$db_name|g" \
    -e "s|{{COMPOSE_PROJECT}}|$compose_project|g" \
    -e "s|{{VOLUME_DB}}|$volume_db|g" \
    -e "s|{{VOLUME_DB_NAME}}|$volume_db_name|g" \
    -e "s|{{VOLUME_DATA}}|$volume_data|g" \
    -e "s|{{VOLUME_DATA_NAME}}|$volume_data_name|g" \
    -e "s|{{ROOT_DIR}}|$ROOT_DIR|g" \
    "$template" > "$output"
```

**Résultat** : `tenants/<tenant>/apps/<univers>/<env>/docker-compose.yml`

### 7.3 Templates Odoo Config

**Fichier** : `tenants/<tenant>/apps/<univers>/<env>/odoo.conf.template`

**Variables** :
- `{{UNIVERS}}` : Univers
- `{{ENV}}` : Environnement
- `{{TENANT}}` : Tenant
- `{{SOURCE}}` : `univers.env.tenant`
- `{{DB_NAME}}` : `odoo_<env>_<tenant>`

**Génération** :
```bash
sed -e "s|{{UNIVERS}}|$univers|g" \
    -e "s|{{ENV}}|$env|g" \
    -e "s|{{TENANT}}|$tenant|g" \
    -e "s|{{SOURCE}}|$source|g" \
    -e "s|{{DB_NAME}}|$db_name|g" \
    "$template" > "$output"
```

**Résultat** : `tenants/<tenant>/apps/<univers>/<env>/odoo.conf`

### 7.4 Configuration Odoo Générée

**Exemple** : `tenants/core/apps/odoo/lab/odoo.conf`

```ini
[options]
# Base de données
db_host = odoo_db_lab_core
db_port = 5432
db_user = odoo
db_password = odoo
dbfilter = ^odoo_lab_core$

# Mot de passe maître
admin_passwd = doreviateam@2026

# Addons
addons_path = /usr/lib/python3/dist-packages/odoo/addons,/mnt/extra-addons,/mnt/custom-addons

# Data
data_dir = /var/lib/odoo
```

**Points clés** :
- `db_host` : Nom du container DB (pas `db`, pour éviter conflits DNS)
- `dbfilter` : Filtre strict sur nom de DB
- `admin_passwd` : Master password pour gestion bases

### 7.5 Configuration Caddyfile

**Fichier** : `units/gateway/Caddyfile`

**Format** : Édité manuellement (pas de génération automatique)

**Structure** :
```caddy
{
  email admin@doreviateam.com
}

# Odoo - Environnements (tenant <tenant>)
odoo.lab.<tenant>.doreviateam.com {
  reverse_proxy odoo_lab_<tenant>:8069
}

odoo.stinger.<tenant>.doreviateam.com {
  reverse_proxy odoo_stinger_<tenant>:8069
}

odoo.prod.<tenant>.doreviateam.com {
  reverse_proxy odoo_prod_<tenant>:8069
}

# Services partagés (tenant <tenant>)
dvig.<tenant>.doreviateam.com {
  reverse_proxy dvig-<tenant>:8080
}

vault.<tenant>.doreviateam.com {
  reverse_proxy vault-<tenant>:8080
}
```

**Caractéristiques** :
- HTTPS automatique (Let's Encrypt)
- Certificats renouvelés automatiquement
- Email : `admin@doreviateam.com`

---

## 8. Réseau et Isolation

### 8.1 Réseau Docker

**Nom** : `dorevia-network`  
**Type** : External (créé une fois, partagé)  
**Création** : Automatique par `dorevia.sh` si absent

**Containers connectés** :
- `gateway-caddy` (gateway)
- `dvig-<tenant>` (platform)
- `vault-<tenant>` (platform)
- `vault-db-<tenant>` (platform)
- `odoo_<env>_<tenant>` (apps)
- `odoo_db_<env>_<tenant>` (apps)

### 8.2 Isolation par Tenant

**Bases de données** :
- Vault : `dorevia_vault` (par tenant, container `vault-db-<tenant>`)
- Odoo : `odoo_<env>_<tenant>` (par tenant + env)

**Volumes** :
- Vault : `vault_*_<tenant>` (par tenant)
- Odoo : `odoo_<env>_<tenant>_*` (par tenant + env)

**Containers** :
- Platform : `dorevia_<tenant>_platform` (compose project)
- Apps : `dorevia_<univers>_<env>_<tenant>` (compose project)

**Résultat** : Isolation complète entre tenants.

### 8.3 Isolation par Environnement

**Bases de données** :
- `odoo_lab_<tenant>`
- `odoo_stinger_<tenant>`
- `odoo_prod_<tenant>`

**Volumes** :
- `odoo_lab_<tenant>_db`
- `odoo_lab_<tenant>_data`
- `odoo_stinger_<tenant>_db`
- `odoo_stinger_<tenant>_data`
- `odoo_prod_<tenant>_db`
- `odoo_prod_<tenant>_data`

**Containers** :
- `odoo_lab_<tenant>`
- `odoo_stinger_<tenant>`
- `odoo_prod_<tenant>`

**Résultat** : Isolation complète entre environnements d'un même tenant.

### 8.4 Services Partagés

**Services Platform** (DVIG, Vault) :
- **Partagés** entre environnements d'un même tenant
- **Isolés** entre tenants

**Volume OCA** :
- `oca_extra_addons` : Partagé entre tous les tenants et environnements
- Contient symlinks vers modules OCA

---

## 9. Flux de Données

### 9.1 Flux Utilisateur → Odoo

```
1. Utilisateur → https://odoo.lab.core.doreviateam.com
   ↓
2. DNS → IP serveur (85.215.206.213)
   ↓
3. Caddy (Gateway) → Vérifie certificat SSL (Let's Encrypt)
   ↓
4. Caddy → Reverse proxy → odoo_lab_core:8069 (réseau Docker)
   ↓
5. Odoo → Traite requête → Retourne réponse
   ↓
6. Caddy → HTTPS → Utilisateur
```

### 9.2 Flux Odoo → Vault (via DVIG)

```
1. Odoo génère document (facture, etc.)
   ↓
2. Odoo → POST https://dvig.core.doreviateam.com/ingest
   Headers: Authorization: Bearer <token_dvig>
   Body: {
     "event_type": "invoice.posted",
     "source": "odoo.lab.core",
     "data": {...}
   }
   ↓
3. Caddy → Reverse proxy → dvig-core:8080
   ↓
4. DVIG → Valide token (dvig.tokens.yml)
   ↓
5. DVIG → Valide source (format univers.env.tenant)
   ↓
6. DVIG → POST http://vault-core:8080/api/v1/invoices
   Headers: Authorization: Bearer <vault_token>
   ↓
7. Vault → Stocke document (PostgreSQL + fichiers)
   ↓
8. Vault → Retourne confirmation
   ↓
9. DVIG → Retourne confirmation à Odoo
```

### 9.3 Flux Déploiement

```
1. Opérateur → dorevia.sh app up odoo lab core
   ↓
2. dorevia.sh → Validation (univers, env, tenant)
   ↓
3. dorevia.sh → Vérifications prérequis (gateway, platform)
   ↓
4. dorevia.sh → Génération identifiants (logique implicite)
   ↓
5. dorevia.sh → Génération docker-compose.yml depuis template
   ↓
6. dorevia.sh → Génération odoo.conf depuis template
   ↓
7. dorevia.sh → Validation image (refuse :latest en STINGER/PROD)
   ↓
8. dorevia.sh → docker compose up -d
   ↓
9. Docker → Création containers, volumes, réseau
   ↓
10. Odoo → Démarrage, connexion DB, chargement modules
```

---

## 10. Sécurité et Tokens

### 10.1 Tokens DVIG

**Fichier** : `tenants/<tenant>/secrets/dvig.tokens.yml`  
**Permissions** : `0400` (ou `0440` si groupe dédié)  
**Hors Git** : Fichier dans `.gitignore`

**Structure** :
```yaml
version: 1
tokens:
  - id: "tok_lab_core_001"
    token_hash: "sha256:..."
    tenant: "core"
    univers: "odoo"
    status: "active"
    created_at: "2025-01-28T00:00:00Z"
    comment: "LAB - odoo.lab.core (tenant DNS: core)"
```

**Règles** :
- Format source : `<univers>.<env>.<tenant>`
- Tenant token = tenant DNS (exactement)
- Univers token = univers ciblé
- Status : `active` | `revoked`
- Un token actif par source (sauf `--force`)

### 10.2 Génération Tokens

**Commande** : `dorevia.sh token issue <univers> <env> <tenant>`

**Processus** :
1. Validation univers, env, tenant
2. Génération source : `univers.env.tenant`
3. Vérification token actif existant (sauf `--force`)
4. Génération token via CLI Python : `sources/dvig/dvig/cli/token_gen.py`
5. Extraction TOKEN et HASH
6. Génération token_id : `tok_<env>_<tenant>_<nnn>`
7. Ajout au YAML (atomique)
8. Rechargement DVIG (restart container)
9. Affichage token (une seule fois)

**CLI Python** :
```bash
cd sources/dvig
python3 -m dvig.cli.token_gen --tenant <tenant> --univers <univers> --output token
```

**Sortie** :
```
TOKEN=<token_raw>
HASH=sha256:<token_hash>
```

### 10.3 Validation Tokens

**DVIG** :
- Lit `dvig.tokens.yml` (monté en read-only)
- Recharge automatique toutes les 60s (`DVIG_TOKENS_RELOAD_INTERVAL=60`)
- Recharge sur SIGHUP (`DVIG_TOKENS_RELOAD_ON_SIGHUP=1`)
- Validation hash SHA256
- Validation tenant (doit correspondre exactement)
- Validation source (format `univers.env.tenant`)

### 10.4 Rotation Tokens

**Commande** : `dorevia.sh token rotate <univers> <env> <tenant> [--revoke-old]`

**Processus** :
1. Trouve ancien token actif pour source
2. Génère nouveau token
3. Ajoute nouveau token au YAML
4. Révoque ancien token si `--revoke-old`
5. Recharge DVIG

### 10.5 Révocation Tokens

**Commande** : `dorevia.sh token revoke <tenant> <token_id>`

**Processus** :
1. Trouve token par ID
2. Change status : `active` → `revoked`
3. Ajoute `revoked_at` : timestamp
4. Recharge DVIG

---

## 11. Gestion des Modules OCA

### 11.1 Structure OCA

**Répertoire** : `sources/oca/`  
**Contenu** : 412 modules OCA (read-only)  
**Organisation** : Par dépôt (account-financial-reporting, account-invoicing, etc.)

### 11.2 Script `oca_flatten.sh`

**Fichier** : `units/odoo/custom-addons/bin/oca_flatten.sh`

**Fonction** : Crée des symlinks vers modules OCA dans `/mnt/extra-addons`

**Processus** :
1. Parcourt `sources/oca/` (monté en `/mnt/oca`)
2. Pour chaque module trouvé, crée symlink dans `/mnt/extra-addons`
3. Résultat : `/mnt/extra-addons` contient tous les modules OCA accessibles

**Exécution** : Automatique au démarrage Odoo

**Configuration Odoo** :
```ini
addons_path = /usr/lib/python3/dist-packages/odoo/addons,/mnt/extra-addons,/mnt/custom-addons
```

### 11.3 Volume Partagé

**Volume** : `oca_extra_addons`  
**Type** : External (partagé entre tous les tenants)  
**Contenu** : Symlinks vers modules OCA

**Avantages** :
- Modules OCA disponibles dans tous les environnements
- Pas de duplication
- Mise à jour centralisée

---

## 12. Gateway et Routage

### 12.1 Caddy

**Image** : `caddy:2`  
**Container** : `gateway-caddy`  
**Ports** : `80` (HTTP), `443` (HTTPS)

**Fonctionnalités** :
- Reverse proxy HTTPS
- Certificats Let's Encrypt automatiques
- Renouvellement automatique certificats
- Routage par domaine

### 12.2 Configuration Caddyfile

**Fichier** : `units/gateway/Caddyfile`  
**Montage** : `/etc/caddy/Caddyfile:ro` (read-only)

**Format** :
```caddy
{
  email admin@doreviateam.com
}

# Apps
<univers>.<env>.<tenant>.doreviateam.com {
  reverse_proxy <container>:<port>
}

# Services partagés
<service>.<tenant>.doreviateam.com {
  reverse_proxy <container>:<port>
}
```

**Exemple** :
```caddy
odoo.lab.core.doreviateam.com {
  reverse_proxy odoo_lab_core:8069
}

dvig.core.doreviateam.com {
  reverse_proxy dvig-core:8080
}
```

### 12.3 Certificats SSL

**Génération** : Automatique par Caddy (Let's Encrypt)  
**Renouvellement** : Automatique (avant expiration)  
**Stockage** : Volume `caddy_data` (persistant)

**Email** : `admin@doreviateam.com` (pour notifications Let's Encrypt)

### 12.4 Routage

**Principe** : Caddy route vers containers Docker sur réseau `dorevia-network`

**Containers ciblés** :
- Apps : `odoo_<env>_<tenant>:8069`
- Platform : `dvig-<tenant>:8080`, `vault-<tenant>:8080`

**Pas de ports exposés** : Containers accessibles uniquement via Caddy (pas d'exposition directe)

---

## 13. Volumes et Persistance

### 13.1 Volumes Platform

#### Vault
- `vault_db_<tenant>_data` : Base de données PostgreSQL Vault
- `vault_storage_<tenant>` : Stockage fichiers Vault (obligatoire)
- `vault_ledger_<tenant>` : Ledger Vault (recommandé)
- `vault_audit_<tenant>` : Audit Vault (recommandé)

#### DVIG
- `dvig_logs_<tenant>` : Logs DVIG (optionnel)

### 13.2 Volumes Apps

#### Odoo
- `odoo_<env>_<tenant>_db` : Base de données PostgreSQL Odoo
- `odoo_<env>_<tenant>_data` : Filestore Odoo

#### OCA (partagé)
- `oca_extra_addons` : Symlinks modules OCA (partagé entre tous)

### 13.3 Volumes Gateway

- `caddy_data` : Certificats Let's Encrypt
- `caddy_config` : Configuration Caddy

### 13.4 Persistance

**Tous les volumes sont persistants** :
- Survivent aux redémarrages containers
- Survivent aux `docker compose down` (sauf `--volumes`)
- Supprimés uniquement avec `--purge` ou `docker volume rm`

---

## 14. Codes d'Erreur

### 14.1 Définition

```bash
E01=1  # paramètre invalide (env/univers/tenant)
E02=2  # invariant violé (source/token mismatch, latest en STINGER/PROD)
E03=3  # dépendance manquante (docker/compose)
E04=4  # platform down (tentative app up)
E05=5  # ressource occupée (collision noms/volumes)
E06=6  # opération destructive sans flag --purge
```

### 14.2 Utilisation

**E01** : Paramètres invalides
- Tenant invalide (pas slug DNS)
- Environnement invalide (pas lab|stinger|prod)
- Univers invalide (pas odoo en v1.0)

**E02** : Invariants violés
- Image `:latest` en STINGER/PROD
- Token actif existe déjà (sans `--force`)
- Source/token mismatch

**E03** : Dépendances manquantes
- Docker non installé
- Docker Compose non installé
- Template non trouvé
- Fichier tokens non trouvé

**E04** : Prérequis non satisfaits
- Gateway non démarrée
- Platform non démarrée
- Réseau non créé

**E05** : Conflits
- Container existe déjà (autre projet)
- Volume existe déjà

**E06** : Opération destructive
- `app reset` sans `--purge`
- `platform destroy` sans `--purge`
- `app destroy` sans `--purge`

---

## 15. État Actuel de l'Implémentation

### 15.1 Tenants Opérationnels

- ✅ **core** : LAB, STINGER, PROD
- ✅ **dido** : LAB, STINGER, PROD
- ✅ **rozas** : LAB, STINGER, PROD

### 15.2 Infrastructure

- **1 Gateway** : Caddy (routage HTTPS global)
- **9 Services Platform** : 3 tenants × 3 services (DVIG, Vault, Vault DB)
- **18 Containers Odoo** : 3 tenants × 3 env × 2 containers (Odoo + DB)
- **9 Bases de données Odoo** : 3 tenants × 3 env
- **3 Bases de données Vault** : 1 par tenant

### 15.3 Modules

- **412 modules OCA** : Disponibles dans tous les environnements
- **Custom-addons** : Accessibles dans tous les environnements
- **Script `oca_flatten.sh`** : Exécuté automatiquement au démarrage

### 15.4 SSL/TLS

- ✅ **Certificats Let's Encrypt** : Génération automatique
- ✅ **Renouvellement automatique** : Géré par Caddy
- ✅ **HTTPS** : Actif sur tous les domaines

### 15.5 Persistance Vault

- ✅ **Volumes persistants** : `vault_storage_<tenant>`, `vault_ledger_<tenant>`, `vault_audit_<tenant>`
- ✅ **Migration appliquée** : Données migrées depuis conteneurs vers volumes

---

## 16. Limitations et Points d'Attention

### 16.1 Configuration Déclarative Partielle

- `manifest.json` minimal (métadonnées basiques seulement)
- Logique implicite dans `dorevia.sh` (génération de noms)
- Caddyfile édité manuellement (pas de génération automatique)

### 16.2 Pas de Séparation Intention/Exécution

- CLI exécute directement les déploiements
- Pas de phase "intention" séparée
- Pas de génération de configuration déclarative complète

### 16.3 Services Partagés sans Environnement

- Format : `dvig.<tenant>.doreviateam.com` (pas d'env)
- Services partagés entre environnements d'un même tenant
- Pas d'isolation par environnement pour services partagés

### 16.4 Pas de Support Domaines Clients

- Tous les domaines : `*.doreviateam.com`
- Pas de support domaines clients (ex: `*.client.com`)
- Pas de gestion alias

### 16.5 Auditabilité Partielle

- Pas de journal des intentions
- Pas de journal des exécutions
- Pas de relecture historique

---

## 17. Conclusion

Cette spécification décrit l'**implémentation actuelle** de la plateforme Dorevia (v1.0). Elle constitue la **référence technique** pour comprendre le fonctionnement détaillé de la plateforme.

**Points clés** :
- Architecture multi-tenant avec isolation complète
- Génération de configuration depuis templates
- CLI d'orchestration (`dorevia.sh`) avec exécution directe
- Gateway centralisée (Caddy) pour routage HTTPS
- Services partagés (DVIG, Vault) par tenant
- Applications (Odoo) par tenant + environnement
- Tokens DVIG pour authentification
- Modules OCA partagés via symlinks

**Évolutions futures** :
- Enrichissement `manifest.json` (configuration déclarative complète)
- Séparation intention/exécution (CLI interactive + script d'exécution)
- Support domaines clients et alias
- Auditabilité complète (journaux intentions/exécutions)

---

**Document généré le** : 2025-01-29  
**Version plateforme** : 1.0  
**Dernière mise à jour** : 2025-01-29


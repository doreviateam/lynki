# 📘 Résumé du Fonctionnement de la Plateforme Dorevia

**Version** : 1.0  
**Date** : 2025-12-28  
**Plateforme** : Dorevia Platform — Architecture multi-tenant centralisée

---

## 🎯 Vue d'ensemble

La plateforme Dorevia est une **infrastructure multi-tenant** qui permet de déployer et gérer des applications (notamment Odoo) de manière isolée par tenant, avec des services partagés et une gateway centralisée.

### Architecture générale

```
┌─────────────────────────────────────────────────────────────┐
│                    GATEWAY (Caddy)                           │
│              HTTPS automatique (Let's Encrypt)               │
│         Routage par domaine → Services Docker                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │     RÉSEAU DOCKER (dorevia-network)    │
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
│              │   │              │   │              │
│ Apps Odoo:   │   │ Apps Odoo:   │   │ Apps Odoo:   │
│ - LAB        │   │ - LAB        │   │ - LAB        │
│ - STINGER    │   │ - STINGER    │   │ - STINGER    │
│ - PROD       │   │ - PROD       │   │ - PROD       │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## 🏗️ Composants principaux

### 1. Gateway (Caddy)

**Rôle** : Reverse proxy HTTPS centralisé

**Fonctionnalités** :
- ✅ **HTTPS automatique** : Génération et renouvellement automatique des certificats Let's Encrypt
- ✅ **Routage par domaine** : Chaque service est accessible via son FQDN
- ✅ **Reverse proxy** : Redirection vers les containers Docker sur le réseau interne

**Configuration** :
- Fichier : `units/gateway/Caddyfile`
- Email : `admin@doreviateam.com` (pour Let's Encrypt)
- Ports : `80` (HTTP) et `443` (HTTPS)

**Convention de nommage** :
- Apps : `<application>.<environnement>.<tenant>.doreviateam.com`
  - Exemple : `odoo.lab.core.doreviateam.com`
- Services partagés : `<service>.<tenant>.doreviateam.com`
  - Exemple : `dvig.core.doreviateam.com`

**Exemple de configuration** :
```caddyfile
odoo.lab.core.doreviateam.com {
  reverse_proxy odoo_lab_core:8069
}

dvig.core.doreviateam.com {
  reverse_proxy dvig-core:8080
}
```

---

### 2. Services Platform (par tenant)

Chaque tenant dispose de **services partagés** isolés :

#### 2.1 DVIG (Dorevia Integration Gateway)

**Rôle** : Point d'entrée unifié pour l'intégration des applications

**Fonctionnalités** :
- ✅ **Authentification par tokens** : Validation des tokens DVIG
- ✅ **Routage vers Vault** : Redirection des requêtes vers Vault
- ✅ **Gestion des tokens** : Stockage dans `tenants/<tenant>/secrets/dvig.tokens.yml`

**Configuration** :
- Container : `dvig-<tenant>`
- Port interne : `8080`
- URL externe : `https://dvig.<tenant>.doreviateam.com`

**Tokens DVIG** :
- Format source : `<univers>.<env>.<tenant>` (ex: `odoo.lab.core`)
- Génération : `dorevia.sh token issue <univers> <env> <tenant>`
- Stockage : `tenants/<tenant>/secrets/dvig.tokens.yml`

#### 2.2 Vault (Coffre documentaire)

**Rôle** : Stockage sécurisé des documents (factures, pièces jointes, etc.)

**Fonctionnalités** :
- ✅ **Stockage de documents** : Factur-X, PDF, etc.
- ✅ **Base de données PostgreSQL** : Métadonnées des documents
- ✅ **API REST** : Interface pour les applications

**Configuration** :
- Container : `vault-<tenant>`
- Base de données : `vault-db-<tenant>` (PostgreSQL)
- Port interne : `8080`
- URL externe : `https://vault.<tenant>.doreviateam.com`

---

### 3. Applications (par tenant et environnement)

#### 3.1 Odoo

**Environnements** : LAB, STINGER, PROD (un par tenant)

**Configuration** :
- Container : `odoo_<env>_<tenant>`
- Base de données : `odoo_db_<env>_<tenant>` (PostgreSQL)
- Port interne : `8069`
- URL externe : `https://odoo.<env>.<tenant>.doreviateam.com`

**Modules** :
- **Modules Odoo standard** : `/usr/lib/python3/dist-packages/odoo/addons` (668 modules)
- **Modules OCA** : `/mnt/extra-addons` (412 modules via symlinks)
- **Custom-addons** : `/mnt/custom-addons` (modules métier)

**Script automatique** :
- `oca_flatten.sh` : Crée des symlinks pour les modules OCA au démarrage
- Exécution : Automatique dans la commande Docker

**Configuration Odoo** (`odoo.conf`) :
```ini
[options]
db_host = odoo_db_<env>_<tenant>  # Nom de container spécifique
dbfilter = ^odoo_<env>_<tenant}$  # Filtre de base de données
admin_passwd = doreviateam@2026   # Master password
addons_path = /usr/lib/python3/dist-packages/odoo/addons,/mnt/extra-addons,/mnt/custom-addons
```

---

## 🔄 Flux de données

### Flux 1 : Accès utilisateur → Odoo

```
1. Utilisateur → https://odoo.lab.core.doreviateam.com
   ↓
2. DNS → IP du serveur (85.215.206.213)
   ↓
3. Caddy (Gateway) → Vérifie certificat SSL (Let's Encrypt)
   ↓
4. Caddy → Reverse proxy → odoo_lab_core:8069 (réseau Docker)
   ↓
5. Odoo → Traite la requête → Retourne la réponse
   ↓
6. Caddy → HTTPS → Utilisateur
```

### Flux 2 : Intégration Odoo → Vault (via DVIG)

```
1. Odoo génère un document (facture, etc.)
   ↓
2. Odoo → POST https://dvig.core.doreviateam.com/ingest
   Headers: Authorization: Bearer <token_dvig>
   Body: {
     "event_type": "invoice.posted",
     "source": "odoo.lab.core",
     "data": {...}
   }
   ↓
3. DVIG → Valide le token (dvig.tokens.yml)
   ↓
4. DVIG → Valide la source (univers.env.tenant)
   ↓
5. DVIG → POST http://vault-core:8080/api/v1/invoices
   Headers: Authorization: Bearer <vault_token>
   ↓
6. Vault → Stocke le document (PostgreSQL + fichiers)
   ↓
7. Vault → Retourne confirmation
   ↓
8. DVIG → Retourne confirmation à Odoo
```

---

## 📁 Structure des répertoires

```
dorevia-platform/
├── bin/
│   └── dorevia.sh              # Orchestrateur CLI
├── units/
│   ├── gateway/
│   │   ├── Caddyfile           # Configuration routage HTTPS
│   │   └── docker-compose.yml   # Container Caddy
│   └── odoo/
│       └── custom-addons/       # Modules métier Odoo
│           └── bin/
│               └── oca_flatten.sh  # Script symlinks OCA
├── sources/
│   └── oca/                     # Modules OCA (read-only)
├── tenants/
│   ├── core/
│   │   ├── platform/
│   │   │   └── docker-compose.yml  # DVIG + Vault
│   │   ├── apps/
│   │   │   └── odoo/
│   │   │       ├── lab/
│   │   │       │   ├── docker-compose.yml
│   │   │       │   └── odoo.conf
│   │   │       ├── stinger/
│   │   │       └── prod/
│   │   ├── secrets/
│   │   │   └── dvig.tokens.yml  # Tokens DVIG (hors Git)
│   │   └── state/
│   ├── dido/                    # Même structure
│   └── rozas/                   # Même structure
└── ZeDocs/                      # Documentation
```

---

## 🔐 Sécurité et isolation

### Isolation par tenant

1. **Bases de données** : Chaque tenant a ses propres bases PostgreSQL
   - Odoo : `odoo_<env>_<tenant>`
   - Vault : `dorevia_vault` (par tenant)

2. **Volumes Docker** : Volumes isolés par tenant et environnement
   - Odoo data : `odoo_<env>_<tenant>_data`
   - Odoo DB : `odoo_<env>_<tenant>_db`
   - Vault DB : `vault_db_<tenant>_data`

3. **Containers** : Noms uniques par tenant
   - `odoo_lab_core`, `odoo_lab_dido`, `odoo_lab_rozas`

4. **Tokens DVIG** : Scopés par tenant
   - Format : `<univers>.<env>.<tenant>`
   - Validation : Tenant doit correspondre exactement

### Authentification

- **DVIG** : Tokens JWT stockés dans `dvig.tokens.yml`
- **Odoo** : Master password pour gestion des bases (`admin_passwd`)
- **HTTPS** : Certificats Let's Encrypt automatiques

---

## 🚀 Commandes principales (`dorevia.sh`)

### Gateway
```bash
dorevia.sh gateway status    # Statut Caddy
dorevia.sh gateway reload    # Recharger Caddyfile
```

### Platform (par tenant)
```bash
dorevia.sh platform up <tenant>      # Démarrer DVIG + Vault
dorevia.sh platform down <tenant>    # Arrêter
dorevia.sh platform status <tenant>  # Statut
```

### Apps (par tenant et environnement)
```bash
dorevia.sh app up odoo lab <tenant>      # Démarrer Odoo LAB
dorevia.sh app down odoo lab <tenant>   # Arrêter
dorevia.sh app status odoo lab <tenant> # Statut
```

### Tokens DVIG
```bash
dorevia.sh token issue odoo lab <tenant>  # Générer token
dorevia.sh token list <tenant>            # Lister tokens
dorevia.sh token revoke <tenant> <id>     # Révoquer token
```

---

## 📊 État actuel de la plateforme

### Tenants opérationnels
- ✅ **core** : LAB, STINGER, PROD
- ✅ **dido** : LAB, STINGER, PROD
- ✅ **rozas** : LAB, STINGER, PROD

### Infrastructure
- **18 containers Odoo** (6 par tenant × 3 tenants)
- **9 bases de données PostgreSQL** (3 par tenant)
- **6 services Platform** (DVIG + Vault par tenant)
- **1 Gateway Caddy** (routage HTTPS global)

### Modules
- **412 modules OCA** disponibles dans tous les environnements
- **Custom-addons** accessibles
- Script `oca_flatten.sh` exécuté automatiquement

### SSL/TLS
- ✅ **Certificats Let's Encrypt** : Génération automatique
- ✅ **Renouvellement automatique** : Géré par Caddy
- ✅ **HTTPS** : Actif sur tous les domaines

---

## 🔧 Maintenance et opérations

### Ajouter un nouveau tenant

1. **DNS** : Créer les enregistrements DNS chez le registrar
2. **Caddyfile** : Ajouter les routes dans `units/gateway/Caddyfile`
3. **Structure** : Créer `tenants/<tenant>/...`
4. **Tokens** : Générer les tokens DVIG (`dorevia.sh token issue`)
5. **Platform** : Démarrer (`dorevia.sh platform up <tenant>`)
6. **Apps** : Démarrer les apps (`dorevia.sh app up odoo <env> <tenant>`)

### Vérifications courantes

```bash
# Statut des containers
docker ps --filter "name=odoo_\|dvig-\|vault-"

# Logs Caddy (certificats SSL)
docker logs gateway-caddy | grep -E "(certificate|renewal|acme)"

# Logs Odoo
docker logs odoo_lab_core --tail 50

# Modules OCA
docker exec odoo_lab_core ls /mnt/extra-addons | wc -l
```

### Problèmes courants

1. **DNS non propagé** : Vérifier avec `dig +short <domain>`
2. **Certificat SSL non généré** : Vérifier les logs Caddy
3. **Modules OCA non chargés** : Vérifier l'exécution de `oca_flatten.sh`
4. **Base de données vide** : Supprimer la base et laisser Odoo la créer

---

## 📝 Notes importantes

### Conventions
- **Environnements** : `lab`, `stinger`, `prod`
- **Univers** : `odoo` (v1.x)
- **Source** : `<univers>.<env>.<tenant>` (ex: `odoo.lab.core`)
- **DB name** : `odoo_<env>_<tenant>`

### Volumes partagés
- **`oca_extra_addons`** : Volume partagé entre tous les tenants (symlinks OCA)
- Configuration : `external: true` dans docker-compose.yml

### Persistance
- **Certificats SSL** : Stockés dans `caddy_data` (volume Docker)
- **Bases de données** : Volumes Docker persistants
- **Filestore Odoo** : Volumes Docker persistants

---

## ✅ Points forts de l'architecture

1. **Isolation complète** : Chaque tenant est isolé (DB, volumes, containers)
2. **Scalabilité** : Facile d'ajouter de nouveaux tenants
3. **Sécurité** : HTTPS automatique, tokens DVIG, isolation réseau
4. **Maintenance** : CLI unifié (`dorevia.sh`)
5. **Automatisation** : SSL, modules OCA, healthchecks
6. **Standardisation** : Conventions claires et respectées

---

**Document généré le** : 2025-12-28  
**Version plateforme** : 1.0  
**Dernière mise à jour** : 2025-12-28


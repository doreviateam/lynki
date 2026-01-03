# 📘 Description Détaillée - Dorevia Platform

**Date** : 2025-01-28  
**Version** : Analyse complète basée sur `sources/` et `units/`  
**Auteur** : Expert Dorevia Platform

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Globale](#architecture-globale)
3. [Composants Sources (`sources/`)](#composants-sources-sources)
4. [Composants Units (`units/`)](#composants-units-units)
5. [Flux de Données](#flux-de-données)
6. [Stack Technologique](#stack-technologique)
7. [Environnements](#environnements)
8. [Sécurité & Conformité](#sécurité--conformité)
9. [Déploiement](#déploiement)

---

## 1. Vue d'Ensemble

### 1.1 Mission

**Dorevia Platform** est une plateforme souveraine de gestion documentaire et d'intégrité cryptographique pour ERP (principalement Odoo). Elle garantit la traçabilité et la vérifiabilité des documents électroniques selon la **règle des 3V** :

- **✅ Validé** → Document validé dans Odoo
- **🔒 Vaulté** → Stocké de manière sécurisée dans Dorevia Vault
- **🔍 Vérifiable** → Preuve d'intégrité via JWS + Ledger

### 1.2 Objectifs Métier

- **Conformité réglementaire** : Préparation PDP/PPF 2026 & NF525
- **Traçabilité immuable** : Ledger hash-chaîné pour auditabilité
- **Intégrité cryptographique** : Signatures JWS (RS256) conformes RFC 7515
- **Multi-tenant** : Isolation stricte des données par tenant
- **Interopérabilité** : Support Factur-X EN 16931

### 1.3 Structure du Projet

```
/opt/dorevia-plateform/
├── sources/          # Code source des composants métier
│   ├── vault/       # Moteur cryptographique (Go)
│   ├── dvig/        # Passerelle d'intégration (Python/FastAPI)
│   └── oca/         # Modules Odoo Community Association
└── units/           # Unités de déploiement (Docker Compose)
    ├── odoo/        # Configuration Odoo
    └── gateway/      # Reverse proxy Caddy
```

---

## 2. Architecture Globale

### 2.1 Schéma d'Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOREVIA PLATFORM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │     Odoo     │────────▶│     DVIG     │                     │
│  │   (ERP)      │  HTTP   │  (Gateway)   │                     │
│  │  18.0 CE     │         │  FastAPI     │                     │
│  │              │         │  Python 3.11 │                     │
│  └──────────────┘         └──────┬───────┘                     │
│                                   │                              │
│                                   │ HTTP/REST                    │
│                                   │ Bearer Token                 │
│                                   │                              │
│                          ┌────────▼─────────┐                   │
│                          │   Dorevia Vault  │                   │
│                          │   (Go Service)   │                   │
│                          │   Fiber v2.52.9  │                   │
│                          └────────┬──────────┘                   │
│                                   │                              │
│                    ┌──────────────┼──────────────┐              │
│                    │              │              │              │
│            ┌───────▼────┐  ┌─────▼─────┐  ┌────▼─────┐         │
│            │ PostgreSQL │  │  Storage   │  │  Ledger  │         │
│            │  (Metadata)│  │  (Files)   │  │(Hashchain)│        │
│            │            │  │ Filesystem │  │PostgreSQL │         │
│            └────────────┘  └────────────┘  └──────────┘         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Caddy (Reverse Proxy)                       │  │
│  │  - HTTPS automatique (Let's Encrypt)                     │  │
│  │  - Routing: odoo.lab.core.doreviateam.com                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flux de Données Principal

1. **Ingestion** : Odoo → DVIG → Vault
2. **Stockage** : Vault → PostgreSQL (métadonnées) + Filesystem (fichiers)
3. **Intégrité** : Vault → JWS (signature) + Ledger (hash-chaîné)
4. **Vérification** : Client → Vault → Preuve d'intégrité

---

## 3. Composants Sources (`sources/`)

### 3.1 Dorevia Vault (`sources/vault/`)

**Langage** : Go 1.23+  
**Framework** : Fiber v2.52.9  
**Version** : v1.6.2+  
**Rôle** : Moteur cryptographique et stockage sécurisé

#### Structure

```
sources/vault/
├── cmd/                    # Points d'entrée
│   ├── vault/main.go      # Service principal
│   ├── keygen/main.go     # Générateur clés RSA + JWKS
│   ├── reconcile/main.go  # Script réconciliation
│   ├── audit/main.go      # CLI génération rapports
│   └── token-gen/main.go  # Générateur tokens JWT
├── internal/               # Code métier
│   ├── handlers/          # Handlers HTTP (30+ endpoints)
│   ├── crypto/            # Module JWS (RS256)
│   ├── ledger/            # Ledger hash-chaîné
│   ├── storage/           # PostgreSQL + Repository
│   ├── services/          # Services métier (POS, Payments, Z-Reports)
│   ├── auth/              # Authentification JWT/API Keys + RBAC
│   ├── middleware/        # CORS, Rate Limiting, Logger
│   ├── metrics/           # Prometheus (17 métriques)
│   ├── audit/             # Journalisation auditable
│   └── verify/            # Vérification intégrité
├── migrations/            # Migrations SQL (9 migrations)
├── tests/                  # Tests (165+ unitaires, intégration)
└── docs/                  # Documentation complète
```

#### Fonctionnalités Principales

**Ingestion Documents** :
- Factures Odoo (`/api/v1/invoices`)
- Tickets POS (`/api/v1/pos-tickets`)
- Paiements (`/api/v1/payments`)
- Z-Reports (`/api/v1/pos/zreports`)

**Intégrité Cryptographique** :
- Scellement JWS (RS256) conforme RFC 7515
- Ledger hash-chaîné (PostgreSQL + Filesystem)
- Double chaînage pour Z-Reports (vertical + horizontal)
- JWKS public (`/jwks.json`)

**Vérification & Preuves** :
- Endpoints Proof (`/api/v1/proof/*`)
- Bulk Fetch (`/api/v1/proof/bulk`)
- Vérification intégrité (`/api/v1/ledger/verify/:id`)
- Export Ledger (`/api/v1/ledger/export`)

**Observabilité** :
- Métriques Prometheus (17 métriques)
- Logs structurés JSONL signés
- Rapports d'audit (JSON/CSV/PDF)
- Health checks avancés (`/health/detailed`)

**Sécurité** :
- Authentification JWT/API Keys
- RBAC (4 rôles : admin, operator, auditor, viewer)
- Rate Limiting
- CORS restrictif
- Validation Factur-X EN 16931

#### Endpoints Principaux

| Catégorie | Endpoints | Authentification |
|-----------|-----------|------------------|
| **Base** | `/health`, `/version`, `/metrics` | Aucune |
| **DB** | `/documents`, `/upload`, `/download/:id` | Variable |
| **API v1** | `/api/v1/invoices`, `/api/v1/pos-tickets`, `/api/v1/payments` | `documents:write` |
| **Proof** | `/api/v1/proof/account_move/:id`, `/api/v1/proof/bulk` | `documents:read` |
| **Ledger** | `/api/v1/ledger/export`, `/api/v1/ledger/verify/:id` | Variable |
| **Audit** | `/audit/export`, `/audit/dates` | `audit:read` |

#### Statistiques

- **Fichiers Go** : 66+ fichiers
- **Tests** : 165+ tests unitaires, tests d'intégration
- **Endpoints** : 30+ endpoints
- **Métriques** : 17 métriques Prometheus
- **Migrations** : 9 migrations SQL

---

### 3.2 DVIG - Dorevia Vault Integration Gateway (`sources/dvig/`)

**Langage** : Python 3.11+  
**Framework** : FastAPI 0.104+  
**Version** : 0.1.2  
**Rôle** : Passerelle universelle ERP ↔ Vault

#### Structure

```
sources/dvig/
├── dvig/                  # Package principal
│   ├── api_fastapi/      # Implémentation FastAPI (P0+P1)
│   │   ├── app.py        # Application FastAPI
│   │   ├── routes/       # Routes (health, ingest)
│   │   └── auth/         # Authentification Bearer Token
│   │       ├── auth.py   # Dependencies FastAPI
│   │       ├── token_store.py  # TokenStore (YAML)
│   │       ├── manager.py      # TokenStoreManager (reload)
│   │       └── validation.py  # Validation source/univers
│   ├── cli/              # CLI outils
│   │   └── token_gen.py  # Génération tokens DVIG
│   ├── core/             # Configuration
│   ├── storage/          # (Legacy - PostgreSQL)
│   └── tenant/           # Gestion multi-tenant
├── tests/                # Tests automatisés
│   ├── unit/             # Tests unitaires
│   └── integration/      # Tests d'intégration
├── docker/               # Docker
│   ├── Dockerfile        # Image Docker
│   └── docker-compose*.yml
├── conf/                 # Configuration
│   └── tokens.yml        # Tokens (YAML)
└── migrations/           # Migrations SQL (legacy)
```

#### Fonctionnalités Principales

**P0 - Migration FastAPI** :
- ✅ Endpoint `/health` (health check)
- ✅ Endpoint `/ingest` (ingestion événements)
- ✅ OpenAPI automatique (`/docs`, `/openapi.json`)
- ✅ Validation Pydantic
- ✅ Normalisation timestamps

**P1 - Authentification Bearer Token** :
- ✅ Authentification Bearer Token (SHA-256)
- ✅ Token Store YAML (abstraction `TokenStore`)
- ✅ Reload automatique (SIGHUP + intervalle)
- ✅ Validation source/univers
- ✅ CLI token generation (`dvig.cli.token_gen`)
- ✅ Logs structurés (structlog)

#### Endpoints

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/health` | `GET` | Health check | Optionnel |
| `/ingest` | `POST` | Ingestion événements | Bearer Token |
| `/docs` | `GET` | Swagger UI | Configurable |
| `/openapi.json` | `GET` | Schéma OpenAPI | Configurable |

#### Configuration

**Variables d'environnement** :
- `DVIG_AUTH_ENABLED=1` : Activer authentification
- `DVIG_TOKENS_FILE=/etc/dvig/tokens.yml` : Fichier tokens
- `DVIG_TOKENS_RELOAD_INTERVAL=60` : Intervalle reload (secondes)
- `DVIG_TOKENS_RELOAD_ON_SIGHUP=1` : Reload sur SIGHUP
- `DVIG_DOCS_ENABLED=0` : Désactiver docs (production)
- `DVIG_OPENAPI_ENABLED=0` : Désactiver OpenAPI (production)
- `DVIG_LOG_FORMAT=json` : Format logs (json/console)
- `DVIG_HEALTH_PROTECTED=0` : Protéger `/health`

#### Statistiques

- **Version** : 0.1.2 (P0 + P1 complétés)
- **Tests** : 35+ tests (unitaires + intégration)
- **Couverture** : 88%+
- **Endpoints** : 4 endpoints principaux

---

### 3.3 OCA - Odoo Community Association (`sources/oca/`)

**Rôle** : Modules Odoo open-source  
**Source** : Odoo Community Association  
**Usage** : Modules complémentaires pour Odoo

#### Modules Principaux

**Account Financial** :
- `account-financial-reporting/` : Rapports financiers
- `account-financial-tools/` : Outils financiers
- `account-invoicing/` : Facturation
- `account-payment/` : Paiements
- `account-reconcile/` : Réconciliation

**Autres** :
- `bank-statement-import/` : Import relevés bancaires
- `edi/` : Échange de données informatisé
- `l10n-france/` : Localisation France
- `queue/` : Queue jobs asynchrones
- `reporting-engine/` : Moteur de reporting
- `server-tools/` : Outils serveur
- `server-ux/` : Améliorations UX

#### Intégration

Les modules OCA sont montés en read-only dans Odoo via Docker volumes :
```yaml
volumes:
  - /opt/dorevia-plateform/sources/oca:/mnt/oca:ro
  - oca_extra_addons:/mnt/extra-addons
```

---

## 4. Composants Units (`units/`)

### 4.1 Odoo (`units/odoo/`)

**Rôle** : Configuration et déploiement Odoo  
**Image** : `odoo:18.0`  
**Base de données** : PostgreSQL 16

#### Structure

```
units/odoo/
├── conf/                  # Configuration Odoo
│   ├── odoo.lab.conf     # Config LAB
│   └── odoo.prod.conf    # Config PROD
├── custom-addons/         # Addons métier personnalisés
│   └── bin/
│       └── oca_flatten.sh  # Script symlinks OCA
├── docker-compose.lab.yml # Docker Compose LAB
├── docker-compose.prod.yml # Docker Compose PROD
└── docker-compose.yml     # Docker Compose par défaut
```

#### Configuration Odoo LAB

```ini
[options]
db_host = db
db_port = 5432
db_user = odoo
db_password = odoo
dbfilter = ^core_lab$

addons_path = /usr/lib/python3/dist-packages/odoo/addons,/mnt/extra-addons,/mnt/custom-addons
data_dir = /var/lib/odoo
```

#### Volumes Docker

- `db_lab_data` : Base PostgreSQL LAB
- `odoo_lab_data` : Filestore Odoo LAB
- `oca_extra_addons` : Addons OCA (symlinks)

#### Ports

- **LAB** : `18069:8069`
- **PROD** : `38069:8069` (configuré, non déployé)

---

### 4.2 Gateway (`units/gateway/`)

**Rôle** : Reverse proxy HTTPS  
**Technologie** : Caddy 2  
**Fonctionnalité** : HTTPS automatique (Let's Encrypt)

#### Configuration Caddyfile

```caddy
{
  email admin@doreviateam.com
}

# Odoo
odoo.lab.core.doreviateam.com {
  reverse_proxy host.docker.internal:18069
}

odoo.prod.core.doreviateam.com {
  reverse_proxy host.docker.internal:38069
}
```

#### Fonctionnalités

- ✅ HTTPS automatique (Let's Encrypt)
- ✅ Reverse proxy vers Odoo
- ✅ Routing par domaine (lab/prod)
- ✅ Configuration simple (Caddyfile)

---

## 5. Flux de Données

### 5.1 Ingestion Document (Facture Odoo)

```
1. Odoo génère facture validée
   ↓
2. Odoo → DVIG (POST /ingest)
   Headers: Authorization: Bearer <token>
   Body: {
     "event_type": "invoice.posted",
     "source": "odoo.lab.core",
     "data": {...}
   }
   ↓
3. DVIG valide token (YAML TokenStore)
   ↓
4. DVIG valide source/univers
   ↓
5. DVIG → Vault (POST /api/v1/invoices)
   Headers: Authorization: Bearer <vault-token>
   Body: {
     "source": "odoo.lab.core",
     "model": "account.move",
     "odoo_id": 123,
     "file": "base64...",
     "filename": "invoice_001.pdf"
   }
   ↓
6. Vault stocke document
   - PostgreSQL (métadonnées)
   - Filesystem (fichier)
   ↓
7. Vault scelle document
   - JWS (RS256)
   - Ledger (hash-chaîné)
   ↓
8. Vault retourne preuve
   {
     "id": "uuid",
     "sha256_hex": "...",
     "evidence_jws": "...",
     "ledger_hash": "..."
   }
   ↓
9. DVIG retourne réponse à Odoo
```

### 5.2 Vérification Intégrité

```
1. Client → Vault (GET /api/v1/proof/account_move/123)
   ↓
2. Vault récupère document
   - PostgreSQL (métadonnées)
   - Filesystem (fichier)
   ↓
3. Vault vérifie intégrité
   - Hash fichier vs DB
   - Hash DB vs Ledger
   - Signature JWS
   ↓
4. Vault retourne preuve
   {
     "id": "uuid",
     "hash": "sha256",
     "prev_hash": "previous_hash",
     "ledger": "ledger_id",
     "timestamp": "2025-01-15T10:30:00Z",
     "jws": "...",
     "status": "verified"
   }
```

---

## 6. Stack Technologique

### 6.1 Backend

| Composant | Technologie | Version |
|-----------|-------------|---------|
| **Vault** | Go | 1.23+ |
| **DVIG** | Python | 3.11+ |
| **Framework Vault** | Fiber | v2.52.9 |
| **Framework DVIG** | FastAPI | 0.104+ |
| **Base de données** | PostgreSQL | 16 |
| **ERP** | Odoo | 18.0 CE |

### 6.2 Infrastructure

| Composant | Technologie | Version |
|-----------|-------------|---------|
| **Reverse Proxy** | Caddy | 2 |
| **Containerisation** | Docker | - |
| **Orchestration** | Docker Compose | - |
| **Logging** | Zerolog (Go), Structlog (Python) | - |
| **Métriques** | Prometheus | - |

### 6.3 Sécurité

| Composant | Technologie | Standard |
|-----------|-------------|----------|
| **Signature** | JWS | RS256 (RFC 7515) |
| **Hash** | SHA-256 | - |
| **Auth** | JWT / API Keys | - |
| **RBAC** | 4 rôles | admin, operator, auditor, viewer |
| **HTTPS** | Let's Encrypt | Automatique (Caddy) |

---

## 7. Environnements

### 7.1 LAB (Développement)

**Statut** : ✅ Opérationnel

**Services** :
- DVIG LAB : Port `18120` (healthy)
- Odoo LAB : Port `18069` (base `core_lab`, 74-75 modules)
- PostgreSQL LAB : Base `core_lab`

**Configuration** :
- `docker-compose.lab.yml`
- `odoo.lab.conf`
- `tokens.yml` (DVIG)

**Accès** :
- DVIG : `http://localhost:18120`
- Odoo : `http://localhost:18069`
- Odoo (Caddy) : `https://odoo.lab.core.doreviateam.com`

### 7.2 PROD (Production)

**Statut** : ⚠️ Configuration présente, non déployée

**Configuration** :
- `docker-compose.prod.yml`
- `odoo.prod.conf`
- `tokens.prod.yml` (DVIG)

**Ports** :
- Odoo PROD : `38069:8069` (configuré)

**Accès** :
- Odoo (Caddy) : `https://odoo.prod.core.doreviateam.com` (configuré)

### 7.3 STINGER (Pré-production)

**Statut** : ❌ Supprimé (problèmes d'architecture identifiés)

**Raison suppression** :
- Conflit noms containers
- Partage base de données avec LAB
- Pas d'isolation complète

---

## 8. Sécurité & Conformité

### 8.1 Sécurité

**Authentification** :
- ✅ Bearer Token (DVIG) : SHA-256 hash
- ✅ JWT / API Keys (Vault) : RS256
- ✅ RBAC : 4 rôles avec permissions granulaires

**Intégrité** :
- ✅ JWS (RS256) conforme RFC 7515
- ✅ Ledger hash-chaîné immuable
- ✅ Double chaînage (Z-Reports)

**Protection** :
- ✅ Rate Limiting (configurable)
- ✅ CORS restrictif (production)
- ✅ Path Traversal Protection
- ✅ Input Validation centralisée
- ✅ Log Sanitization

### 8.2 Conformité

**Réglementaire** :
- ✅ Préparation PDP/PPF 2026
- ✅ NF525 (compatibilité TSE)
- ✅ Factur-X EN 16931 (validation)

**Auditabilité** :
- ✅ Logs structurés JSONL signés
- ✅ Rapports d'audit (JSON/CSV/PDF)
- ✅ Export Ledger paginé
- ✅ Métriques Prometheus

---

## 9. Déploiement

### 9.1 Docker Compose

**LAB** :
```bash
cd /opt/dorevia-plateform/units/odoo
docker compose -f docker-compose.lab.yml up -d
```

**PROD** :
```bash
cd /opt/dorevia-plateform/units/odoo
docker compose -f docker-compose.prod.yml up -d
```

### 9.2 Images Docker

**Vault** :
```bash
docker build -f sources/vault/Dockerfile -t dorevia/vault:latest sources/vault/
```

**DVIG** :
```bash
docker build -f sources/dvig/docker/Dockerfile -t dorevia/dvig:0.1.2 sources/dvig/
```

### 9.3 Configuration

**Tokens DVIG** :
- Format : YAML
- Localisation : `/etc/dvig/tokens.yml` (production)
- Génération : `python -m dvig.cli.token_gen --tenant <tenant> --univers <univers>`

**Configuration Odoo** :
- Fichiers : `units/odoo/conf/odoo.*.conf`
- Base de données : `dbfilter = ^core_lab$` (LAB)

---

## 10. Statistiques Globales

### 10.1 Code

| Composant | Langage | Fichiers | Tests | Version |
|-----------|---------|----------|-------|---------|
| **Vault** | Go | 66+ | 165+ | v1.6.2+ |
| **DVIG** | Python | 30+ | 35+ | 0.1.2 |
| **OCA** | Python | 100+ | - | - |

### 10.2 Endpoints

| Composant | Endpoints | Authentification |
|-----------|-----------|------------------|
| **Vault** | 30+ | JWT/API Keys + RBAC |
| **DVIG** | 4 | Bearer Token |

### 10.3 Métriques

| Composant | Métriques Prometheus |
|-----------|---------------------|
| **Vault** | 17 métriques |
| **DVIG** | (à venir) |

---

## 11. Documentation

### 11.1 Sources

- `sources/vault/README.md` : Documentation complète Vault
- `sources/vault/docs/` : Documentation détaillée (30+ documents)
- `sources/dvig/README.md` : Documentation DVIG
- `sources/dvig/README_FASTAPI_P0.md` : Documentation P0
- `sources/dvig/README_FASTAPI_P1.md` : Documentation P1

### 11.2 ZeDocs

- `ZeDocs/ETAT_LAB.md` : État LAB
- `ZeDocs/SUPPRESSION_STINGER.md` : Suppression STINGER
- `ZeDocs/RESUME_SESSION_2025-01-28.md` : Résumé session

---

## 12. Conclusion

**Dorevia Platform** est une plateforme complète et mature pour la gestion documentaire avec intégrité cryptographique. Elle combine :

- ✅ **Vault** : Moteur cryptographique robuste (Go, 165+ tests)
- ✅ **DVIG** : Passerelle moderne (FastAPI, authentification P1)
- ✅ **Odoo** : ERP intégré avec modules OCA
- ✅ **Infrastructure** : Docker Compose, Caddy, PostgreSQL

**État actuel** :
- LAB : ✅ Opérationnel
- PROD : ⚠️ Configuration prête, non déployée
- STINGER : ❌ Supprimé (problèmes d'architecture)

**Prochaines étapes** :
- Validation LAB complète
- Déploiement PROD (après validation)
- Évolution DVIG (P2+)

---

**Dernière mise à jour** : 2025-01-28


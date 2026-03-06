# 🔨 Guide — Build du Vault Dorevia

**Date** : 2026-01-12  
**Service** : Dorevia Vault (Go + Fiber)

---

## 📋 Options de Build Disponibles

Vous avez actuellement **3 options** pour builder le Vault :

1. ✅ **Docker multi-stage** (recommandé pour production)
2. ⚙️ **GitLab CI runner** (recommandé pour CI/CD)
3. 🔧 **Build directement sur la machine** (développement/local)

---

## 1️⃣ Docker Multi-Stage (Recommandé pour Production)

### ✅ Avantages

- ✅ **Reproductible** : Même environnement de build à chaque fois
- ✅ **Isolé** : Pas de pollution de l'environnement local
- ✅ **Optimisé** : Image finale légère (Alpine)
- ✅ **Déjà configuré** : Dockerfile multi-stage existant

### 📁 Fichier

**`sources/vault/Dockerfile`**

### 🔨 Build de l'Image

```bash
cd /opt/dorevia-plateform/sources/vault

# Build avec tag de version
docker build -t dorevia/vault:v1.3.4 .

# Ou build avec tag latest
docker build -t dorevia/vault:latest .
```

### 🚀 Utilisation dans docker-compose

**Fichier** : `tenants/core-stinger/platform/docker-compose.yml`

```yaml
vault:
  image: dorevia/vault:v1.3.4  # ⚠️ Version taggée (pas latest)
  container_name: vault-core-stinger
  # ...
```

### 📝 Processus Complet

```bash
# 1. Build de l'image
cd /opt/dorevia-plateform/sources/vault
docker build -t dorevia/vault:v1.3.4 .

# 2. Tag pour le registry (si vous utilisez un registry)
docker tag dorevia/vault:v1.3.4 registry.doreviateam.com/vault:v1.3.4

# 3. Push vers le registry (optionnel)
docker push registry.doreviateam.com/vault:v1.3.4

# 4. Mise à jour du docker-compose.yml avec la nouvelle version

# 5. Redémarrage du service
cd /opt/dorevia-plateform/tenants/core-stinger/platform
docker compose pull vault  # Si vous utilisez un registry
docker compose up -d vault
```

### 🔍 Structure du Dockerfile

Le Dockerfile actuel utilise un **build multi-stage** :

```dockerfile
# Stage 1 : Builder
FROM golang:1.23-alpine AS builder
# ... build du binaire ...

# Stage 2 : Image finale
FROM alpine:latest
# ... copie du binaire depuis builder ...
```

**Avantages** :
- Image finale légère (~20-30 MB)
- Binaire compilé avec optimisations
- Pas de dépendances de build dans l'image finale

---

## 2️⃣ GitLab CI Runner (Recommandé pour CI/CD)

### ✅ Avantages

- ✅ **Automatisation** : Build automatique à chaque push/merge
- ✅ **Tests intégrés** : Exécution des tests avant le build
- ✅ **Versioning automatique** : Tags Git → Tags Docker
- ✅ **Déploiement automatique** : Push vers registry + déploiement

### ⚠️ État Actuel

**Pas de pipeline GitLab CI configuré actuellement.**

### 📝 Configuration Suggérée

Créer **`.gitlab-ci.yml`** à la racine du projet :

```yaml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_IMAGE: dorevia/vault
  DOCKER_REGISTRY: registry.doreviateam.com  # Optionnel

# Tests
test:
  stage: test
  image: golang:1.23-alpine
  script:
    - cd sources/vault
    - go mod download
    - go test ./...
    - go vet ./...
    - golangci-lint run  # Si configuré

# Build Docker
build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - cd sources/vault
    - |
      VERSION=${CI_COMMIT_TAG:-${CI_COMMIT_SHORT_SHA}}
      docker build -t $DOCKER_IMAGE:$VERSION .
      docker tag $DOCKER_IMAGE:$VERSION $DOCKER_IMAGE:latest
      docker push $DOCKER_IMAGE:$VERSION
      docker push $DOCKER_IMAGE:latest
  only:
    - main
    - tags

# Déploiement (optionnel)
deploy:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache docker-compose
    - cd tenants/core-stinger/platform
    - docker compose pull vault
    - docker compose up -d vault
  only:
    - main
  when: manual
```

### 🔧 Prérequis

1. **GitLab Runner** configuré avec Docker executor
2. **Registry Docker** (optionnel, mais recommandé)
3. **Variables CI/CD** configurées :
   - `CI_REGISTRY_USER`
   - `CI_REGISTRY_PASSWORD`
   - `DOCKER_REGISTRY` (si utilisé)

### 📋 Workflow

```
1. Push code → GitLab CI détecte le changement
2. Stage "test" → Exécution des tests
3. Stage "build" → Build de l'image Docker
4. Stage "deploy" → Déploiement (manuel ou automatique)
```

---

## 3️⃣ Build Directement sur la Machine (Développement/Local)

### ✅ Avantages

- ✅ **Rapide** : Pas de build Docker
- ✅ **Débogage facile** : Accès direct au binaire
- ✅ **Développement itératif** : Rebuild rapide

### ⚠️ Inconvénients

- ⚠️ **Non reproductible** : Dépend de l'environnement local
- ⚠️ **Pollution** : Dépendances Go installées localement
- ⚠️ **Non portable** : Binaire spécifique à l'OS/architecture

### 📁 Scripts Disponibles

**`sources/vault/scripts/build.sh`**

### 🔨 Build Local

```bash
cd /opt/dorevia-plateform/sources/vault

# Build avec version automatique (détectée depuis git)
./scripts/build.sh

# Build avec version spécifique
./scripts/build.sh 1.3.4

# Build avec version et output personnalisés
./scripts/build.sh 1.3.4 bin/vault-custom
```

### 📊 Métadonnées Injectées

Le script `build.sh` injecte automatiquement :

- **Version** : Détectée depuis git tag ou paramètre
- **Commit** : Hash court du commit Git
- **BuiltAt** : Date/heure de build (UTC)
- **Schema** : Format `YYYYMMDD_HHMM`

### 🚀 Déploiement avec systemd

**Fichier** : `/etc/systemd/system/dorevia-vault.service`

```ini
[Service]
ExecStart=/opt/dorevia-vault/bin/vault
```

**Déploiement** :
```bash
# Build
cd /opt/dorevia-plateform/sources/vault
./scripts/build.sh

# Copier le binaire
cp bin/vault /opt/dorevia-vault/bin/vault

# Redémarrer le service
sudo systemctl restart dorevia-vault
```

### 📝 Script de Déploiement Automatique

**`sources/vault/scripts/deploy.sh`**

```bash
cd /opt/dorevia-plateform/sources/vault
./scripts/deploy.sh
```

Ce script :
1. Pull les dernières modifications Git
2. Build le binaire avec métadonnées
3. Redémarre le service systemd

---

## 🎯 Recommandation par Cas d'Usage

### 🏭 Production

**Recommandation** : **Docker multi-stage** + **GitLab CI**

**Workflow** :
1. Push code → GitLab CI
2. Tests automatiques
3. Build image Docker
4. Push vers registry
5. Déploiement automatique (ou manuel)

**Avantages** :
- ✅ Reproductible
- ✅ Automatisé
- ✅ Versionné
- ✅ Traçable

### 🧪 Staging/Dev

**Recommandation** : **Docker multi-stage** (même processus que production)

**Workflow** :
1. Build image Docker localement
2. Tag avec version
3. Utilisation dans docker-compose

**Avantages** :
- ✅ Même processus que production
- ✅ Tests dans environnement similaire

### 💻 Développement Local

**Recommandation** : **Build directement sur la machine**

**Workflow** :
1. `./scripts/build.sh`
2. Test local
3. Débogage

**Avantages** :
- ✅ Rapide
- ✅ Itératif
- ✅ Débogage facile

---

## 📊 Comparaison des Options

| Critère | Docker Multi-Stage | GitLab CI | Build Local |
|---------|-------------------|-----------|-------------|
| **Reproductibilité** | ✅ Excellente | ✅ Excellente | ⚠️ Dépend de l'env |
| **Automatisation** | ⚠️ Manuelle | ✅ Automatique | ⚠️ Manuelle |
| **Vitesse** | 🟡 Moyenne | 🟡 Moyenne | ✅ Rapide |
| **Portabilité** | ✅ Excellente | ✅ Excellente | ⚠️ OS/arch spécifique |
| **Versioning** | ✅ Manuel | ✅ Automatique | ✅ Manuel |
| **Tests** | ⚠️ Manuels | ✅ Automatiques | ⚠️ Manuels |
| **Déploiement** | ✅ Docker Compose | ✅ Automatique | ⚠️ systemd manuel |

---

## 🔧 Configuration Actuelle

### Docker Compose

**Fichier** : `tenants/core-stinger/platform/docker-compose.yml`

```yaml
vault:
  image: dorevia/vault:v1.3.4  # ⚠️ Version taggée
```

### Dockerfile

**Fichier** : `sources/vault/Dockerfile`

- ✅ Multi-stage build configuré
- ✅ Base : `golang:1.23-alpine` (builder) + `alpine:latest` (runtime)
- ✅ Utilisateur non-root : `vault:vault` (UID 1000)
- ✅ Healthcheck configuré

### Scripts

- ✅ `build.sh` : Build local avec métadonnées
- ✅ `deploy.sh` : Déploiement systemd
- ✅ `docker-entrypoint.sh` : Entrypoint Docker

---

## 🚀 Workflow Recommandé (Production)

### Option A : Sans GitLab CI (Manuel)

```bash
# 1. Build de l'image
cd /opt/dorevia-plateform/sources/vault
docker build -t dorevia/vault:v1.3.4 .

# 2. Mise à jour docker-compose.yml
# Changer la version dans tenants/core-stinger/platform/docker-compose.yml

# 3. Redémarrage
cd /opt/dorevia-plateform/tenants/core-stinger/platform
docker compose up -d vault
```

### Option B : Avec GitLab CI (Automatique)

1. **Configurer `.gitlab-ci.yml`** (voir section 2)
2. **Push code** → CI build automatiquement
3. **Tag release** → `git tag v1.3.4 && git push --tags`
4. **Déploiement** → Manuel via GitLab CI ou automatique

---

## 📝 Checklist Déploiement

### Avant le Build

- [ ] Vérifier la version Go (actuellement 1.22.2, Dockerfile utilise 1.23)
- [ ] Vérifier les dépendances (`go.mod`, `go.sum`)
- [ ] Exécuter les tests (`go test ./...`)
- [ ] Vérifier le linting (`golangci-lint run`)

### Build

- [ ] Build de l'image Docker (ou binaire local)
- [ ] Vérifier la taille de l'image/binaire
- [ ] Tester l'image localement (`docker run --rm dorevia/vault:v1.3.4 /version`)

### Déploiement

- [ ] Mettre à jour la version dans `docker-compose.yml`
- [ ] Pull/rebuild l'image
- [ ] Redémarrer le service
- [ ] Vérifier les logs (`docker logs vault-core-stinger`)
- [ ] Tester l'endpoint `/health`
- [ ] Vérifier l'endpoint `/version` (métadonnées)

---

## 🔍 Vérification Post-Déploiement

```bash
# Health check
curl http://localhost:8080/health

# Version (métadonnées)
curl http://localhost:8080/version

# Logs
docker logs vault-core-stinger --tail 50

# Statut du container
docker ps | grep vault
```

---

## 📚 Références

- **Dockerfile** : `sources/vault/Dockerfile`
- **Scripts** : `sources/vault/scripts/`
- **Docker Compose** : `tenants/core-stinger/platform/docker-compose.yml`
- **Documentation** : `sources/vault/docs/`

---

**Date** : 2026-01-12  
**Statut** : ✅ **GUIDE COMPLET**

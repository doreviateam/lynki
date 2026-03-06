# 🔐 Patch — Upgrade Go 1.25.6 pour Dorevia Vault

**Date** : 2026-01-12  
**Priorité** : 🔴 **P0 (Sécurité)**  
**Statut** : ✅ **PRÊT À APPLIQUER** (dès publication Go 1.25.6)

---

## 📋 Résumé

Patch prêt pour l'upgrade de Go 1.23 → Go 1.25.6 dans Dorevia Vault.

**Fichiers modifiés** :
- ✅ `Dockerfile` : `golang:1.23-alpine` → `golang:1.25.6-alpine`
- ✅ `go.mod` : `go 1.23.0` → `go 1.25.6` (optionnel mais recommandé)

**Scripts créés** :
- ✅ `scripts/upgrade_go_1.25.6.sh` : Script d'upgrade automatisé

---

## 🚀 Application du Patch

### Option 1 : Script Automatisé (Recommandé)

```bash
cd /opt/dorevia-plateform/sources/vault

# Dry-run (vérification sans modification)
./scripts/upgrade_go_1.25.6.sh --dry-run

# Application réelle
./scripts/upgrade_go_1.25.6.sh
```

### Option 2 : Application Manuelle

#### Étape 1 : Modifier Dockerfile

**Fichier** : `sources/vault/Dockerfile`

```diff
- FROM golang:1.23-alpine AS builder
+ FROM golang:1.25.6-alpine AS builder
```

#### Étape 2 : Modifier go.mod (optionnel mais recommandé)

**Fichier** : `sources/vault/go.mod`

```diff
- go 1.23.0
+ go 1.25.6

- toolchain go1.24.10
+ toolchain go1.25.6
```

---

## ✅ Vérifications Post-Patch

### 1. Build de Test

```bash
cd /opt/dorevia-plateform/sources/vault

# Build de test
docker build -t dorevia/vault:test-go1.25.6 .

# Vérifier que le build fonctionne
docker run --rm dorevia/vault:test-go1.25.6 /version
```

### 2. Tests Unitaires

```bash
# Tests avec Go 1.25.6
docker run --rm -v $(pwd):/app -w /app golang:1.25.6-alpine \
  sh -c "go mod download && go test ./..."
```

### 3. Scan Vulnérabilités

```bash
# Installer govulncheck
go install golang.org/x/vuln/cmd/govulncheck@latest

# Scan
govulncheck ./...
```

### 4. Build Production

```bash
# Build image production
docker build -t dorevia/vault:v1.3.5 .

# Vérifier la taille
docker images | grep dorevia/vault
```

---

## 📝 Déploiement

### Étape 1 : Mise à Jour docker-compose.yml

**Fichier** : `tenants/core-stinger/platform/docker-compose.yml`

```diff
  vault:
-   image: dorevia/vault:v1.3.4
+   image: dorevia/vault:v1.3.5
```

### Étape 2 : Déploiement

```bash
cd /opt/dorevia-plateform/tenants/core-stinger/platform

# Pull/rebuild
docker compose pull vault
# ou
docker compose build vault

# Redémarrage
docker compose up -d vault
```

### Étape 3 : Vérifications

```bash
# Health check
curl http://localhost:8080/health

# Version (vérifier métadonnées)
curl http://localhost:8080/version

# Logs
docker logs vault-core-stinger --tail 50

# Statut
docker ps | grep vault
```

---

## 🔄 Rollback (Si Problème)

### Option 1 : Restaurer les Sauvegardes

```bash
cd /opt/dorevia-plateform/sources/vault

# Restaurer Dockerfile
cp Dockerfile.backup.* Dockerfile

# Restaurer go.mod
cp go.mod.backup.* go.mod

# Rebuild
docker build -t dorevia/vault:v1.3.4 .
```

### Option 2 : Utiliser l'Image Précédente

```bash
cd /opt/dorevia-plateform/tenants/core-stinger/platform

# Restaurer version précédente dans docker-compose.yml
sed -i 's/v1.3.5/v1.3.4/' docker-compose.yml

# Redémarrage
docker compose up -d vault
```

---

## 📋 Checklist Complète

### Préparation

- [ ] Vérifier que Go 1.25.6 est publié
- [ ] Backup des fichiers (`Dockerfile`, `go.mod`)
- [ ] Vérifier compatibilité Fiber avec Go 1.25
- [ ] Vérifier dépendances (`go mod tidy`, `go mod verify`)

### Application du Patch

- [ ] Modifier Dockerfile (`golang:1.25.6-alpine`)
- [ ] Modifier go.mod (`go 1.25.6`, `toolchain go1.25.6`)
- [ ] Build de test
- [ ] Tests unitaires
- [ ] Scan vulnérabilités (`govulncheck`)

### Déploiement

- [ ] Build image production (`dorevia/vault:v1.3.5`)
- [ ] Mettre à jour docker-compose.yml
- [ ] Pull/rebuild image
- [ ] Redémarrage service
- [ ] Health check
- [ ] Version check
- [ ] Logs vérification

### Post-Déploiement

- [ ] Monitoring 24h
- [ ] Vérification métriques
- [ ] Vérification endpoints
- [ ] Vérification intégrations (Odoo, DVIG)
- [ ] Documentation mise à jour

---

## 🛡️ Sécurité

### CVE Corrigés

Les versions Go 1.25.6, 1.24.12 corrigent :

- **CVE-2025-61728** : Standard library
- **CVE-2025-61726** : Standard library
- **CVE-2025-68121** : Toolchain
- **CVE-2025-61731** : Standard library
- **CVE-2025-68119** : Standard library

### Vérifications Post-Upgrade

```bash
# Scan vulnérabilités
govulncheck ./...

# Ou sur binaire
govulncheck -mode=binary ./vault
```

---

## 📚 Fichiers du Patch

### Fichiers Modifiés

- `sources/vault/Dockerfile`
- `sources/vault/go.mod`

### Scripts Créés

- `sources/vault/scripts/upgrade_go_1.25.6.sh`

### Patches de Référence

- `sources/vault/Dockerfile.go1.25.6.patch`
- `sources/vault/go.mod.go1.25.6.patch`

---

## ⚠️ Notes Importantes

1. **Timing** : Attendre la publication officielle de Go 1.25.6
2. **Tests** : Exécuter tous les tests avant déploiement
3. **Monitoring** : Surveiller les logs pendant 24h après déploiement
4. **Rollback** : Avoir un plan de rollback prêt

---

## 🔗 Références

- **Évaluation** : `ZeDocs/TestV3/EVALUATION_UPGRADE_GO_VAULT.md`
- **Guide Build** : `ZeDocs/TestV3/GUIDE_BUILD_VAULT.md`
- **Document Sécurité** : Document fourni par l'utilisateur

---

**Date** : 2026-01-12  
**Statut** : ✅ **PATCH PRÊT**  
**Action** : ⏳ **ATTENDRE PUBLICATION Go 1.25.6**

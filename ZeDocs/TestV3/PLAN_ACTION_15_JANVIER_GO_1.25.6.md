# 📅 Plan d'Action — Upgrade Go 1.25.6 (15 Janvier 2026)

**Date cible** : 15 janvier 2026  
**Action** : Upgrade Go 1.25.6 pour Dorevia Vault  
**Priorité** : 🔴 **P0 (Sécurité)**

---

## ✅ Checklist du 15 Janvier

### Matin (Vérification Publication)

- [ ] **Vérifier publication Go 1.25.6**
  ```bash
  # Vérifier sur golang.org
  curl -s https://go.dev/dl/ | grep "go1.25.6"
  
  # Vérifier disponibilité Docker
  docker pull golang:1.25.6-alpine
  ```

- [ ] **Confirmer les CVE corrigés**
  - Vérifier la release notes Go 1.25.6
  - Confirmer que les 5 CVE sont bien corrigés

### Après-Midi (Application du Patch)

- [ ] **Exécuter le script d'upgrade**
  ```bash
  cd /opt/dorevia-plateform/sources/vault
  ./scripts/upgrade_go_1.25.6.sh
  ```

- [ ] **Vérifications post-upgrade**
  - [ ] Build réussi
  - [ ] Tests unitaires OK
  - [ ] Scan vulnérabilités (`govulncheck`)
  - [ ] Health check OK

- [ ] **Build image production**
  ```bash
  docker build -t dorevia/vault:v1.3.5 .
  ```

### Soir (Déploiement)

- [ ] **Mise à jour docker-compose.yml**
  ```bash
  cd /opt/dorevia-plateform/tenants/core-stinger/platform
  # Modifier image: dorevia/vault:v1.3.5
  ```

- [ ] **Déploiement**
  ```bash
  docker compose up -d vault
  ```

- [ ] **Vérifications post-déploiement**
  - [ ] Health check : `curl http://localhost:8080/health`
  - [ ] Version check : `curl http://localhost:8080/version`
  - [ ] Logs : `docker logs vault-core-stinger --tail 50`
  - [ ] Monitoring 1h minimum

---

## 🔔 Rappel Automatique

### Script de Vérification (à exécuter le 15/01)

```bash
#!/bin/bash
# Vérifier si Go 1.25.6 est publié
# Usage: ./check_go_1.25.6_release.sh

echo "🔍 Vérification publication Go 1.25.6..."
echo ""

# Vérifier Docker Hub
if docker pull golang:1.25.6-alpine >/dev/null 2>&1; then
    echo "✅ Go 1.25.6 disponible sur Docker Hub"
    echo ""
    echo "🚀 Prochaines étapes :"
    echo "   cd /opt/dorevia-plateform/sources/vault"
    echo "   ./scripts/upgrade_go_1.25.6.sh"
else
    echo "⏳ Go 1.25.6 pas encore disponible"
    echo "   Réessayer plus tard"
fi
```

---

## 📋 Commandes Rapides (15 Janvier)

### 1. Vérification Publication

```bash
# Vérifier Docker Hub
docker pull golang:1.25.6-alpine

# Vérifier site Go
curl -s https://go.dev/dl/ | grep "go1.25.6"
```

### 2. Application du Patch

```bash
cd /opt/dorevia-plateform/sources/vault
./scripts/upgrade_go_1.25.6.sh
```

### 3. Build et Déploiement

```bash
# Build
docker build -t dorevia/vault:v1.3.5 .

# Déploiement
cd /opt/dorevia-plateform/tenants/core-stinger/platform
# Modifier docker-compose.yml (image: dorevia/vault:v1.3.5)
docker compose up -d vault
```

### 4. Vérifications

```bash
# Health
curl http://localhost:8080/health

# Version
curl http://localhost:8080/version

# Logs
docker logs vault-core-stinger --tail 50
```

---

## ⚠️ Si Go 1.25.6 n'est pas publié le 15

### Plan B : Vérification Quotidienne

Créer un cron job pour vérifier quotidiennement :

```bash
# Ajouter dans crontab
0 9 * * * /opt/dorevia-plateform/sources/vault/scripts/check_go_release.sh
```

### Script de Vérification Quotidienne

```bash
#!/bin/bash
# check_go_release.sh
# Vérifie quotidiennement si Go 1.25.6 est publié

if docker pull golang:1.25.6-alpine >/dev/null 2>&1; then
    echo "✅ Go 1.25.6 publié !"
    echo "Exécuter: cd /opt/dorevia-plateform/sources/vault && ./scripts/upgrade_go_1.25.6.sh"
    # Optionnel: notification email/Slack
fi
```

---

## 📊 Timeline Estimée (15 Janvier)

| Heure | Action | Durée |
|-------|--------|-------|
| 09:00 | Vérification publication | 5 min |
| 09:05 | Application patch | 10 min |
| 09:15 | Tests et vérifications | 15 min |
| 09:30 | Build image production | 10 min |
| 09:40 | Déploiement staging | 10 min |
| 09:50 | Vérifications post-déploiement | 10 min |
| **Total** | | **~1h** |

---

## 🔗 Références

- **Patch** : `ZeDocs/TestV3/PATCH_UPGRADE_GO_1.25.6.md`
- **Évaluation** : `ZeDocs/TestV3/EVALUATION_UPGRADE_GO_VAULT.md`
- **Script Upgrade** : `sources/vault/scripts/upgrade_go_1.25.6.sh`

---

**Date** : 2026-01-12  
**Action** : ⏳ **ATTENDRE 15 JANVIER 2026**  
**Statut** : ✅ **PLAN PRÊT**

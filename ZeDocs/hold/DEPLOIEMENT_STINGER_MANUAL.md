# 🚀 Déploiement STINGER - Instructions Manuelles

**Date** : 2025-01-28  
**Statut** : ⚠️ Nécessite exécution manuelle avec sudo

---

## 📊 État Actuel

### ✅ Complété Automatiquement

- [x] Réseau Docker créé : `dorevia-network`
- [x] Image Docker buildée : `dorevia/dvig:0.1.2-auth`
- [x] Fichiers sources prêts :
  - `conf/tokens.stinger.yml`
  - `docker/docker-compose.stinger.yml`

### ⏳ À Faire Manuellement (nécessite sudo)

- [ ] Créer répertoires système
- [ ] Copier et sécuriser `tokens.yml`
- [ ] Copier `docker-compose.stinger.yml`
- [ ] Lancer le service

---

## 🔧 Commandes à Exécuter

### 1. Créer Répertoires

```bash
sudo mkdir -p /opt/dvig
sudo mkdir -p /etc/dvig
sudo mkdir -p /var/log/dvig

# Permissions
sudo chown -R $USER:$USER /opt/dvig /var/log/dvig
```

### 2. Copier Tokens.yml

```bash
cd /opt/dorevia-plateform/sources/dvig

# Copier tokens
sudo cp conf/tokens.stinger.yml /etc/dvig/tokens.yml

# Sécuriser (permissions 0400)
sudo chmod 0400 /etc/dvig/tokens.yml
sudo chown root:root /etc/dvig/tokens.yml
```

### 3. Copier Docker Compose

```bash
# Copier docker-compose
cp docker/docker-compose.stinger.yml /opt/dvig/
```

### 4. Vérifier Réseau Docker

```bash
# Vérifier si réseau existe
docker network inspect dorevia-network

# Si n'existe pas, créer
docker network create dorevia-network
```

### 5. Vérifier Image Docker

```bash
# Vérifier si image existe
docker images dorevia/dvig:0.1.2-auth

# Si n'existe pas, build
cd /opt/dorevia-plateform/sources/dvig
docker build -f docker/Dockerfile -t dorevia/dvig:0.1.2-auth .
```

### 6. Lancer Service

```bash
cd /opt/dvig
docker compose -f docker-compose.stinger.yml up -d
```

### 7. Vérifier Démarrage

```bash
# Vérifier container
docker ps | grep dvig-stinger

# Vérifier logs
docker logs -f dvig-stinger

# Health check
curl http://localhost:8080/health
```

---

## ✅ Checklist Complète

### Préparation

- [x] Réseau Docker créé
- [x] Image Docker buildée
- [ ] Répertoires créés (`/opt/dvig`, `/etc/dvig`, `/var/log/dvig`)
- [ ] `tokens.yml` copié et sécurisé (permissions 0400)
- [ ] `docker-compose.stinger.yml` copié

### Déploiement

- [ ] Service lancé (`docker compose up -d`)
- [ ] Container actif
- [ ] Health check OK

### Validation

- [ ] Smoke tests (7 tests)
- [ ] Reload tokens
- [ ] Logs validés

---

## 🚀 Script Automatisé (Alternative)

Si vous avez les permissions sudo sans mot de passe configurées :

```bash
cd /opt/dorevia-plateform/sources/dvig
./scripts/deploy_stinger.sh
```

**Note** : Le script nécessite sudo avec mot de passe, donc doit être exécuté manuellement dans un terminal interactif.

---

## 📋 Commandes Utiles Après Déploiement

```bash
# Voir logs
docker logs -f dvig-stinger

# Redémarrer
docker restart dvig-stinger

# Arrêter
cd /opt/dvig
docker compose -f docker-compose.stinger.yml down

# Reload tokens (SIGHUP)
docker kill --signal=HUP dvig-stinger

# Vérifier health
curl http://localhost:8080/health | jq .
```

---

## 🔗 Références

- **Script automatisé** : `scripts/deploy_stinger.sh`
- **Guide déploiement** : `GUIDE_DEPLOIEMENT_STINGER_P1_AUTH_TOKEN.md`
- **Configuration** : `CONFIGURATION_DOCKER_COMPOSE_STINGER.md`

---

**Dernière mise à jour** : 2025-01-28


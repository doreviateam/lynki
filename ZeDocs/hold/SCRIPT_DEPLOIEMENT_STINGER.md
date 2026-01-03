# 🚀 Script de Déploiement Automatisé STINGER

**Date** : 2025-01-28  
**Script** : `scripts/deploy_stinger.sh`  
**Version** : 1.0

---

## 📋 Vue d'Ensemble

Script bash automatisé pour déployer DVIG P1 Auth/Token en environnement STINGER.

### Fonctionnalités

- ✅ Vérification des prérequis (Docker, docker-compose)
- ✅ Création automatique des répertoires
- ✅ Copie et sécurisation de `tokens.yml` (permissions 0400)
- ✅ Copie de `docker-compose.stinger.yml`
- ✅ Création du réseau Docker si nécessaire
- ✅ Build/Pull de l'image Docker
- ✅ Arrêt des services existants (optionnel)
- ✅ Lancement du service
- ✅ Vérification du démarrage (health check)
- ✅ Affichage des informations et commandes utiles

---

## 🚀 Utilisation

### Prérequis

- Docker installé et fonctionnel
- `docker-compose` ou `docker compose` disponible
- Permissions sudo (pour création répertoires et permissions tokens)
- Fichiers sources présents :
  - `conf/tokens.stinger.yml`
  - `docker/docker-compose.stinger.yml`

### Exécution

```bash
cd /opt/dorevia-plateform/sources/dvig
./scripts/deploy_stinger.sh
```

### Exécution avec sudo (si nécessaire)

```bash
sudo ./scripts/deploy_stinger.sh
```

---

## 📝 Étapes du Script

### 1. Vérification Prérequis

- Docker installé
- docker-compose disponible
- Docker démarré
- Permissions Docker

### 2. Vérification Fichiers Sources

- `conf/tokens.stinger.yml` existe
- `docker/docker-compose.stinger.yml` existe

### 3. Création Répertoires

- `/opt/dvig`
- `/etc/dvig`
- `/var/log/dvig`

### 4. Copie Tokens

- Copie `conf/tokens.stinger.yml` → `/etc/dvig/tokens.yml`
- Permissions : `chmod 0400`
- Propriétaire : `root:root`
- Confirmation si fichier existe déjà

### 5. Copie Docker Compose

- Copie `docker/docker-compose.stinger.yml` → `/opt/dvig/docker-compose.stinger.yml`

### 6. Création Réseau Docker

- Crée `dorevia-network` si n'existe pas

### 7. Préparation Image Docker

- Vérifie si image `dorevia/dvig:0.1.2-auth` existe localement
- Sinon, tente pull depuis registry
- Sinon, build local (dernier recours)

### 8. Arrêt Service Existant

- Détecte si container `dvig-stinger` existe
- Propose arrêt/suppression (confirmation requise)

### 9. Lancement Service

- `docker compose up -d`

### 10. Vérification Démarrage

- Vérifie container actif
- Health check (30 tentatives, 2s intervalle)

### 11. Affichage Informations

- Résumé du déploiement
- Commandes utiles
- Prochaines étapes

---

## 🔧 Configuration

### Variables du Script

```bash
IMAGE_NAME="dorevia/dvig"
IMAGE_TAG="0.1.2-auth"
CONTAINER_NAME="dvig-stinger"
COMPOSE_FILE="docker-compose.stinger.yml"
TOKENS_FILE="/etc/dvig/tokens.yml"
TOKENS_SOURCE="conf/tokens.stinger.yml"
COMPOSE_SOURCE="docker/docker-compose.stinger.yml"
WORK_DIR="/opt/dvig"
NETWORK_NAME="dorevia-network"
```

### Personnalisation

Modifier les variables en début de script selon votre environnement.

---

## ✅ Checklist Avant Exécution

- [ ] Docker installé et fonctionnel
- [ ] docker-compose disponible
- [ ] Permissions sudo (si nécessaire)
- [ ] Fichier `conf/tokens.stinger.yml` existe
- [ ] Fichier `docker/docker-compose.stinger.yml` existe
- [ ] Accès réseau (si pull depuis registry)

---

## 🐛 Dépannage

### Erreur : "Docker n'est pas démarré"

```bash
# Vérifier Docker
sudo systemctl status docker
sudo systemctl start docker

# Vérifier permissions
sudo usermod -aG docker $USER
# Déconnexion/reconnexion requise
```

### Erreur : "docker-compose non trouvé"

```bash
# Installer docker-compose
sudo apt-get install docker-compose

# Ou utiliser 'docker compose' (version récente)
```

### Erreur : "Fichier tokens source introuvable"

```bash
# Générer tokens STINGER
cd /opt/dorevia-plateform/sources/dvig
source venv/bin/activate
python -m dvig.cli.token_gen --tenant stinger --univers odoo --output yaml
```

### Erreur : "Health check timeout"

```bash
# Vérifier logs
docker logs dvig-stinger

# Vérifier manuellement
curl http://localhost:8080/health

# Vérifier port disponible
netstat -tlnp | grep 8080
```

### Erreur : "Permission denied" sur tokens.yml

```bash
# Vérifier permissions
ls -la /etc/dvig/tokens.yml

# Corriger manuellement
sudo chmod 0400 /etc/dvig/tokens.yml
sudo chown root:root /etc/dvig/tokens.yml
```

---

## 📊 Exemple de Sortie

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Déploiement STINGER - DVIG P1 Auth/Token
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[INFO] Vérification des prérequis...
[SUCCESS] Prérequis OK
[INFO] Vérification des fichiers sources...
[SUCCESS] Fichiers sources OK
[INFO] Création des répertoires...
[SUCCESS] Répertoires créés
[INFO] Copie du fichier tokens.yml...
[SUCCESS] Fichier tokens.yml copié et sécurisé (permissions 0400)
[INFO] Copie du fichier docker-compose...
[SUCCESS] Fichier docker-compose copié
[INFO] Vérification du réseau Docker...
[INFO] Création du réseau dorevia-network...
[SUCCESS] Réseau créé
[INFO] Vérification de l'image Docker...
[INFO] Tentative de pull depuis registry...
[SUCCESS] Image dorevia/dvig:0.1.2-auth pullée depuis registry
[INFO] Lancement du service...
[SUCCESS] Service lancé
[INFO] Vérification du démarrage...
[SUCCESS] Health check OK
[SUCCESS] Déploiement STINGER terminé !

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Informations du service:

  Container: dvig-stinger
  Image: dorevia/dvig:0.1.2-auth
  Port: 8080
  Health: http://localhost:8080/health

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 Commandes utiles:

  # Voir les logs
  docker logs -f dvig-stinger

  # Redémarrer
  docker restart dvig-stinger

  # Arrêter
  cd /opt/dvig && docker compose -f docker-compose.stinger.yml down

  # Reload tokens (SIGHUP)
  docker kill --signal=HUP dvig-stinger

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Prochaines étapes:

  1. Vérifier les logs: docker logs -f dvig-stinger
  2. Exécuter les smoke tests (voir GUIDE_DEPLOIEMENT_STINGER_P1_AUTH_TOKEN.md)
  3. Valider le reload tokens
  4. Documenter la validation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔐 Sécurité

### Tokens

- ✅ Permissions `0400` appliquées automatiquement
- ✅ Propriétaire `root:root`
- ✅ Volume monté en read-only dans Docker

### Script

- ✅ Vérifications préalables
- ✅ Gestion d'erreurs (`set -euo pipefail`)
- ✅ Confirmations pour actions destructives
- ✅ Pas de hardcoded secrets

---

## 📝 Notes

- Le script est **idempotent** : peut être exécuté plusieurs fois
- **Confirmations** pour actions destructives (remplacement tokens, arrêt service)
- **Fallback** : build local si pull échoue
- **Health check** : 30 tentatives (60s max)

---

## 🔗 Références

- **Guide déploiement** : `GUIDE_DEPLOIEMENT_STINGER_P1_AUTH_TOKEN.md`
- **Préconisations** : `PRECONISATIONS_AJUSTEMENTS_STINGER_v1.0.md`
- **Plan d'action** : `PLAN_ACTION_IMMEDIAT_STINGER.md`

---

**Dernière mise à jour** : 2025-01-28


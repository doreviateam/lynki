# 🐳 Configuration Docker Compose STINGER - DVIG P1 Auth/Token

**Date** : 2025-01-28  
**Environnement** : STINGER  
**Image** : `dorevia/dvig:0.1.2-auth` (même que PROD)

---

## 📁 Fichiers Créés

### 1. Configuration STINGER

**Fichier** : `/opt/dorevia-plateform/sources/dvig/docker/docker-compose.stinger.yml`

**Statut** : ✅ Prêt pour déploiement

### 2. Exemple de Configuration

**Fichier** : `/opt/dorevia-plateform/sources/dvig/docker/docker-compose.stinger.yml.example`

**Statut** : ✅ Template de référence

---

## 🔧 Configuration Détaillée

### Image Docker

```yaml
image: dorevia/dvig:0.1.2-auth  # ⚠️ Même image que PROD
```

**Principe** : STINGER = config, pas version. Même image que PROD.

### Variables d'Environnement

#### Auth
- `DVIG_AUTH_ENABLED=1` : Authentification activée
- `DVIG_TOKENS_FILE=/etc/dvig/tokens.yml` : Fichier tokens
- `DVIG_TOKENS_RELOAD_INTERVAL=60` : Reload automatique (60s)
- `DVIG_TOKENS_RELOAD_ON_SIGHUP=1` : Reload sur SIGHUP activé

#### API
- `DVIG_HOST=0.0.0.0` : Écoute sur toutes les interfaces
- `DVIG_PORT=8080` : Port API

#### Docs (PROD-like)
- `DVIG_DOCS_ENABLED=0` : Docs désactivées
- `DVIG_OPENAPI_ENABLED=0` : OpenAPI désactivé

#### Health
- `DVIG_HEALTH_PROTECTED=0` : Health check public

#### Logs (PROD-like)
- `DVIG_LOG_FORMAT=json` : Format JSON
- `DVIG_LOG_LEVEL=info` : Niveau info

### Volumes

```yaml
volumes:
  - /etc/dvig/tokens.yml:/etc/dvig/tokens.yml:ro  # Read-only
  - /var/log/dvig:/var/log/dvig                    # Logs
```

**Important** : Volume tokens en **read-only** (`:ro`).

### Healthcheck

```yaml
healthcheck:
  test: ["CMD", "sh", "-lc", "wget -qO- http://127.0.0.1:8080/health >/dev/null || curl -f http://localhost:8080/health"]
  interval: 10s
  timeout: 3s
  retries: 10
  start_period: 40s
```

**Amélioration** : Support `wget` et `curl`, intervalle réduit à 10s.

### Network

```yaml
networks:
  dorevia-network:
    external: true
```

**Création réseau** (si nécessaire) :
```bash
docker network create dorevia-network
```

---

## 🚀 Utilisation

### 1. Préparer Serveur STINGER

```bash
# Créer répertoires
sudo mkdir -p /opt/dvig
sudo mkdir -p /etc/dvig
sudo mkdir -p /var/log/dvig

# Copier tokens.yml
scp /opt/dorevia-plateform/sources/dvig/conf/tokens.stinger.yml user@stinger:/etc/dvig/tokens.yml

# Copier docker-compose
scp /opt/dorevia-plateform/sources/dvig/docker/docker-compose.stinger.yml user@stinger:/opt/dvig/

# Sur serveur STINGER : Configurer permissions
sudo chmod 0400 /etc/dvig/tokens.yml
sudo chown root:root /etc/dvig/tokens.yml
```

### 2. Créer Réseau Docker (si nécessaire)

```bash
docker network create dorevia-network
```

### 3. Lancer Service

```bash
cd /opt/dvig
docker compose -f docker-compose.stinger.yml up -d
```

### 4. Vérifier Démarrage

```bash
# Vérifier container
docker compose -f docker-compose.stinger.yml ps

# Vérifier logs
docker compose -f docker-compose.stinger.yml logs -f

# Vérifier health
curl http://localhost:8080/health
```

### 5. Commandes Utiles

```bash
# Redémarrer
docker compose -f docker-compose.stinger.yml restart

# Arrêter
docker compose -f docker-compose.stinger.yml down

# Logs en temps réel
docker compose -f docker-compose.stinger.yml logs -f

# Reload tokens (SIGHUP)
docker kill --signal=HUP dvig-stinger
```

---

## ✅ Checklist Déploiement

### Préparation

- [ ] Répertoires créés (`/opt/dvig`, `/etc/dvig`, `/var/log/dvig`)
- [ ] `tokens.yml` copié sur serveur STINGER
- [ ] Permissions configurées (`chmod 0400`, `chown root:root`)
- [ ] `docker-compose.stinger.yml` copié sur serveur STINGER
- [ ] Réseau Docker créé (`dorevia-network`)

### Déploiement

- [ ] Image Docker disponible (`dorevia/dvig:0.1.2-auth`)
- [ ] Service lancé (`docker compose up -d`)
- [ ] Container actif (`docker ps`)
- [ ] Health check OK (`curl /health`)

### Validation

- [ ] Logs démarrage OK
- [ ] Port 8080 accessible
- [ ] Smoke tests passent
- [ ] Reload tokens fonctionne

---

## 🔐 Sécurité

### Tokens

- ✅ Volume monté en **read-only** (`:ro`)
- ✅ Permissions `0400` sur fichier tokens
- ✅ Propriétaire `root:root`

### Network

- ✅ Réseau externe isolé
- ✅ Pas d'exposition directe (reverse proxy recommandé)

### Logs

- ✅ Format JSON (exploitable)
- ✅ Pas de token brut/hash dans logs

---

## 📝 Notes

- **Image** : Même image que PROD (`0.1.2-auth`)
- **Config** : STINGER = configuration, pas version
- **Docs** : Désactivées (PROD-like)
- **Logs** : Format JSON (PROD-like)
- **Healthcheck** : Amélioré (10s intervalle)

---

## 🔗 Références

- **Préconisations** : `PRECONISATIONS_AJUSTEMENTS_STINGER_v1.0.md`
- **Guide déploiement** : `GUIDE_DEPLOIEMENT_STINGER_P1_AUTH_TOKEN.md`
- **Plan d'action** : `PLAN_ACTION_IMMEDIAT_STINGER.md`

---

**Dernière mise à jour** : 2025-01-28


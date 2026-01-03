# 🚀 Guide Déploiement PROD - DVIG P1 Auth/Token

**Date** : 2025-01-28  
**Version** : `0.1.2-auth` (gelée)  
**Environnement** : PROD

---

## ⚠️ Prérequis

### Validations Obligatoires
- ✅ **LAB validé** (100%)
- ✅ **STINGER validé** (100%)
- ✅ **Release gelée** (`dorevia/dvig:0.1.2-auth`)

### Image Docker
```
dorevia/dvig:0.1.2-auth
```
**⚠️ IMPORTANT** : Même image que STINGER (selon préconisations)

---

## 📋 Phase 1 : Préparation (30-60 min)

### 1.1 Génération Tokens PROD

**⚠️ SÉCURITÉ** : Tokens PROD séparés de LAB/STINGER

```bash
cd /opt/dorevia-plateform/sources/dvig

# Générer token PROD pour chaque tenant/univers
python3 -m dvig.cli.token_gen --tenant <tenant_prod> --univers odoo --output yaml
```

**Exemple** :
```bash
python3 -m dvig.cli.token_gen --tenant prod --univers odoo --output yaml
```

**Sortie attendue** :
```yaml
- id: "tok_prod_odoo_01"
  token_hash: "sha256:<hash>"
  tenant: "prod"
  univers: "odoo"
  status: "active"
  created_at: "2025-01-28T00:00:00Z"
  comment: "PROD - Token initial"
```

### 1.2 Création Fichier tokens.yml PROD

**Fichier** : `conf/tokens.prod.yml`

```yaml
version: 1
# Tokens DVIG PROD - Ne jamais commiter les tokens bruts
# Généré le 2025-01-28
# ⚠️ IMPORTANT : Ne jamais stocker token brut dans les documents

tokens:
  - id: "tok_prod_odoo_01"
    token_hash: "sha256:<hash>"
    tenant: "prod"
    univers: "odoo"
    status: "active"
    created_at: "2025-01-28T00:00:00Z"
    comment: "PROD - Token initial"
```

### 1.3 Stockage Token Brut (Local)

**Fichier** : `conf/token_prod_brut.txt` (⚠️ Ne jamais commiter)

```bash
# ⚠️ TOKEN BRUT PROD - NE JAMAIS COMMITER CE FICHIER
# Stocké localement uniquement, à supprimer après déploiement

TOKEN_BRUT=dvig_<token>
TOKEN_ID=tok_prod_odoo_01
TENANT=prod
UNIVERS=odoo
```

**Permissions** :
```bash
chmod 600 conf/token_prod_brut.txt
```

---

## 📋 Phase 2 : Configuration Serveur PROD (15-30 min)

### 2.1 Création Répertoires

```bash
sudo mkdir -p /opt/dvig /etc/dvig /var/log/dvig
sudo chown -R $USER:$USER /opt/dvig /var/log/dvig
```

### 2.2 Copie Fichier tokens.yml

```bash
sudo cp /opt/dorevia-plateform/sources/dvig/conf/tokens.prod.yml /etc/dvig/tokens.yml
sudo chmod 0444 /etc/dvig/tokens.yml
sudo chown root:root /etc/dvig/tokens.yml
```

### 2.3 Vérification Permissions

```bash
ls -la /etc/dvig/tokens.yml
# Attendu : -r--r--r-- 1 root root
```

---

## 📋 Phase 3 : Configuration Docker Compose PROD

### 3.1 Fichier docker-compose.prod.yml

**Fichier** : `sources/dvig/docker/docker-compose.prod.yml`

```yaml
# Docker Compose PROD - DVIG P1 Auth/Token
# ⚠️ IMPORTANT : Même image que STINGER (dorevia/dvig:0.1.2-auth)

services:
  dvig:
    image: dorevia/dvig:0.1.2-auth  # ⚠️ Même image que STINGER
    container_name: dvig-prod
    restart: unless-stopped
    ports:
      - "8080:8080"  # Adapter selon infrastructure
    
    environment:
      # Auth
      - DVIG_AUTH_ENABLED=1
      - DVIG_TOKENS_FILE=/etc/dvig/tokens.yml
      - DVIG_TOKENS_RELOAD_INTERVAL=60
      - DVIG_TOKENS_RELOAD_ON_SIGHUP=1
      
      # API
      - DVIG_HOST=0.0.0.0
      - DVIG_PORT=8080
      
      # Docs (désactivés en PROD)
      - DVIG_DOCS_ENABLED=0
      - DVIG_OPENAPI_ENABLED=0
      
      # Health
      - DVIG_HEALTH_PROTECTED=0  # Adapter selon besoins
      
      # Logs (format PROD - JSON obligatoire)
      - DVIG_LOG_FORMAT=json
      - DVIG_LOG_LEVEL=info
      
      # Monitoring (à activer selon infrastructure)
      # - DVIG_METRICS_ENABLED=1
      # - DVIG_METRICS_PORT=9090
    
    volumes:
      # Volume tokens (read-only)
      - /etc/dvig/tokens.yml:/etc/dvig/tokens.yml:ro
      # Logs
      - /var/log/dvig:/var/log/dvig
    
    networks:
      - dorevia-network
    
    healthcheck:
      test: ["CMD", "sh", "-lc", "wget -qO- http://127.0.0.1:8080/health >/dev/null || curl -f http://localhost:8080/health"]
      interval: 10s
      timeout: 3s
      retries: 10
      start_period: 40s

networks:
  dorevia-network:
    external: true
```

### 3.2 Copie Configuration

```bash
cp /opt/dorevia-plateform/sources/dvig/docker/docker-compose.prod.yml /opt/dvig/
```

---

## 📋 Phase 4 : Déploiement (15-30 min)

### 4.1 Pull Image Docker

```bash
docker pull dorevia/dvig:0.1.2-auth
```

**Vérification** :
```bash
docker image inspect dorevia/dvig:0.1.2-auth --format '{{.RepoDigests}}'
```

### 4.2 Lancement Service

```bash
cd /opt/dvig
docker compose -f docker-compose.prod.yml up -d
```

### 4.3 Vérification Statut

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

---

## 📋 Phase 5 : Validation PROD (30-60 min)

### 5.1 Smoke Tests

**Script** : `scripts/validate_prod.sh` (à créer basé sur `validate_stinger.sh`)

**Tests à exécuter** :
1. ✅ Health check : 200 OK
2. ✅ Docs désactivé : 404
3. ✅ OpenAPI désactivé : 404
4. ✅ Ingest sans Auth : 401
5. ✅ Token invalide : 401
6. ✅ Univers mismatch : 403
7. ✅ Ingest avec token valide : 201

### 5.2 Vérification Logs

```bash
docker logs dvig-prod | tail -20
```

**Vérifier** :
- ✅ Logs JSON format
- ✅ Aucun token brut/hash dans les logs
- ✅ Champs `event_id`, `tenant`, `univers` présents

### 5.3 Vérification Store

```bash
docker exec dvig-prod python3 << 'PYEOF'
import sys
sys.path.insert(0, '/app')
from dvig.api_fastapi.auth.auth import _token_store

if _token_store:
    print(f"✅ Store disponible: {_token_store.is_available()}")
    print(f"✅ Tokens chargés: {len(_token_store._tokens)}")
    for hash_key, token_info in _token_store._tokens.items():
        print(f"   Token: {token_info.id}, tenant: {token_info.tenant}, univers: {token_info.univers}")
else:
    print("❌ Store non initialisé")
PYEOF
```

### 5.4 Test Authentification

```bash
TOKEN=$(cat /opt/dorevia-plateform/sources/dvig/conf/token_prod_brut.txt | grep "^TOKEN_BRUT=" | cut -d= -f2)

# Test token valide
curl -H "Authorization: Bearer $TOKEN" \
  -X POST http://localhost:8080/ingest \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"odoo.test","data":{}}'

# Test univers mismatch
curl -H "Authorization: Bearer $TOKEN" \
  -X POST http://localhost:8080/ingest \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"sylius.test","data":{}}'
```

---

## 📋 Phase 6 : Monitoring & Observabilité

### 6.1 Logs

**Format** : JSON (obligatoire en PROD)

**Localisation** : `/var/log/dvig/`

**Rotation** : Configurer logrotate si nécessaire

### 6.2 Health Check

**Endpoint** : `http://localhost:8080/health`

**Monitoring** : Intégrer dans système de monitoring (Prometheus, Datadog, etc.)

### 6.3 Métriques (Optionnel P1)

Si activé :
- Endpoint : `http://localhost:9090/metrics`
- Format : Prometheus

---

## 🔐 Sécurité PROD

### Tokens
- ✅ Tokens PROD séparés de LAB/STINGER
- ✅ Token brut stocké localement uniquement
- ✅ Permissions `0444` sur `/etc/dvig/tokens.yml`
- ✅ Volume monté en read-only (`:ro`)

### Configuration
- ✅ Docs/OpenAPI désactivés
- ✅ Logs JSON (aucun token brut/hash)
- ✅ Health check public (configurable)

### Rotation Tokens
- ✅ Support overlap (ancien + nouveau acceptés)
- ✅ Révocation via `status: revoked`
- ✅ Reload automatique (SIGHUP + intervalle)

---

## 🚨 Troubleshooting

### Problème : Permission denied sur tokens.yml

**Solution** :
```bash
sudo chmod 0444 /etc/dvig/tokens.yml
sudo chown root:root /etc/dvig/tokens.yml
docker restart dvig-prod
```

### Problème : Store non initialisé

**Vérification** :
```bash
docker logs dvig-prod | grep -E "(tokens rechargés|Store disponible|Tentative)"
```

**Solution** : Retry automatique (3 tentatives, 1s délai)

### Problème : Authentification échoue

**Vérification** :
1. Hash du token correspond au hash stocké
2. Token status = `active`
3. Univers correspond (`source` doit commencer par `<univers>.`)

---

## ✅ Checklist Déploiement PROD

- [ ] Tokens PROD générés (séparés de LAB/STINGER)
- [ ] Fichier `tokens.prod.yml` créé
- [ ] Token brut stocké localement (`token_prod_brut.txt`)
- [ ] Répertoires créés (`/opt/dvig`, `/etc/dvig`, `/var/log/dvig`)
- [ ] Fichier `tokens.yml` copié sur serveur PROD
- [ ] Permissions configurées (`0444`, `root:root`)
- [ ] Docker Compose PROD configuré
- [ ] Image Docker pullée (`dorevia/dvig:0.1.2-auth`)
- [ ] Service lancé et vérifié
- [ ] Smoke tests exécutés (7/7)
- [ ] Logs vérifiés (JSON, aucun token brut)
- [ ] Store vérifié (tokens chargés)
- [ ] Authentification testée (valide, invalide, mismatch)
- [ ] Monitoring configuré (optionnel)

---

## 📝 Notes

- ⚠️ **Image gelée** : `dorevia/dvig:0.1.2-auth` (aucune modification)
- 🔐 **Sécurité** : Tokens PROD séparés, stockage local uniquement
- 📊 **Logs** : JSON obligatoire en PROD
- 🔍 **Monitoring** : Health check + métriques (optionnel)

---

**Dernière mise à jour** : 2025-01-28  
**Version** : `0.1.2-auth` (gelée)


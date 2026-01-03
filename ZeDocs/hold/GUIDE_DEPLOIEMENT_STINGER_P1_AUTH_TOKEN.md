# 🚀 Guide de Déploiement STINGER - DVIG P1 Auth/Token

**Date** : 2025-01-28  
**Version** : v0.1.2-auth  
**Environnement** : STINGER (pré-production)  
**Statut** : ⏳ Prêt pour déploiement

**⚠️ IMPORTANT** : Voir `PRECONISATIONS_EXECUTION_STINGER_P1_AUTH_TOKEN.md` pour les préconisations officielles.

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Préparation STINGER](#préparation-stinger)
4. [Déploiement STINGER](#déploiement-stinger)
5. [Validation STINGER](#validation-stinger)
6. [Checklist Complète](#checklist-complète)
7. [Troubleshooting](#troubleshooting)
8. [Annexes](#annexes)

---

## 🎯 Vue d'Ensemble

### Objectif

Déployer DVIG P1 Auth/Token en environnement **STINGER** (pré-production) pour validation avant PROD.

**⚠️ IMPORTANT** : Voir `PRECONISATIONS_EXECUTION_STINGER_P1_AUTH_TOKEN.md` pour les préconisations officielles.

### Pipeline

```
LAB ✅ → STINGER ⏳ → PROD 🔮
```

**Règle** : STINGER est **obligatoire** avant PROD.

### Principes Fondamentaux STINGER

1. **Même image que PROD** : STINGER DOIT utiliser la même image Docker que PROD (`dorevia/dvig:0.1.2-auth`)
2. **Séparation stricte des secrets** : Tokens STINGER distincts de LAB et PROD
3. **Configuration PROD-like** : Docs/OpenAPI désactivés, logs JSON, reload actif

### Durée Estimée

- **Préparation** : 0.5 jour
- **Déploiement** : 0.5 jour
- **Validation** : 0.5 jour
- **Total** : 1-2 jours

---

## 📋 Prérequis

### 1. Validation LAB

- [x] ✅ Code 100% terminé
- [x] ✅ Tests automatisés passent (35/35)
- [x] ✅ Validation LAB 100% (13/13 tests)
- [x] ✅ Documentation complète

### 2. Infrastructure STINGER

- [ ] Serveur STINGER accessible
- [ ] Docker installé et configuré
- [ ] Accès réseau vers Odoo STINGER (si applicable)
- [ ] Accès réseau vers Dorevia Vault STINGER (si applicable)
- [ ] Monitoring STINGER configuré (optionnel)

### 3. Accès et Permissions

- [ ] Accès SSH au serveur STINGER
- [ ] Permissions Docker (user dans groupe `docker`)
- [ ] Permissions écriture pour configuration
- [ ] Accès logs système

### 4. Configuration Réseau

- [ ] Port disponible (défaut : 8080, ou configuré)
- [ ] Reverse proxy configuré (Caddy, si applicable)
- [ ] Firewall ouvert (ports nécessaires)

---

## 🔧 Préparation STINGER

### Étape 1 : Générer Tokens STINGER

**⚠️ IMPORTANT** : Tokens STINGER doivent être **séparés** de LAB.

#### 1.1 Génération Token

```bash
cd /opt/dorevia-plateform/sources/dvig
source venv/bin/activate

# Générer token STINGER pour tenant/univers
python -m dvig.cli.token_gen \
  --tenant <tenant_stinger> \
  --univers odoo \
  --output yaml
```

**Exemple de sortie** :
```yaml
- id: "tok_stinger_tenant_odoo_01"
  token_hash: "sha256:abc123..."
  tenant: "tenant_stinger"
  univers: "odoo"
  status: "active"
  created_at: "2025-01-28T00:00:00Z"
  comment: "STINGER - Token initial"
```

#### 1.2 Créer Fichier `tokens.yml` STINGER

**Emplacement recommandé** : `/etc/dvig/tokens.yml` (ou selon configuration)

```bash
# Créer répertoire si nécessaire
sudo mkdir -p /etc/dvig

# Créer fichier tokens.yml STINGER
sudo nano /etc/dvig/tokens.yml
```

**Contenu exemple** :
```yaml
version: 1
# Tokens DVIG STINGER - Ne jamais commiter les tokens bruts
# Généré le 2025-01-28

tokens:
  - id: "tok_stinger_tenant_odoo_01"
    token_hash: "sha256:abc123..."
    tenant: "tenant_stinger"
    univers: "odoo"
    status: "active"
    created_at: "2025-01-28T00:00:00Z"
    comment: "STINGER - Token initial"

  # Ajouter autres tokens si nécessaire
```

**Sécurité** :
- ✅ Ne jamais commiter `tokens.yml` avec tokens réels
- ✅ **Permissions recommandées** : `chmod 0400 /etc/dvig/tokens.yml` (lecture seule root)
- ✅ Propriétaire : `chown root:root /etc/dvig/tokens.yml`
- ⚠️ **Ne jamais stocker token brut dans les documents** : considérer comme compromis et révoquer après tests
- ✅ Dans les docs : ne garder que `token_id` + `token_hash` + métadonnées

#### 1.3 Vérifier Token

```bash
# Tester token généré (depuis LAB ou local)
TOKEN="dvig_..."
curl -X POST http://<stinger_host>:8080/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test.stinger","source":"odoo.stinger.core","data":{}}'
```

---

### Étape 2 : Configuration Variables d'Environnement

#### 2.1 Variables STINGER Recommandées

**Fichier** : `.env.stinger` ou variables système

```bash
# Auth
DVIG_AUTH_ENABLED=1
DVIG_TOKENS_FILE=/etc/dvig/tokens.yml
DVIG_TOKENS_RELOAD_INTERVAL=60
DVIG_TOKENS_RELOAD_ON_SIGHUP=1

# API
DVIG_HOST=0.0.0.0
DVIG_PORT=8080

# Docs (désactivés en STINGER - configuration PROD-like)
DVIG_DOCS_ENABLED=0
DVIG_OPENAPI_ENABLED=0

# Health
DVIG_HEALTH_PROTECTED=0  # Public en STINGER

# Logs (format PROD)
DVIG_LOG_FORMAT=json  # JSON pour monitoring
DVIG_LOG_LEVEL=info
```

#### 2.2 Variables Optionnelles

```bash
# Monitoring (si applicable)
DVIG_METRICS_ENABLED=1
DVIG_METRICS_PORT=9090

# Vault (si applicable)
VAULT_URL=http://vault.stinger:8080
VAULT_API_KEY=<key>
```

---

### Étape 3 : Build Image Docker STINGER

#### 3.1 Utiliser Image PROD (Recommandé) ⚠️

**⚠️ IMPORTANT** : STINGER doit utiliser la **même image que PROD**, pas une image spécifique.

**Option 1 : Image déjà disponible**

```bash
# Utiliser image PROD existante
docker pull dorevia/dvig:0.1.2-auth
```

**Option 2 : Build Image PROD (si nécessaire)**

```bash
cd /opt/dorevia-plateform/sources/dvig

# Build image PROD (même que STINGER)
docker build \
  -f docker/Dockerfile \
  -t dorevia/dvig:0.1.2-auth \
  .
```

#### 3.2 Vérifier Image

```bash
# Vérifier image disponible
docker images | grep dvig

# Vérifier version
docker run --rm dorevia/dvig:0.1.2-auth python -c "import dvig; print(dvig.__version__)"
# Devrait afficher : 0.1.2 (ou version correspondante)
```

#### 3.3 Tag Image (si registry)

```bash
# Si registry Docker disponible
docker tag dorevia/dvig:0.1.2-auth registry.doreviateam.com/dvig:0.1.2-auth
docker push registry.doreviateam.com/dvig:0.1.2-auth
```

**Note** : Ne pas créer de tag `-stinger`, utiliser le tag PROD.

---

## 🚀 Déploiement STINGER

### Étape 1 : Préparer Serveur STINGER

#### 1.1 Connexion Serveur

```bash
ssh user@stinger.doreviateam.com
```

#### 1.2 Créer Structure Répertoires

```bash
# Créer répertoires
sudo mkdir -p /opt/dvig
sudo mkdir -p /etc/dvig
sudo mkdir -p /var/log/dvig

# Permissions
sudo chown -R $USER:$USER /opt/dvig
sudo chmod 0400 /etc/dvig/tokens.yml  # Lecture seule root (recommandé)
sudo chown root:root /etc/dvig/tokens.yml
```

#### 1.3 Copier Configuration

```bash
# Copier tokens.yml (depuis machine locale)
scp /path/to/tokens.yml user@stinger:/etc/dvig/tokens.yml

# Ou créer directement sur serveur
sudo nano /etc/dvig/tokens.yml
```

---

### Étape 2 : Déployer avec Docker

#### 2.1 Docker Compose (Recommandé)

**Fichier** : `/opt/dvig/docker-compose.stinger.yml`

```yaml
version: '3.8'

services:
  dvig:
    image: dorevia/dvig:0.1.2-auth  # ⚠️ Même image que PROD
    container_name: dvig-stinger
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - DVIG_AUTH_ENABLED=1
      - DVIG_TOKENS_FILE=/etc/dvig/tokens.yml
      - DVIG_TOKENS_RELOAD_INTERVAL=60
      - DVIG_TOKENS_RELOAD_ON_SIGHUP=1
      - DVIG_HOST=0.0.0.0
      - DVIG_PORT=8080
      - DVIG_DOCS_ENABLED=0  # ⚠️ Désactivé (PROD-like)
      - DVIG_OPENAPI_ENABLED=0  # ⚠️ Désactivé (PROD-like)
      - DVIG_HEALTH_PROTECTED=0
      - DVIG_LOG_FORMAT=json
      - DVIG_LOG_LEVEL=info
    volumes:
      - /etc/dvig/tokens.yml:/etc/dvig/tokens.yml:ro
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

#### 2.2 Lancer Service

```bash
cd /opt/dvig

# Lancer service
docker-compose -f docker-compose.stinger.yml up -d

# Vérifier logs
docker-compose -f docker-compose.stinger.yml logs -f
```

#### 2.3 Alternative : Docker Run

```bash
docker run -d \
  --name dvig-stinger \
  --restart unless-stopped \
  -p 8080:8080 \
  -v /etc/dvig/tokens.yml:/etc/dvig/tokens.yml:ro \
  -v /var/log/dvig:/var/log/dvig \
  -e DVIG_AUTH_ENABLED=1 \
  -e DVIG_TOKENS_FILE=/etc/dvig/tokens.yml \
  -e DVIG_TOKENS_RELOAD_INTERVAL=60 \
  -e DVIG_TOKENS_RELOAD_ON_SIGHUP=1 \
  -e DVIG_HOST=0.0.0.0 \
  -e DVIG_PORT=8080 \
  -e DVIG_DOCS_ENABLED=0 \
  -e DVIG_OPENAPI_ENABLED=0 \
  -e DVIG_HEALTH_PROTECTED=0 \
  -e DVIG_LOG_FORMAT=json \
  -e DVIG_LOG_LEVEL=info \
  dorevia/dvig:0.1.2-auth
```

---

### Étape 3 : Vérifier Démarrage

#### 3.1 Health Check

```bash
# Health check
curl http://localhost:8080/health

# Réponse attendue :
# {
#   "service": "dvig",
#   "status": "healthy",
#   "timestamp": "2025-01-28T...",
#   "version": "0.1.1"
# }
```

#### 3.2 Vérifier Logs

```bash
# Logs Docker
docker logs dvig-stinger

# Ou avec docker-compose
docker-compose -f docker-compose.stinger.yml logs -f

# Vérifier démarrage réussi
docker logs dvig-stinger | grep "Application startup complete"
```

#### 3.3 Vérifier Processus

```bash
# Vérifier container actif
docker ps | grep dvig-stinger

# Vérifier port
netstat -tlnp | grep 8080
# ou
ss -tlnp | grep 8080
```

---

## ✅ Validation STINGER

### Étape 1 : Smoke Tests API (7 tests)

#### Test 1 : Health Check

```bash
curl -i http://stinger.doreviateam.com:8080/health

# Attendu : 200 OK
```

#### Test 2 : Docs (Swagger UI) - Désactivé

```bash
curl -i http://stinger.doreviateam.com:8080/docs

# Attendu : 404 Not Found (désactivé en STINGER - PROD-like)
```

#### Test 3 : OpenAPI Schema - Désactivé

```bash
curl -i http://stinger.doreviateam.com:8080/openapi.json

# Attendu : 404 Not Found (désactivé en STINGER - PROD-like)
```

#### Test 4 : Ingest sans Auth (401)

```bash
curl -i -X POST http://stinger.doreviateam.com:8080/ingest \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"odoo.stinger.core","data":{}}'

# Attendu : 401 Unauthorized
# {
#   "detail": {
#     "status": "error",
#     "error": {
#       "code": "AUTH_MISSING",
#       "message": "Header Authorization manquant"
#     }
#   }
# }
```

#### Test 5 : Ingest Token Invalide (401)

```bash
curl -i -X POST http://stinger.doreviateam.com:8080/ingest \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"odoo.stinger.core","data":{}}'

# Attendu : 401 Unauthorized
# {
#   "detail": {
#     "status": "error",
#     "error": {
#       "code": "INVALID_TOKEN",
#       "message": "Token invalide ou expiré"
#     }
#   }
# }
```

#### Test 6 : Ingest Univers Mismatch (403)

```bash
TOKEN="dvig_..."  # Token avec univers=odoo
curl -i -X POST http://stinger.doreviateam.com:8080/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"sylius.prod","data":{}}'

# Attendu : 403 Forbidden
# {
#   "detail": {
#     "status": "error",
#     "error": {
#       "code": "UNIVERSE_MISMATCH",
#       "message": "Source 'sylius.prod' ne correspond pas à l'univers 'odoo'"
#     }
#   }
# }
```

#### Test 7 : Ingest Cas Nominal (201)

```bash
TOKEN="dvig_..."  # Token STINGER valide
curl -i -X POST http://stinger.doreviateam.com:8080/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test.stinger","source":"odoo.stinger.core","data":{"test":"stinger"}}'

# Attendu : 201 Created
# {
#   "status": "accepted",
#   "event_id": "uuid",
#   "ts": "2025-01-28T..."
# }
```

**Résultat** : ✅ 7/7 tests passent

---

### Étape 2 : Validation Reload Tokens

#### Test 1 : Rotation Token (Overlap)

```bash
# 1. Ajouter nouveau token dans /etc/dvig/tokens.yml
# 2. Attendre reload automatique (60s) ou envoyer SIGHUP
docker kill --signal=HUP dvig-stinger

# 3. Vérifier ancien token toujours accepté
TOKEN_OLD="dvig_..."
curl -X POST http://stinger.doreviateam.com:8080/ingest \
  -H "Authorization: Bearer $TOKEN_OLD" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test.rotation","source":"odoo.stinger.core","data":{}}'

# Attendu : 201 Created

# 4. Vérifier nouveau token accepté
TOKEN_NEW="dvig_..."
curl -X POST http://stinger.doreviateam.com:8080/ingest \
  -H "Authorization: Bearer $TOKEN_NEW" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test.rotation","source":"odoo.stinger.core","data":{}}'

# Attendu : 201 Created
```

#### Test 2 : Révocation Token

```bash
# 1. Modifier status token à "revoked" dans /etc/dvig/tokens.yml
# 2. Reload (SIGHUP ou attendre intervalle)
docker kill --signal=HUP dvig-stinger

# 3. Vérifier token révoqué rejeté
TOKEN_REVOKED="dvig_..."
curl -i -X POST http://stinger.doreviateam.com:8080/ingest \
  -H "Authorization: Bearer $TOKEN_REVOKED" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test.revoked","source":"odoo.stinger.core","data":{}}'

# Attendu : 401 Unauthorized
# {
#   "detail": {
#     "status": "error",
#     "error": {
#       "code": "TOKEN_REVOKED",
#       "message": "Token révoqué ou désactivé"
#     }
#   }
# }
```

**Résultat** : ✅ Reload fonctionne correctement

---

### Étape 3 : Validation Logs

#### Vérifier Format JSON

```bash
# Vérifier logs JSON
docker logs dvig-stinger | jq .

# Vérifier présence champs requis
docker logs dvig-stinger | jq 'select(.event == "ingest_event_accepted") | {event_id, tenant, univers, token_id}'
```

#### Vérifier Sécurité

```bash
# Vérifier absence token brut/hash dans logs
docker logs dvig-stinger | grep -i "dvig_" || echo "✅ Aucun token brut trouvé"
docker logs dvig-stinger | grep -i "sha256:" || echo "✅ Aucun hash trouvé"
```

**Résultat** : ✅ Logs structurés et sécurisés

---

### Étape 4 : Intégration Odoo STINGER (si applicable)

#### Test Intégration

```bash
# Depuis Odoo STINGER, envoyer événement vers DVIG
# Vérifier réception et traitement

# Vérifier logs DVIG
docker logs dvig-stinger | grep "ingest_event_accepted"
```

**Résultat** : ✅ Intégration fonctionne (si applicable)

---

### Étape 5 : Monitoring STINGER

#### Vérifier Métriques

```bash
# Si métriques activées
curl http://stinger.doreviateam.com:9090/metrics
```

#### Vérifier Health Check

```bash
# Health check périodique
watch -n 5 'curl -s http://stinger.doreviateam.com:8080/health | jq .'
```

**Résultat** : ✅ Monitoring actif (si configuré)

---

## 📋 Checklist Complète

### Préparation

- [ ] Validation LAB 100% acquise
- [ ] Tokens STINGER générés (séparés de LAB)
- [ ] Fichier `tokens.yml` STINGER créé
- [ ] Variables d'environnement STINGER configurées
- [ ] Image Docker PROD disponible (`dorevia/dvig:0.1.2-auth`) ⚠️ Même image que PROD
- [ ] Serveur STINGER accessible
- [ ] Répertoires créés sur serveur

### Déploiement

- [ ] Configuration copiée sur serveur
- [ ] Service Docker lancé
- [ ] Health check OK (200)
- [ ] Logs démarrage OK
- [ ] Port 8080 accessible
- [ ] Container actif

### Validation

- [ ] Smoke test 1 : Health (200) ✅
- [ ] Smoke test 2 : Docs (404 - désactivé) ✅
- [ ] Smoke test 3 : OpenAPI (404 - désactivé) ✅
- [ ] Smoke test 4 : Ingest sans auth (401) ✅
- [ ] Smoke test 5 : Token invalide (401) ✅
- [ ] Smoke test 6 : Univers mismatch (403) ✅
- [ ] Smoke test 7 : Cas nominal (201) ✅
- [ ] Reload rotation (overlap) ✅
- [ ] Reload révocation ✅
- [ ] Logs format JSON ✅
- [ ] Logs sécurisés (pas de token/hash) ✅
- [ ] Intégration Odoo (si applicable) ✅
- [ ] Monitoring actif (si configuré) ✅

### Documentation

- [ ] Tokens STINGER documentés
- [ ] Configuration STINGER documentée
- [ ] Procédure déploiement documentée
- [ ] Résultats validation documentés

---

## 🔧 Troubleshooting

### Problème 1 : Service ne démarre pas

**Symptôme** : Container s'arrête immédiatement

**Solutions** :
```bash
# Vérifier logs
docker logs dvig-stinger

# Vérifier tokens.yml
cat /etc/dvig/tokens.yml | yq .

# Vérifier permissions
ls -la /etc/dvig/tokens.yml

# Vérifier variables d'environnement
docker exec dvig-stinger env | grep DVIG
```

---

### Problème 2 : 401 Unauthorized avec token valide

**Symptôme** : Token valide rejeté

**Solutions** :
```bash
# Vérifier hash token
TOKEN="dvig_..."
echo -n "$TOKEN" | sha256sum

# Vérifier hash dans tokens.yml
cat /etc/dvig/tokens.yml | grep -A 5 "token_hash"

# Vérifier reload
docker kill --signal=HUP dvig-stinger
docker logs dvig-stinger | grep "reload"
```

---

### Problème 3 : 503 Service Unavailable

**Symptôme** : Erreur backend indisponible

**Solutions** :
```bash
# Vérifier tokens.yml accessible
docker exec dvig-stinger cat /etc/dvig/tokens.yml

# Vérifier is_available()
docker logs dvig-stinger | grep "available"

# Vérifier format YAML
cat /etc/dvig/tokens.yml | yq .
```

---

### Problème 4 : Reload ne fonctionne pas

**Symptôme** : Tokens modifiés non pris en compte

**Solutions** :
```bash
# Vérifier SIGHUP
docker kill --signal=HUP dvig-stinger
docker logs dvig-stinger | grep "SIGHUP"

# Vérifier intervalle
docker exec dvig-stinger env | grep DVIG_TOKENS_RELOAD_INTERVAL

# Vérifier logs reload
docker logs dvig-stinger | grep "reload"
```

---

## 📚 Annexes

### A. Commandes Utiles

```bash
# Redémarrer service
docker-compose -f docker-compose.stinger.yml restart

# Arrêter service
docker-compose -f docker-compose.stinger.yml down

# Voir logs en temps réel
docker-compose -f docker-compose.stinger.yml logs -f

# Reload tokens (SIGHUP)
docker kill --signal=HUP dvig-stinger

# Vérifier version
docker exec dvig-stinger python -c "import dvig; print(dvig.__version__)"
```

### B. Variables d'Environnement Complètes

Voir `README_FASTAPI_P1.md` pour liste complète.

### C. Documents de Référence

- **Préconisations STINGER** : `PRECONISATIONS_EXECUTION_STINGER_P1_AUTH_TOKEN.md` ⭐ **À LIRE EN PRIORITÉ**
- `ROADMAP_DEPLOIEMENT_P1_AUTH_TOKEN.md` : Roadmap globale
- `VALIDATION_OPERATIONNELLE_LAB_DVIG_P1_Auth_Token_v1.0.md` : Procédure validation LAB
- `README_FASTAPI_P1.md` : Documentation complète P1
- `RESULTATS_VALIDATION_LAB.md` : Résultats validation LAB

---

## 🎯 Critères de Validation STINGER

La validation STINGER est **ACQUISE** si :

- [ ] ✅ Tous les smoke tests passent (7/7)
- [ ] ✅ Service stable (pas d'erreurs critiques)
- [ ] ✅ Reload tokens fonctionne sans redémarrage
- [ ] ✅ Logs exploitables et sûrs (format JSON, pas de token/hash)
- [ ] ✅ Robustesse validée (restart, stop/start)
- [ ] ✅ Aucun incident bloquant

**Note** : Aucun test unitaire ou d'intégration n'est requis en STINGER. STINGER valide **l'exploitation**, pas la logique métier.

**Formulation officielle** (à consigner une fois validé) :

> **DVIG P1 Auth/Token — STINGER VALIDÉ**  
> Le service a été déployé dans des conditions équivalentes à la production.  
> Les mécanismes d'authentification, de reload des tokens, de logs et de redémarrage ont été validés sans régression.

**Statut** : ⏳ En attente déploiement

---

## 🚀 Prochaine Étape

**Après validation STINGER** : Déploiement PROD

Voir `ROADMAP_DEPLOIEMENT_P1_AUTH_TOKEN.md` pour détails.

---

**Dernière mise à jour** : 2025-01-28


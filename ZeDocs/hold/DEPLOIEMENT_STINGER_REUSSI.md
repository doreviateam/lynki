# ✅ Déploiement STINGER Réussi - DVIG P1 Auth/Token

**Date** : 2025-01-28  
**Environnement** : STINGER  
**Image** : `dorevia/dvig:0.1.2-auth`  
**Port** : 8082 (8080 occupé par autre service)

---

## 📊 Résumé

### ✅ Déploiement Réussi

- **Container** : `dvig-stinger`
- **Image** : `dorevia/dvig:0.1.2-auth`
- **Port** : 8082 (mappé vers 8080 interne)
- **Status** : ✅ Actif
- **Health Check** : ✅ OK

---

## 🔧 Configuration Appliquée

### Port Modifié

**Raison** : Port 8080 déjà utilisé par un autre service.

**Solution** : Port externe changé à **8082** (port interne reste 8080).

```yaml
ports:
  - "8082:8080"  # Port 8082 pour éviter conflit
```

### Fichiers Déployés

- ✅ `/etc/dvig/tokens.yml` (permissions 0400)
- ✅ `/opt/dvig/docker-compose.stinger.yml`
- ✅ Réseau Docker : `dorevia-network`

---

## ✅ Vérifications

### Container Actif

```bash
docker ps | grep dvig-stinger
```

### Health Check

```bash
curl http://localhost:8082/health
```

**Réponse attendue** :
```json
{
  "service": "dvig",
  "status": "healthy",
  "timestamp": "2025-01-28T...",
  "version": "0.1.2"
}
```

### Logs

```bash
docker logs dvig-stinger
```

---

## 🧪 Prochaines Étapes - Validation STINGER

### 1. Smoke Tests API (7 tests)

#### Test 1 : Health Check

```bash
curl -i http://localhost:8082/health
# Attendu : 200 OK
```

#### Test 2 : Docs (désactivé)

```bash
curl -i http://localhost:8082/docs
# Attendu : 404 Not Found (PROD-like)
```

#### Test 3 : OpenAPI (désactivé)

```bash
curl -i http://localhost:8082/openapi.json
# Attendu : 404 Not Found (PROD-like)
```

#### Test 4 : Ingest sans Auth (401)

```bash
curl -i -X POST http://localhost:8082/ingest \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"odoo.stinger.core","data":{}}'
# Attendu : 401 Unauthorized
```

#### Test 5 : Token Invalide (401)

```bash
curl -i -X POST http://localhost:8082/ingest \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"odoo.stinger.core","data":{}}'
# Attendu : 401 Unauthorized
```

#### Test 6 : Univers Mismatch (403)

```bash
# Utiliser token STINGER valide
TOKEN="dvig_..."  # Token brut (depuis token_stinger_brut.txt)
curl -i -X POST http://localhost:8082/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"sylius.prod","data":{}}'
# Attendu : 403 Forbidden (UNIVERSE_MISMATCH)
```

#### Test 7 : Cas Nominal (201)

```bash
# Utiliser token STINGER valide
TOKEN="dvig_..."  # Token brut (depuis token_stinger_brut.txt)
curl -i -X POST http://localhost:8082/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test.stinger","source":"odoo.stinger.core","data":{"test":"stinger"}}'
# Attendu : 201 Created
```

### 2. Validation Reload Tokens

#### Rotation Token (Overlap)

```bash
# 1. Ajouter nouveau token dans /etc/dvig/tokens.yml
# 2. Reload (SIGHUP ou attendre 60s)
docker kill --signal=HUP dvig-stinger

# 3. Vérifier ancien token toujours accepté
# 4. Vérifier nouveau token accepté
```

#### Révocation Token

```bash
# 1. Modifier status token à "revoked" dans /etc/dvig/tokens.yml
# 2. Reload
docker kill --signal=HUP dvig-stinger

# 3. Vérifier token révoqué rejeté (401 TOKEN_REVOKED)
```

### 3. Validation Logs

```bash
# Vérifier format JSON
docker logs dvig-stinger | jq .

# Vérifier présence champs requis
docker logs dvig-stinger | jq 'select(.event == "ingest_event_accepted") | {event_id, tenant, univers, token_id}'

# Vérifier absence token brut/hash
docker logs dvig-stinger | grep -i "dvig_" || echo "✅ Aucun token brut"
docker logs dvig-stinger | grep -i "sha256:" || echo "✅ Aucun hash"
```

### 4. Robustesse

```bash
# Restart
docker restart dvig-stinger
sleep 5
curl http://localhost:8082/health

# Stop/Start
docker stop dvig-stinger
docker start dvig-stinger
sleep 5
curl http://localhost:8082/health
```

---

## 📋 Checklist Validation STINGER

### Smoke Tests

- [ ] Test 1 : Health (200) ✅
- [ ] Test 2 : Docs (404) 
- [ ] Test 3 : OpenAPI (404)
- [ ] Test 4 : Ingest sans auth (401)
- [ ] Test 5 : Token invalide (401)
- [ ] Test 6 : Univers mismatch (403)
- [ ] Test 7 : Cas nominal (201)

### Reload Tokens

- [ ] Rotation (overlap)
- [ ] Révocation
- [ ] Reload intervalle
- [ ] Reload SIGHUP

### Logs

- [ ] Format JSON
- [ ] Présence champs requis
- [ ] Absence token brut/hash

### Robustesse

- [ ] Restart OK
- [ ] Stop/Start OK
- [ ] Tokens rechargés après restart

---

## 🔧 Commandes Utiles

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

# Health check
curl http://localhost:8082/health | jq .

# Vérifier container
docker ps | grep dvig-stinger
```

---

## 📝 Notes

- **Port** : 8082 (au lieu de 8080) pour éviter conflit
- **Image** : `dorevia/dvig:0.1.2-auth` (même que PROD)
- **Config** : PROD-like (docs désactivées, logs JSON)

---

## 🎯 Prochaine Étape

**Exécuter les smoke tests** pour valider STINGER.

Voir `GUIDE_DEPLOIEMENT_STINGER_P1_AUTH_TOKEN.md` section "Validation STINGER" pour détails.

---

**Dernière mise à jour** : 2025-01-28


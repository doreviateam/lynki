# 🚀 Guide de Validation LAB Rapide - DVIG P1

**Date** : 2025-01-28  
**Objectif** : Valider rapidement P1 Auth/Token en local

---

## ⚡ Démarrage Rapide

### 1. Préparer l'environnement

```bash
cd /opt/dorevia-plateform/sources/dvig
source venv/bin/activate
```

### 2. Générer un token

```bash
python -m dvig.cli.token_gen --tenant rehtse --univers odoo
```

**Sortie** :
```
TOKEN=dvig_XXXXXXXX...
HASH=sha256:XXXXXXXX...
```

### 3. Créer tokens.yml

Le fichier `conf/tokens.yml` est déjà créé avec un token de test.

**Token de test disponible** :
- Token brut : `dvig_BOsf1GpDq8Keb4xTD6kDguDuLsTuxpDvV6VUPSZHhpo`
- Hash : `sha256:4af71fa57810e6ef4f410c2329989aaf9dbdcd6cf86fd933748765ef1327391e`

### 4. Lancer DVIG

**Note** : Si le port 8080 est occupé, utiliser un autre port :

```bash
export DVIG_AUTH_ENABLED=1
export DVIG_TOKENS_FILE=./conf/tokens.yml
export DVIG_DOCS_ENABLED=1
export DVIG_OPENAPI_ENABLED=1
export DVIG_LOG_FORMAT=console
export DVIG_PORT=8081  # Si 8080 occupé

python -m dvig.api_fastapi
```

Le service démarre sur `http://0.0.0.0:8080` (ou port configuré)

**Note** : Si 8080 est occupé, utiliser 8081 :
```bash
export DVIG_PORT=8081
```

Puis remplacer `8080` par `8081` dans les commandes curl ci-dessous.

**Vérifier le port** :
```bash
# Vérifier si 8080 est libre
lsof -i :8080

# Si occupé, tuer le processus ou utiliser autre port
# kill <PID> ou export DVIG_PORT=8081
```

---

## 🧪 Smoke Tests

### Test 1 : Health Check

```bash
# Port 8080 (défaut) ou 8081 si 8080 occupé
curl -i http://127.0.0.1:8080/health
# ou
curl -i http://127.0.0.1:8081/health
```

**Attendu** : `200 OK`

### Test 2 : Documentation

```bash
# Port 8080 (défaut) ou 8081 si 8080 occupé
curl -i http://127.0.0.1:8080/docs
curl -i http://127.0.0.1:8080/openapi.json
# ou
curl -i http://127.0.0.1:8081/docs
curl -i http://127.0.0.1:8081/openapi.json
```

**Attendu** : `200 OK`

### Test 3 : Ingest sans auth (401)

```bash
# Port 8080 (défaut) ou 8081 si 8080 occupé
curl -i -X POST http://127.0.0.1:8080/ingest \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"odoo.lab.core","data":{}}'
# ou
curl -i -X POST http://127.0.0.1:8081/ingest \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"odoo.lab.core","data":{}}'
```

**Attendu** : `401 Unauthorized` avec `AUTH_MISSING`

### Test 4 : Ingest token invalide (401)

```bash
# Port 8080 (défaut) ou 8081 si 8080 occupé
curl -i -X POST http://127.0.0.1:8080/ingest \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"odoo.lab.core","data":{}}'
```

**Attendu** : `401 Unauthorized` avec `INVALID_TOKEN`

### Test 5 : Ingest univers mismatch (403)

```bash
# Port 8080 (défaut) ou 8081 si 8080 occupé
curl -i -X POST http://127.0.0.1:8080/ingest \
  -H "Authorization: Bearer dvig_BOsf1GpDq8Keb4xTD6kDguDuLsTuxpDvV6VUPSZHhpo" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","source":"sylius.prod","data":{}}'
```

**Attendu** : `403 Forbidden` avec `UNIVERSE_MISMATCH`

### Test 6 : Ingest cas nominal (201)

```bash
# Port 8080 (défaut) ou 8081 si 8080 occupé
curl -i -X POST http://127.0.0.1:8080/ingest \
  -H "Authorization: Bearer dvig_BOsf1GpDq8Keb4xTD6kDguDuLsTuxpDvV6VUPSZHhpo" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"manual.test","source":"odoo.lab.core","data":{"msg":"hello"}}'
```

**Attendu** : `201 Created` avec `event_id` et `ts`

---

## ✅ Checklist Validation

- [ ] Service démarre sans erreur
- [ ] Health check OK (200)
- [ ] Docs accessibles (200)
- [ ] Ingest sans auth → 401 AUTH_MISSING
- [ ] Ingest token invalide → 401 INVALID_TOKEN
- [ ] Ingest univers mismatch → 403 UNIVERSE_MISMATCH
- [ ] Ingest cas nominal → 201 Created
- [ ] Logs structurés corrects
- [ ] Pas de token/hash dans logs

---

## 📝 Notes

- **Token de test** : `dvig_BOsf1GpDq8Keb4xTD6kDguDuLsTuxpDvV6VUPSZHhpo`
- **Fichier tokens** : `conf/tokens.yml`
- **Port** : `8080` (défaut) ou `8081` si 8080 occupé
- **Logs** : Console (format lab)
- **Note** : Si port 8080 occupé, utiliser `export DVIG_PORT=8081` et remplacer `8080` par `8081` dans les commandes curl

---

**Dernière mise à jour** : 2025-01-28


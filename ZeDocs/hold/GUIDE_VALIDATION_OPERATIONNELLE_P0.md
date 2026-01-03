# 🚀 Guide de Validation Opérationnelle - P0 FastAPI

**Date** : 2025-01-28  
**Statut** : Code P0 terminé ✅ - Validation opérationnelle à effectuer  
**Spécification** : `spec_fastDiv.md` v1.0

---

## 📋 Objectif

Valider que l'implémentation FastAPI fonctionne correctement en environnement opérationnel (LAB puis production).

---

## ✅ Prérequis

- ✅ Code P0 implémenté et validé
- ✅ Docker installé
- ✅ Accès au repository Docker (si nécessaire)
- ✅ Environnement LAB configuré

---

## 🔧 Étape 1 : Build Docker

### 1.1 Construction de l'image

```bash
cd /opt/dorevia-plateform/sources/dvig

# Build l'image
docker build -f docker/Dockerfile -t dorevia/dvig:0.1.1-fastapi .
```

### 1.2 Vérification

```bash
# Vérifier que l'image est créée
docker images | grep dvig

# Vérifier les labels
docker inspect dorevia/dvig:0.1.1-fastapi | grep -A 5 Labels
```

**Résultat attendu** :
- Image `dorevia/dvig:0.1.1-fastapi` créée
- Label `version="0.1.1"` présent

---

## 🧪 Étape 2 : Tests Locaux

### 2.1 Démarrage du conteneur

```bash
# Lancer le conteneur
docker run -d \
  --name dvig-fastapi-test \
  -p 18120:8080 \
  -e DVIG_HOST=0.0.0.0 \
  -e DVIG_PORT=8080 \
  -e DVIG_LOG_LEVEL=info \
  dorevia/dvig:0.1.1-fastapi
```

### 2.2 Vérification des logs

```bash
# Vérifier les logs de démarrage
docker logs dvig-fastapi-test

# Résultat attendu : uvicorn démarre sur le port 8080
```

### 2.3 Test Health Check

```bash
# Test GET /health
curl -v http://127.0.0.1:18120/health
```

**Résultat attendu** :
```json
{
  "service": "dvig",
  "status": "healthy",
  "timestamp": "2025-01-28T...",
  "version": "0.1.1"
}
```

**Code HTTP** : `200 OK`

---

### 2.4 Test OpenAPI

```bash
# Test GET /openapi.json
curl -v http://127.0.0.1:18120/openapi.json
```

**Résultat attendu** :
- Code HTTP : `200 OK`
- JSON OpenAPI valide avec endpoints `/health` et `/ingest`

```bash
# Test GET /docs (Swagger UI)
curl -v http://127.0.0.1:18120/docs
```

**Résultat attendu** :
- Code HTTP : `200 OK`
- Page HTML Swagger UI accessible

---

### 2.5 Test Ingest (Succès)

```bash
# Test POST /ingest avec payload valide
curl -X POST http://127.0.0.1:18120/ingest \
  -H 'Content-Type: application/json' \
  -v \
  -d '{
    "event_type": "manual.test",
    "source": "odoo.lab.core",
    "data": {
      "msg": "hello"
    }
  }'
```

**Résultat attendu** :
```json
{
  "status": "accepted",
  "event_id": "uuid-v4",
  "ts": "2025-01-28T...Z"
}
```

**Code HTTP** : `201 Created`

**Vérification logs** :
```bash
docker logs dvig-fastapi-test | grep "INGEST"
```

**Résultat attendu** : Log avec `event_id`, `event_type`, `source`, `ts`, `keys`

---

### 2.6 Test Ingest avec Timestamp

```bash
# Test POST /ingest avec timestamp fourni
curl -X POST http://127.0.0.1:18120/ingest \
  -H 'Content-Type: application/json' \
  -v \
  -d '{
    "event_type": "manual.test",
    "source": "odoo.lab.core",
    "timestamp": "2025-01-28T10:30:00Z",
    "data": {
      "msg": "test with timestamp"
    }
  }'
```

**Résultat attendu** :
- Code HTTP : `201 Created`
- `ts` dans la réponse = timestamp normalisé (ISO8601 UTC)

---

### 2.7 Test Ingest avec Timestamp Invalide

```bash
# Test POST /ingest avec timestamp invalide
curl -X POST http://127.0.0.1:18120/ingest \
  -H 'Content-Type: application/json' \
  -v \
  -d '{
    "event_type": "manual.test",
    "source": "odoo.lab.core",
    "timestamp": "invalid-timestamp",
    "data": {
      "msg": "test invalid timestamp"
    }
  }'
```

**Résultat attendu** :
- Code HTTP : `201 Created` (timestamp invalide génère un nouveau)
- `ts` dans la réponse = nouveau timestamp généré
- Log avec warning "Invalid timestamp format"

---

### 2.8 Test Validation Schéma (Erreur)

```bash
# Test POST /ingest avec payload invalide (event_type manquant)
curl -X POST http://127.0.0.1:18120/ingest \
  -H 'Content-Type: application/json' \
  -v \
  -d '{
    "source": "odoo.lab.core",
    "data": {}
  }'
```

**Résultat attendu** :
- Code HTTP : `422 Unprocessable Entity`
- Erreur de validation Pydantic

---

### 2.9 Nettoyage

```bash
# Arrêter et supprimer le conteneur de test
docker stop dvig-fastapi-test
docker rm dvig-fastapi-test
```

---

## 🏗️ Étape 3 : Déploiement LAB

### 3.1 Configuration docker-compose

Créer ou modifier `units/dvig/docker-compose.lab.yml` :

```yaml
services:
  dvig:
    image: dorevia/dvig:0.1.1-fastapi
    container_name: dvig-fastapi-lab
    ports:
      - "18120:8080"
    environment:
      DVIG_HOST: "0.0.0.0"
      DVIG_PORT: "8080"
      DVIG_LOG_LEVEL: "info"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 3.2 Déploiement

```bash
cd /opt/dorevia-plateform/units/dvig

# Démarrer le service
docker-compose -f docker-compose.lab.yml up -d

# Vérifier les logs
docker-compose -f docker-compose.lab.yml logs -f dvig
```

### 3.3 Validation

Répéter les tests de l'**Étape 2** avec l'URL du LAB.

---

## 🔗 Étape 4 : Intégration Odoo

### 4.1 Configuration Odoo

Configurer Odoo pour appeler DVIG (selon votre module Odoo) :

```python
# Exemple d'appel depuis Odoo
import requests

response = requests.post(
    'http://dvig:8080/ingest',
    json={
        'event_type': 'odoo.invoice.posted',
        'source': 'odoo.lab.core',
        'data': {
            'invoice_id': 123,
            'amount': 1000.00
        }
    },
    headers={'Content-Type': 'application/json'},
    timeout=10
)

if response.status_code == 201:
    result = response.json()
    event_id = result['event_id']
    # Traiter le succès
```

### 4.2 Test depuis Odoo

1. Déclencher un événement dans Odoo (ex: valider une facture)
2. Vérifier que l'appel arrive à DVIG
3. Vérifier les logs DVIG
4. Vérifier la réponse (event_id, status)

---

## ✅ Checklist de Validation

### Code
- [x] Structure `dvig/api_fastapi/` correcte
- [x] Endpoints `/health` et `/ingest` implémentés
- [x] Version `0.1.1` cohérente
- [x] Dockerfile corrigé

### Build & Déploiement
- [ ] Image Docker construite avec succès
- [ ] Conteneur démarre sans erreur
- [ ] Healthcheck fonctionne

### Tests Endpoints
- [ ] `GET /health` → 200 avec format correct
- [ ] `GET /openapi.json` → 200
- [ ] `GET /docs` → 200 (Swagger UI)
- [ ] `POST /ingest` (succès) → 201 avec `event_id`
- [ ] `POST /ingest` (timestamp) → normalisation OK
- [ ] `POST /ingest` (timestamp invalide) → génération nouveau timestamp
- [ ] `POST /ingest` (payload invalide) → 422

### Logs
- [ ] Logs de démarrage corrects
- [ ] Logs d'ingestion avec `event_id`
- [ ] Logs de warning pour timestamp invalide

### Intégration
- [ ] Appel depuis Odoo fonctionne
- [ ] Réponse `event_id` reçue par Odoo
- [ ] Traçabilité complète (logs DVIG)

---

## 📊 Critères d'Acceptation (DoD)

### P0 - Validation Opérationnelle

- [ ] `GET /health` → 200 ✅
- [ ] `GET /openapi.json` → 200 ✅
- [ ] `POST /ingest` → 201 ✅
- [ ] Appel depuis Odoo OK ⚠️
- [ ] Logs DVIG confirment réception ✅

**Statut** : Code prêt ✅ - Tests opérationnels à valider ⚠️

---

## 🐛 Dépannage

### Problème : Conteneur ne démarre pas

```bash
# Vérifier les logs
docker logs dvig-fastapi-test

# Vérifier les imports Python
docker run --rm dorevia/dvig:0.1.1-fastapi python -c "from dvig.api_fastapi.app import app; print('OK')"
```

### Problème : Endpoint non accessible

```bash
# Vérifier que le port est exposé
docker ps | grep dvig

# Vérifier depuis l'intérieur du conteneur
docker exec dvig-fastapi-test curl http://localhost:8080/health
```

### Problème : Erreur d'import

```bash
# Vérifier la structure
docker run --rm dorevia/dvig:0.1.1-fastapi ls -la /app/dvig/api_fastapi/
```

---

## 📝 Notes

- Les tests doivent être effectués dans l'ordre (1 → 4)
- En cas d'erreur, vérifier les logs Docker en premier
- La validation Odoo nécessite que le module Odoo soit configuré

---

**Fin du guide**  
*Document créé le 2025-01-28*


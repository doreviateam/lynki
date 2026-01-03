# 🚀 DVIG FastAPI – P0

**Dorevia Vault Integration Gateway - FastAPI Implementation**

[![Version](https://img.shields.io/badge/version-0.1.1-blue.svg)](https://github.com/dorevia/dvig)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![Status](https://img.shields.io/badge/status-P0%20Complete-success.svg)](https://github.com/dorevia/dvig)

---

## 📋 Vue d'Ensemble

**DVIG FastAPI** est la nouvelle implémentation de la passerelle d'intégration Dorevia Vault en **FastAPI**. Cette version remplace progressivement l'implémentation Flask legacy et devient **la gateway officielle** de l'architecture Dorevia.

### Architecture

```
Odoo → DVIG (FastAPI) → Vault
```

### Statut P0

✅ **Code P0 terminé à 100%**  
⚠️ **Validation opérationnelle en cours**

---

## ✨ Fonctionnalités P0

### Endpoints Disponibles

| Endpoint | Méthode | Description | Statut |
|----------|---------|-------------|--------|
| `/health` | `GET` | Health check du service | ✅ |
| `/ingest` | `POST` | Ingestion d'événements | ✅ |
| `/openapi.json` | `GET` | Schéma OpenAPI | ✅ |
| `/docs` | `GET` | Documentation Swagger UI | ✅ |

### Caractéristiques

- ✅ **Validation automatique** : Schémas Pydantic pour validation des payloads
- ✅ **Normalisation timestamp** : Gestion automatique des timestamps ISO8601
- ✅ **Génération event_id** : UUID v4 pour chaque événement ingéré
- ✅ **Logging structuré** : Logs avec traçabilité complète
- ✅ **OpenAPI automatique** : Documentation interactive Swagger UI

---

## 🚀 Installation

### Prérequis

- Python 3.9+
- Docker (optionnel, pour déploiement conteneurisé)

### Installation Locale

```bash
# Cloner le dépôt
cd /opt/dorevia-plateform/sources/dvig

# Créer l'environnement virtuel
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

### Dépendances

Les dépendances principales sont :

- `fastapi>=0.104.0` - Framework web moderne
- `uvicorn[standard]>=0.24.0` - Serveur ASGI
- `pydantic>=2.0.0` - Validation de données

Voir `requirements.txt` pour la liste complète.

---

## 🏃 Démarrage

### Mode Développement

```bash
# Activer l'environnement virtuel
source venv/bin/activate

# Lancer le serveur
python -m dvig.api_fastapi
```

Le serveur démarre sur `http://0.0.0.0:8080` par défaut.

### Variables d'Environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `DVIG_HOST` | Adresse d'écoute | `0.0.0.0` |
| `DVIG_PORT` | Port d'écoute | `8080` |
| `DVIG_LOG_LEVEL` | Niveau de log (debug, info, warn, error) | `info` |

**Exemple** :
```bash
export DVIG_HOST=0.0.0.0
export DVIG_PORT=8080
export DVIG_LOG_LEVEL=info

python -m dvig.api_fastapi
```

---

## 🐳 Déploiement Docker

### Build de l'Image

```bash
cd /opt/dorevia-plateform/sources/dvig

docker build -f docker/Dockerfile -t dorevia/dvig:0.1.1-fastapi .
```

### Exécution

```bash
docker run -d \
  --name dvig-fastapi \
  -p 18120:8080 \
  -e DVIG_HOST=0.0.0.0 \
  -e DVIG_PORT=8080 \
  -e DVIG_LOG_LEVEL=info \
  dorevia/dvig:0.1.1-fastapi
```

### Docker Compose

```yaml
services:
  dvig:
    image: dorevia/dvig:0.1.1-fastapi
    container_name: dvig-fastapi
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

---

## 📖 API Documentation

### GET /health

Health check du service.

**Requête** :
```bash
curl http://localhost:8080/health
```

**Réponse 200** :
```json
{
  "service": "dvig",
  "status": "healthy",
  "timestamp": "2025-01-28T10:30:00.123456+00:00",
  "version": "0.1.1"
}
```

---

### POST /ingest

Ingestion d'un événement.

**Requête** :
```bash
curl -X POST http://localhost:8080/ingest \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "manual.test",
    "source": "odoo.lab.core",
    "timestamp": "2025-01-28T10:30:00Z",
    "data": {
      "msg": "hello"
    }
  }'
```

**Schéma Request** :
```json
{
  "event_type": "string (requis, min 1 caractère)",
  "source": "string (requis, min 1 caractère)",
  "timestamp": "string ISO8601 UTC (optionnel)",
  "data": "object (optionnel, défaut: {})"
}
```

**Réponse 201** :
```json
{
  "status": "accepted",
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "ts": "2025-01-28T10:30:00.123456+00:00"
}
```

**Comportement** :
- ✅ Validation automatique du schéma (Pydantic)
- ✅ Normalisation du timestamp (ISO8601 UTC)
- ✅ Génération d'un `event_id` (UUID v4)
- ✅ Logging de l'événement avec traçabilité
- ✅ Retour immédiat `accepted`

**Codes de Réponse** :
- `201 Created` : Événement accepté avec succès
- `422 Unprocessable Entity` : Erreur de validation du schéma

---

### GET /openapi.json

Schéma OpenAPI au format JSON.

**Requête** :
```bash
curl http://localhost:8080/openapi.json
```

**Réponse 200** :
```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "DVIG - Dorevia Vault Integration Gateway",
    "version": "0.1.1"
  },
  "paths": {
    "/health": {...},
    "/ingest": {...}
  }
}
```

---

### GET /docs

Documentation interactive Swagger UI.

**Accès** :
Ouvrir dans un navigateur : `http://localhost:8080/docs`

Interface graphique pour tester les endpoints directement.

---

## 🧪 Tests

### Tests Manuels

#### Test Health Check

```bash
curl http://localhost:8080/health
```

#### Test Ingest (Succès)

```bash
curl -X POST http://localhost:8080/ingest \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "manual.test",
    "source": "odoo.lab.core",
    "data": {"msg": "hello"}
  }'
```

#### Test Ingest (Timestamp Invalide)

```bash
curl -X POST http://localhost:8080/ingest \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "manual.test",
    "source": "odoo.lab.core",
    "timestamp": "invalid-timestamp",
    "data": {}
  }'
```

**Résultat attendu** : Un nouveau timestamp est généré automatiquement.

#### Test Validation (Erreur)

```bash
curl -X POST http://localhost:8080/ingest \
  -H 'Content-Type: application/json' \
  -d '{
    "source": "odoo.lab.core"
  }'
```

**Résultat attendu** : `422 Unprocessable Entity` (event_type manquant)

---

## 📁 Structure du Projet

```
sources/dvig/
├── dvig/
│   ├── api/                    # Flask legacy (maintenu)
│   └── api_fastapi/            # FastAPI (nouveau)
│       ├── __init__.py
│       ├── __main__.py         # Point d'entrée
│       ├── app.py              # Application FastAPI
│       └── routes/
│           ├── __init__.py
│           ├── health.py       # Route /health
│           └── ingest.py       # Route /ingest
├── docker/
│   └── Dockerfile              # Image Docker
├── requirements.txt            # Dépendances Python
└── README_FASTAPI_P0.md       # Ce fichier
```

---

## 🔍 Logging

Les logs sont structurés et incluent :

- **Health Check** : Timestamp de chaque appel
- **Ingest** : `event_id`, `event_type`, `source`, `timestamp`, `data_keys`

**Exemple de log** :
```
INFO: INGEST event_id=550e8400-e29b-41d4-a716-446655440000 event_type=manual.test source=odoo.lab.core ts=2025-01-28T10:30:00.123456+00:00 keys=['msg']
```

---

## 🔄 Migration depuis Flask

### Stratégie

1. ✅ **Phase 1** : App FastAPI parallèle (complétée)
2. ✅ **Phase 2** : Bascule runtime Docker (complétée)
3. ⏳ **Phase 3** : Dépréciation Flask (future)

### Rollback

En cas de problème, retour possible vers Flask :

```dockerfile
# Dockerfile (rollback)
CMD ["python", "-m", "dvig.api"]  # Flask legacy
```

---

## 🚧 Prochaines Étapes (P1)

Les fonctionnalités suivantes sont prévues pour P1 :

- [ ] Base `/api/v1/*` pour endpoints métiers
- [ ] Authentification Bearer token / scopes
- [ ] Forward DVIG → Vault (preuve, hash, ledger)
- [ ] Gestion multi-tenant
- [ ] Retry automatique et résilience

---

## 📚 Documentation

- **Spécification** : `ZeDocs/spec_fastDiv.md`
- **Statut d'implémentation** : `ZeDocs/STATUT_IMPLEMENTATION_SPEC_FASTDIV.md`
- **Guide de validation** : `ZeDocs/GUIDE_VALIDATION_OPERATIONNELLE_P0.md`

---

## 🐛 Dépannage

### Problème : Le serveur ne démarre pas

**Vérifier** :
```bash
# Vérifier les imports
python -c "from dvig.api_fastapi.app import app; print('OK')"

# Vérifier les variables d'environnement
echo $DVIG_HOST $DVIG_PORT $DVIG_LOG_LEVEL
```

### Problème : Endpoint non accessible

**Vérifier** :
```bash
# Vérifier que le port est libre
netstat -tuln | grep 8080

# Vérifier les logs
docker logs dvig-fastapi  # Si Docker
```

### Problème : Erreur de validation

**Vérifier** :
- Format JSON valide
- Champs requis présents (`event_type`, `source`)
- Types de données corrects

Consulter `/docs` pour le schéma exact.

---

## 🤝 Contribution

Pour contribuer au projet :

1. Lire `CONTRIBUTING.md`
2. Créer une branche de feature
3. Implémenter les changements
4. Ajouter des tests
5. Soumettre une Pull Request

---

## 📄 Licence

Ce projet est sous licence **Apache 2.0**. Voir `LICENSE` pour plus de détails.

---

## 👥 Auteurs

**Dorevia Team**

---

## 🔗 Liens

- **Dorevia Vault** : [Documentation Vault](https://gitlab.example.com/dorevia/dorevia-vault)
- **Documentation Complète** : [docs.dorevia.io](https://docs.dorevia.io)

---

**Version** : 0.1.1  
**Dernière mise à jour** : 2025-01-28  
**Statut** : P0 Complete ✅


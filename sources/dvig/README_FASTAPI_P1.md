# DVIG FastAPI - P1 Auth/Token

**Version** : 0.1.1  
**Phase** : P1 - Authentification par Token  
**Date** : 2025-01-28

---

## 📋 Vue d'Ensemble

DVIG FastAPI P1 ajoute l'authentification par Bearer Token sur l'endpoint `/ingest`, avec un backend de stockage YAML pour les tokens. Cette phase sécurise l'API et prépare la conformité PDP/PPF 2026.

### Fonctionnalités P1

- ✅ Authentification Bearer Token sur `/ingest`
- ✅ Backend YAML pour stockage tokens (défaut)
- ✅ Validation source/univers (sécurité métier)
- ✅ Format erreurs standardisé (JSON structuré)
- ✅ Reload tokens (SIGHUP + intervalle)
- ✅ Logs structurés (JSON prod, console lab)
- ✅ CLI génération tokens
- ✅ Tests complets (35 tests)

---

## 🚀 Installation

### Prérequis

- Python 3.11+
- FastAPI, Uvicorn
- PyYAML, structlog, click

### Installation des dépendances

```bash
cd sources/dvig
pip install -r requirements.txt
```

### Dépendances P1

```
fastapi
uvicorn[standard]
pydantic
pyyaml>=6.0
structlog>=23.1.0
click>=8.0.0
```

---

## ⚙️ Configuration

### Variables d'Environnement

| Variable | Description | Défaut | Exemple |
|----------|-------------|--------|---------|
| `DVIG_AUTH_ENABLED` | Activer l'authentification | `1` | `1` (activé) ou `0` (désactivé) |
| `DVIG_TOKENS_FILE` | Chemin vers tokens.yml | `/etc/dvig/tokens.yml` ou `./conf/tokens.yml` | `/etc/dvig/tokens.yml` |
| `DVIG_TOKENS_RELOAD_INTERVAL` | Intervalle reload (secondes, 0=off) | `60` | `60` (1 minute) |
| `DVIG_TOKENS_RELOAD_ON_SIGHUP` | Activer reload sur SIGHUP | `1` | `1` (activé) ou `0` (désactivé) |
| `DVIG_HEALTH_PROTECTED` | Protéger `/health` | `0` | `1` (protégé) ou `0` (public) |
| `DVIG_DOCS_ENABLED` | Activer `/docs` | `1` | `1` (lab) ou `0` (prod) |
| `DVIG_OPENAPI_ENABLED` | Activer `/openapi.json` | `1` | `1` (lab) ou `0` (prod) |
| `DVIG_LOG_FORMAT` | Format logs (`json`/`console`) | `json` | `json` (prod) ou `console` (lab) |
| `DVIG_LOG_LEVEL` | Niveau logs | `info` | `debug`, `info`, `warning`, `error` |

### Configuration Tokens

#### 1. Générer un token

```bash
# Générer token avec hash
python -m dvig.cli.token_gen --tenant rehtse --univers odoo

# Générer format YAML (prêt à coller)
python -m dvig.cli.token_gen --tenant rehtse --univers odoo --output yaml
```

#### 2. Créer le fichier tokens.yml

```bash
# Copier l'exemple
cp config/tokens.example.yml conf/tokens.yml

# Éditer et ajouter vos tokens
nano conf/tokens.yml
```

#### 3. Format tokens.yml

```yaml
version: 1
tokens:
  - id: "tok_001"
    token_hash: "sha256:3b6c8f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8"
    tenant: "rehtse"
    univers: "odoo"
    status: "active"
    created_at: "2025-01-28T00:00:00Z"
    comment: "Odoo LAB rehtse"
```

**Champs obligatoires** :
- `id` : Identifiant unique du token
- `token_hash` : Hash SHA-256 (format `sha256:...` ou 64 hex)
- `tenant` : ID du tenant
- `univers` : Univers (ex: `odoo`, `sylius`)
- `status` : `active`, `disabled`, ou `revoked`

**Champs optionnels** :
- `created_at` : Date création (ISO8601)
- `rotated_at` : Date rotation (ISO8601)
- `comment` : Commentaire

---

## 🔐 Authentification

### Utilisation

Tous les appels à `/ingest` nécessitent un header `Authorization` :

```bash
curl -X POST http://localhost:8000/ingest \
  -H "Authorization: Bearer dvig_your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "invoice.posted",
    "source": "odoo.lab.core",
    "data": {"invoice_id": "INV-001"}
  }'
```

### Validation Source/Univers

**Règle** : Le champ `source` du payload DOIT commencer par `<univers>.`

**Exemples** :
- Token `univers=odoo` → `source=odoo.lab.core` ✅
- Token `univers=odoo` → `source=sylius.prod` ❌ (403 UNIVERSE_MISMATCH)

### Codes d'Erreur

| Code | Status | Description |
|------|--------|-------------|
| `AUTH_MISSING` | 401 | Header Authorization manquant |
| `INVALID_TOKEN` | 401 | Token invalide ou expiré |
| `TOKEN_REVOKED` | 401 | Token révoqué ou désactivé |
| `UNIVERSE_MISMATCH` | 403 | Source ne correspond pas à l'univers |
| `AUTH_BACKEND_UNAVAILABLE` | 503 | Service d'authentification indisponible |

**Format erreur** :
```json
{
  "status": "error",
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Token invalide ou expiré"
  }
}
```

---

## 📡 API Endpoints

### POST /ingest

**Authentification** : ✅ Requise (Bearer Token)

**Request** :
```json
{
  "event_type": "invoice.posted",
  "source": "odoo.lab.core",
  "timestamp": "2025-01-28T12:00:00Z",
  "data": {
    "invoice_id": "INV-001",
    "amount": 1000.00
  }
}
```

**Response** (201) :
```json
{
  "status": "accepted",
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "ts": "2025-01-28T12:00:00Z"
}
```

### GET /health

**Authentification** : Optionnelle (si `DVIG_HEALTH_PROTECTED=1`)

**Response** (200) :
```json
{
  "service": "dvig",
  "status": "healthy",
  "timestamp": "2025-01-28T12:00:00Z",
  "version": "0.1.1"
}
```

---

## 🔄 Reload Tokens

### Reload Automatique (Intervalle)

Le store recharge automatiquement les tokens toutes les `DVIG_TOKENS_RELOAD_INTERVAL` secondes.

```bash
export DVIG_TOKENS_RELOAD_INTERVAL=60  # 1 minute
```

Pour désactiver : `DVIG_TOKENS_RELOAD_INTERVAL=0`

### Reload sur SIGHUP

Reload immédiat en envoyant SIGHUP au processus :

```bash
kill -HUP $(pgrep -f "uvicorn.*dvig")
```

**Note** : SIGHUP doit être activé (`DVIG_TOKENS_RELOAD_ON_SIGHUP=1`)

### Reload Atomique

Le reload est atomique : si le nouveau YAML est invalide, l'ancien store est conservé.

---

## 📊 Logs Structurés

### Format JSON (Production)

```json
{
  "event": "ingest_event_accepted",
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant": "rehtse",
  "univers": "odoo",
  "token_id": "tok_001",
  "source": "odoo.lab.core",
  "event_type": "invoice.posted",
  "timestamp": "2025-01-28T12:00:00Z",
  "data_keys": ["invoice_id", "amount"]
}
```

### Configuration

```bash
export DVIG_LOG_FORMAT=json      # Production
export DVIG_LOG_FORMAT=console   # Lab/Développement
export DVIG_LOG_LEVEL=info       # debug, info, warning, error
```

**Règle absolue** : ❌ Aucun token brut ou hash ne doit apparaître dans les logs.

---

## 🧪 Tests

### Exécuter les tests

```bash
# Tous les tests
pytest tests/

# Tests unitaires uniquement
pytest tests/unit/

# Tests d'intégration uniquement
pytest tests/integration/

# Avec couverture
pytest --cov=dvig tests/
```

### Statistiques

- **35 tests** (21 unitaires + 14 intégration)
- **Couverture** : Tous les cas critiques
- **Corrections testées** : B2, B3, B5, B6, I1

---

## 🐳 Déploiement Docker

### Build

```bash
cd sources/dvig
docker build -f docker/Dockerfile -t dvig:0.1.1 .
```

### Run

```bash
docker run -d \
  -p 8000:8000 \
  -v $(pwd)/conf/tokens.yml:/etc/dvig/tokens.yml:ro \
  -e DVIG_AUTH_ENABLED=1 \
  -e DVIG_TOKENS_FILE=/etc/dvig/tokens.yml \
  -e DVIG_LOG_FORMAT=json \
  dvig:0.1.1
```

### Docker Compose

```yaml
version: '3.8'
services:
  dvig:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./conf/tokens.yml:/etc/dvig/tokens.yml:ro
    environment:
      DVIG_AUTH_ENABLED: "1"
      DVIG_TOKENS_FILE: "/etc/dvig/tokens.yml"
      DVIG_LOG_FORMAT: "json"
      DVIG_DOCS_ENABLED: "0"
      DVIG_OPENAPI_ENABLED: "0"
```

---

## 🔧 CLI Token Generation

### Générer un token

```bash
# Format par défaut (token + hash)
python -m dvig.cli.token_gen --tenant rehtse --univers odoo

# Sortie :
# TOKEN=dvig_abc123...
# HASH=sha256:3b6c8f9a...

# Format hash uniquement
python -m dvig.cli.token_gen --tenant rehtse --univers odoo --output hash

# Format YAML (prêt à coller)
python -m dvig.cli.token_gen --tenant rehtse --univers odoo --output yaml
```

### Rotation de tokens

1. Générer nouveau token :
```bash
python -m dvig.cli.token_gen --tenant rehtse --univers odoo --output yaml >> conf/tokens.yml
```

2. Mettre à jour `tokens.yml` :
   - Ajouter nouveau token avec `status: active`
   - Garder ancien token avec `status: disabled` (overlap)

3. Reload (SIGHUP ou attendre intervalle)

---

## 🛡️ Sécurité

### Bonnes Pratiques

1. **Ne jamais commiter** `tokens.yml` avec tokens réels
2. **Utiliser** `tokens.example.yml` comme template
3. **Rotation régulière** des tokens
4. **Logs** : Aucun token brut dans les logs
5. **Production** : Désactiver `/docs` et `/openapi.json`
6. **Comparaison constant-time** : Implémentée pour éviter timing attacks

### Conformité

- ✅ Format erreurs standardisé (JSON structuré)
- ✅ Logs structurés (audit & PDP/PPF 2026)
- ✅ Validation source/univers (sécurité métier)
- ✅ Reload atomique (résilience)

---

## 📚 Documentation Complémentaire

- **Spécification P1** : `ZeDocs/SPEC_DVIG_FastAPI_P1_Auth_Token_v1.0.md`
- **Note d'Architecture** : `ZeDocs/NOTE_ARCHITECTURE_P1_AUTH_VALIDATION.md`
- **Plan d'Implémentation** : `ZeDocs/PLAN_IMPLEMENTATION_P1_AUTH_TOKEN_v1.1.md`
- **État d'Implémentation** : `ZeDocs/ETAT_IMPLEMENTATION_P1_AUTH_TOKEN_v1.1.md`

---

## 🐛 Troubleshooting

### Erreur 503 AUTH_BACKEND_UNAVAILABLE

**Cause** : Fichier tokens.yml introuvable ou YAML invalide

**Solution** :
```bash
# Vérifier chemin
echo $DVIG_TOKENS_FILE

# Vérifier fichier existe
ls -la /etc/dvig/tokens.yml

# Vérifier YAML valide
python -c "import yaml; yaml.safe_load(open('/etc/dvig/tokens.yml'))"
```

### Erreur 401 INVALID_TOKEN

**Cause** : Token non trouvé ou hash incorrect

**Solution** :
```bash
# Vérifier hash du token
python -c "import hashlib; print(hashlib.sha256('dvig_your_token'.encode()).hexdigest())"

# Vérifier token dans tokens.yml
grep -A 5 "your_hash" conf/tokens.yml
```

### Erreur 403 UNIVERSE_MISMATCH

**Cause** : Source ne correspond pas à l'univers du token

**Solution** :
- Vérifier que `source` commence par `<univers>.`
- Exemple : Token `univers=odoo` → `source=odoo.lab.core` ✅

### Reload ne fonctionne pas

**Cause** : SIGHUP non disponible ou intervalle désactivé

**Solution** :
```bash
# Vérifier variables
echo $DVIG_TOKENS_RELOAD_ON_SIGHUP
echo $DVIG_TOKENS_RELOAD_INTERVAL

# Forcer reload (redémarrer service)
docker restart dvig
```

---

## 📝 Changelog P1

### v0.1.1 (2025-01-28)

- ✅ Authentification Bearer Token
- ✅ Backend YAML pour tokens
- ✅ Validation source/univers
- ✅ Format erreurs standardisé
- ✅ Reload tokens (SIGHUP + intervalle)
- ✅ Logs structurés
- ✅ CLI génération tokens
- ✅ 35 tests (unitaires + intégration)

---

**Maintenu par** : Dorevia Team  
**Support** : Voir documentation interne


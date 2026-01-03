# 🌉 Dorevia Vault Integration Gateway (DVIG)

**Passerelle universelle ERP ↔ Vault**

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![Status](https://img.shields.io/badge/status-active-green.svg)](https://github.com/dorevia/dorevia-vault-integration-gateway)

---

## 📋 Vue d'Ensemble

DVIG (Dorevia Vault Integration Gateway) est le composant **Apache 2.0** qui fait le pont entre les ERP (Odoo, etc.) et **Dorevia Vault**, le moteur cryptographique souverain.

### Rôle

- **Transformation** : Convertit les événements/documents ERP en appels Vault
- **Résilience** : Gère les erreurs réseau, retries, bufferisation
- **Multi-tenant** : Isolation stricte des données par tenant-id
- **Healthcheck** : Endpoints de liveness/readiness pour orchestration

### Caractéristiques

- ✅ **Compatible tout ERP** : Pas de dépendance spécifique à Odoo
- ✅ **Multi-tenant strict** : Isolation des données par tenant-id
- ✅ **Robustesse réseau** : Retry, dead letter queue, gestion d'erreurs
- ✅ **Documentation publique** : API docs, exemples
- ✅ **Contributions ouvertes** : Guide CONTRIBUTING.md

---

## 🚀 Installation

### Prérequis

- Python 3.9+
- Docker (optionnel, pour déploiement conteneurisé)

### Installation Locale

```bash
# Cloner le dépôt
git clone https://gitlab.example.com/dorevia/dorevia-vault-integration-gateway.git
cd dorevia-vault-integration-gateway

# Créer l'environnement virtuel
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Lancer les tests
pytest tests/unit/

# Démarrer DVIG
python -m dvig.api
```

### Installation Docker

```bash
# Build l'image
docker build -f docker/Dockerfile -t dorevia/dvig:latest .

# Lancer le conteneur
docker run -d \
  -p 8080:8080 \
  -e VAULT_URL=http://vault:9090 \
  -e VAULT_API_KEY=your-api-key \
  dorevia/dvig:latest
```

---

## 📖 Documentation

- [Guide d'Installation](docs/installation.md)
- [Documentation API](docs/api.md)
- [Guide Multi-Tenant](docs/multi-tenant.md)
- [Guide de Contribution](CONTRIBUTING.md)

---

## 🔧 Configuration

### Variables d'Environnement

```bash
# Configuration Vault
VAULT_URL=http://vault:9090
VAULT_API_KEY=your-api-key

# Configuration DVIG
DVIG_PORT=8080
DVIG_HOST=0.0.0.0
DVIG_LOG_LEVEL=info

# Multi-Tenant
DVIG_TENANT_VALIDATION=true
DVIG_TENANT_HEADER=X-Tenant-ID
```

### Fichier de Configuration

Voir `config/config.example.yaml` pour un exemple complet.

---

## 🧪 Tests

```bash
# Tests unitaires
pytest tests/unit/

# Tests d'intégration
pytest tests/integration/

# Tests E2E
pytest tests/e2e/

# Tous les tests avec couverture
pytest --cov=dvig --cov-report=html
```

---

## 📝 API

### Endpoints

- `GET /health` — Healthcheck (liveness/readiness)
- `POST /api/v1/proofs` — Créer une preuve (futur)
- `GET /api/v1/proofs/{id}` — Récupérer une preuve (futur)

### Exemple

```bash
# Healthcheck
curl http://localhost:8080/health

# Créer une preuve (avec tenant-id)
curl -X POST http://localhost:8080/api/v1/proofs \
  -H "X-Tenant-ID: acme-corp-001" \
  -H "Content-Type: application/json" \
  -d '{"document": "base64-encoded-document"}'
```

---

## 🤝 Contribution

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les guidelines de contribution.

### Workflow

1. Fork le dépôt
2. Créer une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Commit les changements (`git commit -m 'feat(dvig): ajout fonctionnalité'`)
4. Push vers la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrir une Merge Request

---

## 📄 Licence

Ce projet est sous licence **Apache 2.0**. Voir [LICENSE](LICENSE) pour plus de détails.

---

## 🔗 Liens

- **Dorevia Vault** : [Documentation Vault](https://gitlab.example.com/dorevia/dorevia-vault)
- **Dorevia-Staging** : [Documentation Staging](https://gitlab.example.com/dorevia/dorevia-staging)
- **Documentation Complète** : [docs.dorevia.io](https://docs.dorevia.io)

---

**Dernière mise à jour :** 2025-01-28


# 🚀 Guide de Déploiement — Sprint 7 (Z-Reports)

**Version** : 1.5.0  
**Date** : Novembre 2025

---

## 📋 Prérequis

- **Go** : 1.23+
- **PostgreSQL** : 14+ (pour tickets POS)
- **HashiCorp Vault** (optionnel, pour gestion clés JWS)
- **Espace disque** : Minimum 10 GB pour le ledger filesystem (selon volume Z-Reports)

---

## 🔧 Configuration

### Variables d'environnement

Ajoutez les variables suivantes à votre fichier `.env` ou configuration :

```bash
# Ledger Filesystem (requis pour Z-Reports)
LEDGER_FILESYSTEM_PATH=/opt/dorevia-vault/ledger

# Configuration Z-Reports
ZREPORT_MAX_SIZE_BYTES=1048576  # 1 MB (défaut)
ZREPORT_FSYNC_ENABLED=true      # Durabilité garantie (défaut: true)

# Base de données (requis pour validation last_ticket_hash)
DATABASE_URL=postgresql://user:password@localhost:5432/dorevia_vault

# JWS (requis pour signature evidence)
JWS_ENABLED=true
JWS_PRIVATE_KEY_PATH=/opt/dorevia-vault/keys/private.pem
JWS_PUBLIC_KEY_PATH=/opt/dorevia-vault/keys/public.pem
JWS_KID=zreports-kid-2025

# Authentification (requis pour endpoints)
AUTH_ENABLED=true
AUTH_JWT_ENABLED=true
AUTH_JWT_PUBLIC_KEY_PATH=/opt/dorevia-vault/keys/jwt_public.pem
```

### Création du répertoire ledger

Le répertoire ledger filesystem sera créé automatiquement au démarrage si `LEDGER_FILESYSTEM_PATH` est configuré. Assurez-vous que l'utilisateur du processus a les permissions d'écriture :

```bash
sudo mkdir -p /opt/dorevia-vault/ledger
sudo chown -R vault:vault /opt/dorevia-vault/ledger
sudo chmod 755 /opt/dorevia-vault/ledger
```

---

## 📦 Déploiement

### 1. Compilation

```bash
cd /opt/dorevia-vault
go build -o bin/vault cmd/vault/main.go
```

### 2. Vérification configuration

```bash
# Vérifier que les variables sont chargées
./bin/vault --help

# Vérifier le health check Z-Reports
curl http://localhost:8080/api/v1/health/zreports
```

### 3. Démarrage

```bash
# Démarrage direct
./bin/vault

# Ou via systemd
sudo systemctl start dorevia-vault
sudo systemctl status dorevia-vault
```

### 4. Vérification

```bash
# Health check général
curl http://localhost:8080/health

# Health check Z-Reports
curl http://localhost:8080/api/v1/health/zreports

# Métriques Prometheus
curl http://localhost:8080/metrics | grep zreports
```

---

## 🔍 Vérification post-déploiement

### 1. Endpoints disponibles

```bash
# POST /api/v1/pos/zreports
curl -X POST http://localhost:8080/api/v1/pos/zreports \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant: test-tenant" \
  -H "Content-Type: application/json" \
  -d @test_zreport.json

# GET /api/v1/evidence/:tenant/:z_id
curl -X GET http://localhost:8080/api/v1/evidence/test-tenant/Z2025-01-15-01 \
  -H "Authorization: Bearer <token>"

# GET /api/v1/health/zreports
curl http://localhost:8080/api/v1/health/zreports
```

### 2. Structure ledger filesystem

Vérifiez que la structure est créée correctement :

```bash
ls -la /opt/dorevia-vault/ledger/tenants/
# Devrait afficher les répertoires par tenant

ls -la /opt/dorevia-vault/ledger/tenants/test-tenant/pos/z/2025/01/
# Devrait afficher : <z_id>.json, index.json, last.json
```

### 3. Métriques Prometheus

Vérifiez que les métriques sont exposées :

```bash
curl http://localhost:8080/metrics | grep zreports
# Devrait afficher :
# - zreports_ingested_total
# - zreports_chain_errors_total
# - zreports_storage_duration_seconds
```

---

## 🧪 Tests

### Tests unitaires

```bash
go test ./internal/ledger/filesystem/... -v
go test ./internal/services/zreports/... -v
go test ./internal/handlers/... -v -run TestPosZReports
```

### Tests d'intégration

```bash
# Nécessite TEST_DATABASE_URL configuré
export TEST_DATABASE_URL=postgresql://user:password@localhost:5432/dorevia_vault_test
go test ./tests/integration/... -v -run TestZReports
```

---

## 📊 Monitoring

### Métriques à surveiller

1. **`zreports_ingested_total{status="success"}`** : Nombre de Z-Reports ingérés avec succès
2. **`zreports_ingested_total{status="error"}`** : Nombre d'erreurs d'ingestion
3. **`zreports_chain_errors_total{error_type="hash_prev_mismatch"}`** : Erreurs de chaînage
4. **`zreports_storage_duration_seconds`** : Durée de stockage (objectif < 100ms)

### Alertes recommandées

```yaml
# Prometheus alerts
- alert: ZReportsIngestionErrors
  expr: rate(zreports_ingested_total{status="error"}[5m]) > 0.1
  for: 5m
  annotations:
    summary: "Erreurs d'ingestion Z-Reports détectées"

- alert: ZReportsChainErrors
  expr: rate(zreports_chain_errors_total[5m]) > 0.05
  for: 5m
  annotations:
    summary: "Erreurs de chaînage Z-Reports détectées"

- alert: ZReportsStorageSlow
  expr: histogram_quantile(0.95, zreports_storage_duration_seconds) > 0.5
  for: 5m
  annotations:
    summary: "Stockage Z-Reports lent (> 500ms)"
```

---

## 🔒 Sécurité

### Permissions fichiers

```bash
# Ledger filesystem : lecture/écriture pour utilisateur vault uniquement
sudo chown -R vault:vault /opt/dorevia-vault/ledger
sudo chmod 750 /opt/dorevia-vault/ledger

# Clés JWS : lecture seule pour utilisateur vault
sudo chown vault:vault /opt/dorevia-vault/keys/private.pem
sudo chmod 600 /opt/dorevia-vault/keys/private.pem
```

### Authentification

- Tous les endpoints Z-Reports nécessitent une authentification
- Utilisez JWT ou API Keys selon votre configuration
- Vérifiez les permissions RBAC (`documents:write`, `documents:read`)

---

## 🐛 Dépannage

### Erreur : "Ledger filesystem path not configured"

**Solution** : Vérifiez que `LEDGER_FILESYSTEM_PATH` est défini dans votre configuration.

### Erreur : "Permission denied" lors de l'écriture

**Solution** : Vérifiez les permissions du répertoire ledger :

```bash
sudo chown -R vault:vault /opt/dorevia-vault/ledger
sudo chmod 755 /opt/dorevia-vault/ledger
```

### Erreur : "last_ticket_hash not found"

**Solution** : Assurez-vous que le ticket POS a été vaulté avant le Z-Report via `POST /api/v1/pos-tickets`.

### Erreur : "hash_prev mismatch"

**Solution** : Vérifiez que le `hash_prev` correspond au `hash_current` du Z-Report précédent du même mois.

---

## 📚 Documentation

- **API** : Voir `docs/ZREPORTS_API.md`
- **Spécification** : Voir `docs/Dorevia_Vault_Phase2_Specification.md`
- **Plan d'implémentation** : Voir `docs/PLAN_IMPLEMENTATION_SPRINT7.md`

---

## 🔄 Migration depuis v1.4.0

Aucune migration de base de données n'est requise. Le ledger filesystem est créé automatiquement au premier démarrage avec `LEDGER_FILESYSTEM_PATH` configuré.

---

**Support** : [support@doreviateam.com](mailto:support@doreviateam.com)  
**Documentation** : [https://vault.doreviateam.com/docs](https://vault.doreviateam.com/docs)


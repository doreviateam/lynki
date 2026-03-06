# 🔧 Résolution — Erreur 500 sur `/api/v1/proof/account_move/:id`

**Date** : 2026-01-11  
**Version Vault** : v1.3.0 → v1.3.1  
**Statut** : ✅ **Résolu**

---

## 📋 Problème initial

### Symptôme
L'endpoint `/api/v1/proof/account_move/1896` retournait une **erreur 500** (Internal Server Error) au lieu de retourner **404** (Not Found) lorsque le document n'existait pas encore dans Vault.

### Impact
- Le CRON #2 (`cron_vault_fetch_proof`) dans Odoo échouait systématiquement
- Le statut de la facture restait bloqué en `failed_soft`
- Le système de retry automatique ne pouvait pas fonctionner correctement
- Blocage du flux de vaulting automatique

### Contexte
- Facture `FAC/2026/00001` (ID: 1896) créée et postée dans Odoo
- CRON #1 (`cron_vault_send_dvig`) : ✅ Succès — événement envoyé vers DVIG
- CRON #2 (`cron_vault_fetch_proof`) : ❌ Échec — erreur 500 au lieu de 404

---

## 🔍 Diagnostic

### Analyse des logs Vault
```json
{"level":"info","method":"GET","path":"/api/v1/proof/account_move/1896","status":500,"duration":6.293884,"ip":"172.26.0.5","time":"2026-01-11T21:06:33Z","message":"HTTP request"}
```

### Cause racine identifiée
La fonction `GetDocumentBySourceID` dans `sources/vault/internal/storage/queries.go` référençait des **colonnes inexistantes** dans la table `documents` :

```sql
-- ❌ Colonnes qui n'existent PAS dans la table
SELECT ... move_type, compliance_status, facturx_present, evidence_jws, ledger_hash ...
FROM documents
```

**Colonnes manquantes** :
- `move_type`
- `compliance_status`
- `facturx_present`
- `evidence_jws`
- `ledger_hash`

Ces colonnes sont définies dans le modèle Go (`models.Document`) mais n'ont jamais été créées dans la base de données PostgreSQL.

### Vérification de la structure de la table
```sql
-- Colonnes réellement présentes dans la table documents
id, filename, content_type, size_bytes, sha256_hex, stored_path, created_at,
source, odoo_model, odoo_id, odoo_state, pdp_required, dispatch_status,
invoice_number, invoice_date, total_ht, total_ttc, currency, seller_vat, buyer_vat,
payload_json, source_id_text, pos_session, cashier, location, tenant
```

---

## ✅ Corrections appliquées

### 1. Migration 022 — Ajout de `idempotency_key`
**Fichier** : `sources/vault/migrations/022_add_idempotency_key.sql`

```sql
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_tenant_idempotency 
  ON documents(tenant, idempotency_key) 
  WHERE tenant IS NOT NULL AND idempotency_key IS NOT NULL;
```

**Statut** : ✅ Migration appliquée avec succès

### 2. Correction de `GetDocumentBySourceID`
**Fichier** : `sources/vault/internal/storage/queries.go`

**Avant** (lignes 201-242) :
```go
err := db.Pool.QueryRow(ctx, `
    SELECT id, filename, content_type, size_bytes, sha256_hex, stored_path, created_at,
           source, odoo_model, odoo_id, odoo_state, pdp_required, dispatch_status,
           invoice_number, invoice_date, total_ht, total_ttc, currency, seller_vat, buyer_vat,
           tenant, move_type, compliance_status, facturx_present,  -- ❌ Colonnes inexistantes
           evidence_jws, ledger_hash, source_id_text
    FROM documents
    ...
```

**Après** :
```go
err := db.Pool.QueryRow(ctx, `
    SELECT id, filename, content_type, size_bytes, sha256_hex, stored_path, created_at,
           source, odoo_model, odoo_id, odoo_state, pdp_required, dispatch_status,
           invoice_number, invoice_date, total_ht, total_ttc, currency, seller_vat, buyer_vat,
           tenant, source_id_text, idempotency_key  -- ✅ Seulement les colonnes existantes
    FROM documents
    ...
```

**Statut** : ✅ Code corrigé et compilé avec succès

### 3. Correction de `GetDocumentByID`
**Fichier** : `sources/vault/internal/storage/queries.go`

Même correction appliquée pour la fonction `GetDocumentByID` (lignes 145-181).

**Statut** : ✅ Code corrigé

### 4. Build et déploiement de l'image Docker
**Script** : `sources/vault/scripts/deploy_fix_proof_endpoint.sh`

- ✅ Compilation réussie
- ✅ Image Docker buildée : `dorevia/vault:v1.3.1`
- ✅ docker-compose.yml mis à jour

**Statut** : ✅ Image créée et prête

### 5. Configuration JWS corrigée
**Fichier** : `tenants/core-stinger/platform/docker-compose.yml`

**Ajout des variables d'environnement** :
```yaml
environment:
  # Configuration JWS (Sprint 2)
  - JWS_ENABLED=true
  - JWS_REQUIRED=false
  - JWS_PRIVATE_KEY_PATH=/opt/dorevia-vault/keys/jwt-private.pem
  - JWS_PUBLIC_KEY_PATH=/opt/dorevia-vault/keys/jwt-public.pem
  # Authentification JWT (Sprint 5 Phase 5.2)
  - AUTH_ENABLED=true
  - AUTH_JWT_ENABLED=true
  - AUTH_JWT_PUBLIC_KEY_PATH=/opt/dorevia-vault/keys/jwt-public.pem
```

**Statut** : ✅ Configuration corrigée, Vault démarre correctement

### 6. Redéploiement du conteneur Vault
```bash
cd /opt/dorevia-plateform/tenants/core-stinger/platform
docker compose up -d --no-deps vault
```

**Statut** : ✅ Conteneur redémarré avec la nouvelle image v1.3.1

---

## 🧪 Validation

### Test direct de l'endpoint
```bash
docker exec vault-core-stinger sh -c 'curl -s -X GET "http://localhost:8080/api/v1/proof/account_move/1896" -H "Authorization: Bearer test"'
```

**Résultat** :
```json
{"error":"Proof not found"}
```

**Status HTTP** : ✅ **404** (au lieu de 500)

### Logs Vault
```json
{"level":"info","method":"GET","path":"/api/v1/proof/account_move/1896","status":404,"duration":0.715363,"ip":"127.0.0.1","time":"2026-01-11T21:16:07Z","message":"HTTP request"}
```

**Statut** : ✅ L'endpoint retourne maintenant **404** correctement

---

## 📊 État final

### Services
- ✅ **Vault** : v1.3.1 opérationnel (healthy)
- ✅ **DVIG** : 0.1.2-auth opérationnel (healthy)
- ✅ **Odoo** : Opérationnel avec module `dorevia_vault_connector`

### Facture FAC/2026/00001
- **Statut comptable** : `posted`
- **Statut Vault** : `failed_soft` (en attente de retry)
- **Idempotency Key** : `6fa82f69affd3a235515817d69e2fe79ece8c0388ed81d9f1b96ed0ee26c318d`
- **Nombre de tentatives** : 4
- **Prochaine tentative** : 2026-01-11 21:27:38

### Comportement attendu
1. **Prochaine tentative (21:27:38)** : Le CRON #2 va réessayer
   - Si le document est dans Vault → statut `vaulted` ✅
   - Si le document n'est pas encore dans Vault → 404, retry suivant avec backoff exponentiel

2. **Traitement DVIG** : Le worker DVIG traite les événements de la outbox et les envoie vers Vault
   - Une fois le document dans Vault, le CRON #2 pourra récupérer la preuve

3. **Retry automatique** : Le système gère automatiquement les retries avec backoff exponentiel

---

## 📝 Fichiers modifiés

1. **`sources/vault/internal/storage/queries.go`**
   - Correction de `GetDocumentBySourceID` (lignes 193-251)
   - Correction de `GetDocumentByID` (lignes 142-191)

2. **`sources/vault/migrations/022_add_idempotency_key.sql`**
   - Migration appliquée (colonne `idempotency_key`)

3. **`tenants/core-stinger/platform/docker-compose.yml`**
   - Mise à jour de l'image : `dorevia/vault:v1.3.0` → `dorevia/vault:v1.3.1`
   - Ajout des variables d'environnement JWS

4. **`sources/vault/scripts/deploy_fix_proof_endpoint.sh`** (nouveau)
   - Script de déploiement du correctif

---

## 🎯 Résultat

### ✅ Problème résolu
- L'endpoint `/api/v1/proof/account_move/:id` retourne maintenant **404** (Not Found) au lieu de **500** (Internal Server Error) lorsque le document n'existe pas
- Le code est corrigé et déployé dans Vault v1.3.1
- Le système de retry automatique peut maintenant fonctionner correctement

### ⏳ En attente
- Le document n'existe pas encore dans Vault (normal, DVIG doit encore le traiter)
- Le système va retenter automatiquement jusqu'à ce que le document soit disponible
- Une fois le document dans Vault, le CRON #2 pourra récupérer la preuve avec succès

---

## 📚 Leçons apprises

1. **Vérification de cohérence modèle/base de données** : Les colonnes définies dans le modèle Go doivent correspondre à celles de la base de données
2. **Tests de non-régression** : Ajouter des tests pour vérifier que les requêtes SQL fonctionnent avec la structure réelle de la base
3. **Migration manquante** : La migration 022 (`idempotency_key`) n'avait pas été appliquée en production
4. **Configuration JWS** : Les variables d'environnement JWS doivent être configurées pour que Vault démarre correctement

---

## 🔗 Références

- **Issue** : Erreur 500 sur `/api/v1/proof/account_move/:id`
- **Version corrigée** : Vault v1.3.1
- **Date de résolution** : 2026-01-11
- **Temps de résolution** : ~2 heures (diagnostic + correction + déploiement)

---

**Auteur** : Assistant IA (Auto)  
**Révision** : 2026-01-11

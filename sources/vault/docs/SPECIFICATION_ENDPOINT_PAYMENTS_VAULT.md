# 📘 Spécification Technique — Endpoint `/api/v1/payments`

**Version** : 1.0  
**Date** : 2025-01-18  
**Projet** : Dorevia Vault Payment Connector  
**Sprint** : À définir  
**Basé sur** : Patterns des endpoints `/api/v1/invoices`, `/api/v1/pos-tickets`, `/api/v1/pos/zreports`

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification](#authentification)
3. [Endpoint](#endpoint)
4. [Format des données](#format-des-données)
5. [Réponses](#réponses)
6. [Gestion des erreurs](#gestion-des-erreurs)
7. [Exemples](#exemples)
8. [Intégration avec l'architecture](#intégration-avec-larchitecture)

---

## Vue d'ensemble

L'endpoint `/api/v1/payments` permet la vaultérisation des paiements et remboursements provenant d'Odoo (POS et factures) dans le système Dorevia Vault.

**Caractéristiques principales** :
- ✅ Stockage dans la table `documents` (comme les factures et tickets POS)
- ✅ Idempotence basée sur `sha256_hex` (comme les autres endpoints)
- ✅ Preuve JWS cryptographique (si `JWS_ENABLED=true`)
- ✅ Intégration Ledger (si configuré)
- ✅ Multi-tenant via header `X-Tenant`
- ✅ Validation stricte des champs obligatoires

**Pattern suivi** : Similaire à `/api/v1/pos-tickets` (données structurées JSON, pas de fichier base64)

---

## Authentification

Tous les appels à l'endpoint nécessitent une authentification via :

- **Header `Authorization`** : `Bearer <token>` ou `Apikey <key>`
- **Permission requise** : `documents:write` (comme pour `/api/v1/invoices` et `/api/v1/pos-tickets`)

**Note** : Si `AUTH_ENABLED=false`, l'endpoint est accessible sans authentification (environnement de développement uniquement).

---

## Endpoint

### POST /api/v1/payments

Ingère un paiement dans le vault avec stockage dans la table `documents`.

#### Headers

| Header | Type | Requis | Description |
|--------|------|--------|-------------|
| `Authorization` | string | Oui* | Token JWT ou API Key (`Bearer <token>` ou `Apikey <key>`) |
| `X-Tenant` | string | Oui | Identifiant du tenant (doit correspondre au champ `tenant` du payload) |
| `Content-Type` | string | Oui | `application/json` |

*Requis uniquement si `AUTH_ENABLED=true`

#### Validation de taille

La taille maximale du payload est configurable via `PaymentMaxSizeBytes` (défaut : 64 KB, comme pour les tickets POS).

---

## Format des données

### Payload — Requête

#### Structure JSON

```json
{
  "tenant": "laplatine",
  "source_system": "odoo",
  "source_model": "account.payment",
  "source_id": "PAY/2025/00123",
  "payment_date": "2025-11-18T14:32:10Z",
  "amount": 45.50,
  "currency": "EUR",
  "method": "cash",
  "source": "pos",
  "payment_direction": "inbound",
  "is_refund": false,
  "company_id": 1,
  "payment": {
    "multi_payment_group": "FAC/2025/00512",
    "multi_payment_index": 1,
    "multi_payment_total": 3,
    "allocated_invoices": [
      {"invoice": "FAC/2025/00512", "portion": 20.00},
      {"invoice": "FAC/2025/00513", "portion": 25.50}
    ],
    "pos_order_ref": "Boulangerie/0025",
    "session_id": "POS/SESSION/124"
  }
}
```

#### Champs obligatoires

| Champ | Type | Description |
|:------|:-----|:------------|
| `tenant` | string | Identifiant du tenant (doit correspondre au header `X-Tenant`) |
| `source_model` | string | Modèle source Odoo (`account.payment` ou `pos.payment`) |
| `source_id` | string | Identifiant unique du paiement (ex: `PAY/2025/00123`) |
| `payment_date` | string (RFC3339) | Date et heure du paiement (UTC) |
| `amount` | number | Montant du paiement (doit être > 0) |
| `currency` | string | Code devise ISO 4217 (ex: `EUR`, `USD`) |
| `method` | string | Méthode de paiement : `cash`, `card`, `mixed`, `check`, `transfer`, `other` |
| `source` | string | Source : `pos` ou `account` |
| `payment_direction` | string | Direction : `inbound` (encaissement) ou `outbound` (décaissement) |
| `is_refund` | boolean | `true` si remboursement, `false` si paiement normal |
| `company_id` | integer | ID de la société Odoo |
| `payment` | object | JSON brut du paiement (métadonnées additionnelles) |

#### Champs optionnels

| Champ | Type | Description |
|:------|:-----|:------------|
| `source_system` | string | Système source (défaut: `"odoo"`) |

#### Structure du champ `payment` (JSON brut)

Le champ `payment` contient les métadonnées additionnelles du paiement au format JSON libre. Exemples de champs possibles :

- `multi_payment_group` : Groupe paiements fractionnés (nom facture)
- `multi_payment_index` : Index dans le groupe (1, 2, 3...)
- `multi_payment_total` : Nombre total de paiements dans le groupe
- `allocated_invoices` : Array d'allocations factures (si `source = "account"`)
  - `invoice` : Numéro facture
  - `portion` : Montant alloué à cette facture
- `pos_order_ref` : Référence commande POS (si `source = "pos"`)
- `session_id` : ID session POS (si `source = "pos"`)

**Note** : Le champ `payment` est stocké tel quel dans `payload_json` (comme pour les tickets POS).

---

## Réponses

### Succès (201 Created ou 200 OK)

**201 Created** : Paiement créé avec succès  
**200 OK** : Paiement déjà existant (idempotence basée sur `sha256_hex`)

#### Format de réponse

```json
{
  "id": "6b78d57a-3d3c-4b2e-bae3-3a8ee3fdc8d0",
  "tenant": "laplatine",
  "sha256_hex": "abc123def456789...",
  "ledger_hash": "xyz789...",
  "evidence_jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "created_at": "2025-11-18T14:32:10Z"
}
```

#### Description des champs

| Champ | Type | Description |
|:------|:-----|:------------|
| `id` | string (UUID) | Identifiant unique du document dans le vault |
| `tenant` | string | Identifiant du tenant |
| `sha256_hex` | string | Hash SHA256 du payload JSON (64 caractères hex) |
| `ledger_hash` | string (nullable) | Hash dans le ledger (si intégration Ledger activée) |
| `evidence_jws` | string (nullable) | Preuve JWS cryptographique (si `JWS_ENABLED=true`) |
| `created_at` | string (RFC3339) | Date et heure de création |

**Note** : Le format de réponse est identique à celui de `/api/v1/pos-tickets` pour cohérence.

---

## Gestion des erreurs

### Format d'erreur standard

```json
{
  "error": "Message d'erreur détaillé",
  "details": "Détails supplémentaires (optionnel)"
}
```

### Codes HTTP et types d'erreurs

| Code HTTP | Type | Description |
|-----------|------|-------------|
| `200` / `201` | Succès | Paiement vaultérisé avec succès |
| `400` | Permanent | Payload invalide (champs manquants, format incorrect) |
| `401` | Permanent | Token d'authentification invalide ou manquant |
| `403` | Permanent | Accès interdit (permissions insuffisantes) |
| `404` | Permanent | Endpoint non trouvé (si endpoint non déployé) |
| `413` | Permanent | Payload trop volumineux (dépasse `PaymentMaxSizeBytes`) |
| `429` | Retryable | Trop de requêtes (rate limit) |
| `500` | Retryable | Erreur serveur interne |
| `502` | Retryable | Bad Gateway |
| `503` | Retryable | Service indisponible (base de données non configurée) |
| `504` | Retryable | Gateway Timeout |

### Exemples d'erreurs

#### 400 Bad Request — Champ manquant

```json
{
  "error": "Missing required field: tenant"
}
```

#### 400 Bad Request — Format de date invalide

```json
{
  "error": "Invalid payment_date format (must be RFC3339)",
  "details": "parsing time \"2025-11-18\" as \"2006-01-02T15:04:05Z07:00\": cannot parse \"\" as \"T\""
}
```

#### 400 Bad Request — Incohérence tenant

```json
{
  "error": "Tenant mismatch: header X-Tenant (laplatine) does not match payload.tenant (autre_tenant)"
}
```

#### 401 Unauthorized — Token manquant

```json
{
  "error": "Missing or invalid authorization token"
}
```

#### 413 Payload Too Large

```json
{
  "error": "Payload too large",
  "max_size_bytes": 65536
}
```

#### 503 Service Unavailable — Base de données non configurée

```json
{
  "error": "Database not configured"
}
```

---

## Exemples

### Exemple 1 : Paiement POS Simple

#### Requête

```bash
curl -X POST https://vault.doreviateam.com/api/v1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: laplatine" \
  -d '{
    "tenant": "laplatine",
    "source_system": "odoo",
    "source_model": "pos.payment",
    "source_id": "PAY/2025/00123",
    "payment_date": "2025-11-18T14:32:10Z",
    "amount": 25.50,
    "currency": "EUR",
    "method": "cash",
    "source": "pos",
    "payment_direction": "inbound",
    "is_refund": false,
    "company_id": 1,
    "payment": {
      "pos_order_ref": "Boulangerie/0025",
      "session_id": "POS/SESSION/124"
    }
  }'
```

#### Réponse (201 Created)

```json
{
  "id": "6b78d57a-3d3c-4b2e-bae3-3a8ee3fdc8d0",
  "tenant": "laplatine",
  "sha256_hex": "abc123def4567890123456789abcdef0123456789abcdef0123456789abcdef",
  "ledger_hash": "xyz789...",
  "evidence_jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "created_at": "2025-11-18T14:32:10Z"
}
```

### Exemple 2 : Paiement Facture Client Multi-Factures

#### Requête

```bash
curl -X POST https://vault.doreviateam.com/api/v1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: laplatine" \
  -d '{
    "tenant": "laplatine",
    "source_system": "odoo",
    "source_model": "account.payment",
    "source_id": "PAY/2025/00456",
    "payment_date": "2025-11-18T10:00:00Z",
    "amount": 600.00,
    "currency": "EUR",
    "method": "transfer",
    "source": "account",
    "payment_direction": "inbound",
    "is_refund": false,
    "company_id": 1,
    "payment": {
      "allocated_invoices": [
        {"invoice": "FAC/2025/00512", "portion": 200.00},
        {"invoice": "FAC/2025/00513", "portion": 200.00},
        {"invoice": "FAC/2025/00514", "portion": 200.00}
      ]
    }
  }'
```

### Exemple 3 : Paiement Facture Fournisseur

#### Requête

```bash
curl -X POST https://vault.doreviateam.com/api/v1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: laplatine" \
  -d '{
    "tenant": "laplatine",
    "source_system": "odoo",
    "source_model": "account.payment",
    "source_id": "PAY/2025/00457",
    "payment_date": "2025-11-18T11:00:00Z",
    "amount": 1500.00,
    "currency": "EUR",
    "method": "transfer",
    "source": "account",
    "payment_direction": "outbound",
    "is_refund": false,
    "company_id": 1,
    "payment": {
      "allocated_invoices": [
        {"invoice": "BILL/2025/00123", "portion": 1500.00}
      ]
    }
  }'
```

### Exemple 4 : Remboursement Client

#### Requête

```bash
curl -X POST https://vault.doreviateam.com/api/v1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: laplatine" \
  -d '{
    "tenant": "laplatine",
    "source_system": "odoo",
    "source_model": "account.payment",
    "source_id": "PAY/2025/00458",
    "payment_date": "2025-11-18T12:00:00Z",
    "amount": 50.00,
    "currency": "EUR",
    "method": "transfer",
    "source": "account",
    "payment_direction": "outbound",
    "is_refund": true,
    "company_id": 1,
    "payment": {
      "allocated_invoices": [
        {"invoice": "RFA/2025/00045", "portion": 50.00}
      ]
    }
  }'
```

### Exemple 5 : Paiement Fractionné Client (1er versement)

#### Requête

```bash
curl -X POST https://vault.doreviateam.com/api/v1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: laplatine" \
  -d '{
    "tenant": "laplatine",
    "source_system": "odoo",
    "source_model": "account.payment",
    "source_id": "PAY/2025/00789",
    "payment_date": "2025-11-18T09:00:00Z",
    "amount": 200.00,
    "currency": "EUR",
    "method": "check",
    "source": "account",
    "payment_direction": "inbound",
    "is_refund": false,
    "company_id": 1,
    "payment": {
      "multi_payment_group": "FAC/2025/01000",
      "multi_payment_index": 1,
      "multi_payment_total": 5,
      "allocated_invoices": [
        {"invoice": "FAC/2025/01000", "portion": 200.00}
      ]
    }
  }'
```

---

## Intégration avec l'architecture

### Stockage dans la base de données

Les paiements sont stockés dans la table `documents` avec les champs suivants :

- `id` : UUID généré automatiquement
- `sha256_hex` : Hash SHA256 du payload JSON (canonicalisé)
- `source` : `"payment"` (nouveau type de source)
- `odoo_model` : `source_model` du payload (ex: `"account.payment"`, `"pos.payment"`)
- `odoo_id` : `company_id` du payload
- `source_id_text` : `source_id` du payload (ex: `"PAY/2025/00123"`)
- `payload_json` : JSON brut du champ `payment` (métadonnées additionnelles)
- `evidence_jws` : Preuve JWS (si `JWS_ENABLED=true`)
- `ledger_hash` : Hash dans le ledger (si intégration Ledger activée)
- `created_at` : Timestamp de création

**Note** : Le hash SHA256 est calculé sur le payload JSON complet (canonicalisé) pour garantir l'idempotence.

### Idempotence

L'endpoint est **idempotent** : si un paiement avec le même `sha256_hex` existe déjà, l'API retourne `200 OK` avec les données existantes au lieu de créer un doublon.

**Mécanisme** :
1. Calcul du hash SHA256 du payload JSON (canonicalisé)
2. Vérification de l'existence dans la base de données
3. Si existant : retour `200 OK` avec les données existantes
4. Si nouveau : création et retour `201 Created`

### Intégration JWS

Si `JWS_ENABLED=true`, une preuve JWS est générée automatiquement pour chaque paiement vaultérisé.

**Contenu du JWS** :
- `id` : UUID du document
- `tenant` : Identifiant du tenant
- `sha256_hex` : Hash SHA256 du payload
- `source_id` : Identifiant source du paiement
- `timestamp` : Date de création

### Intégration Ledger

Si l'intégration Ledger est activée, le paiement est également inscrit dans le ledger avec un hash dédié.

### Cohérence avec les autres endpoints

L'endpoint `/api/v1/payments` suit les mêmes patterns que :

- **`/api/v1/invoices`** : Stockage dans `documents`, idempotence, JWS, Ledger
- **`/api/v1/pos-tickets`** : Structure de payload similaire (`tenant`, `source_model`, `source_id`, `payload_json`)
- **`/api/v1/pos/zreports`** : Validation stricte, format de réponse standardisé

### Chaînage cryptographique (optionnel)

**Note** : Le chaînage cryptographique entre paiements (comme pour les Z-Reports) n'est **pas implémenté** dans cette version. Chaque paiement est indépendant.

Si un chaînage est nécessaire dans le futur, il faudra :
1. Ajouter un champ `hash_prev` dans le payload
2. Valider que le `hash_prev` correspond au `sha256_hex` du paiement précédent
3. Stocker le `hash_prev` dans la base de données

---

## Validation

### Validations effectuées

1. **Champs obligatoires** : Vérification de la présence de tous les champs requis
2. **Format de date** : Validation du format RFC3339 pour `payment_date`
3. **Montants** : Vérification que `amount > 0`
4. **Devise** : Validation du code ISO 4217 (optionnel, peut être étendu)
5. **Méthode de paiement** : Validation des valeurs autorisées (`cash`, `card`, `mixed`, `check`, `transfer`, `other`)
6. **Source** : Validation des valeurs autorisées (`pos`, `account`)
7. **Direction** : Validation des valeurs autorisées (`inbound`, `outbound`)
8. **Tenant** : Vérification de cohérence entre header `X-Tenant` et champ `tenant`
9. **Taille** : Vérification que le payload ne dépasse pas `PaymentMaxSizeBytes`
10. **Allocations** : Si `allocated_invoices` présent, vérification que `sum(portions) <= amount` (optionnel)
11. **Multi-paiements** : Si `multi_payment_group` présent, vérification que `multi_payment_index <= multi_payment_total` (optionnel)

---

## Métriques et monitoring

L'endpoint enregistre les métriques suivantes (via Prometheus) :

- `vault_documents_vaulted_total{status="success|idempotent|error", source="payment"}` : Nombre de paiements vaultérisés
- `vault_document_storage_duration_seconds{operation="payment_ingest"}` : Durée de stockage

---

## Health Check

Un endpoint de health check peut être ajouté :

```
GET /api/v1/health/payments
```

**Réponse** :
```json
{
  "status": "ok",
  "endpoint": "/api/v1/payments",
  "enabled": true
}
```

---

## Migration de base de données

Aucune migration supplémentaire n'est nécessaire si les paiements sont stockés dans la table `documents` existante avec les champs déjà disponibles :

- `source` : Nouvelle valeur `"payment"`
- `source_id_text` : Déjà disponible (Sprint 6)
- `payload_json` : Déjà disponible (Sprint 6)

**Note** : Si une table dédiée `payments` est préférée, une migration sera nécessaire.

---

## Tests

### Tests unitaires

- Validation des champs obligatoires
- Validation des formats (date, montant, devise)
- Validation de cohérence tenant
- Test d'idempotence
- Test de génération JWS
- Test d'intégration Ledger

### Tests d'intégration

- Test paiement POS simple
- Test paiement facture client
- Test paiement facture fournisseur
- Test remboursement client
- Test remboursement fournisseur
- Test paiement multi-factures
- Test paiement fractionné
- Test gestion erreurs (400, 401, 500, etc.)

---

## Documentation de référence

### Endpoints similaires

- **`POST /api/v1/invoices`** : Vaultérisation factures (fichier base64)
- **`POST /api/v1/pos-tickets`** : Vaultérisation tickets POS (JSON structuré)
- **`POST /api/v1/pos/zreports`** : Vaultérisation Z-Reports (ledger filesystem)

### Code source

- **Handler** : `internal/handlers/payments.go` (à créer)
- **Service** : `internal/services/payments_service.go` (à créer)
- **Modèle** : Utilise `internal/models/document.go` (existant)

---

**Dernière mise à jour** : 2025-01-18  
**Statut** : 📝 Spécification technique adaptée à la réalité du vault


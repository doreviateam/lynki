# 📘 API Proof — Documentation

**Version** : 1.1  
**Date** : 2025-11-24  
**Dernière mise à jour** : 2025-11-26 (Sprint 8.1 - Compatibilité DVIG)  
**Sprint** : Sprint 8 + 8.1

---

## 🎯 Vue d'ensemble

Les endpoints `/api/v1/proof/*` permettent de récupérer les preuves d'intégrité des documents vaultés par leur ID Odoo, facilitant l'intégration avec le module `dorevia_vault_report`.

---

## 🔐 Authentification

Tous les endpoints nécessitent une authentification via :

- **Header `Authorization`** : `Bearer <token>` ou `Apikey <key>`
- **Permission requise** : `documents:read`

---

## 📡 Endpoints

### GET /api/v1/proof/account_move/:id

Récupère la preuve d'intégrité d'une facture par son ID Odoo.

#### Paramètres

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `id` | string | Oui | ID Odoo de la facture (ex: `123`) |

#### Réponse 200 OK

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "hash": "abc123def456...",
  "ledger": "LEDGER:INV:00000123",
  "prev_hash": "def456ghi789...",
  "timestamp": "2025-01-15T10:30:00Z",
  "jws": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
  "status": "verified",
  "source_model": "account.move",
  "source_id": "123"
}
```

**Note** : Le champ `prev_hash` est inclus depuis Sprint 8 (Option B). Il peut être `null` si le document est le premier du ledger.

#### Réponse 404 Not Found

```json
{
  "error": "Proof not found"
}
```

#### Exemple

```bash
curl -X GET https://vault.doreviateam.com/api/v1/proof/account_move/123 \
  -H "Authorization: Bearer <token>"
```

---

### GET /api/v1/proof/account_payment/:id

Récupère la preuve d'intégrité d'un paiement par son ID Odoo.

#### Paramètres

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `id` | string | Oui | ID Odoo du paiement (ex: `456`) |

#### Réponse 200 OK

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "hash": "def456ghi789...",
  "ledger": "LEDGER:PAY:00000456",
  "timestamp": "2025-01-15T11:00:00Z",
  "jws": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
  "status": "verified",
  "source_model": "account.payment",
  "source_id": "456"
}
```

#### Exemple

```bash
curl -X GET https://vault.doreviateam.com/api/v1/proof/account_payment/456 \
  -H "Authorization: Bearer <token>"
```

---

### GET /api/v1/proof/pos_order/:id

Récupère la preuve d'intégrité d'un ticket POS par son ID Odoo.

#### Paramètres

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `id` | string | Oui | ID Odoo du ticket POS (ex: `POS/2025/0001`) |

#### Réponse 200 OK

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "hash": "ghi789jkl012...",
  "ledger": "LEDGER:POS:00000001",
  "timestamp": "2025-01-15T12:00:00Z",
  "jws": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
  "status": "verified",
  "source_model": "pos.order",
  "source_id": "POS/2025/0001"
}
```

#### Exemple

```bash
curl -X GET https://vault.doreviateam.com/api/v1/proof/pos_order/POS%2F2025%2F0001 \
  -H "Authorization: Bearer <token>"
```

---

### GET /api/v1/proof/pos_payment/:id

Récupère la preuve d'intégrité d'un paiement POS par son ID Odoo.

#### Paramètres

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `id` | string | Oui | ID Odoo du paiement POS (ex: `789`) |

#### Réponse 200 OK

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "hash": "jkl012mno345...",
  "ledger": "LEDGER:POSPAY:00000789",
  "timestamp": "2025-01-15T12:30:00Z",
  "jws": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
  "status": "verified",
  "source_model": "pos.payment",
  "source_id": "789"
}
```

#### Exemple

```bash
curl -X GET https://vault.doreviateam.com/api/v1/proof/pos_payment/789 \
  -H "Authorization: Bearer <token>"
```

---

### GET /api/v1/proof/pos_zreport/:id

Récupère la preuve d'intégrité d'un Z-Report par son ID Odoo.

**⚠️ Note** : Cet endpoint n'est pas encore implémenté. Utilisez `GET /api/v1/evidence/:tenant/:z_id` à la place.

#### Réponse 501 Not Implemented

```json
{
  "error": "Z-Report proof retrieval not yet implemented. Use GET /api/v1/evidence/:tenant/:z_id instead"
}
```

---

### POST /api/v1/proof/bulk

Récupère plusieurs preuves en une fois (bulk fetch).

#### Body

```json
{
  "requests": [
    {"type": "account_move", "id": "123"},
    {"type": "account_move", "id": "124"},
    {"type": "account_payment", "id": "456"},
    {"type": "pos_order", "id": "POS/2025/0001"}
  ]
}
```

#### Champs

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `requests` | array | Oui | Liste des requêtes de preuve |
| `requests[].type` | string | Oui | Type de document (`account_move`, `account_payment`, `pos_order`, `pos_payment`) |
| `requests[].id` | string | Oui | ID Odoo du document |

#### Réponse 200 OK

```json
{
  "results": [
    {
      "type": "account_move",
      "id": "123",
      "proof": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "hash": "abc123...",
        "ledger": "LEDGER:INV:00000123",
        "timestamp": "2025-01-15T10:30:00Z",
        "jws": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
        "status": "verified",
        "source_model": "account.move",
        "source_id": "123"
      }
    },
    {
      "type": "account_move",
      "id": "124",
      "proof": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "hash": "def456...",
        "ledger": "LEDGER:INV:00000124",
        "timestamp": "2025-01-15T10:31:00Z",
        "jws": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...",
        "status": "verified",
        "source_model": "account.move",
        "source_id": "124"
      }
    },
    {
      "type": "account_payment",
      "id": "456",
      "proof": null
    }
  ]
}
```

#### Limitations

- **Maximum 100 requêtes** par appel
- **Timeout** : 30 secondes pour l'ensemble de la requête
- **Retour partiel** : Les preuves trouvées sont retournées même si certaines échouent

#### Réponse 400 Bad Request

```json
{
  "error": "Too many requests (maximum 100)"
}
```

#### Exemple

```bash
curl -X POST https://vault.doreviateam.com/api/v1/proof/bulk \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {"type": "account_move", "id": "123"},
      {"type": "account_move", "id": "124"},
      {"type": "account_payment", "id": "456"}
    ]
  }'
```

---

## 📋 Format de Réponse Standardisé

Tous les endpoints retournent le même format de réponse :

```json
{
  "id": "uuid-vault",
  "hash": "sha256_hash",
  "ledger": "ledger_id",
  "prev_hash": "previous_hash",
  "timestamp": "2025-01-15T10:30:00Z",
  "jws": "jws_token",
  "status": "verified",
  "source_model": "account.move",
  "source_id": "123"
}
```

### Champs

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Identifiant unique du document dans Vault |
| `hash` | string | Hash SHA256 du document |
| `ledger` | string (nullable) | Hash dans le ledger (si disponible) |
| `prev_hash` | string (nullable) | Hash du document précédent dans le ledger (Sprint 8) |
| `timestamp` | string (ISO 8601) | Date de création du document |
| `jws` | string (nullable) | Preuve JWS (si disponible) |
| `status` | string | Statut de vérification (`verified` ou `pending`) |
| `source_model` | string (nullable) | Modèle source Odoo (ex: `account.move`) |
| `source_id` | string (nullable) | ID source Odoo |

### Statuts

- **`verified`** : Document vérifié avec preuve JWS disponible
- **`pending`** : Document vaulté mais preuve JWS non encore générée

---

## ❌ Gestion des Erreurs

### Codes HTTP

| Code | Description |
|------|-------------|
| `200` | Succès |
| `400` | Requête invalide (body invalide, trop de requêtes) |
| `401` | Non authentifié |
| `403` | Permission insuffisante |
| `404` | Preuve non trouvée |
| `500` | Erreur serveur |
| `501` | Non implémenté (Z-Reports) |
| `503` | Service indisponible (base de données non configurée) |

### Format d'Erreur

```json
{
  "error": "Error message"
}
```

---

## 🔄 Mapping des Types

| Type de Requête | Source Model Vault |
|-----------------|-------------------|
| `account_move` | `account.move` |
| `account_payment` | `account.payment` |
| `pos_order` | `pos.order` |
| `pos_payment` | `pos.payment` |
| `pos_zreport` | `pos.zreport` (non implémenté) |

---

## 📊 Performance

### Recommandations

- **Timeout** : 5 secondes par requête individuelle
- **Bulk** : Maximum 100 requêtes, timeout de 30 secondes
- **Rate limiting** : 100 requêtes/minute (environnement de test), 1000 requêtes/minute (production)

### Optimisations

- Utilisez l'endpoint **bulk** pour récupérer plusieurs preuves en une fois
- Les index de base de données permettent des recherches rapides (< 100ms)

---

## 🔗 Voir Aussi

- [Documentation API Tickets POS](../docs/POS_TICKETS_API.md)
- [Documentation API Z-Reports](../docs/ZREPORTS_API.md)
- [Documentation API Ledger Export](../docs/LEDGER_EXPORT_API.md)
- [Réponse à l'équipe dorevia_vault_report](../docs/REPONSE_EQUIPE_DOREVIA_VAULT_TESTS_INTEGRATION.md)

---

## 🆕 Changements Sprint 8

### Option B : `prev_hash` dans les Réponses

Depuis Sprint 8, le champ `prev_hash` est **automatiquement inclus** dans toutes les réponses des endpoints `/api/v1/proof/*`.

**Avantage** : Plus besoin d'appeler `/api/v1/ledger/export` séparément pour obtenir le `prev_hash`.

**Rétrocompatibilité** : Le champ est optionnel, le code existant continue de fonctionner.

---

**Version** : 1.1 (Sprint 8 + 8.1)  
**Date** : 2025-11-24  
**Dernière mise à jour** : 2025-11-26 (Sprint 8.1 - Compatibilité DVIG)


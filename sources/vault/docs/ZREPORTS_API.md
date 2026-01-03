# 📘 API Z-Reports — Dorevia Vault

**Sprint 7** — Endpoints pour l'ingestion et la récupération de Z-Reports POS avec double chaînage cryptographique.

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification](#authentification)
3. [Endpoints](#endpoints)
   - [POST /api/v1/pos/zreports](#post-apiv1poszreports)
   - [GET /api/v1/evidence/:tenant/:z_id](#get-apiv1evidencetenantz_id)
   - [GET /api/v1/health/zreports](#get-apiv1healthzreports)
4. [Format des données](#format-des-données)
5. [Chaînage cryptographique](#chaînage-cryptographique)
6. [Gestion des erreurs](#gestion-des-erreurs)
7. [Exemples](#exemples)

---

## Vue d'ensemble

Les Z-Reports sont des rapports de clôture de session POS qui sont stockés dans un **ledger filesystem dédié** (séparé du ledger PostgreSQL) avec :

- **Double chaînage cryptographique** : Chaînage entre Z-Reports (`hash_prev`) et chaînage avec tickets POS (`last_ticket_hash`)
- **Preuve JWS** : Signature cryptographique pour chaque Z-Report
- **Multi-tenant** : Isolation stricte par tenant
- **Stockage immuable** : Ledger filesystem avec opérations atomiques

---

## Authentification

Tous les endpoints Z-Reports nécessitent une authentification via :

- **Header `Authorization`** : `Bearer <token>` ou `Apikey <key>`
- **Permission requise** :
  - `documents:write` pour `POST /api/v1/pos/zreports`
  - `documents:read` pour `GET /api/v1/evidence/:tenant/:z_id`
  - Aucune pour `GET /api/v1/health/zreports`

---

## Endpoints

### POST /api/v1/pos/zreports

Ingère un Z-Report dans le ledger filesystem.

#### Headers

| Header | Type | Requis | Description |
|--------|------|--------|-------------|
| `Authorization` | string | Oui | Token JWT ou API Key |
| `X-Tenant` | string | Oui | Identifiant du tenant |
| `Content-Type` | string | Oui | `application/json` |

#### Body

```json
{
  "z_id": "Z2025-01-15-01",
  "company_id": 1,
  "sequence": 1,
  "date_open": "2025-01-15T08:00:00Z",
  "date_close": "2025-01-15T18:00:00Z",
  "totals": {
    "amount_total": 1000.0,
    "amount_tax": 100.0,
    "amount_net": 900.0
  },
  "payments": [
    {
      "method": "cash",
      "amount": 1000.0
    }
  ],
  "tickets": ["POS/2025/0001", "POS/2025/0002"],
  "tickets_count": 2,
  "hash_prev": "abc123...",
  "last_ticket_hash": "def456...",
  "chain_level": "z-report",
  "tenant": "tenant-1"
}
```

#### Champs

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `z_id` | string | Oui | Identifiant unique du Z-Report (format recommandé: `ZYYYY-MM-DD-NN`) |
| `company_id` | integer | Oui | ID de l'entreprise (> 0) |
| `sequence` | integer | Oui | Numéro de séquence du Z-Report |
| `date_open` | string (RFC3339) | Oui | Date/heure d'ouverture de la session |
| `date_close` | string (RFC3339) | Oui | Date/heure de clôture de la session |
| `totals` | object | Oui | Totaux de la session |
| `totals.amount_total` | float | Oui | Montant total TTC |
| `totals.amount_tax` | float | Oui | Montant de TVA |
| `totals.amount_net` | float | Oui | Montant net HT |
| `payments` | array | Oui | Liste des paiements |
| `payments[].method` | string | Oui | Méthode de paiement (ex: "cash", "card") |
| `payments[].amount` | float | Oui | Montant du paiement |
| `tickets` | array[string] | Oui | Liste des IDs de tickets inclus dans le Z-Report |
| `tickets_count` | integer | Oui | Nombre de tickets (doit correspondre à `len(tickets)`) |
| `hash_prev` | string | Non | Hash du Z-Report précédent (pour chaînage) |
| `last_ticket_hash` | string | Oui | SHA256 du dernier ticket POS vaulté |
| `chain_level` | string | Oui | Niveau de chaînage (toujours `"z-report"`) |
| `tenant` | string | Oui | Identifiant du tenant (doit correspondre à `X-Tenant`) |

#### Réponse 201 Created

```json
{
  "z_id": "Z2025-01-15-01",
  "tenant": "tenant-1",
  "hash_current": "abc123def456...",
  "hash_prev": null,
  "evidence_jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "timestamp": "2025-01-15T18:00:00Z",
  "proof_url": "/api/v1/evidence/tenant-1/Z2025-01-15-01"
}
```

#### Réponse 400 Bad Request

```json
{
  "error": "Validation failed",
  "details": "validation error [tenant]: tenant mismatch: header=tenant-1, payload=tenant-2"
}
```

#### Réponse 413 Request Entity Too Large

```json
{
  "error": "Payload too large",
  "max_size_bytes": 1048576
}
```

#### Réponse 500 Internal Server Error

```json
{
  "error": "Failed to ingest Z-Report"
}
```

---

### GET /api/v1/evidence/:tenant/:z_id

Récupère les informations d'un Z-Report (preuve d'intégrité).

#### Headers

| Header | Type | Requis | Description |
|--------|------|--------|-------------|
| `Authorization` | string | Oui | Token JWT ou API Key |

#### Paramètres

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `tenant` | string | Oui | Identifiant du tenant |
| `z_id` | string | Oui | Identifiant du Z-Report |

#### Réponse 200 OK

```json
{
  "z_id": "Z2025-01-15-01",
  "tenant": "tenant-1",
  "hash_current": "abc123def456...",
  "hash_prev": null,
  "timestamp": "2025-01-15T18:00:00Z",
  "proof_url": "/api/v1/evidence/tenant-1/Z2025-01-15-01"
}
```

#### Réponse 404 Not Found

```json
{
  "error": "Z-Report not found"
}
```

---

### GET /api/v1/health/zreports

Vérifie l'état du système Z-Reports (ledger filesystem).

#### Réponse 200 OK

```json
{
  "status": "healthy",
  "ledger_path": "/opt/dorevia-vault/ledger",
  "fsync_enabled": true
}
```

---

## Format des données

### Structure du ledger filesystem

Les Z-Reports sont stockés dans le répertoire :

```
ledger/
  tenants/
    <tenant>/
      pos/
        z/
          YYYY/
            MM/
              <z_id>.json
              index.json
              last.json
```

#### Fichier Z-Report (`<z_id>.json`)

```json
{
  "payload": {
    "z_id": "Z2025-01-15-01",
    "company_id": 1,
    "sequence": 1,
    "date_open": "2025-01-15T08:00:00Z",
    "date_close": "2025-01-15T18:00:00Z",
    "totals": {
      "amount_total": 1000.0,
      "amount_tax": 100.0,
      "amount_net": 900.0
    },
    "payments": [
      {
        "method": "cash",
        "amount": 1000.0
      }
    ],
    "tickets": ["POS/2025/0001"],
    "tickets_count": 1,
    "hash_prev": null,
    "last_ticket_hash": "def456...",
    "chain_level": "z-report",
    "tenant": "tenant-1"
  },
  "hash_current": "abc123...",
  "hash_prev": null,
  "timestamp": "2025-01-15T18:00:00Z",
  "proof_url": "/api/v1/evidence/tenant-1/Z2025-01-15-01"
}
```

#### Fichier index (`index.json`)

```json
{
  "last_z_id": "Z2025-01-15-02",
  "last_hash": "def456...",
  "count": 2,
  "z_reports": [
    "Z2025-01-15-01",
    "Z2025-01-15-02"
  ]
}
```

#### Fichier last (`last.json`)

```json
{
  "z_id": "Z2025-01-15-02",
  "hash": "def456..."
}
```

---

## Chaînage cryptographique

### Double chaînage

1. **Chaînage Z-Reports** (`hash_prev`) :
   - Le premier Z-Report du mois a `hash_prev = null`
   - Les Z-Reports suivants ont `hash_prev = hash_current` du Z-Report précédent
   - Vérification automatique lors de l'ingestion

2. **Chaînage avec tickets POS** (`last_ticket_hash`) :
   - `last_ticket_hash` doit correspondre au SHA256 d'un ticket POS déjà vaulté
   - Vérification que le ticket existe dans la base de données

### Calcul du hash

Le `hash_current` est calculé comme suit :

1. **Canonicalisation** : JSON trié selon l'ordre canonique (sans `hash_current`)
2. **Hash SHA256** : `hash_current = SHA256(canonical_json)`

Ordre canonique des champs :
1. `chain_level`
2. `company_id`
3. `date_close`
4. `date_open`
5. `hash_prev` (si présent)
6. `last_ticket_hash`
7. `payments`
8. `sequence`
9. `tickets`
10. `tickets_count`
11. `totals`
12. `z_id`
13. `tenant`

### Preuve JWS

Chaque Z-Report génère une preuve JWS avec le payload :

```json
{
  "z_id": "Z2025-01-15-01",
  "tenant": "tenant-1",
  "hash_current": "abc123...",
  "hash_prev": null,
  "iat": 1705334400,
  "iss": "dorevia-vault"
}
```

---

## Gestion des erreurs

### Codes HTTP

| Code | Description |
|------|-------------|
| `200` | Succès (GET) |
| `201` | Z-Report créé avec succès |
| `400` | Erreur de validation (tenant mismatch, champs manquants, etc.) |
| `401` | Non authentifié |
| `403` | Permission insuffisante |
| `404` | Z-Report non trouvé |
| `413` | Payload trop volumineux |
| `500` | Erreur serveur |

### Erreurs de validation

- **Tenant mismatch** : Le tenant du header `X-Tenant` ne correspond pas au tenant du payload
- **Last ticket not found** : Le `last_ticket_hash` ne correspond à aucun ticket vaulté
- **Hash prev mismatch** : Le `hash_prev` ne correspond pas au dernier hash du mois
- **Tickets count mismatch** : `tickets_count` ne correspond pas à `len(tickets)`

---

## Exemples

### Premier Z-Report du mois

```bash
curl -X POST https://vault.doreviateam.com/api/v1/pos/zreports \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant: tenant-1" \
  -H "Content-Type: application/json" \
  -d '{
    "z_id": "Z2025-01-15-01",
    "company_id": 1,
    "sequence": 1,
    "date_open": "2025-01-15T08:00:00Z",
    "date_close": "2025-01-15T18:00:00Z",
    "totals": {
      "amount_total": 1000.0,
      "amount_tax": 100.0,
      "amount_net": 900.0
    },
    "payments": [
      {"method": "cash", "amount": 1000.0}
    ],
    "tickets": ["POS/2025/0001"],
    "tickets_count": 1,
    "last_ticket_hash": "abc123...",
    "chain_level": "z-report",
    "tenant": "tenant-1"
  }'
```

### Z-Report chaîné (deuxième du mois)

```bash
curl -X POST https://vault.doreviateam.com/api/v1/pos/zreports \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant: tenant-1" \
  -H "Content-Type: application/json" \
  -d '{
    "z_id": "Z2025-01-15-02",
    "company_id": 1,
    "sequence": 2,
    "date_open": "2025-01-15T18:00:00Z",
    "date_close": "2025-01-15T22:00:00Z",
    "totals": {
      "amount_total": 2000.0,
      "amount_tax": 200.0,
      "amount_net": 1800.0
    },
    "payments": [
      {"method": "card", "amount": 2000.0}
    ],
    "tickets": ["POS/2025/0002"],
    "tickets_count": 1,
    "hash_prev": "abc123...",
    "last_ticket_hash": "def456...",
    "chain_level": "z-report",
    "tenant": "tenant-1"
  }'
```

### Récupération de la preuve

```bash
curl -X GET https://vault.doreviateam.com/api/v1/evidence/tenant-1/Z2025-01-15-01 \
  -H "Authorization: Bearer <token>"
```

---

## Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `LEDGER_FILESYSTEM_PATH` | Chemin du répertoire ledger filesystem | `/opt/dorevia-vault/ledger` |
| `ZREPORT_MAX_SIZE_BYTES` | Taille maximale du payload (octets) | `1048576` (1 MB) |
| `ZREPORT_FSYNC_ENABLED` | Activer fsync pour durabilité | `true` |

---

## Métriques Prometheus

Les métriques suivantes sont disponibles via `/metrics` :

- `zreports_ingested_total{status, tenant}` : Nombre de Z-Reports ingérés
- `zreports_chain_errors_total{tenant, error_type}` : Erreurs de chaînage
- `zreports_storage_duration_seconds{tenant}` : Durée de stockage

---

**Version** : 1.5.0 (Sprint 7)  
**Date** : Janvier 2025


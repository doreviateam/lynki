# 📘 API Ledger Export — Documentation

**Version** : 1.1  
**Date** : 2025-11-24  
**Dernière mise à jour** : 2025-11-26 (Sprint 8.1 - Compatibilité DVIG)  
**Sprint** : Sprint 8 + 8.1

---

## 🎯 Vue d'ensemble

L'endpoint `/api/v1/ledger/export` permet d'exporter le ledger (chaîne cryptographique) au format JSON ou CSV, avec support du filtrage par `document_id` depuis Sprint 8.

---

## 🔐 Authentification

**Permission requise** : `ledger:read`

**Header** : `Authorization: Bearer <token>` ou `Apikey <key>`

---

## 📡 Endpoint

### GET /api/v1/ledger/export

Exporte le ledger avec pagination ou récupère une entrée spécifique par `document_id`.

#### Paramètres

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `format` | string | Non | Format de sortie : `json` (défaut) ou `csv` |
| `document_id` | string (UUID) | Non | **Sprint 8** : Filtrer par document spécifique |
| `limit` | integer | Non | Nombre de lignes (1-10000, défaut: 100) - Ignoré si `document_id` fourni |
| `offset` | integer | Non | Décalage (défaut: 0) - Ignoré si `document_id` fourni |

#### Mode 1 : Export Complet (Pagination)

**Sans paramètre `document_id`** : Exporte le ledger complet avec pagination.

**Exemple** :
```bash
curl -X GET "https://vault.doreviateam.com/api/v1/ledger/export?format=json&limit=10&offset=0" \
  -H "Authorization: Bearer <token>"
```

**Réponse** :
```json
[
  {
    "id": 123,
    "document_id": "550e8400-e29b-41d4-a716-446655440000",
    "hash": "abc123...",
    "prev_hash": "def456...",
    "seq": 123,
    "timestamp": "2025-01-15T10:30:00Z"
  },
  {
    "id": 124,
    "document_id": "550e8400-e29b-41d4-a716-446655440001",
    "hash": "def456...",
    "prev_hash": "abc123...",
    "seq": 124,
    "timestamp": "2025-01-15T10:31:00Z"
  }
]
```

#### Mode 2 : Entrée Spécifique (Sprint 8 - Option A)

**Avec paramètre `document_id`** : Retourne uniquement l'entrée ledger pour ce document.

**Exemple** :
```bash
curl -X GET "https://vault.doreviateam.com/api/v1/ledger/export?document_id=550e8400-e29b-41d4-a716-446655440000&format=json" \
  -H "Authorization: Bearer <token>"
```

**Réponse JSON** :
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "hash": "abc123...",
  "prev_hash": "def456...",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Réponse CSV** :
```csv
document_id,hash,prev_hash,timestamp
550e8400-e29b-41d4-a716-446655440000,abc123...,def456...,2025-01-15T10:30:00Z
```

#### Réponse 404 Not Found

Si `document_id` est fourni mais l'entrée n'existe pas :

```json
{
  "error": "Ledger entry not found"
}
```

---

## 📋 Format de Réponse

### Mode Export Complet

**Format** : Tableau d'objets `LedgerRow`

```json
[
  {
    "id": 123,
    "document_id": "uuid",
    "hash": "sha256_hash",
    "prev_hash": "previous_hash",
    "seq": 123,
    "timestamp": "2025-01-15T10:30:00Z"
  }
]
```

### Mode Entrée Spécifique (Sprint 8)

**Format** : Objet simplifié

```json
{
  "document_id": "uuid",
  "hash": "sha256_hash",
  "prev_hash": "previous_hash",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Champs

| Champ | Type | Description |
|-------|------|-------------|
| `id` | integer | ID interne du ledger (mode export complet uniquement) |
| `document_id` | string (UUID) | Identifiant du document dans Vault |
| `hash` | string | Hash chaîné du document |
| `prev_hash` | string (nullable) | Hash du document précédent dans le ledger |
| `seq` | integer | Numéro de séquence (mode export complet uniquement) |
| `timestamp` | string (ISO 8601) | Date/heure d'ajout au ledger |

---

## ❌ Gestion des Erreurs

| Code | Description |
|------|-------------|
| `200` | Succès |
| `400` | Requête invalide (format invalide, limit hors limites) |
| `401` | Non authentifié |
| `403` | Permission insuffisante |
| `404` | Entrée ledger non trouvée (si `document_id` fourni) |
| `500` | Erreur serveur |
| `503` | Service indisponible (base de données non configurée) |

---

## 🧪 Exemples d'Utilisation

### Exemple 1 : Export Complet (Pagination)

```bash
# Première page (100 premières entrées)
curl -X GET "https://vault.doreviateam.com/api/v1/ledger/export?format=json&limit=100&offset=0" \
  -H "Authorization: Bearer <token>"

# Deuxième page
curl -X GET "https://vault.doreviateam.com/api/v1/ledger/export?format=json&limit=100&offset=100" \
  -H "Authorization: Bearer <token>"
```

### Exemple 2 : Récupération par Document ID (Sprint 8)

```bash
# Récupérer prev_hash pour un document spécifique
curl -X GET "https://vault.doreviateam.com/api/v1/ledger/export?document_id=550e8400-e29b-41d4-a716-446655440000&format=json" \
  -H "Authorization: Bearer <token>"
```

### Exemple 3 : Export CSV

```bash
# Export CSV complet
curl -X GET "https://vault.doreviateam.com/api/v1/ledger/export?format=csv&limit=1000" \
  -H "Authorization: Bearer <token>"

# Export CSV pour un document spécifique
curl -X GET "https://vault.doreviateam.com/api/v1/ledger/export?document_id=550e8400-e29b-41d4-a716-446655440000&format=csv" \
  -H "Authorization: Bearer <token>"
```

---

## 📊 Performance

### Mode Export Complet

- **Limite** : Maximum 10000 entrées par requête
- **Performance** : < 100ms pour 1000 entrées
- **Recommandation** : Utiliser pagination pour gros volumes

### Mode Entrée Spécifique (Sprint 8)

- **Performance** : < 10ms par requête
- **Index** : Recherche optimisée par `document_id`
- **Recommandation** : Utiliser ce mode pour récupérer `prev_hash` d'un document spécifique

---

## 🔗 Cas d'Usage

### Cas 1 : Récupération `prev_hash` pour dorevia_vault_report

**Workflow recommandé** :

1. Récupérer la preuve : `GET /api/v1/proof/account_move/123`
2. Extraire `document_id` : `proof['id']`
3. Récupérer `prev_hash` : `GET /api/v1/ledger/export?document_id=<uuid>`

**Note** : Depuis Sprint 8, `prev_hash` est également inclus directement dans la réponse proof (Option B).

### Cas 2 : Export Complet pour Audit

**Workflow** :

1. Exporter le ledger complet avec pagination
2. Vérifier l'intégrité de la chaîne cryptographique
3. Générer un rapport d'audit

---

## 📝 Notes Techniques

### Chaînage Cryptographique

Le champ `prev_hash` permet de vérifier le chaînage cryptographique :

- **Premier document** : `prev_hash = null`
- **Documents suivants** : `prev_hash = hash` du document précédent

### Rétrocompatibilité

- ✅ **Paramètre `document_id` optionnel** : N'affecte pas l'export complet
- ✅ **Format de réponse** : Mode export complet inchangé
- ✅ **Mode entrée spécifique** : Nouveau format simplifié

---

## 🔗 Voir Aussi

- [Documentation API Proof](../docs/PROOF_API.md)
- [Réponse à l'équipe Odoo](../docs/REPONSE_EQUIPE_ODOO_V3_DECISIONS.md)

---

**Version** : 1.1 (Sprint 8)  
**Date** : 2025-11-24


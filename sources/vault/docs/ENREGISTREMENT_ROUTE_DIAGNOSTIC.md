# 📝 Enregistrement de la Route de Diagnostic

**Date** : 2025-12-11  
**Endpoint** : `GET /api/v1/diagnostic/document/:id`

---

## 📋 Instructions

Pour enregistrer l'endpoint de diagnostic, ajoutez la route dans le fichier qui configure les routes API (probablement dans un fichier `main.go` ou un fichier de configuration des routes).

### Exemple d'enregistrement

```go
// Dans le fichier qui configure les routes (probablement main.go ou routes.go)

import (
    "github.com/doreviateam/dorevia-vault/internal/handlers"
    // ... autres imports
)

// Dans la fonction qui configure les routes
api := app.Group("/api/v1")

// ... autres routes existantes ...

// Ajouter la route de diagnostic
api.Get("/diagnostic/document/:id", handlers.DiagnosticDocumentHandler(db))
```

### Emplacement suggéré

L'endpoint devrait être enregistré dans le même groupe `/api/v1` que les autres endpoints API, probablement près de :

- `/api/v1/push_document` (POST)
- `/api/v1/documents/:id` (GET)
- `/api/v1/proof/*` (GET)

---

## 🔍 Utilisation

Une fois enregistré, l'endpoint peut être utilisé ainsi :

```bash
# Vérifier l'état d'un document
curl -X GET "https://vault.doreviateam.com/api/v1/diagnostic/document/85852790-be9e-4432-84c0-a3f00ed2353e" \
  -H "Authorization: Bearer <token>"
```

### Réponse attendue

**Si le document existe** :
```json
{
  "vault_id": "85852790-be9e-4432-84c0-a3f00ed2353e",
  "exists_in_database": true,
  "exists_on_disk": true,
  "document": {
    "id": "85852790-be9e-4432-84c0-a3f00ed2353e",
    "filename": "facture.pdf",
    "sha256_hex": "...",
    "created_at": "2025-12-10T21:28:25Z",
    "tenant": "1",
    "has_jws": true,
    "has_ledger": true,
    "file_path": "storage/2025/12/10/...",
    "file_size": 12345,
    "evidence_jws": "...",
    "ledger_hash": "..."
  }
}
```

**Si le document n'existe pas** :
```json
{
  "vault_id": "85852790-be9e-4432-84c0-a3f00ed2353e",
  "exists_in_database": false,
  "exists_on_disk": false,
  "error": "Document not found in database",
  "error_details": "document not found"
}
```

---

## ✅ Vérification

Après l'enregistrement, vérifiez que :

1. ✅ L'endpoint répond correctement
2. ✅ Les erreurs sont bien gérées (UUID invalide, document non trouvé)
3. ✅ L'authentification fonctionne (si nécessaire)
4. ✅ Les logs sont correctement générés

---

**Fin du Document**

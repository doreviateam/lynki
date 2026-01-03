# ✅ Réponse — Erreur 500 sur Preuve JWS

**Date** : 2025-12-13  
**De** : Équipe Vault Engineering  
**À** : Équipe Odoo Engineering  
**Objet** : Diagnostic et solution — Erreur HTTP 500 lors de l'accès à une preuve JWS  
**Priorité** : 🔴 **HAUTE**

---

## 📋 Résumé Exécutif

**Statut** : ✅ **Problème identifié et solution proposée**

**Cause racine** : L'URL utilisée (`/api/v1/push_document/verify/`) **n'existe pas** dans l'API Vault. L'endpoint correct pour vérifier un document est `/api/v1/ledger/verify/:document_id` qui attend un **UUID**, pas un JWT.

**Solution immédiate** : Utiliser l'endpoint correct avec le `document_id` extrait du JWT.

**Solution à long terme** : Créer un endpoint dédié qui accepte un JWT directement dans l'URL (optionnel).

---

## 🔍 Diagnostic Détaillé

### 1. Analyse de l'URL Fournie

**URL utilisée** :
```
https://vault.doreviateam.com/api/v1/push_document/verify/eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleS0yMDI1LVExIiwidHlwIjoiSldUIn0...
```

**Problème identifié** :
- ❌ L'endpoint `/api/v1/push_document/verify/` **n'existe pas** dans le codebase Vault
- ❌ Aucune route n'est enregistrée pour ce pattern dans `cmd/vault/main.go`
- ✅ Le JWT fourni est **valide** et contient les informations nécessaires

### 2. Informations Extraites du JWT

**JWT décodé** :
```json
{
  "header": {
    "alg": "RS256",
    "kid": "key-2025-Q1",
    "typ": "JWT"
  },
  "payload": {
    "document_id": "88d73c8a-efd2-481c-9ede-8196e30705a1",
    "iat": 1765505404,
    "sha256": "ac0e0c172f45a05cbf751cea7256753c1479c49cfa555e717fdde5c04f7a8948",
    "timestamp": "2025-12-12T02:10:04Z"
  }
}
```

**Informations clés** :
- **Document ID** : `88d73c8a-efd2-481c-9ede-8196e30705a1` (UUID valide)
- **Hash SHA256** : `ac0e0c172f45a05cbf751cea7256753c1479c49cfa555e717fdde5c04f7a8948`
- **Timestamp** : `2025-12-12T02:10:04Z`

### 3. Endpoints Disponibles dans Vault

**Endpoints de vérification existants** :

| Endpoint | Description | Format attendu |
|----------|-------------|----------------|
| `GET /api/v1/ledger/verify/:document_id` | Vérification intégrité par UUID | UUID (ex: `88d73c8a-efd2-481c-9ede-8196e30705a1`) |
| `GET /api/v1/ledger/verify/:document_id?signed=true` | Vérification avec preuve JWS signée | UUID + paramètre `signed=true` |
| `GET /api/v1/proof/account_move/:id` | Preuve facture par ID Odoo | ID Odoo (ex: `123`) |
| `GET /api/v1/proof/pos_order/:id` | Preuve ticket POS par ID Odoo | ID Odoo (ex: `456`) |

**Endpoints qui n'existent pas** :
- ❌ `GET /api/v1/push_document/verify/:jwt` (n'existe pas)
- ❌ `GET /api/v1/evidence/verify/:jwt` (n'existe pas)

---

## ✅ Solutions Proposées

### Solution 1 : Utiliser l'Endpoint Correct (IMMÉDIATE)

**Action** : Extraire le `document_id` du JWT et utiliser l'endpoint `/api/v1/ledger/verify/:document_id`.

**URL correcte** :
```
https://vault.doreviateam.com/api/v1/ledger/verify/88d73c8a-efd2-481c-9ede-8196e30705a1
```

**Avec preuve JWS signée** :
```
https://vault.doreviateam.com/api/v1/ledger/verify/88d73c8a-efd2-481c-9ede-8196e30705a1?signed=true
```

**Implémentation côté Odoo** :

```python
import jwt
import json

def get_proof_url_from_jws(evidence_jws):
    """
    Extrait le document_id du JWT et construit l'URL de vérification.
    
    Args:
        evidence_jws: JWT (evidence_jws) retourné par l'API Vault
    
    Returns:
        URL de vérification complète
    """
    try:
        # Décoder le JWT sans vérifier la signature (on veut juste extraire le document_id)
        decoded = jwt.decode(evidence_jws, options={"verify_signature": False})
        document_id = decoded.get("document_id")
        
        if not document_id:
            raise ValueError("document_id not found in JWT")
        
        # Construire l'URL de vérification
        vault_url = self.env['ir.config_parameter'].sudo().get_param('dorevia.vault.url', 'https://vault.doreviateam.com')
        return f"{vault_url}/api/v1/ledger/verify/{document_id}"
        
    except Exception as e:
        # Log l'erreur et retourner None ou lever une exception
        _logger.error(f"Failed to extract document_id from JWT: {e}")
        return None
```

**Avantages** :
- ✅ Utilise l'endpoint existant et testé
-- ✅ Pas de modification côté Vault nécessaire
- ✅ Solution immédiate

**Inconvénients** :
- ⚠️ Nécessite de décoder le JWT côté Odoo
- ⚠️ L'URL ne contient pas directement le JWT (mais le document_id)

---

### Solution 2 : Créer un Endpoint Dédié (À LONG TERME)

**Action** : Créer un nouvel endpoint `/api/v1/evidence/verify/:jwt` qui accepte un JWT directement dans l'URL.

**Nouvelle route** :
```
GET /api/v1/evidence/verify/:jwt
```

**Implémentation** :

**Fichier** : `internal/handlers/evidence.go` (nouveau)

```go
package handlers

import (
	"context"
	"time"

	"github.com/doreviateam/dorevia-vault/internal/crypto"
	"github.com/doreviateam/dorevia-vault/internal/storage"
	"github.com/doreviateam/dorevia-vault/internal/verify"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// VerifyEvidenceHandler gère GET /api/v1/evidence/verify/:jwt
// Accepte un JWT (evidence_jws) directement dans l'URL et retourne la preuve
func VerifyEvidenceHandler(
	db *storage.DB,
	jwsService *crypto.Service,
	log *zerolog.Logger,
) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Database not configured",
			})
		}

		if jwsService == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "JWS service not configured",
			})
		}

		// Récupérer le JWT depuis les paramètres
		jwtStr := c.Params("jwt")
		if jwtStr == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Missing JWT parameter",
			})
		}

		// Vérifier et extraire l'Evidence du JWT
		evidence, err := jwsService.VerifyEvidence(jwtStr)
		if err != nil {
			log.Error().Err(err).Msg("Failed to verify JWT evidence")
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid JWT evidence",
				"details": err.Error(),
			})
		}

		// Parser le document_id depuis l'Evidence
		docID, err := uuid.Parse(evidence.DocumentID)
		if err != nil {
			log.Error().Err(err).Str("document_id", evidence.DocumentID).Msg("Invalid document_id format")
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid document_id format in JWT",
			})
		}

		// Vérifier l'intégrité du document
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		result, err := verify.VerifyDocumentIntegrity(ctx, db, docID)
		if err != nil {
			log.Error().Err(err).Str("document_id", evidence.DocumentID).Msg("Failed to verify document integrity")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to verify document integrity",
				"details": err.Error(),
			})
		}

		// Retourner la réponse avec l'Evidence JWT
		return c.JSON(fiber.Map{
			"verification_result": result,
			"evidence_jws": jwtStr,
			"evidence": fiber.Map{
				"document_id": evidence.DocumentID,
				"sha256":      evidence.Sha256,
				"timestamp":   evidence.Timestamp.Format(time.RFC3339),
			},
		})
	}
}
```

**Enregistrement de la route** : `cmd/vault/main.go`

```go
// Route Sprint 8+ : Endpoint Evidence Verify (permission documents:read)
evidenceGroup := apiGroup.Group("/evidence")
if rbacService != nil {
    evidenceGroup.Use(auth.RequirePermission(rbacService, auth.PermissionReadDocuments, *log))
}
if db != nil && jwsService != nil {
    evidenceGroup.Get("/verify/:jwt", handlers.VerifyEvidenceHandler(db, jwsService, log))
    log.Info().Msg("Evidence verify endpoint enabled: /api/v1/evidence/verify/:jwt")
}
```

**Avantages** :
- ✅ URL directe avec JWT (plus simple côté Odoo)
- ✅ Pas besoin de décoder le JWT côté Odoo
- ✅ Endpoint dédié et clair

**Inconvénients** :
- ⚠️ Nécessite un développement côté Vault
- ⚠️ Déploiement nécessaire

---

## 🔧 Actions Immédiates

### Côté Odoo (Solution 1)

1. **Modifier la génération de l'URL de preuve** :
   - Extraire le `document_id` du JWT
   - Utiliser `/api/v1/ledger/verify/:document_id` au lieu de `/api/v1/push_document/verify/:jwt`

2. **Code Python proposé** :
```python
import jwt
import logging

_logger = logging.getLogger(__name__)

@api.depends('vault_evidence_jws')
def _compute_vault_proof_url(self):
    """Génère l'URL de preuve à partir du JWT."""
    for record in self:
        if not record.vault_evidence_jws:
            record.vault_proof_url = False
            continue
        
        try:
            # Décoder le JWT sans vérifier la signature
            decoded = jwt.decode(
                record.vault_evidence_jws,
                options={"verify_signature": False}
            )
            document_id = decoded.get("document_id")
            
            if document_id:
                vault_url = self.env['ir.config_parameter'].sudo().get_param(
                    'dorevia.vault.url',
                    'https://vault.doreviateam.com'
                )
                # ✅ URL CORRECTE
                record.vault_proof_url = f"{vault_url}/api/v1/ledger/verify/{document_id}"
            else:
                record.vault_proof_url = False
        except Exception as e:
            _logger.error("Failed to generate proof URL: %s", str(e))
            record.vault_proof_url = False
```

**📚 Guide détaillé** : Voir `GUIDE_CORRECTION_URL_PREUVE_ODOO.md` pour un guide complet avec exemples par modèle.

### Côté Vault (Solution 2 - Optionnel)

1. **Créer le handler** : `internal/handlers/evidence.go`
2. **Enregistrer la route** : `cmd/vault/main.go`
3. **Tester** : Vérifier que l'endpoint fonctionne avec un JWT valide
4. **Déployer** : Mise en production

---

## 📊 Vérification du Document

### Statut du Document dans la Base de Données

**Requête SQL pour vérifier** :
```sql
SELECT 
    id,
    sha256_hex,
    created_at,
    evidence_jws IS NOT NULL as has_jws,
    ledger_hash IS NOT NULL as has_ledger_hash
FROM documents
WHERE id = '88d73c8a-efd2-481c-9ede-8196e30705a1';
```

**Vérification du hash** :
```sql
SELECT 
    id,
    sha256_hex,
    CASE 
        WHEN sha256_hex = 'ac0e0c172f45a05cbf751cea7256753c1479c49cfa555e717fdde5c04f7a8948' 
        THEN 'Hash matches' 
        ELSE 'Hash mismatch' 
    END as hash_status
FROM documents
WHERE id = '88d73c8a-efd2-481c-9ede-8196e30705a1';
```

---

## 🧪 Tests de Validation

### Test 1 : Vérification avec Document ID

```bash
curl -X GET "https://vault.doreviateam.com/api/v1/ledger/verify/88d73c8a-efd2-481c-9ede-8196e30705a1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Résultat attendu** :
```json
{
  "document_id": "88d73c8a-efd2-481c-9ede-8196e30705a1",
  "valid": true,
  "checks": [
    {
      "name": "file_exists",
      "status": "ok"
    },
    {
      "name": "hash_match",
      "status": "ok"
    },
    {
      "name": "ledger_consistent",
      "status": "ok"
    }
  ]
}
```

### Test 2 : Vérification avec Preuve JWS Signée

```bash
curl -X GET "https://vault.doreviateam.com/api/v1/ledger/verify/88d73c8a-efd2-481c-9ede-8196e30705a1?signed=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Résultat attendu** :
```json
{
  "document_id": "88d73c8a-efd2-481c-9ede-8196e30705a1",
  "valid": true,
  "checks": [...],
  "signed_proof": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📝 Logs et Diagnostic

### Logs à Vérifier

**Sur le serveur Vault** :
```bash
# Logs du service
journalctl -u dorevia-vault -n 100 | grep -i "88d73c8a-efd2-481c-9ede-8196e30705a1"

# Logs d'erreur
journalctl -u dorevia-vault -n 100 | grep -i "error\|500\|failed"
```

**Requêtes récentes** :
```bash
# Logs avec document_id
journalctl -u dorevia-vault -n 500 | grep "88d73c8a-efd2-481c-9ede-8196e30705a1"
```

### Métriques Prometheus

**Vérifier les métriques** :
```bash
curl https://vault.doreviateam.com/metrics | grep vault_verification
```

---

## 🎯 Recommandations

### Immédiat (Solution 1)

1. ✅ **Utiliser l'endpoint correct** : `/api/v1/ledger/verify/:document_id`
2. ✅ **Extraire le document_id** du JWT côté Odoo
3. ✅ **Tester** avec le document ID fourni

### À Long Terme (Solution 2)

1. ⏳ **Créer l'endpoint dédié** : `/api/v1/evidence/verify/:jwt`
2. ⏳ **Déployer** la nouvelle route
3. ⏳ **Documenter** l'endpoint dans la documentation API

### Amélioration UX

1. **Gestion d'erreur** : Afficher un message clair si la preuve n'est pas accessible
2. **Fallback** : Proposer une alternative si l'endpoint échoue
3. **Monitoring** : Ajouter des alertes pour les erreurs 500 sur les preuves

---

## 📞 Contact et Support

**Équipe Vault** : Doreviateam — Vault Engineering  
**Date de réponse** : 2025-12-13  
**Statut** : ✅ **DIAGNOSTIC COMPLET — SOLUTION PROPOSÉE**

---

## ✅ Checklist de Résolution

### Côté Odoo

- [ ] Modifier la génération de l'URL de preuve (extraire document_id du JWT)
- [ ] Tester avec le document ID : `88d73c8a-efd2-481c-9ede-8196e30705a1`
- [ ] Vérifier que l'URL fonctionne : `/api/v1/ledger/verify/88d73c8a-efd2-481c-9ede-8196e30705a1`
- [ ] Déployer la correction

### Côté Vault (Optionnel - Solution 2)

- [ ] Créer le handler `VerifyEvidenceHandler`
- [ ] Enregistrer la route `/api/v1/evidence/verify/:jwt`
- [ ] Tester l'endpoint avec un JWT valide
- [ ] Documenter l'endpoint
- [ ] Déployer

---

**Merci de votre patience. La solution immédiate (Solution 1) devrait résoudre le problème sans modification côté Vault.**


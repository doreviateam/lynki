# 📋 Réponses — Questions Intégration API Dorevia Vault

**Date** : 2025-01-15  
**Projet** : Connecteur Dorevia Vault pour Odoo 18  
**Version API** : v1.3.0

---

## ✅ Réponses aux Questions Techniques

### 1. URL de l'endpoint API

**❌ URL incorrecte testée** : `POST https://vault.doreviateam.com/api/v1/documents`

**✅ URL correcte** : `POST https://vault.doreviateam.com/api/v1/invoices`

**Explication** :
- L'endpoint `/api/v1/documents` n'existe pas dans l'API Dorevia Vault
- L'endpoint d'ingestion pour Odoo est `/api/v1/invoices` (Sprint 1)
- Cet endpoint accepte uniquement la méthode `POST`
- La méthode `GET` sur cet endpoint retourne `405 Method Not Allowed`

**Routes disponibles** :
- `POST /api/v1/invoices` → Ingestion documents Odoo (JSON + base64)
- `GET /api/v1/invoices` → `405 Method Not Allowed` (avec header `Allow: POST`)
- `GET /documents` → Liste paginée des documents (lecture uniquement)
- `GET /documents/:id` → Récupère un document par ID
- `GET /download/:id` → Télécharge un document par ID

**Note** : L'endpoint est déployé et actif en production si `DATABASE_URL` est configuré.

---

### 2. Statut et disponibilité de l'API

**✅ L'API est en production** et accessible à `https://vault.doreviateam.com`

**Prérequis** :
- ✅ Le serveur est accessible (connexion SSL OK)
- ✅ Le certificat SSL est valide
- ⚠️ **L'endpoint nécessite que `DATABASE_URL` soit configuré** (sinon retourne `503 Service Unavailable`)
- ⚠️ **L'authentification peut être requise** si `AUTH_ENABLED=true` (voir section 3)

**Vérification de disponibilité** :
```bash
# Vérifier l'état du service
curl https://vault.doreviateam.com/health

# Vérifier l'état de la base de données
curl https://vault.doreviateam.com/dbhealth

# Vérifier la version
curl https://vault.doreviateam.com/version
```

**Restrictions d'accès** :
- Si `AUTH_ENABLED=true`, l'endpoint `/api/v1/invoices` nécessite une authentification
- Si `AUTH_ENABLED=false`, l'endpoint est accessible sans authentification
- Pas de restriction IP par défaut (gérée par le reverse proxy/firewall)

---

### 3. Authentification et token

**Méthodes d'authentification supportées** :

#### Option 1 : JWT (JSON Web Token) — Recommandé

**Format** : `Authorization: Bearer <token>`

**Algorithme** : RS256 (RSA avec SHA-256)

**Claims requis dans le JWT** :
```json
{
  "sub": "user-123",           // User ID (requis)
  "role": "operator",          // Rôle utilisateur (requis) : admin, operator, auditor, viewer
  "email": "user@example.com", // Optionnel
  "iat": 1234567890,          // Issued at (timestamp)
  "exp": 1234567890           // Expiration (timestamp)
}
```

**Rôles disponibles** :
- `admin` : Toutes les permissions
- `operator` : Permissions `documents:write` (requis pour `/api/v1/invoices`)
- `auditor` : Permissions lecture uniquement
- `viewer` : Permissions lecture limitée

**Obtention du token** :
- Le token JWT doit être généré par un service d'authentification externe (OAuth2, Keycloak, etc.)
- La clé publique JWT doit être configurée dans Dorevia Vault via `AUTH_JWT_PUBLIC_KEY_PATH`
- **Contact support** : Pour obtenir un token de test ou configurer l'authentification

**Expiration** :
- Le token JWT peut avoir une expiration (claim `exp`)
- Si expiré, l'API retourne `401 Unauthorized`
- Le renouvellement doit être géré côté client (Odoo)

#### Option 2 : API Keys

**Format** : `Authorization: apikey <key>`

**Structure** :
- Clé API unique par instance/environnement
- Hash SHA-256 stocké côté serveur
- Expiration optionnelle
- Statut actif/inactif

**Obtention de la clé API** :
- **Contact support** : Pour obtenir une clé API pour votre instance Odoo
- La clé est spécifique à votre instance/environnement
- Une clé de test peut être fournie pour l'environnement de développement

**Expiration** :
- Les clés API peuvent avoir une expiration optionnelle
- Si expirée, l'API retourne `401 Unauthorized`
- Le renouvellement doit être demandé au support

**Configuration requise côté serveur** :
```bash
AUTH_ENABLED=true
AUTH_JWT_ENABLED=true                    # Pour JWT
AUTH_JWT_PUBLIC_KEY_PATH=/path/to/jwt-public.pem
AUTH_APIKEY_ENABLED=true                 # Pour API Keys
```

**Note** : Si `AUTH_ENABLED=false`, l'authentification est désactivée et l'endpoint est accessible sans token.

---

### 4. Format du payload

**❌ Format proposé incorrect** :
```json
{
  "file_name": "FAC2025-001.pdf",
  "sha256": "abc123def456...",
  "content_base64": "<contenu_base64_du_pdf>",
  "source": "odoo",
  "metadata": {...}
}
```

**✅ Format correct** :
```json
{
  "source": "sales",                    // Requis : sales|purchase|pos|stock|sale
  "model": "account.move",              // Requis : account.move, pos.order, etc.
  "odoo_id": 123,                       // Requis : ID dans Odoo
  "state": "posted",                    // Requis : posted, paid, done, etc.
  "pdp_required": false,                // Optionnel : Nécessite dispatch PDP ?
  "file": "base64_encoded_content",     // Requis : Contenu fichier encodé en base64 (SANS préfixe data:)
  "meta": {                             // Optionnel : Métadonnées facture
    "name": "FAC2025-001",
    "partner_id": 456,
    "date": "2025-01-15",
    "amount_total": 1000.00,
    "content_type": "application/pdf"   // Optionnel : Type MIME (détecté automatiquement si absent)
  }
}
```

**Champs obligatoires** :
- ✅ `source` : Type de source (`sales`, `purchase`, `pos`, `stock`, `sale`)
- ✅ `model` : Modèle Odoo (`account.move`, `pos.order`, etc.)
- ✅ `odoo_id` : ID du document dans Odoo (entier)
- ✅ `state` : État du document (`posted`, `paid`, `done`, etc.)
- ✅ `file` : Contenu du fichier encodé en base64 (SANS préfixe `data:application/pdf;base64,`)

**Champs obligatoires pour `account.move` (SPEC 1)** :
- ✅ `meta.move_type` : Type de mouvement (`out_invoice`, `in_invoice`, `out_refund`, `in_refund`)
- ✅ `meta.tenant` : Identifiant du tenant (non vide)

**Champs optionnels** :
- `pdp_required` : Booléen indiquant si le document nécessite un dispatch PDP
- `meta` : Objet JSON avec métadonnées supplémentaires
- `meta.number` : Numéro de facture
- `meta.invoice_date` : Date de facture (format ISO 8601)
- `meta.total_ht` : Montant HT (traçabilité uniquement)
- `meta.total_ttc` : Montant TTC (traçabilité uniquement)
- `meta.currency` : Code devise (ISO 4217)
- `meta.seller_vat` : Numéro TVA vendeur
- `meta.buyer_vat` : Numéro TVA acheteur
- `meta.correlation_id` : ID de corrélation

**Format du hash SHA256** :
- ❌ **Le hash SHA256 n'est PAS requis dans le payload**
- ✅ Le hash SHA256 est calculé automatiquement côté serveur à partir du contenu décodé
- ✅ Le hash SHA256 est retourné dans la réponse (`sha256_hex`)

**Format du contenu base64** :
- ✅ **JUSTE le contenu base64** (sans préfixe `data:application/pdf;base64,`)
- ✅ Utiliser `base64.StdEncoding.EncodeToString()` (standard RFC 4648)
- ❌ Ne pas inclure le préfixe MIME

**Exemple Python (Odoo)** :
```python
import base64

# Lire le fichier PDF
with open('invoice.pdf', 'rb') as f:
    file_content = f.read()

# Encoder en base64 (SANS préfixe)
file_base64 = base64.b64encode(file_content).decode('utf-8')

# Payload
payload = {
    'source': 'sales',
    'model': 'account.move',
    'odoo_id': 123,
    'state': 'posted',
    'pdp_required': False,
    'file': file_base64,  # SANS préfixe data:
    'meta': {
        'name': 'FAC2025-001',
        'partner_id': 456,
        'date': '2025-01-15',
        'amount_total': 1000.00
    }
}
```

---

### 5. Format de la réponse

**✅ Format de réponse en cas de succès** (HTTP 201 Created) :
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",  // UUID du document
  "sha256_hex": "abc123def456...",                // Hash SHA256 (64 caractères hex)
  "created_at": "2025-01-15T10:30:00Z",          // Date de création (ISO 8601)
  "evidence_jws": "eyJhbGciOiJSUzI1NiIs...",     // JWS de preuve (si JWS activé)
  "ledger_hash": "def456abc123...",              // Hash ledger (si ledger activé)
  "message": "Document vaulted successfully"      // Message optionnel (pour idempotence)
}
```

**Format de réponse en cas d'idempotence** (HTTP 200 OK) :
Si un document avec le même hash SHA256 existe déjà, l'API retourne :
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",  // UUID du document existant
  "sha256_hex": "abc123def456...",                // Hash SHA256
  "created_at": "2025-01-15T09:00:00Z",          // Date de création originale
  "evidence_jws": "eyJhbGciOiJSUzI1NiIs...",     // JWS de preuve
  "ledger_hash": "def456abc123...",              // Hash ledger
  "message": "Document already vaulted"          // Message d'idempotence
}
```

**Format de réponse en cas d'erreur** (HTTP 4xx/5xx) :
```json
{
  "error": "Invalid JSON payload",               // Message d'erreur
  "details": "missing required field: source"    // Détails optionnels
}
```

**Champs de réponse** :
- ✅ `id` : UUID du document (toujours présent)
- ✅ `sha256_hex` : Hash SHA256 du document (toujours présent)
- ✅ `created_at` : Date de création (toujours présent)
- ⚠️ `evidence_jws` : JWS de preuve (présent si `JWS_ENABLED=true`)
- ⚠️ `ledger_hash` : Hash ledger (présent si ledger activé)
- ⚠️ `message` : Message optionnel (pour idempotence ou informations)

**Note** : Le format proposé dans les questions (`status`, `vault_id`, `ledger_id`, `proof_url`) n'est pas utilisé. Le format actuel est plus simple et cohérent avec l'API REST.

---

### 6. Gestion des erreurs HTTP

**✅ Codes HTTP utilisés** :

| Code | Signification | Action recommandée |
|:-----|:--------------|:-------------------|
| `200` | Succès (idempotence) | Document déjà vaulté, utiliser l'ID retourné |
| `201` | Créé | Document vaulté avec succès |
| `400` | Requête invalide | Erreur permanente, corriger le payload |
| `401` | Non autorisé | Erreur permanente, vérifier le token/clé API |
| `403` | Accès interdit | Erreur permanente, vérifier les permissions RBAC |
| `404` | Non trouvé | Erreur permanente, vérifier l'URL de l'endpoint |
| `405` | Méthode non autorisée | Erreur permanente, utiliser POST (pas GET) |
| `429` | Trop de requêtes | Erreur temporaire, retry avec backoff exponentiel |
| `500` | Erreur serveur | Erreur temporaire, retry avec backoff exponentiel |
| `502` | Bad Gateway | Erreur temporaire, retry avec backoff exponentiel |
| `503` | Service indisponible | Erreur temporaire, vérifier `DATABASE_URL` configuré |
| `504` | Gateway Timeout | Erreur temporaire, retry avec backoff exponentiel |

**Exemples de réponses d'erreur** :

**400 Bad Request — Champ manquant** :
```json
{
  "error": "Missing required field: source"
}
```

**400 Bad Request — Validation account.move (SPEC 1)** :
```json
{
  "error": "validation failed: model must be 'account.move', got 'pos.order'"
}
```

```json
{
  "error": "validation failed: state must be 'posted', got 'draft'"
}
```

```json
{
  "error": "validation failed: meta.move_type must be one of [out_invoice, in_invoice, out_refund, in_refund], got 'invalid'"
}
```

```json
{
  "error": "validation failed: source 'purchase' does not match move_type 'out_invoice' (expected source: 'sales')"
}
```

```json
{
  "error": "validation failed: meta.tenant must be a non-empty string"
}
```

**401 Unauthorized** :
```json
{
  "error": "authorization header missing"
}
```

**403 Forbidden** :
```json
{
  "error": "insufficient permissions: documents:write required"
}
```

**503 Service Unavailable** :
```json
{
  "error": "Database not configured"
}
```

**Stratégie de retry recommandée** :
- **Erreurs permanentes** (4xx sauf 429) : Ne pas retry, corriger la requête
- **Erreurs temporaires** (429, 5xx) : Retry avec backoff exponentiel (1s, 2s, 4s, 8s, 16s, max 5 tentatives)

---

### 7. Environnement de test

**⚠️ Environnement de test/staging** :
- **Contact support** : Pour obtenir l'URL de l'environnement de test (si disponible)
- L'environnement de test peut avoir une URL différente (ex: `https://vault-test.doreviateam.com`)
- Les données de test sont isolées de la production
- Un token/clé API de test peut être fourni pour l'environnement de test

**Recommandation** :
- Utiliser l'environnement de test pour les développements et tests
- Utiliser la production uniquement après validation complète

---

### 8. Documentation API

**✅ Documentation disponible** :

1. **README principal** : `/opt/dorevia-vault/README.md`
   - Vue d'ensemble de l'API
   - Liste des endpoints
   - Exemples d'utilisation

2. **Documentation Sprint 5** : `/opt/dorevia-vault/docs/SPRINT5_DOCUMENTATION_COMPLETE.md`
   - Spécifications complètes
   - Authentification et RBAC
   - Validation Factur-X

3. **Spécification Authentification** : `/opt/dorevia-vault/docs/auth_rbac_spec.md`
   - Détails JWT et API Keys
   - Rôles et permissions
   - Configuration

4. **Variables d'environnement** : `/opt/dorevia-vault/docs/VARIABLES_ENVIRONNEMENT.md`
   - Configuration complète
   - Variables d'authentification

**⚠️ Documentation OpenAPI/Swagger** :
- Non disponible actuellement
- **Planifié** : Génération automatique depuis le code Go (Sprint 6+)

**⚠️ Collection Postman** :
- Non disponible actuellement
- **Planifié** : Création d'une collection Postman (Sprint 6+)

**Exemples de requêtes** :
Voir section "Tests effectués" ci-dessous.

---

### 9. Limitations et quotas

**Taille maximale d'un document** :
- ⚠️ **Non documenté actuellement**
- **Recommandation** : Limiter à 10 Mo par document (limite HTTP standard)
- **Contact support** : Pour connaître la limite exacte

**Nombre de requêtes** :
- ⚠️ **Rate limiting activé** (middleware RateLimit)
- **Limite par défaut** : 100 requêtes/minute par IP
- **Contact support** : Pour ajuster les limites selon vos besoins

**Types de fichiers acceptés** :
- ✅ **PDF** : Supporté (recommandé pour factures)
- ✅ **Autres formats** : Supportés (mais validation Factur-X uniquement pour PDF)
- ⚠️ **Validation Factur-X** : Uniquement pour PDF avec XML embarqué (si `FACTURX_VALIDATION_ENABLED=true`)

**Limitations sur le contenu base64** :
- ✅ **Format standard** : RFC 4648 (base64 standard)
- ✅ **Taille** : Limite de taille du document (voir ci-dessus)
- ❌ **Pas de limitation spécifique** sur la taille du string base64

---

### 10. Support et contact

**📧 Email de support technique** :
- **Contact** : support@doreviateam.com (à confirmer)
- **Réponse sous** : 24-48h (jours ouvrés)

**💬 Canal de communication** :
- **GitHub Issues** : https://github.com/doreviateam/dorevia-vault/issues
- **Slack/Teams** : À confirmer avec l'équipe

**📞 Contact d'urgence** :
- **Contact** : À confirmer avec l'équipe Dorevia Vault

**🐛 Système de tickets/bugs** :
- **GitHub Issues** : Pour rapporter les bugs et demander des fonctionnalités
- **Labels** : `bug`, `feature-request`, `integration`, `api`

---

## 🔧 Tests Effectués — Corrections

### Test 1 : Connexion basique — ❌ Incorrect

**Commande incorrecte** :
```bash
curl -X POST https://vault.doreviateam.com/api/v1/documents
```

**✅ Commande correcte** :
```bash
curl -X POST https://vault.doreviateam.com/api/v1/invoices
```

**Résultat attendu** :
- Si `AUTH_ENABLED=false` : `400 Bad Request` (payload manquant)
- Si `AUTH_ENABLED=true` : `401 Unauthorized` (token manquant)

### Test 2 : Avec headers et payload — ❌ Format incorrect

**Commande incorrecte** :
```bash
curl -X POST https://vault.doreviateam.com/api/v1/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -d '{"file_name":"test.pdf","sha256":"abc123","content_base64":"dGVzdA==","source":"odoo","metadata":{}}'
```

**✅ Commande correcte** :
```bash
curl -X POST https://vault.doreviateam.com/api/v1/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_jwt>" \
  -d '{
    "source": "sales",
    "model": "account.move",
    "odoo_id": 123,
    "state": "posted",
    "file": "dGVzdA==",
    "meta": {
      "name": "FAC2025-001"
    }
  }'
```

**Corrections** :
- ✅ URL : `/api/v1/invoices` (pas `/api/v1/documents`)
- ✅ Champs : `source`, `model`, `odoo_id`, `state`, `file` (pas `file_name`, `sha256`, `content_base64`)
- ✅ Métadonnées : `meta` (pas `metadata`)
- ✅ Hash SHA256 : Non requis dans le payload (calculé automatiquement)

### Test 3 : Vérification SSL — ✅ Correct

**Commande** :
```bash
curl -v https://vault.doreviateam.com/api/v1/invoices
```

**Résultat** : ✅ Connexion SSL OK, certificat valide

---

## 📝 Exemple d'Intégration Complète (Python/Odoo)

```python
import base64
import requests
import json
from odoo import models, fields, api

class DoreviaVaultConnector(models.Model):
    _name = 'dorevia.vault.connector'
    
    vault_url = fields.Char(string='Vault URL', default='https://vault.doreviateam.com')
    vault_token = fields.Char(string='Vault Token', required=True)
    
    def vault_invoice(self, invoice):
        """
        Vaultériser une facture Odoo vers Dorevia Vault
        """
        # Lire le fichier PDF de la facture
        pdf_content = invoice.get_pdf_content()  # Méthode à implémenter
        
        # Encoder en base64 (SANS préfixe)
        file_base64 = base64.b64encode(pdf_content).decode('utf-8')
        
        # Construire le payload
        payload = {
            'source': 'sales',
            'model': 'account.move',
            'odoo_id': invoice.id,
            'state': invoice.state,
            'pdp_required': invoice.partner_id.is_company,  # B2B nécessite PDP
            'file': file_base64,
            'meta': {
                'name': invoice.name,
                'partner_id': invoice.partner_id.id,
                'date': invoice.invoice_date.isoformat() if invoice.invoice_date else None,
                'amount_total': float(invoice.amount_total),
                'content_type': 'application/pdf'
            }
        }
        
        # Headers
        headers = {
            'Authorization': f'Bearer {self.vault_token}',
            'Content-Type': 'application/json'
        }
        
        # Envoyer la requête
        url = f'{self.vault_url}/api/v1/invoices'
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            # Parser la réponse
            result = response.json()
            
            # Stocker les informations dans Odoo
            invoice.write({
                'vault_id': result['id'],
                'vault_sha256': result['sha256_hex'],
                'vault_jws': result.get('evidence_jws'),
                'vault_ledger_hash': result.get('ledger_hash'),
                'vaulted_at': fields.Datetime.now()
            })
            
            return result
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                raise Exception('Token invalide ou expiré')
            elif e.response.status_code == 400:
                error = e.response.json()
                raise Exception(f'Erreur de validation: {error.get("error")}')
            else:
                raise Exception(f'Erreur HTTP {e.response.status_code}: {e.response.text}')
        except requests.exceptions.RequestException as e:
            raise Exception(f'Erreur de connexion: {str(e)}')
```

---

## 🔍 Validations account.move (SPEC 1)

### Règle de Vaulting

Un objet `account.move` est vaulté **si et seulement si** :
- ✅ `model == "account.move"`
- ✅ `state == "posted"`
- ✅ `meta.move_type` ∈ `{"out_invoice", "in_invoice", "out_refund", "in_refund"}`
- ✅ Mapping `source` ↔ `move_type` cohérent
- ✅ `meta.tenant` présent et non vide

### Ordre de Validation (Fail-Fast)

Les validations sont appliquées dans l'ordre suivant (retour 400 immédiat à la première erreur) :

1. **Validation du modèle** : `model == "account.move"`
   - ❌ Rejeté si `model != "account.move"`
   - Message : `"validation failed: model must be 'account.move', got '<model>'"`

2. **Validation de l'état** : `state == "posted"`
   - ❌ Rejeté si `state != "posted"` (ex: `draft`, `cancel`, `paid`, etc.)
   - Message : `"validation failed: state must be 'posted', got '<state>'"`

3. **Validation du move_type** : `meta.move_type` dans liste autorisée
   - ✅ Types acceptés : `out_invoice`, `in_invoice`, `out_refund`, `in_refund`
   - ❌ Rejeté si `move_type` absent, vide, ou invalide
   - Message : `"validation failed: meta.move_type must be one of [out_invoice, in_invoice, out_refund, in_refund], got '<move_type>'"`

4. **Validation du mapping source ↔ move_type** :
   - ✅ `move_type ∈ {"out_invoice", "out_refund"}` → `source = "sales"`
   - ✅ `move_type ∈ {"in_invoice", "in_refund"}` → `source = "purchase"`
   - ❌ Rejeté si mapping incohérent
   - Message : `"validation failed: source '<source>' does not match move_type '<move_type>' (expected source: '<expected>')"`

5. **Validation du tenant** : `meta.tenant` non vide
   - ❌ Rejeté si `meta.tenant` absent, vide, ou non-string
   - Message : `"validation failed: meta.tenant must be a non-empty string"`

### Exemples de Payloads Valides

**Facture de vente (out_invoice)** :
```json
{
  "source": "sales",
  "model": "account.move",
  "odoo_id": 12345,
  "state": "posted",
  "file": "base64_encoded_pdf",
  "meta": {
    "move_type": "out_invoice",
    "tenant": "laplatine",
    "number": "FAC2026-001",
    "invoice_date": "2026-01-15",
    "total_ht": 1000.00,
    "total_ttc": 1200.00,
    "currency": "EUR",
    "seller_vat": "FR12345678901",
    "buyer_vat": "FR98765432109"
  }
}
```

**Facture d'achat (in_invoice)** :
```json
{
  "source": "purchase",
  "model": "account.move",
  "odoo_id": 12346,
  "state": "posted",
  "file": "base64_encoded_pdf",
  "meta": {
    "move_type": "in_invoice",
    "tenant": "laplatine",
    "number": "FAC2026-002",
    "invoice_date": "2026-01-15"
  }
}
```

**Avoir de vente (out_refund)** :
```json
{
  "source": "sales",
  "model": "account.move",
  "odoo_id": 12347,
  "state": "posted",
  "file": "base64_encoded_pdf",
  "meta": {
    "move_type": "out_refund",
    "tenant": "laplatine"
  }
}
```

**Avoir d'achat (in_refund)** :
```json
{
  "source": "purchase",
  "model": "account.move",
  "odoo_id": 12348,
  "state": "posted",
  "file": "base64_encoded_pdf",
  "meta": {
    "move_type": "in_refund",
    "tenant": "laplatine"
  }
}
```

### Exemples de Payloads Invalides

**❌ État invalide (draft)** :
```json
{
  "source": "sales",
  "model": "account.move",
  "odoo_id": 12345,
  "state": "draft",  // ❌ Doit être "posted"
  "file": "base64_encoded_pdf",
  "meta": {
    "move_type": "out_invoice",
    "tenant": "laplatine"
  }
}
```
**Réponse** : `400 Bad Request` - `"validation failed: state must be 'posted', got 'draft'"`

**❌ move_type invalide** :
```json
{
  "source": "sales",
  "model": "account.move",
  "odoo_id": 12345,
  "state": "posted",
  "file": "base64_encoded_pdf",
  "meta": {
    "move_type": "invalid",  // ❌ Doit être out_invoice, in_invoice, out_refund, ou in_refund
    "tenant": "laplatine"
  }
}
```
**Réponse** : `400 Bad Request` - `"validation failed: meta.move_type must be one of [out_invoice, in_invoice, out_refund, in_refund], got 'invalid'"`

**❌ Mapping source/move_type incohérent** :
```json
{
  "source": "purchase",  // ❌ Doit être "sales" pour out_invoice
  "model": "account.move",
  "odoo_id": 12345,
  "state": "posted",
  "file": "base64_encoded_pdf",
  "meta": {
    "move_type": "out_invoice",
    "tenant": "laplatine"
  }
}
```
**Réponse** : `400 Bad Request` - `"validation failed: source 'purchase' does not match move_type 'out_invoice' (expected source: 'sales')"`

**❌ Tenant manquant** :
```json
{
  "source": "sales",
  "model": "account.move",
  "odoo_id": 12345,
  "state": "posted",
  "file": "base64_encoded_pdf",
  "meta": {
    "move_type": "out_invoice"
    // ❌ tenant manquant
  }
}
```
**Réponse** : `400 Bad Request` - `"validation failed: meta.tenant must be a non-empty string"`

### Idempotence (tenant, sha256)

Si un document avec le même `(tenant, sha256)` existe déjà :
- ✅ Retour **200 OK** (au lieu de 201 Created)
- ✅ Message : `"Document already exists"`
- ✅ Retourne les informations du document existant

**Exemple de réponse idempotente** :
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "sha256_hex": "abc123def456...",
  "created_at": "2026-01-15T09:00:00Z",
  "evidence_jws": "eyJhbGciOiJSUzI1NiIs...",
  "ledger_hash": "def456abc123...",
  "message": "Document already exists"
}
```

### Conformité Factur-X (Étiquetage)

Le Vault **constate et étiquette** la conformité Factur-X (ne génère jamais) :

- ✅ **`compliant`** : Factur-X présent dans le PDF
- ⚠️ **`non_compliant_2026`** : B2B probable (buyer_vat + seller_vat) mais Factur-X absent
- ℹ️ **`out_of_scope`** : B2C ou non qualifié

Les champs `compliance_status` et `facturx_present` sont stockés en base de données.

---

## ✅ Checklist d'Intégration

- [ ] **URL correcte** : Utiliser `/api/v1/invoices` (pas `/api/v1/documents`)
- [ ] **Format payload** : Utiliser `source`, `model`, `odoo_id`, `state`, `file` (pas `file_name`, `sha256`, `content_base64`)
- [ ] **Base64** : Encoder SANS préfixe `data:application/pdf;base64,`
- [ ] **Authentification** : Configurer JWT ou API Key selon `AUTH_ENABLED`
- [ ] **Headers** : `Authorization: Bearer <token>` ou `Authorization: apikey <key>`
- [ ] **Gestion erreurs** : Implémenter retry pour erreurs temporaires (429, 5xx)
- [ ] **Idempotence** : Gérer le cas `200 OK` (document déjà vaulté)
- [ ] **Stockage** : Sauvegarder `id`, `sha256_hex`, `evidence_jws`, `ledger_hash` dans Odoo

---

## 📞 Prochaines Étapes

1. **Corriger l'URL** : Utiliser `/api/v1/invoices` au lieu de `/api/v1/documents`
2. **Corriger le format du payload** : Utiliser le format correct (voir section 4)
3. **Obtenir un token** : Contacter le support pour obtenir un token JWT ou une clé API
4. **Tester l'intégration** : Utiliser l'environnement de test si disponible
5. **Valider la réponse** : Vérifier que les champs `id`, `sha256_hex`, `evidence_jws`, `ledger_hash` sont bien retournés
6. **Mettre en production** : Après validation complète

---

**Document créé le** : 2025-01-15  
**Dernière mise à jour** : 2025-01-15  
**Version API** : v1.3.0


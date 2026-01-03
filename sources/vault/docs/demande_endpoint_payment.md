# 📧 Demande de Création — Endpoint Vault Payments

**Date** : 2025-11-18  
**Projet** : Dorevia Vault Payment Connector v1.1  
**Priorité** : 🔴 URGENTE  
**Type** : Demande de développement API

---

## 📋 Contexte

Nous développons le module Odoo `dorevia_vault_payment_connector` qui permet la **vaultérisation automatique des paiements** (POS et factures) vers le service Dorevia Vault.

**Objectif** : Compléter la chaîne d'intégrité **Vente → Facture → Paiements → Encaissement → Z → Ledger → Vault** en vaultérisant tous les paiements selon la spécification v1.1.

**Problème identifié** : L'endpoint `/api/v1/payments` n'existe pas encore dans l'API Dorevia Vault.

---

## 🎯 Besoin Fonctionnel

### Contexte Métier

Le module doit vaultériser **tous les paiements et remboursements** provenant de :
- **Point of Sale (POS)** : `pos.payment` (paiements en caisse)
- **Paiements clients** : `account.payment` avec `payment_type = 'inbound'` + `partner_type = 'customer'` (encaissements)
- **Remboursements clients** : `account.payment` avec `payment_type = 'outbound'` + `partner_type = 'customer'` (remboursements)
- **Paiements fournisseurs** : `account.payment` avec `payment_type = 'outbound'` + `partner_type = 'supplier'` (décaissements)
- **Remboursements fournisseurs** : `account.payment` avec `payment_type = 'inbound'` + `partner_type = 'supplier'` (remboursements reçus)

**Note** : Les paiements peuvent être alloués à des factures (`out_invoice`, `in_invoice`) ou à des avoirs (`out_refund`, `in_refund`).

### Cas d'Usage Spécifiques (Antilles)

Le module doit gérer les réalités métier antillaises :
- ✅ Paiements multi-modes (ex: 5€ cash + 3€ CB)
- ✅ Paiements fractionnés (ex: EMI paie une facture en 5 fois)
- ✅ Paiements multi-jours (J0 → J3 → J7)
- ✅ Paiements en retard (date paiement > date échéance)
- ✅ Paiements couvrant plusieurs factures (virement 600€ sur 3 factures)
- ✅ Paiements en vrac (cas EMI - allocation multiple)

**Chaque paiement génère 1 Payment Evidence cryptographique.**

---

## 🔍 Spécification Technique de l'Endpoint

### Endpoint Demandé

```
POST /api/v1/payments
```

**URL complète** : `https://vault.doreviateam.com/api/v1/payments`

### Méthode HTTP

- **Méthode** : `POST`
- **Content-Type** : `application/json`
- **Authentification** : JWT Bearer Token (comme les autres endpoints)

### Headers Requis

```
Authorization: Bearer {token_jwt}  # Requis si AUTH_ENABLED=true
Content-Type: application/json
X-Tenant: {tenant}  # Requis, doit correspondre au champ tenant du payload
```

---

## 📦 Format du Payload (Payment Evidence)

**⚠️ IMPORTANT** : Cette section décrit le format souhaité côté Odoo. Pour la spécification technique complète adaptée à la réalité du vault, voir le document **`SPECIFICATION_ENDPOINT_PAYMENTS_VAULT.md`**.

### Structure JSON Complète (Format Odoo → Vault)

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

**Note** : Le format suit le pattern des endpoints existants (`/api/v1/pos-tickets`) avec `tenant`, `source_model`, `source_id` et un champ `payment` contenant les métadonnées additionnelles.

### Description des Champs

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `tenant` | string | ✅ | Identifiant du tenant (doit correspondre au header `X-Tenant`) |
| `source_system` | string | ❌ | Système source (défaut: `"odoo"`) |
| `source_model` | string | ✅ | Modèle source Odoo (`account.payment` ou `pos.payment`) |
| `source_id` | string | ✅ | Identifiant unique du paiement (ex: `PAY/2025/00123`) |
| `payment_date` | string (RFC3339) | ✅ | Date et heure du paiement (UTC) |
| `amount` | number | ✅ | Montant du paiement (doit être > 0) |
| `currency` | string | ✅ | Code devise ISO 4217 (ex: `EUR`, `USD`) |
| `method` | string | ✅ | Méthode de paiement : `cash`, `card`, `mixed`, `check`, `transfer`, `other` |
| `source` | string | ✅ | Source : `pos` ou `account` |
| `payment_direction` | string | ✅ | Direction : `inbound` (encaissement) ou `outbound` (décaissement) |
| `is_refund` | boolean | ✅ | `true` si remboursement, `false` si paiement normal |
| `company_id` | integer | ✅ | ID de la société Odoo |
| `payment` | object | ✅ | JSON brut du paiement (métadonnées additionnelles) |

**Champs dans `payment` (optionnels)** :
- `multi_payment_group` : Groupe paiements fractionnés (nom facture)
- `multi_payment_index` : Index dans le groupe (1, 2, 3...)
- `multi_payment_total` : Nombre total de paiements dans le groupe
- `allocated_invoices` : Array d'allocations factures
- `pos_order_ref` : Référence commande POS (si `source = "pos"`)
- `session_id` : ID session POS (si `source = "pos"`)

**Note** : Le hash SHA256 est calculé automatiquement par le vault sur le payload JSON canonicalisé. Il n'est pas nécessaire de l'envoyer dans le payload.

### Exemples de Payloads

#### Exemple 1 : Paiement POS Simple

```json
{
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
}
```

#### Exemple 2 : Paiement Facture Client Multi-Factures

```json
{
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
}
```

#### Exemple 2bis : Paiement Facture Fournisseur

```json
{
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
}
```

#### Exemple 2ter : Remboursement Client

```json
{
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
}
```

#### Exemple 2quater : Remboursement Fournisseur (reçu)

```json
{
  "tenant": "laplatine",
  "source_system": "odoo",
  "source_model": "account.payment",
  "source_id": "PAY/2025/00459",
  "payment_date": "2025-11-18T13:00:00Z",
  "amount": 200.00,
  "currency": "EUR",
  "method": "transfer",
  "source": "account",
  "payment_direction": "inbound",
  "is_refund": true,
  "company_id": 1,
  "payment": {
    "allocated_invoices": [
      {"invoice": "RBI/2025/00012", "portion": 200.00}
    ]
  }
}
```

#### Exemple 3 : Paiement Fractionné Client (1er versement)

```json
{
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
}
```

---

## 📤 Format de la Réponse Attendue

**⚠️ IMPORTANT** : Le format de réponse suit le pattern standardisé des autres endpoints (`/api/v1/pos-tickets`).

### Succès (200 OK ou 201 Created)

**201 Created** : Paiement créé avec succès  
**200 OK** : Paiement déjà existant (idempotence basée sur `sha256_hex`)

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

### Description des Champs de Réponse

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Identifiant unique du document dans le vault |
| `tenant` | string | Identifiant du tenant |
| `sha256_hex` | string | Hash SHA256 du payload JSON (64 caractères hex) |
| `ledger_hash` | string (nullable) | Hash dans le ledger (si intégration Ledger activée) |
| `evidence_jws` | string (nullable) | Preuve JWS cryptographique (si `JWS_ENABLED=true`) |
| `created_at` | string (RFC3339) | Date et heure de création |

### Erreurs (4xx / 5xx)

Le format d'erreur suit le pattern standardisé des autres endpoints :

```json
{
  "error": "Message d'erreur détaillé",
  "details": "Détails supplémentaires (optionnel)"
}
```

#### Codes d'Erreur Attendus

| Code HTTP | Type | Description |
|-----------|------|-------------|
| `200` / `201` | Succès | Paiement vaultérisé avec succès |
| `400` | Permanent | Payload invalide (champs manquants, format incorrect) |
| `401` | Permanent | Token d'authentification invalide |
| `403` | Permanent | Accès interdit (permissions insuffisantes) |
| `404` | Permanent | Endpoint non trouvé (si endpoint non déployé) |
| `429` | Retryable | Trop de requêtes (rate limit) |
| `500` | Retryable | Erreur serveur interne |
| `502` | Retryable | Bad Gateway |
| `503` | Retryable | Service indisponible |
| `504` | Retryable | Gateway Timeout |

---

## 🔒 Sécurité et Validation

### Validation Requise

1. **Champs obligatoires** : Vérifier présence de tous les champs requis
2. **Format dates** : Valider format RFC3339 pour `payment_date`
3. **Montants** : Vérifier que `amount > 0`
4. **Devise** : Valider code ISO 4217 (optionnel, peut être étendu)
5. **Méthode de paiement** : Valider valeurs autorisées (`cash`, `card`, `mixed`, `check`, `transfer`, `other`)
6. **Source** : Valider valeurs autorisées (`pos`, `account`)
7. **Direction** : Valider valeurs autorisées (`inbound`, `outbound`)
8. **Tenant** : Vérifier cohérence entre header `X-Tenant` et champ `tenant`
9. **Taille** : Vérifier que le payload ne dépasse pas `PaymentMaxSizeBytes` (défaut: 64 KB)
10. **Allocations** : Si `allocated_invoices` présent, vérifier que `sum(portions) <= amount` (optionnel)
11. **Multi-paiements** : Si `multi_payment_group` présent, vérifier que `multi_payment_index <= multi_payment_total` (optionnel)

**Note** : Le hash SHA256 est calculé automatiquement par le vault sur le payload JSON canonicalisé. Il n'est pas nécessaire de l'envoyer dans le payload.

### Sécurité

- ✅ Authentification JWT obligatoire
- ✅ Validation SSL/TLS stricte
- ✅ Header `X-Tenant` pour isolation multi-tenant
- ✅ Hash SHA256 pour intégrité
- ✅ JWS pour preuve cryptographique

---

## 🔗 Intégration avec les Autres Endpoints

### Endpoints Existants

L'API Dorevia Vault dispose déjà de :
- ✅ `POST /api/v1/invoices` - Vaultérisation factures
- ✅ `POST /api/v1/pos-tickets` - Vaultérisation tickets POS
- ✅ `POST /api/v1/pos/zreports` - Vaultérisation Z-Reports

### Cohérence avec l'Architecture

Le nouvel endpoint `/api/v1/payments` complète la chaîne :

```
Factures → /api/v1/invoices
Tickets POS → /api/v1/pos-tickets
Paiements → /api/v1/payments  ← NOUVEAU
Z-Reports → /api/v1/pos/zreports
```

**Note** : Les paiements sont liés aux factures et tickets, mais génèrent des **evidences indépendants** pour traçabilité complète.

---

## 📊 Impact et Priorité

### Impact Fonctionnel

**Sans cet endpoint** :
- ❌ Les paiements ne peuvent pas être vaultérisés
- ❌ La chaîne d'intégrité est incomplète
- ❌ Conformité PDP/PPF 2026 non assurée pour les paiements
- ❌ Impossible de tracer les encaissements ET décaissements dans le ledger

**Avec cet endpoint** :
- ✅ Tous les paiements sont vaultérisés automatiquement (clients ET fournisseurs)
- ✅ Chaîne d'intégrité complète : 
  - Vente → Facture → Paiement Client → Z → Ledger
  - Achat → Facture Fournisseur → Paiement Fournisseur → Ledger
- ✅ Conformité réglementaire assurée
- ✅ Auditabilité complète des encaissements ET décaissements

### Priorité

🔴 **URGENTE** — Bloque la mise en production du module Payment Connector

---

## ⏰ Délais

### Planning Souhaité

- **Date de demande** : 2025-11-18
- **Réponse souhaitée** : Avant le 2025-11-25
- **Développement estimé** : 1-2 semaines
- **Tests et validation** : 1 semaine
- **Déploiement production** : Avant le 2025-12-15

### Justification

Le module `dorevia_vault_payment_connector` est **prêt côté Odoo** (spécification v1.1 validée, code d'implémentation préparé). Il ne manque que l'endpoint API pour être fonctionnel.

---

## 🧪 Tests et Validation

### Tests à Effectuer

Une fois l'endpoint déployé, nous effectuerons :

1. **Test paiement POS simple**
2. **Test paiement facture client simple**
3. **Test paiement facture fournisseur simple**
4. **Test remboursement client**
5. **Test remboursement fournisseur**
6. **Test paiement d'avoir client**
7. **Test paiement d'avoir fournisseur**
8. **Test paiement multi-factures (clients)**
9. **Test paiement multi-factures (fournisseurs)**
10. **Test remboursement multi-avoirs**
11. **Test paiement fractionné (groupe)**
12. **Test paiement multi-modes POS**
13. **Test validation hash SHA256**
14. **Test chaînage (previous_hash)**
15. **Test gestion erreurs (400, 401, 500, etc.)**

### Exemple de Test Manuel

```bash
curl -X POST https://vault.doreviateam.com/api/v1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant: laplatine" \
  -d '{
    "tenant": "laplatine",
    "source_system": "odoo",
    "source_model": "pos.payment",
    "source_id": "PAY/TEST/001",
    "payment_date": "2025-11-18T14:32:10Z",
    "amount": 100.00,
    "currency": "EUR",
    "method": "cash",
    "source": "pos",
    "payment_direction": "inbound",
    "is_refund": false,
    "company_id": 1,
    "payment": {
      "pos_order_ref": "TEST/001",
      "session_id": "POS/SESSION/TEST"
    }
  }'
```

**Résultat attendu** :
- ✅ `200 OK` ou `201 Created` → Endpoint fonctionnel
- ✅ Réponse JSON avec `id`, `sha256_hex`, `evidence_jws`, `ledger_hash`
- ❌ `404 Not Found` → Endpoint non déployé
- ❌ `400 Bad Request` → Format payload à ajuster

---

## 📎 Documents de Référence

### Spécifications

- **Spécification technique adaptée au vault** : `SPECIFICATION_ENDPOINT_PAYMENTS_VAULT.md` ⭐ **NOUVEAU**
- **Spécification Payment Connector v1.1** : `dorevia_vault_payment_connector_spec_v1.1_full.md`
- **Document d'implémentation technique** : `IMPLEMENTATION_TECHNIQUE_v1.1.md`

### Code Odoo

- **Service Vault Payment Client** : `services/vault_payment_client.py`
- **Payment Payload Builder** : `services/payment_payload_builder.py`
- **Payment Hash Service** : `services/payment_hash_service.py`

### Endpoints Existants (Référence)

- **Factures** : `POST /api/v1/invoices` (fonctionnel)
- **Tickets POS** : `POST /api/v1/pos-tickets` (fonctionnel)
- **Z-Reports** : `POST /api/v1/pos/zreports` (fonctionnel)

---

## ✅ Checklist de Suivi

### Côté Équipe Vault

- [ ] Demande reçue et analysée
- [ ] Spécification validée
- [ ] Endpoint `/api/v1/payments` développé
- [ ] Tests unitaires effectués
- [ ] Documentation API mise à jour
- [ ] Endpoint déployé en staging
- [ ] Tests d'intégration effectués
- [ ] Endpoint déployé en production
- [ ] Health check disponible : `/api/v1/health/payments`

### Côté Équipe Odoo

- [x] Spécification v1.1 validée
- [x] Code d'implémentation préparé
- [x] Document de demande créé
- [ ] Demande envoyée à l'équipe Vault
- [ ] Réponse reçue
- [ ] Endpoint testé
- [ ] Code finalisé et déployé
- [ ] Tests E2E effectués
- [ ] Module en production

---

## 📞 Contacts

### Équipe Odoo (Demandeur)

- **Projet** : Dorevia Vault Payment Connector
- **Module** : `dorevia_vault_payment_connector`
- **Version** : 1.1.0
- **Contact** : [À compléter]
- **Email** : [À compléter]
- **Slack/Teams** : [À compléter]

### Équipe Dorevia Vault (Backend)

- **Contact** : [À compléter]
- **Email** : support@doreviateam.com
- **Slack/Teams** : [À compléter]

---

## 📝 Notes Additionnelles

### Questions Techniques

1. **Chaînage des paiements** : Le chaînage cryptographique entre paiements n'est **pas implémenté** dans cette version. Chaque paiement est indépendant. Si nécessaire dans le futur, il faudra ajouter un champ `hash_prev` dans le payload.

2. **Rate limiting** : Les limites de débit suivent la configuration générale de l'API (à confirmer avec l'équipe Vault). Le code HTTP `429 Too Many Requests` est retourné en cas de dépassement.

3. **Idempotence** : ✅ Oui, l'endpoint est idempotent. L'idempotence est basée sur le hash SHA256 du payload JSON (canonicalisé). Si un paiement avec le même `sha256_hex` existe déjà, l'API retourne `200 OK` avec les données existantes au lieu de créer un doublon.

4. **Health check** : Y aura-t-il un endpoint `/api/v1/health/payments` pour vérifier la disponibilité ?

5. **Versioning** : L'endpoint suivra-t-il la version de l'API (`/api/v1/payments`) ou une version spécifique ?

### Compatibilité

- **Version API Vault** : v1.3.0+ (compatible avec les autres endpoints)
- **Odoo** : 18 CE
- **Format** : JSON (comme les autres endpoints)

---

## 🙏 Remerciements

Merci pour votre attention et votre retour rapide. Cet endpoint est essentiel pour compléter la chaîne de vaultérisation Dorevia Vault et assurer la conformité réglementaire complète.

---

**Dernière mise à jour** : 2025-01-18  
**Statut** : ⏳ En attente de réponse  
**Spécification technique** : Voir `SPECIFICATION_ENDPOINT_PAYMENTS_VAULT.md` pour la spécification complète adaptée à la réalité du vault

---

## 📧 Template Email

**À** : support@doreviateam.com  
**Sujet** : [URGENT] Demande de Création Endpoint `/api/v1/payments` - Dorevia Vault Payment Connector v1.1

**Corps** :

```
Bonjour,

Nous développons le module Odoo dorevia_vault_payment_connector v1.1 qui permet 
la vaultérisation automatique des paiements (POS et factures) vers Dorevia Vault.

Le module est prêt côté Odoo, mais nous avons besoin que l'endpoint 
POST /api/v1/payments soit créé dans l'API Dorevia Vault.

Vous trouverez tous les détails techniques dans le document joint :
- DEMANDE_ENDPOINT_PAYMENTS_VAULT.md

Priorité : URGENTE (bloque la mise en production)

Merci pour votre retour rapide.

Cordialement,
[Votre nom]
```

---

**Fin du document de demande**


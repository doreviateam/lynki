# 📘 Compatibilité DVIG — Guide de Référence

**Version** : 1.0  
**Date** : 2025-11-26  
**Sprint** : Sprint 8.1 — Compatibilité DVIG

---

## 🎯 Vue d'Ensemble

**DVIG (Dorevia Vault Ingestion Gateway)** enrichit automatiquement les payloads avec des métadonnées de traçabilité. L'API Vault **tolère et ignore** ces champs sans impact sur le traitement métier.

---

## 📋 Champs DVIG Tolérés

### Dans `meta` (endpoints avec meta)

| Champ | Type | Obligatoire | Description | Logging |
|-------|------|-------------|-------------|---------|
| `tenant` | string | ✅ | Tenant (depuis header X-Tenant) | ✅ Loggé |
| `correlation_id` | string (UUID v4) | ✅ | ID de corrélation pour traçabilité | ✅ Loggé |
| `timestamp` | string (ISO 8601) | ✅ | Timestamp UTC de l'ingestion | ❌ Ignoré |
| `dvig_version` | string | ✅ | Version DVIG (ex: "1.1.0") | ❌ Ignoré |
| `dvig_signature` | string (hex) | ⚠️ | Signature SHA-256 DVIG | ❌ Ignoré |
| `source_ip` | string | ⚠️ | IP source de la requête | ❌ Ignoré |
| `user_agent` | string | ⚠️ | User-Agent de la requête | ❌ Ignoré |

### Dans `payment` (endpoint `/api/v1/payments`)

Les mêmes champs peuvent être présents dans `payment` (map[string]interface{}).

### Dans `ticket` (endpoint `/api/v1/pos-tickets`)

Les mêmes champs peuvent être présents dans `ticket` (map[string]interface{}).

---

## 🔍 Comportement de l'API

### Extraction et Logging

L'API Vault :
- ✅ **Extrait** `correlation_id` et `tenant` depuis `meta` (ou `payment`/`ticket`)
- ✅ **Logge** ces champs dans les logs d'ingestion pour traçabilité
- ✅ **Ignore** tous les autres champs DVIG sans erreur

### Format de Log

```json
{
  "level": "info",
  "time": "2025-11-26T10:30:00Z",
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "sha256": "abc123...",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant": "doreviateam",
  "message": "Document vaulted successfully"
}
```

---

## 📡 Endpoints Compatibles

| Endpoint | Support DVIG | Champs Loggés |
|----------|--------------|---------------|
| `POST /api/v1/invoices` | ✅ Oui | `correlation_id`, `tenant` |
| `POST /api/v1/payments` | ✅ Oui | `correlation_id` |
| `POST /api/v1/pos-tickets` | ✅ Oui | `correlation_id` |
| `POST /api/v1/push_document` | ✅ Oui | `correlation_id`, `tenant` |
| `POST /api/v1/pos/zreports` | ✅ Oui | (à implémenter si nécessaire) |

---

## 📝 Exemples de Payloads

### Exemple 1 : `/api/v1/invoices` avec champs DVIG

```json
{
  "source": "sales",
  "model": "account.move",
  "odoo_id": 123,
  "state": "posted",
  "file": "<base64_pdf>",
  "meta": {
    "name": "FAC/2025/00123",
    "tenant": "doreviateam",
    "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
    "dvig_version": "1.1.0",
    "timestamp": "2025-11-26T10:30:00Z",
    "dvig_signature": "abc123def456...",
    "source_ip": "192.168.1.100",
    "user_agent": "DVIG/1.1.0"
  }
}
```

**Résultat** : ✅ 200/201 OK — Document ingéré, champs DVIG ignorés, `correlation_id` et `tenant` loggés

---

### Exemple 2 : `/api/v1/payments` avec champs DVIG

```json
{
  "tenant": "doreviateam",
  "source_model": "account.payment",
  "source_id": "PAY/2025/001",
  "payment_date": "2025-11-26T10:30:00Z",
  "amount": 100.50,
  "currency": "EUR",
  "method": "cash",
  "source": "pos",
  "payment_direction": "inbound",
  "is_refund": false,
  "company_id": 1,
  "payment": {
    "pos_order_ref": "ORDER/001",
    "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
    "dvig_version": "1.1.0"
  }
}
```

**Résultat** : ✅ 201 Created — Paiement ingéré, `correlation_id` loggé

---

### Exemple 3 : `/api/v1/pos-tickets` avec champs DVIG

```json
{
  "tenant": "doreviateam",
  "source_model": "pos.order",
  "source_id": "POS/2025/0001",
  "currency": "EUR",
  "ticket": {
    "lines": [{"product": "Test", "quantity": 1, "unit_price": 10.0}],
    "payments": [{"method": "cash", "amount": 10.0}],
    "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
    "dvig_version": "1.1.0"
  }
}
```

**Résultat** : ✅ 201 Created — Ticket ingéré, `correlation_id` loggé

---

## ✅ Validation

### Tests Automatisés

Les tests d'intégration valident la compatibilité :

- ✅ **Test A** : Payload avec champs DVIG → 200 OK
- ✅ **Test B** : Payload sans champs DVIG → 200 OK (rétrocompatibilité)
- ✅ **Test C** : Payload avec champs inconnus → 200 OK (tolérance)

**Fichier** : `tests/integration/dvig_compatibility_test.go`

---

## 🔍 Debugging

### Traçabilité Complète

Pour tracer une requête DVIG → Vault :

1. **Récupérer `correlation_id`** depuis les logs DVIG
2. **Chercher dans les logs Vault** :
   ```bash
   journalctl -u dorevia-vault | grep "correlation_id=550e8400-..."
   ```
3. **Vérifier le document** :
   ```bash
   curl -X GET "http://localhost:8080/documents/{document_id}" \
     -H "Authorization: Bearer TOKEN"
   ```

---

## 📚 Références

- **Spécification DVIG** : `docs/SPEC_VAULT_API_COMPATIBILITY_v1.1.md`
- **Avis Technique** : `docs/AVIS_TECHNIQUE_DVIG_COMPATIBILITY.md`
- **Plan d'Implémentation** : `docs/PLAN_IMPLEMENTATION_DVIG_COMPATIBILITY.md`
- **Réponse Équipe DVIG** : `docs/REPONSE_EQUIPE_DVIG_COMPATIBILITY.md`

---

**Document créé le** : 2025-11-26  
**Version** : 1.0  
**Statut** : ✅ **Actif**


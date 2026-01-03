# 🚨 Demande de Déploiement — Endpoint `/api/v1/payments`

**Date** : 2025-01-19  
**À** : Équipe Vault Backend (doreviateam)  
**De** : Équipe Odoo — Module `dorevia_vault_payment_connector`  
**Sujet** : Demande de déploiement de l'endpoint `/api/v1/payments` en production  
**Priorité** : 🔴 **URGENTE** — Blocage fonctionnel

---

## 📋 Résumé Exécutif

L'endpoint `/api/v1/payments` a été développé et testé selon la spécification v1.5.2+, mais **n'est pas encore déployé en production**. Le module Odoo `dorevia_vault_payment_connector` v1.1 est prêt et opérationnel, mais ne peut pas fonctionner sans cet endpoint.

**Impact** : Tous les paiements (POS et factures) ne peuvent pas être vaultérisés, générant des erreurs 404.

---

## 🔍 Diagnostic

### Erreur Rencontrée

```
VaultPermanentError: Erreur HTTP 404: {"error":"Cannot POST /api/v1/payments"}
```

### Tests Effectués

1. **URL construite** : `https://vault.doreviateam.com/api/v1/payments` ✅
2. **Configuration** : URL et token correctement configurés ✅
3. **Test OPTIONS** : Retourne 404 ❌
4. **Test POST** : Retourne 404 ❌

### Conclusion

L'endpoint `/api/v1/payments` **n'existe pas** sur le serveur de production `vault.doreviateam.com`.

---

## 📦 État du Module Odoo

### Module Prêt

- ✅ **Code implémenté** : `dorevia_vault_payment_connector` v1.1.0
- ✅ **Tests unitaires** : Tous passent
- ✅ **Intégration** : Complète avec les autres modules Dorevia Vault
- ✅ **Documentation** : Complète
- ✅ **Cron unifié** : Intégré dans `dorevia_vault_unified_worker`

### Fonctionnalités Bloquées

- ❌ Vaultérisation des paiements POS (`pos.payment`)
- ❌ Vaultérisation des paiements factures (`account.payment`)
- ❌ Gestion des paiements fractionnés
- ❌ Gestion des paiements multi-factures
- ❌ Gestion des remboursements/avoirs

---

## 📋 Références

### Documentation Existante

1. **Spécification** : `dorevia_vault_payment_connector_spec_v1.1_full.md`
2. **Réponse Vault** : `REPONSE_EQUIPE_ODOO_ENDPOINT_PAYMENTS.md` (2025-01-18)
3. **Demande initiale** : `demande_endpoint_payment.md`
4. **Spécification technique** : `SPECIFICATION_ENDPOINT_PAYMENTS_VAULT.md`

### Confirmation de l'Équipe Vault

D'après la réponse du 2025-01-18 (`REPONSE_EQUIPE_ODOO_ENDPOINT_PAYMENTS.md`) :

> ✅ **L'endpoint `/api/v1/payments` a été implémenté avec succès** et est prêt à être utilisé par votre module `dorevia_vault_payment_connector` v1.1.

**Statut déclaré** :

- ✅ Spécification validée
- ✅ Endpoint développé
- ✅ Tests unitaires effectués (4 tests)
- ✅ Tests d'intégration effectués (3 tests)
- ✅ Documentation complète
- ✅ Code compilé
- ✅ **Prêt pour déploiement**

---

## 🎯 Endpoint Attendu

### URL

```
POST https://vault.doreviateam.com/api/v1/payments
```

### Authentification

- **Header** : `Authorization: Bearer {token}` ou `Apikey {key}`
- **Permission requise** : `documents:write`
- **Header obligatoire** : `X-Tenant: {tenant}`

### Format du Payload

```json
{
  "tenant": "laplatine",
  "source_system": "odoo",
  "source_model": "account.payment",
  "source_id": "PAY/2025/00123",
  "payment_date": "2025-01-18T10:00:00Z",
  "amount": 100.50,
  "currency": "EUR",
  "method": "cash",
  "source": "pos",
  "payment_direction": "inbound",
  "is_refund": false,
  "company_id": 1,
  "payment": {
    "pos_order_ref": "ORDER/001",
    "session_id": "SESSION/001",
    "allocated_invoices": [
      {"invoice": "FAC/2025/00512", "portion": 100.50}
    ]
  }
}
```

### Réponse Attendue

```json
{
  "id": "6b78d57a-3d3c-4b2e-bae3-3a8ee3fdc8d0",
  "tenant": "laplatine",
  "sha256_hex": "abc123def4567890123456789abcdef0123456789abcdef0123456789abcdef",
  "ledger_hash": "xyz789...",
  "evidence_jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "created_at": "2025-01-18T10:00:00Z"
}
```

**Note** : Le format de réponse suit le pattern standardisé des autres endpoints (`/api/v1/pos-tickets`).

---

## ⚠️ Impact Business

### Blocage Actuel

- **Paiements POS** : Ne peuvent pas être vaultérisés
- **Paiements factures** : Ne peuvent pas être vaultérisés
- **Conformité** : Risque de non-conformité pour les paiements non vaultérisés
- **Audit** : Traçabilité incomplète des paiements

### Volume Estimé

- **Paiements POS** : ~100-500/jour (selon activité)
- **Paiements factures** : ~50-200/jour (selon activité)
- **Total** : ~150-700 paiements/jour non vaultérisés

---

## 🚀 Actions Demandées

### 1. Déploiement Immédiat

- [ ] Redémarrer le service Vault pour activer l'endpoint
- [ ] Vérifier que l'endpoint répond correctement
- [ ] Confirmer la version de l'API (doit être v1.5.2+)

### 2. Tests de Validation

- [ ] Test POST avec payload valide → 200/201
- [ ] Test avec header `X-Tenant` → Validation
- [ ] Test avec token invalide → 401
- [ ] Test avec payload invalide → 400
- [ ] Test idempotence (double envoi) → 200 OK

### 3. Communication

- [ ] Confirmer le déploiement par email
- [ ] Fournir la date/heure de déploiement
- [ ] Indiquer si un redémarrage du service est nécessaire

---

## 📞 Contact

**Équipe Odoo** : Dorevia Dev  
**Module** : `dorevia_vault_payment_connector` v1.1.0  
**Environnement** : Production (rdo18)

---

## ✅ Checklist de Suivi

### Côté Équipe Vault

- [ ] Demande reçue et analysée
- [ ] Service redémarré pour activer l'endpoint
- [ ] Endpoint `/api/v1/payments` accessible en production
- [ ] Tests de validation effectués
- [ ] Confirmation de déploiement envoyée
- [ ] Documentation mise à jour

### Côté Équipe Odoo

- [x] Module développé et testé
- [x] Code prêt pour production
- [x] Documentation complète
- [x] Demande de déploiement envoyée
- [ ] Tests d'intégration après déploiement
- [ ] Validation en production

---

## 📎 Fichiers de Référence

- **Spécification complète** : `docs/SPECIFICATION_ENDPOINT_PAYMENTS_VAULT.md`
- **Réponse Vault (2025-01-18)** : `docs/REPONSE_EQUIPE_ODOO_ENDPOINT_PAYMENTS.md`
- **Document de demande initiale** : `docs/demande_endpoint_payment.md`
- **Code client** : `services/vault_payment_client.py` (côté Odoo)
- **Builder payload** : `services/payment_payload_builder.py` (côté Odoo)

---

## 🔧 Actions Techniques Requises

### Redémarrage du Service

Pour activer l'endpoint, il suffit de redémarrer le service :

```bash
sudo systemctl restart dorevia-vault
```

### Vérification Post-Déploiement

```bash
# Vérifier le statut
sudo systemctl status dorevia-vault

# Vérifier les logs
sudo journalctl -u dorevia-vault -n 50 | grep -i payment

# Tester l'endpoint
curl -X POST https://vault.doreviateam.com/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "X-Tenant: test" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tenant": "test",
    "source_model": "account.payment",
    "source_id": "PAY/TEST/001",
    "payment_date": "2025-01-19T10:00:00Z",
    "amount": 100.00,
    "currency": "EUR",
    "method": "cash",
    "source": "pos",
    "payment_direction": "inbound",
    "is_refund": false,
    "company_id": 1,
    "payment": {}
  }'
```

**Résultat attendu** : `201 Created` ou `200 OK` (si idempotent)

---

**Merci de votre attention et de votre réactivité sur ce point critique.**

---

**Date de création** : 2025-01-19  
**Dernière mise à jour** : 2025-01-19  
**Statut** : ⏳ En attente de déploiement


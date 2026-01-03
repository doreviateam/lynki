# Demande de Support — Erreur 500 lors de la vaultérisation de Z-Reports sans tickets

## 📧 Message pour l'Équipe Dorevia-Vault

---

**À** : Équipe Dorevia-Vault Backend  
**Sujet** : Erreur 500 — Vaultérisation Z-Reports sans tickets (après modification v1.5.1)  
**Priorité** : Haute  
**Date** : 2025-01-16

---

Bonjour,

Suite à la modification de l'API (v1.5.1) qui accepte désormais l'absence de `last_ticket_hash` pour les Z-Reports sans tickets, nous rencontrons une **erreur 500** lors de la vaultérisation.

---

## 🎯 Contexte

- ✅ **Modification v1.5.1 déployée** : L'API accepte maintenant l'absence de `last_ticket_hash` pour `tickets_count = 0`
- ✅ **Code Odoo conforme** : Le champ `last_ticket_hash` est omis du payload (pas de `null`)
- ❌ **Erreur 500** : L'API retourne `{"error":"Failed to ingest Z-Report"}`

---

## 📋 Détails Techniques

### Payload Envoyé

```json
{
  "tenant": "1",
  "z_id": "Z2025-11-16-963",
  "company_id": 1,
  "sequence": 1,
  "date_open": "2025-11-16T16:44:50Z",
  "date_close": "2025-11-16T16:44:50Z",
  "totals": {
    "amount_total": 0.0,
    "amount_tax": 0.0,
    "amount_net": 0.0
  },
  "payments": [],
  "tickets": [],
  "tickets_count": 0,
  "hash_prev": null,
  "chain_level": "z-report"
}
```

**Points importants** :
- ✅ `last_ticket_hash` est **absent** (omis, pas de `null`)
- ✅ `hash_prev` est `null` (premier Z du tenant)
- ✅ `tickets_count` = 0
- ✅ Format RFC3339 pour les dates (avec 'Z')
- ✅ Tous les champs requis sont présents

### Réponse de l'API

```json
{
  "error": "Failed to ingest Z-Report"
}
```

**Status Code** : `500 Internal Server Error`

---

## 🔍 Tests Effectués

### Test 1 : Payload avec hash_prev actuel
- **Résultat** : `500 Internal Server Error`
- **Erreur** : `"Failed to ingest Z-Report"`

### Test 2 : Payload avec hash_prev = null explicite
- **Résultat** : `500 Internal Server Error`
- **Erreur** : `"Failed to ingest Z-Report"`

### Test 3 : Payload minimal
- **Résultat** : `500 Internal Server Error`
- **Erreur** : `"Failed to ingest Z-Report"`

---

## ❓ Questions pour l'Équipe Vault

1. **Logs serveur** : Pouvez-vous vérifier les logs du serveur Vault pour cette requête et identifier la cause exacte de l'erreur 500 ?

2. **Validation** : La validation accepte-t-elle bien l'absence de `last_ticket_hash` pour `tickets_count = 0` ?

3. **Repository** : Y a-t-il une vérification dans le repository qui pourrait échouer pour les sessions sans tickets ?

4. **Canonicalisation** : Le processus de canonicalisation gère-t-il correctement l'absence de `last_ticket_hash` ?

5. **Hash précédent** : Y a-t-il une vérification sur `hash_prev` qui pourrait échouer quand il est `null` ?

---

## 📊 Informations Complémentaires

### Endpoint
- **URL** : `POST /api/v1/pos/zreports`
- **Version API** : 1.5.1
- **Tenant** : `1`

### Headers
```
Content-Type: application/json
Authorization: Bearer [TOKEN]
X-Tenant: 1
```

### Health Check

Le health check `/api/v1/health/zreports` retourne :

```json
{
  "fsync_enabled": true,
  "ledger_path": "/opt/dorevia-vault/ledger",
  "status": "healthy"
}
```

---

## 🎯 Résultat Attendu

- **Status Code** : `201 Created`
- **Réponse** : JSON avec `z_id`, `hash_current`, `hash_prev`, `evidence_jws`, `proof_url`, `timestamp`

---

## 📝 Actions Côté Odoo

Côté Odoo, nous avons :
- ✅ Vérifié que `last_ticket_hash` est bien omis (pas de `null`)
- ✅ Vérifié le format des dates (RFC3339 avec 'Z')
- ✅ Vérifié que tous les champs requis sont présents
- ✅ Testé avec différents payloads (hash_prev null, payload minimal, etc.)

**Conclusion côté Odoo** : Le payload est conforme et correct. Le problème semble venir du traitement côté Vault.

---

## ⏱️ Délai Souhaité

Cette erreur bloque la vaultérisation des sessions POS sans tickets. Un retour dans les prochaines heures serait apprécié.

Merci pour votre support.

---

**Contact** : Équipe Odoo Doreviateam  
**Date** : 2025-01-16  
**Version Odoo** : 18.0  
**Version Module** : 0.2.0


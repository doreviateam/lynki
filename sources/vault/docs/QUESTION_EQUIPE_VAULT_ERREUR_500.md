# 📧 Question à l'Équipe Vault — Erreur HTTP 500

**Date** : 2025-12-14  

**Environnement** : Lab (Odoo Lab Demo)  

**Priorité** : Moyenne (erreur temporaire, retries automatiques en place)

---

## 1. Contexte

Bonjour équipe Vault,

Nous rencontrons des erreurs **HTTP 500** lors des tentatives de vaultérisation depuis Odoo Lab. Les erreurs sont correctement gérées comme temporaires et déclenchent des retries automatiques, mais nous souhaitons comprendre la cause racine.

---

## 2. Description du Problème

### 2.1 Erreur Observée

```
Erreur temporaire Vault (HTTP 500)
```

### 2.2 Contexte Technique

- **Environnement** : Odoo Lab Demo (`odoo.lab.demo.doreviateam.com`)

- **Service Vault** : `vault.lab.demo.doreviateam.com`

- **Module** : `dorevia_vault_connector`

- **Méthode** : `push_payload()` (nouvelle API payload JSON v1.0)

### 2.3 Fréquence

D'après les logs, plusieurs occurrences depuis le 12/12/2025 :

- 2025-12-12 02:27:38 — Facture FAC/2025/00001

- 2025-12-12 03:20:37 — Facture FAC/2025/00002

- 2025-12-12 15:23:36 — Facture FAC/2025/00003

- 2025-12-14 17:15:51 — Facture FAC/2025/00004

---

## 3. Informations Techniques

### 3.1 Endpoint Utilisé

```
POST /api/v1/push_payload
```

### 3.2 Headers Envoyés

```
Authorization: Bearer <token>

Content-Type: application/json

X-Tenant: <tenant_id>
```

### 3.3 Format du Payload

Le payload est au format **JSON v1.0** selon la spécification `AB_SPEC_DOREVIA_VAULT_PAYLOAD_v1.0.md` :

```json
{
  "payload_class": "nf525",
  "payload_version": "1.0",
  "source": "odoo",
  "source_version": "18.0",
  "source_model": "account.move",
  "source_id": "89",
  "generated_at": "2025-12-14T17:15:51Z",
  "context": {
    "tenant_id": "1",
    "company_id": 1,
    "company_country": "FR"
  },
  "sequence": {...},
  "amounts": {...},
  "taxes": [...],
  "customer": {...},
  "lines": [...],
  "payments": [...],
  "chain": {...}
}
```

### 3.4 Canonicalisation

Le payload est **canonicalisé localement** selon RFC 8785 avant envoi au Vault (posture zero-trust).

---

## 4. Comportement Actuel

### 4.1 Gestion de l'Erreur

Le code Odoo gère correctement l'erreur HTTP 500 comme temporaire :

```python
# Erreurs temporaires
if status in (408, 429, 500, 502, 503, 504):
    raise RetryableJobError(f"Erreur temporaire Vault (HTTP {status})")
```

### 4.2 Retries Automatiques

- ✅ Les jobs sont automatiquement retentés

- ✅ Backoff exponentiel configuré

- ✅ Max retries : 5 tentatives

### 4.3 Logs Odoo

```
WARNING: ⚠️  Erreur retryable lors de l'envoi au Vault pour FAC/2025/00004 (ID: 89): Erreur temporaire Vault (HTTP 500)
WARNING: === ERREUR RETRYABLE PIPELINE === Facture: FAC/2025/00004 (ID: 8) | Erreur: Erreur temporaire Vault (HTTP 500) | Retry dans 5 min
```

---

## 5. Questions pour l'Équipe Vault

### 5.1 Questions Générales

1. **Le service Vault est-il opérationnel** sur l'environnement Lab ?

   - Health check : `https://vault.lab.demo.doreviateam.com/health` retourne une erreur

2. **Y a-t-il des incidents connus** sur l'environnement Lab récemment ?

3. **Le format payload JSON v1.0 est-il correctement supporté** par l'endpoint `/api/v1/push_payload` ?

### 5.2 Questions Techniques

4. **Quelle est la cause exacte des erreurs HTTP 500** ?

   - Problème de base de données ?

   - Erreur de traitement du payload ?

   - Problème de ressources (surcharge) ?

   - Erreur de validation du payload ?

5. **Y a-t-il des logs côté Vault** pour les requêtes suivantes :

   - Correlation ID (si disponible)

   - Timestamp : 2025-12-14 17:15:51

   - Tenant : `1`

   - Source : `account.move` (ID: 89)

6. **Le payload JSON v1.0 est-il correctement parsé** par le Vault ?

   - Y a-t-il des erreurs de validation ?

   - Le format canonicalisé est-il accepté ?

7. **Y a-t-il des limitations** sur l'endpoint `/api/v1/push_payload` ?

   - Taille maximale du payload ?

   - Rate limiting ?

   - Timeout ?

### 5.3 Questions de Diagnostic

8. **Comment pouvons-nous obtenir plus de détails** sur l'erreur HTTP 500 ?

   - Y a-t-il un endpoint de diagnostic ?

   - Les logs sont-ils accessibles ?

   - Y a-t-il un correlation_id dans la réponse d'erreur ?

9. **Y a-t-il des métriques** disponibles sur les erreurs HTTP 500 ?

   - Fréquence des erreurs

   - Causes principales

   - Tendances

---

## 6. Informations de Contact

### 6.1 Configuration Actuelle

- **URL Vault** : `https://vault.lab.demo.doreviateam.com`

- **Tenant ID** : `1`

- **Environnement** : Lab

### 6.2 Exemples de Requêtes

**Dernière requête en erreur** :

- **Date** : 2025-12-14 17:15:51

- **Document** : Facture FAC/2025/00004 (ID: 89)

- **Type** : `account.move`

- **Endpoint** : `/api/v1/push_payload`

- **Status** : HTTP 500

---

## 7. Impact

### 7.1 Impact Utilisateur

- ⚠️ **Moyen** : Les documents ne sont pas vaultés immédiatement

- ✅ **Atténué** : Les retries automatiques permettent généralement de vaultériser après quelques tentatives

### 7.2 Impact Technique

- ⚠️ **Logs pollués** avec des warnings

- ⚠️ **Jobs en attente** dans la queue

- ✅ **Pas de perte de données** : les retries garantissent la vaultérisation

---

## 8. Actions Demandées

1. **Investigation** : Identifier la cause exacte des erreurs HTTP 500

2. **Correction** : Corriger le problème côté Vault si possible

3. **Communication** : Nous informer de la cause et de la solution

4. **Amélioration** : Améliorer les messages d'erreur pour faciliter le diagnostic

---

## 9. Informations Complémentaires

### 9.1 Logs Disponibles

Les logs Odoo sont disponibles et montrent :

- Les tentatives de vaultérisation

- Les erreurs HTTP 500

- Les retries automatiques

### 9.2 Code Source

Le code de gestion des erreurs est dans :

- `dorevia_addons/dorevia_vault_connector/services/vault_client.py`

- Méthode : `push_payload()`

- Ligne : ~332 (gestion HTTP 500)

---

## 10. Conclusion

Nous souhaitons comprendre la cause des erreurs HTTP 500 pour :

1. **Améliorer la fiabilité** de la vaultérisation

2. **Réduire les retries** inutiles

3. **Optimiser les performances**

Merci pour votre aide !

---

**Contact** : Équipe Dorevia Odoo  

**Date** : 2025-12-14


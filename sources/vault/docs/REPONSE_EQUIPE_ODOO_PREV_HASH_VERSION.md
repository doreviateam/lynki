# 📋 Réponse à l'Équipe Odoo — Questions Techniques

**Date** : 2025-11-24  
**Module** : `dorevia_vault_report` v2.4  
**Auteur** : Équipe Dorevia-Vault  
**Statut** : ✅ Réponse technique

---

## 🎯 Questions Reçues

1. **L'API retourne-t-elle `prev_hash` ?**
2. **Endpoint pour version Vault disponible ?**

---

## 📡 Réponse 1 : `prev_hash` dans les Réponses API

### État Actuel

**Réponse courte** : ❌ **Non, les endpoints `/api/v1/proof/*` ne retournent actuellement pas `prev_hash`.**

### Détails Techniques

#### Ce qui est Disponible

Les endpoints `/api/v1/proof/*` retournent actuellement :

```json
{
  "id": "uuid-vault",
  "hash": "sha256_hash",
  "ledger": "ledger_id",
  "timestamp": "2025-01-15T10:30:00Z",
  "jws": "jws_token",
  "status": "verified",
  "source_model": "account.move",
  "source_id": "123"
}
```

#### Ce qui Existe dans la Base de Données

Le champ `previous_hash` existe bien dans la table `ledger` (PostgreSQL) et permet le chaînage cryptographique des documents. Cependant, il n'est **pas inclus** dans la réponse des endpoints proof actuellement.

#### Pourquoi `prev_hash` n'est pas Inclus

1. **Complexité de récupération** : Nécessite une jointure avec la table `ledger` pour chaque document
2. **Performance** : Ajoute une requête supplémentaire par appel
3. **Cas d'usage initial** : Les endpoints proof ont été conçus pour récupérer les preuves d'intégrité, pas nécessairement le chaînage

### Options Disponibles

#### Option A : Utiliser l'Endpoint Ledger Export

Si vous avez besoin du `prev_hash`, vous pouvez utiliser :

**Endpoint** : `GET /api/v1/ledger/export`

**Exemple** :
```bash
curl -X GET "https://vault.doreviateam.com/api/v1/ledger/export?document_id=uuid-vault&format=json" \
  -H "Authorization: Bearer <token>"
```

**Réponse** :
```json
{
  "id": "ledger-entry-id",
  "document_id": "uuid-vault",
  "hash": "sha256_hash",
  "prev_hash": "previous_hash_value",
  "seq": 123,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

#### Option B : Ajout de `prev_hash` dans les Endpoints Proof

**Si nécessaire**, nous pouvons ajouter le champ `prev_hash` dans la réponse des endpoints `/api/v1/proof/*`.

**Impact** :
- ✅ Avantage : Informations complètes en un seul appel
- ⚠️ Inconvénient : Requête supplémentaire (jointure avec table `ledger`)
- ⚠️ Performance : Légèrement plus lent (< 10ms supplémentaire)

**Question pour vous** : Avez-vous besoin de `prev_hash` dans les réponses des endpoints proof, ou l'endpoint ledger export suffit-il ?

---

## 📡 Réponse 2 : Endpoint Version Vault

### ✅ Endpoint Disponible

**Réponse courte** : ✅ **Oui, l'endpoint `/version` est disponible et opérationnel.**

### Détails

#### Endpoint

**URL** : `GET /version`

**Authentification** : ❌ Aucune (endpoint public)

**Exemple** :
```bash
curl https://vault.doreviateam.com/version
```

#### Réponse

```json
{
  "version": "1.6.0",
  "commit": "52e46e8",
  "built_at": "2025-11-24T19:59:12Z",
  "schema": "20251124_1959"
}
```

#### Champs Retournés

| Champ | Type | Description |
|-------|------|-------------|
| `version` | string | Version sémantique (ex: "1.6.0") |
| `commit` | string | Hash du commit Git (court) |
| `built_at` | string (ISO 8601) | Date/heure de compilation |
| `schema` | string | Schéma de version (format: YYYYMMDD_HHMM) |

#### Cas d'Usage

- ✅ **Vérification de version** : Pour s'assurer que le client utilise la bonne version de l'API
- ✅ **Monitoring** : Pour suivre les déploiements
- ✅ **Debugging** : Pour identifier la version en cas de problème

#### Exemple d'Utilisation dans le Module

```python
import requests

def check_vault_version():
    response = requests.get("https://vault.doreviateam.com/version")
    data = response.json()
    print(f"Vault version: {data['version']}")
    print(f"Built at: {data['built_at']}")
    return data['version']
```

---

## 📋 Résumé

| Question | Réponse | Statut |
|----------|---------|--------|
| **L'API retourne-t-elle `prev_hash` ?** | ❌ Non (mais disponible via `/api/v1/ledger/export`) | ⚠️ À statuer si ajout nécessaire |
| **Endpoint pour version Vault disponible ?** | ✅ Oui (`GET /version`) | ✅ Opérationnel |

---

## 🔄 Prochaines Étapes

### Pour `prev_hash`

**Question pour l'équipe Odoo** : Avez-vous besoin de `prev_hash` dans les réponses des endpoints `/api/v1/proof/*` ?

**Options** :
1. **Option A** : Utiliser l'endpoint `/api/v1/ledger/export` existant (recommandé si besoin ponctuel)
2. **Option B** : Ajouter `prev_hash` dans les endpoints proof (si besoin fréquent)

**Si Option B choisie** :
- ⏱️ **Temps d'implémentation** : ~2 heures
- 📊 **Impact performance** : < 10ms supplémentaire par requête
- 🚀 **Déploiement** : Sprint 8 (peut être fait rapidement)

### Pour `/version`

✅ **Aucune action requise** - L'endpoint est disponible et fonctionnel.

---

## 📞 Contact

Pour toute question ou clarification, contactez-nous :

**Email** : `dev@doreviateam.com`  
**Sujet recommandé** : `[API-QUESTION] prev_hash ou version`

---

**Document créé le** : 2025-11-24  
**Statut** : ⏳ En attente de retour de l'équipe Odoo pour `prev_hash`


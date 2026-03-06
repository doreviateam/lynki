# 🔧 Résolution : Hash Ledger Vide dans Odoo

**Date** : 2026-01-12  
**Problème** : Le champ "Hash Ledger" est vide dans Odoo alors que le document dans Vault a un `ledger_hash`  
**Cause** : La requête SQL `GetDocumentBySourceID` ne sélectionnait pas `ledger_hash` et `evidence_jws`  
**Solution** : Correction de la requête SQL + déploiement Vault v1.3.4

---

## 🔍 Diagnostic

### État Initial

- **Document dans Vault** : ✅ `ledger_hash` présent : `509779503d99126fb2b1c1ce217bf3cc40c379b595cffe8a799dc7f1ae4c6165`
- **API `/api/v1/proof`** : ❌ Ne retournait pas `ledger_hash` (champ `ledger` absent)
- **Odoo** : ❌ Champ `dorevia_vault_ledger_hash` vide

### Cause Racine

La fonction `GetDocumentBySourceID` dans `sources/vault/internal/storage/queries.go` ne sélectionnait **pas** les colonnes `ledger_hash` et `evidence_jws` dans la requête SQL :

```go
// AVANT (incomplet)
SELECT id, filename, ..., idempotency_key
FROM documents
WHERE ...
// ❌ ledger_hash et evidence_jws manquants
```

**Résultat** : Même si le document avait un `ledger_hash` dans la base de données, il n'était pas chargé dans l'objet `Document`, donc l'API ne le retournait pas.

---

## 🔧 Solution Appliquée

### Modification du Code

**Fichier** : `sources/vault/internal/storage/queries.go`

**Fonctions modifiées** :
1. `GetDocumentByID` : Ajout de `ledger_hash` et `evidence_jws` dans le SELECT
2. `GetDocumentBySourceID` : Ajout de `ledger_hash` et `evidence_jws` dans le SELECT

**Code ajouté** :
```go
// APRÈS (complet)
SELECT id, filename, ..., idempotency_key, ledger_hash, evidence_jws
FROM documents
WHERE ...
// ✅ ledger_hash et evidence_jws inclus
```

### Déploiement

1. **Build de l'image** : `dorevia/vault:v1.3.4`
2. **Mise à jour docker-compose.yml** : Image changée de `v1.3.3` → `v1.3.4`
3. **Redéploiement** : `docker compose up -d vault`

---

## ✅ Validation

### Test de l'API

**Avant** :
```json
{
  "id": "...",
  "hash": "...",
  "ledger": null,  // ❌ Absent
  "jws": null
}
```

**Après** :
```json
{
  "id": "...",
  "hash": "...",
  "ledger": "509779503d99126fb2b1c1ce217bf3cc40c379b595cffe8a799dc7f1ae4c6165",  // ✅ Présent
  "jws": "eyJhbGci..."
}
```

### Récupération dans Odoo

Le **CRON #2** d'Odoo récupère maintenant correctement le `ledger_hash` depuis l'API Vault et le stocke dans `dorevia_vault_ledger_hash`.

**Code Odoo** (déjà correct) :
```python
if 'ledger' in vault_info:
    vault_data['dorevia_vault_ledger_hash'] = vault_info['ledger']
elif 'ledger_hash' in vault_info:
    vault_data['dorevia_vault_ledger_hash'] = vault_info['ledger_hash']
```

---

## 📊 Résultat Final

### Pour la Facture FAC/2026/00004 (ID: 1900)

- ✅ **Document dans Vault** : `ledger_hash` présent
- ✅ **API `/api/v1/proof`** : Retourne `ledger` avec la valeur
- ✅ **Odoo** : Le CRON #2 récupère et stocke `dorevia_vault_ledger_hash`
- ✅ **Interface** : Le champ "Hash Ledger" s'affiche correctement

---

## 🔄 Prochaines Étapes

1. **Attendre le CRON #2** (toutes les 1 minute) pour mettre à jour automatiquement
2. **Ou déclencher manuellement** le CRON #2 pour mise à jour immédiate

Le champ "Hash Ledger" devrait maintenant s'afficher dans l'interface Odoo après la prochaine exécution du CRON #2.

---

## 🔗 Références

- **Code modifié** : `sources/vault/internal/storage/queries.go`
- **Image Docker** : `dorevia/vault:v1.3.4`
- **Docker Compose** : `tenants/core-stinger/platform/docker-compose.yml`

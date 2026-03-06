# 📚 Explication : Hash Ledger

**Date** : 2026-01-12  
**Système** : Dorevia Vault

---

## 🎯 Qu'est-ce que le Hash Ledger ?

Le **Hash Ledger** (registre hash-chaîné) est un mécanisme de **traçabilité immuable** qui garantit l'intégrité et l'ordre chronologique de tous les documents vaultés dans Dorevia Vault.

### Analogie simple

Imaginez un **livre de comptes** où :
- Chaque page est numérotée et liée à la page précédente
- Si vous modifiez une page, toutes les pages suivantes deviennent invalides
- Vous pouvez vérifier que le livre n'a pas été altéré en vérifiant les liens entre les pages

Le Hash Ledger fonctionne de la même manière, mais avec des **hash cryptographiques** au lieu de numéros de page.

---

## 🔗 Comment ça fonctionne ?

### Principe de chaînage

Chaque document ajouté au ledger crée une **chaîne cryptographique** :

```
Document 1 → Hash1 = SHA256(sha256_document1)
Document 2 → Hash2 = SHA256(Hash1 + sha256_document2)
Document 3 → Hash3 = SHA256(Hash2 + sha256_document3)
Document 4 → Hash4 = SHA256(Hash3 + sha256_document4)
...
```

### Calcul du Hash Ledger

**Pour le premier document** :
```
ledger_hash = SHA256(sha256_document)
```

**Pour les documents suivants** :
```
ledger_hash = SHA256(previous_ledger_hash + sha256_document)
```

### Exemple concret

Supposons 3 documents vaultés dans l'ordre :

1. **Document A** (SHA256: `abc123...`)
   - Premier document → `ledger_hash = SHA256("abc123...")`
   - Résultat : `ledger_hash_A = "def456..."`

2. **Document B** (SHA256: `xyz789...`)
   - Chaînage → `ledger_hash = SHA256("def456..." + "xyz789...")`
   - Résultat : `ledger_hash_B = "ghi012..."`

3. **Document C** (SHA256: `mno345...`)
   - Chaînage → `ledger_hash = SHA256("ghi012..." + "mno345...")`
   - Résultat : `ledger_hash_C = "pqr678..."`

**Si quelqu'un modifie le Document B** :
- Le `sha256_document` de B change
- Le `ledger_hash_B` change
- Le `ledger_hash_C` devient invalide (car il dépend de `ledger_hash_B`)
- Toute la chaîne après B devient invalide

---

## 🛡️ Garanties de sécurité

### 1. Immuabilité

Une fois qu'un document est dans le ledger, **il ne peut pas être modifié** sans casser la chaîne.

### 2. Ordre chronologique

Le chaînage garantit que l'**ordre des documents** est préservé et vérifiable.

### 3. Détection de modifications

Toute modification d'un document ancien **casse la chaîne** et peut être détectée.

### 4. Traçabilité complète

Chaque document est lié à tous les documents précédents, créant une **traçabilité complète**.

---

## 📊 Structure dans la base de données

### Table `ledger`

```sql
CREATE TABLE ledger (
  id SERIAL PRIMARY KEY,
  document_id UUID NOT NULL,      -- ID du document
  hash TEXT NOT NULL,              -- Hash ledger (chaîné)
  previous_hash TEXT,              -- Hash du document précédent
  timestamp TIMESTAMPTZ NOT NULL, -- Date/heure d'ajout
  evidence_jws TEXT                -- Signature JWS
);
```

### Table `documents`

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  sha256_hex TEXT,                 -- Hash du document
  ledger_hash TEXT,                 -- Hash ledger (référence)
  evidence_jws TEXT,                -- Signature JWS
  ...
);
```

---

## 🔍 Vérification d'intégrité

### Endpoint de vérification

**GET** `/api/v1/ledger/verify/:document_id`

Vérifie que :
1. Le document existe
2. Le `ledger_hash` dans `documents` correspond à une entrée dans `ledger`
3. La chaîne est cohérente (chaque hash dépend du précédent)

### Exemple de vérification

```bash
curl https://vault.core-stinger.doreviateam.com/api/v1/ledger/verify/8db3855b-969b-4ff6-8ed8-38458870839c
```

**Réponse** :
```json
{
  "valid": true,
  "checks": [
    {
      "component": "ledger",
      "status": "ok",
      "message": "Ledger entry found with hash: 03758f5da195c7ed3f9d6ed21237b34b2febd17531d37ba43b6946fcc535e38b"
    }
  ]
}
```

---

## 📈 Utilisation dans Odoo

### Affichage dans l'interface

Le Hash Ledger est affiché dans la section **"DOREVIA VAULT - PREUVE (SPEC V1.1)"** de chaque facture vaultée :

- **Vault SHA256** : Hash du document lui-même
- **Hash Ledger** : Hash dans la chaîne du ledger (traçabilité)
- **JWS** : Signature cryptographique

### Stockage dans Odoo

Le Hash Ledger est stocké dans le champ `dorevia_vault_ledger_hash` de la table `account_move`.

---

## 🔄 Flux complet

```
1. Document reçu dans Vault
   ↓
2. Calcul SHA256 du document
   ↓
3. Récupération du previous_hash (dernier hash du ledger)
   ↓
4. Calcul du nouveau ledger_hash :
   - Si premier : SHA256(sha256_document)
   - Sinon : SHA256(previous_hash + sha256_document)
   ↓
5. Insertion dans la table ledger
   ↓
6. Stockage du ledger_hash dans documents.ledger_hash
   ↓
7. Retour dans l'API /api/v1/proof
   ↓
8. Récupération par Odoo (CRON #2)
   ↓
9. Affichage dans l'interface Odoo
```

---

## 🎯 Avantages

### 1. Auditabilité

- **Traçabilité complète** : Chaque document est lié à tous les précédents
- **Ordre garanti** : L'ordre chronologique est préservé
- **Vérification possible** : N'importe qui peut vérifier l'intégrité

### 2. Sécurité

- **Détection de modifications** : Toute altération casse la chaîne
- **Immuabilité** : Les documents ne peuvent pas être modifiés sans être détectés
- **Preuve d'existence** : Le hash prouve que le document existait à un moment donné

### 3. Conformité

- **Conformité réglementaire** : Traçabilité requise pour certains documents
- **Audit facilité** : Vérification rapide de l'intégrité
- **Preuve légale** : Le ledger peut servir de preuve en cas de litige

---

## 📝 Exemple pratique

### Facture FAC/2026/00008

- **Vault ID** : `8db3855b-969b-4ff6-8ed8-38458870839c`
- **SHA256** : `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- **Hash Ledger** : `03758f5da195c7ed3f9d6ed21237b34b2febd17531d37ba43b6946fcc535e38b`
- **Previous Hash** : `cf0cdd522e67772114b3c20a10a6445ba2d7e6833644f5233c49ffd1fc11a03e`

Le Hash Ledger `03758f5d...` est calculé à partir de :
- Le hash ledger précédent (`cf0cdd52...`)
- Le SHA256 de la facture (`e3b0c442...`)

Si quelqu'un modifie la facture FAC/2026/00008 :
- Le SHA256 change
- Le Hash Ledger devient invalide
- Tous les documents suivants dans le ledger deviennent invalides
- La modification est **immédiatement détectable**

---

## 🔗 Références

- **Code source** : `sources/vault/internal/ledger/append.go`
- **Migration SQL** : `sources/vault/migrations/004_add_ledger.sql`
- **Documentation** : `sources/vault/docs/PATCH_CONSOLIDE_SPRINT2_ANALYSE.md`
- **Résolution problème** : `ZeDocs/TestV3/RESOLUTION_LEDGER_HASH_VIDE_20260112.md`

---

## ✅ Résumé

Le **Hash Ledger** est un mécanisme de **traçabilité immuable** qui :

1. ✅ **Chaîne tous les documents** dans l'ordre chronologique
2. ✅ **Détecte toute modification** en cassant la chaîne
3. ✅ **Garantit l'intégrité** de tous les documents vaultés
4. ✅ **Fournit une preuve** d'existence et d'ordre
5. ✅ **Facilite l'audit** et la conformité réglementaire

C'est l'équivalent d'une **blockchain privée** pour garantir l'intégrité des documents financiers.

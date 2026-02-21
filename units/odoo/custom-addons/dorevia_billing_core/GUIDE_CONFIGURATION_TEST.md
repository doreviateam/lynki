# Guide de Configuration Test — Dorevia Billing CORE

**Date** : 2026-01-04  
**Environnement** : Odoo Lab CORE

Ce guide vous accompagne pas à pas pour configurer un tenant et un contrat de test dans Dorevia Billing CORE.

---

## 📋 Prérequis

- ✅ Module `dorevia_billing_core` installé
- ✅ Accès administrateur à Odoo
- ✅ Localisation fiscale française configurée

---

## 🔑 Étape 1 : Configurer le Token API

### Via l'interface Odoo

1. **Menu** : `Paramètres` → `Technique` → `Paramètres` → `Paramètres système`
2. Cliquez sur **"Créer"**
3. Remplissez :
   - **Clé** : `dorevia_billing.core_api_token`
   - **Valeur** : `sk_test_abc123xyz789` (remplacez par votre token réel)
4. Cliquez sur **"Enregistrer"**

### Vérification

Le paramètre doit apparaître dans la liste avec la clé `dorevia_billing.core_api_token`.

---

## 👥 Étape 2 : Créer un Tenant de Test

### 2.1 Créer le partenaire

1. **Menu** : `Contacts` → `Créer`
2. Remplissez les champs :
   - **Nom** : `Client Test Premium`
   - **Référence** (champ `ref`) : `test-tenant-1` ⚠️ **CRITIQUE** - Ce champ doit correspondre au `tenant` envoyé par le Vault
   - **Type** : `Entreprise`
   - **Email** : `test@example.com` (optionnel)
   - **Téléphone** : `+33 1 23 45 67 89` (optionnel)
3. Cliquez sur **"Enregistrer"**

### 2.2 Vérification

- Le partenaire doit apparaître dans la liste des contacts
- Le champ **Référence** (`ref`) doit être `test-tenant-1`
- Le **Type** doit être `Entreprise`

---

## 📄 Étape 3 : Créer un Contrat de Test

### 3.1 Créer le contrat

1. **Menu** : `Dorevia Billing` → `Contrats` → `Créer`
2. Remplissez les champs :
   - **Nom** : `Contrat Premium Test`
   - **Tenant** : Sélectionnez `Client Test Premium` (créé à l'étape 2)
   - **Date de début** : `2026-01-01`
   - **Date de fin** : (laisser vide pour contrat illimité)
   - **Actif** : ✅ Cocher (déjà coché par défaut)
   - **Taux TVA (%)** : `20.0`
   - **Exonéré de TVA** : ❌ Décocher (défaut)
3. Cliquez sur **"Enregistrer"**

### 3.2 Vérification

- Le contrat doit apparaître dans la liste
- Le **Tenant** doit être `Client Test Premium`
- Le statut **Actif** doit être coché

---

## 💰 Étape 4 : Ajouter des Règles Tarifaires

### 4.1 Ouvrir le contrat

1. **Menu** : `Dorevia Billing` → `Contrats`
2. Cliquez sur `Contrat Premium Test`
3. Allez dans l'onglet **"Règles tarifaires"**

### 4.2 Créer la première règle (Paliers pour Factures clients)

#### Règle 1 : Premier palier (0-100 documents)

1. Cliquez sur **"Ajouter une ligne"**
2. Remplissez :
   - **Type de mouvement** : `Facture client`
   - **Prix unitaire (HT)** : `1.00`
   - **Devise** : `EUR` (ou la devise de votre entreprise)
   - **Paliers : De** : `0`
   - **Paliers : À** : `100`
   - **Remise (%)** : `0`
   - **Séquence** : `10`
   - **Actif** : ✅ Cocher
3. Cliquez sur **"Enregistrer"** (ou laissez Odoo sauvegarder automatiquement)

#### Règle 2 : Deuxième palier (100-200 documents)

1. Cliquez sur **"Ajouter une ligne"**
2. Remplissez :
   - **Type de mouvement** : `Facture client`
   - **Prix unitaire (HT)** : `0.90`
   - **Devise** : `EUR`
   - **Paliers : De** : `100`
   - **Paliers : À** : `200`
   - **Remise (%)** : `5`
   - **Séquence** : `20`
   - **Actif** : ✅ Cocher
3. Cliquez sur **"Enregistrer"**

#### Règle 3 : Troisième palier (200+ documents)

1. Cliquez sur **"Ajouter une ligne"**
2. Remplissez :
   - **Type de mouvement** : `Facture client`
   - **Prix unitaire (HT)** : `0.80`
   - **Devise** : `EUR`
   - **Paliers : De** : `200`
   - **Paliers : À** : (laisser vide = illimité)
   - **Remise (%)** : `10`
   - **Séquence** : `30`
   - **Actif** : ✅ Cocher
3. Cliquez sur **"Enregistrer"**

### 4.3 Créer des règles pour les autres types (optionnel)

Vous pouvez répéter le processus pour :
- **Facture fournisseur** (`in_invoice`)
- **Avoir client** (`out_refund`)
- **Avoir fournisseur** (`in_refund`)

### 4.4 Vérification

- Les 3 règles doivent apparaître dans l'onglet "Règles tarifaires"
- Les séquences doivent être dans l'ordre : 10, 20, 30
- Toutes les règles doivent être **Actives**

---

## 🧪 Étape 5 : Tester la Réception d'un Constat

### 5.1 Préparer le test

**Token API** : Récupérez la valeur de `dorevia_billing.core_api_token` configurée à l'étape 1.

**URL** : `https://odoo.lab.core.doreviateam.com/api/v1/constats`

### 5.2 Envoyer un constat de test via curl

```bash
curl -X POST https://odoo.lab.core.doreviateam.com/api/v1/constats \
  -H "Authorization: api_key sk_test_abc123xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "constat_id": "550e8400-e29b-41d4-a716-446655440000",
    "tenant": "test-tenant-1",
    "period": "2026-01",
    "generated_at": "2026-02-01T00:05:23Z",
    "vault_id": "vault-test",
    "volumes": {
      "out_invoice": 150,
      "in_invoice": 0,
      "out_refund": 0,
      "in_refund": 0
    },
    "compliance": {
      "compliant": 120,
      "non_compliant_2026": 20,
      "out_of_scope": 10
    },
    "proofs": {
      "jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
      "ledger_hash": "abc123def456...",
      "documents_count": 150
    }
  }'
```

**Remplacez** :
- `sk_test_abc123xyz789` par votre token API réel
- `test-tenant-1` par le code du tenant créé (doit correspondre exactement)

### 5.3 Réponse attendue

```json
{
  "message": "Constat received and processed",
  "constat_id": "550e8400-e29b-41d4-a716-446655440000",
  "odoo_id": 1,
  "status": "validated"
}
```

---

## ✅ Étape 6 : Vérifier le Constat et la Facture

### 6.1 Vérifier le constat

1. **Menu** : `Dorevia Billing` → `Constats`
2. Le constat doit apparaître dans la liste avec :
   - **Constat ID** : `550e8400-e29b-41d4-a716-446655440000`
   - **Tenant** : `Client Test Premium`
   - **Période** : `2026-01`
   - **Contrat** : `Contrat Premium Test`
   - **État** : `Validé`
   - **Volumes** : `out_invoice: 150`

### 6.2 Vérifier la facture générée

1. **Menu** : `Facturation` → `Clients` → `Factures`
2. La facture doit être créée automatiquement (si `auto_post_invoice = True`)
3. Vérifiez :
   - **Partenaire** : `Client Test Premium`
   - **Lignes de facturation** : Correspondent aux volumes (150 documents)
   - **Montant HT** : Calculé selon les paliers (ex: 100 × 1.00 + 50 × 0.90 × 0.95 = 142.75 €)
   - **Montant TTC** : HT + TVA (20%) = 171.30 €

### 6.3 Générer manuellement la facture (si nécessaire)

Si la facture n'a pas été générée automatiquement :

1. **Menu** : `Dorevia Billing` → `Constats`
2. Ouvrez le constat
3. Cliquez sur le bouton **"Générer la facture"**
4. La facture sera créée dans `Facturation` → `Clients` → `Factures`

---

## 📊 Exemple de Calcul avec les Paliers

Pour **150 documents** `out_invoice` avec les règles configurées :

1. **Premier palier (0-100)** : 100 documents × 1.00 € = **100.00 €**
2. **Deuxième palier (100-200)** : 50 documents × 0.90 € × (1 - 0.05) = **42.75 €**
3. **Total HT** : 100.00 + 42.75 = **142.75 €**
4. **TVA (20%)** : 142.75 × 0.20 = **28.55 €**
5. **Total TTC** : 142.75 + 28.55 = **171.30 €**

---

## 🐛 Dépannage

### Le constat n'apparaît pas

**Vérifications** :
1. Vérifier les logs Odoo : `docker compose logs odoo --tail 50`
2. Vérifier que le token API est correct
3. Vérifier que le tenant existe avec le bon code (`test-tenant-1`)

### "Tenant non trouvé"

**Solution** :
- Vérifier que le **Code** du tenant correspond exactement au `tenant` envoyé
- Le code est sensible à la casse (`test-tenant-1` ≠ `Test-Tenant-1`)

### "Aucun contrat actif"

**Solution** :
- Vérifier qu'un contrat existe pour le tenant
- Vérifier que le contrat est **Actif**
- Vérifier que la période du constat (`2026-01`) est dans la plage du contrat

### La facture n'est pas générée automatiquement

**Vérifications** :
1. Vérifier que `contract_id` est présent sur le constat
2. Vérifier que `state = 'validated'`
3. Vérifier que `invoice_status = 'pending'`
4. Générer manuellement via le bouton "Générer la facture"

---

## 📚 Documentation Complémentaire

- **Guide d'installation** : `README_INSTALLATION.md`
- **Étapes après activation** : `ETAPES_APRES_ACTIVATION.md`
- **Spécification** : `ZeDocs/V2/SPEC3_ODOO_CORE_RECEPTION_CONSTATS_FACTURATION_v1.0.md`

---

**Date de création** : 2026-01-04  
**Version** : 1.0


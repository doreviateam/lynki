# ⚙️ Configuration rapide : 3 tenants dans Odoo

## 📋 Checklist de configuration

### ✅ Étape 1 : Créer les 3 contacts (tenants)

1. **Contacts → Créer**

   **Tenant 1 - Premium** :
   - Nom : `Client Premium Test`
   - Référence (ref) : `tenant-premium-1`
   - Email : `premium@example.com`
   - Enregistrer

   **Tenant 2 - Standard** :
   - Nom : `Client Standard Test`
   - Référence (ref) : `tenant-standard-1`
   - Email : `standard@example.com`
   - Enregistrer

   **Tenant 3 - Starter** :
   - Nom : `Client Starter Test`
   - Référence (ref) : `tenant-starter-1`
   - Email : `starter@example.com`
   - Enregistrer

---

### ✅ Étape 2 : Créer les 3 contrats

1. **Dorevia Billing → Contrats → Créer**

   **Contrat 1 - Premium** :
   - Nom : `Contrat Premium 2026`
   - Tenant : `Client Premium Test`
   - Date début : `2026-01-01`
   - Date fin : (vide)
   - Actif : ✅
   - Taux TVA (%) : `20,00`
   - Exonéré de TVA : ❌
   - **Ne pas enregistrer tout de suite** (on va ajouter les règles tarifaires)

   **Contrat 2 - Standard** :
   - Nom : `Contrat Standard 2026`
   - Tenant : `Client Standard Test`
   - Date début : `2026-01-01`
   - Date fin : (vide)
   - Actif : ✅
   - Taux TVA (%) : `20,00`
   - Exonéré de TVA : ❌
   - **Ne pas enregistrer tout de suite**

   **Contrat 3 - Starter** :
   - Nom : `Contrat Starter 2026`
   - Tenant : `Client Starter Test`
   - Date début : `2026-01-01`
   - Date fin : (vide)
   - Actif : ✅
   - Taux TVA (%) : `20,00`
   - Exonéré de TVA : ❌
   - **Ne pas enregistrer tout de suite**

---

### ✅ Étape 3 : Ajouter les règles tarifaires

#### Contrat Premium - Onglet "Règles tarifaires"

Cliquez sur "Ajouter une ligne" 3 fois :

**Règle 1** :
- Type de document : `Facture Client`
- Prix unitaire HT : `0,10`
- Devise : `EUR`
- Paliers : De : `0`
- Paliers : À : `1000`
- Remise (%) : `0`
- Séquence : `10`
- Actif : ✅

**Règle 2** :
- Type de document : `Facture Client`
- Prix unitaire HT : `0,08`
- Devise : `EUR`
- Paliers : De : `1000`
- Paliers : À : `5000`
- Remise (%) : `0`
- Séquence : `20`
- Actif : ✅

**Règle 3** :
- Type de document : `Facture Client`
- Prix unitaire HT : `0,05`
- Devise : `EUR`
- Paliers : De : `5000`
- Paliers : À : (vide)
- Remise (%) : `0`
- Séquence : `30`
- Actif : ✅

**Enregistrer le contrat Premium**

---

#### Contrat Standard - Onglet "Règles tarifaires"

Cliquez sur "Ajouter une ligne" 3 fois :

**Règle 1** :
- Type de document : `Facture Client`
- Prix unitaire HT : `0,12`
- Devise : `EUR`
- Paliers : De : `0`
- Paliers : À : `500`
- Remise (%) : `0`
- Séquence : `10`
- Actif : ✅

**Règle 2** :
- Type de document : `Facture Client`
- Prix unitaire HT : `0,10`
- Devise : `EUR`
- Paliers : De : `500`
- Paliers : À : `2000`
- Remise (%) : `0`
- Séquence : `20`
- Actif : ✅

**Règle 3** :
- Type de document : `Facture Client`
- Prix unitaire HT : `0,08`
- Devise : `EUR`
- Paliers : De : `2000`
- Paliers : À : (vide)
- Remise (%) : `0`
- Séquence : `30`
- Actif : ✅

**Enregistrer le contrat Standard**

---

#### Contrat Starter - Onglet "Règles tarifaires"

Cliquez sur "Ajouter une ligne" 3 fois :

**Règle 1** :
- Type de document : `Facture Client`
- Prix unitaire HT : `0,15`
- Devise : `EUR`
- Paliers : De : `0`
- Paliers : À : `100`
- Remise (%) : `0`
- Séquence : `10`
- Actif : ✅

**Règle 2** :
- Type de document : `Facture Client`
- Prix unitaire HT : `0,12`
- Devise : `EUR`
- Paliers : De : `100`
- Paliers : À : `500`
- Remise (%) : `0`
- Séquence : `20`
- Actif : ✅

**Règle 3** :
- Type de document : `Facture Client`
- Prix unitaire HT : `0,10`
- Devise : `EUR`
- Paliers : De : `500`
- Paliers : À : (vide)
- Remise (%) : `0`
- Séquence : `30`
- Actif : ✅

**Enregistrer le contrat Starter**

---

## 🧪 Exécution des tests

Une fois la configuration terminée, exécutez le script de test :

```bash
cd /opt/dorevia-plateform/units/odoo/custom-addons/dorevia_billing_core
./test_3_tenants.sh
```

Ou exécutez les 3 commandes `curl` manuellement (voir `TEST_3_TENANTS.md`).

---

## ✅ Vérifications après les tests

1. **Dorevia Billing → Constats** :
   - 3 constats avec statut `validated` ou `invoiced`
   - Vérifier les montants calculés

2. **Comptabilité → Factures** :
   - 3 factures générées automatiquement
   - Montants attendus :
     - Premium : **18,00 € TTC** (150 factures × 0,10 € × 1,20)
     - Standard : **300,00 € TTC** (2500 factures avec paliers)
     - Starter : **13,50 € TTC** (75 factures × 0,15 € × 1,20)

---

## 📊 Résumé des montants attendus

| Tenant | Volume | Calcul | Montant HT | Montant TTC |
|--------|--------|--------|------------|-------------|
| Premium | 150 | 150 × 0,10 € | 15,00 € | 18,00 € |
| Standard | 2500 | 500×0,12 + 1500×0,10 + 500×0,08 | 250,00 € | 300,00 € |
| Starter | 75 | 75 × 0,15 € | 11,25 € | 13,50 € |
| **TOTAL** | **2725** | - | **276,25 €** | **331,50 €** |


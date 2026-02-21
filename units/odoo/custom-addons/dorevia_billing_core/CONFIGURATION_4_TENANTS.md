# ⚙️ Configuration complète : 4 tenants (3 paliers + 1 montant fixe)

## 📋 Vue d'ensemble

Configuration de 4 tenants pour tester différents modèles de facturation :
- **3 tenants avec paliers tarifaires** (Premium, Standard, Starter)
- **1 tenant avec montant fixe mensuel** (80 € HT)

---

## ✅ Étape 1 : Créer les 4 contacts (tenants)

### Tenant 1 - Premium
- Nom : `Client Premium Test`
- Référence (ref) : `tenant-premium-1`
- Email : `premium@example.com`

### Tenant 2 - Standard
- Nom : `Client Standard Test`
- Référence (ref) : `tenant-standard-1`
- Email : `standard@example.com`

### Tenant 3 - Starter
- Nom : `Client Starter Test`
- Référence (ref) : `tenant-starter-1`
- Email : `starter@example.com`

### Tenant 4 - Fixe
- Nom : `Client Fixe Mensuel`
- Référence (ref) : `tenant-fixe-1`
- Email : `fixe@example.com`

---

## ✅ Étape 2 : Créer les 4 contrats

### Contrat 1 - Premium
- Nom : `Contrat Premium 2026`
- Tenant : `Client Premium Test`
- Date début : `2026-01-01`
- Date fin : (vide)
- Actif : ✅
- Taux TVA (%) : `20,00`
- Exonéré de TVA : ❌

### Contrat 2 - Standard
- Nom : `Contrat Standard 2026`
- Tenant : `Client Standard Test`
- Date début : `2026-01-01`
- Date fin : (vide)
- Actif : ✅
- Taux TVA (%) : `20,00`
- Exonéré de TVA : ❌

### Contrat 3 - Starter
- Nom : `Contrat Starter 2026`
- Tenant : `Client Starter Test`
- Date début : `2026-01-01`
- Date fin : (vide)
- Actif : ✅
- Taux TVA (%) : `20,00`
- Exonéré de TVA : ❌

### Contrat 4 - Fixe
- Nom : `Contrat Fixe 80€ HT`
- Tenant : `Client Fixe Mensuel`
- Date début : `2026-01-01`
- Date fin : (vide)
- Actif : ✅
- Taux TVA (%) : `20,00`
- Exonéré de TVA : ❌

---

## ✅ Étape 3 : Configurer les règles tarifaires

### Contrat Premium - 3 paliers

**Règle 1** :
- Type : `Facture Client`
- Prix unitaire HT : `0,10`
- Paliers : De `0` → À `1000`
- Séquence : `10`

**Règle 2** :
- Type : `Facture Client`
- Prix unitaire HT : `0,08`
- Paliers : De `1000` → À `5000`
- Séquence : `20`

**Règle 3** :
- Type : `Facture Client`
- Prix unitaire HT : `0,05`
- Paliers : De `5000` → À (vide)
- Séquence : `30`

---

### Contrat Standard - 3 paliers

**Règle 1** :
- Type : `Facture Client`
- Prix unitaire HT : `0,12`
- Paliers : De `0` → À `500`
- Séquence : `10`

**Règle 2** :
- Type : `Facture Client`
- Prix unitaire HT : `0,10`
- Paliers : De `500` → À `2000`
- Séquence : `20`

**Règle 3** :
- Type : `Facture Client`
- Prix unitaire HT : `0,08`
- Paliers : De `2000` → À (vide)
- Séquence : `30`

---

### Contrat Starter - 3 paliers

**Règle 1** :
- Type : `Facture Client`
- Prix unitaire HT : `0,15`
- Paliers : De `0` → À `100`
- Séquence : `10`

**Règle 2** :
- Type : `Facture Client`
- Prix unitaire HT : `0,12`
- Paliers : De `100` → À `500`
- Séquence : `20`

**Règle 3** :
- Type : `Facture Client`
- Prix unitaire HT : `0,10`
- Paliers : De `500` → À (vide)
- Séquence : `30`

---

### Contrat Fixe - Montant fixe 80€ HT

**Règle unique** :
- Type : `Facture Client`
- Prix unitaire HT : `80,00`
- Paliers : De `0` → À `1` ⚠️ **Important : 1 pour montant fixe**
- Séquence : `10`

**Note** : Le volume dans le constat sera toujours `1` pour déclencher le calcul du montant fixe.

---

## 🧪 Exécution des tests

```bash
cd /opt/dorevia-plateform/units/odoo/custom-addons/dorevia_billing_core
./test_4_tenants.sh
```

---

## 📊 Résultats attendus

| Tenant | Modèle | Volume | Montant HT | Montant TTC |
|--------|--------|--------|------------|-------------|
| Premium | Paliers | 150 | 15,00 € | 18,00 € |
| Standard | Paliers | 2500 | 250,00 € | 300,00 € |
| Starter | Paliers | 75 | 11,25 € | 13,50 € |
| Fixe | Montant fixe | 1 | 80,00 € | 96,00 € |
| **TOTAL** | - | **2726** | **356,25 €** | **427,50 €** |

---

## ✅ Vérifications

1. **Dorevia Billing → Constats** :
   - 4 constats créés avec statut `validated` ou `invoiced`

2. **Comptabilité → Factures** :
   - 4 factures générées automatiquement
   - Montants correspondant au tableau ci-dessus

3. **Détails de la facture Fixe** :
   - Libellé : `"Factures clients - Période 2026-01 (1 documents)"`
   - Quantité : 1
   - Prix unitaire : 80,00 €
   - Total HT : 80,00 €
   - Total TTC : 96,00 €

---

## 💡 Points clés du montant fixe

- **Volume = 1** dans le constat (peu importe le volume réel)
- **Règle avec `tier_to = 1`** pour limiter à 1 document
- **Prix unitaire = 80,00 €** pour obtenir le montant fixe
- Le volume réel peut être enregistré pour statistiques, mais seul le premier document déclenche la facturation


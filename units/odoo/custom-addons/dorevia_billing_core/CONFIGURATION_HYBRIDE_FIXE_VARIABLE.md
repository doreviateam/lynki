# 💰 Configuration : Modèle hybride (Montant fixe + Part variable)

## Cas d'usage

Un client accepte un modèle de facturation hybride :
- **Part fixe** : 80 € HT par mois (quel que soit le volume)
- **Part variable** : Paliers tarifaires selon le volume de documents

### Exemple de calcul

Avec **150 factures clients** :
- Part fixe : **80,00 € HT**
- Part variable : 150 × 0,10 € = **15,00 € HT**
- **Total HT** : 80,00 + 15,00 = **95,00 € HT**
- **Total TTC** : 95,00 × 1,20 = **114,00 € TTC**

---

## ⚙️ Configuration dans Odoo

### Étape 1 : Créer le tenant

1. **Contacts → Créer**
   - Nom : `Client Hybride Fixe+Variable`
   - Référence (ref) : `tenant-hybride-1`
   - Email : `hybride@example.com`
   - Enregistrer

---

### Étape 2 : Créer le contrat

1. **Dorevia Billing → Contrats → Créer**
   - Nom : `Contrat Hybride 80€ + Paliers`
   - Tenant : `Client Hybride Fixe+Variable`
   - Date début : `2026-01-01`
   - Date fin : (vide)
   - Actif : ✅
   - Taux TVA (%) : `20,00`
   - Exonéré de TVA : ❌

---

### Étape 3 : Configurer les règles tarifaires

**Onglet "Règles tarifaires"** → Cliquez sur "Ajouter une ligne" **4 fois** :

#### Règle 1 : Montant fixe (80 € HT)

- Type de document : `Facture Client`
- Prix unitaire HT : `80,00`
- Devise : `EUR`
- **Montant fixe** : ✅ ⚠️ **Cocher cette case**
- Paliers : (masqués car montant fixe)
- Remise (%) : `0`
- Séquence : `5` ⚠️ **Mettre une séquence faible pour appliquer en premier**
- Actif : ✅

#### Règle 2 : Palier variable 1 (0-1000)

- Type de document : `Facture Client`
- Prix unitaire HT : `0,10`
- Devise : `EUR`
- **Montant fixe** : ❌
- Paliers : De : `0`
- Paliers : À : `1000`
- Remise (%) : `0`
- Séquence : `10`
- Actif : ✅

#### Règle 3 : Palier variable 2 (1000-5000)

- Type de document : `Facture Client`
- Prix unitaire HT : `0,08`
- Devise : `EUR`
- **Montant fixe** : ❌
- Paliers : De : `1000`
- Paliers : À : `5000`
- Remise (%) : `0`
- Séquence : `20`
- Actif : ✅

#### Règle 4 : Palier variable 3 (5000+)

- Type de document : `Facture Client`
- Prix unitaire HT : `0,05`
- Devise : `EUR`
- **Montant fixe** : ❌
- Paliers : De : `5000`
- Paliers : À : (vide)
- Remise (%) : `0`
- Séquence : `30`
- Actif : ✅

**Enregistrer le contrat**

---

## 🧮 Comment ça fonctionne

### Principe

Le système applique les règles dans l'ordre de séquence :

1. **Règles fixes** (`is_fixed_fee = True`) :
   - S'ajoutent au total **sans consommer de volume**
   - Peuvent être appliquées en premier (séquence faible)

2. **Règles variables** (`is_fixed_fee = False`) :
   - Appliquées par paliers selon le volume réel
   - Consomment le volume progressivement

### Calcul détaillé

Avec **150 factures clients** :

1. **Règle fixe** (séquence 5) :
   - Montant : 80,00 € HT
   - Volume consommé : 0 (le fixe ne consomme pas de volume)

2. **Règle variable 1** (séquence 10, palier 0-1000) :
   - Volume disponible : 150
   - Volume dans le palier : 150 (de 0 à 150)
   - Montant : 150 × 0,10 € = 15,00 € HT
   - Volume consommé : 150

3. **Règles suivantes** :
   - Ne s'appliquent pas (volume déjà consommé)

**Total HT** : 80,00 + 15,00 = **95,00 € HT**

---

## 🧪 Test avec curl

```bash
curl -X POST https://odoo.lab.core.doreviateam.com/api/v1/constats \
  -H "Authorization: api_key sk_test_abc123xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "constat_id": "55555555-5555-4555-8555-555555555555",
    "tenant": "tenant-hybride-1",
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
      "jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test",
      "ledger_hash": "hybride-hash-005",
      "documents_count": 150
    }
  }'
```

### Résultat attendu

- **Part fixe** : 80,00 € HT
- **Part variable** : 15,00 € HT (150 × 0,10 €)
- **Total HT** : 95,00 €
- **Total TTC** : 114,00 € (avec TVA 20%)

---

## 📊 Exemples de calculs

### Exemple 1 : Volume faible (150 factures)

- Part fixe : 80,00 € HT
- Part variable : 150 × 0,10 € = 15,00 € HT
- **Total HT** : 95,00 €
- **Total TTC** : 114,00 €

### Exemple 2 : Volume moyen (2500 factures)

- Part fixe : 80,00 € HT
- Part variable :
  - Tranche 0-1000 : 1000 × 0,10 € = 100,00 €
  - Tranche 1000-2500 : 1500 × 0,08 € = 120,00 €
  - Total variable : 220,00 € HT
- **Total HT** : 80,00 + 220,00 = 300,00 €
- **Total TTC** : 360,00 €

### Exemple 3 : Volume élevé (6000 factures)

- Part fixe : 80,00 € HT
- Part variable :
  - Tranche 0-1000 : 1000 × 0,10 € = 100,00 €
  - Tranche 1000-5000 : 4000 × 0,08 € = 320,00 €
  - Tranche 5000-6000 : 1000 × 0,05 € = 50,00 €
  - Total variable : 470,00 € HT
- **Total HT** : 80,00 + 470,00 = 550,00 €
- **Total TTC** : 660,00 €

---

## 📊 Facture générée

**Ligne de facture** :
- Libellé : `"Factures clients - Période 2026-01 (150 documents)"`
- Quantité : 150
- Prix unitaire : 95,00 € / 150 = 0,6333... € (arrondi)
- TVA : 20%
- **Total HT** : 95,00 €
- **Total TTC** : 114,00 €

**Note** : Le prix unitaire affiché est calculé comme `total_ht / volume`, ce qui donne un prix moyen. Les détails du calcul (fixe + variable) sont visibles dans le constat.

---

## ✅ Vérifications

1. **Dorevia Billing → Constats** :
   - Constat créé avec `state = 'validated'` ou `'invoiced'`
   - Montant calculé : 95,00 € HT (pour 150 factures)

2. **Comptabilité → Factures** :
   - Facture générée automatiquement
   - Montant TTC : 114,00 €

3. **Détails du constat** :
   - Volume : 150 factures
   - Montant HT : 95,00 €
   - Détail : 80,00 € (fixe) + 15,00 € (variable)

---

## 💡 Points clés

1. **Séquence importante** : Les règles fixes doivent avoir une séquence faible (ex: 5) pour être appliquées en premier
2. **Montant fixe ne consomme pas de volume** : Le volume reste disponible pour les règles variables
3. **Flexibilité** : Vous pouvez combiner plusieurs montants fixes et plusieurs paliers variables
4. **Remises** : Les remises s'appliquent aussi bien aux montants fixes qu'aux montants variables


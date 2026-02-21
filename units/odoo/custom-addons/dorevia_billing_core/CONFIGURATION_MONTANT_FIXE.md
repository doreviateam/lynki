# 💰 Configuration : Contrat avec montant fixe mensuel

## Cas d'usage

Un client accepte un **montant fixe de 80 € HT par mois**, indépendamment du volume de documents.

---

## ⚙️ Configuration dans Odoo

### Étape 1 : Créer le tenant

1. **Contacts → Créer**
   - Nom : `Client Fixe Mensuel`
   - Référence (ref) : `tenant-fixe-1`
   - Email : `fixe@example.com`
   - Enregistrer

---

### Étape 2 : Créer le contrat

1. **Dorevia Billing → Contrats → Créer**
   - Nom : `Contrat Fixe 80€ HT`
   - Tenant : `Client Fixe Mensuel`
   - Date début : `2026-01-01`
   - Date fin : (vide)
   - Actif : ✅
   - Taux TVA (%) : `20,00`
   - Exonéré de TVA : ❌

---

### Étape 3 : Configurer la règle tarifaire fixe

**Onglet "Règles tarifaires"** → Cliquez sur "Ajouter une ligne" :

**Règle unique** :
- Type de document : `Facture Client`
- Prix unitaire HT : `80,00`
- Devise : `EUR`
- Paliers : De : `0`
- Paliers : À : `1` ⚠️ **Important : mettre 1 pour un montant fixe**
- Remise (%) : `0`
- Séquence : `10`
- Actif : ✅

**Enregistrer le contrat**

---

## 🧮 Comment ça fonctionne

### Principe

Pour obtenir un **montant fixe de 80 € HT**, on utilise une règle avec :
- `tier_from = 0`
- `tier_to = 1`
- `price_unit = 80,00 €`

### Calcul

Quand le constat arrive avec **volume = 1** :
- Volume dans le palier : `min(1, 1) - max(0, 0) = 1`
- Montant HT : `1 × 80,00 € = 80,00 €`
- Montant TTC : `80,00 € × 1,20 = 96,00 €`

**Le volume réel n'a pas d'importance** : on envoie toujours `volume = 1` dans le constat pour déclencher le calcul du montant fixe.

---

## 🧪 Test avec curl

```bash
curl -X POST https://odoo.lab.core.doreviateam.com/api/v1/constats \
  -H "Authorization: api_key sk_test_abc123xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "constat_id": "44444444-4444-4444-8444-444444444444",
    "tenant": "tenant-fixe-1",
    "period": "2026-01",
    "generated_at": "2026-02-01T00:05:23Z",
    "vault_id": "vault-test",
    "volumes": {
      "out_invoice": 1,
      "in_invoice": 0,
      "out_refund": 0,
      "in_refund": 0
    },
    "compliance": {
      "compliant": 0,
      "non_compliant_2026": 0,
      "out_of_scope": 0
    },
    "proofs": {
      "jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test",
      "ledger_hash": "fixe-hash-004",
      "documents_count": 1
    }
  }'
```

### Résultat attendu

- **Montant HT** : 80,00 €
- **Montant TTC** : 96,00 € (avec TVA 20%)

---

## 📊 Facture générée

**Ligne de facture** :
- Libellé : `"Factures clients - Période 2026-01 (1 documents)"`
- Quantité : 1
- Prix unitaire : 80,00 €
- TVA : 20%
- **Total HT** : 80,00 €
- **Total TTC** : 96,00 €

---

## 🔄 Alternative : Montant fixe avec volume réel

Si vous voulez quand même enregistrer le volume réel de documents mais facturer un montant fixe, vous pouvez :

1. **Envoyer le volume réel** dans le constat (ex: 500 documents)
2. **Configurer la règle** avec :
   - `tier_from = 0`
   - `tier_to = 1`
   - `price_unit = 80,00 €`

Le système calculera toujours **1 × 80,00 € = 80,00 €**, peu importe le volume réel.

**Note** : Le volume réel sera enregistré dans le constat pour statistiques, mais seul le premier document déclenchera la facturation du montant fixe.

---

## 💡 Variante : Montant fixe avec seuil minimum

Si vous voulez un montant fixe de 80 € **mais seulement si le volume dépasse un seuil** (ex: 100 documents) :

**Règle 1** (volume < 100) :
- `tier_from = 0`
- `tier_to = 100`
- `price_unit = 0,00 €` (gratuit en dessous du seuil)

**Règle 2** (volume >= 100) :
- `tier_from = 100`
- `tier_to = 1` (ou None)
- `price_unit = 80,00 €` (montant fixe)

Avec volume = 150 :
- Tranche 0-100 : 100 × 0,00 € = 0,00 €
- Tranche 100-150 : 1 × 80,00 € = 80,00 €
- **Total HT** : 80,00 €

---

## ✅ Vérifications

1. **Dorevia Billing → Constats** :
   - Constat créé avec `state = 'validated'` ou `'invoiced'`
   - Montant calculé : 80,00 € HT

2. **Comptabilité → Factures** :
   - Facture générée automatiquement
   - Montant TTC : 96,00 €


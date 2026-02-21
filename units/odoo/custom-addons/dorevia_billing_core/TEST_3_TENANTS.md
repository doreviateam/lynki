# 🧪 Test avec 3 tenants

## Objectif

Tester le système de facturation MRR avec 3 tenants différents, chacun avec :
- Un contrat actif
- Des règles tarifaires configurées
- Un constat mensuel avec des volumes différents

---

## 📋 Configuration dans Odoo

### Étape 1 : Créer les 3 tenants (Contacts)

#### Tenant 1 : Client Premium
- **Nom** : `Client Premium Test`
- **Référence (ref)** : `tenant-premium-1`
- **Email** : `premium@example.com`

#### Tenant 2 : Client Standard
- **Nom** : `Client Standard Test`
- **Référence (ref)** : `tenant-standard-1`
- **Email** : `standard@example.com`

#### Tenant 3 : Client Starter
- **Nom** : `Client Starter Test`
- **Référence (ref)** : `tenant-starter-1`
- **Email** : `starter@example.com`

---

### Étape 2 : Créer les 3 contrats

#### Contrat 1 : Premium
- **Nom** : `Contrat Premium 2026`
- **Tenant** : `Client Premium Test`
- **Date début** : `2026-01-01`
- **Date fin** : (vide)
- **Actif** : ✅
- **Taux TVA** : `20,00%`
- **Exonéré TVA** : ❌

#### Contrat 2 : Standard
- **Nom** : `Contrat Standard 2026`
- **Tenant** : `Client Standard Test`
- **Date début** : `2026-01-01`
- **Date fin** : (vide)
- **Actif** : ✅
- **Taux TVA** : `20,00%`
- **Exonéré TVA** : ❌

#### Contrat 3 : Starter
- **Nom** : `Contrat Starter 2026`
- **Tenant** : `Client Starter Test`
- **Date début** : `2026-01-01`
- **Date fin** : (vide)
- **Actif** : ✅
- **Taux TVA** : `20,00%`
- **Exonéré TVA** : ❌

---

### Étape 3 : Configurer les règles tarifaires

#### Contrat Premium - Règles pour `out_invoice`
1. **Palier 1** : 0-1000 → `0,10 € HT`
2. **Palier 2** : 1000-5000 → `0,08 € HT`
3. **Palier 3** : 5000+ → `0,05 € HT`

#### Contrat Standard - Règles pour `out_invoice`
1. **Palier 1** : 0-500 → `0,12 € HT`
2. **Palier 2** : 500-2000 → `0,10 € HT`
3. **Palier 3** : 2000+ → `0,08 € HT`

#### Contrat Starter - Règles pour `out_invoice`
1. **Palier 1** : 0-100 → `0,15 € HT`
2. **Palier 2** : 100-500 → `0,12 € HT`
3. **Palier 3** : 500+ → `0,10 € HT`

---

## 🧪 Scénarios de test

### Test 1 : Tenant Premium - Volume moyen (150 factures)

**Calcul attendu** :
- Volume : 150
- Palier : 0-1000 → 0,10 € HT
- Montant HT : 150 × 0,10 € = **15,00 € HT**
- Montant TTC : 15,00 € × 1,20 = **18,00 € TTC**

### Test 2 : Tenant Standard - Volume élevé (2500 factures)

**Calcul attendu** :
- Volume : 2500
- Palier 1 : 0-500 → 500 × 0,12 € = 60,00 €
- Palier 2 : 500-2000 → 1500 × 0,10 € = 150,00 €
- Palier 3 : 2000-2500 → 500 × 0,08 € = 40,00 €
- Montant HT : 60,00 + 150,00 + 40,00 = **250,00 € HT**
- Montant TTC : 250,00 € × 1,20 = **300,00 € TTC**

### Test 3 : Tenant Starter - Volume faible (75 factures)

**Calcul attendu** :
- Volume : 75
- Palier : 0-100 → 0,15 € HT
- Montant HT : 75 × 0,15 € = **11,25 € HT**
- Montant TTC : 11,25 € × 1,20 = **13,50 € TTC**

---

## 🚀 Commandes curl de test

### Test 1 : Tenant Premium (150 factures)

```bash
curl -X POST https://odoo.lab.core.doreviateam.com/api/v1/constats \
  -H "Authorization: api_key sk_test_abc123xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "constat_id": "11111111-1111-4111-8111-111111111111",
    "tenant": "tenant-premium-1",
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
      "ledger_hash": "premium-hash-001",
      "documents_count": 150
    }
  }'
```

### Test 2 : Tenant Standard (2500 factures)

```bash
curl -X POST https://odoo.lab.core.doreviateam.com/api/v1/constats \
  -H "Authorization: api_key sk_test_abc123xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "constat_id": "22222222-2222-4222-8222-222222222222",
    "tenant": "tenant-standard-1",
    "period": "2026-01",
    "generated_at": "2026-02-01T00:05:23Z",
    "vault_id": "vault-test",
    "volumes": {
      "out_invoice": 2500,
      "in_invoice": 0,
      "out_refund": 0,
      "in_refund": 0
    },
    "compliance": {
      "compliant": 2000,
      "non_compliant_2026": 400,
      "out_of_scope": 100
    },
    "proofs": {
      "jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test",
      "ledger_hash": "standard-hash-002",
      "documents_count": 2500
    }
  }'
```

### Test 3 : Tenant Starter (75 factures)

```bash
curl -X POST https://odoo.lab.core.doreviateam.com/api/v1/constats \
  -H "Authorization: api_key sk_test_abc123xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "constat_id": "33333333-3333-4333-8333-333333333333",
    "tenant": "tenant-starter-1",
    "period": "2026-01",
    "generated_at": "2026-02-01T00:05:23Z",
    "vault_id": "vault-test",
    "volumes": {
      "out_invoice": 75,
      "in_invoice": 0,
      "out_refund": 0,
      "in_refund": 0
    },
    "compliance": {
      "compliant": 60,
      "non_compliant_2026": 10,
      "out_of_scope": 5
    },
    "proofs": {
      "jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test",
      "ledger_hash": "starter-hash-003",
      "documents_count": 75
    }
  }'
```

---

## ✅ Vérifications après les tests

1. **Dans Odoo → Dorevia Billing → Constats** :
   - Vérifier que les 3 constats sont présents
   - Vérifier les statuts (`validated` ou `invoiced`)
   - Vérifier les montants calculés

2. **Dans Odoo → Comptabilité → Factures** :
   - Vérifier que 3 factures ont été générées
   - Vérifier les montants :
     - Premium : 18,00 € TTC
     - Standard : 300,00 € TTC
     - Starter : 13,50 € TTC

3. **Vérifier les lignes de facture** :
   - Chaque facture doit avoir une ligne avec le bon volume
   - Prix unitaire = montant HT / volume

---

## 📊 Résumé des montants attendus

| Tenant | Volume | Montant HT | Montant TTC |
|--------|--------|------------|-------------|
| Premium | 150 | 15,00 € | 18,00 € |
| Standard | 2500 | 250,00 € | 300,00 € |
| Starter | 75 | 11,25 € | 13,50 € |
| **TOTAL** | **2725** | **276,25 €** | **331,50 €** |


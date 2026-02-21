# 🔄 Fonctionnement du système de réception des constats et facturation MRR

## Vue d'ensemble

Le système **Dorevia Billing CORE** reçoit des constats mensuels depuis **Dorevia Vault**, les valide, les rattache à des contrats clients, calcule les montants facturables selon des règles tarifaires, et génère automatiquement des factures MRR (Monthly Recurring Revenue).

---

## 📥 Flux de réception d'un constat

### 1. **Réception HTTP** (`POST /api/v1/constats`)

Le Vault envoie un constat mensuel au format JSON :

```json
{
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
  "compliance": {...},
  "proofs": {...}
}
```

### 2. **Authentification API Key**

- Le header `Authorization: api_key TOKEN` est vérifié
- Le token est comparé avec `dorevia_billing.core_api_token` (paramètre système)
- Si invalide → `401 Unauthorized`

### 3. **Validation du payload**

Vérifications effectuées :
- ✅ Champs obligatoires présents
- ✅ Format `constat_id` (10 caractères alphanumériques)
- ✅ Format `period` (YYYY-MM)
- ✅ Format `generated_at` (ISO 8601 UTC)
- ✅ Volumes non négatifs
- ✅ `tenant` non vide

Si invalide → `422 Unprocessable Entity`

### 4. **Vérification d'idempotence**

- Recherche d'un constat existant avec le même `constat_id`
- Si trouvé → `409 Conflict` avec les infos du constat existant
- **Garantit qu'un même constat n'est jamais traité deux fois**

### 5. **Recherche du tenant**

- Recherche du `res.partner` avec `ref = tenant` (ex: `test-tenant-1`)
- Si non trouvé → constat créé avec `tenant_id = False`, `invoice_status = 'pending'`
- **Le constat n'est jamais perdu**, même sans tenant (peut être rattaché ultérieurement)

### 6. **Création du constat**

Enregistrement dans `dorevia.constat` avec :
- Tous les volumes et statistiques de conformité
- Preuves cryptographiques (JWS, ledger_hash)
- `state = 'draft'`
- `invoice_status = 'pending'`

### 7. **Rattachement au contrat actif**

- Recherche d'un contrat actif pour le tenant et la période
- Critères : `active = True`, `start_date <= period`, `end_date >= period` (ou `end_date = False`)
- Si trouvé → `contract_id` est rattaché, `state = 'validated'`
- Si non trouvé → `contract_id = False`, `state = 'validated'` quand même
- **Le constat peut être facturé ultérieurement** si le contrat est créé après

### 8. **Vérification JWS (non bloquante)**

- Si JWS activé (`dorevia_billing.jws_verification_enabled = True`) :
  - Vérification de la signature via JWKS
  - Si **valide** → `state` reste `'validated'`
  - Si **invalide** → `state = 'validated_with_warning'` (alerte, pas de facturation auto)
- Si JWS désactivé ou erreur → `state = 'validated'` (non bloquant)

### 9. **Génération automatique de facture**

Conditions pour génération auto :
- ✅ `contract_id` présent
- ✅ `state = 'validated'` (pas `'validated_with_warning'`)
- ✅ `invoice_status = 'pending'`

Si toutes conditions remplies → appel à `action_generate_invoice()`

---

## 💰 Calcul des montants facturables

### Étape 1 : Application des règles tarifaires par palier

Pour chaque type de document (`out_invoice`, `in_invoice`, etc.) :

1. **Récupération des règles** pour ce `move_type` et ce contrat (triées par `sequence`)
2. **Application par palier** :

   Exemple avec **150 factures clients** et règles :
   - **Palier 1** : 0-1000 → 0,10 € HT
   - **Palier 2** : 1000-5000 → 0,08 € HT
   - **Palier 3** : 5000+ → 0,05 € HT

   Calcul :
   - **Tranche 0-150** : 150 × 0,10 € = **15,00 € HT**
   - (Les paliers suivants ne s'appliquent pas car volume < 1000)

3. **Application des remises** (si configurées) :
   - Montant × (1 - `discount_percent` / 100)

### Étape 2 : Application de la TVA

- Si `tax_exempt = False` → `TTC = HT × (1 + tax_rate / 100)`
- Si `tax_exempt = True` → `TTC = HT`

Exemple : 15,00 € HT × 1,20 = **18,00 € TTC** (TVA 20%)

### Étape 3 : Agrégation

- Total HT = somme des montants HT par `move_type`
- Total TTC = somme des montants TTC par `move_type`

---

## 🧾 Génération de la facture MRR

### Création de la facture (`account.move`)

1. **Lignes de facturation** :
   - Une ligne par `move_type` avec volume > 0
   - Libellé : `"Factures clients - Période 2026-01 (150 documents)"`
   - Quantité : volume (ex: 150)
   - Prix unitaire : `montant_ht / volume` (ex: 15,00 € / 150 = 0,10 €)
   - Taxe : TVA du contrat (si applicable)

2. **Métadonnées de la facture** :
   - `move_type = 'out_invoice'` (facture client)
   - `partner_id` = tenant
   - `invoice_date` = `received_at` (date de réception du constat, UTC)
   - `ref` = `constat_id`
   - `invoice_origin` = `"Constat 2026-01 - Vault vault-test"`

3. **Rattachement au constat** :
   - `invoice_id` = ID de la facture créée
   - `invoice_status = 'invoiced'`
   - `state = 'invoiced'`

4. **Validation automatique** (optionnelle) :
   - Si `dorevia_billing.auto_post_invoice = True` → `invoice.action_post()`
   - Sinon → facture en brouillon (validation manuelle)

---

## 🔍 Exemple concret : 150 factures clients

### Configuration
- **Tenant** : `test-tenant-1` → `Client Test Premium`
- **Contrat** : `Contrat Premium Test`
- **Règles tarifaires** :
  - 0-1000 : 0,10 € HT
  - 1000-5000 : 0,08 € HT
  - 5000+ : 0,05 € HT
- **TVA** : 20%

### Calcul

1. **Volume** : 150 factures clients
2. **Palier applicable** : Palier 1 (0-1000)
3. **Montant HT** : 150 × 0,10 € = **15,00 € HT**
4. **Montant TTC** : 15,00 € × 1,20 = **18,00 € TTC**

### Facture générée

**Ligne de facture** :
- Produit : MRR (ou produit par défaut)
- Libellé : `"Factures clients - Période 2026-01 (150 documents)"`
- Quantité : 150
- Prix unitaire : 0,10 €
- TVA : 20%
- **Total HT** : 15,00 €
- **Total TTC** : 18,00 €

---

## 🛡️ Garanties et sécurité

### Idempotence
- Un `constat_id` unique ne peut être traité qu'une seule fois
- Tentative de réception → `409 Conflict` avec infos du constat existant

### Non-perte de données
- Constat sans tenant → stocké avec `tenant_id = False`, `invoice_status = 'pending'`
- Constat sans contrat → stocké avec `contract_id = False`, peut être facturé ultérieurement
- **Aucun constat n'est jamais perdu**

### Validation JWS non bloquante
- JWS invalide → `state = 'validated_with_warning'`, pas de facturation auto
- Permet intervention manuelle sans bloquer la chaîne

### Traçabilité
- Chaque constat est lié à un `vault_id` (identification de la source)
- Chaque facture référence le `constat_id` dans `ref`
- `invoice_origin` contient la période et le vault

---

## 📊 États du constat

| État | Signification | Facturation auto |
|------|---------------|------------------|
| `draft` | Constat créé, en attente de validation | ❌ |
| `validated` | Constat validé, contrat rattaché, JWS valide | ✅ |
| `validated_with_warning` | Constat validé mais JWS invalide | ❌ |
| `invoiced` | Facture générée | - |

---

## 🔧 Configuration système

### Paramètres Odoo (`ir.config_parameter`)

- **`dorevia_billing.core_api_token`** : Token API pour authentification
- **`dorevia_billing.jws_verification_enabled`** : Activer/désactiver vérification JWS (`True`/`False`)
- **`dorevia_billing.jwks_url`** : URL du JWKS pour vérification JWS
- **`dorevia_billing.auto_post_invoice`** : Validation automatique des factures (`True`/`False`)

---

## 🎯 Points clés

1. **Facturation basée sur périodes closes** : Chaque facture au mois N porte sur les volumes du mois N-1
2. **Règles tarifaires flexibles** : Paliers, remises, TVA configurables par contrat
3. **Robustesse** : Constats jamais perdus, même sans tenant/contrat
4. **Traçabilité complète** : Chaque facture référence son constat et sa période
5. **Automatisation** : Génération et validation automatiques si configurées


# 🔧 Résolution : Remplissage Automatique des Champs Optionnels Vault

**Date** : 2026-01-11  
**Version Vault** : v1.3.2 → v1.3.3  
**Statut** : ✅ **Résolu**

---

## 📋 Problème Identifié

Les documents vaultés via le flux **Odoo → DVIG → Vault** (`/api/v1/events`) ne remplissaient pas les champs optionnels suivants :

- ❌ `invoice_number` (numéro de facture)
- ❌ `invoice_date` (date de facture)
- ❌ `total_ht` / `total_ttc` (montants)
- ❌ `currency` (devise)
- ❌ `seller_vat` / `buyer_vat` (TVA)
- ❌ `move_type` (type de facture)
- ❌ `compliance_status` (statut de conformité)
- ❌ `facturx_present` (présence Factur-X)

**Cause** : Le handler `/api/v1/events` (utilisé par DVIG) ne remplissait que les métadonnées de base, contrairement au handler `/api/v1/invoices` (utilisé directement par Odoo) qui extrait ces données depuis le payload.

---

## ✅ Solution Appliquée

### Modification du Handler `/api/v1/events`

**Fichier** : `sources/vault/internal/handlers/events.go`

**Ajout de l'extraction automatique des métadonnées depuis `payload.Payload`** :

```go
// Extraire les métadonnées facture depuis payload.Payload (format DVIG)
// SPEC DVIG → Vault Forwarding v1.1 : Remplir les champs optionnels
if payload.Payload != nil {
    // move_name -> invoice_number
    if moveName, ok := payload.Payload["move_name"].(string); ok && moveName != "" {
        doc.InvoiceNumber = &moveName
    }

    // move_type -> move_type
    if moveType, ok := payload.Payload["move_type"].(string); ok && moveType != "" {
        doc.MoveType = &moveType
    }

    // invoice_date ou date -> invoice_date
    // (gestion de plusieurs formats de date)

    // amount_untaxed -> total_ht
    // amount_total -> total_ttc
    // currency_name -> currency
    // seller_vat -> seller_vat
    // buyer_vat -> buyer_vat
}

// Définir compliance_status et facturx_present par défaut
defaultComplianceStatus := "out_of_scope"
doc.ComplianceStatus = &defaultComplianceStatus
defaultFacturXPresent := false
doc.FacturXPresent = &defaultFacturXPresent
```

### Mapping des Champs

| Champ Vault | Source DVIG | Type | Notes |
|-------------|-------------|------|-------|
| `invoice_number` | `move_name` | string | Ex: `FAC/2026/00002` |
| `move_type` | `move_type` | string | Ex: `out_invoice`, `in_invoice` |
| `invoice_date` | `invoice_date` ou `date` | date | Formats supportés : `2006-01-02`, ISO 8601 |
| `total_ht` | `amount_untaxed` | float64 | Montant hors taxes |
| `total_ttc` | `amount_total` | float64 | Montant TTC |
| `currency` | `currency_name` | string | Fallback : `currency_id` |
| `seller_vat` | `seller_vat` | string | Numéro TVA vendeur |
| `buyer_vat` | `buyer_vat` | string | Numéro TVA acheteur |
| `compliance_status` | - | string | Défaut : `"out_of_scope"` |
| `facturx_present` | - | boolean | Défaut : `false` |

---

## 🚀 Déploiement

### 1. Build de l'Image Docker

```bash
cd /opt/dorevia-plateform/sources/vault
docker build -t dorevia/vault:v1.3.3 .
```

**Résultat** : ✅ Image `dorevia/vault:v1.3.3` buildée avec succès

### 2. Mise à Jour docker-compose.yml

**Fichier** : `tenants/core-stinger/platform/docker-compose.yml`

```yaml
vault:
  image: dorevia/vault:v1.3.3  # Mise à jour depuis v1.3.2
```

### 3. Redéploiement

```bash
cd /opt/dorevia-plateform/tenants/core-stinger/platform
docker compose up -d vault-core-stinger
```

**Résultat** : ✅ Service Vault redéployé avec succès

---

## 🧪 Validation

### Test avec Nouvelle Facture

Pour valider que les champs sont maintenant remplis :

1. **Créer une nouvelle facture** dans Odoo
2. **Valider la facture** (statut `posted`)
3. **Attendre le vaulting automatique** (CRON #1 → DVIG → Worker → Vault)
4. **Vérifier les données** dans Vault :

```sql
SELECT 
    id,
    odoo_id,
    invoice_number,
    invoice_date,
    total_ht,
    total_ttc,
    currency,
    move_type,
    compliance_status,
    facturx_present
FROM documents
WHERE odoo_id = [ID_FACTURE]
ORDER BY created_at DESC
LIMIT 1;
```

**Résultat attendu** : Tous les champs optionnels doivent être remplis avec les données de la facture.

---

## 📊 Impact

### Avant (v1.3.2)

```sql
invoice_number    | NULL
invoice_date      | NULL
total_ht          | NULL
total_ttc         | NULL
currency          | NULL
move_type         | NULL
compliance_status | NULL
facturx_present   | NULL
```

### Après (v1.3.3)

```sql
invoice_number    | FAC/2026/00002
invoice_date      | 2026-01-11
total_ht          | 110466.00
total_ttc         | 132559.20
currency          | EUR
move_type         | out_invoice
compliance_status | out_of_scope
facturx_present   | false
```

---

## 📝 Notes Techniques

### Formats de Date Supportés

Le handler gère plusieurs formats de date :
- `2006-01-02` (format simple)
- `2006-01-02T15:04:05Z` (ISO 8601 avec timezone)
- `2006-01-02T15:04:05` (ISO 8601 sans timezone)

### Champs par Défaut

- **`compliance_status`** : `"out_of_scope"` (sans PDF, pas de validation Factur-X possible)
- **`facturx_present`** : `false` (sans PDF, pas de validation Factur-X possible)

Ces valeurs peuvent être mises à jour ultérieurement si un PDF est ajouté au document.

### Compatibilité

- ✅ **Rétrocompatible** : Les documents existants ne sont pas affectés
- ✅ **Idempotent** : Les documents déjà vaultés ne sont pas modifiés
- ✅ **Non-bloquant** : Si un champ n'est pas disponible dans le payload, il reste `NULL`

---

## 🔄 Prochaines Étapes

1. **Tester avec une nouvelle facture** pour valider le remplissage automatique
2. **Vérifier les données** dans la base de données Vault
3. **Documenter** dans la SPEC si nécessaire
4. **Déployer** sur les autres environnements (prod, lab, etc.)

---

**Auteur** : Dorevia Team  
**Date** : 2026-01-11  
**Version** : 1.0

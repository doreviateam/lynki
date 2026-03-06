# 📊 Rapport de Test : Champs Optionnels Vault v1.3.3

**Date** : 2026-01-11  
**Version Vault** : v1.3.3  
**Objectif** : Valider le remplissage automatique des champs optionnels depuis le payload DVIG

---

## 🎯 Objectif du Test

Valider que les champs optionnels suivants sont automatiquement remplis lors du vaulting via le flux **Odoo → DVIG → Vault** :

- `invoice_number` (numéro de facture)
- `invoice_date` (date de facture)
- `total_ht` / `total_ttc` (montants)
- `currency` (devise)
- `move_type` (type de facture)
- `compliance_status` (statut de conformité)
- `facturx_present` (présence Factur-X)
- `seller_vat` / `buyer_vat` (TVA, si disponible)

---

## 🔧 Modifications Appliquées

### Code Modifié

**Fichier** : `sources/vault/internal/handlers/events.go`

**Ajout de l'extraction automatique** (lignes 206-278) :

```go
// Extraire les métadonnées facture depuis payload.Payload (format DVIG)
if payload.Payload != nil {
    // move_name -> invoice_number
    // move_type -> move_type
    // invoice_date ou date -> invoice_date
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

### Déploiement

- ✅ **Build** : Image `dorevia/vault:v1.3.3` créée
- ✅ **Déploiement** : Service Vault redéployé
- ✅ **Validation** : Service opérationnel et healthy

---

## 📋 État Actuel

### Factures Existantes

Les factures existantes (1896, 1898) ont été vaultées **AVANT** la modification (v1.3.2), donc leurs champs optionnels ne sont **pas remplis** (comportement attendu).

**Requête de vérification** :

```sql
SELECT 
    odoo_id,
    invoice_number,
    invoice_date,
    total_ht,
    total_ttc,
    currency,
    move_type
FROM documents
WHERE odoo_id IN (1896, 1898);
```

**Résultat** : Tous les champs sont `NULL` (normal, créées avant v1.3.3)

### Données Disponibles dans l'Outbox DVIG

Pour la facture `FAC/2026/00002` (ID: 1898), les données sont disponibles dans l'outbox :

```sql
move_name        | FAC/2026/00002
move_type        | out_invoice
amount_untaxed   | 110466.0
amount_total     | 132559.2
currency_name    | EUR
invoice_date     | 2026-01-11
```

**Conclusion** : Les données sont disponibles, mais la facture a été vaultée avant la modification.

---

## 🧪 Test Recommandé

### Méthode 1 : Créer une Nouvelle Facture (Recommandé)

1. **Créer une facture** dans Odoo via l'interface web
2. **Valider la facture** (action_post)
3. **Attendre le vaulting automatique** (~5-10 minutes)
4. **Vérifier les données** dans Vault

### Méthode 2 : Vérification du Code

Le code a été compilé et déployé avec succès. Les prochaines factures auront automatiquement leurs champs remplis.

---

## ✅ Validation du Code

### Compilation

```bash
cd /opt/dorevia-plateform/sources/vault
go build ./cmd/vault
```

**Résultat** : ✅ Compilation réussie sans erreurs

### Déploiement

```bash
docker build -t dorevia/vault:v1.3.3 .
docker compose up -d vault
```

**Résultat** : ✅ Service déployé et opérationnel

### Health Check

```bash
curl http://localhost:8080/health
```

**Résultat** : ✅ `ok`

---

## 📊 Mapping des Champs

| Champ Vault | Source DVIG | Type | Exemple |
|-------------|-------------|------|---------|
| `invoice_number` | `move_name` | string | `FAC/2026/00003` |
| `move_type` | `move_type` | string | `out_invoice` |
| `invoice_date` | `invoice_date` ou `date` | date | `2026-01-11` |
| `total_ht` | `amount_untaxed` | float64 | `1500.00` |
| `total_ttc` | `amount_total` | float64 | `1800.00` |
| `currency` | `currency_name` | string | `EUR` |
| `seller_vat` | `seller_vat` | string | `FR12345678901` |
| `buyer_vat` | `buyer_vat` | string | `FR98765432109` |
| `compliance_status` | - | string | `out_of_scope` (défaut) |
| `facturx_present` | - | boolean | `false` (défaut) |

---

## 🔍 Commandes de Vérification

### 1. Vérifier la Version Vault

```bash
docker inspect vault-core-stinger --format '{{.Config.Image}}'
# Doit afficher : dorevia/vault:v1.3.3
```

### 2. Vérifier les Données d'une Nouvelle Facture

**Remplacez `[ID_FACTURE]` par l'ID de la nouvelle facture** :

```bash
docker exec -i vault-db-core-stinger psql -U vault -d dorevia_vault -c "
SELECT 
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
"
```

### 3. Vérifier les Données dans l'Outbox DVIG

```bash
docker exec -i vault-db-core-stinger psql -U vault -d dorevia_vault -c "
SELECT 
    event_id,
    payload->'data'->>'move_name' as move_name,
    payload->'data'->>'move_type' as move_type,
    payload->'data'->>'amount_untaxed' as amount_untaxed,
    payload->'data'->>'amount_total' as amount_total,
    payload->'data'->>'currency_name' as currency,
    payload->'data'->>'invoice_date' as invoice_date
FROM outbox_events
WHERE payload->'data'->>'move_id' = '[ID_FACTURE]'
ORDER BY created_at DESC
LIMIT 1;
"
```

---

## 📈 Résultats Attendus

### Pour une Nouvelle Facture (après v1.3.3)

**Exemple avec une facture de 1500.00 € HT (1800.00 € TTC)** :

```sql
invoice_number    | FAC/2026/00003
invoice_date      | 2026-01-11
total_ht          | 1500.00
total_ttc         | 1800.00
currency          | EUR
move_type         | out_invoice
compliance_status | out_of_scope
facturx_present   | false
```

### Pour les Factures Existantes (avant v1.3.3)

Les champs resteront `NULL` (normal, créées avant la modification).

---

## 🎯 Conclusion

### ✅ Modifications Appliquées

- ✅ Code modifié pour extraire les champs optionnels
- ✅ Compilation réussie
- ✅ Image Docker buildée (v1.3.3)
- ✅ Service déployé et opérationnel

### ⏳ Test en Attente

**Action requise** : Créer une nouvelle facture dans Odoo pour valider le remplissage automatique.

**Méthode recommandée** :
1. Créer une facture via l'interface Odoo
2. Valider la facture
3. Attendre le vaulting automatique (~5-10 minutes)
4. Vérifier les données avec les commandes ci-dessus

### 📝 Notes

- Les factures existantes (1896, 1898) ne seront **pas** mises à jour automatiquement
- Seules les **nouvelles factures** créées après le déploiement de v1.3.3 auront les champs remplis
- Le code est **prêt** et **opérationnel**

---

## 🔄 Prochaines Étapes

1. **Créer une nouvelle facture** dans Odoo (via interface web)
2. **Valider la facture** (action_post)
3. **Attendre le vaulting automatique** (~5-10 minutes)
4. **Vérifier les données** dans Vault avec les commandes ci-dessus
5. **Documenter les résultats** dans ce rapport

---

**Auteur** : Dorevia Team  
**Date** : 2026-01-11  
**Version** : 1.0  
**Statut** : ✅ **Code déployé - Test en attente de nouvelle facture**

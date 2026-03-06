# 🧪 Script de Test : Champs Optionnels Vault

**Date** : 2026-01-11  
**Version Vault** : v1.3.3

---

## 📋 Instructions de Test

### Option 1 : Créer une Nouvelle Facture dans Odoo (Recommandé)

1. **Créer une facture** dans Odoo via l'interface web
2. **Valider la facture** (action_post)
3. **Attendre le vaulting automatique** (~5-10 minutes)
4. **Vérifier les données** avec les commandes ci-dessous

### Option 2 : Vérifier les Données Disponibles

Les données sont disponibles dans l'outbox DVIG. Pour la facture `FAC/2026/00002` (ID: 1898) :

```sql
-- Données disponibles dans l'outbox
move_name        | FAC/2026/00002
move_type        | out_invoice
amount_untaxed   | 110466.0
amount_total     | 132559.2
currency_name    | EUR
invoice_date     | 2026-01-11
```

**Note** : Cette facture a été vaultée AVANT la modification (v1.3.2), donc les champs ne sont pas remplis dans Vault.

---

## 🔍 Commandes de Vérification

### 1. Vérifier la Version Vault

```bash
docker inspect vault-core-stinger --format '{{.Config.Image}}'
# Doit afficher : dorevia/vault:v1.3.3
```

### 2. Vérifier les Données d'une Nouvelle Facture

**Remplacez `[ID_FACTURE]` par l'ID de la nouvelle facture créée** :

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
    facturx_present,
    seller_vat,
    buyer_vat
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

## ✅ Résultat Attendu

### Pour une Nouvelle Facture (après v1.3.3)

Tous les champs doivent être remplis :

```
invoice_number    | FAC/2026/00003  (ou suivant)
invoice_date      | 2026-01-11
total_ht          | [montant HT]
total_ttc         | [montant TTC]
currency          | EUR
move_type         | out_invoice
compliance_status | out_of_scope
facturx_present   | false
```

### Pour les Factures Existantes (avant v1.3.3)

Les champs resteront NULL (normal, créées avant la modification).

---

## 🚀 Test Rapide

Pour tester immédiatement sans créer de nouvelle facture, vous pouvez :

1. **Vérifier que le code compile** : ✅ Déjà fait
2. **Vérifier que Vault v1.3.3 est déployé** : ✅ Déjà fait
3. **Créer une nouvelle facture** : À faire dans Odoo
4. **Vérifier les données** : Utiliser les commandes ci-dessus

---

**Note** : Les factures existantes (1896, 1898) ne seront pas mises à jour automatiquement. Seules les nouvelles factures créées après le déploiement de v1.3.3 auront les champs remplis.

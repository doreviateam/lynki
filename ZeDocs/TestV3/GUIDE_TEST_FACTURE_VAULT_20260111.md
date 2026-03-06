# 🧪 Guide de Test : Création d'une Facture et Vérification dans Vault

**Date** : 2026-01-11  
**Objectif** : Valider que les données de facturation sont bien enregistrées dans le Vault  
**Version Vault** : v1.3.3

---

## 📋 Résumé

Ce guide explique comment créer une nouvelle facture dans Odoo et vérifier que **toutes les données de facturation** sont bien enregistrées automatiquement dans le Vault.

---

## 🎯 Étape 1 : Créer une Facture dans Odoo

### Via l'Interface Web

1. **Se connecter à Odoo** : `https://odoo.stinger.sarl-la-platine.doreviateam.com`
2. **Aller dans** : `Facturation` → `Clients` → `Factures`
3. **Créer une nouvelle facture** :
   - Cliquer sur `Créer`
   - Sélectionner un **Client**
   - Ajouter une **ligne de facture** avec un produit
   - Définir un **montant** (ex: 1000€ HT)
   - Vérifier que la **TVA** est configurée
4. **Enregistrer** la facture
5. **Valider** la facture (bouton `Valider` ou `Comptabiliser`)

### Vérifier la Facture Créée

Une fois la facture validée, notez :
- **Numéro de facture** (ex: `FAC/2026/00003`)
- **ID Odoo** (visible dans l'URL, ex: `/customer-invoices/1900`)

---

## ⏳ Étape 2 : Attendre le Vaulting Automatique

Le vaulting se fait automatiquement via :
1. **CRON Odoo** : Envoie l'événement `invoice.posted` à DVIG
2. **Worker DVIG** : Traite l'événement et l'envoie à Vault
3. **Vault** : Stocke le document avec toutes les métadonnées

**Temps d'attente** : 5-10 minutes maximum

---

## 🔍 Étape 3 : Vérifier dans Vault

### Option A : Script Automatique

```bash
# Exécuter le script de vérification
/opt/dorevia-plateform/scripts/check_vault_invoice_data.sh
```

### Option B : Requête SQL Directe

```bash
# Se connecter à la base de données Vault
docker exec -it vault-db-core-stinger psql -U vault -d dorevia_vault

# Vérifier les documents récents
SELECT 
    id,
    invoice_number,
    move_type,
    invoice_date,
    total_ht,
    total_ttc,
    currency,
    seller_vat,
    buyer_vat,
    odoo_id,
    created_at
FROM documents
WHERE odoo_id = [ID_DE_LA_FACTURE]
ORDER BY created_at DESC;
```

### Option C : Vérifier par Numéro de Facture

```sql
SELECT 
    id,
    invoice_number,
    move_type,
    invoice_date,
    total_ht,
    total_ttc,
    currency,
    seller_vat,
    buyer_vat,
    odoo_id
FROM documents
WHERE invoice_number = 'FAC/2026/00003';
```

---

## ✅ Résultats Attendus

Pour une **nouvelle facture** vaultée avec Vault v1.3.3, **tous les champs suivants doivent être remplis** :

| Champ | Exemple | Statut Attendu |
|-------|---------|----------------|
| `invoice_number` | `FAC/2026/00003` | ✅ Rempli |
| `move_type` | `out_invoice` | ✅ Rempli |
| `invoice_date` | `2026-01-11` | ✅ Rempli |
| `total_ht` | `1000.00` | ✅ Rempli |
| `total_ttc` | `1200.00` | ✅ Rempli |
| `currency` | `EUR` | ✅ Rempli |
| `seller_vat` | `FR12345678901` | ✅ Rempli (si configuré) |
| `buyer_vat` | `FR98765432109` | ✅ Rempli (si configuré) |

---

## 🔍 Vérification dans Odoo

Vous pouvez aussi vérifier le statut de vaulting directement dans Odoo :

1. **Ouvrir la facture** dans Odoo
2. **Aller dans l'onglet** `Autres informations`
3. **Vérifier la section** `Dorevia Vault - Preuve`
4. **Le statut doit être** : `Vaulté` (badge vert)

---

## 🐛 Dépannage

### Si les champs ne sont pas remplis

1. **Vérifier la version Vault** :
   ```bash
   docker inspect vault-core-stinger --format='{{.Config.Image}}'
   ```
   Doit être : `dorevia/vault:v1.3.3`

2. **Vérifier les logs Vault** :
   ```bash
   docker logs vault-core-stinger --tail 50
   ```

3. **Vérifier les logs DVIG** :
   ```bash
   docker logs dvig-core-stinger --tail 50
   ```

4. **Vérifier le payload DVIG** :
   - Les données doivent être présentes dans `payload->'data'` de l'événement DVIG

### Si le vaulting ne se fait pas

1. **Vérifier le CRON Odoo** :
   - Aller dans `Paramètres` → `Technique` → `Actions planifiées`
   - Chercher `dorevia_vault_connector`
   - Vérifier que le CRON est actif et s'exécute

2. **Vérifier la configuration DVIG** dans Odoo :
   - `Paramètres` → `Technique` → `Paramètres système`
   - Vérifier `dorevia.dvig.url`, `dorevia.dvig.token`, `dorevia.dvig.source`

---

## 📊 Exemple de Requête Complète

```sql
-- Vérifier toutes les données d'une facture spécifique
SELECT 
    d.id as vault_id,
    d.invoice_number,
    d.move_type,
    d.invoice_date,
    d.total_ht,
    d.total_ttc,
    d.currency,
    d.seller_vat,
    d.buyer_vat,
    d.odoo_id,
    d.created_at as vaulted_at,
    d.sha256_hex,
    d.evidence_jws IS NOT NULL as has_jws,
    d.ledger_hash IS NOT NULL as has_ledger
FROM documents d
WHERE d.odoo_id = 1900  -- Remplacer par l'ID de votre facture
ORDER BY d.created_at DESC
LIMIT 1;
```

---

## 📝 Notes

- Les **factures existantes** (1896, 1898) n'ont pas les champs remplis car elles ont été vaultées **avant** l'implémentation de l'extraction automatique
- Seules les **nouvelles factures** créées après le déploiement de Vault v1.3.3 auront automatiquement tous les champs remplis
- Le vaulting est **automatique** : aucune action manuelle n'est nécessaire après la validation de la facture

---

## 🔗 Références

- **Code source** : `sources/vault/internal/handlers/events.go` (lignes 206-281)
- **Rapport de vérification** : `ZeDocs/TestV3/VERIFICATION_DONNEES_FACTURATION_VAULT_20260111.md`
- **Script de vérification** : `scripts/check_vault_invoice_data.sh`

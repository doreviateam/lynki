# 🧪 Guide de Test : Champs Optionnels Vault

**Date** : 2026-01-11  
**Version Vault** : v1.3.3  
**Objectif** : Valider le remplissage automatique des champs optionnels

---

## 📋 Prérequis

- ✅ Vault v1.3.3 déployé et opérationnel
- ✅ DVIG Worker fonctionnel
- ✅ CRON Odoo configuré
- ✅ Accès à Odoo (interface web)

---

## 🎯 Test : Création d'une Nouvelle Facture

### Étape 1 : Créer une Facture dans Odoo

1. **Se connecter à Odoo** : `https://odoo.stinger.sarl-la-platine.doreviateam.com`
2. **Aller dans** : Facturation → Clients → Factures
3. **Créer une nouvelle facture** :
   - Client : Choisir un client (ex: Doreviateam)
   - Date : 11/01/2026
   - Lignes de facture :
     - Produit : Choisir un produit
     - Quantité : 1
     - Prix unitaire : 1000.00 €
     - TVA : 20%
   - **Total attendu** : 1200.00 € TTC (1000.00 € HT)

### Étape 2 : Valider la Facture

1. **Cliquer sur "Valider"** (ou `action_post()`)
2. **Vérifier le statut** : La facture doit passer en "Comptabilisé"
3. **Vérifier le statut Vault** : Dans l'onglet "Autres informations", section "DOREVIA VAULT (SPEC V1.1)"
   - Statut initial : `À traiter` (todo)
   - Message : "En cours de traitement - Le document est en cours de vaulting automatique."

### Étape 3 : Attendre le Vaulting Automatique

**Temps d'attente** : ~5-10 minutes (CRON toutes les 5 minutes)

**Flux attendu** :
1. **CRON #1 Odoo** (toutes les 5 min) : Envoie vers DVIG → Statut `pending_proof`
2. **Worker DVIG** (toutes les 5 min) : Traite l'outbox → Envoie vers Vault
3. **Vault** : Crée le document avec tous les champs remplis
4. **CRON #2 Odoo** (toutes les 5 min) : Récupère la preuve → Statut `vaulted`

### Étape 4 : Vérifier les Données dans Vault

**Requête SQL** :

```sql
SELECT 
    id,
    odoo_id,
    invoice_number,      -- Doit être rempli (ex: FAC/2026/00003)
    invoice_date,        -- Doit être rempli (ex: 2026-01-11)
    total_ht,            -- Doit être rempli (ex: 1000.00)
    total_ttc,           -- Doit être rempli (ex: 1200.00)
    currency,            -- Doit être rempli (ex: EUR)
    move_type,           -- Doit être rempli (ex: out_invoice)
    compliance_status,   -- Doit être rempli (ex: out_of_scope)
    facturx_present,     -- Doit être rempli (ex: false)
    seller_vat,          -- Peut être rempli si disponible
    buyer_vat,           -- Peut être rempli si disponible
    created_at
FROM documents
WHERE odoo_id = [ID_NOUVELLE_FACTURE]
ORDER BY created_at DESC
LIMIT 1;
```

**Commandes** :

```bash
# 1. Trouver l'ID de la nouvelle facture dans Odoo (depuis l'URL ou l'interface)

# 2. Vérifier les données dans Vault
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

### Étape 5 : Vérifier dans l'Interface Odoo

1. **Ouvrir la facture** dans Odoo
2. **Aller dans l'onglet "Autres informations"**
3. **Section "DOREVIA VAULT (SPEC V1.1)"** :
   - ✅ Statut : `Vaulté` (vert)
   - ✅ Message : "Document vaulté - Le document a été vaulté avec succès."
   - ✅ Vault ID : UUID du document
   - ✅ Hash SHA256 : Hash du document

---

## ✅ Critères de Succès

### Champs Obligatoires (toujours remplis)

- ✅ `id` : UUID Vault
- ✅ `odoo_id` : ID Odoo de la facture
- ✅ `odoo_model` : `account.move`
- ✅ `source` : `odoo`
- ✅ `tenant` : `sarl-la-platine`
- ✅ `sha256_hex` : Hash SHA256
- ✅ `evidence_jws` : JWS (si activé)
- ✅ `ledger_hash` : Hash ledger (si activé)

### Champs Optionnels (maintenant remplis automatiquement)

- ✅ `invoice_number` : Numéro de facture (ex: `FAC/2026/00003`)
- ✅ `invoice_date` : Date de facture (ex: `2026-01-11`)
- ✅ `total_ht` : Montant HT (ex: `1000.00`)
- ✅ `total_ttc` : Montant TTC (ex: `1200.00`)
- ✅ `currency` : Devise (ex: `EUR`)
- ✅ `move_type` : Type de facture (ex: `out_invoice`)
- ✅ `compliance_status` : `out_of_scope` (par défaut)
- ✅ `facturx_present` : `false` (par défaut, sans PDF)

### Champs Conditionnels

- ⚠️ `seller_vat` : Rempli si disponible dans le payload
- ⚠️ `buyer_vat` : Rempli si disponible dans le payload

---

## 🔍 Vérification des Données Source

Pour vérifier que les données sont bien disponibles dans le payload DVIG :

```sql
-- Vérifier les données dans l'outbox DVIG
SELECT 
    event_id,
    payload->'payload'->>'move_name' as move_name,
    payload->'payload'->>'move_type' as move_type,
    payload->'payload'->>'amount_untaxed' as amount_untaxed,
    payload->'payload'->>'amount_total' as amount_total,
    payload->'payload'->>'currency_name' as currency,
    payload->'payload'->>'invoice_date' as invoice_date,
    payload->'payload'->>'date' as date
FROM outbox_events
WHERE payload->'payload'->>'move_id' = '[ID_FACTURE]'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 🐛 Troubleshooting

### Problème : Les champs sont toujours NULL

**Causes possibles** :
1. **Ancienne version de Vault** : Vérifier que `v1.3.3` est déployée
2. **Données manquantes dans le payload** : Vérifier l'outbox DVIG
3. **Document créé avant la mise à jour** : Créer une nouvelle facture

**Solution** :
```bash
# Vérifier la version Vault
docker inspect vault-core-stinger --format '{{.Config.Image}}'
# Doit afficher : dorevia/vault:v1.3.3

# Vérifier les logs Vault
docker logs vault-core-stinger --tail 50 | grep -i "event\|document"
```

### Problème : Certains champs sont NULL

**Causes possibles** :
1. **Champ non disponible dans le payload DVIG** : Normal, certains champs sont optionnels
2. **Format de date incorrect** : Vérifier le format dans l'outbox

**Solution** :
- Vérifier les données disponibles dans `outbox_events.payload->'payload'`
- Les champs manquants resteront `NULL` (comportement normal)

---

## 📊 Exemple de Résultat Attendu

### Avant (v1.3.2)

```sql
invoice_number    | NULL
invoice_date      | NULL
total_ht          | NULL
total_ttc         | NULL
currency          | NULL
move_type         | NULL
```

### Après (v1.3.3)

```sql
invoice_number    | FAC/2026/00003
invoice_date      | 2026-01-11
total_ht          | 1000.00
total_ttc         | 1200.00
currency          | EUR
move_type         | out_invoice
compliance_status | out_of_scope
facturx_present   | false
```

---

**Auteur** : Dorevia Team  
**Date** : 2026-01-11  
**Version** : 1.0

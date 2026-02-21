# 🔄 Guide Migration v1.0 → v1.1 — Dorevia Vault Connector

**Version** : 1.0  
**Date** : 2026-01-11  
**Module** : `dorevia_vault_connector`

---

## 🎯 Objectif

Migrer les données existantes de l'ancien système (champ `dorevia_vaulted` booléen) vers la nouvelle machine d'état SPEC v1.1.

---

## ⚠️ Prérequis

- ✅ Module `dorevia_vault_connector` mis à jour vers v1.1.0
- ✅ Module `dorevia_posted_lock` à jour (compatibilité assurée)
- ✅ Backup de la base de données (recommandé)
- ✅ Accès shell Odoo ou interface développeur

---

## 📋 Étapes de Migration

### Étape 1 : Mise à jour du Module

1. **Mettre à jour le module** via l'interface Odoo :
   - `Apps` → Rechercher "Dorevia Vault Connector"
   - Cliquer sur "Mettre à jour"

2. **OU via ligne de commande** :
   ```bash
   # Redémarrer Odoo pour charger les nouveaux champs
   docker compose restart odoo
   ```

---

### Étape 2 : Exécuter la Migration

#### Option A : Via Shell Odoo (Recommandé)

```bash
# Se connecter au container Odoo
docker compose exec odoo odoo shell -d <database_name>

# Dans le shell Odoo
env = self.env
env['account.move'].migrate_vault_status_v1_1()
```

#### Option B : Via Interface Odoo (Mode Développeur)

1. **Activer le mode développeur** :
   - `Paramètres` → `Activer le mode développeur`

2. **Créer une action serveur temporaire** :
   - `Paramètres` → `Technique` → `Actions` → `Actions Serveur`
   - Créer une nouvelle action :
     - **Nom** : `Migration Vault Status v1.1`
     - **Modèle** : `account.move`
     - **Type d'action** : `Code Python`
     - **Code** :
       ```python
       env['account.move'].migrate_vault_status_v1_1()
       ```

3. **Exécuter l'action** :
   - `Paramètres` → `Technique` → `Actions` → `Actions Serveur`
   - Sélectionner l'action créée
   - Cliquer sur "Exécuter"

#### Option C : Via Script Python Externe

```python
#!/usr/bin/env python3
# migrate_vault_status.py

import xmlrpc.client

# Configuration
url = "http://localhost:8069"
db = "odoo"
username = "admin"
password = "admin"

# Connexion
common = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/common')
uid = common.authenticate(db, username, password, {})

models = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/object')
models.execute_kw(
    db, uid, password,
    'account.move', 'migrate_vault_status_v1_1',
    []
)
```

---

### Étape 3 : Vérification

#### Vérifier les données migrées

```sql
-- Via psql
SELECT 
    COUNT(*) FILTER (WHERE dorevia_vault_status = 'vaulted') as vaulted,
    COUNT(*) FILTER (WHERE dorevia_vault_status = 'todo') as todo,
    COUNT(*) FILTER (WHERE dorevia_vault_status IS NULL) as null_status
FROM account_move
WHERE state = 'posted' 
  AND move_type IN ('out_invoice', 'in_invoice', 'out_refund', 'in_refund');
```

#### Vérifier les clés d'idempotence

```sql
-- Vérifier que toutes les factures posted ont une clé d'idempotence
SELECT 
    COUNT(*) as total,
    COUNT(dorevia_vault_idempotency_key) as with_key,
    COUNT(*) - COUNT(dorevia_vault_idempotency_key) as missing_key
FROM account_move
WHERE state = 'posted' 
  AND move_type IN ('out_invoice', 'in_invoice', 'out_refund', 'in_refund');
```

---

## 🔍 Détails de la Migration

### Conversions Effectuées

1. **Factures vaultées** :
   - `dorevia_vaulted=True` → `dorevia_vault_status='vaulted'`
   - Calcul de `dorevia_vault_idempotency_key` si manquante

2. **Factures non vaultées** :
   - Factures `posted` non vaultées → `dorevia_vault_status='todo'`
   - Calcul de `dorevia_vault_idempotency_key`
   - Initialisation `dorevia_vault_next_retry_at` pour traitement immédiat par CRON

3. **Clés d'idempotence** :
   - Calcul pour toutes les factures `posted` sans clé
   - Formule : `SHA256(source + model + record_id + event_type + posted_at)`

---

## ⚠️ Notes Importantes

### Rétrocompatibilité

- Le champ `dorevia_vaulted` est conservé pour rétrocompatibilité
- `dorevia_posted_lock` utilise maintenant `dorevia_vault_status='vaulted'` avec fallback sur `dorevia_vaulted`

### Rollback

En cas de problème, il est possible de revenir en arrière :

```sql
-- Remettre dorevia_vaulted=True pour les factures vaulted
UPDATE account_move
SET dorevia_vaulted = TRUE
WHERE dorevia_vault_status = 'vaulted';

-- Remettre dorevia_vaulted=False pour les autres
UPDATE account_move
SET dorevia_vaulted = FALSE
WHERE dorevia_vault_status != 'vaulted' OR dorevia_vault_status IS NULL;
```

---

## 📊 Logs de Migration

La migration génère des logs détaillés dans les logs Odoo :

```
=== Début migration vault status v1.1 ===
Migration de X facture(s) vaultée(s) vers status='vaulted'
Migration de Y facture(s) non vaultée(s) vers status='todo'
Calcul des clés d'idempotence pour Z facture(s)
=== Fin migration vault status v1.1 ===
```

---

## ✅ Checklist Post-Migration

- [ ] Migration exécutée sans erreur
- [ ] Vérification SQL : toutes les factures vaultées ont `status='vaulted'`
- [ ] Vérification SQL : toutes les factures posted non vaultées ont `status='todo'`
- [ ] Vérification SQL : toutes les factures ont une clé d'idempotence
- [ ] Logs Odoo vérifiés (pas d'erreurs)
- [ ] Test : validation d'une nouvelle facture → `status='todo'` initialisé
- [ ] Test : CRON #1 traite les factures `status='todo'`

---

## 🆘 Dépannage

### Erreur : "Configuration DVIG incomplète"

**Cause** : La source DVIG n'est pas configurée.

**Solution** :
```python
# Vérifier la configuration
env['ir.config_parameter'].sudo().get_param('dorevia.dvig.source')
```

### Erreur : "Clé d'idempotence déjà existante"

**Cause** : Doublon détecté (normal si migration exécutée plusieurs fois).

**Solution** : Ignorer l'erreur, la migration est idempotente.

### Factures non migrées

**Cause** : Factures sans `move_type` valide ou configuration manquante.

**Solution** : Vérifier les logs Odoo pour identifier les factures problématiques.

---

**Document créé** : 2026-01-11  
**Auteur** : Dorevia Team

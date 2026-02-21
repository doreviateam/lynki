# 🔄 Réinitialisation Complète — Dorevia Billing CORE

Guide pour réinitialiser complètement le module ou la base de données Odoo.

## ⚠️ Attention

Ces opérations sont **destructives** et supprimeront des données. Assurez-vous d'être dans un environnement de **test/développement**.

---

## 🎯 Option 1 : Réinitialiser uniquement le module (Recommandé)

### Via l'interface Odoo (Mode développeur)

1. **Activez le mode développeur** :
   - `Paramètres` → `Activer le mode développeur`
   - Cochez `Mode développeur`

2. **Supprimez le module** :
   - `Paramètres` → `Technique` → `Base de données` → `Structure`
   - Recherchez `ir.module.module`
   - Trouvez l'enregistrement `dorevia_billing_core`
   - **Supprimez-le** (cela supprimera aussi toutes les données du module)

3. **Réinstallez le module** :
   - `Apps` → Recherchez `Dorevia Billing CORE`
   - Cliquez sur `Installer`

### Via la ligne de commande

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab

# Arrêter Odoo
docker compose stop odoo

# Supprimer le module de la base de données (via psql)
docker compose exec -T db psql -U odoo -d odoo << 'SQL'
-- Supprimer toutes les données du module
DELETE FROM ir_model_data WHERE module = 'dorevia_billing_core';
DELETE FROM ir_model WHERE model LIKE 'dorevia.%';
DELETE FROM ir_ui_view WHERE name LIKE '%dorevia%';
DELETE FROM ir_actions_act_window WHERE res_model LIKE 'dorevia.%';
DELETE FROM ir_model_access WHERE model_id IN (SELECT id FROM ir_model WHERE model LIKE 'dorevia.%');
DELETE FROM ir_module_module_dependency WHERE module_id = (SELECT id FROM ir_module_module WHERE name = 'dorevia_billing_core');
DELETE FROM ir_module_module WHERE name = 'dorevia_billing_core';
SQL

# Redémarrer Odoo
docker compose start odoo
```

Puis réinstallez le module via l'interface Odoo.

---

## 🎯 Option 2 : Réinitialiser complètement la base de données Odoo

### ⚠️ ATTENTION : Cela supprimera TOUTES les données !

### Via l'interface Odoo

1. **Connectez-vous en tant qu'administrateur**
2. **Menu** : `Paramètres` → `Technique` → `Base de données` → `Supprimer la base de données`
3. **Confirmez** la suppression
4. **Réinitialisez** Odoo avec la base de données vide

### Via la ligne de commande

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab

# Arrêter Odoo
docker compose stop odoo

# Supprimer la base de données
docker compose exec -T db psql -U postgres -c "DROP DATABASE IF EXISTS odoo;"

# Recréer la base de données
docker compose exec -T db psql -U postgres -c "CREATE DATABASE odoo OWNER odoo;"

# Redémarrer Odoo (il demandera de créer une nouvelle base)
docker compose start odoo
```

Puis :
1. Accédez à Odoo : https://odoo.lab.core.doreviateam.com
2. Configurez la nouvelle base de données
3. Installez le module `dorevia_billing_core`

---

## 🎯 Option 3 : Réinitialiser via Docker Compose (Le plus propre)

### Supprimer les volumes Docker

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab

# Arrêter tous les services
docker compose down

# Supprimer les volumes (⚠️ Supprime TOUTES les données)
docker compose down -v

# Redémarrer
docker compose up -d
```

Puis :
1. Configurez Odoo depuis zéro
2. Installez le module `dorevia_billing_core`

---

## 🎯 Option 4 : Script de nettoyage automatique

Créez un script pour nettoyer uniquement le module :

```bash
#!/bin/bash
# clean_module.sh

cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab

echo "🛑 Arrêt d'Odoo..."
docker compose stop odoo

echo "🧹 Nettoyage du module dorevia_billing_core..."

docker compose exec -T db psql -U odoo -d odoo << 'SQL'
-- Supprimer toutes les dépendances
DELETE FROM ir_module_module_dependency 
WHERE module_id = (SELECT id FROM ir_module_module WHERE name = 'dorevia_billing_core');

-- Supprimer toutes les données du module
DELETE FROM ir_model_data WHERE module = 'dorevia_billing_core';
DELETE FROM ir_model WHERE model LIKE 'dorevia.%';
DELETE FROM ir_ui_view WHERE name LIKE '%dorevia%';
DELETE FROM ir_actions_act_window WHERE res_model LIKE 'dorevia.%';
DELETE FROM ir_model_access WHERE model_id IN (SELECT id FROM ir_model WHERE model LIKE 'dorevia.%');

-- Supprimer le module lui-même
DELETE FROM ir_module_module WHERE name = 'dorevia_billing_core';
SQL

echo "✅ Module nettoyé"
echo "🔄 Redémarrage d'Odoo..."
docker compose start odoo

echo "✅ Terminé ! Réinstallez le module via l'interface Odoo."
```

Utilisation :
```bash
chmod +x clean_module.sh
./clean_module.sh
```

---

## 📋 Après la réinitialisation

Une fois le module réinitialisé et réinstallé :

1. ✅ **Configurez le Token API** :
   - `Paramètres` → `Technique` → `Paramètres` → `Paramètres Système`
   - Créez `dorevia_billing.core_api_token` = `sk_test_abc123xyz789`

2. ✅ **Créez le Tenant de test** :
   - `Contacts` → `Créer`
   - Nom : `Client Test Premium`
   - Référence : `test-tenant-1`

3. ✅ **Créez le Contrat** :
   - `Dorevia Billing` → `Contrats` → `Créer`
   - Configurez les règles tarifaires

4. ✅ **Testez l'API** :
   ```bash
   curl -X POST https://odoo.lab.core.doreviateam.com/api/v1/constats \
     -H "Authorization: api_key sk_test_abc123xyz789" \
     -H "Content-Type: application/json" \
     -d '{...}'
   ```

---

## ⚠️ Recommandation

Pour un environnement de **test/lab**, l'**Option 2** (réinitialiser complètement la base) est la plus propre et évite tous les problèmes de dépendances.

Pour un environnement avec d'autres données importantes, utilisez l'**Option 1** (réinitialiser uniquement le module).

---

## 🔄 Vérification

Après la réinitialisation, vérifiez que :

- ✅ Le module apparaît dans `Apps` avec le statut `À installer`
- ✅ L'icône est visible (après installation)
- ✅ Aucune erreur dans les logs Odoo
- ✅ L'API fonctionne correctement


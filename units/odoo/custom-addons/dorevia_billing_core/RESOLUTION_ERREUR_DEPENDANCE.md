# 🔧 Résolution : Erreur de dépendance dupliquée

## ❌ Erreur

```
duplicate key value violates unique constraint "ir_module_module_dependency_pkey"
DETAIL: Key (id)=(1640) already exists.
```

## 🔍 Cause

Il y a des dépendances dupliquées dans la table `ir_module_module_dependency` pour le module `dorevia_billing_core`. Cela peut arriver après une réinitialisation d'Odoo ou une installation incomplète.

## ✅ Solution 1 : Nettoyer les dépendances dupliquées (Recommandé)

### Via SQL direct

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab

docker compose exec -T db psql -U odoo -d odoo << 'SQL'
-- Supprimer les dépendances dupliquées pour dorevia_billing_core
DELETE FROM ir_module_module_dependency 
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY module_id, name ORDER BY id) AS rn 
        FROM ir_module_module_dependency 
        WHERE module_id = (SELECT id FROM ir_module_module WHERE name = 'dorevia_billing_core')
    ) t 
    WHERE rn > 1
);
SQL
```

### Vérification

```bash
docker compose exec -T db psql -U odoo -d odoo -c "SELECT module_id, name, COUNT(*) FROM ir_module_module_dependency WHERE module_id = (SELECT id FROM ir_module_module WHERE name = 'dorevia_billing_core') GROUP BY module_id, name HAVING COUNT(*) > 1;"
```

Si cette commande ne retourne rien, les doublons ont été supprimés.

---

## ✅ Solution 2 : Désinstaller puis réinstaller

1. **Dans Odoo** :
   - Allez dans `Apps`
   - Recherchez `Dorevia Billing CORE`
   - Cliquez sur `Désinstaller`
   - Attendez la fin de la désinstallation

2. **Réinstallez** :
   - Recherchez à nouveau `Dorevia Billing CORE`
   - Cliquez sur `Installer`

---

## ✅ Solution 3 : Mise à jour via ligne de commande

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab

# Mettre à jour le module avec nettoyage
docker compose exec -T odoo odoo -u dorevia_billing_core -d odoo --stop-after-init --init=dorevia_billing_core
```

**Note** : Cette commande réinitialise le module, ce qui peut supprimer des données.

---

## ✅ Solution 4 : Nettoyer toutes les dépendances orphelines

Si le problème persiste, nettoyez toutes les dépendances orphelines :

```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab

docker compose exec -T db psql -U odoo -d odoo << 'SQL'
-- Supprimer toutes les dépendances orphelines
DELETE FROM ir_module_module_dependency 
WHERE module_id NOT IN (SELECT id FROM ir_module_module);

-- Supprimer les dépendances dupliquées pour tous les modules
DELETE FROM ir_module_module_dependency 
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY module_id, name ORDER BY id) AS rn 
        FROM ir_module_module_dependency
    ) t 
    WHERE rn > 1
);
SQL
```

---

## 🔄 Après le nettoyage

1. **Redémarrez Odoo** :
   ```bash
   cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
   docker compose restart odoo
   ```

2. **Réessayez la mise à jour** dans l'interface Odoo :
   - `Apps` → `Dorevia Billing CORE` → `Mettre à jour`

---

## ⚠️ Précautions

- **Sauvegardez la base de données** avant de modifier les tables directement
- Les solutions SQL modifient directement la base de données
- En cas de doute, utilisez la Solution 2 (désinstaller/réinstaller)

---

## 📝 Vérification finale

Après le nettoyage, vérifiez que le module fonctionne :

```bash
# Vérifier que le module est installé
docker compose exec -T db psql -U odoo -d odoo -c "SELECT name, state FROM ir_module_module WHERE name = 'dorevia_billing_core';"

# Vérifier les dépendances
docker compose exec -T db psql -U odoo -d odoo -c "SELECT d.name FROM ir_module_module_dependency d JOIN ir_module_module m ON d.module_id = m.id WHERE m.name = 'dorevia_billing_core';"
```


# 🗑️ Plan de Suppression - Tenants dido et rozas

**Date** : 2026-01-11  
**Objectif** : Supprimer proprement tous les éléments liés aux tenants `dido` et `rozas`

---

## ⚠️ AVERTISSEMENT

**Cette opération est IRRÉVERSIBLE** et supprimera :
- Toutes les données des bases de données
- Tous les volumes de stockage
- Toutes les configurations
- Tous les containers

**Assurez-vous d'avoir des sauvegardes si nécessaire avant de procéder.**

---

## 📋 Éléments à Supprimer

### 1. Containers Docker (15 containers)

#### dido (8 containers)
- `dvig-dido`
- `vault-dido`
- `vault-db-dido`
- `odoo_lab_dido`
- `odoo_db_lab_dido`
- `odoo_prod_dido`
- `odoo_db_prod_dido`
- `odoo_stinger_dido`
- `odoo_db_stinger_dido`
- `eb3371198ff7_odoo_db_stinger_dido` (container orphelin)

#### rozas (5 containers)
- `dvig-rozas`
- `vault-rozas`
- `vault-db-rozas`
- `odoo_prod_rozas`
- `odoo_db_prod_rozas`
- `odoo_stinger_rozas`

### 2. Volumes Docker (18 volumes)

#### dido (9 volumes)
- `dvig_logs_dido`
- `odoo_lab_dido_data`
- `odoo_lab_dido_db`
- `odoo_prod_dido_data`
- `odoo_prod_dido_db`
- `odoo_stinger_dido_data`
- `odoo_stinger_dido_db`
- `vault_audit_dido`
- `vault_db_dido_data`
- `vault_ledger_dido`
- `vault_storage_dido`

#### rozas (9 volumes)
- `dvig_logs_rozas`
- `odoo_prod_rozas_data`
- `odoo_prod_rozas_db`
- `odoo_stinger_rozas_data`
- `odoo_stinger_rozas_db`
- `vault_audit_rozas`
- `vault_db_rozas_data`
- `vault_ledger_rozas`
- `vault_storage_rozas`

### 3. Répertoires de Configuration

#### dido
- `/opt/dorevia-plateform/tenants/dido/` (répertoire complet)

#### rozas
- `/opt/dorevia-plateform/tenants/rozas/` (répertoire complet)

### 4. Fichiers de Configuration

#### Caddyfile
- Sections `dido` (lignes 58-92)
- Sections `rozas` (lignes 94-127)

#### Autres fichiers
- Références dans `units/gateway/Caddyfile`
- Références dans `units/odoo/custom-addons/dorevia_billing_core/controllers/constat_controller.py` (si présentes)

### 5. Backups/Snapshots (optionnel)

- `/opt/dorevia-plateform/backups/snapshots/*/manifests/tenants/rozas`
- `/opt/dorevia-plateform/backups/snapshots/*/manifests/tenants/dido`

---

## 🔧 Plan d'Exécution

### Phase 1 : Arrêt des Services

```bash
# Arrêter tous les containers dido
docker stop dvig-dido vault-dido vault-db-dido \
  odoo_lab_dido odoo_db_lab_dido \
  odoo_prod_dido odoo_db_prod_dido \
  odoo_stinger_dido odoo_db_stinger_dido \
  eb3371198ff7_odoo_db_stinger_dido 2>/dev/null

# Arrêter tous les containers rozas
docker stop dvig-rozas vault-rozas vault-db-rozas \
  odoo_prod_rozas odoo_db_prod_rozas \
  odoo_stinger_rozas 2>/dev/null
```

### Phase 2 : Suppression des Containers

```bash
# Supprimer containers dido
docker rm dvig-dido vault-dido vault-db-dido \
  odoo_lab_dido odoo_db_lab_dido \
  odoo_prod_dido odoo_db_prod_dido \
  odoo_stinger_dido odoo_db_stinger_dido \
  eb3371198ff7_odoo_db_stinger_dido 2>/dev/null

# Supprimer containers rozas
docker rm dvig-rozas vault-rozas vault-db-rozas \
  odoo_prod_rozas odoo_db_prod_rozas \
  odoo_stinger_rozas 2>/dev/null
```

### Phase 3 : Suppression des Volumes

```bash
# Supprimer volumes dido
docker volume rm dvig_logs_dido \
  odoo_lab_dido_data odoo_lab_dido_db \
  odoo_prod_dido_data odoo_prod_dido_db \
  odoo_stinger_dido_data odoo_stinger_dido_db \
  vault_audit_dido vault_db_dido_data \
  vault_ledger_dido vault_storage_dido 2>/dev/null

# Supprimer volumes rozas
docker volume rm dvig_logs_rozas \
  odoo_prod_rozas_data odoo_prod_rozas_db \
  odoo_stinger_rozas_data odoo_stinger_rozas_db \
  vault_audit_rozas vault_db_rozas_data \
  vault_ledger_rozas vault_storage_rozas 2>/dev/null
```

### Phase 4 : Suppression des Répertoires

```bash
# Supprimer répertoires de configuration
rm -rf /opt/dorevia-plateform/tenants/dido
rm -rf /opt/dorevia-plateform/tenants/rozas
```

### Phase 5 : Nettoyage Caddyfile

Supprimer les sections dido et rozas du fichier `units/gateway/Caddyfile`

### Phase 6 : Vérification

```bash
# Vérifier qu'il ne reste plus rien
docker ps -a | grep -E "(dido|rozas)"
docker volume ls | grep -E "(dido|rozas)"
ls -la /opt/dorevia-plateform/tenants/ | grep -E "(dido|rozas)"
```

---

## ✅ Checklist de Vérification

Avant de procéder, vérifier :

- [ ] Aucun service actif n'utilise dido ou rozas
- [ ] Sauvegardes effectuées si nécessaire
- [ ] Aucune dépendance critique
- [ ] Confirmation de l'utilisateur

Après suppression, vérifier :

- [ ] Tous les containers supprimés
- [ ] Tous les volumes supprimés
- [ ] Répertoires supprimés
- [ ] Caddyfile nettoyé
- [ ] Aucune référence restante

---

## 🚨 Commandes de Secours

Si vous devez annuler avant la suppression complète :

```bash
# Redémarrer les services (si containers encore présents)
docker start dvig-dido vault-dido vault-db-dido
docker start dvig-rozas vault-rozas vault-db-rozas
# etc.
```

---

**⚠️ ATTENTION** : Une fois les volumes supprimés, les données sont PERDUES définitivement.

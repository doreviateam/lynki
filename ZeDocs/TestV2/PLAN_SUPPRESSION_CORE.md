# 🗑️ Plan de Suppression du Tenant 'core'

**Date** : 2026-01-11  
**Tenant à supprimer** : `core`  
**⚠️ ATTENTION** : Cette opération est **irréversible**. Toutes les données seront perdues.

---

## 📋 Éléments à Supprimer

### 1. Containers Docker Actifs

#### Odoo (tous environnements)
- `odoo_lab_core` (Up 3 days)
- `odoo_db_lab_core` (Up 3 days, healthy)
- `odoo_prod_core` (Up 3 days)
- `odoo_db_prod_core` (Up 3 days, healthy)
- `odoo_stinger_core` (Up 3 days)
- `odoo_db_stinger_core` (Up 3 days, healthy)

#### Services Platform
- `vault-core`
- `vault-db-core`
- `dvig-core`

#### Containers de Tests (à vérifier)
- Nombreux containers de tests avec noms aléatoires (lab-*, prod-*, core-*)

### 2. Volumes Docker

#### Odoo
- `odoo_lab_core_data`
- `odoo_lab_core_db`
- `odoo_prod_core_data`
- `odoo_prod_core_db`
- `odoo_stinger_core_data`
- `odoo_stinger_core_db`

#### Services Platform
- `vault_audit_core`
- `vault_db_core_data`
- `vault_ledger_core`
- `vault_storage_core`
- `dvig_logs_core`

### 3. Répertoires

- `/opt/dorevia-plateform/tenants/core/` (répertoire complet)

### 4. Configuration Caddyfile

Sections à supprimer dans `units/gateway/Caddyfile` :
- `odoo.lab.core.doreviateam.com` (lignes ~10-13)
- `odoo.prod.core.doreviateam.com` (lignes ~26-29)
- `odoo.stinger.core.doreviateam.com` (lignes ~36-39)
- `dvig.core.doreviateam.com` (lignes ~15-18)
- `vault.core.doreviateam.com` (lignes ~19-23)

---

## 🔄 Phases de Suppression

### Phase 1 : Arrêt des Containers

```bash
# Odoo Lab
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
docker compose -p dorevia_odoo_lab_core down

# Odoo Prod
cd /opt/dorevia-plateform/tenants/core/apps/odoo/prod
docker compose -p dorevia_odoo_prod_core down

# Odoo Stinger
cd /opt/dorevia-plateform/tenants/core/apps/odoo/stinger
docker compose -p dorevia_odoo_stinger_core down

# Services Platform
cd /opt/dorevia-plateform/tenants/core/platform
docker compose -p dorevia_core_platform down
```

### Phase 2 : Suppression des Containers

```bash
# Supprimer les containers restants (si docker compose down n'a pas tout supprimé)
docker rm -f odoo_lab_core odoo_db_lab_core 2>/dev/null
docker rm -f odoo_prod_core odoo_db_prod_core 2>/dev/null
docker rm -f odoo_stinger_core odoo_db_stinger_core 2>/dev/null
docker rm -f vault-core vault-db-core 2>/dev/null
docker rm -f dvig-core 2>/dev/null
```

### Phase 3 : Suppression des Volumes

```bash
# Volumes Odoo
docker volume rm odoo_lab_core_data odoo_lab_core_db 2>/dev/null
docker volume rm odoo_prod_core_data odoo_prod_core_db 2>/dev/null
docker volume rm odoo_stinger_core_data odoo_stinger_core_db 2>/dev/null

# Volumes Services Platform
docker volume rm vault_audit_core vault_db_core_data vault_ledger_core vault_storage_core 2>/dev/null
docker volume rm dvig_logs_core 2>/dev/null
```

### Phase 4 : Suppression du Répertoire

```bash
# Supprimer le répertoire complet
rm -rf /opt/dorevia-plateform/tenants/core
```

### Phase 5 : Modification du Caddyfile

Supprimer les sections suivantes dans `units/gateway/Caddyfile` :
- Section `odoo.lab.core.doreviateam.com`
- Section `odoo.prod.core.doreviateam.com`
- Section `odoo.stinger.core.doreviateam.com`
- Section `dvig.core.doreviateam.com`
- Section `vault.core.doreviateam.com`

Puis recharger Caddy :
```bash
docker exec dorevia-caddy caddy reload --config /etc/caddy/Caddyfile
```

### Phase 6 : Vérification

```bash
# Vérifier qu'aucun container core n'existe (sauf core-stinger)
docker ps -a --format "{{.Names}}" | grep -E "^.*core.*" | grep -v "core-stinger"

# Vérifier qu'aucun volume core n'existe (sauf core-stinger)
docker volume ls --format "{{.Name}}" | grep -E "^.*core.*" | grep -v "core-stinger"

# Vérifier que le répertoire n'existe plus
ls -d /opt/dorevia-plateform/tenants/core 2>/dev/null && echo "❌ Répertoire existe encore" || echo "✅ Répertoire supprimé"
```

---

## ⚠️ Avertissements

1. **Données irréversibles** : Toutes les bases de données et fichiers seront supprimés définitivement
2. **Containers de tests** : Vérifier les containers de tests avant suppression (certains peuvent être utilisés)
3. **Services dépendants** : Vérifier qu'aucun autre service ne dépend du tenant 'core'
4. **Backup** : Si nécessaire, faire un backup avant suppression

---

## ✅ Checklist

- [ ] Phase 1 : Containers arrêtés
- [ ] Phase 2 : Containers supprimés
- [ ] Phase 3 : Volumes supprimés
- [ ] Phase 4 : Répertoire supprimé
- [ ] Phase 5 : Caddyfile modifié et rechargé
- [ ] Phase 6 : Vérification complète
- [ ] Documentation mise à jour (ETAT_PLATEFORME_20260111.md)

---

## 📝 Notes

- Le tenant `core-stinger` **NE SERA PAS** affecté (c'est un tenant différent)
- Les containers de tests avec noms aléatoires devront être vérifiés individuellement
- Certains volumes peuvent être partagés (comme `oca_extra_addons`) et ne doivent pas être supprimés

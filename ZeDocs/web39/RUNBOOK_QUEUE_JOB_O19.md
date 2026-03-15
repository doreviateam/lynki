# Runbook — Installation queue_job sur Odoo 19 (tenant o19)

**Statut :** ✅ Résolu (2026-03-07) — OCA queue 19.0 copié, reinstall_o19.sh installe queue_job  
**Cause initiale :** Le dépôt OCA queue local était en 18.0 ; Odoo 19 requiert la branche 19.0  

---

## 1. Diagnostic

```bash
# Vérifier l'état des modules
echo "
m = env['ir.module.module'].search([('name','in',['queue_job','base_sparse_field'])])
for r in m:
    print(r.name, r.state)
" | docker exec -i odoo_lab_o19 odoo shell -d odoo_lab_o19 --no-http 2>/dev/null | tail -5
```

**Attendu actuel :** `queue_job uninstallable`, `base_sparse_field uninstalled`

---

## 2. Solution — Mettre à jour OCA queue vers 19.0

### 2.1 Mettre à jour le dépôt OCA queue

```bash
cd /opt/dorevia-plateform/sources/oca/queue
git fetch origin 19.0
git checkout 19.0
# Ou si la branche n'existe pas localement :
git fetch origin
git checkout -b 19.0 origin/19.0
```

**Vérifier la version :**
```bash
grep '"version"' queue_job/__manifest__.py
# Attendu : "version": "19.0.1.1.0"
```

### 2.2 Reconstruire les symlinks OCA (oca_flatten)

```bash
# Redémarrer Odoo pour que oca_flatten s'exécute au démarrage
docker restart odoo_lab_o19
# Attendre ~30 s
```

Ou exécuter manuellement dans le conteneur :
```bash
docker exec odoo_lab_o19 /mnt/custom-addons/bin/oca_flatten.sh
```

### 2.3 Mettre à jour la liste des apps Odoo

1. Ouvrir https://odoo.lab.o19.doreviateam.com
2. **Apps** → icône **Mettre à jour la liste des applications**
3. Rechercher **queue_job** ou **Job Queue**
4. **Installer**

### 2.4 Dépendances

`queue_job` dépend de :
- `mail` (inclus dans Odoo)
- `base_sparse_field` (OCA server-tools)
- `web` (inclus)

Si `base_sparse_field` est « uninstallable », mettre à jour aussi `sources/oca/server-tools` vers la branche 19.0.

---

## 3. Configuration post-installation

### 3.1 odoo.conf — Activer le job runner

Éditer `tenants/o19/apps/odoo/lab/odoo.conf` (ou le fichier rendu) :

```ini
[options]
server_wide_modules = web,queue_job
workers = 2
```

### 3.2 Section [queue_job] (optionnel)

```ini
[queue_job]
channels = root:2
```

### 3.3 Redémarrer Odoo

```bash
docker restart odoo_lab_o19
```

### 3.4 Vérifier le job runner

```bash
docker logs odoo_lab_o19 2>&1 | grep -i "queue_job\|jobrunner"
```

Attendu : `queue job runner ready for db odoo_lab_o19`

---

## 4. Impact sur dorevia_vault_connector

Avec `queue_job` installé :
- **Vaulting factures** : enqueue immédiat vers DVIG (au lieu d'attendre le CRON 1 min)
- **Vaulting paiements** : idem
- **action_securiser_maintenant** : enqueue non bloquant

Sans `queue_job` : le CRON (1 min) assure le fallback — le vaulting fonctionne, mais avec une latence plus élevée.

---

## 5. Références

- OCA queue 19.0 : https://github.com/OCA/queue/tree/19.0
- Guide orchestration : `units/odoo/custom-addons/dorevia_vault_connector/GUIDE_ORCHESTRATION_QUEUE_JOB_v1.0.md`
- Solution TestV3 : `ZeDocs/TestV3/SOLUTION_QUEUE_JOB_WORKER_DVIG_20260112.md`

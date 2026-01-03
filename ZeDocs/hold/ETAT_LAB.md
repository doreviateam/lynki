# ✅ État LAB - Environnement Opérationnel

**Date** : 2025-01-28  
**Statut** : ✅ **OPÉRATIONNEL**  
**Décision** : Ne garder que LAB pour l'instant

---

## 📊 Services LAB Actifs

### DVIG LAB
- **Container** : `dvig-lab-new`
- **Image** : `dorevia/dvig:0.1.0`
- **Port** : `18120:8080`
- **Statut** : ✅ Healthy
- **Health** : `/health` accessible

### Odoo LAB
- **Container** : `odoo-odoo-1` (via docker-compose.lab.yml)
- **Image** : `odoo:18.0`
- **Port** : `18069:8069`
- **Base de données** : `core_lab`
- **Modules installés** : 74-75 modules
- **Configuration** : `odoo.lab.conf`

### PostgreSQL LAB
- **Container** : `odoo-db-1` (via docker-compose.lab.yml)
- **Image** : `postgres:16`
- **Base** : `core_lab`
- **Volumes** : `odoo_db_lab_data`, `odoo_odoo_lab_data`

---

## 📁 Configuration LAB

### Fichiers de Configuration
- ✅ `units/odoo/docker-compose.lab.yml` - Docker Compose LAB
- ✅ `units/odoo/conf/odoo.lab.conf` - Configuration Odoo LAB
- ✅ `sources/dvig/conf/tokens.yml` - Tokens DVIG LAB
- ✅ `units/gateway/Caddyfile` - Reverse proxy (LAB uniquement)

### Configuration Odoo LAB
```ini
[options]
db_host = db
db_port = 5432
db_user = odoo
db_password = odoo
dbfilter = ^core_lab$

addons_path = /usr/lib/python3/dist-packages/odoo/addons,/mnt/extra-addons,/mnt/custom-addons
data_dir = /var/lib/odoo
```

---

## 🌐 Accès LAB

### URLs
- **DVIG LAB** : `http://localhost:18120`
  - Health : `http://localhost:18120/health`
  - Docs : `http://localhost:18120/docs` (si activé)
  
- **Odoo LAB** : `http://localhost:18069`
  - Web : `http://localhost:18069/web`
  - Login : `http://localhost:18069/web/login`

### Via Caddy (si configuré)
- **Odoo LAB** : `https://odoo.lab.core.doreviateam.com`

---

## 📋 Commandes Utiles LAB

### Démarrer LAB
```bash
cd /opt/dorevia-plateform/units/odoo
docker compose -f docker-compose.lab.yml up -d
```

### Arrêter LAB
```bash
cd /opt/dorevia-plateform/units/odoo
docker compose -f docker-compose.lab.yml down
```

### Logs LAB
```bash
# Odoo
docker compose -f docker-compose.lab.yml logs -f odoo

# Database
docker compose -f docker-compose.lab.yml logs -f db
```

### Vérifier état
```bash
docker compose -f docker-compose.lab.yml ps
```

---

## 🔍 Vérification État LAB

### Containers
```bash
docker ps | grep -E "(lab|odoo|dvig)" | grep -v stinger
```

### Volumes
```bash
docker volume ls | grep -E "(lab|odoo_db_lab|odoo_odoo_lab)"
```

### Base de données
```bash
docker exec odoo-db-1 psql -U odoo -d core_lab -c \
  "SELECT COUNT(*) FROM ir_module_module WHERE state='installed';"
```

---

## ✅ Checklist LAB

- ✅ DVIG LAB opérationnel
- ✅ Odoo LAB opérationnel
- ✅ Base de données `core_lab` initialisée
- ✅ 74-75 modules installés
- ✅ Configuration propre
- ✅ Ports accessibles (18069, 18120)
- ✅ Volumes persistants configurés

---

## 🗑️ Environnements Supprimés

- ❌ **STINGER** : Complètement supprimé
  - Containers, volumes, fichiers, scripts
  - Références Caddy nettoyées

- ⚠️ **PROD** : Configuration présente mais non déployée
  - Fichiers conservés pour référence future
  - Non activé pour l'instant

---

## 📝 Notes

### Décision
- **LAB uniquement** : Focus sur développement et validation
- **STINGER supprimé** : Problèmes d'architecture identifiés
- **PROD en attente** : Déploiement futur après validation LAB

### Maintenance
- LAB est l'environnement principal de développement
- Tous les tests et validations se font en LAB
- Configuration stable et opérationnelle

---

**Dernière mise à jour** : 2025-01-28  
**Statut** : ✅ **LAB OPÉRATIONNEL**


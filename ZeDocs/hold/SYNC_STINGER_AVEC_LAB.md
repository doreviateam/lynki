# 🔄 Synchronisation STINGER avec LAB - Odoo

**Date** : 2025-01-28  
**Problème** : STINGER ne reflète pas l'état de LAB  
**Objectif** : Copier la base de données et configuration LAB vers STINGER

---

## 🔴 Problème Identifié

### Symptôme
- STINGER a une base de données **vide** (seulement 12 modules de base)
- LAB a une configuration complète avec modules et données
- STINGER doit refléter l'état de LAB pour les tests de pré-production

---

## ✅ Solution : Copie Base de Données LAB → STINGER

### Méthode 1 : Dump/Restore PostgreSQL (Recommandé)

#### Étape 1 : Dump Base LAB

```bash
# Identifier le container LAB
LAB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "odoo.*lab|lab.*odoo" | head -1)
LAB_DB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "db.*lab|lab.*db" | head -1)

# Dump depuis container LAB
docker exec $LAB_DB_CONTAINER pg_dump -U odoo odoo > /tmp/odoo_lab_backup.sql

# Ou dump depuis container Odoo LAB
docker exec $LAB_CONTAINER odoo -d odoo --stop-after-init --db-filter=odoo
```

#### Étape 2 : Restore dans STINGER

```bash
# Arrêter Odoo STINGER
cd /opt/dorevia-plateform/units/odoo
docker compose -f docker-compose.stinger.yml stop odoo

# Restore dans base STINGER
docker exec odoo-db-1 psql -U odoo -d odoo < /tmp/odoo_lab_backup.sql

# Redémarrer Odoo STINGER
docker compose -f docker-compose.stinger.yml start odoo
```

### Méthode 2 : Copie Volume PostgreSQL (Plus rapide)

```bash
# Arrêter les services
docker compose -f docker-compose.stinger.yml stop

# Identifier les volumes
LAB_DB_VOLUME=$(docker volume ls -q | grep -E "lab.*db|db.*lab" | head -1)
STINGER_DB_VOLUME="odoo_db_stinger_data"

# Copie volume (nécessite arrêt des deux services)
docker run --rm \
  -v $LAB_DB_VOLUME:/source:ro \
  -v $STINGER_DB_VOLUME:/dest \
  alpine sh -c "cd /source && tar -cf - . | (cd /dest && tar -xf -)"

# Redémarrer STINGER
docker compose -f docker-compose.stinger.yml start
```

### Méthode 3 : Odoo Database Manager (Interface Web)

1. Accéder à `https://odoo.stinger.core.doreviateam.com/web/database/manager`
2. Créer une nouvelle base ou restaurer depuis backup
3. Utiliser le dump de LAB

---

## 📋 Checklist Synchronisation

### Avant
- [ ] Identifier container/volume LAB
- [ ] Vérifier que LAB est opérationnel
- [ ] Créer backup LAB (sécurité)

### Pendant
- [ ] Arrêter Odoo STINGER
- [ ] Dump base LAB
- [ ] Restore dans STINGER
- [ ] Vérifier intégrité données

### Après
- [ ] Redémarrer Odoo STINGER
- [ ] Vérifier modules installés
- [ ] Vérifier données présentes
- [ ] Tester fonctionnalités clés

---

## 🔍 Vérification Post-Sync

### Modules Installés
```bash
docker exec odoo-odoo-1 psql -U odoo -d odoo -c \
  "SELECT COUNT(*) FROM ir_module_module WHERE state='installed';"
```

### Données Présentes
```bash
docker exec odoo-odoo-1 psql -U odoo -d odoo -c \
  "SELECT COUNT(*) FROM res_users;"
```

### Configuration
```bash
docker exec odoo-odoo-1 psql -U odoo -d odoo -c \
  "SELECT key, value FROM ir_config_parameter LIMIT 10;"
```

---

## ⚠️ Notes Importantes

### Sécurité
- ⚠️ **Ne pas copier les mots de passe** : Réinitialiser après sync
- ⚠️ **Vérifier les clés API** : Régénérer si nécessaire
- ⚠️ **Tokens d'authentification** : Invalider et recréer

### Configuration
- ✅ **Adapter les URLs** : Changer `odoo.lab.core` → `odoo.stinger.core`
- ✅ **Vérifier les chemins** : Adapter selon environnement
- ✅ **Modules spécifiques** : Vérifier compatibilité STINGER

---

## 🚨 Troubleshooting

### Problème : Erreur de permissions PostgreSQL

**Solution** :
```bash
docker exec odoo-db-1 chown -R postgres:postgres /var/lib/postgresql/data
```

### Problème : Base corrompue après restore

**Solution** :
```bash
# Recréer base vide
docker exec odoo-db-1 psql -U odoo -c "DROP DATABASE odoo;"
docker exec odoo-db-1 psql -U odoo -c "CREATE DATABASE odoo;"
# Refaire restore
```

---

**Dernière mise à jour** : 2025-01-28


# 📘 Guide de Déploiement : Worker DVIG

**Date** : 2026-01-11  
**Version** : 1.0  
**SPEC** : DVIG → Vault Forwarding v1.1

---

## 📋 Vue d'Ensemble

Ce guide décrit la procédure complète de déploiement du worker DVIG pour le traitement automatique de l'outbox et le forwarding vers Vault.

---

## 🔧 Prérequis

### 1. Image DVIG avec Worker

**Version requise** : `dorevia/dvig:0.1.3` ou supérieure

**Vérification** :
```bash
docker images | grep dorevia/dvig
```

**Build si nécessaire** :
```bash
cd /opt/dorevia-plateform/sources/dvig
docker build -f docker/Dockerfile -t dorevia/dvig:0.1.3 .
```

### 2. Base de Données PostgreSQL

**Configuration** : `DATABASE_URL` doit être configurée dans `docker-compose.yml`

**Migrations requises** :
- ✅ `001_create_dvig_tokens.sql`
- ✅ `006_create_outbox_events.sql`

**Application des migrations** :
```bash
docker exec -i vault-db-core-stinger psql -U vault -d dorevia_vault < sources/dvig/migrations/001_create_dvig_tokens.sql
docker exec -i vault-db-core-stinger psql -U vault -d dorevia_vault < sources/dvig/migrations/006_create_outbox_events.sql
```

### 3. Image Vault avec Permissions

**Version requise** : `dorevia/vault:v1.3.2` ou supérieure

**Vérification** :
```bash
docker images | grep dorevia/vault
```

---

## 🚀 Déploiement

### Étape 1 : Mise à Jour docker-compose.yml

**Fichier** : `tenants/<tenant>/platform/docker-compose.yml`

```yaml
dvig:
  image: dorevia/dvig:0.1.3
  environment:
    # ... autres variables ...
    - DATABASE_URL=postgresql://vault:${VAULT_DB_PASSWORD:-vault_password}@vault-db-<tenant>:5432/dorevia_vault
```

### Étape 2 : Redémarrage du Conteneur DVIG

```bash
cd /opt/dorevia-plateform/tenants/<tenant>/platform
docker compose up -d --no-deps dvig
```

### Étape 3 : Vérification

```bash
# Vérifier que le conteneur démarre correctement
docker logs dvig-<tenant> --tail 20

# Vérifier que le worker peut être importé
docker exec dvig-<tenant> sh -c 'cd /app && python3 -c "from workers.outbox_worker import process_outbox_events; print(\"✅ Worker OK\")"'
```

---

## ⚙️ Configuration du Worker en CRON

### Option 1 : CRON dans le Conteneur (Recommandé pour Tests)

```bash
# Installer CRON dans le conteneur
docker exec -it dvig-<tenant> bash -c 'apt-get update && apt-get install -y cron'

# Configurer le CRON
docker exec -it dvig-<tenant> bash -c 'echo "*/5 * * * * cd /app && python3 -m workers.outbox_worker --limit 50 >> /var/log/dvig/worker_cron.log 2>&1" | crontab -'

# Démarrer le service CRON
docker exec -it dvig-<tenant> bash -c 'service cron start'
```

### Option 2 : CRON sur l'Hôte (Recommandé pour Production)

**Créer un script wrapper** : `/opt/dorevia-plateform/scripts/run_dvig_worker.sh`

```bash
#!/bin/bash
docker exec dvig-<tenant> sh -c 'cd /app && python3 -m workers.outbox_worker --limit 50'
```

**Configurer CRON sur l'hôte** :
```bash
# Éditer crontab
crontab -e

# Ajouter la ligne suivante (toutes les 5 minutes)
*/5 * * * * /opt/dorevia-plateform/scripts/run_dvig_worker.sh >> /var/log/dvig/worker.log 2>&1
```

### Option 3 : Service Systemd (Production)

**Créer** : `/etc/systemd/system/dvig-worker.service`

```ini
[Unit]
Description=DVIG Outbox Worker
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=/usr/bin/docker exec dvig-<tenant> sh -c 'cd /app && python3 -m workers.outbox_worker --limit 50'
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Créer le timer** : `/etc/systemd/system/dvig-worker.timer`

```ini
[Unit]
Description=DVIG Outbox Worker Timer
Requires=dvig-worker.service

[Timer]
OnCalendar=*:0/5
Persistent=true

[Install]
WantedBy=timers.target
```

**Activer** :
```bash
sudo systemctl daemon-reload
sudo systemctl enable dvig-worker.timer
sudo systemctl start dvig-worker.timer
```

---

## 🧪 Tests

### Test Manuel

```bash
# Exécuter le worker manuellement
docker exec dvig-<tenant> sh -c 'cd /app && python3 -m workers.outbox_worker --limit 10'

# Vérifier les résultats
docker exec -i vault-db-<tenant> psql -U vault -d dorevia_vault -c "
  SELECT event_id, tenant, env, status, attempt_count, created_at 
  FROM outbox_events 
  ORDER BY created_at DESC 
  LIMIT 5;
"
```

### Test avec une Facture Odoo

1. **Créer une facture dans Odoo**
2. **Valider la facture** → `dorevia_vault_status = 'todo'`
3. **Attendre le CRON #1** (ou déclencher manuellement) → `status = 'pending_proof'`
4. **Attendre le worker DVIG** (ou déclencher manuellement) → Document dans Vault
5. **Attendre le CRON #2** (ou déclencher manuellement) → `status = 'vaulted'`

---

## 📊 Monitoring

### Logs

```bash
# Logs du conteneur DVIG
docker logs dvig-<tenant> --tail 50

# Logs du worker CRON (si configuré)
docker exec dvig-<tenant> tail -f /var/log/dvig/worker_cron.log
```

### Métriques

```bash
# Vérifier le backlog
docker exec -i vault-db-<tenant> psql -U vault -d dorevia_vault -c "
  SELECT status, COUNT(*) 
  FROM outbox_events 
  GROUP BY status;
"

# Vérifier les documents dans Vault
docker exec -i vault-db-<tenant> psql -U vault -d dorevia_vault -c "
  SELECT COUNT(*) 
  FROM documents 
  WHERE source = 'odoo';
"
```

---

## 🔍 Troubleshooting

### Le Worker Ne Traite Pas d'Événements

1. **Vérifier qu'il y a des événements en attente** :
   ```sql
   SELECT COUNT(*) FROM outbox_events WHERE status = 'accepted';
   ```

2. **Vérifier la connexion à la base de données** :
   ```bash
   docker exec dvig-<tenant> sh -c 'python3 -c "from storage.database import get_db; db = next(get_db()); print(\"✅ DB OK\")"'
   ```

3. **Vérifier la connexion à Vault** :
   ```bash
   docker exec dvig-<tenant> sh -c 'curl -f http://vault-<tenant>:8080/health'
   ```

### Erreurs de Permissions

Si des erreurs de permissions apparaissent dans les logs Vault :
- Vérifier que l'image Vault est `v1.3.2` ou supérieure
- Le script d'initialisation devrait corriger automatiquement les permissions

### Erreurs SQL

Si des erreurs SQL apparaissent :
- Vérifier que toutes les migrations ont été appliquées
- Vérifier la contrainte `chk_source` (doit accepter `'odoo'` et `'dvig'`)

---

## 📚 Références

- **SPEC** : DVIG → Vault Forwarding v1.1
- **Documentation Worker** : `sources/dvig/workers/outbox_worker.py`
- **Runbook Production** : `sources/dvig/docs/RUNBOOK_PRODUCTION.md`

---

**Auteur** : Dorevia Team  
**Date** : 2026-01-11

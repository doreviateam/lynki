# 🚀 Scripts de Déploiement — SPEC v1.1.1

**Date** : 2026-01-12  
**Version** : 1.1.1  
**Phase** : Phase 2 — Déploiement Staging / Phase 4 — Déploiement Production

---

## 📋 Scripts Disponibles

### 1. Script Automatisé de Déploiement

**Fichier** : `scripts/deploy_spec_v1_1_1.sh`

**Usage** :
```bash
# Staging
./scripts/deploy_spec_v1_1_1.sh odoo_stinger_sarl-la-platine staging

# Production
./scripts/deploy_spec_v1_1_1.sh odoo_stinger_sarl-la-platine production

# Mode dry-run (simulation)
./scripts/deploy_spec_v1_1_1.sh odoo_stinger_sarl-la-platine staging --dry-run
```

**Fonctionnalités** :
- ✅ Backup automatique de la base de données
- ✅ Mise à jour du module Odoo
- ✅ Configuration des paramètres système
- ✅ Vérification CRON reconciler
- ✅ Vérification DVIG scheduler
- ✅ Redémarrage Odoo
- ✅ Validation post-déploiement

**Sécurité** :
- Mode dry-run pour simulation
- Vérification des erreurs à chaque étape
- Backup automatique avant déploiement

---

### 2. Checklist Manuelle

**Fichier** : `ZeDocs/TestV3/CHECKLIST_DEPLOIEMENT_SPEC_v1.1.1.md`

**Usage** : Suivre la checklist étape par étape pour un déploiement manuel

---

## 🔧 Commandes Manuelles

### Pré-déploiement

#### Backup Base de Données

```bash
# PostgreSQL
pg_dump -U odoo -d <database> > backup_$(date +%Y%m%d_%H%M%S).sql

# Via Docker
docker exec -e PGPASSWORD=odoo postgres_<tenant> \
  pg_dump -U odoo -d <database> > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Vérification Configuration Odoo

```bash
# Vérifier odoo.conf
cat /etc/odoo/odoo.conf | grep -E "server_wide_modules|workers|channels"

# Doit contenir :
# server_wide_modules = web,queue_job
# workers = 2 (ou 4 pour production)
# channels = root:2,dorevia_vault:2
```

### Déploiement

#### Mise à jour Module Odoo

```bash
# Via Docker
docker exec odoo_stinger_<tenant> \
  odoo -c /etc/odoo/odoo.conf -d <database> \
  -u dorevia_vault_connector --stop-after-init

# Vérifier les erreurs
docker logs odoo_stinger_<tenant> --tail 50 | grep -i error
```

#### Configuration Paramètres Système

```python
# Dans Odoo shell
env = odoo.env

# Flag PROD (obligatoire)
env['ir.config_parameter'].sudo().set_param('dorevia.debug.actions', '0')  # PROD
# ou
env['ir.config_parameter'].sudo().set_param('dorevia.debug.actions', '1')  # DEV/STAGING

# Seuils d'abandon (optionnel)
env['ir.config_parameter'].sudo().set_param('dorevia.vault.max_attempts_proof', '20')
env['ir.config_parameter'].sudo().set_param('dorevia.vault.max_age_pending_proof_hours', '24')

# Vérifier configuration existante
print(env['ir.config_parameter'].sudo().get_param('dorevia.dvig.internal.token'))
print(env['ir.config_parameter'].sudo().get_param('dorevia.vault.url'))
print(env['ir.config_parameter'].sudo().get_param('dorevia.vault.token'))
```

#### Vérification CRON Reconciler

```python
# Dans Odoo shell
cron = env['ir.cron'].search([('name', '=', 'Vault Reconciler (Addendum v1.1.1-add1)')])
print(f"CRON trouvé: {cron.exists()}")
print(f"CRON actif: {cron.active}")
print(f"Intervalle: {cron.interval_number} {cron.interval_type}")

# Activer si nécessaire
if not cron.active:
    cron.active = True
    print("CRON activé")
```

#### Vérification DVIG Scheduler

```bash
# Vérifier variables d'environnement
docker exec dvig-core-stinger env | grep DVIG_SCHEDULER

# Doit afficher :
# DVIG_SCHEDULER_ENABLED=1
# DVIG_SCHEDULER_INTERVAL=30
# DVIG_SCHEDULER_LIMIT=50

# Vérifier logs scheduler
docker logs dvig-core-stinger --tail 50 | grep -i "scheduler\|outbox_worker_start"
```

#### Redémarrage Odoo

```bash
# Redémarrer
docker restart odoo_stinger_<tenant>

# Vérifier démarrage
docker logs odoo_stinger_<tenant> --tail 50 | grep -i "jobrunner\|queue_job"
```

### Validation Post-Déploiement

#### Test Flag PROD

```python
# Dans Odoo shell
env['ir.config_parameter'].sudo().set_param('dorevia.debug.actions', '0')
invoice = env['account.move'].search([('dorevia_vault_status', '=', 'pending_proof')], limit=1)
if invoice:
    invoice._compute_debug_enabled()
    assert invoice.dorevia_debug_enabled == False, "Boutons doivent être masqués"
    print("✅ Flag PROD correct")
```

#### Test CRON Reconciler

```python
# Dans Odoo shell
# Créer une facture en pending_proof avec next_retry_at dans le passé
from datetime import datetime, timedelta
invoice = env['account.move'].create({...})
invoice.write({
    'dorevia_vault_status': 'pending_proof',
    'dorevia_vault_next_retry_at': datetime.now() - timedelta(minutes=5),
})

# Exécuter CRON reconciler
env['account.move'].cron_vault_reconciler()

# Vérifier qu'un job a été enqueued
jobs = env['queue.job'].search([
    ('method_name', '=', 'job_vault_fetch_proof'),
    ('state', 'in', ['pending', 'enqueued', 'started']),
])
print(f"✅ Jobs fetch_proof enqueued: {len(jobs)}")
```

#### Test Happy Path

```python
# Dans Odoo shell
import time
from datetime import datetime

# Créer et poster une facture
invoice = env['account.move'].create({...})
start_time = time.time()
invoice.action_post()

# Attendre vaulted
max_wait = 30
elapsed = 0
while invoice.dorevia_vault_status != 'vaulted' and elapsed < max_wait:
    time.sleep(1)
    elapsed = time.time() - start_time
    env.cr.commit()
    invoice.refresh()

if invoice.dorevia_vault_status == 'vaulted':
    print(f"✅ Facture vaulted en {elapsed:.2f}s")
else:
    print(f"⚠️  Statut: {invoice.dorevia_vault_status} après {elapsed:.2f}s")
```

---

## 🔄 Plan de Rollback

### Si Problème Détecté

#### 1. Arrêter Odoo

```bash
docker stop odoo_stinger_<tenant>
```

#### 2. Restaurer Backup

```bash
# Restaurer backup
psql -U odoo -d <database> < backup_YYYYMMDD_HHMMSS.sql

# Ou via Docker
docker exec -i -e PGPASSWORD=odoo postgres_<tenant> \
  psql -U odoo -d <database> < backup_YYYYMMDD_HHMMSS.sql
```

#### 3. Désactiver CRON Reconciler

```python
# Dans Odoo shell
cron = env['ir.cron'].search([('name', '=', 'Vault Reconciler')])
cron.active = False
```

#### 4. Redémarrer Odoo

```bash
docker start odoo_stinger_<tenant>
```

---

## 📊 Validation Continue

### Surveillance 24h Post-Déploiement

#### Métriques à Surveiller

```bash
# Backlog DVIG
curl http://dvig:8080/metrics | grep dvig_outbox_backlog

# Taux de succès
curl http://dvig:8080/metrics | grep dvig_forward_success_total

# Erreurs
curl http://dvig:8080/metrics | grep dvig_forward_failed

# Jobs queue_job
# Dans Odoo : Apps → Queue Jobs → Vérifier les jobs en attente
```

#### Logs à Surveiller

```bash
# Logs Odoo
docker logs odoo_stinger_<tenant> --tail 100 | grep -i "job_vault_fetch_proof\|job_trigger_worker\|cron_vault_reconciler"

# Logs DVIG
docker logs dvig-core-stinger --tail 100 | grep -i "scheduler\|internal_trigger\|outbox_worker"
```

#### Alertes à Configurer

- ⚠️ Backlog DVIG > 1000
- ⚠️ Taux d'erreur > 5%
- ⚠️ Latence p95 > 60s
- ⚠️ Factures failed_hard > 0.1%

---

## 🔗 Références

- **Checklist déploiement** : `ZeDocs/TestV3/CHECKLIST_DEPLOIEMENT_SPEC_v1.1.1.md`
- **Plan d'implémentation** : `ZeDocs/TestV3/PLAN_IMPLEMENTATION_SPEC_v1.1.1.md`
- **SPEC v1.1.1** : `ZeDocs/TestV3/SPEC_ORCHESTRATION_TEMPS_REEL_QUEUE_JOB_Odoo_DVIG_Vault_v1.1.1.md`

---

**Date de création** : 2026-01-12  
**Version** : 1.0

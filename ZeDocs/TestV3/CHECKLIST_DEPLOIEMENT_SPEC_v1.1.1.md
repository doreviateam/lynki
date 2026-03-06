# ✅ Checklist de Déploiement — SPEC v1.1.1

**Date** : 2026-01-12  
**Version** : 1.1.1  
**Environnement** : Staging / Production  
**Phase** : Phase 2 — Déploiement Staging / Phase 4 — Déploiement Production

---

## 📋 Pré-déploiement

### Vérifications Générales

- [ ] **Tests fonctionnels** : Tous les tests de la Phase 1 passent
- [ ] **Code compilé** : Aucune erreur de syntaxe Python
- [ ] **Documentation** : Runbooks mis à jour (Phase 3 terminée)
- [ ] **Backup** : Backup de la base de données Odoo effectué
- [ ] **Maintenance window** : Fenêtre de maintenance planifiée (si production)

### Vérifications Odoo

- [ ] **Module queue_job** : Installé et configuré
- [ ] **Configuration odoo.conf** : 
  - [ ] `server_wide_modules = web,queue_job`
  - [ ] `workers >= 2` (recommandé: 4 pour production)
  - [ ] `channels = root:2,dorevia_vault:2`
- [ ] **Paramètres système existants** :
  - [ ] `dorevia.dvig.internal.token` configuré
  - [ ] `dorevia.vault.url` configuré
  - [ ] `dorevia.vault.token` configuré

### Vérifications DVIG

- [ ] **DVIG accessible** : Endpoint `/internal/outbox/process` accessible depuis Odoo
- [ ] **Token interne** : `DVIG_INTERNAL_TOKEN` configuré
- [ ] **Scheduler activé** : 
  - [ ] `DVIG_SCHEDULER_ENABLED=1`
  - [ ] `DVIG_SCHEDULER_INTERVAL=30`
  - [ ] `DVIG_SCHEDULER_LIMIT=50`

### Vérifications Vault

- [ ] **Vault accessible** : API `/api/v1/proof/account_move/{id}` accessible
- [ ] **Token Vault** : Token d'authentification configuré dans Odoo

---

## 🚀 Déploiement

### Étape 1 : Mise à jour Module Odoo

- [ ] **Backup base de données** :
  ```bash
  pg_dump -U odoo -d <database> > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Mettre à jour le module** :
  ```bash
  odoo -c /etc/odoo/odoo.conf -d <database> -u dorevia_vault_connector --stop-after-init
  ```

- [ ] **Vérifier les migrations** :
  ```bash
  # Vérifier qu'aucune erreur n'est apparue
  tail -n 50 /var/log/odoo/odoo.log | grep -i error
  ```

### Étape 2 : Configuration Paramètres Système

- [ ] **Flag PROD (obligatoire)** :
  ```python
  # Dans Odoo : Paramètres → Technique → Paramètres → Paramètres Système
  # PROD
  dorevia.debug.actions = 0
  
  # DEV/STAGING
  dorevia.debug.actions = 1
  ```

- [ ] **Seuils d'abandon (optionnel, valeurs par défaut)** :
  ```python
  dorevia.vault.max_attempts_proof = 20
  dorevia.vault.max_age_pending_proof_hours = 24
  ```

- [ ] **Vérifier configuration existante** :
  ```python
  # Vérifier que ces paramètres existent
  dorevia.dvig.internal.url = <url>  # Optionnel si DNS interne
  dorevia.dvig.internal.token = <token>
  dorevia.vault.url = <url>
  dorevia.vault.token = <token>
  ```

### Étape 3 : Vérification CRON Reconciler

- [ ] **Vérifier que le CRON est actif** :
  ```python
  # Dans Odoo shell
  cron = env['ir.cron'].search([('name', '=', 'Vault Reconciler (Addendum v1.1.1-add1)')])
  assert cron.exists(), "CRON reconciler non trouvé"
  assert cron.active, "CRON reconciler doit être actif"
  assert cron.interval_number == 3, "Intervalle doit être 3 minutes"
  assert cron.interval_type == 'minutes', "Type d'intervalle doit être 'minutes'"
  ```

- [ ] **Vérifier la méthode** :
  ```python
  # Vérifier que la méthode existe
  assert hasattr(env['account.move'], 'cron_vault_reconciler'), \
      "Méthode cron_vault_reconciler non trouvée"
  ```

### Étape 4 : Vérification DVIG Scheduler

- [ ] **Vérifier variables d'environnement DVIG** :
  ```bash
  docker exec dvig-core-stinger env | grep DVIG_SCHEDULER
  # Doit afficher :
  # DVIG_SCHEDULER_ENABLED=1
  # DVIG_SCHEDULER_INTERVAL=30
  # DVIG_SCHEDULER_LIMIT=50
  ```

- [ ] **Vérifier logs DVIG** :
  ```bash
  docker logs dvig-core-stinger --tail 50 | grep -i scheduler
  # Doit afficher des logs de scheduler
  ```

### Étape 5 : Redémarrage Services

- [ ] **Redémarrer Odoo** :
  ```bash
  docker restart odoo_stinger_<tenant>
  # ou
  systemctl restart odoo
  ```

- [ ] **Vérifier que Odoo démarre correctement** :
  ```bash
  docker logs odoo_stinger_<tenant> --tail 50 | grep -i error
  # Ne doit pas afficher d'erreurs critiques
  ```

- [ ] **Vérifier que queue_job est actif** :
  ```bash
  docker logs odoo_stinger_<tenant> --tail 100 | grep -i "jobrunner\|queue_job"
  # Doit afficher des messages de jobrunner
  ```

---

## ✅ Validation Post-Déploiement

### Vérifications Immédiates

- [ ] **Boutons debug masqués en PROD** :
  ```python
  # Dans Odoo shell
  env['ir.config_parameter'].sudo().set_param('dorevia.debug.actions', '0')
  invoice = env['account.move'].search([('dorevia_vault_status', '=', 'pending_proof')], limit=1)
  if invoice:
      invoice._compute_debug_enabled()
      assert invoice.dorevia_debug_enabled == False, "Boutons doivent être masqués en PROD"
  ```

- [ ] **CRON reconciler actif** :
  ```python
  # Dans Odoo shell
  cron = env['ir.cron'].search([('name', '=', 'Vault Reconciler')])
  assert cron.active, "CRON reconciler doit être actif"
  ```

- [ ] **DVIG scheduler actif** :
  ```bash
  docker logs dvig-core-stinger --tail 20 | grep -i "scheduler\|outbox_worker_start"
  # Doit afficher des logs périodiques
  ```

### Tests Fonctionnels

- [ ] **Test Happy Path** : Post facture → `vaulted` en < 15s
- [ ] **Test Filet #1** : Vérifier que DVIG scheduler traite l'outbox
- [ ] **Test Filet #2** : Vérifier que CRON reconciler rattrape les factures bloquées
- [ ] **Test Seuils** : Vérifier que les seuils d'abandon fonctionnent
- [ ] **Test Anti-duplication** : Vérifier qu'il n'y a pas de doublons

### Métriques et Logs

- [ ] **Métriques Prometheus** :
  ```bash
  curl http://dvig:8080/metrics | grep dvig_internal_trigger
  curl http://dvig:8080/metrics | grep dvig_outbox_backlog
  ```

- [ ] **Logs structurés** :
  ```bash
  # Vérifier logs Odoo
  docker logs odoo_stinger_<tenant> --tail 100 | grep -i "job_vault_fetch_proof\|job_trigger_worker"
  
  # Vérifier logs DVIG
  docker logs dvig-core-stinger --tail 100 | grep -i "internal_trigger\|scheduler"
  ```

---

## 🔄 Plan de Rollback

### Si Problème Détecté

- [ ] **Arrêter Odoo** :
  ```bash
  docker stop odoo_stinger_<tenant>
  ```

- [ ] **Restaurer backup base de données** :
  ```bash
  psql -U odoo -d <database> < backup_YYYYMMDD_HHMMSS.sql
  ```

- [ ] **Désactiver CRON reconciler** :
  ```python
  # Dans Odoo shell
  cron = env['ir.cron'].search([('name', '=', 'Vault Reconciler')])
  cron.active = False
  ```

- [ ] **Redémarrer Odoo** :
  ```bash
  docker start odoo_stinger_<tenant>
  ```

---

## 📊 Checklist de Conformité Finale

- [ ] Tous les tests fonctionnels passent
- [ ] Boutons debug masqués en PROD (`dorevia.debug.actions = 0`)
- [ ] CRON reconciler actif
- [ ] DVIG scheduler actif
- [ ] Paramètres système configurés
- [ ] Métriques et logs vérifiés
- [ ] Latence < 15s (p50) validée
- [ ] Filets de sécurité fonctionnent
- [ ] Aucun incident détecté

---

## 🔗 Références

- **Plan d'implémentation** : `ZeDocs/TestV3/PLAN_IMPLEMENTATION_SPEC_v1.1.1.md`
- **SPEC v1.1.1** : `ZeDocs/TestV3/SPEC_ORCHESTRATION_TEMPS_REEL_QUEUE_JOB_Odoo_DVIG_Vault_v1.1.1.md`
- **Scripts de tests** : `ZeDocs/TestV3/SCRIPTS_TESTS_SPEC_v1.1.1.md`

---

**Date de création** : 2026-01-12  
**Version** : 1.0

# 🔍 Guide de Surveillance — Test Facture SPEC v1.1.1

**Date** : 2026-01-12  
**Environnement** : Staging (sarl-la-platine)  
**Objectif** : Surveiller le processus de vaulting d'une facture en temps réel

---

## 📋 Checklist Pré-Test

- [ ] Facture créée dans Odoo
- [ ] Facture validée (état `posted`)
- [ ] Surveillance activée (logs, métriques)

---

## 🔍 Commandes de Surveillance

### 1. Vérifier l'État de la Facture dans Odoo

**Via Interface Odoo** :
1. Ouvrir la facture validée
2. Vérifier le champ **"Dorevia Vault Status"** :
   - `todo` → Facture en attente de vaulting
   - `pending_proof` → Facture envoyée, en attente du proof
   - `vaulted` → ✅ Facture vaultée avec succès
   - `failed_soft` → Erreur temporaire (retry automatique)
   - `failed_hard` → Erreur définitive (intervention requise)

**Via SQL** :
```bash
docker exec odoo_db_stinger_sarl-la-platine psql -U odoo -d odoo_stinger_sarl-la-platine -c "
SELECT 
    name,
    state,
    dorevia_vault_status,
    dorevia_vault_attempt_count,
    dorevia_vault_last_try_at,
    dorevia_vault_proof_hash,
    dorevia_vault_proof_url
FROM account_move 
WHERE name = 'FAC/2026/XXXXX'  -- Remplacer par le numéro de facture
ORDER BY create_date DESC 
LIMIT 1;
"
```

### 2. Surveiller les Logs Odoo

**Queue Jobs** :
```bash
# Voir les jobs en cours
docker exec odoo_db_stinger_sarl-la-platine psql -U odoo -d odoo_stinger_sarl-la-platine -c "
SELECT 
    id,
    name,
    state,
    priority,
    date_created,
    date_started,
    date_done,
    result
FROM queue_job 
WHERE name LIKE '%vault%' OR name LIKE '%proof%'
ORDER BY date_created DESC 
LIMIT 10;
"
```

**Logs Odoo en temps réel** :
```bash
docker logs -f odoo_stinger_sarl-la-platine | grep -E "vault|proof|dorevia|queue_job"
```

### 3. Surveiller les Logs DVIG

**Logs DVIG en temps réel** :
```bash
docker logs -f dvig-core-stinger | grep -E "outbox|forward|vault|source_id"
```

**Métriques Prometheus DVIG** :
```bash
# Backlog outbox
curl -s http://localhost:8080/metrics | grep dvig_outbox_backlog

# Taux de succès
curl -s http://localhost:8080/metrics | grep dvig_forward_success_total

# Erreurs
curl -s http://localhost:8080/metrics | grep dvig_forward_failed
```

### 4. Vérifier les Événements DVIG Outbox

**Via API DVIG** (si disponible) :
```bash
# Vérifier les événements en attente
curl -H "Authorization: Bearer <TOKEN>" \
  https://dvig.core-stinger.doreviateam.com/api/outbox/pending
```

---

## ⏱️ Timeline Attendue

### Happy Path (< 15 secondes)

1. **T+0s** : Facture validée → `dorevia_vault_status = 'todo'`
2. **T+1s** : Job `job_trigger_worker` enqueued
3. **T+2s** : Job `job_trigger_worker` exécuté → Appel DVIG `/internal/outbox/process`
4. **T+3s** : DVIG traite l'événement → Forward vers Vault
5. **T+5s** : Vault répond avec `proof_hash` et `proof_url`
6. **T+6s** : Job `job_vault_fetch_proof` enqueued
7. **T+8s** : Job `job_vault_fetch_proof` exécuté → Récupération du proof
8. **T+10s** : Proof récupéré → `dorevia_vault_status = 'vaulted'` ✅

### Filets de Sécurité

- **DVIG Scheduler** : Vérifie l'outbox toutes les 30s
- **CRON Send DVIG** : Vérifie les factures `todo` toutes les 5 min
- **CRON Fetch Proof** : Vérifie les factures `pending_proof` toutes les 5 min

---

## 🔍 Points de Contrôle

### Contrôle 1 : Facture Validée

**Vérifier** :
```sql
SELECT name, state, dorevia_vault_status 
FROM account_move 
WHERE name = 'FAC/2026/XXXXX';
```

**Attendu** : `state = 'posted'`, `dorevia_vault_status = 'todo'`

### Contrôle 2 : Job Trigger Worker

**Vérifier** :
```sql
SELECT name, state, date_created, date_started, date_done
FROM queue_job 
WHERE name LIKE '%trigger_worker%'
ORDER BY date_created DESC 
LIMIT 1;
```

**Attendu** : Job créé dans les 2s, exécuté dans les 5s

### Contrôle 3 : Événement DVIG

**Vérifier** : Logs DVIG
```bash
docker logs dvig-core-stinger --tail 50 | grep -E "internal_trigger|outbox_worker"
```

**Attendu** : Log `internal_trigger_authenticated` ou `outbox_worker_start`

### Contrôle 4 : Forward vers Vault

**Vérifier** : Logs DVIG
```bash
docker logs dvig-core-stinger --tail 50 | grep -E "forward|vault|proof"
```

**Attendu** : Log `forward_success` avec `proof_hash`

### Contrôle 5 : Job Fetch Proof

**Vérifier** :
```sql
SELECT name, state, date_created, date_started, date_done, result
FROM queue_job 
WHERE name LIKE '%fetch_proof%'
ORDER BY date_created DESC 
LIMIT 1;
```

**Attendu** : Job créé après forward, exécuté dans les 5s

### Contrôle 6 : Facture Vaultée

**Vérifier** :
```sql
SELECT 
    name,
    dorevia_vault_status,
    dorevia_vault_proof_hash,
    dorevia_vault_proof_url,
    dorevia_vault_attempt_count
FROM account_move 
WHERE name = 'FAC/2026/XXXXX';
```

**Attendu** : `dorevia_vault_status = 'vaulted'`, `proof_hash` et `proof_url` remplis

---

## 🚨 Dépannage

### Problème : Facture reste en `todo`

**Vérifier** :
1. Jobs `queue_job` : Y a-t-il un job `trigger_worker` ?
2. Logs Odoo : Erreurs dans les logs ?
3. DVIG Scheduler : Actif ? (logs toutes les 30s)

**Solution** : Attendre le filet de sécurité (DVIG scheduler ou CRON)

### Problème : Facture reste en `pending_proof`

**Vérifier** :
1. Jobs `queue_job` : Y a-t-il un job `fetch_proof` ?
2. Logs DVIG : Le forward a-t-il réussi ?
3. Vault : Le proof est-il disponible ?

**Solution** : Attendre le filet de sécurité (CRON Fetch Proof)

### Problème : Facture en `failed_soft`

**Vérifier** :
1. Logs Odoo : Quelle erreur ?
2. Logs DVIG : Problème de connexion ?
3. Vault : Service disponible ?

**Solution** : Retry automatique avec backoff intelligent

### Problème : Facture en `failed_hard`

**Vérifier** :
1. Seuils d'abandon : `max_attempts_proof` ou `max_age_pending_proof_hours` dépassés ?
2. Logs : Erreur définitive ?

**Solution** : Intervention manuelle requise (diagnostic)

---

## 📊 Métriques à Surveiller

### Latence

- **Temps total** : De `todo` à `vaulted` (< 15s attendu)
- **Temps trigger** : De validation à `pending_proof` (< 5s attendu)
- **Temps proof** : De `pending_proof` à `vaulted` (< 10s attendu)

### Taux de Succès

- **Happy path** : 100% en < 15s
- **Avec retry** : 100% en < 60s
- **Échecs** : 0% (sauf problème externe)

### Backlog

- **Outbox DVIG** : 0 événements en attente
- **Queue Jobs** : 0 jobs en attente

---

## ✅ Checklist Post-Test

- [ ] Facture vaultée (`dorevia_vault_status = 'vaulted'`)
- [ ] Proof hash présent (`dorevia_vault_proof_hash` rempli)
- [ ] Proof URL présent (`dorevia_vault_proof_url` rempli)
- [ ] Latence < 15s (happy path)
- [ ] Aucune erreur dans les logs
- [ ] Métriques normales

---

## 📝 Notes

- Le système utilise plusieurs filets de sécurité pour garantir le vaulting
- En cas de problème, le système retry automatiquement avec backoff intelligent
- Les logs structurés permettent un diagnostic rapide
- Les métriques Prometheus permettent une surveillance continue

---

**Date** : 2026-01-12  
**Version** : SPEC v1.1.1

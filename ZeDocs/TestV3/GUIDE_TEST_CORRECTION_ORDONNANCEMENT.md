# 🧪 Guide de Test — Correction Ordonnancement v1.1.1

**Date** : 2026-01-12  
**Objectif** : Valider la correction du problème d'ordonnancement

---

## ✅ Module Mis à Jour

- ✅ **Module** : `dorevia_vault_connector` mis à jour
- ✅ **Correction** : `job_trigger_worker` envoie maintenant d'abord vers `/ingest`
- ✅ **Odoo** : Redémarré et opérationnel

---

## 🧪 Test à Effectuer

### 1. Créer une Nouvelle Facture

1. Aller dans Odoo → **Facturation** → **Clients** → **Factures**
2. Créer une nouvelle facture
3. Ajouter des lignes de facture
4. **Valider la facture** (bouton "Valider")

### 2. Surveiller le Processus

**Option 1 : Script automatique** (Recommandé)
```bash
# Attendre que la facture soit créée, puis :
./scripts/surveillance_facture.sh FAC/2026/XXXXX
```

**Option 2 : Commandes manuelles**
```bash
# Vérifier l'état
docker exec odoo_db_stinger_sarl-la-platine psql -U odoo -d odoo_stinger_sarl-la-platine -c "
SELECT name, state, dorevia_vault_status, dorevia_dvig_event_id 
FROM account_move 
WHERE name = 'FAC/2026/XXXXX';
"

# Voir les jobs
docker exec odoo_db_stinger_sarl-la-platine psql -U odoo -d odoo_stinger_sarl-la-platine -c "
SELECT name, state, date_created, date_started, date_done
FROM queue_job 
WHERE (name LIKE '%trigger%' OR name LIKE '%proof%')
  AND date_created > NOW() - INTERVAL '2 minutes'
ORDER BY date_created DESC;
"
```

### 3. Surveiller les Logs

**Logs Odoo** :
```bash
docker logs -f odoo_stinger_sarl-la-platine | grep -E "job_trigger_worker|ingest|outbox|facture"
```

**Logs DVIG** :
```bash
docker logs -f dvig-core-stinger | grep -E "ingest|outbox|forward|vault"
```

---

## ⏱️ Timeline Attendue (Corrigée)

### Happy Path (< 15 secondes)

1. **T+0s** : Facture validée → `status = 'todo'`
2. **T+1s** : `job_trigger_worker` enqueued
3. **T+2s** : `job_trigger_worker` exécuté
   - ✅ **Envoi vers `/ingest`** (NOUVEAU)
   - ✅ `status = 'pending_proof'` + `event_id` stocké
4. **T+3s** : Traitement outbox avec `/internal/outbox/process`
5. **T+4s** : Forward vers Vault
6. **T+5s** : `job_vault_fetch_proof` enqueued
7. **T+8s** : `job_vault_fetch_proof` exécuté
8. **T+10s** : `status = 'vaulted'` ✅

---

## 🔍 Points de Contrôle

### Contrôle 1 : Envoi vers /ingest

**Vérifier dans les logs Odoo** :
```
job_trigger_worker: Envoi de X facture(s) en 'todo' vers DVIG /ingest
job_trigger_worker: Envoi facture FAC/2026/XXXXX vers DVIG /ingest
job_trigger_worker: Facture FAC/2026/XXXXX envoyée avec succès vers DVIG (event_id: ...)
```

**Vérifier dans les logs DVIG** :
```
"event": "ingest_event_accepted"
```

### Contrôle 2 : Traitement Outbox

**Vérifier dans les logs Odoo** :
```
Déclenchement worker DVIG via .../internal/outbox/process
Worker DVIG déclenché avec succès : processed=1, succeeded=1
```

**Vérifier dans les logs DVIG** :
```
"event": "outbox_worker_start"
"event": "outbox_event_forwarded"
```

### Contrôle 3 : Enchaînement fetch_proof

**Vérifier dans les logs Odoo** :
```
job_trigger_worker: Enqueued fetch_proof pour FAC/2026/XXXXX
```

**Vérifier dans la base** :
```sql
SELECT name, state FROM queue_job 
WHERE name LIKE '%fetch_proof%' 
  AND date_created > NOW() - INTERVAL '2 minutes';
```

### Contrôle 4 : Facture Vaultée

**Vérifier** :
```sql
SELECT name, dorevia_vault_status, dorevia_dvig_event_id, dorevia_vault_id
FROM account_move 
WHERE name = 'FAC/2026/XXXXX';
```

**Attendu** : `dorevia_vault_status = 'vaulted'`

---

## ✅ Checklist de Validation

- [ ] Facture créée et validée
- [ ] `job_trigger_worker` enqueued immédiatement
- [ ] Log "Envoi vers DVIG /ingest" présent
- [ ] `status = 'pending_proof'` avec `event_id` dans les 2-3 secondes
- [ ] Log "Worker DVIG déclenché avec succès" avec `processed > 0`
- [ ] `job_vault_fetch_proof` enqueued automatiquement
- [ ] `status = 'vaulted'` dans les 10-15 secondes
- [ ] Latence totale < 15 secondes

---

## 🚨 Dépannage

### Problème : Pas de log "Envoi vers /ingest"

**Vérifier** :
- Le module a bien été mis à jour
- Les factures sont bien en `todo`
- La configuration DVIG est présente

### Problème : Outbox toujours vide

**Vérifier** :
- L'envoi vers `/ingest` a réussi (logs)
- L'`event_id` est stocké
- Attendre quelques secondes pour que DVIG traite l'outbox

### Problème : `job_vault_fetch_proof` non enqueued

**Vérifier** :
- Le forward vers Vault a réussi (logs DVIG)
- Les `forwarded_source_ids` sont présents dans la réponse
- Les logs Odoo montrent "Enqueued fetch_proof"

---

**Date** : 2026-01-12  
**Statut** : ✅ **PRÊT POUR TEST**

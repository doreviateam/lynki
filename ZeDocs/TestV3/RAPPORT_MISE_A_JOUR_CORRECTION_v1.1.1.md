# ✅ Rapport Mise à Jour — Correction Ordonnancement v1.1.1

**Date** : 2026-01-12  
**Correction** : Problème d'ordonnancement `job_trigger_worker`  
**Statut** : ✅ **MODULE MIS À JOUR**

---

## 🔧 Mise à Jour Effectuée

### Module Mis à Jour

- ✅ **Module** : `dorevia_vault_connector`
- ✅ **Correction** : `job_trigger_worker` envoie maintenant d'abord les événements vers `/ingest` avant de traiter l'outbox
- ✅ **Fichier modifié** : `models/dorevia_dvig_service.py`

### Changements

**Avant** :
- `job_trigger_worker` traitait directement l'outbox (vide)
- Les événements étaient envoyés plus tard par CRON #1

**Après** :
- `job_trigger_worker` envoie d'abord les factures en `todo` vers `/ingest`
- Puis traite l'outbox avec `/internal/outbox/process`
- Puis enchaîne `job_vault_fetch_proof`

---

## 🧪 Test à Effectuer

### Créer une Nouvelle Facture

1. Créer une facture dans Odoo
2. Valider la facture (état `posted`)
3. Surveiller avec le script : `./scripts/surveillance_facture.sh FAC/2026/XXXXX`

### Résultat Attendu

- **T+0s** : Facture validée → `status = 'todo'`
- **T+1s** : `job_trigger_worker` enqueued
- **T+2s** : `job_trigger_worker` exécuté → Envoi vers `/ingest`
- **T+3s** : `status = 'pending_proof'` + `event_id` stocké
- **T+4s** : Traitement outbox → Forward vers Vault
- **T+5s** : `job_vault_fetch_proof` enqueued
- **T+8s** : `status = 'vaulted'` ✅

**Latence attendue** : < 15 secondes

---

## 📊 Vérifications

### Logs à Surveiller

```bash
# Logs Odoo
docker logs -f odoo_stinger_sarl-la-platine | grep -E "job_trigger_worker|ingest|outbox"

# Logs DVIG
docker logs -f dvig-core-stinger | grep -E "ingest|outbox|forward"
```

### Commandes de Vérification

```bash
# État de la facture
docker exec odoo_db_stinger_sarl-la-platine psql -U odoo -d odoo_stinger_sarl-la-platine -c "
SELECT name, state, dorevia_vault_status, dorevia_dvig_event_id 
FROM account_move 
WHERE name = 'FAC/2026/XXXXX';
"

# Jobs queue
docker exec odoo_db_stinger_sarl-la-platine psql -U odoo -d odoo_stinger_sarl-la-platine -c "
SELECT name, state, date_created, date_started, date_done
FROM queue_job 
WHERE (name LIKE '%trigger%' OR name LIKE '%proof%')
  AND date_created > NOW() - INTERVAL '5 minutes'
ORDER BY date_created DESC;
"
```

---

**Date** : 2026-01-12  
**Statut** : ✅ **PRÊT POUR TEST**

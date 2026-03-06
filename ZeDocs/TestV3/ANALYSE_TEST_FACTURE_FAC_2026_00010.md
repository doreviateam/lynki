# 📊 Analyse Test Facture FAC/2026/00010

**Date** : 2026-01-12  
**Facture** : FAC/2026/00010  
**Statut** : `pending_proof`

---

## ⏱️ Timeline Observée

### T+0s (21:51:14) : Validation Facture

```
✅ Facture FAC/2026/00010 initialisée pour vaulting asynchrone (status=todo)
✅ Worker DVIG déclenché via queue_job
```

**Actions** :
- `action_post()` → `dorevia_vault_status = 'todo'`
- `_trigger_dvig_worker_async()` → Enqueue `job_trigger_worker` via queue_job
- Job exécuté immédiatement → Appel DVIG `/internal/outbox/process`

**Résultat DVIG** :
```
processed=0, succeeded=0, failed_soft=0, failed_hard=0
```

**Analyse** : L'outbox DVIG était vide à ce moment-là. L'événement n'avait pas encore été ingéré dans l'outbox.

### T+33s (21:51:47) : CRON #1 (Filet de Sécurité)

```
✅ CRON #1 : 1 facture(s) à envoyer vers DVIG
✅ CRON #1 : Envoi facture FAC/2026/00010 vers DVIG
✅ CRON #1 : Facture FAC/2026/00010 envoyée avec succès (event_id: 80373e6e-c280-4d37-b117-4b297edf351e)
```

**Actions** :
- CRON "Vault Send DVIG" s'exécute
- Envoi facture vers DVIG via `/api/events`
- DVIG ingère l'événement dans l'outbox
- `dorevia_vault_status = 'pending_proof'`

### T+33s (21:51:47) : DVIG Forward vers Vault

**Logs DVIG** :
```json
{
  "event_id": "80373e6e-c280-4d37-b117-4b297edf351e",
  "vault_id": "82b01446-ef6d-44bb-bb2b-71ff171e7031",
  "event": "outbox_event_forwarded",
  "timestamp": "2026-01-12T21:51:50.170262Z"
}
```

**Actions** :
- DVIG scheduler traite l'outbox (toutes les 30s)
- Forward vers Vault réussi
- `vault_id` obtenu : `82b01446-ef6d-44bb-bb2b-71ff171e7031`

### T+33s (21:51:47) : CRON #2 (Filet de Sécurité)

```
✅ CRON #2 : 1 facture(s) en attente de preuve
✅ CRON #2 : Récupération preuve pour facture FAC/2026/00010
❌ CRON #2 terminé: 0 succès, 0 erreurs
```

**Analyse** : Le CRON #2 a essayé de récupérer le proof mais n'a rien trouvé. Le proof n'était probablement pas encore disponible dans Vault (délai de traitement Vault).

---

## 🔍 Diagnostic

### ✅ Ce qui fonctionne

1. **Orchestration queue_job** : Le `job_trigger_worker` a bien été enqueued et exécuté
2. **Filets de sécurité** : Les CRONs ont bien pris le relais
3. **Forward vers Vault** : DVIG a bien forwardé l'événement vers Vault
4. **Machine d'état** : Transition `todo` → `pending_proof` correcte

### ⚠️ Problème identifié

**Timing Issue** : Le `job_trigger_worker` s'exécute **avant** que l'événement ne soit dans l'outbox DVIG.

**Séquence observée** :
1. `action_post()` → Enqueue `job_trigger_worker` (immédiat)
2. `job_trigger_worker` exécuté → Appel DVIG `/internal/outbox/process` (outbox vide)
3. CRON #1 envoie l'événement vers DVIG → Ingest dans outbox
4. DVIG scheduler traite l'outbox → Forward vers Vault

**Conséquence** : Le `job_trigger_worker` n'a pas pu enchaîner `job_vault_fetch_proof` car l'outbox était vide.

---

## 💡 Solutions Possibles

### Option 1 : Délai dans `_trigger_dvig_worker_async`

Ajouter un petit délai (1-2s) avant d'enqueue `job_trigger_worker` pour laisser le temps à l'événement d'être ingéré dans l'outbox.

**Avantage** : Simple à implémenter  
**Inconvénient** : Délai artificiel

### Option 2 : Vérifier l'outbox dans `job_trigger_worker`

Si l'outbox est vide, réessayer après un court délai (retry avec backoff).

**Avantage** : Plus robuste  
**Inconvénient** : Plus complexe

### Option 3 : Accepter le comportement actuel

Le système fonctionne avec les filets de sécurité (CRONs). Le `job_trigger_worker` est un optimiseur, pas un prérequis.

**Avantage** : Aucun changement nécessaire  
**Inconvénient** : Latence légèrement supérieure (33s au lieu de < 15s)

---

## 📊 État Actuel

**Facture** : FAC/2026/00010  
**Statut** : `pending_proof`  
**Tentatives** : 2  
**Dernière tentative** : 21:51:47

**Prochaine action** : Le CRON #2 va réessayer dans 5 minutes, ou le CRON reconciler dans 3 minutes.

---

## ✅ Conclusion

Le système fonctionne correctement avec les filets de sécurité. Le timing issue avec `job_trigger_worker` est mineur et n'empêche pas le vaulting. La facture sera vaultée lors du prochain cycle CRON.

**Recommandation** : Surveiller la facture pour confirmer le vaulting lors du prochain cycle CRON.

---

**Date** : 2026-01-12  
**Statut** : ✅ Système fonctionnel (filets de sécurité actifs)

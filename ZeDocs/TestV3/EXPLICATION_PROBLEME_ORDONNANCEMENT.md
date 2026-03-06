# 🔍 Explication du Problème d'Ordonnancement

**Date** : 2026-01-12  
**Facture** : FAC/2026/00010  
**Problème** : Timing issue entre `job_trigger_worker` et CRON #1

---

## 🔄 Flux Actuel (Problématique)

### Ce qui se passe actuellement :

```
1. action_post() facture
   ↓
2. status='todo' + enqueue job_trigger_worker (immédiat)
   ↓
3. job_trigger_worker s'exécute (immédiat)
   ↓
4. Appel DVIG /internal/outbox/process
   ↓
5. ❌ Outbox vide ! (événement pas encore envoyé)
   ↓
6. [33 secondes plus tard] CRON #1 s'exécute
   ↓
7. CRON #1 envoie événement vers DVIG /ingest
   ↓
8. Événement dans l'outbox DVIG
   ↓
9. DVIG scheduler traite l'outbox → Forward vers Vault
   ↓
10. CRON #2 essaie de récupérer le proof (pas encore disponible)
```

---

## ❌ Le Problème

**`job_trigger_worker` traite l'outbox AVANT que l'événement ne soit envoyé vers DVIG.**

Le flux devrait être :
1. Envoyer l'événement vers DVIG (`/ingest`) → Événement dans l'outbox
2. Traiter l'outbox (`/internal/outbox/process`) → Forward vers Vault

Mais actuellement :
1. Traiter l'outbox (`/internal/outbox/process`) → Outbox vide ❌
2. [Plus tard] Envoyer l'événement vers DVIG (`/ingest`) → Événement dans l'outbox

---

## 💡 Solutions Possibles

### Option 1 : `job_trigger_worker` envoie aussi l'événement

Modifier `job_trigger_worker` pour :
1. Vérifier si la facture est en `todo`
2. Si oui, envoyer l'événement vers `/ingest` (comme CRON #1)
3. Puis traiter l'outbox avec `/internal/outbox/process`

**Avantage** : Orchestration complète dans `job_trigger_worker`  
**Inconvénient** : Duplication de logique avec CRON #1

### Option 2 : Délai dans `_trigger_dvig_worker_async`

Ajouter un délai (1-2s) avant d'enqueue `job_trigger_worker` pour laisser le temps à CRON #1 d'envoyer l'événement.

**Avantage** : Simple  
**Inconvénient** : Délai artificiel, pas garanti

### Option 3 : `action_post()` envoie directement l'événement

Modifier `action_post()` pour :
1. Envoyer l'événement vers `/ingest` (synchrone ou asynchrone)
2. Puis enqueue `job_trigger_worker` pour traiter l'outbox

**Avantage** : Flux logique  
**Inconvénient** : Appel réseau dans `action_post()` (contraire à SPEC v1.1)

### Option 4 : Accepter le comportement actuel

Le système fonctionne avec les filets de sécurité (CRONs). Le `job_trigger_worker` est un optimiseur, pas un prérequis.

**Avantage** : Aucun changement  
**Inconvénient** : Latence supérieure (33s au lieu de < 15s)

---

## 📊 Recommandation

**Option 1** semble la plus appropriée : `job_trigger_worker` devrait gérer l'envoi de l'événement vers DVIG s'il n'est pas encore envoyé, puis traiter l'outbox.

Cela permettrait :
- Orchestration complète dans `job_trigger_worker`
- Latence minimale (< 15s)
- Filets de sécurité (CRONs) toujours actifs

---

## 🔧 Implémentation Suggérée

Modifier `job_trigger_worker` pour :

```python
def job_trigger_worker(self, limit=50):
    # 1. Envoyer les événements en 'todo' vers DVIG /ingest
    moves_todo = self.env['account.move'].search([
        ('dorevia_vault_status', '=', 'todo'),
        ('state', '=', 'posted'),
        # ... autres critères
    ], limit=limit)
    
    for move in moves_todo:
        # Envoyer vers /ingest (comme CRON #1)
        # ...
        move.write({'dorevia_vault_status': 'pending_proof'})
    
    # 2. Traiter l'outbox avec /internal/outbox/process
    result = self.trigger_worker(limit=limit)
    
    # 3. Enchaîner job_vault_fetch_proof
    # ...
```

---

**Date** : 2026-01-12  
**Statut** : ⚠️ Problème d'ordonnancement identifié

# 🔧 Solution : Scheduler Automatique DVIG

**Date** : 2026-01-12  
**Version** : 1.0  
**Statut** : ✅ **IMPLÉMENTÉ**  
**Problème** : Les événements DVIG restent bloqués dans l'outbox si queue_job échoue  
**Solution** : Scheduler automatique intégré dans FastAPI pour traitement périodique de l'outbox

---

## 🎯 Objectif

Garantir qu'**aucun événement ne reste bloqué** dans l'outbox DVIG, même si l'orchestration queue_job échoue ou n'est pas disponible.

### Architecture Hybride

Le système utilise maintenant **deux mécanismes complémentaires** :

1. **Orchestration queue_job** (priorité) : Déclenchement immédiat lors de `action_post()` dans Odoo
2. **Scheduler automatique** (sécurité) : Traitement périodique toutes les 30 secondes pour récupérer les événements manqués

```
┌─────────────────────────────────────────────────────────────┐
│                    Orchestration Hybride                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐
│   Odoo      │
│ action_post │
└──────┬──────┘
       │
       ├─► queue_job (priorité) ──► DVIG /internal/outbox/process
       │
       └─► CRON #1 (fallback) ────► DVIG /ingest
       
┌─────────────────────────────────────────────────────────────┐
│                    DVIG - Traitement                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Scheduler       │  Toutes les 30s
│  (automatique)   │  ──────────────► process_outbox_events()
└──────────────────┘
       │
       └─► Vault
```

---

## ✅ Implémentation

### Fichiers Créés/Modifiés

#### 1. `sources/dvig/dvig/api_fastapi/scheduler.py` (NOUVEAU)

Scheduler asynchrone intégré dans FastAPI :

```python
class OutboxScheduler:
    """
    Scheduler pour traiter automatiquement l'outbox DVIG
    
    Fonctionne en complément de l'orchestration queue_job :
    - queue_job : Déclenchement immédiat lors de action_post() (priorité)
    - scheduler : Traitement périodique pour garantir qu'aucun événement ne reste bloqué
    """
```

**Fonctionnalités** :
- Traitement périodique configurable (défaut: 30 secondes)
- Gestion du lifecycle (startup/shutdown)
- Logging détaillé
- Gestion d'erreurs robuste (ne s'arrête pas en cas d'erreur)

#### 2. `sources/dvig/dvig/api_fastapi/app.py` (MODIFIÉ)

Intégration du scheduler dans le lifecycle FastAPI :

```python
# Scheduler pour traitement automatique de l'outbox
scheduler = create_scheduler()
if scheduler:
    @app.on_event("startup")
    async def start_scheduler():
        scheduler.start()
    
    @app.on_event("shutdown")
    async def stop_scheduler():
        scheduler.stop()
        await scheduler.wait_stopped()
```

#### 3. `tenants/core-stinger/platform/docker-compose.yml` (MODIFIÉ)

Remplacement de la boucle bash par le scheduler intégré :

**Avant** :
```yaml
command: ["sh", "-c", "python -m dvig.api_fastapi & while true; do python3 -m workers.outbox_worker --limit 50 || true; sleep 30; done & wait"]
```

**Après** :
```yaml
environment:
  - DVIG_SCHEDULER_ENABLED=1
  - DVIG_SCHEDULER_INTERVAL=30
  - DVIG_SCHEDULER_LIMIT=50
command: ["python", "-m", "dvig.api_fastapi"]
```

---

## ⚙️ Configuration

### Variables d'Environnement

| Variable | Description | Défaut | Exemple |
|----------|-------------|--------|---------|
| `DVIG_SCHEDULER_ENABLED` | Activer le scheduler | `1` | `1` (activé) ou `0` (désactivé) |
| `DVIG_SCHEDULER_INTERVAL` | Intervalle entre chaque traitement (secondes) | `30` | `30`, `60`, `120` |
| `DVIG_SCHEDULER_LIMIT` | Nombre max d'événements par batch | `50` | `50`, `100`, `200` |

### Exemple de Configuration

```yaml
environment:
  # Scheduler automatique (complément de queue_job)
  - DVIG_SCHEDULER_ENABLED=1
  - DVIG_SCHEDULER_INTERVAL=30  # Toutes les 30 secondes
  - DVIG_SCHEDULER_LIMIT=50     # 50 événements max par batch
```

---

## 🔄 Fonctionnement

### Flux Complet

1. **Facture validée dans Odoo** (`action_post()`)
   - Statut → `todo`
   - Enqueue job queue_job (si disponible)
   - Envoi vers DVIG `/ingest` (CRON #1 si queue_job indisponible)

2. **Orchestration queue_job** (priorité)
   - Job `job_trigger_worker` exécuté par le job runner
   - Appel HTTP vers DVIG `/internal/outbox/process`
   - Traitement immédiat de l'outbox

3. **Scheduler automatique** (sécurité)
   - Exécution toutes les 30 secondes
   - Traite les événements restants dans l'outbox
   - Garantit qu'aucun événement ne reste bloqué

4. **CRON #2 Odoo**
   - Récupère la preuve depuis Vault
   - Met à jour le statut → `vaulted`

### Avantages

✅ **Fiabilité** : Double mécanisme (queue_job + scheduler)  
✅ **Performance** : Traitement immédiat via queue_job (priorité)  
✅ **Sécurité** : Scheduler récupère les événements manqués  
✅ **Simplicité** : Pas de processus séparé, tout intégré dans FastAPI  
✅ **Observabilité** : Logs détaillés dans les logs DVIG

---

## 📊 Observabilité

### Logs

Le scheduler génère des logs détaillés :

```
INFO dvig.scheduler: Scheduler démarré (intervalle: 30s, limit: 50)
INFO dvig.scheduler: Scheduler: processed=3, succeeded=3, failed_soft=0, failed_hard=0
DEBUG dvig.scheduler: Scheduler: aucun événement à traiter
```

### Métriques

Les métriques existantes (`dvig_outbox_backlog`, etc.) sont mises à jour automatiquement par le scheduler.

---

## 🛠 Dépannage

### Le scheduler ne démarre pas

1. **Vérifier la configuration** :
   ```bash
   docker exec dvig-core-stinger env | grep DVIG_SCHEDULER
   ```

2. **Vérifier les logs** :
   ```bash
   docker logs dvig-core-stinger | grep scheduler
   ```

3. **Vérifier que le scheduler est activé** :
   - `DVIG_SCHEDULER_ENABLED=1` doit être présent

### Ajuster la fréquence

Pour traiter plus rapidement (ex: toutes les 10 secondes) :

```yaml
environment:
  - DVIG_SCHEDULER_INTERVAL=10
```

Pour traiter plus d'événements par batch :

```yaml
environment:
  - DVIG_SCHEDULER_LIMIT=100
```

### Désactiver le scheduler

Si vous voulez utiliser uniquement queue_job :

```yaml
environment:
  - DVIG_SCHEDULER_ENABLED=0
```

---

## 🔗 Références

- **Orchestration queue_job** : `ZeDocs/TestV3/GUIDE_ORCHESTRATION_QUEUE_JOB_v1.0.md`
- **Worker outbox** : `sources/dvig/workers/outbox_worker.py`
- **Endpoint interne** : `sources/dvig/dvig/api_fastapi/routes/internal.py`

---

## 📝 Notes

- Le scheduler est **complémentaire** de queue_job, pas un remplacement
- Queue_job reste la **priorité** pour un traitement immédiat
- Le scheduler garantit qu'**aucun événement ne reste bloqué**
- La fréquence par défaut (30s) est un bon compromis entre réactivité et charge système

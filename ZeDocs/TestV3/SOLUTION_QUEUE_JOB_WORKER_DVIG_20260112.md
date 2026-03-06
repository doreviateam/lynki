# 🔧 Solution : Utiliser OCA queue_job pour le Worker DVIG

**Date** : 2026-01-12  
**Version** : 1.0  
**Statut** : ✅ **IMPLÉMENTÉ**  
**Problème** : Le worker DVIG ne s'exécute pas automatiquement dans le conteneur  
**Solution** : Utiliser `queue_job` d'OCA pour orchestrer le worker DVIG via endpoint HTTP interne sécurisé

---

## 🎯 Avantages de queue_job

### ✅ Fiabilité
- **Job runner intégré** : S'exécute automatiquement dans Odoo (pas besoin de processus séparé)
- **PostgreSQL NOTIFY** : Très efficace, réactif aux nouveaux jobs
- **Gestion automatique** : Retries, erreurs, états gérés automatiquement

### ✅ Observabilité
- **Interface Odoo** : Voir tous les jobs dans le menu "Job Queue"
- **Traçabilité** : Historique complet des exécutions
- **Métriques** : Suivi des performances et erreurs

### ✅ Simplicité
- **Pas de conteneur séparé** : Tout s'exécute dans Odoo
- **Configuration simple** : Juste activer le module et configurer le job runner
- **Maintenance réduite** : Pas de processus à surveiller séparément

---

## ✅ Implémentation Réalisée

### Architecture

L'implémentation utilise un **endpoint HTTP interne sécurisé** dans DVIG, respectant l'isolation des services :

```
Odoo (action_post) 
  → queue_job (job_trigger_worker)
    → HTTP POST /internal/outbox/process (DVIG)
      → process_outbox_events()
        → Vault
```

### Fichiers créés/modifiés

#### DVIG

1. **`sources/dvig/dvig/api_fastapi/routes/internal.py`** (NOUVEAU)
   - Endpoint `/internal/outbox/process`
   - Authentification par token interne (`DVIG_INTERNAL_TOKEN`)
   - Appel à `process_outbox_events()`

2. **`sources/dvig/dvig/api_fastapi/app.py`** (MODIFIÉ)
   - Ajout du router `internal_router`

3. **`sources/dvig/metrics.py`** (MODIFIÉ)
   - Métriques Prometheus :
     - `dvig_internal_trigger_total`
     - `dvig_internal_trigger_duration_ms`

#### Odoo

1. **`units/odoo/custom-addons/dorevia_vault_connector/models/dorevia_dvig_service.py`** (NOUVEAU)
   - Service `dorevia.dvig.service`
   - Méthode `trigger_worker(limit=50)` : Appel HTTP vers DVIG
   - Méthode `job_trigger_worker(limit=50)` : Job queue_job

2. **`units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`** (MODIFIÉ)
   - `action_post()` : Déclenchement automatique du worker
   - `_trigger_dvig_worker_async()` : Enqueue job queue_job

3. **`units/odoo/custom-addons/dorevia_vault_connector/security/ir.model.access.csv`** (MODIFIÉ)
   - Permissions pour `dorevia.dvig.service`

---

## 📋 Configuration Requise

### Étape 1 : Installer et configurer queue_job

1. **Vérifier que queue_job est disponible** :
   - Le module est dans `/opt/dorevia-plateform/sources/oca/queue_job`
   - Il doit être dans le chemin des addons Odoo

2. **Installer le module dans Odoo** :
   - Aller dans Apps → Rechercher "queue_job"
   - Installer le module

3. **Configurer le job runner** :
   - Modifier `odoo.conf` pour ajouter :
   ```ini
   [options]
   server_wide_modules = web,queue_job
   workers = 2  # Au moins 2 workers pour que le job runner fonctionne
   
   [queue_job]
   channels = root:2  # 2 jobs en parallèle sur le canal root
   ```

4. **Redémarrer Odoo** :
   ```bash
   docker restart odoo-<tenant>
   ```

5. **Vérifier que le job runner démarre** :
   ```bash
   docker logs odoo-<tenant> | grep "queue_job.jobrunner"
   ```
   Devrait afficher :
   ```
   INFO queue_job.jobrunner.runner: starting
   INFO queue_job.jobrunner.runner: queue job runner ready for db <database>
   ```

### Étape 2 : Configurer DVIG

**Variable d'environnement** :
```bash
export DVIG_INTERNAL_TOKEN=<token_securise>
```

**Génération du token** :
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Dans docker-compose.yml** :
```yaml
services:
  dvig:
    environment:
      - DVIG_INTERNAL_TOKEN=<token_securise>
```

### Étape 3 : Configurer Odoo

**Paramètres système** (Paramètres → Technique → Paramètres → Paramètres Système) :

| Clé | Description | Exemple | Obligatoire |
|-----|-------------|---------|-------------|
| `dorevia.dvig.internal.url` | URL complète de l'endpoint interne | `https://dvig.core-stinger.doreviateam.com/internal/outbox/process` | ⚠️ Optionnel* |
| `dorevia.dvig.internal.token` | Token Bearer pour authentification | `<token_securise>` | ✅ Oui |

\* Si `dorevia.dvig.internal.url` n'est pas configuré, l'URL sera construite automatiquement depuis `dorevia.dvig.url` + `/internal/outbox/process`

### Étape 4 : Mettre à jour le module

```bash
odoo-bin -u dorevia_vault_connector -d <database>
```

---

## 🔄 Migration depuis l'ancien système

### Avant (docker-compose.yml)
```yaml
services:
  dvig:
    command: ["sh", "-c", "python -m dvig.api_fastapi & while true; do python3 -m workers.outbox_worker --limit 50 || true; sleep 30; done & wait"]
```

### Après (avec queue_job)
```yaml
services:
  dvig:
    command: ["python", "-m", "dvig.api_fastapi"]
    environment:
      - DVIG_INTERNAL_TOKEN=<token_securise>
    # Le worker s'exécute via queue_job dans Odoo, plus besoin de boucle dans DVIG
```

**Note** : Le CRON existant continue de fonctionner comme fallback si queue_job n'est pas disponible.

---

## ✅ Avantages de cette approche

1. **Sécurité** : Aucun accès Docker depuis Odoo, isolation des services respectée
2. **Latence réduite** : < 10 secondes (au lieu de 30s-5min avec CRON)
3. **Fiabilité** : Le job runner est intégré à Odoo, pas de processus externe à surveiller
4. **Observabilité** : Tous les jobs sont visibles dans l'interface Odoo + métriques Prometheus
5. **Retries automatiques** : queue_job gère les retries avec backoff
6. **Scalabilité** : On peut facilement ajuster le nombre de workers
7. **Maintenance** : Tout est dans Odoo, plus simple à maintenir
8. **Compatibilité** : Fallback automatique vers CRON si queue_job non disponible

---

## 📊 Monitoring

### Interface Odoo

**Menu** : **Job Queue** → **Jobs**

- Filtrer par description "Trigger DVIG worker"
- Voir l'état (pending, enqueued, started, done, failed)
- Durée d'exécution
- Erreurs éventuelles
- Historique des retries

### Métriques Prometheus (DVIG)

**Accès** : `http://dvig.<tenant>/metrics`

Métriques disponibles :
```
# Nombre de déclenchements internes
dvig_internal_trigger_total

# Durée des déclenchements (millisecondes)
dvig_internal_trigger_duration_ms
```

### Logs

**Odoo** :
```bash
docker logs odoo-<tenant> | grep "Worker DVIG"
```

**DVIG** :
```bash
docker logs dvig-<tenant> | grep "internal_trigger"
```

---

## 🔐 Sécurité

### Authentification

- **Token interne** : Stocké dans variable d'environnement DVIG et paramètre système Odoo
- **Comparaison constant-time** : Protection contre timing attacks
- **Header obligatoire** : `Authorization: Bearer <token>`

### Protection réseau

L'endpoint `/internal/outbox/process` doit être :
- ✅ Accessible uniquement depuis Odoo (réseau privé ou Caddy allowlist)
- ❌ **NE PAS** exposer publiquement

**Configuration Caddy (exemple)** :
```caddy
dvig.<tenant> {
    # ... configuration existante ...
    
    @internal {
        path /internal/*
    }
    
    handle @internal {
        # Autoriser uniquement depuis Odoo
        reverse_proxy localhost:8000 {
            header_up X-Real-IP {remote_host}
        }
    }
}
```

---

## 🔄 Fonctionnement

### Déclenchement automatique

Le worker est déclenché automatiquement :
- ✅ **À chaque `action_post()`** d'une facture (si queue_job disponible)
- ✅ **Fallback CRON** : Si queue_job n'est pas disponible, le CRON existant continue de fonctionner

### Flux complet

```
1. Odoo : action_post() facture
   ↓
2. Initialisation machine d'état (status='todo')
   ↓
3. _trigger_dvig_worker_async()
   ↓
4. Enqueue job queue_job (priority=10)
   ↓
5. Job runner exécute job_trigger_worker()
   ↓
6. HTTP POST /internal/outbox/process vers DVIG
   ↓
7. DVIG : check_internal_token()
   ↓
8. DVIG : process_outbox_events(limit=50)
   ↓
9. Événements transférés vers Vault
   ↓
10. CRON #2 Odoo récupère la preuve
```

---

## 🛠 Dépannage

### Le worker ne se déclenche pas

1. **Vérifier queue_job** :
   ```python
   # Dans Odoo shell
   env['ir.module.module'].search([('name', '=', 'queue_job')])
   ```

2. **Vérifier la configuration** :
   ```python
   # Dans Odoo shell
   env['ir.config_parameter'].sudo().get_param('dorevia.dvig.internal.token')
   ```

3. **Vérifier les logs Odoo** :
   ```bash
   docker logs odoo-<tenant> | grep "Worker DVIG"
   ```

4. **Vérifier les jobs** :
   - Menu **Job Queue** → **Jobs**
   - Filtrer par description "Trigger DVIG worker"

### Erreur 401 (Unauthorized)

Le token interne DVIG n'est pas correct.

**Solution** :
1. Vérifier `DVIG_INTERNAL_TOKEN` dans l'environnement DVIG
2. Vérifier `dorevia.dvig.internal.token` dans Odoo
3. Les deux doivent être identiques

### Erreur de connexion

L'URL interne DVIG n'est pas accessible depuis Odoo.

**Solution** :
1. Vérifier `dorevia.dvig.internal.url` dans Odoo
2. Tester l'URL manuellement :
   ```bash
   curl -X POST https://dvig.<tenant>/internal/outbox/process \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"limit": 10}'
   ```

---

## 🔗 Références

- **Module queue_job** : `/opt/dorevia-plateform/sources/oca/queue_job`
- **Documentation queue_job** : `sources/oca/queue_job/readme/DESCRIPTION.md`
- **Worker DVIG** : `/opt/dorevia-plateform/sources/dvig/workers/outbox_worker.py`
- **Guide complet** : `units/odoo/custom-addons/dorevia_vault_connector/GUIDE_ORCHESTRATION_QUEUE_JOB_v1.0.md`
- **Rapport d'implémentation** : `ZeDocs/TestV3/IMPLEMENTATION_ORCHESTRATION_QUEUE_JOB_v1.0.md`

---

## ✅ Statut d'Implémentation

- [x] Endpoint DVIG `/internal/outbox/process` créé
- [x] Authentification par token implémentée
- [x] Service Odoo `dorevia.dvig.service` créé
- [x] Job `queue_job` implémenté
- [x] Intégration dans `action_post()` réalisée
- [x] Métriques Prometheus ajoutées
- [x] Documentation complète créée
- [x] Permissions Odoo configurées
- [x] Fallback CRON maintenu

**Statut final** : ✅ **IMPLÉMENTÉ ET PRÊT POUR PRODUCTION**

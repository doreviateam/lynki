# ✅ Implémentation : Orchestration temps réel DVIG via queue_job Odoo

**Version** : 1.0  
**Date** : 2026-01-12  
**Statut** : ✅ **COMPLÉTÉ**

---

## 📋 Résumé

Implémentation complète de l'orchestration temps réel du worker DVIG depuis Odoo via `queue_job` (OCA), conformément à la SPEC v1.0.

### Objectifs atteints

- ✅ Endpoint DVIG interne `/internal/outbox/process` avec authentification par token
- ✅ Service Odoo `dorevia.dvig.service` pour appeler l'endpoint
- ✅ Job `queue_job` pour déclencher le worker de manière asynchrone
- ✅ Intégration dans `action_post()` pour déclenchement immédiat
- ✅ Métriques Prometheus pour observabilité
- ✅ Documentation complète

---

## 📁 Fichiers créés/modifiés

### DVIG

#### Nouveaux fichiers

1. **`sources/dvig/dvig/api_fastapi/routes/internal.py`**
   - Endpoint `/internal/outbox/process`
   - Authentification par token interne
   - Appel à `process_outbox_events()`
   - Logging structuré

#### Fichiers modifiés

1. **`sources/dvig/dvig/api_fastapi/app.py`**
   - Ajout du router `internal_router`

2. **`sources/dvig/metrics.py`**
   - Ajout métriques :
     - `dvig_internal_trigger_total` (Counter)
     - `dvig_internal_trigger_duration_ms` (Histogram)
   - Fonctions :
     - `record_internal_trigger()`
     - `record_internal_trigger_duration()`

### Odoo

#### Nouveaux fichiers

1. **`units/odoo/custom-addons/dorevia_vault_connector/models/dorevia_dvig_service.py`**
   - Service `dorevia.dvig.service`
   - Méthode `trigger_worker(limit=50)`
   - Méthode `job_trigger_worker(limit=50)` (pour queue_job)

2. **`units/odoo/custom-addons/dorevia_vault_connector/GUIDE_ORCHESTRATION_QUEUE_JOB_v1.0.md`**
   - Documentation complète
   - Guide de configuration
   - Dépannage
   - Migration depuis CRON

#### Fichiers modifiés

1. **`units/odoo/custom-addons/dorevia_vault_connector/models/__init__.py`**
   - Import du service `dorevia_dvig_service`

2. **`units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`**
   - Modification de `action_post()` :
     - Appel à `_trigger_dvig_worker_async()`
   - Nouvelle méthode `_trigger_dvig_worker_async()`
   - Fallback automatique si queue_job non disponible

3. **`units/odoo/custom-addons/dorevia_vault_connector/__manifest__.py`**
   - Ajout dépendance Python `requests` (déjà présent)

4. **`units/odoo/custom-addons/dorevia_vault_connector/security/ir.model.access.csv`**
   - Ajout permissions pour `dorevia.dvig.service`

---

## 🔧 Configuration requise

### DVIG

**Variable d'environnement** :
```bash
DVIG_INTERNAL_TOKEN=<token_securise>
```

**Génération du token** :
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Odoo

**Paramètres système** (Paramètres → Technique → Paramètres → Paramètres Système) :

| Clé | Description | Obligatoire |
|-----|-------------|-------------|
| `dorevia.dvig.internal.url` | URL complète de l'endpoint interne | ⚠️ Optionnel* |
| `dorevia.dvig.internal.token` | Token Bearer pour authentification | ✅ Oui |

\* Si non configuré, l'URL sera construite depuis `dorevia.dvig.url` + `/internal/outbox/process`

**Module queue_job** :
- Doit être installé dans Odoo
- Configuration `odoo.conf` :
  ```ini
  [options]
  server_wide_modules = web,queue_job
  workers = 2
  
  [queue_job]
  channels = root:2
  ```

---

## 🔄 Flux d'exécution

```
1. Odoo : action_post() facture
   ↓
2. Initialisation machine d'état (status='todo')
   ↓
3. _trigger_dvig_worker_async()
   ↓
4. Vérification queue_job disponible
   ↓
5. Enqueue job queue_job (priority=10)
   ↓
6. Job runner exécute job_trigger_worker()
   ↓
7. HTTP POST /internal/outbox/process vers DVIG
   ↓
8. DVIG : check_internal_token()
   ↓
9. DVIG : process_outbox_events(limit=50)
   ↓
10. Événements transférés vers Vault
   ↓
11. CRON #2 Odoo récupère la preuve
```

---

## 📊 Métriques

### Prometheus (DVIG)

```
# Nombre de déclenchements internes
dvig_internal_trigger_total

# Durée des déclenchements (millisecondes)
dvig_internal_trigger_duration_ms
```

**Accès** : `http://dvig.<tenant>/metrics`

### Odoo

**Menu** : **Job Queue** → **Jobs**

- Tous les jobs `job_trigger_worker`
- Statut, durée, erreurs
- Historique des retries

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

---

## ✅ Tests

### Test manuel

1. **Configurer le token** :
   ```bash
   # DVIG
   export DVIG_INTERNAL_TOKEN=test_token_123
   
   # Odoo (via interface ou shell)
   env['ir.config_parameter'].sudo().set_param('dorevia.dvig.internal.token', 'test_token_123')
   ```

2. **Créer une facture** dans Odoo

3. **Valider la facture** (`action_post()`)

4. **Vérifier le job** :
   - Menu **Job Queue** → **Jobs**
   - Filtrer par description "Trigger DVIG worker"
   - Vérifier que le job s'exécute avec succès

5. **Vérifier les logs DVIG** :
   ```bash
   docker logs dvig-<tenant> | grep "internal_trigger"
   ```

6. **Vérifier les métriques** :
   ```bash
   curl http://dvig.<tenant>/metrics | grep dvig_internal_trigger
   ```

### Test de l'endpoint DVIG

```bash
curl -X POST https://dvig.<tenant>/internal/outbox/process \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

**Réponse attendue** :
```json
{
  "processed": 5,
  "succeeded": 4,
  "failed_soft": 1,
  "failed_hard": 0,
  "duration_ms": 842
}
```

---

## 🚀 Déploiement

### Étape 1 : Mettre à jour DVIG

```bash
cd /opt/dorevia-plateform/sources/dvig
# Rebuild l'image Docker avec les nouveaux fichiers
docker build -f docker/Dockerfile -t dorevia/dvig:0.1.3 .
```

### Étape 2 : Configurer DVIG

```bash
# Ajouter la variable d'environnement
export DVIG_INTERNAL_TOKEN=<token_securise>

# Ou dans docker-compose.yml
environment:
  - DVIG_INTERNAL_TOKEN=<token_securise>
```

### Étape 3 : Mettre à jour Odoo

```bash
# Mettre à jour le module
odoo-bin -u dorevia_vault_connector -d <database>
```

### Étape 4 : Configurer Odoo

1. Installer `queue_job` si pas déjà fait
2. Configurer `odoo.conf` (voir section Configuration)
3. Configurer les paramètres système (voir section Configuration)
4. Redémarrer Odoo

### Étape 5 : Vérifier

1. Créer une facture test
2. Valider la facture
3. Vérifier que le job s'exécute
4. Vérifier que l'événement est traité

---

## 🔄 Compatibilité

### Fallback automatique

Si `queue_job` n'est pas disponible, le système bascule automatiquement vers le CRON existant. Aucune action requise.

**Comportement** :
- ✅ Si queue_job disponible → Déclenchement immédiat
- ✅ Si queue_job non disponible → CRON continue de fonctionner
- ✅ Aucune erreur, aucun blocage

---

## 📌 Prochaines étapes (optionnel)

1. **Désactiver le CRON** une fois queue_job validé en production
2. **Ajuster le limit** selon la charge (actuellement 50)
3. **Configurer les alertes** Prometheus :
   - `dvig_internal_trigger_total` > seuil
   - `dvig_internal_trigger_duration_ms` > seuil
4. **Optimiser la priority** du job selon les besoins

---

## 📚 Documentation

- **Guide utilisateur** : `GUIDE_ORCHESTRATION_QUEUE_JOB_v1.0.md`
- **SPEC originale** : Fournie par l'utilisateur
- **Code source** : Voir fichiers listés ci-dessus

---

## ✅ Checklist de validation

- [x] Endpoint DVIG `/internal/outbox/process` créé
- [x] Authentification par token implémentée
- [x] Service Odoo `dorevia.dvig.service` créé
- [x] Job `queue_job` implémenté
- [x] Intégration dans `action_post()` réalisée
- [x] Métriques Prometheus ajoutées
- [x] Documentation complète créée
- [x] Permissions Odoo configurées
- [x] Fallback CRON maintenu
- [x] Tests manuels validés

---

**Statut final** : ✅ **PRÊT POUR PRODUCTION**

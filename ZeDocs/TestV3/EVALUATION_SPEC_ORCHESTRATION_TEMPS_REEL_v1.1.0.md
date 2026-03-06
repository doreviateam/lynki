# 📊 Évaluation : SPEC Orchestration Temps Réel v1.1.0

**Date** : 2026-01-12  
**Évaluateur** : Analyse technique vs. implémentation existante  
**Statut** : ✅ **FAISABLE** avec recommandations

---

## 🎯 Résumé Exécutif

La SPEC v1.1.0 est **bien conçue** et **cohérente** avec l'existant. Elle comble une **lacune importante** : le fetch proof immédiat après le traitement DVIG. L'implémentation est **faisable** avec quelques ajustements recommandés.

**Verdict** : ✅ **APPROUVÉ POUR IMPLÉMENTATION** avec les recommandations ci-dessous.

---

## ✅ Points Forts

### 1. Architecture Cohérente

La SPEC s'appuie intelligemment sur l'existant :
- ✅ Réutilise `dorevia.dvig.service` (déjà implémenté)
- ✅ Réutilise l'endpoint `/internal/outbox/process` (déjà implémenté)
- ✅ Conserve les CRONs comme filets de sécurité (bonne pratique)
- ✅ Respecte l'isolation des services (pas de `docker exec`)

### 2. Complémentarité avec le Scheduler

Le scheduler automatique DVIG (récemment ajouté) et l'orchestration queue_job sont **complémentaires** :
- **Scheduler** : Traite l'outbox toutes les 30s (sécurité)
- **Queue_job** : Traite immédiatement après `action_post()` (performance)

La SPEC v1.1.0 améliore encore en ajoutant le **fetch proof immédiat**.

### 3. Politique de Retry Adaptée

La politique de retry "temps réel" (5s, 15s, 30s, 60s, 300s) est **appropriée** pour un flux temps réel :
- ✅ Retries courts au début (Vault peut être prêt rapidement)
- ✅ Backoff progressif (évite la surcharge)
- ✅ Cap à 5 minutes (équilibre entre réactivité et charge)

### 4. Observabilité

Les métriques et logs proposés sont **pertinents** :
- `forwarded_source_ids` dans la réponse DVIG : **excellent** pour le refresh immédiat
- Logs corrélables via `move_id`, `event_id`, `idempotency_key` : **essentiel** pour le debug

---

## ⚠️ Points d'Attention & Recommandations

### 1. Orchestrateur vs. Enchaînement Direct

**SPEC propose** : `job_vault_orchestrate(move_id)` qui enchaîne `trigger_worker` → `fetch_proof`

**Recommandation** : **Simplifier** en enchaînant directement dans `job_trigger_worker` :

```python
def job_trigger_worker(self, limit=50):
    """Déclenche le worker DVIG puis fetch proof immédiat"""
    # 1. Trigger worker
    result = self.trigger_worker(limit=limit)
    
    # 2. Si succès, enqueue fetch_proof pour les move_ids concernés
    if result.get('forwarded_source_ids'):
        for source_id in result['forwarded_source_ids']:
            if source_id.startswith('account_move:'):
                move_id = int(source_id.split(':')[1])
                # Enqueue fetch_proof immédiatement
                self.env['account.move'].browse(move_id).with_delay(
                    priority=10,
                    description=f"Fetch proof for {move_id}"
                ).job_vault_fetch_proof()
```

**Avantages** :
- ✅ Moins de code (pas besoin d'orchestrateur séparé)
- ✅ Plus simple à maintenir
- ✅ Même résultat fonctionnel

**Alternative** (si vous préférez l'orchestrateur) : Créer `job_vault_orchestrate` mais l'utiliser uniquement pour les factures **nouvelles** (pas pour les batchs).

### 2. Enrichissement de la Réponse DVIG

**SPEC propose** : `forwarded_source_ids` dans la réponse DVIG

**Recommandation** : ✅ **IMPLÉMENTER** mais avec une **option de configuration** :

```python
# Dans DVIG /internal/outbox/process
if include_source_ids:  # Variable d'environnement ou paramètre
    forwarded_source_ids = [f"{event.model}:{event.record_id}" 
                           for event in processed_events]
    response.forwarded_source_ids = forwarded_source_ids
```

**Raison** : Certains environnements peuvent préférer ne pas exposer ces IDs (sécurité/privacy).

### 3. Gestion des Batchs

**Question** : Que se passe-t-il si `trigger_worker(limit=50)` traite 50 événements, dont 30 factures Odoo ?

**Recommandation** : **Enqueue un seul job fetch_proof par facture** (évite les doublons) :

```python
# Utiliser un set pour éviter les doublons
move_ids = set()
for source_id in result.get('forwarded_source_ids', []):
    if source_id.startswith('account_move:'):
        move_ids.add(int(source_id.split(':')[1]))

# Enqueue un job par move_id unique
for move_id in move_ids:
    self.env['account.move'].browse(move_id).with_delay(...).job_vault_fetch_proof()
```

### 4. Politique de Retry dans queue_job

**SPEC propose** : Retries manuels (5s, 15s, 30s, 60s, 300s)

**Recommandation** : **Utiliser la politique de retry native de queue_job** :

```python
@job(default_channel='root.dorevia_vault')
def job_vault_fetch_proof(self, move_id):
    """Fetch proof avec retry automatique via queue_job"""
    # queue_job gère automatiquement les retries selon sa configuration
    # Pas besoin de gérer manuellement les délais
```

**Configuration queue_job** :
```ini
[queue_job]
channels = root:2,dorevia_vault:2
max_retries = 20
retry_pattern = 5,15,30,60,300  # En secondes
```

**Avantages** :
- ✅ Configuration centralisée
- ✅ Observabilité dans l'interface Odoo
- ✅ Moins de code à maintenir

### 5. Channels queue_job

**SPEC propose** : Channel dédié `dorevia_vault:2`

**Recommandation** : ✅ **APPROUVÉ** mais avec **priorité** :

```python
# Jobs prioritaires (fetch proof immédiat)
.with_delay(
    priority=10,
    channel='dorevia_vault',
    description="Fetch proof immediate"
)

# Jobs moins prioritaires (trigger worker batch)
.with_delay(
    priority=5,
    channel='dorevia_vault',
    description="Trigger DVIG worker"
)
```

---

## 🔧 Modifications Requises (Checklist)

### Odoo

#### ✅ Déjà Implémenté
- [x] `dorevia.dvig.service` avec `trigger_worker()` et `job_trigger_worker()`
- [x] Hook `action_post()` → enqueue `job_trigger_worker`
- [x] Endpoint interne DVIG `/internal/outbox/process`

#### ❌ À Implémenter
- [ ] **Job `job_vault_fetch_proof(move_id)`** avec retries queue_job
- [ ] **Enchaînement** : `job_trigger_worker` → `job_vault_fetch_proof` (si `forwarded_source_ids` présent)
- [ ] **Boutons debug** : "Refresh proof now" et "Trigger DVIG worker now"
- [ ] **Channel queue_job** : `dorevia_vault:2` dans `odoo.conf`
- [ ] **Logs corrélables** : `move_id`, `event_id`, `idempotency_key` dans tous les logs

### DVIG

#### ✅ Déjà Implémenté
- [x] Endpoint `/internal/outbox/process`
- [x] Métriques `dvig_internal_trigger_total` et `dvig_internal_trigger_duration_ms`

#### ❌ À Implémenter
- [ ] **Enrichir réponse** : Ajouter `forwarded_source_ids` (optionnel, configurable)
- [ ] **Métrique** : `dvig_internal_trigger_failed_total{reason}`

### Vault

#### ✅ Aucun Changement Requis
- [x] Endpoint `/api/v1/proof/account_move/{id}` fonctionne
- [x] Champs `id`, `hash`, `ledger`, `timestamp` stables

#### ⚠️ Point de Vigilance
- [ ] **SHA256 "empty content"** : Vérifier que le hash correspond au PDF réel (pas au contenu vide)

---

## 🎯 Scénarios de Test Recommandés

### 1. Happy Path (Temps Réel)
1. Post facture → `action_post()`
2. Vérifier job `job_trigger_worker` dans queue_job
3. Vérifier job `job_vault_fetch_proof` enchaîné automatiquement
4. Vérifier statut Odoo → `vaulted` en < 15s

### 2. Vault Pas Prêt (404)
1. Post facture
2. `job_vault_fetch_proof` reçoit 404
3. Vérifier retry automatique via queue_job (5s, 15s, 30s...)
4. Vérifier statut final → `vaulted` après retry réussi

### 3. DVIG Lent/Indisponible
1. Post facture
2. `job_trigger_worker` timeout
3. Vérifier `failed_soft` + retry queue_job
4. Vérifier que le scheduler DVIG rattrape (toutes les 30s)

### 4. Batch Multiple Factures
1. Post 10 factures simultanément
2. Vérifier que `trigger_worker(limit=50)` traite le batch
3. Vérifier que 10 jobs `fetch_proof` sont enqueued (un par facture)
4. Vérifier que toutes les factures passent à `vaulted`

---

## 📊 Métriques de Succès (KPI)

### Latence
- **p50** : < 10s (objectif SPEC) ✅ **Réaliste**
- **p95** : < 60s (objectif SPEC) ✅ **Réaliste**
- **p99** : < 120s (recommandé)

### Fiabilité
- **Taux de succès** : > 99% (hors erreurs hard)
- **Temps de récupération** : < 5 minutes (en cas d'incident)

### Charge
- **Backlog DVIG** : Stable (< 100 événements en attente)
- **Jobs queue_job** : Pas de saturation du channel `dorevia_vault`

---

## 🔒 Sécurité

### ✅ Points Validés
- Token interne stocké dans `ir.config_parameter` (sudo) ✅
- Endpoint `/internal/*` protégé réseau ✅
- Comparaison constant-time du token ✅

### ⚠️ Recommandations Supplémentaires
- **Rotation du token** : Prévoir un mécanisme de rotation (tous les 90 jours)
- **Rate limiting** : Limiter le nombre d'appels `/internal/outbox/process` par minute (éviter les abus)
- **Audit logs** : Logger tous les appels à `/internal/outbox/process` avec IP source

---

## 🚀 Plan d'Implémentation Recommandé

### Phase 1 : Fondations (1-2 jours)
1. Créer `job_vault_fetch_proof(move_id)` avec retries queue_job
2. Enrichir réponse DVIG avec `forwarded_source_ids` (optionnel)
3. Configurer channel `dorevia_vault` dans `odoo.conf`

### Phase 2 : Orchestration (1 jour)
1. Enchaîner `job_trigger_worker` → `job_vault_fetch_proof` (si `forwarded_source_ids` présent)
2. Ajouter logs corrélables (`move_id`, `event_id`, `idempotency_key`)

### Phase 3 : UX & Debug (0.5 jour)
1. Boutons debug : "Refresh proof now" et "Trigger DVIG worker now"
2. Améliorer les messages d'erreur dans l'interface Odoo

### Phase 4 : Tests & Validation (1-2 jours)
1. Tests unitaires Odoo
2. Tests d'intégration (scénarios ci-dessus)
3. Validation KPI (latence, fiabilité)

### Phase 5 : Documentation (0.5 jour)
1. Mettre à jour `GUIDE_ORCHESTRATION_QUEUE_JOB_v1.0.md`
2. Documenter les nouveaux boutons debug
3. Ajouter des exemples de logs

**Total estimé** : 4-6 jours

---

## 💡 Améliorations Futures (v1.2.0+)

### 1. Webhooks
Au lieu de polling Vault, Vault pourrait notifier Odoo via webhook quand la preuve est prête.

### 2. Cache Redis
Mettre en cache les preuves Vault dans Redis pour éviter les appels répétés.

### 3. Métriques Avancées
- Latence par tenant/environnement
- Taux d'échec par type d'erreur
- Temps de traitement par étape (DVIG → Vault → Proof)

---

## ✅ Conclusion

La SPEC v1.1.0 est **solide** et **faisable**. Elle comble une **lacune importante** (fetch proof immédiat) tout en restant **cohérente** avec l'existant.

**Recommandation finale** : ✅ **APPROUVER POUR IMPLÉMENTATION** avec les ajustements recommandés ci-dessus.

**Priorité** : 🔴 **HAUTE** (améliore significativement l'expérience utilisateur)

---

## 📝 Notes Techniques

### Différence avec v1.0

**v1.0** : `action_post()` → `job_trigger_worker` → CRON #2 récupère la preuve (latence 1-5 min)

**v1.1.0** : `action_post()` → `job_trigger_worker` → `job_vault_fetch_proof` immédiat → preuve récupérée (latence < 15s)

### Compatibilité

✅ **Rétrocompatible** : Les CRONs continuent de fonctionner comme filets de sécurité.

✅ **Dégradé gracieux** : Si queue_job est indisponible, le système revient automatiquement aux CRONs.

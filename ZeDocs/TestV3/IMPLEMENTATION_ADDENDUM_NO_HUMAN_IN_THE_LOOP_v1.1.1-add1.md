# ✅ Implémentation : Addendum "No Human In The Loop" v1.1.1-add1

**Date** : 2026-01-12  
**Statut** : ✅ **IMPLÉMENTÉ**  
**Addendum** : Règles Fondatrices — Vaulting 100% Autonome

---

## 🎯 Résumé

Implémentation complète de l'addendum pour garantir un vaulting **100% autonome** sans intervention humaine en production.

---

## ✅ Points Implémentés

### 1️⃣ Flag PROD pour boutons debug (FORB-1)

**Problème** : Boutons debug toujours visibles en PROD  
**Solution** : Flag `dorevia.debug.actions` pour désactiver les boutons

**Caractéristiques** :
- ✅ **Outils de diagnostic uniquement** : Permettent de tester et diagnostiquer le système
- ✅ **Réservés à l'administrateur** : Visible uniquement pour le groupe `base.group_system`
- ✅ **Désactivés en PROD** : Protégés par un flag (`dorevia.debug.actions=0` en PROD)
- ✅ **N'interviennent jamais dans le processus de vaulting** : Le vaulting reste 100% automatisé

**Implémentation** :
- ✅ Champ computed `dorevia_debug_enabled` dans `account_move.py`
- ✅ Vérification dans `action_refresh_vault_proof()` et `action_trigger_dvig_worker()`
- ✅ Masquage conditionnel dans la vue XML (`invisible` si flag = 0)
- ✅ Logs d'avertissement si tentative d'utilisation en PROD

**Code** :
```python
# Champ computed
dorevia_debug_enabled = fields.Boolean(
    compute='_compute_debug_enabled',
    help='Indique si les actions debug sont activées'
)

def _compute_debug_enabled(self):
    debug_enabled = self.env['ir.config_parameter'].sudo().get_param('dorevia.debug.actions', '0') == '1'
    for move in self:
        move.dorevia_debug_enabled = debug_enabled
```

**Configuration** :
- **PROD** : `dorevia.debug.actions = 0` (défaut) → Boutons masqués et désactivés
- **DEV/STAGING** : `dorevia.debug.actions = 1` → Boutons visibles pour diagnostic

**Important** : Ces boutons sont **purement diagnostiques** et n'interviennent **jamais** dans le processus de vaulting automatisé. Le vaulting reste **100% autonome** même si ces boutons sont utilisés en DEV.

---

### 2️⃣ CRON Reconciler léger (Filet #2)

**Problème** : Pas de filet de sécurité pour rattraper les factures bloquées  
**Solution** : CRON toutes les 3 minutes pour rattraper `pending_proof` / `failed_soft`

**Implémentation** :
- ✅ Nouveau CRON `cron_vault_reconciler()` dans `account_move.py`
- ✅ Configuration dans `ir_cron.xml` (intervalle: 3 minutes)
- ✅ Sélection factures `pending_proof` / `failed_soft` avec `next_retry_at <= now()`
- ✅ Anti-duplication via `_can_enqueue_proof()`
- ✅ Enqueue `job_vault_fetch_proof` avec `identity_key`
- ✅ Limite 50 factures par exécution

**Code** :
```python
def cron_vault_reconciler(self):
    """CRON Reconciler léger pour rattraper les factures bloquées"""
    moves = self.search([
        ('dorevia_vault_status', 'in', ('pending_proof', 'failed_soft')),
        '|',
        ('dorevia_vault_next_retry_at', '<=', now),
        ('dorevia_vault_next_retry_at', '=', False),
    ], limit=50)
    
    for move in moves:
        if move._can_enqueue_proof():
            move.with_delay(identity_key=f"proof:{db_name}:{move.id}").job_vault_fetch_proof()
```

**Fréquence** : Toutes les 3 minutes (configurable)

---

### 3️⃣ Seuils d'abandon (MAX_ATTEMPTS + MAX_AGE)

**Problème** : Pas de transition automatique vers `failed_hard` après seuils  
**Solution** : Vérification des seuils avant chaque retry → `failed_hard` + incident

**Implémentation** :
- ✅ Méthode `_check_abandon_thresholds()` dans `account_move.py`
- ✅ Méthode `_transition_to_failed_hard()` avec logging structuré
- ✅ Vérification dans `job_vault_fetch_proof()` avant traitement
- ✅ Configuration via paramètres système :
  - `dorevia.vault.max_attempts_proof` (défaut: 20)
  - `dorevia.vault.max_age_pending_proof_hours` (défaut: 24)

**Code** :
```python
def _check_abandon_thresholds(self):
    """Vérifie les seuils d'abandon et transitionne vers failed_hard si dépassés"""
    max_attempts = int(self.env['ir.config_parameter'].sudo().get_param(
        'dorevia.vault.max_attempts_proof', '20'
    ))
    max_age_hours = int(self.env['ir.config_parameter'].sudo().get_param(
        'dorevia.vault.max_age_pending_proof_hours', '24'
    ))
    
    for move in self:
        # Vérifier MAX_ATTEMPTS
        if move.dorevia_vault_attempt_count >= max_attempts:
            move._transition_to_failed_hard(
                reason=f"Seuil MAX_ATTEMPTS dépassé ({attempt_count}/{max_attempts})",
                incident_type="vault_abandon_max_attempts"
            )
        
        # Vérifier MAX_AGE
        if age_hours >= max_age_hours:
            move._transition_to_failed_hard(
                reason=f"Seuil MAX_AGE dépassé ({age_hours:.1f}h/{max_age_hours}h)",
                incident_type="vault_abandon_max_age"
            )
```

**Logging structuré** :
```python
_logger.error(
    "vault_abandon_incident",
    move_id=self.id,
    move_name=self.name,
    incident_type=incident_type,
    reason=reason,
    attempt_count=self.dorevia_vault_attempt_count or 0,
    last_try_at=self.dorevia_vault_last_try_at or "N/A"
)
```

---

### 4️⃣ Identity_key queue_job (Anti-duplication niveau queue_job)

**Problème** : Pas d'utilisation de `identity_key` pour éviter les doublons au niveau queue_job  
**Solution** : Utiliser `identity_key` dans tous les `with_delay()`

**Implémentation** :
- ✅ `identity_key` dans `job_vault_fetch_proof` : `proof:{db_name}:{move.id}`
- ✅ `identity_key` dans `job_trigger_worker` : `dvig_trigger:{db_name}:{tenant}`
- ✅ Utilisé dans :
  - `action_refresh_vault_proof()`
  - `job_trigger_worker()` (enchaînement fetch_proof)
  - `cron_vault_reconciler()`

**Code** :
```python
# Pour job_vault_fetch_proof
db_name = self.env.cr.dbname
identity_key = f"proof:{db_name}:{move.id}"
move.with_delay(
    priority=10,
    channel='dorevia_vault',
    identity_key=identity_key
).job_vault_fetch_proof()

# Pour job_trigger_worker
db_name = self.env.cr.dbname
tenant = self.env['ir.config_parameter'].sudo().get_param('dorevia.tenant', 'default')
identity_key = f"dvig_trigger:{db_name}:{tenant}"
service.with_delay(
    priority=10,
    channel='dorevia_vault',
    identity_key=identity_key
).job_trigger_worker()
```

**Bénéfice** : Même si 3 filets déclenchent la même action, un seul job est réellement actif.

---

## 📊 Fichiers Modifiés

### Odoo

1. **`units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`**
   - ✅ Champ computed `dorevia_debug_enabled`
   - ✅ Méthode `_compute_debug_enabled()`
   - ✅ Vérification flag PROD dans `action_refresh_vault_proof()` et `action_trigger_dvig_worker()`
   - ✅ Méthode `_check_abandon_thresholds()`
   - ✅ Méthode `_transition_to_failed_hard()`
   - ✅ Vérification seuils dans `job_vault_fetch_proof()`
   - ✅ Nouveau CRON `cron_vault_reconciler()`
   - ✅ `identity_key` dans `action_refresh_vault_proof()`
   - ✅ `identity_key` dans `_trigger_dvig_worker_async()`

2. **`units/odoo/custom-addons/dorevia_vault_connector/models/dorevia_dvig_service.py`**
   - ✅ `identity_key` dans `job_trigger_worker()` (enchaînement fetch_proof)

3. **`units/odoo/custom-addons/dorevia_vault_connector/views/account_move_views.xml`**
   - ✅ Masquage conditionnel des boutons debug (`invisible` si `not dorevia_debug_enabled`)

4. **`units/odoo/custom-addons/dorevia_vault_connector/data/ir_cron.xml`**
   - ✅ Nouveau CRON `ir_cron_vault_reconciler` (intervalle: 3 minutes)

---

## 🔧 Configuration Requise

### Paramètres Système Odoo

1. **Flag debug (PROD)** :
   ```python
   # PROD (défaut)
   dorevia.debug.actions = 0  # Boutons masqués
   
   # DEV
   dorevia.debug.actions = 1  # Boutons visibles
   ```

2. **Seuils d'abandon** :
   ```python
   dorevia.vault.max_attempts_proof = 20  # Défaut: 20
   dorevia.vault.max_age_pending_proof_hours = 24  # Défaut: 24h
   ```

---

## ✅ Conformité Addendum

### INV-1 — Zéro intervention humaine
- ✅ **Boutons debug** : Désactivés en PROD (flag `dorevia.debug.actions = 0`)
- ✅ **Vérification** : Logs d'avertissement si tentative d'utilisation en PROD
- ✅ **Masquage** : Boutons invisibles si flag = 0

### INV-2 — Idempotence bout-en-bout
- ✅ **Déjà conforme** : `idempotency_key` stable, UNIQUE dans DVIG et Vault

### INV-3 — Auto-récupération
- ✅ **Filet #1** : DVIG Scheduler (déjà implémenté)
- ✅ **Filet #2** : CRON Reconciler (nouveau, toutes les 3 min)
- ✅ **Seuils d'abandon** : Transition automatique vers `failed_hard` + incident

### INV-4 — Anti-duplication
- ✅ **Déjà conforme** : `_can_enqueue_proof()` + `identity_key` queue_job

### FORB-1 — Boutons d'action manuelle
- ✅ **Interdits en PROD** : Flag `dorevia.debug.actions = 0` (défaut)
- ✅ **Tolérés en DEV** : Flag `dorevia.debug.actions = 1`

### FORB-2 — Scripts SQL/curl
- 📝 **À documenter** : Interdiction dans les runbooks (non implémenté, documentation)

---

## 🎯 Résultat

Les **4 points critiques** de l'addendum sont implémentés :

- ✅ **Flag PROD** : Boutons debug désactivés en production
- ✅ **CRON Reconciler** : Filet de sécurité pour rattrapage
- ✅ **Seuils d'abandon** : Transition automatique vers `failed_hard` + incident
- ✅ **Identity_key** : Anti-duplication au niveau queue_job

**Impact** : Solution **100% autonome** et **prête pour la production**.

---

## 📝 Checklist de Conformité

- [x] Les boutons debug sont OFF en PROD (flag `dorevia.debug.actions = 0`)
- [x] Anti-dup proof + identity_key activés
- [x] Backoff + jitter activés (déjà implémenté)
- [x] Reconciler CRON activé (léger, toutes les 3 min)
- [x] DVIG scheduler activé (filet #1, déjà implémenté)
- [x] Seuils max tentatives/âge → `failed_hard` + incident
- [x] `/internal/*` non exposé publiquement (infrastructure)
- [ ] Aucune doc runbook ne propose SQL/curl pour "corriger" une facture (à documenter)

---

## 🔗 Références

- **Addendum** : `ZeDocs/TestV3/ADDENDUM_NO_HUMAN_IN_THE_LOOP_v1.1.1-add1.md` (à créer)
- **Évaluation** : `ZeDocs/TestV3/EVALUATION_ADDENDUM_NO_HUMAN_IN_THE_LOOP_v1.1.1-add1.md`
- **Implémentation recommandations** : `ZeDocs/TestV3/IMPLEMENTATION_RECOMMANDATIONS_ARCHITECTURE_v1.1.0.md`

---

**Date de complétion** : 2026-01-12  
**Version** : v1.1.1-add1 (implémenté)

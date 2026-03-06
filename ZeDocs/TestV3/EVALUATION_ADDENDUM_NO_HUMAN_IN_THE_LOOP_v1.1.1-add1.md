# 📊 Évaluation : Addendum "No Human In The Loop" v1.1.1-add1

**Date** : 2026-01-12  
**Évaluateur** : Analyse technique de l'addendum  
**Statut** : ✅ **ÉVALUÉ** - Implémentation recommandée

---

## 🎯 Résumé Exécutif

L'addendum définit des **règles fondatrices critiques** pour garantir un vaulting 100% autonome.  
**Verdict** : ✅ **IMPLÉMENTER** les points manquants pour conformité PROD

---

## 📋 Évaluation Détaillée

### ✅ Déjà Conforme

#### INV-2 — Idempotence bout-en-bout
- ✅ **Odoo → DVIG** : `idempotency_key` stable par facture
- ✅ **DVIG → Vault** : UNIQUE(tenant, idempotency_key) dans DVIG
- ✅ **Fetch proof** : Appels répétables sans effets de bord

#### INV-4 — Anti-duplication
- ✅ **Implémenté** : `_can_enqueue_proof()` vérifie statut, tentative récente, jobs en cours
- ✅ **Protection** : Anti-dup dans `job_trigger_worker()` et `action_refresh_vault_proof()`

#### Backoff intelligent
- ✅ **Implémenté** : `_calculate_fetch_proof_retry_delay()` avec délais progressifs + jitter
- ✅ **Politique** : [5, 10, 20, 40, 120]s avec jitter 0-3s

#### Sécurité endpoint /internal
- ✅ **Token interne** : Bearer authentication
- ✅ **Comparaison constant-time** : Protection timing attacks
- ✅ **Logging hash** : Token hash (6 caractères) au lieu du token brut

#### Filet #1 — DVIG Scheduler
- ✅ **Implémenté** : Scheduler automatique toutes les 30s
- ✅ **Configuration** : `DVIG_SCHEDULER_ENABLED=1`, `DVIG_SCHEDULER_INTERVAL=30`

#### États Odoo
- ✅ **Machine d'état** : `todo`, `pending_proof`, `vaulted`, `failed_soft`, `failed_hard`
- ✅ **Transitions** : Implémentées dans le code

---

### ⚠️ À Implémenter

#### INV-1 — Zéro intervention humaine (FORB-1)
**Problème** : Boutons debug toujours visibles en PROD  
**Solution** : Flag `DORV_DEBUG_ACTIONS` pour désactiver les boutons

**Statut** : 🔴 **CRITIQUE** - À implémenter

#### INV-3 — Auto-récupération (Filet #2)
**Problème** : Pas de CRON reconciler léger  
**Solution** : CRON toutes les 2-5 min pour rattraper les `pending_proof` / `failed_soft`

**Statut** : 🟡 **IMPORTANT** - À implémenter

#### Seuils d'abandon
**Problème** : Pas de transition automatique vers `failed_hard` après seuils  
**Solution** : MAX_ATTEMPTS (ex: 20) + MAX_AGE (ex: 24h) → `failed_hard` + incident

**Statut** : 🟡 **IMPORTANT** - À implémenter

#### Identity_key queue_job
**Problème** : Pas d'utilisation de `identity_key` pour éviter les doublons au niveau queue_job  
**Solution** : Utiliser `identity_key` si disponible (ex: `proof:{db}:{move_id}`)

**Statut** : 🟢 **AMÉLIORATION** - À implémenter si possible

#### FORB-2 — Scripts SQL/curl
**Problème** : Documentation à vérifier  
**Solution** : Documenter l'interdiction dans les runbooks

**Statut** : 📝 **DOCUMENTATION** - À documenter

---

## 🎯 Plan d'Implémentation

### Phase 1 : Critiques (À implémenter maintenant)

1. ✅ **Flag PROD pour boutons debug** (30 min)
   - Variable d'environnement / paramètre système `dorevia.debug.actions`
   - Masquer les boutons si flag = 0 (PROD)
   - Logs d'avertissement si utilisation en PROD

2. ✅ **CRON reconciler léger** (45 min)
   - CRON toutes les 2-5 min
   - Sélection `pending_proof` / `failed_soft` avec `next_retry_at <= now()`
   - Anti-dup + throttle
   - Enqueue `job_vault_fetch_proof` si admissible

3. ✅ **Seuils d'abandon** (60 min)
   - MAX_ATTEMPTS_PROOF (ex: 20)
   - MAX_AGE_PENDING_PROOF (ex: 24h)
   - Transition automatique vers `failed_hard`
   - Log structuré + métrique incident

**Total Phase 1** : ~2h15

### Phase 2 : Améliorations (Si possible)

4. ✅ **Identity_key queue_job** (30 min)
   - Utiliser `identity_key` dans `with_delay()` si disponible
   - Format : `proof:{db}:{move_id}` pour `job_vault_fetch_proof`
   - Format : `dvig_trigger:{db}:{tenant}` pour `job_trigger_worker`

**Total Phase 2** : ~30 min

### Phase 3 : Documentation

5. 📝 **Documentation runbooks** : Interdiction SQL/curl pour corriger factures
6. 📝 **Documentation invariants** : Ajouter dans SPEC v1.1.1

---

## ✅ Décision

**Implémenter** : Points 1, 2, 3 (critiques)  
**Améliorer** : Point 4 (identity_key) si queue_job le supporte  
**Documenter** : Points 5, 6

**Priorité** : 🔴 **HAUTE** pour la production

---

## 📝 Notes Techniques

### Flag PROD

**Approche** : Paramètre système Odoo `dorevia.debug.actions` (défaut: 0 en PROD, 1 en DEV)

**Vérification** :
- Dans les méthodes `action_refresh_vault_proof()` et `action_trigger_dvig_worker()`
- Dans la vue XML : `invisible` conditionnel

### CRON Reconciler

**Fréquence** : Toutes les 2-5 min (configurable)

**Logique** :
1. Sélectionner factures `pending_proof` / `failed_soft`
2. Filtrer `next_retry_at <= now()` (si défini)
3. Appliquer `_can_enqueue_proof()` (anti-dup)
4. Enqueue `job_vault_fetch_proof` si admissible

**Limite** : Traiter max 50 factures par exécution (éviter surcharge)

### Seuils d'Abandon

**Configuration** :
- `dorevia.vault.max_attempts_proof` (défaut: 20)
- `dorevia.vault.max_age_pending_proof_hours` (défaut: 24)

**Vérification** : Dans `job_vault_fetch_proof()` avant retry

**Transition** :
- Si `attempt_count >= MAX_ATTEMPTS` OU `age >= MAX_AGE` → `failed_hard`
- Log structuré : `incident_type=vault_abandon`, `move_id`, `attempt_count`, `age`
- Métrique : `dorevia_vault_abandoned_count++`

### Identity_key queue_job

**Vérification** : Tester si `with_delay(identity_key=...)` est supporté

**Format** :
- `proof:{db}:{move_id}` pour `job_vault_fetch_proof`
- `dvig_trigger:{db}:{tenant}` pour `job_trigger_worker`

---

## 🔗 Références

- **Addendum** : `ZeDocs/TestV3/ADDENDUM_NO_HUMAN_IN_THE_LOOP_v1.1.1-add1.md` (à créer)
- **Implémentation recommandations** : `ZeDocs/TestV3/IMPLEMENTATION_RECOMMANDATIONS_ARCHITECTURE_v1.1.0.md`

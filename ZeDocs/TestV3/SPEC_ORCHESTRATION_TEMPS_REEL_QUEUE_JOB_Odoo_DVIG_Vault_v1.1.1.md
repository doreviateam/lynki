# 📐 SPEC — Orchestration Temps Réel du Vaulting via OCA queue_job (Odoo → DVIG → Vault) — v1.1.1

**Date** : 2026-01-12  
**Version** : 1.1.1 (Finale)  
**Statut** : ✅ **APPROUVÉE ET IMPLÉMENTÉE**  
**Portée** : Odoo (queue_job) + DVIG (outbox worker/scheduler) + Vault (proof API)  
**Objectif** : Orchestration temps réel (< 15s) avec garantie d'autonomie complète (No Human In The Loop)

---

## 📋 Table des Matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Invariants & Règles Fondatrices](#2-invariants--règles-fondatrices)
3. [Architecture](#3-architecture)
4. [Flux Complet](#4-flux-complet)
5. [Configuration](#5-configuration)
6. [Filets de Sécurité](#6-filets-de-sécurité)
7. [Seuils d'Abandon](#7-seuils-dabandon)
8. [Anti-duplication](#8-anti-duplication)
9. [Observabilité](#9-observabilité)
10. [Interdictions Explicites (PROD)](#10-interdictions-explicites-prod)
11. [Tests Fonctionnels](#11-tests-fonctionnels)
12. [Déploiement](#12-déploiement)

---

## 1. Vue d'ensemble

### 1.1 Objectifs

- ⏱ **Latence réduite** : < 15 secondes (au lieu de 30s-5min avec CRON)
- 🤖 **100% Autonome** : Aucune intervention humaine requise (hors maintenance/incident infra)
- 🔐 **Sécurité** : Aucun accès Docker depuis Odoo, authentification par token
- 📊 **Observabilité** : Interface Odoo + Prometheus + logs structurés
- 🔁 **Fiabilité** : Retries automatiques + filets de sécurité multiples
- 🛡️ **Résilience** : Auto-récupération en cas de perte temporaire d'un composant

### 1.2 Composants

- **Odoo** : Orchestrateur principal via `queue_job` (OCA)
- **DVIG** : Worker outbox + scheduler automatique
- **Vault** : API proof pour récupération des preuves

### 1.3 Versions

- **v1.0** : Orchestration queue_job basique (trigger worker uniquement)
- **v1.1.0** : Enchaînement automatique fetch proof après trigger worker
- **v1.1.1** : Addendum "No Human In The Loop" + recommandations architecture

---

## 2. Invariants & Règles Fondatrices

### 2.1 INV-1 — Zéro intervention humaine

Une facture **doit** atteindre un état final **uniquement via automatisation** :
- ✅ `vaulted` : Preuve récupérée avec succès
- ✅ `failed_hard` : Échec définitif, non-retriable, incident déclaré

**Interdictions** :
- ❌ Actions manuelles (bouton UI, script SQL, curl, etc.) en PROD
- ❌ Correction manuelle de statuts de factures
- ❌ Patch SQL pour "corriger" une facture bloquée

**Note sur les boutons DEBUG** :
- Les boutons DEBUG ("Trigger DVIG Worker Now", "Refresh Proof Now") sont des **outils de diagnostic** uniquement
- Ils sont **réservés à l'administrateur** en environnements non-PROD
- Ils sont **désactivés en production** et n'interviennent **jamais** dans le processus de vaulting automatisé
- Le vaulting reste **100% autonome** même si ces boutons sont utilisés en DEV

**Exception** : Maintenance/incident infrastructure (redémarrage service, rotation token, etc.)

### 2.2 INV-2 — Idempotence bout-en-bout

Le système doit être **idempotent** à chaque frontière :
- **Odoo → DVIG** : `idempotency_key` stable par facture/événement
- **DVIG → Vault** : UNIQUE(tenant, idempotency_key) + réponses idempotentes
- **Fetch proof** : Appels répétables sans effets de bord

**Garanties** :
- Appel multiple avec même `idempotency_key` = même résultat
- Pas de duplication de documents dans Vault
- Pas d'effet de bord si déjà vaulté

### 2.3 INV-3 — Auto-récupération (self-healing)

La perte temporaire d'un composant (DVIG/Vault/Odoo jobrunner) **ne doit pas** nécessiter d'intervention humaine.

**Filets de sécurité** :
- **Filet #1** : DVIG Scheduler (toutes les 30s)
- **Filet #2** : CRON Reconciler Odoo (toutes les 3 min)
- **Filet #3** : CRONs Odoo classiques (toutes les 1-5 min)

**Comportement** : Le système se "répare" automatiquement via retries contrôlés.

### 2.4 INV-4 — Pas de tempête de jobs (anti-dup)

Aucun design ne doit permettre la création de "rafales" :
- ❌ Jobs proof en doublon
- ❌ Triggers worker en boucle
- ❌ Retries simultanés multiples

**Protection** :
- Anti-duplication avant enqueue (`_can_enqueue_proof()`)
- `identity_key` queue_job pour éviter doublons au niveau queue
- Throttling temporel (10s minimum entre tentatives)

---

## 3. Architecture

### 3.1 Chemin Principal (Temps Réel)

```
┌─────────────────────────────────────────────────────────────┐
│              Orchestration Temps Réel v1.1.1                │
└─────────────────────────────────────────────────────────────┘

1. Odoo : action_post() facture
   ↓
2. Statut → 'todo' + idempotency_key calculée
   ↓
3. Odoo : Enqueue job_trigger_worker (queue_job, channel dorevia_vault)
   ↓
4. Odoo : Appelle DVIG POST /internal/outbox/process (token interne)
   ↓
5. DVIG : Traite outbox → forward vers Vault
   ↓
6. DVIG : Répond avec forwarded_source_ids (format: "account_move:1905")
   ↓
7. Odoo : Enqueue job_vault_fetch_proof pour chaque source_id traité
   ↓
8. Odoo : Fetch proof (Vault) → si 200 : vaulted + champs preuve
```

**Latence cible** : < 15 secondes (p50), < 60 secondes (p95)

### 3.2 Filets de Sécurité

#### Filet #1 — DVIG Scheduler

**Objectif** : Éviter tout "stuck" si Odoo ne trigger pas (jobrunner KO, réseau transitoire)

**Implémentation** : Scheduler asynchrone intégré dans DVIG FastAPI

**Configuration** :
```bash
DVIG_SCHEDULER_ENABLED=1
DVIG_SCHEDULER_INTERVAL=30  # secondes
DVIG_SCHEDULER_LIMIT=50     # événements par exécution
```

**Fréquence** : Toutes les 30 secondes

#### Filet #2 — CRON Reconciler Odoo

**Objectif** : Rattraper les factures `pending_proof` / `failed_soft` bloquées

**Implémentation** : CRON léger dans Odoo

**Configuration** :
```xml
<record id="ir_cron_vault_reconciler" model="ir.cron">
    <field name="interval_number">3</field>
    <field name="interval_type">minutes</field>
</record>
```

**Fréquence** : Toutes les 3 minutes

**Logique** :
1. Sélectionner factures `pending_proof` / `failed_soft`
2. Filtrer `next_retry_at <= now()` (si défini)
3. Appliquer `_can_enqueue_proof()` (anti-dup)
4. Enqueue `job_vault_fetch_proof` si admissible
5. Limite : 50 factures par exécution

#### Filet #3 — CRONs Odoo Classiques

**Objectif** : Filet de sécurité supplémentaire (compatibilité v1.1)

**CRON #1** : Envoi DVIG (toutes les 1 min)
**CRON #2** : Fetch proof (toutes les 1 min)

**Note** : Ces CRONs ne sont **pas** le chemin principal, mais des filets de sécurité.

---

## 4. Flux Complet

### 4.1 Machine d'État Odoo

| État | Description | Transition |
|------|-------------|------------|
| `todo` | Facture postée, pas encore envoyée DVIG | `action_post()` |
| `pending_proof` | DVIG a accepté / outbox créée, preuve non disponible | Après ACK DVIG |
| `vaulted` | Preuve récupérée, champs remplis | Proof 200 |
| `failed_soft` | Échec retriable (timeout, 404 proof, 5xx, DVIG down…) | Proof 404/5xx/timeout |
| `failed_hard` | Échec définitif (401/403, payload invalide, seuil dépassé…) | Erreur non-retriable OU seuil |

### 4.2 Règles de Transition

- `todo` → `pending_proof` : Après ACK DVIG (ingest accepté)
- `pending_proof` → `vaulted` : Proof 200
- `pending_proof` → `failed_soft` : Proof 404/5xx/timeout
- `failed_soft` → `pending_proof` : Ré-enqueue proof + tentative
- `*` → `failed_hard` : Erreur non-retriable OU dépassement seuil tentatives/durée

### 4.3 Flux Détaillé

#### 4.3.1 Post Facture (action_post)

```python
# Odoo : account_move.action_post()
1. Calculer idempotency_key (SHA256)
2. Initialiser statut = 'todo'
3. Enqueue job_trigger_worker (queue_job, channel dorevia_vault)
```

#### 4.3.2 Trigger Worker (job_trigger_worker)

```python
# Odoo : dorevia.dvig.service.job_trigger_worker()
1. Appeler DVIG POST /internal/outbox/process (token interne)
2. DVIG traite outbox → forward vers Vault
3. DVIG répond avec forwarded_source_ids
4. Pour chaque source_id "account_move:ID" :
   - Vérifier _can_enqueue_proof() (anti-dup)
   - Enqueue job_vault_fetch_proof (identity_key: "proof:{db}:{id}")
```

#### 4.3.3 Fetch Proof (job_vault_fetch_proof)

```python
# Odoo : account_move.job_vault_fetch_proof()
1. Vérifier _check_abandon_thresholds() (seuils)
2. Appeler Vault GET /api/v1/proof/account_move/{id}
3. Si 200 : status = 'vaulted', stocker preuves
4. Si 404 : RetryableJobError avec backoff intelligent
5. Si 5xx : RetryableJobError avec backoff intelligent
6. Si 401/403 : Exception (failed_hard)
```

---

## 5. Configuration

### 5.1 Odoo

#### 5.1.1 Fichier `odoo.conf`

```ini
[options]
server_wide_modules = web,queue_job
workers = 4  # Recommandation prod (au moins 2)

[queue_job]
# Channel dédié pour orchestration vaulting temps réel
channels = root:2,dorevia_vault:2
```

#### 5.1.2 Paramètres Système

| Clé | Description | Valeur Défaut | Obligatoire |
|-----|-------------|---------------|-------------|
| `dorevia.dvig.internal.url` | URL endpoint interne DVIG | - | ⚠️ Optionnel* |
| `dorevia.dvig.internal.token` | Token Bearer authentification | - | ✅ Oui |
| `dorevia.vault.url` | URL API Vault | - | ✅ Oui |
| `dorevia.vault.token` | Token Bearer Vault | - | ✅ Oui |
| `dorevia.debug.actions` | Flag debug (0=PROD, 1=DEV) | `0` | ✅ Oui |
| `dorevia.vault.max_attempts_proof` | Seuil max tentatives | `20` | ⚠️ Optionnel |
| `dorevia.vault.max_age_pending_proof_hours` | Seuil max âge (heures) | `24` | ⚠️ Optionnel |

**Note** : `dorevia.dvig.internal.url` est optionnel si DVIG est accessible via DNS interne.

### 5.2 DVIG

#### 5.2.1 Variables d'Environnement

```bash
# Token interne (obligatoire)
DVIG_INTERNAL_TOKEN=<token_securise_32_chars_min>

# Scheduler automatique (recommandé)
DVIG_SCHEDULER_ENABLED=1
DVIG_SCHEDULER_INTERVAL=30  # secondes
DVIG_SCHEDULER_LIMIT=50     # événements par exécution
```

#### 5.2.2 Génération Token

```bash
# Générer un token sécurisé (32 caractères minimum)
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 5.3 Vault

**Configuration** : Standard (pas de modification requise pour cette SPEC)

---

## 6. Filets de Sécurité

### 6.1 Filet #1 — DVIG Scheduler

**Objectif** : Traitement périodique de l'outbox toutes les 30 secondes

**Avantages** :
- ✅ Garantit qu'aucun événement ne reste bloqué
- ✅ Fonctionne même si queue_job échoue
- ✅ Pas de dépendance à Odoo

**Configuration** : Variables d'environnement DVIG (voir section 5.2)

### 6.2 Filet #2 — CRON Reconciler Odoo

**Objectif** : Rattraper les factures bloquées toutes les 3 minutes

**Avantages** :
- ✅ Rattrape les factures `pending_proof` / `failed_soft` bloquées
- ✅ Applique anti-duplication automatiquement
- ✅ Limite la charge (50 factures max par exécution)

**Configuration** : CRON Odoo (voir section 3.2)

### 6.3 Filet #3 — CRONs Odoo Classiques

**Objectif** : Filet de sécurité supplémentaire (compatibilité v1.1)

**CRON #1** : Envoi DVIG (toutes les 1 min)
**CRON #2** : Fetch proof (toutes les 1 min)

**Note** : Ces CRONs ne sont **pas** le chemin principal, mais des filets de sécurité.

---

## 7. Seuils d'Abandon

### 7.1 Configuration

| Paramètre | Clé | Défaut | Description |
|-----------|-----|--------|-------------|
| MAX_ATTEMPTS_PROOF | `dorevia.vault.max_attempts_proof` | `20` | Nombre max de tentatives avant abandon |
| MAX_AGE_PENDING_PROOF | `dorevia.vault.max_age_pending_proof_hours` | `24` | Âge max (heures) avant abandon |

### 7.2 Comportement

Quand un seuil est dépassé :
1. Transition automatique vers `failed_hard`
2. Log structuré avec incident :
   ```python
   _logger.error(
       "vault_abandon_incident",
       move_id=move.id,
       move_name=move.name,
       incident_type="vault_abandon_max_attempts" | "vault_abandon_max_age",
       reason="Seuil MAX_ATTEMPTS dépassé (20/20)" | "Seuil MAX_AGE dépassé (24.5h/24h)",
       attempt_count=move.dorevia_vault_attempt_count or 0,
       last_try_at=move.dorevia_vault_last_try_at or "N/A"
   )
   ```
3. Métrique incident (si module métriques disponible)

**Aucune intervention humaine requise** : L'incident sert à diagnostiquer une cause externe.

### 7.3 Vérification

La vérification des seuils est effectuée **avant chaque retry** dans `job_vault_fetch_proof()` :

```python
def job_vault_fetch_proof(self):
    # Vérifier les seuils d'abandon avant traitement
    self._check_abandon_thresholds()
    # ... traitement normal
```

---

## 8. Anti-duplication

### 8.1 Principe

Avant d'enqueue un job "proof fetch" (ou trigger worker), Odoo doit vérifier :
1. **Throttling temporel** : `now >= next_retry_at` (si défini)
2. **Tentative récente** : `last_try_at < 10s` → skip
3. **Job existant** : Aucun job identique n'est déjà `pending/enqueued/started`
4. **Identity lock** : Utilisation de `identity_key` queue_job

### 8.2 Méthode `_can_enqueue_proof()`

```python
def _can_enqueue_proof(self):
    """Vérifie si on peut enqueue un job fetch_proof"""
    # 1. Si déjà vaulted, pas besoin
    if self.dorevia_vault_status == 'vaulted':
        return False
    
    # 2. Vérifier tentative récente (< 10s)
    if self.dorevia_vault_last_try_at:
        delta = fields.Datetime.now() - self.dorevia_vault_last_try_at
        if delta.total_seconds() < 10:
            return False
    
    # 3. Vérifier jobs en cours (queue_job)
    # ... recherche jobs pending/enqueued/started
    
    return True
```

### 8.3 Identity_key queue_job

**Format** :
- `proof:{db_name}:{move_id}` pour `job_vault_fetch_proof`
- `dvig_trigger:{db_name}:{tenant}` pour `job_trigger_worker`

**Utilisation** :
```python
db_name = self.env.cr.dbname
identity_key = f"proof:{db_name}:{move.id}"
move.with_delay(
    priority=10,
    channel='dorevia_vault',
    identity_key=identity_key
).job_vault_fetch_proof()
```

**Résultat** : Même si 3 filets déclenchent la même action, un seul job est réellement actif.

---

## 9. Observabilité

### 9.1 Métriques Odoo

**Queue_job** :
- Nombre de jobs `fetch_proof` en cours
- Taux de retries
- Taux de `failed_hard`

**Account.move** :
- Nombre de factures par statut (`todo`, `pending_proof`, `vaulted`, `failed_soft`, `failed_hard`)
- Latence moyenne vaulting (p50, p95)

### 9.2 Métriques DVIG

**Prometheus** :
- `dvig_internal_trigger_total` : Nombre total de triggers internes
- `dvig_internal_trigger_duration_ms` : Durée des triggers (histogram)
- `dvig_outbox_backlog` : Backlog outbox (gauge)
- `dvig_outbox_worker_start` : Démarrage worker (counter)
- `dvig_outbox_worker_complete` : Complétion worker (counter)

### 9.3 Logs Structurés

**Odoo** :
```python
_logger.info(
    f"job_vault_fetch_proof: Récupération preuve pour {move.name} "
    f"(move_id={move.id}, event_id={move.dorevia_dvig_event_id}, "
    f"idempotency_key={move.dorevia_vault_idempotency_key[:16]}...)"
)
```

**DVIG** :
```python
log.info(
    "internal_trigger_authenticated",
    token_hash=token_hash[:6]  # Hash du token (pas le token brut)
)
```

### 9.4 KPI d'Autonomie

**Performance** :
- p50 vaulting latency < 10s
- p95 < 60s
- Backlog outbox DVIG ≈ stable

**Robustesse** :
- Taux `failed_hard` < 0.1%
- Jobs en doublon = 0 (identity_key + anti-dup)

---

## 10. Interdictions Explicites (PROD)

### 10.1 FORB-1 — Boutons d'action manuelle (Outils de Diagnostic)

Les boutons type :
- "Trigger DVIG Worker Now"
- "Refresh Proof Now"

sont des **outils de diagnostic**, réservés à l'administrateur en environnements **non-PROD**.

**Caractéristiques** :
- ✅ **Outils de diagnostic uniquement** : Permettent de tester et diagnostiquer le système
- ✅ **Réservés à l'administrateur** : Visible uniquement pour le groupe `base.group_system`
- ✅ **Désactivés en PROD** : Protégés par un flag (`dorevia.debug.actions=0` en PROD)
- ✅ **N'interviennent jamais dans le processus de vaulting** : Le vaulting reste 100% automatisé

**Configuration** :
- **PROD** : `dorevia.debug.actions = 0` (défaut) → Boutons masqués et désactivés
- **DEV/STAGING** : `dorevia.debug.actions = 1` → Boutons visibles pour diagnostic

**Implémentation** :
- Champ computed `dorevia_debug_enabled` dans `account_move`
- Vérification dans `action_refresh_vault_proof()` et `action_trigger_dvig_worker()`
- Masquage conditionnel dans la vue XML (`invisible` si flag = 0)
- Erreur explicite si tentative d'utilisation en PROD

**Important** : Ces boutons sont **purement diagnostiques** et n'interviennent **jamais** dans le processus de vaulting automatisé. Le vaulting reste **100% autonome** même si ces boutons sont utilisés en DEV.

### 10.2 FORB-2 — Scripts SQL/curl comme procédure opérationnelle

Toute procédure de runbook doit se limiter à :
- ✅ Redémarrage service
- ✅ Vérification métriques
- ✅ Rotation token
- ✅ Consultation logs

**Interdictions** :
- ❌ Patch manuel de statuts/factures
- ❌ Correction SQL de `dorevia_vault_status`
- ❌ Curl pour "forcer" un vaulting

**Documentation** : À ajouter dans les runbooks (voir section 12.3)

---

## 11. Tests Fonctionnels

### 11.1 Tests Flag PROD (boutons debug)

#### Test 1 : Boutons masqués en PROD
**Prérequis** : `dorevia.debug.actions = 0`

**Actions** :
1. Ouvrir une facture en `pending_proof`
2. Vérifier que les boutons debug ne sont **pas** visibles

**Attendu** : Boutons invisibles

#### Test 2 : Boutons visibles en DEV
**Prérequis** : `dorevia.debug.actions = 1`

**Actions** :
1. Ouvrir une facture en `pending_proof`
2. Vérifier que les boutons debug **sont** visibles

**Attendu** : Boutons visibles

#### Test 3 : Erreur si utilisation en PROD
**Prérequis** : `dorevia.debug.actions = 0`

**Actions** :
1. Appeler directement `action_refresh_vault_proof()` (via RPC ou script)
2. Vérifier l'erreur

**Attendu** : `UserError` avec message clair "Cette action est désactivée en production"

#### Test 4 : Fonctionnement normal en DEV
**Prérequis** : `dorevia.debug.actions = 1`

**Actions** :
1. Cliquer sur "Refresh Proof Now"
2. Vérifier que le job est enqueued

**Attendu** : Job enqueued, notification utilisateur

### 11.2 Tests CRON Reconciler

#### Test 1 : Rattrapage automatique
**Prérequis** : Facture en `pending_proof` depuis > 3 minutes

**Actions** :
1. Créer une facture en `pending_proof`
2. Attendre 3 minutes
3. Vérifier que le CRON reconciler a traité la facture

**Attendu** : Job `fetch_proof` enqueued pour la facture

#### Test 2 : Limite 50 factures
**Prérequis** : 100 factures en `pending_proof`

**Actions** :
1. Créer 100 factures en `pending_proof`
2. Exécuter le CRON reconciler
3. Vérifier le nombre de jobs enqueued

**Attendu** : Maximum 50 jobs enqueued

#### Test 3 : Anti-duplication
**Prérequis** : Facture avec job `fetch_proof` déjà en cours

**Actions** :
1. Enqueue un job `fetch_proof` pour une facture
2. Exécuter le CRON reconciler
3. Vérifier qu'un seul job existe

**Attendu** : Un seul job (pas de doublon)

#### Test 4 : Identity_key
**Prérequis** : Facture en `pending_proof`

**Actions** :
1. Exécuter le CRON reconciler
2. Vérifier que le job créé a un `identity_key` correct

**Attendu** : `identity_key = "proof:{db_name}:{move_id}"`

### 11.3 Tests Seuils d'Abandon

#### Test 1 : MAX_ATTEMPTS
**Prérequis** : `dorevia.vault.max_attempts_proof = 20`

**Actions** :
1. Créer une facture avec `dorevia_vault_attempt_count = 20`
2. Appeler `job_vault_fetch_proof()`
3. Vérifier la transition

**Attendu** : Statut → `failed_hard`, log structuré avec `incident_type="vault_abandon_max_attempts"`

#### Test 2 : MAX_AGE
**Prérequis** : `dorevia.vault.max_age_pending_proof_hours = 24`

**Actions** :
1. Créer une facture avec `dorevia_vault_last_try_at = now() - 25 hours`
2. Appeler `job_vault_fetch_proof()`
3. Vérifier la transition

**Attendu** : Statut → `failed_hard`, log structuré avec `incident_type="vault_abandon_max_age"`

#### Test 3 : Logging structuré
**Prérequis** : Seuil dépassé

**Actions** :
1. Déclencher un abandon (MAX_ATTEMPTS ou MAX_AGE)
2. Vérifier les logs

**Attendu** : Log structuré avec `move_id`, `move_name`, `incident_type`, `reason`, `attempt_count`, `last_try_at`

#### Test 4 : Métrique incident
**Prérequis** : Module métriques disponible

**Actions** :
1. Déclencher un abandon
2. Vérifier la métrique

**Attendu** : Métrique `dorevia_vault_abandoned_count` incrémentée

### 11.4 Tests Identity_key queue_job

#### Test 1 : Anti-duplication proof
**Actions** :
1. Enqueue 2 jobs `fetch_proof` identiques simultanément (même `move_id`)
2. Vérifier le nombre de jobs créés

**Attendu** : Un seul job créé (queue_job détecte le doublon via `identity_key`)

#### Test 2 : Anti-duplication trigger_worker
**Actions** :
1. Enqueue 2 jobs `trigger_worker` identiques simultanément (même tenant)
2. Vérifier le nombre de jobs créés

**Attendu** : Un seul job créé

#### Test 3 : Format identity_key
**Actions** :
1. Enqueue un job `fetch_proof`
2. Vérifier le format de l'`identity_key`

**Attendu** : `identity_key = "proof:{db_name}:{move_id}"`

### 11.5 Tests Backoff Intelligent

#### Test 1 : Délais progressifs
**Actions** :
1. Simuler 5 tentatives avec 404
2. Vérifier les délais de retry

**Attendu** : Délais progressifs [5, 10, 20, 40, 120]s avec jitter

#### Test 2 : Jitter aléatoire
**Actions** :
1. Simuler 10 tentatives avec 404
2. Vérifier que les délais varient (jitter)

**Attendu** : Délais varient de ±3 secondes (jitter)

### 11.6 Tests Intégration End-to-End

#### Test 1 : Happy Path
**Actions** :
1. Poster une facture
2. Attendre < 15 secondes
3. Vérifier le statut

**Attendu** : Statut = `vaulted`, preuve récupérée

#### Test 2 : Vault 404 temporaire
**Actions** :
1. Poster une facture
2. Vault retourne 404 pendant 60s
3. Vérifier les retries

**Attendu** : Retries avec backoff intelligent, puis `vaulted` quand Vault répond

#### Test 3 : DVIG down temporaire
**Actions** :
1. Arrêter DVIG
2. Poster une facture
3. Redémarrer DVIG après 2 minutes
4. Vérifier le rattrapage

**Attendu** : Facture traitée via filet de sécurité (scheduler ou CRON)

#### Test 4 : Batch 20 factures
**Actions** :
1. Poster 20 factures simultanément
2. Vérifier qu'il n'y a pas de tempête de jobs

**Attendu** : Un seul job `trigger_worker`, puis jobs `fetch_proof` pour chaque facture (pas de doublons)

---

## 12. Déploiement

### 12.1 Pré-déploiement

- [ ] Vérifier que tous les tests fonctionnels passent
- [ ] Vérifier que le code compile sans erreur
- [ ] Vérifier que la documentation est à jour

### 12.2 Déploiement

#### 12.2.1 Mise à jour Module Odoo

```bash
# Mettre à jour le module
odoo -c /etc/odoo/odoo.conf -d <database> -u dorevia_vault_connector --stop-after-init
```

#### 12.2.2 Configuration Paramètres Système

```python
# Dans Odoo : Paramètres → Technique → Paramètres → Paramètres Système

# Flag PROD (obligatoire)
dorevia.debug.actions = 0  # PROD

# Seuils d'abandon (optionnel, valeurs par défaut)
dorevia.vault.max_attempts_proof = 20
dorevia.vault.max_age_pending_proof_hours = 24

# Configuration existante
dorevia.dvig.internal.token = <token>
dorevia.vault.url = <url>
dorevia.vault.token = <token>
```

#### 12.2.3 Vérification CRON Reconciler

```bash
# Vérifier que le CRON est actif
odoo -c /etc/odoo/odoo.conf -d <database> shell
>>> env['ir.cron'].search([('name', '=', 'Vault Reconciler')])
```

### 12.3 Documentation Runbooks

**À ajouter dans les runbooks** :

```markdown
## ⚠️ Interdictions Explicites (PROD)

### FORB-1 : Boutons d'action manuelle
Les boutons "Trigger DVIG Worker Now" et "Refresh Proof Now" sont **interdits en PROD**.
Ils sont désactivés par défaut via le paramètre `dorevia.debug.actions = 0`.

### FORB-2 : Scripts SQL/curl pour corriger factures
**Interdit** :
- ❌ Patch SQL de `dorevia_vault_status`
- ❌ Curl pour "forcer" un vaulting
- ❌ Correction manuelle de statuts

**Autorisé** :
- ✅ Redémarrage service
- ✅ Vérification métriques
- ✅ Rotation token
- ✅ Consultation logs

Si une facture est bloquée, diagnostiquer la cause (logs, métriques) plutôt que corriger manuellement.
```

---

## 13. Checklist de Conformité "No Human In The Loop"

- [x] Les boutons debug sont OFF en PROD (flag `dorevia.debug.actions = 0`)
  - ✅ Boutons masqués et désactivés en PROD
  - ✅ Outils de diagnostic uniquement (n'interviennent jamais dans le processus automatisé)
  - ✅ Réservés à l'administrateur en environnements non-PROD
- [x] Anti-dup proof + identity_key activés
- [x] Backoff + jitter activés
- [x] Reconciler CRON activé (léger, toutes les 3 min)
- [x] DVIG scheduler activé (filet #1, toutes les 30s)
- [x] Seuils max tentatives/âge → `failed_hard` + incident
- [x] `/internal/*` non exposé publiquement (infrastructure)
- [ ] Aucune doc runbook ne propose SQL/curl pour "corriger" une facture (à documenter)

---

## 14. Références

- **Évaluation SPEC v1.1.0** : `ZeDocs/TestV3/EVALUATION_SPEC_ORCHESTRATION_TEMPS_REEL_v1.1.0.md`
- **Rapport implémentation v1.1.0** : `ZeDocs/TestV3/RAPPORT_IMPLEMENTATION_v1.1.0.md`
- **Évaluation recommandations** : `ZeDocs/TestV3/EVALUATION_RECOMMANDATIONS_ARCHITECTURE_v1.1.0.md`
- **Implémentation recommandations** : `ZeDocs/TestV3/IMPLEMENTATION_RECOMMANDATIONS_ARCHITECTURE_v1.1.0.md`
- **Évaluation addendum** : `ZeDocs/TestV3/EVALUATION_ADDENDUM_NO_HUMAN_IN_THE_LOOP_v1.1.1-add1.md`
- **Implémentation addendum** : `ZeDocs/TestV3/IMPLEMENTATION_ADDENDUM_NO_HUMAN_IN_THE_LOOP_v1.1.1-add1.md`
- **Guide orchestration** : `units/odoo/custom-addons/dorevia_vault_connector/GUIDE_ORCHESTRATION_QUEUE_JOB_v1.0.md`

---

**Date de création** : 2026-01-12  
**Version** : 1.1.1 (Finale)  
**Statut** : ✅ **APPROUVÉE ET IMPLÉMENTÉE**

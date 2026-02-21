# 🔧 Documentation Technique — Dorevia Vaulting Automatique v1.1

**Version** : 1.0  
**Date** : 2026-01-11  
**Module** : `dorevia_vault_connector`

---

## 🏗️ Architecture

### Vue d'Ensemble

```
┌─────────────┐
│  Odoo       │
│  action_post│
└──────┬──────┘
       │ 1. Initialise status='todo'
       │    (aucun appel réseau)
       ▼
┌─────────────────┐
│  CRON #1        │  Toutes les 5 min
│  (Envoi DVIG)   │
└──────┬──────────┘
       │ 2. Envoie vers DVIG
       ▼
┌─────────────┐
│    DVIG     │
└──────┬──────┘
       │ 3. Traite et envoie vers Vault
       ▼
┌─────────────┐
│    Vault    │
└──────┬──────┘
       │ 4. Génère preuve
       ▼
┌─────────────────┐
│  CRON #2        │  Toutes les 5 min
│  (Récup preuve) │
└──────┬──────────┘
       │ 5. Récupère preuve
       ▼
┌─────────────┐
│  Status =   │
│  vaulted    │
└─────────────┘
```

---

## 🔄 Machine d'État

### Transitions

```
todo ──[CRON #1]──> pending_proof ──[CRON #2]──> vaulted
  │                      │
  │                      │ (erreur soft)
  │                      ▼
  │                  failed_soft ──[backoff]──> todo
  │
  │ (erreur)
  ▼
failed_soft ──[backoff]──> todo
  │
  │ (erreur hard)
  ▼
failed_hard (final)
```

### Champs de la Machine d'État

| Champ | Type | Description |
|-------|------|-------------|
| `dorevia_vault_status` | Selection | Statut actuel (todo, pending_proof, vaulted, failed_soft, failed_hard) |
| `dorevia_vault_last_try_at` | Datetime | Date/heure de la dernière tentative |
| `dorevia_vault_attempt_count` | Integer | Nombre de tentatives effectuées |
| `dorevia_vault_last_error` | Text | Message de la dernière erreur |
| `dorevia_vault_next_retry_at` | Datetime | Date/heure de la prochaine tentative (backoff) |
| `dorevia_dvig_event_id` | Char | Identifiant de l'événement DVIG (UUID) |
| `dorevia_vault_idempotency_key` | Char | Clé SHA256 pour idempotence |

---

## ⏱️ CRON Jobs

### CRON #1 — Envoi DVIG

**Fréquence** : Toutes les 5 minutes  
**Méthode** : `cron_vault_send_dvig()`

**Sélection** :
```python
[
    ('state', '=', 'posted'),
    ('move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']),
    ('dorevia_vault_status', 'in', ['todo', 'failed_soft']),
    '|',
    ('dorevia_vault_next_retry_at', '<=', now()),
    ('dorevia_vault_next_retry_at', '=', False),
]
```

**Batch** : 50 max

**Actions** :
1. Vérification idempotence
2. Construction payload DVIG
3. Envoi vers `/ingest`
4. Succès : `status = pending_proof`, stockage `event_id`
5. Échec : Classification + backoff

### CRON #2 — Récupération Preuve

**Fréquence** : Toutes les 5 minutes  
**Méthode** : `cron_vault_fetch_proof()`

**Sélection** :
```python
[
    ('dorevia_vault_status', '=', 'pending_proof'),
    ('dorevia_dvig_event_id', '!=', False),
]
```

**Batch** : 50 max

**Actions** :
1. Appel Vault : `/api/v1/proof/{dorevia_dvig_event_id}`
2. Succès : `status = vaulted`, stockage preuves
3. Échec : Classification + backoff (si soft)

### CRON Métriques

**Fréquence** : Toutes les heures  
**Méthode** : `cron_compute_metrics()`

**Actions** :
1. Calcul des métriques pour aujourd'hui
2. Création/mise à jour de l'enregistrement `dorevia.vault.metric`

---

## 🔐 Idempotence

### Formule

```
SHA256(source + model + record_id + event_type + posted_at)
```

**Exemple** :
```
source = "odoo.stinger.sarl-la-platine"
model = "account.move"
record_id = "12345"
event_type = "invoice.posted"
posted_at = "2026-01-11T10:30:00+00:00"

key_string = "odoo.stinger.sarl-la-platineaccount.move12345invoice.posted2026-01-11T10:30:00+00:00"
idempotency_key = SHA256(key_string)
```

### Protection

- **Index UNIQUE** sur `dorevia_vault_idempotency_key`
- **Vérification** avant chaque envoi DVIG
- **Détection doublons** : Si clé existante avec status=vaulted ou pending_proof, mise à jour du statut

---

## 🔁 Backoff Exponentiel

### Formule

```python
next_retry = now() + min(2 ** attempt_count * 60, 3600)
```

### Table de Délais

| Tentative | Délai | Calcul |
|-----------|-------|--------|
| 1 | 2 min | 2^1 * 60 = 120s |
| 2 | 4 min | 2^2 * 60 = 240s |
| 3 | 8 min | 2^3 * 60 = 480s |
| 4 | 16 min | 2^4 * 60 = 960s |
| 5+ | 60 min | Plafond 3600s |

### Utilisation

- Calculé automatiquement après chaque échec (failed_soft)
- Stocké dans `dorevia_vault_next_retry_at`
- CRON #1 ne traite que les factures avec `next_retry_at <= now()`

---

## 🚨 Classification Erreurs

### Règles

#### failed_soft (Retry avec backoff)

- **Timeout** : `requests.exceptions.Timeout`
- **502** : Bad Gateway
- **503** : Service Unavailable
- **Erreur réseau** : `requests.exceptions.ConnectionError`
- **Autres HTTPError** : Par défaut (peut être temporaire)

#### failed_hard (Pas de retry)

- **400** : Bad Request (payload invalide)
- **401** : Unauthorized (auth)
- **403** : Forbidden
- **404** : Not Found (document inexistant)

### Implémentation

```python
def _classify_error(self, exception, status_code=None):
    if status_code in [400, 401, 403, 404]:
        return 'failed_hard'
    elif status_code in [502, 503]:
        return 'failed_soft'
    elif isinstance(exception, requests.exceptions.Timeout):
        return 'failed_soft'
    # ...
```

---

## 📊 Métriques

### Modèle

`dorevia.vault.metric`

### Champs

| Champ | Type | Description |
|-------|------|-------------|
| `date` | Date | Date de la métrique |
| `total_sent` | Integer | Nombre total envoyé vers DVIG |
| `success` | Integer | Nombre de succès (vaulted) |
| `failed_soft` | Integer | Nombre d'échecs temporaires |
| `failed_hard` | Integer | Nombre d'échecs définitifs |
| `backlog` | Integer | Nombre en attente (todo + pending_proof + failed_soft) |

### Calcul

```python
# Total envoyé
total_sent = COUNT(dorevia_dvig_event_id != False)

# Succès
success = COUNT(dorevia_vault_status = 'vaulted')

# Failed soft
failed_soft = COUNT(dorevia_vault_status = 'failed_soft')

# Failed hard
failed_hard = COUNT(dorevia_vault_status = 'failed_hard')

# Backlog
backlog = COUNT(dorevia_vault_status IN ('todo', 'pending_proof', 'failed_soft'))
```

---

## 🔌 API Endpoints

### DVIG

**Endpoint** : `{dvig_url}/ingest`  
**Méthode** : POST  
**Auth** : Bearer Token  
**Payload** : Format DVIG P1

### Vault

**Endpoint** : `/api/v1/proof/{dorevia_dvig_event_id}`  
**Méthode** : GET  
**Auth** : Bearer Token (optionnel)  
**Réponse** : Document avec preuves (id, hash, jws, ledger_hash, etc.)

---

## 🗄️ Base de Données

### Index

| Index | Colonnes | Type | Description |
|-------|----------|------|-------------|
| `idx_account_move_vault_status` | `dorevia_vault_status` | B-tree | Optimisation CRON #1 |
| `idx_account_move_vault_next_retry` | `dorevia_vault_next_retry_at` | B-tree | Optimisation CRON #1 |
| `idx_account_move_dvig_event_id_unique` | `dorevia_dvig_event_id` | UNIQUE | Anti-replay |
| `idx_account_move_idempotency_key_unique` | `dorevia_vault_idempotency_key` | UNIQUE | Idempotence |

### Contraintes

- **UNIQUE** sur `dorevia_dvig_event_id` (anti-replay)
- **UNIQUE** sur `dorevia_vault_idempotency_key` (idempotence)
- **UNIQUE** sur `dorevia.vault.metric.date` (une métrique par jour)

---

## 🔄 Migration v1.0 → v1.1

### Script de Migration

```python
env['account.move'].migrate_vault_status_v1_1()
```

### Conversions

1. `dorevia_vaulted=True` → `dorevia_vault_status='vaulted'`
2. Factures `posted` non vaultées → `dorevia_vault_status='todo'`
3. Calcul `dorevia_vault_idempotency_key` pour toutes les factures

Voir `MIGRATION_V1.0_TO_V1.1.md` pour les détails.

---

## 🧪 Tests

### Structure Recommandée

```
tests/
├── test_vault_status.py          # Tests machine d'état
├── test_idempotence.py           # Tests idempotence
├── test_backoff.py               # Tests backoff
├── test_classification.py       # Tests classification erreurs
├── test_cron_send_dvig.py        # Tests CRON #1
├── test_cron_fetch_proof.py      # Tests CRON #2
└── integration/
    └── test_end_to_end.py        # Tests d'intégration
```

### Couverture Cible

- **Machine d'état** : Tous les statuts et transitions
- **Idempotence** : Calcul clé, détection doublons
- **Backoff** : Toutes les tentatives (1-5+)
- **Classification** : Tous les types d'erreurs
- **CRON #1** : Envoi DVIG, gestion erreurs
- **CRON #2** : Récupération preuve, gestion erreurs

---

## 📝 Logs

### Niveaux de Log

- **INFO** : Succès, transitions de statut
- **WARNING** : Erreurs temporaires, configuration manquante
- **ERROR** : Erreurs définitives, exceptions

### Exemples

```
INFO: Facture F2025-00123 initialisée pour vaulting asynchrone (status=todo)
INFO: CRON #1 : Envoi facture F2025-00123 vers DVIG
INFO: CRON #1 : Facture F2025-00123 envoyée avec succès (event_id: abc-123)
INFO: CRON #2 : Récupération preuve pour facture F2025-00123
INFO: CRON #2 : Preuve récupérée avec succès pour facture F2025-00123
ERROR: CRON #1 : Erreur HTTP 401 pour F2025-00123: Token invalide (classification: failed_hard)
WARNING: CRON #1 : Erreur réseau pour F2025-00123: Connection timeout (classification: failed_soft)
```

---

## 🔒 Sécurité

### Authentification

- **DVIG** : Bearer Token (paramètre système)
- **Vault** : Bearer Token (paramètre système, optionnel)

### Protection

- **Idempotence** : Clé SHA256 unique
- **Anti-replay** : Index UNIQUE sur `dorevia_dvig_event_id`
- **Isolation** : Chaque tenant a sa propre source

---

## 🚀 Déploiement

### Prérequis

1. Module `dorevia_posted_lock` installé
2. Configuration DVIG complète
3. Migration v1.0 → v1.1 exécutée (si upgrade)

### Étapes

1. **Mettre à jour le module** : Apps → Dorevia Vault Connector → Mettre à jour
2. **Exécuter migration** : `env['account.move'].migrate_vault_status_v1_1()`
3. **Vérifier CRON** : Paramètres → Technique → Automatisation → CRON
4. **Tester** : Valider une facture et vérifier le statut

---

## 📚 Références

- **SPEC** : `SPEC_DOREVIA_VAULTIG_AUTO_v1.1.md`
- **Plan d'implémentation** : `PLAN_IMPLEMENTATION_VAULTIG_AUTO_v1.1_SCRUM.md`
- **Guide utilisateur** : `GUIDE_VAULTING_AUTO_v1.1.md`
- **Migration** : `MIGRATION_V1.0_TO_V1.1.md`

---

**Document créé** : 2026-01-11  
**Auteur** : Dorevia Team

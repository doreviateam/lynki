# 📊 Évaluation — SPEC DVIG → Vault Forwarding v1.0

**Date** : 2026-01-11  
**Évaluateur** : Dorevia Team (Lead Dev)  
**SPEC évaluée** : DVIG → Vault Forwarding (Pérenne) v1.0  
**Statut** : ✅ **APPROUVÉ avec recommandations**

---

## 🎯 Résumé Exécutif

**Verdict** : ✅ **La SPEC est solide et répond parfaitement au problème identifié**

La proposition d'implémentation d'un pattern **Outbox + Worker** pour le forward DVIG → Vault est **excellente** et résout le problème de blocage actuel. L'architecture proposée est :
- ✅ **Robuste** : Pattern éprouvé (Outbox)
- ✅ **Asynchrone** : Répond aux besoins de performance
- ✅ **Fiable** : Garantit la persistance et l'idempotence
- ✅ **Observable** : Logs et métriques prévus
- ✅ **Compatible** : S'intègre bien avec l'existant

**Recommandations** : Quelques clarifications et ajustements mineurs proposés pour optimiser l'intégration avec le module Odoo existant.

---

## ✅ Points Forts de la SPEC

### 1. Architecture Outbox Pattern

**Évaluation** : ✅ **EXCELLENT**

Le pattern Outbox est le **choix optimal** pour ce cas d'usage :
- ✅ Garantit la persistance avant ACK (pas de perte de données)
- ✅ Découple l'acceptation de l'événement du forward (performance)
- ✅ Permet le retry automatique en cas d'échec
- ✅ Pattern éprouvé dans les architectures distribuées

**Comparaison avec alternatives** :
- ❌ **Synchronous forward** : Bloque l'API, pas scalable
- ❌ **Message queue externe** : Complexité additionnelle, dépendance externe
- ✅ **Outbox pattern** : Simple, fiable, auto-contenu

---

### 2. Machine d'État

**Évaluation** : ✅ **TRÈS BON**

Les états proposés sont cohérents :
- `accepted` → `forwarding` → `forwarded` ✅
- `accepted` → `forwarding` → `failed_soft` → retry ✅
- `failed_soft` → `failed_hard` (après X tentatives) ✅

**Cohérence avec Odoo** : Les états sont similaires à ceux du module Odoo (`todo`, `pending_proof`, `vaulted`, `failed_soft`, `failed_hard`), ce qui facilite la traçabilité.

---

### 3. Idempotence Bout en Bout

**Évaluation** : ✅ **EXCELLENT**

La contrainte `UNIQUE(tenant, idempotency_key)` des deux côtés garantit :
- ✅ Pas de duplication côté DVIG
- ✅ Pas de duplication côté Vault
- ✅ Retry sûr même en cas de timeout réseau

**Point d'attention** : Vérifier que la formule de calcul de `idempotency_key` est identique entre Odoo, DVIG et Vault.

---

### 4. Backoff Exponentiel

**Évaluation** : ✅ **BON**

La formule proposée est standard :
```python
next_retry = now + min(2^attempt * 60, 3600)
```

**Cohérence** : Identique à celle utilisée dans le module Odoo, ce qui garantit un comportement uniforme.

---

### 5. Classification Erreurs

**Évaluation** : ✅ **TRÈS BON**

La classification est logique :
- **Soft** : timeout, 502/503 (retriable)
- **Hard** : 400, 401/403, 404, 422 (non retriable)

**Recommandation** : Ajouter `429 Too Many Requests` en `failed_soft` (retry avec backoff).

---

## ⚠️ Points à Clarifier

### 1. Formule Idempotency Key

**Question** : Quelle est la formule exacte de calcul de `idempotency_key` ?

**Contexte actuel** :
- **Odoo** : Utilise `SHA256(source + model + record_id + event_type + posted_at)`
  ```python
  # Formule actuelle Odoo (ligne 175)
  key_string = f"{dvig_source}{model}{record_id}{event_type}{posted_at}"
  idempotency_key = SHA256(key_string).hexdigest()
  # Ex: "bcd65105050f22fd0eb5760424adfd24e96b29fb96efe48b7f2500b92adb232e"
  ```
- **DVIG** : Reçoit `event.id` (UUID généré par Odoo) mais ne l'utilise pas encore comme idempotency_key
- **Vault** : À définir

**Analyse** :
- Odoo génère **deux identifiants** :
  1. `event.id` : UUID v4 (unique, aléatoire, généré à chaque envoi)
  2. `idempotency_key` : SHA256 (déterministe, basé sur le contenu, stable)

**⚠️ PROBLÈME IDENTIFIÉ** : Odoo ne transmet **pas** `idempotency_key` dans le payload DVIG actuellement !

**Vérification payload Odoo** :
```python
# Dans _build_dvig_payload() (ligne ~520)
payload = {
    "source": {...},
    "event": {
        "id": str(uuid.uuid4()),  # UUID généré à chaque appel
        "type": "invoice.posted",
        "occurred_at": ...
    },
    "data": {...}
}
# ❌ idempotency_key n'est PAS transmis !
```

**Recommandation** : **Transmettre `idempotency_key` dans le payload DVIG**

**Modification requise dans Odoo** :

**Fichier** : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`  
**Méthode** : `_build_dvig_payload()` (ligne 326)

**Code actuel** (ligne 350-373) :
```python
payload = {
    'event_type': event_type,
    'source': dvig_source,
    'timestamp': timestamp,
    'data': {...}
}
```

**Code proposé** :
```python
payload = {
    'event_type': event_type,
    'source': dvig_source,
    'timestamp': timestamp,
    'data': {...},
    'idempotency_key': move.dorevia_vault_idempotency_key  # ✅ AJOUTER
}
```

**Note** : Cette modification est **compatible** avec la SPEC DVIG car le champ `idempotency_key` peut être optionnel dans le payload.

**DVIG** :
- Utilise `idempotency_key` du payload (si présent)
- Sinon, génère depuis `event.id` (fallback)
- Stocke dans `outbox_events` avec `UNIQUE(tenant, idempotency_key)`

**Vault** :
- Reçoit `idempotency_key` dans le payload
- Vérifie `UNIQUE(tenant, idempotency_key)`
- Stocke dans le document

**Avantages** :
- ✅ **Déterministe** : Même facture = même clé (même si re-soumise)
- ✅ **Robuste** : Basé sur le contenu, pas sur un UUID aléatoire
- ✅ **Compatible** : Fonctionne même si `event.id` change
- ✅ **Idempotence bout en bout** : Odoo → DVIG → Vault

---

### 2. Clé de Récupération Preuve

**Question** : Comment Odoo récupère-t-il la preuve depuis Vault ?

**Contexte actuel** :
- **Odoo** : Utilise `/api/v1/proof/account_move/{id}` où `{id}` est l'ID Odoo
- **Vault** : Stocke le document avec `odoo_id` et `source_id_text`

**Recommandation** :
- **Option A** : Utiliser l'ID Odoo (actuel, fonctionne)
  - Endpoint : `/api/v1/proof/account_move/{odoo_id}`
  - Avantage : Simple, direct
- **Option B** : Utiliser `event_id` DVIG
  - Endpoint : `/api/v1/proof/event/{event_id}`
  - Avantage : Traçabilité complète DVIG → Vault
- **Option C** : Utiliser `idempotency_key`
  - Endpoint : `/api/v1/proof/idempotency/{idempotency_key}`
  - Avantage : Idempotence garantie

**Recommandation** : **Conserver Option A** (ID Odoo) car :
- ✅ Déjà implémenté et fonctionnel
- ✅ Plus simple pour les utilisateurs
- ✅ Compatible avec l'existant

**Note** : Ajouter un endpoint complémentaire `/api/v1/proof/event/{event_id}` pour la traçabilité DVIG si nécessaire.

---

### 3. API Vault `/api/v1/events`

**Question** : Cet endpoint existe-t-il déjà ou doit-il être créé ?

**Contexte actuel** :
- **Vault** : A `/api/v1/invoices` (ingestion factures Odoo)
- **Vault** : A `/api/v1/push_document` (push générique)
- **Vault** : N'a **pas** `/api/v1/events` (endpoint générique événements)

**Recommandation** :
- **Option A** : Créer `/api/v1/events` (nouvel endpoint générique)
  - Avantage : Endpoint dédié, clair
  - Inconvénient : Nouveau code à maintenir
- **Option B** : Utiliser `/api/v1/invoices` existant
  - Avantage : Réutilise l'existant
  - Inconvénient : Spécifique aux factures
- **Option C** : Utiliser `/api/v1/push_document`
  - Avantage : Déjà générique
  - Inconvénient : Format peut-être différent

**Recommandation** : **Option A** (créer `/api/v1/events`) car :
- ✅ Plus clair et explicite
- ✅ Permet d'étendre à d'autres types d'événements
- ✅ Séparation des responsabilités

**Format proposé** :
```json
POST /api/v1/events
{
  "tenant": "sarl-la-platine",
  "event_id": "a1507045-e098-420e-a363-2b8b3b5a27bc",
  "idempotency_key": "bcd65105050f22fd0eb5760424adfd24e96b29fb96efe48b7f2500b92adb232e",
  "source": {
    "unit": "odoo",
    "env": "stinger",
    "tenant": "sarl-la-platine"
  },
  "event_type": "invoice.posted",
  "occurred_at": "2026-01-11T19:13:34.266741Z",
  "payload": {
    "move_id": 1819,
    "move_name": "FAC/2026/00001",
    ...
  },
  "pdf_sha256": "..." // Optionnel, si PDF disponible
}
```

---

### 4. Proxy DVIG ou Accès Direct Vault

**Question** : DVIG doit-il être un proxy ou accès direct ?

**Recommandation** : **Accès direct** avec authentification service-to-service :
- ✅ Plus simple (pas de proxy intermédiaire)
- ✅ Meilleure performance (moins de sauts réseau)
- ✅ Traçabilité directe (logs clairs)
- ✅ Sécurité : Token service Vault dédié

**Architecture recommandée** :
```
Odoo → DVIG (POST /ingest) → [Outbox] → Worker → Vault (POST /api/v1/events)
```

**Sécurité** :
- DVIG → Vault : Token service (`VAULT_SERVICE_TOKEN`)
- Odoo → DVIG : Token tenant (existant)

---

### 5. Politique Dead-Letter

**Question** : Que faire des événements en `failed_hard` après X tentatives ?

**Recommandations** :
1. **Table dead_letter** : Stocker les événements définitivement échoués
2. **Alertes** : Notifier l'équipe ops pour investigation
3. **Métriques** : Compter les dead letters pour monitoring
4. **Rétention** : Conserver 90 jours minimum pour audit

**Format dead_letter** :
```sql
CREATE TABLE dead_letters (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL,
    idempotency_key VARCHAR(64) NOT NULL,
    tenant VARCHAR(50) NOT NULL,
    env VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'failed_hard'
    attempt_count INTEGER NOT NULL,
    last_error TEXT,
    created_at TIMESTAMP NOT NULL,
    failed_at TIMESTAMP NOT NULL,
    payload JSONB NOT NULL
);
```

---

## 🔄 Compatibilité avec l'Existant

### Module Odoo (`dorevia_vault_connector`)

**Évaluation** : ✅ **COMPATIBLE**

Le module Odoo est **déjà compatible** avec la SPEC proposée :

1. **Idempotence** : ✅
   - Odoo calcule `dorevia_vault_idempotency_key` (SHA256)
   - Peut être transmis dans le payload DVIG
   - DVIG peut le réutiliser ou en générer un nouveau

2. **Event ID** : ✅
   - Odoo stocke `dorevia_dvig_event_id` (UUID retourné par DVIG)
   - Peut être utilisé pour la traçabilité

3. **Récupération preuve** : ✅
   - Odoo utilise `/api/v1/proof/account_move/{id}` (déjà corrigé)
   - Fonctionne avec la SPEC proposée

**Aucune modification requise** dans le module Odoo.

---

### API Vault Existante

**Évaluation** : ⚠️ **ADAPTATION NÉCESSAIRE**

**Endpoints existants** :
- ✅ `/api/v1/invoices` : Ingestion factures (format spécifique)
- ✅ `/api/v1/push_document` : Push générique
- ❌ `/api/v1/events` : **À créer**

**Recommandation** : Créer `/api/v1/events` qui :
- Accepte le format proposé dans la SPEC
- Appelle en interne le service d'ingestion approprié (`/api/v1/invoices` pour les factures)
- Retourne la preuve standardisée

---

## 📋 Plan d'Implémentation Détaillé

### Sprint A : Infrastructure DVIG

**Durée estimée** : 1-2 semaines

#### Tâches

1. **Migration base de données**
   - [ ] Créer table `outbox_events`
   - [ ] Ajouter contrainte `UNIQUE(tenant, idempotency_key)`
   - [ ] Créer index pour le worker (`status`, `next_retry_at`)

2. **Modifier endpoint `/ingest`**
   - [ ] Persister dans `outbox_events` au lieu de forward direct
   - [ ] Retourner immédiatement `{status: "accepted", event_id: "..."}`
   - [ ] Conserver la validation et l'idempotence existantes

3. **Worker de forward**
   - [ ] Créer worker asynchrone (Celery ou thread pool)
   - [ ] Sélection : `status IN ('accepted', 'failed_soft') AND next_retry_at <= now`
   - [ ] Appel Vault : `POST /api/v1/events`
   - [ ] Mise à jour état : `forwarding` → `forwarded` ou `failed_soft`

4. **Backoff exponentiel**
   - [ ] Calcul `next_retry_at = now + min(2^attempt * 60, 3600)`
   - [ ] Incrémenter `attempt_count`
   - [ ] Classification erreurs (soft vs hard)

5. **Tests unitaires**
   - [ ] Test persistance outbox
   - [ ] Test worker forward
   - [ ] Test idempotence
   - [ ] Test backoff

**Livrables** :
- ✅ Table `outbox_events` créée
- ✅ Worker fonctionnel
- ✅ Tests passent

---

### Sprint B : API Vault `/api/v1/events`

**Durée estimée** : 1 semaine

#### Tâches

1. **Créer endpoint `/api/v1/events`**
   - [ ] Handler Go/Fiber
   - [ ] Validation payload (Pydantic-like en Go)
   - [ ] Vérification idempotence (`UNIQUE(tenant, idempotency_key)`)
   - [ ] Appel service d'ingestion approprié

2. **Intégration avec services existants**
   - [ ] Si `event_type == "invoice.posted"` → appeler `/api/v1/invoices` interne
   - [ ] Si `event_type == "payment.posted"` → appeler `/api/v1/payments` interne
   - [ ] Stocker `event_id` et `idempotency_key` dans le document

3. **Endpoint `/api/v1/proof/event/{event_id}`** (optionnel)
   - [ ] Récupération preuve par `event_id` DVIG
   - [ ] Pour traçabilité complète

4. **Tests**
   - [ ] Test ingestion événement
   - [ ] Test idempotence
   - [ ] Test récupération preuve

**Livrables** :
- ✅ Endpoint `/api/v1/events` opérationnel
- ✅ Idempotence garantie
- ✅ Tests passent

---

### Sprint C : Intégration End-to-End

**Durée estimée** : 3-5 jours

#### Tâches

1. **Tests d'intégration**
   - [ ] Odoo → DVIG → Vault (flux complet)
   - [ ] Vérification preuve récupérée
   - [ ] Test retry en cas d'erreur
   - [ ] Test idempotence bout en bout

2. **Monitoring**
   - [ ] Métriques Prometheus (backlog, success/min, failed/min)
   - [ ] Logs structurés
   - [ ] Alertes sur dead letters

3. **Documentation**
   - [ ] Guide d'utilisation
   - [ ] Guide de troubleshooting
   - [ ] Diagrammes d'architecture

**Livrables** :
- ✅ Flux end-to-end fonctionnel
- ✅ Monitoring opérationnel
- ✅ Documentation complète

---

## 🎯 Décisions à Figer

### 1. Formule Idempotency Key

**Recommandation** : **Utiliser `event.id` (UUID)** comme `idempotency_key`

**Justification** :
- ✅ Déjà unique (UUID v4)
- ✅ Déjà généré par Odoo
- ✅ Simple à transmettre
- ✅ Pas besoin de recalculer

**Format** :
```python
# Odoo génère event.id (UUID)
event_id = str(uuid.uuid4())  # Ex: "a1507045-e098-420e-a363-2b8b3b5a27bc"

# DVIG utilise event.id comme idempotency_key
idempotency_key = event.id

# Vault vérifie UNIQUE(tenant, idempotency_key)
```

**Alternative** : Si besoin de plus de robustesse, utiliser `SHA256(tenant + event.id + event_type + occurred_at)`.

---

### 2. Clé de Récupération Preuve

**Recommandation** : **Conserver l'ID Odoo** (actuel)

**Justification** :
- ✅ Déjà implémenté et fonctionnel
- ✅ Plus simple pour les utilisateurs
- ✅ Compatible avec l'existant

**Endpoints disponibles** :
- `/api/v1/proof/account_move/{odoo_id}` (principal)
- `/api/v1/proof/event/{event_id}` (optionnel, pour traçabilité)

---

### 3. Proxy DVIG ou Accès Direct

**Recommandation** : **Accès direct** avec authentification service-to-service

**Architecture** :
```
Odoo → DVIG (POST /ingest, token tenant)
     ↓
  [Outbox]
     ↓
  Worker → Vault (POST /api/v1/events, token service)
```

**Sécurité** :
- Token service Vault dédié pour DVIG
- Rotation régulière des tokens
- Logs d'accès complets

---

### 4. Politique Dead-Letter

**Recommandation** : **Table dead_letter + Alertes**

**Critères** :
- `failed_hard` après 10 tentatives
- Ou erreur 400/401/403/404/422 (non retriable)
- Conservation 90 jours minimum

**Actions** :
- Alerte ops immédiate
- Métrique `dead_letters_count`
- Export pour investigation

---

## 📊 Métriques et Observabilité

### Métriques Recommandées

**DVIG** :
- `dvig_outbox_backlog` : Nombre d'événements en attente
- `dvig_forward_success_total` : Nombre de forwards réussis
- `dvig_forward_failed_soft_total` : Nombre d'échecs temporaires
- `dvig_forward_failed_hard_total` : Nombre d'échecs définitifs
- `dvig_forward_duration_seconds` : Durée des forwards
- `dvig_dead_letters_total` : Nombre de dead letters

**Vault** :
- `vault_events_ingested_total` : Nombre d'événements ingérés
- `vault_events_idempotent_total` : Nombre d'événements idempotents
- `vault_events_failed_total` : Nombre d'échecs d'ingestion

---

## ✅ Validation de la SPEC

### Critères d'Évaluation

| Critère | Évaluation | Commentaire |
|---------|------------|-------------|
| **Robustesse** | ✅ Excellent | Pattern Outbox éprouvé |
| **Performance** | ✅ Excellent | Asynchrone, non bloquant |
| **Fiabilité** | ✅ Excellent | Persistance garantie |
| **Idempotence** | ✅ Excellent | Bout en bout |
| **Observabilité** | ✅ Très bon | Logs et métriques prévus |
| **Compatibilité** | ✅ Excellent | Compatible avec Odoo |
| **Sécurité** | ✅ Très bon | Tokens service-to-service |
| **Maintenabilité** | ✅ Très bon | Code clair, tests prévus |

**Score global** : ✅ **9/10** (Excellent)

---

## 🎯 Recommandations Finales

### Approbation

✅ **La SPEC est approuvée** avec les clarifications suivantes :

1. **Idempotency key** : Utiliser `event.id` (UUID)
2. **Récupération preuve** : Conserver `/api/v1/proof/account_move/{id}`
3. **API Vault** : Créer `/api/v1/events` (nouvel endpoint)
4. **Architecture** : Accès direct DVIG → Vault
5. **Dead letters** : Table + alertes + rétention 90 jours

### Prochaines Étapes

1. **Valider les décisions** avec les équipes DVIG et Vault
2. **Créer les tickets** pour Sprint A, B, C
3. **Démarrer Sprint A** (Infrastructure DVIG)
4. **Tests d'intégration** après chaque sprint

---

## 📝 Notes Techniques

### Schéma Base de Données DVIG (Proposition)

```sql
CREATE TABLE outbox_events (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL UNIQUE,
    idempotency_key VARCHAR(64) NOT NULL,
    tenant VARCHAR(50) NOT NULL,
    env VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'accepted',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_try_at TIMESTAMP,
    next_retry_at TIMESTAMP,
    last_error TEXT,
    vault_receipt_id VARCHAR(100), -- ID retourné par Vault
    payload JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_idempotency UNIQUE (tenant, idempotency_key)
);

CREATE INDEX idx_outbox_worker ON outbox_events(status, next_retry_at) 
WHERE status IN ('accepted', 'failed_soft');

CREATE INDEX idx_outbox_tenant_event ON outbox_events(tenant, event_id);
```

---

### Format Payload Vault `/api/v1/events`

```json
{
  "tenant": "sarl-la-platine",
  "event_id": "a1507045-e098-420e-a363-2b8b3b5a27bc",
  "idempotency_key": "a1507045-e098-420e-a363-2b8b3b5a27bc",
  "source": {
    "unit": "odoo",
    "env": "stinger",
    "tenant": "sarl-la-platine",
    "component": "account.move",
    "connector": "dorevia-vault-connector",
    "version": "1.1.0"
  },
  "event_type": "invoice.posted",
  "occurred_at": "2026-01-11T19:13:34.266741Z",
  "payload": {
    "move_id": 1819,
    "move_name": "FAC/2026/00001",
    "move_type": "out_invoice",
    "state": "posted",
    "invoice_date": "2026-01-11",
    "amount_total": 100.00,
    "currency_name": "EUR",
    ...
  },
  "pdf_sha256": "..." // Optionnel, si PDF disponible
}
```

---

### Format Réponse Vault `/api/v1/events`

```json
{
  "status": "vaulted",
  "event_id": "a1507045-e098-420e-a363-2b8b3b5a27bc",
  "vault_id": "550e8400-e29b-41d4-a716-446655440000",
  "vault_date": "2026-01-11T19:13:35.123456Z",
  "vault_sha256": "abc123def456...",
  "vault_ledger_hash": "LEDGER:INV:00000123",
  "vault_evidence_jws": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🔧 Modifications Nécessaires dans Odoo

### Transmission Idempotency Key

**Fichier** : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`  
**Méthode** : `_build_dvig_payload()` (ligne 326)

**Modification requise** : Ajouter `idempotency_key` dans le payload DVIG

**Code actuel** (ligne 350-373) :
```python
payload = {
    'event_type': event_type,
    'source': dvig_source,
    'timestamp': timestamp,
    'data': {
        'move_id': move.id,
        'move_name': move.name or '',
        ...
    }
}
```

**Code proposé** :
```python
payload = {
    'event_type': event_type,
    'source': dvig_source,
    'timestamp': timestamp,
    'data': {
        'move_id': move.id,
        'move_name': move.name or '',
        ...
    },
    'idempotency_key': move.dorevia_vault_idempotency_key  # ✅ AJOUTER
}
```

**Impact** : 
- ✅ Compatible avec la SPEC DVIG (champ optionnel)
- ✅ Permet l'idempotence bout en bout Odoo → DVIG → Vault
- ✅ Pas de breaking change (DVIG peut ignorer si absent)

**Priorité** : 🟡 **MOYENNE** (peut être fait en parallèle du Sprint A)

---

## 🔗 Références

- **Rapport de diagnostic** : `RAPPORT_DIAGNOSTIC_VAULTING_20260111.md`
- **SPEC Odoo** : `SPEC_DOREVIA_VAULTIG_AUTO_v1.1.md`
- **État d'implémentation** : `ETAT_IMPLEMENTATION_VAULTIG_AUTO_v1.1_SCRUM.md`

---

**Fin de l'évaluation**

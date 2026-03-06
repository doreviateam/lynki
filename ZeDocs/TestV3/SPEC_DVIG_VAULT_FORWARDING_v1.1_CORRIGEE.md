# 📘 SPEC — DVIG → Vault Forwarding v1.1 (Version Corrigée)

**Date** : 2026-01-11  
**Auteur** : Dorevia Team  
**Statut** : ✅ **VERSION FINALE CORRIGÉE**  
**Référence** : SPEC v1.1 + Analyse v1.1

---

## 🎯 Objectif

Mettre en place un mécanisme **pérenne, fiable et observable** permettant à DVIG de transférer
les événements validés vers Dorevia Vault en garantissant :

- ✅ Idempotence bout en bout **réelle**
- ✅ Persistance avant ACK (Outbox pattern)
- ✅ Asynchronisme
- ✅ Retry automatique avec backoff
- ✅ Traçabilité complète
- ✅ Compatibilité avec Odoo

---

## 🏗️ Architecture cible

```
Odoo
  ↓ (POST /ingest + idempotency_key)
DVIG API
  ↓ (persist dans outbox)
Outbox (DB)
  ↓ (worker async)
Vault API (/api/v1/events)
```

---

## 🧩 Composants

### 1. Endpoint DVIG `/ingest`

Responsabilités :
- Validation payload
- Récupération `idempotency_key` (transmis par Odoo)
- Génération `event_id` (UUID pour traçabilité)
- Stockage dans `outbox_events`
- Retour immédiat ACK

**Payload reçu** :
```json
{
  "event_type": "invoice.posted",
  "source": "odoo.stinger.sarl-la-platine",
  "timestamp": "2026-01-11T19:13:34.266741Z",
  "data": {...},
  "idempotency_key": "bcd65105050f22fd0eb5760424adfd24e96b29fb96efe48b7f2500b92adb232e"  // ✅ Transmis par Odoo
}
```

**Réponse** :
```json
{
  "status": "accepted",
  "event_id": "a1507045-e098-420e-a363-2b8b3b5a27bc"  // UUID généré par DVIG pour traçabilité
}
```

---

### 2. Table Outbox

```sql
CREATE TABLE outbox_events (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL UNIQUE,  -- UUID généré par DVIG (traçabilité)
    idempotency_key VARCHAR(64) NOT NULL,  -- SHA256 transmis par Odoo (idempotence)
    tenant VARCHAR(50) NOT NULL,
    env VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'accepted',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_try_at TIMESTAMP,
    next_retry_at TIMESTAMP,
    last_error TEXT,
    vault_receipt_id VARCHAR(100),
    payload JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_tenant_idempotency UNIQUE (tenant, idempotency_key)  -- ✅ Idempotence garantie
);
```

**Index worker** :
```sql
CREATE INDEX idx_outbox_worker
ON outbox_events(status, next_retry_at)
WHERE status IN ('accepted','failed_soft');
```

**Index traçabilité** :
```sql
CREATE INDEX idx_outbox_event_id ON outbox_events(event_id);
CREATE INDEX idx_outbox_tenant_event ON outbox_events(tenant, event_id);
```

---

## 🔁 Machine d'État

| État | Description | Transition |
|-------|------------|------------|
| `accepted` | Enregistré dans outbox, pas encore envoyé | → `forwarding` (worker démarre) |
| `forwarding` | En cours d'envoi vers Vault | → `forwarded` (succès) ou `failed_soft` (erreur temporaire) ou `failed_hard` (erreur définitive) |
| `forwarded` | ✅ Envoyé avec succès, preuve reçue | Final |
| `failed_soft` | ⚠️ Erreur temporaire (timeout, 502, 503, 429) | → `accepted` (retry avec backoff) ou `failed_hard` (après X tentatives) |
| `failed_hard` | ❌ Erreur définitive (400, 401, 403, 404, 422) | → `dead_letter` |
| `dead_letter` | 🗑️ Déplacé pour audit | Final |

---

## 🔐 Idempotence (DÉCISION FIGÉE)

### ✅ **Clé retenue : `idempotency_key` (SHA256) calculé et transmis par Odoo**

**Justification** :
- ✅ **Déterministe** : Même facture = même clé (même si re-soumise)
- ✅ **Robuste** : Basé sur le contenu, pas sur un UUID aléatoire
- ✅ **Idempotence réelle** : Si Odoo réessaie, même clé = même traitement
- ✅ **Déjà calculé** : Odoo calcule déjà `dorevia_vault_idempotency_key`

**Formule Odoo** :
```python
# Formule actuelle Odoo
key_string = f"{dvig_source}{model}{record_id}{event_type}{posted_at}"
idempotency_key = SHA256(key_string).hexdigest()
# Ex: "bcd65105050f22fd0eb5760424adfd24e96b29fb96efe48b7f2500b92adb232e"
```

**Flux** :
1. **Odoo** : Calcule `idempotency_key` (SHA256) et le transmet dans payload DVIG
2. **DVIG** : Utilise `idempotency_key` du payload (si présent) ou génère depuis `event_id` (fallback)
3. **DVIG** : Stocke dans `outbox_events` avec `UNIQUE(tenant, idempotency_key)`
4. **Vault** : Reçoit `idempotency_key` et vérifie `UNIQUE(tenant, idempotency_key)`

**Fallback** :
- Si `idempotency_key` absent du payload → DVIG génère depuis `event_id` (UUID)
- Permet compatibilité avec anciens clients

---

## 🔄 Worker DVIG

### Sélection

```sql
SELECT * FROM outbox_events
WHERE status IN ('accepted', 'failed_soft')
  AND next_retry_at <= NOW()
ORDER BY next_retry_at ASC
LIMIT 50;
```

### Traitement

1. **Mise à jour état** : `status = 'forwarding'`
2. **Appel Vault** : `POST /api/v1/events` avec payload
3. **Succès** :
   - `status = 'forwarded'`
   - Stockage `vault_receipt_id`
4. **Échec soft** :
   - `status = 'failed_soft'`
   - Incrément `attempt_count`
   - Calcul `next_retry_at` (backoff)
5. **Échec hard** :
   - `status = 'failed_hard'`
   - Déplacement vers `dead_letters`

### Backoff Exponentiel

```python
next_retry = now + min(2^attempt_count * 60, 3600)
```

**Exemples** :
- Tentative 1 : +60s (1 min)
- Tentative 2 : +120s (2 min)
- Tentative 3 : +240s (4 min)
- Tentative 4 : +480s (8 min)
- Tentative 5+ : +3600s (1h max)

### Classification Erreurs

**Soft (retriable)** :
- Timeout réseau
- `502 Bad Gateway`
- `503 Service Unavailable`
- `429 Too Many Requests`

**Hard (non retriable)** :
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `422 Unprocessable Entity`

**Dead Letter** :
- Après 10 tentatives
- Ou erreur hard immédiate

---

## 📡 API Vault

### Endpoint Principal

```
POST /api/v1/events
```

**Authentification** : Token service (`Bearer <vault_service_token>`)

**Payload** :
```json
{
  "tenant": "sarl-la-platine",
  "event_id": "a1507045-e098-420e-a363-2b8b3b5a27bc",  // UUID DVIG (traçabilité)
  "idempotency_key": "bcd65105050f22fd0eb5760424adfd24e96b29fb96efe48b7f2500b92adb232e",  // SHA256 Odoo (idempotence)
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
  "pdf_sha256": "..."  // Optionnel, si PDF disponible
}
```

**Réponse Succès (200)** :
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

**Réponse Idempotente (200)** :
```json
{
  "status": "idempotent",
  "event_id": "a1507045-e098-420e-a363-2b8b3b5a27bc",
  "vault_id": "550e8400-e29b-41d4-a716-446655440000",  // Document existant
  "message": "Document already vaulted"
}
```

**Réponse Erreur (400/401/403/404/422)** :
```json
{
  "error": "Bad Request",
  "message": "Invalid payload format"
}
```

---

## 🔍 Récupération Preuve (Odoo)

### Endpoint Principal (Conservé)

```
GET /api/v1/proof/account_move/{odoo_id}
```

**Utilisé par** : CRON #2 Odoo  
**Format** : ID Odoo (ex: `1819`)

### Endpoint Optionnel (Traçabilité)

```
GET /api/v1/proof/event/{event_id}
```

**Utilisé par** : Debug, traçabilité DVIG  
**Format** : Event ID DVIG (UUID)

---

## 🗑️ Dead Letter

### Table

```sql
CREATE TABLE dead_letters (
    id SERIAL PRIMARY KEY,
    event_id UUID,
    idempotency_key VARCHAR(64),
    tenant VARCHAR(50) NOT NULL,
    env VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'failed_hard',
    attempt_count INTEGER NOT NULL,
    last_error TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL,
    failed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dead_letters_tenant ON dead_letters(tenant);
CREATE INDEX idx_dead_letters_failed_at ON dead_letters(failed_at);
```

### Politique

- **Déclenchement** :
  - Après 10 tentatives (`attempt_count >= 10`)
  - Ou erreur hard immédiate (400, 401, 403, 404, 422)
- **Rétention** : 90 jours minimum
- **Alertes** : Notification ops immédiate
- **Métriques** : `dead_letters_total` (Prometheus)

---

## 🔒 Sécurité

### Authentification

| Flux | Token | Type |
|------|-------|------|
| Odoo → DVIG | Token tenant | `Bearer <dvig_token>` |
| DVIG → Vault | Token service | `Bearer <vault_service_token>` |

### Rotation

- **Tokens tenant** : Rotation mensuelle
- **Tokens service** : Rotation trimestrielle
- **Logs d'accès** : Traçabilité complète

---

## 📊 Observabilité

### Métriques DVIG (Prometheus)

```
# Backlog
dvig_outbox_backlog{tenant="sarl-la-platine",env="stinger"} 5

# Succès
dvig_forward_success_total{tenant="sarl-la-platine",env="stinger"} 1234

# Échecs
dvig_forward_failed_soft_total{tenant="sarl-la-platine",env="stinger"} 12
dvig_forward_failed_hard_total{tenant="sarl-la-platine",env="stinger"} 2

# Durée
dvig_forward_duration_seconds{tenant="sarl-la-platine",env="stinger",quantile="0.95"} 0.5

# Dead letters
dvig_dead_letters_total{tenant="sarl-la-platine",env="stinger"} 1
```

### Métriques Vault (Prometheus)

```
# Ingestion
vault_events_ingested_total{tenant="sarl-la-platine",event_type="invoice.posted"} 1234

# Idempotence
vault_events_idempotent_total{tenant="sarl-la-platine"} 5

# Échecs
vault_events_failed_total{tenant="sarl-la-platine",error_type="validation"} 2
```

### Logs Structurés

**DVIG** :
- `event.accepted` : Événement accepté
- `event.forward.try` : Tentative forward
- `event.forward.success` : Forward réussi
- `event.forward.failed_soft` : Échec temporaire
- `event.forward.failed_hard` : Échec définitif
- `event.dead_letter` : Déplacement dead letter

**Vault** :
- `event.ingested` : Événement ingéré
- `event.idempotent` : Événement idempotent
- `event.failed` : Échec ingestion

---

## 🔧 Modifications Requises

### 1. Odoo : Transmettre idempotency_key

**Fichier** : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`  
**Méthode** : `_build_dvig_payload()` (ligne 326)

**Modification** :
```python
def _build_dvig_payload(self, move):
    # ... code existant ...
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
    return payload
```

**Priorité** : 🟡 **MOYENNE** (peut être fait en parallèle du Sprint A)

---

### 2. DVIG : Accepter et utiliser idempotency_key

**Endpoint** : `/ingest`  
**Comportement** :
```python
# Récupérer idempotency_key du payload
idempotency_key = payload.get('idempotency_key')

# Fallback si absent (compatibilité)
if not idempotency_key:
    idempotency_key = str(uuid.uuid4())  # Générer depuis event_id

# Vérifier idempotence
existing = db.get_outbox_by_idempotency(tenant, idempotency_key)
if existing:
    return {"status": "accepted", "event_id": existing.event_id}  # Idempotent

# Stocker dans outbox_events
outbox_event = create_outbox_event(
    event_id=str(uuid.uuid4()),  # UUID DVIG (traçabilité)
    idempotency_key=idempotency_key,  # SHA256 Odoo (idempotence)
    tenant=tenant,
    env=env,
    payload=payload
)
```

---

### 3. Vault : Créer endpoint `/api/v1/events`

**Handler** : Nouveau handler Go  
**Comportement** :
```go
// Vérifier idempotence
existingDoc := db.GetDocumentByIdempotencyKey(tenant, idempotencyKey)
if existingDoc != nil {
    return JSON{
        "status": "idempotent",
        "event_id": eventID,
        "vault_id": existingDoc.ID,
        "message": "Document already vaulted"
    }
}

// Ingérer le document
doc := ingestEvent(payload)
return JSON{
    "status": "vaulted",
    "event_id": eventID,
    "vault_id": doc.ID,
    "vault_date": doc.CreatedAt,
    "vault_sha256": doc.SHA256Hex,
    "vault_ledger_hash": doc.LedgerHash,
    "vault_evidence_jws": doc.EvidenceJWS
}
```

---

## 🚀 Plan de Delivery

### Sprint A : Infrastructure DVIG (1-2 semaines)

**Tâches** :
1. Créer table `outbox_events`
2. Modifier endpoint `/ingest` pour persister dans outbox
3. Implémenter worker asynchrone
4. Implémenter backoff exponentiel
5. Implémenter classification erreurs
6. Tests unitaires

**Livrables** :
- ✅ Table `outbox_events` créée
- ✅ Worker fonctionnel
- ✅ Tests passent

---

### Sprint B : API Vault `/api/v1/events` (1 semaine)

**Tâches** :
1. Créer endpoint `/api/v1/events`
2. Implémenter vérification idempotence
3. Intégrer avec services d'ingestion existants
4. Créer endpoint optionnel `/api/v1/proof/event/{event_id}`
5. Tests unitaires et intégration

**Livrables** :
- ✅ Endpoint `/api/v1/events` opérationnel
- ✅ Idempotence garantie
- ✅ Tests passent

---

### Sprint C : Intégration End-to-End (3-5 jours)

**Tâches** :
1. Modifier Odoo pour transmettre `idempotency_key`
2. Tests end-to-end Odoo → DVIG → Vault
3. Validation idempotence bout en bout
4. Monitoring et alertes
5. Documentation

**Livrables** :
- ✅ Flux end-to-end fonctionnel
- ✅ Idempotence validée
- ✅ Documentation complète

---

## ✅ Validation

### Critères de Succès

- [x] Architecture définie
- [x] Schéma base de données défini
- [x] Machine d'état définie
- [x] **Idempotence clarifiée** ✅ (corrigée)
- [x] API Vault définie
- [x] Dead letter définie
- [x] Modifications Odoo documentées
- [x] Plan de delivery défini

### Tests Requis

- [ ] Test idempotence bout en bout (Odoo → DVIG → Vault)
- [ ] Test retry Odoo (même facture envoyée deux fois)
- [ ] Test backoff exponentiel
- [ ] Test classification erreurs (soft vs hard)
- [ ] Test dead letter
- [ ] Test end-to-end complet

---

## 📝 Notes Techniques

### Différence event_id vs idempotency_key

| Champ | Type | Source | Usage |
|-------|------|--------|-------|
| `event_id` | UUID | DVIG | Traçabilité, logs, debug |
| `idempotency_key` | SHA256 | Odoo | Idempotence, garantie unicité |

**Exemple** :
- **Event ID** : `a1507045-e098-420e-a363-2b8b3b5a27bc` (UUID unique par envoi)
- **Idempotency Key** : `bcd65105050f22fd0eb5760424adfd24e96b29fb96efe48b7f2500b92adb232e` (SHA256 stable)

---

## 🔗 Références

- **Évaluation v1.0** : `EVALUATION_SPEC_DVIG_VAULT_FORWARDING_v1.0.md`
- **Analyse v1.1** : `ANALYSE_SPEC_DVIG_VAULT_FORWARDING_v1.1.md`
- **Rapport diagnostic** : `RAPPORT_DIAGNOSTIC_VAULTING_20260111.md`
- **SPEC Odoo** : `SPEC_DOREVIA_VAULTIG_AUTO_v1.1.md`

---

## ✅ Conclusion

Cette version corrigée v1.1 est :
- ✅ **Pérenne** : Pattern Outbox éprouvé
- ✅ **Scalable** : Asynchrone, non bloquant
- ✅ **Observable** : Métriques et logs complets
- ✅ **Compatible Odoo** : Intégration transparente
- ✅ **Idempotence garantie** : Bout en bout avec SHA256
- ✅ **Prête production** : Après implémentation des 3 sprints

**Prochaine étape** : Valider cette SPEC avec les équipes DVIG et Vault, puis démarrer le Sprint A.

---

**Fin de la SPEC corrigée**

# SPEC --- DIVA Async Persistent Analysis Store

**Version** : 1.1\
**Date** : 2026-02-17\
**Statut** : Ready for implementation\
**Scope** : Backend DIVA (Go + Postgres) + évolution API\
**Compatibility** : Dorevia Platform (mono-instance compatible,
multi-instance ready)

**Breaking change** : La clé de poll passe de `job_id` (UUID) à `context_hash`.
Le client (DivaFlashBlock, proxy Linky) doit être adapté.

------------------------------------------------------------------------

## 1. Objective

Secure DIVA asynchronous mode by introducing persistent intermediate
storage for analysis jobs and results.

Goals:

-   Survive container restarts
-   Prevent job loss during deployments
-   Detect and resolve stale processing jobs
-   Avoid unnecessary recomputation
-   Preserve Dorevia lightweight architecture (no Redis, no external
    queue)

------------------------------------------------------------------------

## 2. Architecture Overview

DIVA async currently relies on in-memory job storage (`internal/jobs/store.go`).

This specification introduces:

-   A persistent Postgres table: `diva_analysis`
-   DB becomes source of truth
-   Memory job store is removed

**API evolution** : La clé de poll devient `context_hash` (déterministe) au lieu de
`job_id` (UUID). Le client reçoit `context_hash` dans la réponse 202 et poll
`GET /diva/jobs/{context_hash}`.

------------------------------------------------------------------------

## 2.1 PostgreSQL Integration (Dorevia)

**Décision** : Réutiliser la base Vault existante (`dorevia_vault`).

- Aucun nouveau conteneur Postgres
- Table `diva_analysis` dans la DB du tenant (ex. `vault-db-core-stinger`, `vault-db-sarl-la-platine`)

**Sécurité** : Créer un utilisateur PostgreSQL dédié `diva` avec droits limités :

```sql
CREATE USER diva WITH PASSWORD '...';
GRANT CONNECT ON DATABASE dorevia_vault TO diva;
-- Après création de la table :
GRANT SELECT, INSERT, UPDATE, DELETE ON diva_analysis TO diva;
```

**Variable** : `DIVA_DATABASE_URL` (ex. `postgres://diva:xxx@vault-db-core-stinger:5432/dorevia_vault?sslmode=disable`).

En absence de `DIVA_DATABASE_URL`, fallback sur le job store en mémoire (rétrocompat).

------------------------------------------------------------------------

## 3. Database Schema

### 3.1 Table Definition

``` sql
CREATE TABLE diva_analysis (
    context_hash TEXT PRIMARY KEY,
    status TEXT NOT NULL, -- processing | done | failed
    flash_json JSONB,
    started_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    error_code TEXT,
    error_message TEXT
);
```

### 3.2 Indexes

``` sql
CREATE INDEX idx_diva_analysis_expires_at ON diva_analysis(expires_at);
CREATE INDEX idx_diva_analysis_status ON diva_analysis(status);
```

------------------------------------------------------------------------

## 4. Status Lifecycle

  Status       Meaning
  ------------ -------------------------------
  processing   LLM job currently running
  done         Flash generated and available
  failed       Job failed or timed out

------------------------------------------------------------------------

## 5. Async Flow (Detailed)

### 5.1 POST /diva/explain/async

1.  Compute `context_hash`
2.  Query DB

#### Case A --- Fresh result exists

If: `status = done` AND `expires_at > now()`

→ **200 OK** avec le flash stocké (format identique à l’actuel) :

```json
{
  "meta": { "request_id": "...", "cached": true, "latency_ms": 0 },
  "flash": { "headline": "...", "what_i_see": [...], "to_check": [...], "confidence": "..." }
}
```

#### Case B --- Already processing

If: `status = processing` AND `(now() - started_at) < MAX_RUNTIME`

→ **202 Accepted** (réutilisation du job en cours). Le client poll avec le même `context_hash`.

```json
{
  "context_hash": "sha256:abc123...",
  "status": "pending",
  "message": "Analyse en cours. Interroger GET /diva/jobs/{context_hash} pour le résultat."
}
```

#### Case C --- New analysis required

If: No record OR expired OR failed OR stale processing

Then:

1. UPSERT: `status = processing`, `started_at = now()`, `updated_at = now()`, `expires_at = now() + TTL`
2. Launch goroutine LLM worker
3. Return **202 Accepted** :

```json
{
  "context_hash": "sha256:abc123...",
  "status": "pending",
  "message": "Analyse en cours. Interroger GET /diva/jobs/{context_hash} pour le résultat."
}
```

**Important** : Le client doit conserver `context_hash` et l’utiliser pour le poll.

------------------------------------------------------------------------

## 6. Worker Behavior

Upon successful LLM completion:

UPDATE: - status = done - flash_json = result - updated_at = now() -
expires_at = now() + TTL

Upon failure:

UPDATE: - status = failed - error_code - error_message - updated_at =
now()

------------------------------------------------------------------------

## 7. GET /diva/jobs/:context_hash

Read DB row by `context_hash`.

| Condition | HTTP | Body |
|-----------|------|------|
| `status = done` | 200 | `{ "context_hash": "...", "status": "done", "meta": {...}, "flash": {...} }` |
| `status = processing` AND `runtime < MAX_RUNTIME` | 202 | `{ "context_hash": "...", "status": "pending" }` |
| `status = processing` AND `runtime >= MAX_RUNTIME` | Marquer `failed`, puis 200 | `{ "context_hash": "...", "status": "failed", "error": { "code": "timeout", "message": "..." } }` |
| `status = failed` | 200 | `{ "context_hash": "...", "status": "failed", "error": { "code": "...", "message": "..." } }` |
| No row (expiré / inconnu) | 404 | `{ "error": { "code": "NOT_FOUND", "message": "Job inconnu ou expiré." } }` |

------------------------------------------------------------------------

## 8. Stale Job Handling

Parameter:

MAX_RUNTIME_SECONDS = 180

Rule:

If:

status = processing AND now() - started_at \> MAX_RUNTIME

Then:

status = failed error_code = "timeout"

------------------------------------------------------------------------

## 9. Configuration

  Variable                      Default    Description
  ----------------------------- ---------- ----------------------------------------
  DIVA_DATABASE_URL             (empty)    URL Postgres. Si vide, fallback mémoire
  CACHE_TTL_SECONDS             300        TTL du flash (aligné cache navigateur)
  MAX_RUNTIME_SECONDS           180        Seuil stale (processing → failed)
  JOBS_PURGE_INTERVAL_SECONDS   60         Intervalle purge lignes expirées (optionnel)

------------------------------------------------------------------------

## 10. Go Interface

    type AnalysisStore interface {
        Get(ctx context.Context, contextHash string) (*Analysis, error)
        UpsertProcessing(ctx context.Context, contextHash string, ttl time.Duration) error
        MarkDone(ctx context.Context, contextHash string, flashJSON []byte, ttl time.Duration) error
        MarkFailed(ctx context.Context, contextHash string, code string, message string) error
    }

Implementation: `internal/store/postgres_analysis_store.go`

------------------------------------------------------------------------

## 11. Security

Stored data:

-   context_hash
-   flash_json (narrative only)
-   timestamps

No raw financial payload stored.

------------------------------------------------------------------------

## 12. Benefits

  Risk                           Mitigation
  ------------------------------ --------------------
  Restart job loss               Persistent state
  Poll empty UI                  DB-backed job
  Stuck processing               Stale detection
  Duplicate LLM calls            Context hash dedup
  Multi-instance inconsistency   Shared DB truth

------------------------------------------------------------------------

## 13. Non-Goals (v1)

-   Redis queue
-   Retry strategy
-   Monitoring dashboard
-   Analysis history

------------------------------------------------------------------------

## 14. Migration Steps

1.  Créer le fichier de migration SQL (table + index + user `diva` + droits)
2.  Déployer le schéma dans la DB Vault du tenant cible
3.  Implémenter `internal/store/postgres_analysis_store.go`
4.  Adapter `POST /diva/explain/async` : retourner `context_hash` au lieu de `job_id` dans les réponses 202
5.  Remplacer `GET /diva/jobs/:jobId` par `GET /diva/jobs/:contextHash` (ou ajouter route dédiée)
6.  Adapter le proxy Linky : `GET /api/diva/jobs/[contextHash]`
7.  Adapter DivaFlashBlock : stocker `context_hash` de la réponse 202, poll avec cette clé
8.  Supprimer `internal/jobs/store.go` (mémoire)
9.  Tester : restart pendant job, déploiement, détection stale

------------------------------------------------------------------------

## 15. Impact client (DivaFlashBlock)

Avant (job_id) :
```javascript
const { job_id } = await res.json();
// poll GET /api/diva/jobs/${job_id}
```

Après (context_hash) :
```javascript
const { context_hash } = await res.json();
// poll GET /api/diva/jobs/${context_hash}
```

Aucun changement côté calcul du `context_hash` — il est calculé côté serveur et retourné dans la réponse.

------------------------------------------------------------------------

End of specification.

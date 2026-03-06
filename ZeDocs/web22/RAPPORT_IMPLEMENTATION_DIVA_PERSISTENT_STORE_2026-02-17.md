# Rapport d'implémentation — DIVA Persistent Analysis Store

**Date** : 2026-02-17  
**Spec** : `ZeDocs/web22/SPEC_DIVA_Async_Persistent_Analysis_Store_v1.0.md` (v1.1)  
**Statut** : ✅ Implémenté

---

## 1. Résumé

Le store persistant remplace le job store en mémoire pour le mode async DIVA. Les avantages :

- Survie aux redémarrages des conteneurs
- Pas de perte de job lors des déploiements
- Détection et résolution des jobs stale (timeout 180 s)
- Évite les recomputations inutiles (clé context_hash déterministe)
- Option multi-instance (DB partagée)

**Breaking change** : La clé de poll passe de `job_id` (UUID) à `context_hash` (sha256:hex). Le client doit être adapté.

---

## 2. Implémentation

### 2.1 Base de données

| Fichier | Description |
|---------|-------------|
| `sources/vault/migrations/025_create_diva_analysis.sql` | Table `diva_analysis`, contraintes, index |
| `sources/vault/migrations/025b_create_diva_user.sql` | Création utilisateur `diva` (à exécuter manuellement) |

Table `diva_analysis` : `context_hash` (PK), `status`, `flash_json`, timestamps, `error_code`, `error_message`.

Décision : réutilisation de la base Vault existante (`dorevia_vault`), pas de nouveau conteneur Postgres.

### 2.2 Backend DIVA (Go)

| Composant | Fichiers | Rôle |
|-----------|----------|------|
| Interface | `internal/store/store.go` | `AnalysisStore` (Get, UpsertProcessing, MarkDone, MarkFailed, MarkStaleFailed) |
| Postgres | `internal/store/postgres_analysis_store.go` | Implémentation pgx, connexion `DIVA_DATABASE_URL` |
| Mémoire | `internal/store/memory_store.go` | Fallback quand `DIVA_DATABASE_URL` vide |
| Handlers | `internal/handlers/explain_async.go` | Cases A/B/C, réponse `context_hash`, intégration store |
| Server | `internal/server/server.go` | Choix store (Postgres vs mémoire), route `GET /diva/jobs/:contextHash` |

**Supprimé** : `internal/jobs/store.go` (remplacé par store.AnalysisStore).

### 2.3 Proxy Linky (Next.js)

| Avant | Après |
|-------|-------|
| `app/api/diva/jobs/[jobId]/route.ts` | `app/api/diva/jobs/[contextHash]/route.ts` |

Paramètre d'URL : `contextHash` (ex. `sha256:abc123...`).

### 2.4 Client (DivaFlashBlock)

- Lecture de `context_hash` (ou `job_id` en rétrocompat)
- Poll : `GET /api/diva/jobs/${encodeURIComponent(contextHash)}`
- Statuts gérés : `done`, `failed`, `error` (legacy)

---

## 3. Flux async (rappel)

```
POST /diva/explain/async
  ├─ Case A : done + expires_at > now → 200 flash (DB)
  ├─ Case B : processing + runtime < 180 s → 202 (réutilisation)
  └─ Case C : nouveau / expiré / failed → UPSERT processing, lancer worker → 202

GET /diva/jobs/{context_hash}
  ├─ done → 200 { flash, meta }
  ├─ processing < 180 s → 202 pending
  ├─ processing >= 180 s → marquer failed, 200 { error: timeout }
  └─ failed → 200 { error }
```

---

## 4. Déploiement

### 4.1 Sans Postgres (défaut)

Aucune config : `DIVA_DATABASE_URL` vide → fallback mémoire. Comportement identique à avant (sauf clé `context_hash`).

### 4.2 Avec Postgres

1. Appliquer migration : `025_create_diva_analysis.sql` (via process habituel Vault)
2. Créer utilisateur : `025b_create_diva_user.sql` (superuser)
3. Configurer DIVA : `DIVA_DATABASE_URL=postgres://diva:xxx@vault-db-XXX:5432/dorevia_vault?sslmode=disable`
4. DIVA doit être sur le même réseau que `vault-db`

Exemple `docker-compose.yml` (platform incluant diva) :

```yaml
diva:
  environment:
    DIVA_DATABASE_URL: postgres://diva:${DIVA_DB_PASSWORD}@vault-db-core-stinger:5432/dorevia_vault?sslmode=disable
  depends_on:
    - vault-db
```

---

## 5. Scripts mis à jour

| Script | Modification |
|--------|--------------|
| `scripts/diagnostic_diva_async.sh` | `context_hash` au lieu de `job_id`, statut `failed` |

---

## 6. Tests recommandés

1. **Fallback mémoire** : sans `DIVA_DATABASE_URL`, flux async fonctionne (202 → poll → 200)
2. **Avec Postgres** : après migration, `DIVA_DATABASE_URL` configuré, redémarrer DIVA pendant un job → poll doit retrouver le job
3. **Stale** : job en processing > 180 s → GET marque failed, retourne timeout

---

**Fin du rapport.**

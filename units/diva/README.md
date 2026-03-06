# Unit DIVA — Lecture synthétique KPI Linky

**SPEC** : `ZeDocs/web22/SPEC_DIVA_API_v1.0.md`, `SPEC_DIVA_Async_v1.0.md`, `SPEC_DIVA_Async_Persistent_Analysis_Store_v1.0.md`, `SPEC_DIVA_Warmup_Runner_CODIR_v1.0.md`  
**Plan** : `ZeDocs/web22/PLAN_IMPLEMENTATION_DIVA_SCRUM_v1.0.md`, `PLAN_IMPLEMENTATION_DIVA_ASYNC_SCRUM.md`  
**Rapport** : `ZeDocs/web22/RAPPORT_IMPLEMENTATION_DIVA_ASYNC_ET_CACHE_2026-02-17.md`, `RAPPORT_IMPLEMENTATION_DIVA_WARMUP_DETAILLE_2026-02-17.md`  
**Mémo** : `ZeDocs/web22/MEMO_DIVA_WARMUP_2026-02-17.md` (déploiement, config runner)  
**Rôle** : Service Go (Fiber) appelant Mistral pour produire une synthèse flash des indicateurs Linky — **réseau interne uniquement**, aucun port exposé. Inclut **diva-runner** (pré-calcul CODIR).

---

## Structure

```
units/diva/
  Dockerfile
  docker-compose.yml
  go.mod
  go.sum
  cmd/diva/main.go
  internal/
    cache/      # Cache context_hash (TTL 5 min)
    store/      # Analysis store (Postgres ou mémoire) — clé context_hash
    handlers/   # Health, GET /diva/insights, POST /diva/generate, POST /diva/explain, explain/async, GET /diva/jobs/:contextHash
    mistral/    # Client Mistral (chat/completions, timeout 90 s)
    models/     # Request/Response structs
    server/     # Routes, ErrorHandler
  README.md
```

- **Réseau** : `dorevia-network` (external)
- **Port interne** : 8010
- **Dépendance** : Mistral (`mistral-llamacpp:8000`) doit être up

---

## Prérequis

- Docker et Docker Compose
- Réseau : `docker network create dorevia-network` (si absent)
- **Mistral** : `units/mistral` démarré (`mistral-llamacpp` sur le réseau)
- Go 1.22+ (pour build local)

---

## Installation

### 1. Démarrer Mistral (prérequis)

```bash
cd units/mistral
docker compose up -d
# Attendre que mistral-llamacpp réponde à /health
```

### 2. Lancer DIVA

Depuis la **racine du projet** :

```bash
cd units/diva
docker compose up -d --build
docker logs -f diva
```

Depuis `units/mistral` : `cd ../diva`

### 3. Vérifier le healthcheck

```bash
docker run --rm --network dorevia-network curlimages/curl:latest \
  curl -s http://diva:8010/health
```

Résultat attendu : `ok`

---

## Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/health` | Healthcheck |
| GET | `/diva/insights` | **Insights v1.1** — Lecture instantanée (mode A). Requiert `DIVA_DATABASE_URL`. |
| POST | `/diva/generate` | **Insights v1.1** — Génération + stockage dans `diva_insights`. Interne (runner, prewarm). |
| POST | `/diva/explain` | Sync (rétrocompat, smoke test) |
| POST | `/diva/explain/async` | Async → 202 context_hash ou 200 flash (cache) — dépréciable en faveur de insights |
| GET | `/diva/jobs/:contextHash` | Poll résultat (clé context_hash) |

## Tests

| Test | Script |
|------|--------|
| Sync | `./scripts/smoke_test_diva_e2e.sh` |
| Async (8 KPI) | `./scripts/diagnostic_diva_async.sh` |
| **Insights v1.1** | `./scripts/test_diva_insights_s2.sh [LINKY_URL]` |

---

## Variables d'environnement

### DIVA (service principal)

| Variable | Défaut | Description |
|----------|--------|-------------|
| `MISTRAL_BASE_URL` | `http://mistral-llamacpp:8000/v1` | URL base Mistral |
| `DIVA_PORT` | `8010` | Port d'écoute |
| `DIVA_DATABASE_URL` | (vide) | URL Postgres Vault. Requis pour `diva_insights` (GET /diva/insights, POST /diva/generate). Si vide → fallback mémoire, routes insights non enregistrées |
| `CACHE_TTL_SECONDS` | `300` | TTL cache flash (5 min) |
| `JOBS_PURGE_INTERVAL_SECONDS` | `60` | Intervalle purge store mémoire (si fallback) |
| `INSIGHTS_TTL_MINUTES` | `10` | TTL des insights (expires_at) |
| `INSIGHTS_TIMEZONE` | `Europe/Paris` | Fuseau pour périodes YTD/MTD |
| `INSIGHTS_LOCK_TIMEOUT` | `120` | Timeout lock advisory (secondes) — POST /diva/generate (`INSIGHTS_LOCK_TIMEOUT_SECONDS` accepté en legacy) |

### diva-runner (warm-up CODIR) — SPEC Warmup Runner v1.1

| Variable | Défaut | Description |
|----------|--------|-------------|
| `RUNNER_ENABLED` | `true` | Activer le runner (désactiver avec `false`) |
| `RUNNER_MODE` | `loop` | `loop` ou `once` |
| `RUNNER_INTERVAL_SECONDS` | `120` | Intervalle entre itérations |
| `RUNNER_CONCURRENCY` | `1` | Nombre d’inférences en parallèle (max 2) |
| `RUNNER_TENANT_CONFIG` | (vide) | Format `tenant:1,2;tenant2:0` (ex: `core:0;sarl-la-platine:1,2`) |
| `LINKY_URL` | `http://linky:3000` | URL Linky pour dashboard-metrics |
| `DIVA_URL` | `http://diva:8010` | URL DIVA |

---

## Runbook

| Action | Commande |
|--------|----------|
| Démarrer | `docker compose up -d` |
| Arrêter | `docker compose down` |
| Logs | `docker logs -f diva` |
| Health | `curl -s http://diva:8010/health` |
| Redéploiement complet | `./scripts/redeploy_diva_stack.sh --linky` |

---

## Ordre de démarrage

1. Mistral : `cd units/mistral && docker compose up -d`
2. DIVA : `cd units/diva && docker compose up -d`
3. Linky (proxy) : selon déploiement tenant

---

## diva-runner (warm-up CODIR)

Pré-calcule les analyses DIVA pour les contextes CODIR (mois courant, YTD). Réduit la latence perçue à l’ouverture Linky.

```bash
# Activer : RUNNER_ENABLED=true RUNNER_TENANT_CONFIG=sarl-la-platine:1,2 docker compose up -d
docker compose up -d diva diva-runner
```

Voir `ZeDocs/web22/SPEC_DIVA_Warmup_Runner_CODIR_v1.0.md`.

---

## Références

| Document | Rôle |
|----------|------|
| `ZeDocs/web23/SPEC_DIVA_Insights_v1.0.md` | **Insights v1.1** — lecture à la minute, diva_insights |
| `ZeDocs/web23/POINT_ETAPE_IMPLEMENTATION_DIVA_INSIGHTS_2026-02-16.md` | Point d'étape, état actuel, la suite |
| `ZeDocs/web22/SPEC_DIVA_API_v1.0.md` | Spécification API legacy |
| `ZeDocs/web22/SPEC_DIVA_Async_v1.0.md` | Mode asynchrone |
| `ZeDocs/web22/SPEC_DIVA_Warmup_Runner_CODIR_v1.0.md` | Warm-up opportuniste + Runner |
| `ZeDocs/web22/SPEC_DIVA_v2_Copilote_CODIR.md` | Forme éditoriale v2 |
| `ZeDocs/web22/ANNEXE_PROMPT_DIVA_FLASH_v1.0.md` | Prompts Mistral |
| `ZeDocs/web22/PLAN_IMPLEMENTATION_DIVA_ASYNC_SCRUM.md` | Plan async |
| `ZeDocs/web22/RAPPORT_IMPLEMENTATION_DIVA_ASYNC_ET_CACHE_2026-02-17.md` | Rapport implémentation |

---

**Fin du README.**

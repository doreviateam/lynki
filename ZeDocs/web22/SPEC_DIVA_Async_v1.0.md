# SPEC — DIVA API asynchrone (v1.0)

**Version** : 1.0  
**Date** : 2026-02-16  
**Statut** : Draft  
**Périmètre** : Mode asynchrone pour `/diva/explain` — découplage requête / réponse  
**Complément** : `SPEC_DIVA_API_v1.0.md` (sync inchangé pour rétrocompat)

------------------------------------------------------------------------

# 1. Contexte & motivation

**Problème** : Mistral local (llama.cpp) peut mettre 15–60 s à répondre. Un appel synchrone bloque :
- la connexion HTTP (timeout, ressource)
- l’UX (utilisateur inactif, erreurs si timeout trop court)

**Solution** : Mode asynchrone — **pas plus rapide, asynchrone**.

- Requête → retour immédiat (202) avec `job_id`
- Traitement en arrière-plan (goroutine)
- Client poll pour le résultat quand prêt

**Bénéfices** :
- Connexions HTTP libérées rapidement
- UX : page réactive, bloc « Analyse en préparation » pendant l’attente
- Scalable (pas de connexion longue tenue ouverte)
- Dorevia-compatible : pas de queue externe (Redis, etc.), stockage en mémoire avec TTL

------------------------------------------------------------------------

# 2. Architecture

## 2.1 Flux asynchrone

```
Frontend Linky (DivaFlashBlock)
       │
       ├─► POST /api/diva/explain/async  (proxy Linky)
       │        │
       │        └─► POST /diva/explain/async (DIVA)
       │                 └─► 202 { job_id }
       │                 └─► goroutine : Mistral → job store
       │
       └─► Poll GET /api/diva/jobs/{job_id} (proxy Linky)
                └─► GET /diva/jobs/{job_id} (DIVA)
                     └─► 200 { status, flash? } ou 202 { status: "pending" }
```

## 2.2 Rétrocompatibilité

| Endpoint       | Comportement                     | Usage                         |
|----------------|----------------------------------|-------------------------------|
| POST /diva/explain | Sync (inchangé)              | Smoke tests, scripts, clients legacy |
| POST /diva/explain/async | Async (202 + job_id)    | Linky UI                       |

------------------------------------------------------------------------

# 3. API DIVA

## 3.1 POST `/diva/explain/async`

**Request** : identique à `POST /diva/explain` (context, dashboard, options).

**Response** : `202 Accepted`

```json
{
  "job_id": "uuid-v4",
  "status": "pending",
  "message": "Analyse en cours. Interroger GET /diva/jobs/{job_id} pour le résultat."
}
```

**Comportement** :
1. Cache hit (même `context_hash`, pas `force_refresh`) → **200** avec flash immédiat (comme sync)
2. Cache miss → lance goroutine, retourne **202** avec `job_id`
3. Données insuffisantes (0 cards) → **200** avec flash "Données insuffisantes" (comme sync)

## 3.2 GET `/diva/jobs/{job_id}`

**Response** : selon l’état du job

### Pending (traitement en cours)

```json
{
  "job_id": "...",
  "status": "pending"
}
```
HTTP **202 Accepted**

### Done (résultat prêt)

```json
{
  "job_id": "...",
  "status": "done",
  "meta": { "request_id": "...", "cached": false, "latency_ms": 15234 },
  "flash": {
    "headline": "...",
    "what_i_see": ["..."],
    "to_check": ["..."],
    "confidence": "medium"
  }
}
```
HTTP **200 OK**

### Error (échec Mistral)

```json
{
  "job_id": "...",
  "status": "error",
  "error": {
    "code": "MISTRAL_TIMEOUT",
    "message": "Lecture DIVA momentanément indisponible."
  }
}
```
HTTP **200 OK** (état final connu)

### Not found / expiré

HTTP **404 Not Found**

------------------------------------------------------------------------

# 4. Job store (DIVA)

- **Implémentation** : `map[jobID]JobResult` en mémoire
- **TTL** : 5 minutes (identique au cache flash)
- **Purge** : goroutine périodique (toutes les 60 s) des jobs expirés
- **Pas de persistance** : perte au restart du conteneur — acceptable (client repoll ou relance)

------------------------------------------------------------------------

# 5. Proxy Linky

## 5.1 POST `/api/diva/explain/async`

- Proxy vers `POST {DIVA_URL}/diva/explain/async`
- Retourne 202 avec `job_id` ou 200 avec flash (cache hit)

## 5.2 GET `/api/diva/jobs/[jobId]`

- Proxy vers `GET {DIVA_URL}/diva/jobs/{jobId}`
- Transparent (pas de timeout long côté proxy)

------------------------------------------------------------------------

# 6. DivaFlashBlock (frontend)

## 6.1 Comportement

1. Au chargement : vérifier **cache navigateur** (localStorage, TTL 5 min) → si valide, affichage immédiat
2. Après debounce 2 s : appeler `POST /api/diva/explain/async`
3. Si **200** (cache serveur) → afficher flash immédiatement
4. Si **202** → récupérer `job_id`, lancer le poll
5. Poll `GET /api/diva/jobs/{job_id}` toutes les **2 s**
6. Si `status === "done"` → afficher flash, mettre à jour cache navigateur
7. Si `status === "error"` → afficher message d’erreur
8. Timeout poll : **2 minutes** (puis afficher erreur)
9. Pas de timeout HTTP long — chaque requête est courte

## 6.2 UX

- Cache navigateur valide : affichage instantané, refresh silencieux en arrière-plan
- État initial (sans cache) : « Analyse en cours… » (sans mention de durée)
- Résultat ou erreur : comme aujourd’hui

------------------------------------------------------------------------

# 7. Variables d’environnement

| Variable              | Défaut | Description                          |
|-----------------------|--------|--------------------------------------|
| `JOBS_TTL_SECONDS`    | `300`  | TTL des jobs en mémoire (5 min)      |
| `JOBS_PURGE_INTERVAL_SECONDS` | `60` | Intervalle de purge des jobs expirés |

------------------------------------------------------------------------

# 8. Compatibilité Dorevia

- **Pas de dépendance externe** : pas de Redis, RabbitMQ, etc.
- **Unité autonome** : DIVA reste une unit Docker légère
- **Réseau interne** : pas de changement
- **Tenants** : pas d’impact (pas de stockage par tenant, job_id est opaque)

------------------------------------------------------------------------

# 9. Plan d’implémentation (suggesté)

| Étape | Composant            | Tâche                                                | SP  |
|-------|----------------------|------------------------------------------------------|-----|
| 1     | DIVA job store       | `internal/jobs/store.go` — map + TTL + purge         | 2   |
| 2     | DIVA handlers        | `ExplainAsync`, `GetJob` — routes, goroutine         | 3   |
| 3     | Linky proxy          | `/api/diva/explain/async`, `/api/diva/jobs/[jobId]`  | 2   |
| 4     | DivaFlashBlock       | Appel async + poll, états UI                         | 2   |
| 5     | Tests & recette      | Smoke test async, tests manuels UI                  | 1   |

**Total** : ~10 SP (~2 jours)

------------------------------------------------------------------------

**Fin de la SPEC.**

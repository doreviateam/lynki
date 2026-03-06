# Rapport — Implémentation Concurrency Guard DIVA

**Date** : 2026-02-17  
**Version** : 1.0  
**Statut** : Implémentation complète — Guard opérationnel  
**Références** : `SPEC_ConcurrencyGuard.md`, `RECOS_ConcurrencyGuard_DIVA_2026-02-17.md`, `RAPPORT_LOAD_TEST_DIVA_MISTRAL_2026-02-17.md`

---

## 1. Synthèse exécutive

Le **Concurrency Guard** limite à 1 refresh Mistral actif par `context_hash`, évitant la saturation CPU observée lors du load test (pics > 180 % pour 5 refresh parallèles).

| Critère | Résultat |
|---------|----------|
| **Guard** | ✅ `internal/guard/` — TryAcquire, Release, PurgeStale |
| **Stratégie** | Reject (pas d'attente) — réponse 200 soft si refresh en cours |
| **API** | ✅ `meta.refresh_in_progress` (non-breaking) |
| **Injection** | ✅ Pas de global — guard injecté comme cache/Mistral |
| **Tests unitaires** | ✅ 3 tests guard (acquire/release, hashes différents, concurrence) |
| **Test intégration** | ✅ 5 requêtes simultanées → 1 inférence, 4 rejets soft |

---

## 2. Contexte

### 2.1 Problème

Le mode `force_refresh=true` déclenche une inférence Mistral. Sous charge (plusieurs refresh simultanés) :
- CPU Mistral monte à > 180 %
- Latence 15–30 s par requête
- Risque de timeouts et dégradation UX

Le cache ne protège pas contre les refresh concurrents.

### 2.2 Solution

Verrou par `context_hash` : **1 refresh actif maximum** par contexte. Les requêtes supplémentaires reçoivent une réponse 200 « soft » avec `meta.refresh_in_progress=true`.

---

## 3. Implémentation

### 3.1 Arborescence

```
units/diva/internal/
├── guard/
│   ├── guard.go       # RefreshGuard (TryAcquire, Release, PurgeStale)
│   └── guard_test.go  # 3 tests unitaires
├── handlers/explain.go   # Guard intégré dans le flux
├── models/models.go     # Meta.RefreshInProgress
└── server/server.go     # Injection du guard

scripts/
└── test_diva_guard_integration.sh   # Test intégration SPEC §10.2
```

### 3.2 Fichiers créés ou modifiés

| Fichier | Action |
|---------|--------|
| `internal/guard/guard.go` | **Créé** — RefreshGuard, purge 30 s |
| `internal/guard/guard_test.go` | **Créé** — TryAcquire/Release, hash diff, 10 concurrents |
| `internal/models/models.go` | **Modifié** — `RefreshInProgress bool` dans Meta |
| `internal/server/server.go` | **Modifié** — création et injection du guard |
| `internal/handlers/explain.go` | **Modifié** — TryAcquire, soft response, defer Release |
| `scripts/test_diva_guard_integration.sh` | **Créé** — 5 req. simultanées force_refresh |

### 3.3 Flux handler (ordre des opérations)

1. `contextHash := computeContextHash(...)`
2. Si `!force_refresh` → cache lookup → return si hit
3. Si `force_refresh` : `TryAcquire(contextHash)` → si false → return 200 soft
4. `defer guard.Release(contextHash)`
5. Appel Mistral
6. `cache.Set(contextHash, ...)`
7. return result

Le lock couvre l'appel Mistral **et** le `cache.Set` pour éviter qu'un second refresh démarre juste après.

### 3.4 Configuration

| Variable d'environnement | Défaut | Description |
|--------------------------|--------|-------------|
| `GUARD_MAX_AGE_SECONDS` | 60 | Âge max des locks orphelins (purge) — doit être aligné avec 2 × MISTRAL_TIMEOUT |

### 3.5 Purge des locks orphelins

- **Intervalle** : toutes les 30 s  
- **Règle** : suppression des locks plus vieux que `maxAge` (crash, timeout)  
- **Protection** : évite un blocage permanent si une requête plante sans Release

---

## 4. Contrat API

### 4.1 Réponse soft (refresh en cours)

```json
{
  "meta": {
    "request_id": "...",
    "context_hash": "sha256:...",
    "refresh_in_progress": true,
    "cached": false,
    "latency_ms": 2
  },
  "flash": {
    "headline": "Analyse déjà en cours.",
    "what_i_see": ["Une analyse DIVA est déjà en cours pour ce contexte."],
    "to_check": ["Réessayez dans quelques secondes ou attendez le résultat."],
    "confidence": "low"
  }
}
```

- HTTP 200 (pas 409/429 en v1)  
- L'UI conserve l'ancienne synthèse et peut afficher un message discret.

---

## 5. Tests

### 5.1 Unitaires

```bash
cd units/diva && go test ./internal/guard/... -v
```

- `TestRefreshGuard_TryAcquire_Release` : acquire → true, re-acquire sans release → false, release → acquire → true  
- `TestRefreshGuard_DifferentHashes` : hash1 et hash2 acquièrent en parallèle  
- `TestRefreshGuard_ConcurrentAcquire` : 10 goroutines simultanées → 1 seul acquiert

### 5.2 Intégration

```bash
scripts/test_diva_guard_integration.sh
```

- 5 requêtes simultanées `force_refresh=true`, même `context_hash`  
- **Attendu** : 1 inférence Mistral, 4 réponses avec `refresh_in_progress=true`  
- **Résultat** : ✓ validé

---

## 6. Impact UI (recommandations)

| Élément | Reco |
|---------|------|
| **Proxy Linky** | Forwarder `meta.refresh_in_progress` sans transformation |
| **Bouton Rafraîchir** | Désactiver + spinner pendant la requête |
| **Si refresh_in_progress** | Garder l'ancienne synthèse, message « Analyse déjà en cours », bouton disabled 3–5 s |
| **Debounce** | Conserver 5 s sur auto-refresh |

---

## 7. Backlog / évolutions

- Guard sur cache-miss non-refresh (burst protection)  
- Mode « wait » avec file d'attente courte et `lock_wait_ms`  
- Lock distribué Redis si multi-instance DIVA  
- Rate limiting par tenant

---

## 8. Synthèse

| Critère | Évaluation |
|---------|------------|
| **Effort** | ~2 SP |
| **Risque** | Maîtrisé (changements localisés) |
| **Valeur** | Élevée (protection CPU + UX stable) |
| **Non-régression** | Smoke test OK, load test cohérent |

---

*Fin du rapport.*

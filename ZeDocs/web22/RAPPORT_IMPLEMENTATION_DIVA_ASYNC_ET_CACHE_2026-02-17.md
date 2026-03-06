# Rapport d'implémentation — DIVA Async, v2 éditorial, cache navigateur

**Date** : 2026-02-17  
**Périmètre** : Mode asynchrone, conformité spec v2, cache localStorage  
**Statut** : ✅ Implémenté et validé

---

## 1. Résumé exécutif

L'évolution DIVA couvre trois axes principaux :

1. **Mode asynchrone** — Découplage requête/réponse, poll au lieu de connexion bloquante
2. **Conformité spec v2 éditoriale** — Prompt verbeux, 8 KPI dans `what_i_see`, réponse en français
3. **Cache navigateur** — Affichage immédiat pour visites répétées (mêmes filtres, < 5 min)

**Résultat** : Latence perçue fortement réduite (instantané avec cache, ~36 s sans cache vs timeout avant).

---

## 2. Mode asynchrone

### 2.1 Spécification

`SPEC_DIVA_Async_v1.0.md` — `PLAN_IMPLEMENTATION_DIVA_ASYNC_SCRUM.md`

### 2.2 Implémentation

| Composant | Fichiers | Description |
|-----------|----------|-------------|
| **DIVA** | `internal/store/*.go` | Store persistant (Postgres) ou mémoire (fallback), clé `context_hash` |
| **DIVA** | `internal/handlers/explain_async.go` | `POST /diva/explain/async` (202 + context_hash), `GET /diva/jobs/:contextHash` |
| **DIVA** | `internal/server/server.go` | Routes async enregistrées |
| **Linky** | `app/api/diva/explain/async/route.ts` | Proxy POST async (timeout 10 s) |
| **Linky** | `app/api/diva/jobs/[contextHash]/route.ts` | Proxy GET job |
| **Linky** | `components/DivaFlashBlock.tsx` | Flux async : POST → 202 → poll 2 s → affichage |

### 2.3 Flux utilisateur

```
Chargement page → debounce 2 s → POST /api/diva/explain/async
  ├─ 200 (cache serveur) → affichage immédiat
  └─ 202 { context_hash } → "Analyse en cours…" → poll GET /api/diva/jobs/{context_hash} toutes les 2 s
       └─ status=done → affichage
       └─ timeout 2 min → message erreur
```

### 2.4 Rétrocompatibilité

`POST /diva/explain` (sync) conservé pour smoke test et scripts.

---

## 3. Conformité spec v2 éditoriale

### 3.1 Corrections appliquées

| Problème | Correction | Fichier |
|----------|------------|---------|
| `what_i_see` tronqué à 3 entrées | Limite portée à `len(cards)+2` | `mistral/client.go` parseFlash |
| Réponse en anglais | LANGUE : Réponds UNIQUEMENT en français | Prompt system |
| Headline peu verbeux | Prompt enrichi (exemple §5, ton §4, règles détaillées) | Prompt system |
| 8 KPI non couverts | "UNE ligne par indicateur… Si 8 fournis, 8 lignes" | Prompt system |
| max_tokens insuffisant | 300 → 450 | mistral/client.go |
| Timeout Mistral (8 KPI ~36 s) | 30 s → 90 s | mistral/client.go |

### 3.2 Prompt actuel

- Ton et posture (DIVA est / n'est pas)
- Exemple conforme §5 inclus
- Règles densité, anti-répétition, varier débuts de phrase
- what_i_see : une ligne par KPI obligatoire
- Interdictions strictes

---

## 4. Cache navigateur

### 4.1 Implémentation

- **Stockage** : localStorage, clé `diva_flash_{tenant}_{company}_{date_debut}_{date_fin}`
- **TTL** : 5 minutes (aligné cache DIVA serveur)
- **Logique** :
  - Si cache valide pour les filtres courants → affichage immédiat
  - Fetch en arrière-plan (silencieux, pas de loader)
  - Mise à jour du cache à chaque réponse réussie

### 4.2 Fréquence de renouvellement

- **À chaque chargement** ou changement de filtres : appel DIVA après debounce 2 s
- **Pas de refresh automatique** tant que l'utilisateur reste sur la page sans recharger
- Cache considéré périmé après 5 min pour l'affichage instantané

---

## 5. Outils et scripts

| Script | Rôle |
|--------|------|
| `scripts/smoke_test_diva_e2e.sh` | Test sync direct DIVA |
| `scripts/diagnostic_diva_async.sh` | Test async 8 KPI (POST async → poll → résultat) |
| `./scripts/redeploy_diva_stack.sh --linky` | Redéploiement DIVA + Linky |

---

## 6. Choix produits

| Décision | Raison |
|----------|--------|
| Bouton « Rafraîchir » masqué | Demande produit |
| Pas de Redis/queue externe | Dorevia-compatible, légèreté |
| Cache 5 min navigateur | Aligné cache serveur, visites répétées fluides |
| Timeout Mistral 90 s | 8 KPI ~36 s, marge pour cold start |

---

## 7. Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `MISTRAL_BASE_URL` | `http://mistral-llamacpp:8000/v1` | URL Mistral |
| `DIVA_URL` | `http://diva:8010` | URL DIVA (proxy Linky) |
| `CACHE_TTL_SECONDS` | `300` | TTL cache flash (5 min) |
| `JOBS_TTL_SECONDS` | `300` | TTL jobs en mémoire |
| `JOBS_PURGE_INTERVAL_SECONDS` | `60` | Intervalle purge jobs |

---

## 8. Fichiers modifiés / créés

### DIVA (Go)

- `internal/jobs/store.go` (nouveau)
- `internal/handlers/explain_async.go` (nouveau)
- `internal/server/server.go`
- `internal/mistral/client.go`

### Linky (Next.js)

- `app/api/diva/explain/async/route.ts` (nouveau)
- `app/api/diva/jobs/[jobId]/route.ts` (nouveau)
- `components/DivaFlashBlock.tsx`

### Scripts

- `scripts/diagnostic_diva_async.sh` (nouveau)

### Documentation

- `ZeDocs/web22/SPEC_DIVA_Async_v1.0.md`
- `ZeDocs/web22/PLAN_IMPLEMENTATION_DIVA_ASYNC_SCRUM.md`
- Ce rapport

---

## 9. Validation

- [x] Diagnostic async 8 KPI : succès ~36 s
- [x] UI Linky : affichage conforme spec v2 (narrative, 8 lignes données utilisées, français)
- [x] Cache navigateur : affichage instantané sur mêmes filtres
- [x] Smoke test sync : OK

---

## 10. Évolution — Persistent Analysis Store (2026-02-17)

Le job store en mémoire a été remplacé par un store persistant (Postgres) ou mémoire (fallback). Clé : `context_hash` au lieu de `job_id`.

Voir : `RAPPORT_IMPLEMENTATION_DIVA_PERSISTENT_STORE_2026-02-17.md`

---

**Fin du rapport.**

# Plan d'implémentation — DIVA Async (Scrum)

**Date** : 2026-02-16  
**Spec** : `SPEC_DIVA_Async_v1.0.md`  
**Objectif** : Mode asynchrone pour découpler requête / réponse — scalable, Dorevia-compatible  
**Statut** : ✅ Implémenté (rapport : `RAPPORT_IMPLEMENTATION_DIVA_ASYNC_ET_CACHE_2026-02-17.md`)

---

## User Stories

### US-A1 : Job store DIVA
En tant que service DIVA, je stocke les résultats des jobs en mémoire avec TTL pour que le client puisse récupérer le résultat via poll sans bloquer la connexion.

**Critères d'acceptation** :
- [x] `internal/jobs/store.go` : map `job_id → JobResult`, mutex
- [x] TTL configurable (default 300 s)
- [x] Purge périodique des jobs expirés (intervalle 60 s)
- [x] SetPending/SetDone/SetError/Get/Delete

**SP** : 2

---

### US-A2 : Endpoints async DIVA
En tant que client Linky, je peux soumettre une analyse en async et récupérer le résultat par poll.

**Critères d'acceptation** :
- [x] `POST /diva/explain/async` : si cache hit → 200 flash ; sinon 202 { job_id }, goroutine Mistral
- [x] `GET /diva/jobs/{job_id}` : 202 pending, 200 done/error, 404 not found
- [x] Goroutine : appel Mistral → jobStore.SetDone/SetError
- [x] Rétrocompat : `POST /diva/explain` sync inchangé

**SP** : 3

---

### US-A3 : Proxy Linky async
En tant que frontend Linky, je peux appeler des routes proxy qui délèguent à DIVA en async.

**Critères d'acceptation** :
- [x] `POST /api/diva/explain/async` → proxy vers DIVA `/diva/explain/async`
- [x] `GET /api/diva/jobs/[jobId]` → proxy vers DIVA `/diva/jobs/{jobId}`
- [x] Pas de timeout long sur le proxy (10 s POST, 5 s GET)

**SP** : 2

---

### US-A4 : DivaFlashBlock mode async
En tant qu'utilisateur, je vois le bloc DIVA se remplir sans bloquer la page, via analyse en arrière-plan.

**Critères d'acceptation** :
- [x] Appel `POST /api/diva/explain/async` au lieu de sync
- [x] Si 200 (cache) → affichage immédiat
- [x] Si 202 → poll `GET /api/diva/jobs/{jobId}` toutes les 2 s
- [x] Timeout poll 2 min, message d'erreur si dépassé
- [x] États UI : "Analyse en cours…", résultat, erreur
- [x] Cache navigateur (localStorage 5 min) pour affichage instantané visites répétées

**SP** : 2

---

### US-A5 : Recette & smoke test
En tant que devops, je peux valider le flux async de bout en bout.

**Critères d'acceptation** :
- [x] Script `diagnostic_diva_async.sh` : POST async + poll 8 KPI
- [x] Recette manuelle : page Linky, UX fluide (pas de blocage)
- [x] Docs README DIVA + plan mis à jour

**SP** : 1

---

## Récapitulatif

| US   | Titre                | SP |
|------|----------------------|-----|
| A1   | Job store DIVA       | 2   |
| A2   | Endpoints async DIVA | 3   |
| A3   | Proxy Linky async    | 2   |
| A4   | DivaFlashBlock async | 2   |
| A5   | Recette & smoke test | 1   |
| **Total** |                   | **10** |

**Estimation** : ~2 jours

---

## Ordre d'implémentation

1. US-A1 (job store) — prérequis technique
2. US-A2 (endpoints DIVA) — cœur du flux
3. US-A3 (proxy Linky) — exposition
4. US-A4 (DivaFlashBlock) — UX
5. US-A5 (recette)

---

## Fichiers impactés

| Composant | Fichiers |
|-----------|----------|
| DIVA      | `internal/jobs/store.go` (nouveau), `internal/handlers/explain_async.go` (nouveau), `internal/server/server.go` |
| Linky     | `app/api/diva/explain/async/route.ts` (nouveau), `app/api/diva/jobs/[jobId]/route.ts` (nouveau) |
| Linky UI  | `components/DivaFlashBlock.tsx` |
| Scripts   | `scripts/smoke_test_diva_e2e.sh`, `scripts/diagnostic_diva_async.sh` |

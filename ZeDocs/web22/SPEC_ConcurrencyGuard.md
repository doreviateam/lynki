# SPEC --- Concurrency Guard (par `context_hash`) --- DIVA

**Fichier** : `SPEC_ConcurrencyGuard.md`\
**Version** : v1.0\
**Date** : 2026-02-17\
**Scope** : `units/diva/` (Go/Fiber) + impacts UI/Proxy (optionnels mais
recommandés)\
**Objectif** : Empêcher la saturation de Mistral/llama.cpp en bloquant
les **refresh concurrents** sur un même contexte, tout en conservant une
UX fluide.

------------------------------------------------------------------------

## 1. Contexte et problème

Le mode `force_refresh=true` déclenche une inférence Mistral
systématique.\
Sous charge (ex. plusieurs refresh simultanés), l'inférence peut monter
à **15--30 s**, et provoquer :

-   saturation CPU (pics \> 180 %)
-   timeouts (30 s)
-   dégradation UX (multiples clics "Rafraîchir")

Le cache (`context_hash`, TTL 5 min) rend les relectures instantanées,
mais **ne protège pas** contre des refresh concurrents.

------------------------------------------------------------------------

## 2. Décision

Mettre en place un **verrou de concurrence** (concurrency guard) **par
`context_hash`** :

-   **1 refresh actif maximum** par `context_hash`
-   Les refresh supplémentaires sur le même `context_hash` sont
    **rejetés** (réponse 200 "soft") ou **signalés** (409/429) selon
    option retenue
-   Les requêtes sans `force_refresh` continuent d'utiliser le cache
    normalement

------------------------------------------------------------------------

## 3. Définitions

### 3.1 `context_hash` (rappel)

Hash SHA-256 d'un JSON canonicalisé :

-   `tenant`
-   `company_id`
-   `date_start`
-   `date_end`
-   `cards` triées par `key`
-   **sans** `formatted`, `label` (uniquement `{key, value, unit}`)

### 3.2 "Refresh"

Une requête est considérée comme **refresh** si :

-   `options.force_refresh == true`

------------------------------------------------------------------------

## 4. Comportement attendu

### 4.1 Requête standard (sans force_refresh)

1.  Calcul `context_hash`
2.  Si cache hit → réponse immédiate (`meta.cached=true`)
3.  Sinon → tentative d'inférence (pas concernée par le guard v1 si
    `force_refresh=false`)

> Note : Optionnel v1.1+ : appliquer aussi le guard aux cache-miss
> "normaux" pour éviter les bursts. Hors scope ici.

### 4.2 Requête refresh (force_refresh=true)

1.  Calcul `context_hash`
2.  Vérifier si un refresh est déjà "in flight" pour ce `context_hash`
3.  Si **aucun** refresh en cours → acquérir le lock, lancer inférence
4.  À la fin (succès ou erreur) → libérer le lock
5.  La réponse refresh **peut** alimenter le cache (recommandé)

### 4.3 Refresh concurrent sur le même context_hash

-   Si un refresh est déjà en cours :
    -   DIVA **ne doit pas** lancer une seconde inférence
    -   DIVA répond immédiatement avec un message "soft" et
        `meta.refresh_in_progress=true`

------------------------------------------------------------------------

## 5. Contrat API (impact minimal)

### 5.1 Ajout dans `meta` (non-breaking)

Ajouter au champ `meta` :

-   `refresh_in_progress` (bool) --- indique si la requête a été rejetée
    car un refresh est déjà en cours
-   `lock_wait_ms` (int, optionnel v1) --- toujours 0 en stratégie
    "reject", utile si un jour on passe en "wait"

Exemple :

``` json
{
  "meta": {
    "request_id": "…",
    "context_hash": "…",
    "generated_at": "…",
    "cached": false,
    "model": "mistral-7b…",
    "latency_ms": 2,
    "refresh_in_progress": true
  },
  "flash": {
    "headline": "Analyse déjà en cours.",
    "what_i_see": ["Une analyse DIVA est déjà en cours pour ce contexte."],
    "to_check": ["Réessayez dans quelques secondes ou attendez le résultat."],
    "confidence": "low"
  }
}
```

### 5.2 Codes HTTP

**Recommandation v1 (UX robuste)** : toujours **200** pour "refresh déjà
en cours", afin de :

-   éviter des erreurs réseau côté UI
-   garder un rendu simple (bloc DIVA affiche le message)

Alternative (v1.1+) : 409 `refresh_in_progress` ou 429, si tu veux une
sémantique plus stricte.

------------------------------------------------------------------------

## 6. Algorithme

### 6.1 Stratégie v1 : Reject (pas d'attente)

Pseudo-flow :

1.  `h = compute_context_hash(req)`
2.  `if req.options.force_refresh:`
    -   `if guard.TryAcquire(h) == false:`
        -   return 200 (soft) `refresh_in_progress=true`
    -   else:
        -   defer `guard.Release(h)`
        -   call Mistral
        -   store cache
        -   return result
3.  sinon : logique cache normale

------------------------------------------------------------------------

## 7. Implémentation Go (recommandations)

### 7.1 Data structure

Dans `internal/cache` ou `internal/guard` :

-   `type RefreshGuard struct { mu sync.Mutex; inflight map[string]time.Time }`

Fonctions :

-   `TryAcquire(contextHash string) bool`
-   `Release(contextHash string)`
-   `PurgeStale(maxAge time.Duration)` (optionnel)
-   `IsInflight(contextHash string) bool` (optionnel)

### 7.2 Durée de vie / purge

Le lock doit être libéré en `defer` après l'appel Mistral.\
Pour protéger contre crash/edge cases :

-   ajouter une purge périodique des locks vieux de
    `maxAge = 2 * MISTRAL_TIMEOUT` (ex. 60 s)
-   purge simple dans un goroutine ticker (toutes les 30 s)

### 7.3 Observabilité

Logs (sans payload) :

-   `request_id`
-   `context_hash`
-   `force_refresh`
-   `refresh_in_progress`
-   `latency_ms`
-   `mistral_latency_ms` (si disponible)

------------------------------------------------------------------------

## 8. Impacts Proxy Linky (recommandé)

Le proxy `/api/diva/explain` doit **forward** le champ
`meta.refresh_in_progress` et ne pas transformer le statut (200).

------------------------------------------------------------------------

## 9. Impacts UI Linky (recommandé)

### 9.1 Désactivation du bouton Refresh

-   Au clic refresh : bouton disabled + spinner "Analyse..."
-   Si la réponse contient `meta.refresh_in_progress=true` :
    -   conserver l'ancienne synthèse
    -   afficher un message doux "Analyse déjà en cours"
    -   garder le bouton disabled quelques secondes (ex. 3--5 s) ou
        jusqu'au prochain auto-refresh

### 9.2 Éviter le spam

-   Un seul refresh actif par `context_hash`
-   Debounce 5 s sur auto-refresh maintenu

------------------------------------------------------------------------

## 10. Tests d'acceptation

### 10.1 Test unitaire (guard)

-   Acquire h → true
-   Acquire h (sans release) → false
-   Release h → Acquire h → true

### 10.2 Test intégration (API)

-   Lancer 5 requêtes simultanées avec `force_refresh=true` et même
    `context_hash`
-   Attendu :
    -   1 seule inférence Mistral
    -   4 réponses immédiates avec `refresh_in_progress=true`

### 10.3 Test E2E (UI)

-   Cliquer "Rafraîchir" 5 fois rapidement
-   Attendu :
    -   une seule inférence
    -   UI n'explose pas, pas d'erreur rouge
    -   message "Analyse déjà en cours" possible

------------------------------------------------------------------------

## 11. Backlog / évolutions

-   Guard aussi sur cache-miss non-refresh (burst protection)
-   Mode "wait" (file d'attente courte) avec `lock_wait_ms`
-   Redis distributed lock si multi-instance DIVA
-   Rate limiting (par tenant) complémentaire

------------------------------------------------------------------------

**Fin --- SPEC_ConcurrencyGuard.md**

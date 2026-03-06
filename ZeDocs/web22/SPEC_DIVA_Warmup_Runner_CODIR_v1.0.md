# SPEC — DIVA Warm‑up Runner (CODIR Ready)

**Version** : 1.1  
**Date** : 2026-02-17  
**Statut** : Implémenté  
**Scope** : Linky proxy (Next.js) + DIVA (Go) + Runner (Go)  
**Compatibilité** : Dorevia Platform (mono‑instance compatible, multi‑instance ready)  
**Pré‑requis** : `DIVA Async Persistent Analysis Store` (Postgres) + API async opérationnelle

### Changelog v1.1

- **Payload prewarm** : strictement identique à `explain/async`. Pas de transformation spécifique.
- **Source KPI** : Option B (Linky) retenue pour v1. Option A en v2.
- **RUNNER_TENANT_CONFIG** : format `tenant:1,2;tenant2:0` (remplace RUNNER_TENANTS + RUNNER_COMPANY_IDS).
- **§6.5 Résilience** : pas de panic, log warning, retry cycle suivant. Ne jamais bloquer le runner.

---

## 0. Résumé

Objectif : réduire la **latence perçue** de DIVA sans accélérer le LLM, en **pré‑calculant** les analyses les plus utiles au CODIR.

Stratégie optimale (hybride 2 étages) :

1. **Warm‑up opportuniste** : déclenche une analyse *en arrière‑plan* à chaque chargement de `dashboard-metrics` (ou de la Home Linky).  
2. **Runner planifié CODIR** : pré‑calcule en continu un petit set de contextes “CODIR” (Mois courant + YTD) avec une concurrence strictement limitée.

> Principe : **asynchrone, idempotent, déterministe**, fondé sur `context_hash` et la DB DIVA comme source de vérité.

---

## 1. Objectifs

- **Perception** : afficher une synthèse DIVA souvent déjà prête au moment où l’utilisateur lit la grille KPI.
- **Stabilité** : ne pas perdre de jobs (redémarrage conteneur, déploiement) grâce à Postgres.
- **Maîtrise CPU** : limiter les inférences simultanées (le LLM reste la ressource rare).
- **Dorevia‑compatible** : pas de Redis / pas de queue externe / pas de dépendance SaaS.

---

## 2. Non‑objectifs (v1)

- Event‑driven complet sur tous les évènements Vault (à traiter plus tard).
- Personnalisation par utilisateur (volet paramétrage).
- Historique long terme des analyses.
- Alerting automatique (SMS/email) — possible en vNext quand l’éditorial v2 est stable.

---

## 3. Définitions

- **Contexte DIVA** : (tenant, company_id, date_start, date_end, cards triées par key, key/value/unit).
- **context_hash** : SHA‑256 du JSON canonicalisé du contexte (déjà défini dans DIVA).
- **Warm‑up** : lancement d’un job DIVA sans bloquer l’UI.
- **Runner** : job planifié backend qui maintient “chaud” un set de contextes CODIR.

---

## 4. Architecture

### 4.1 Composants

- **Linky** :
  - `dashboard-metrics` (déjà existant)
  - nouveau : `/api/diva/prewarm` (fire‑and‑forget)
- **DIVA** :
  - `POST /diva/explain/async` (existant)
  - DB `diva_analysis` (source de vérité)
- **Runner** (nouveau, Go) :
  - exécutable : `cmd/diva-runner`
  - capable de produire des contextes CODIR et d’appeler DIVA async

### 4.2 Flux “Warm‑up opportuniste”

1. Linky charge `dashboard-metrics` (normal).
2. Linky déclenche **en parallèle** `/api/diva/prewarm` avec le même `context` + `dashboard`.
3. `/api/diva/prewarm` appelle DIVA async avec timeout très court et **ignore** le résultat.
4. Le bloc DIVA, lui, continue sa logique (async poll) mais trouve plus souvent un résultat déjà prêt.

### 4.3 Flux “Runner planifié CODIR”

Toutes les X minutes :

1. Générer la liste des contextes CODIR (mois courant, YTD) pour (tenant, company).
2. Construire les `cards` via la source KPI (Vault agrégations ou endpoint interne existant).
3. Appeler `POST /diva/explain/async` (sans `force_refresh`) ; DIVA décide :
   - 200 si done & fresh
   - 202 si pending ou nouveau job
4. Concurrence limitée à 1 (ou 2 max).

---

## 5. API — Linky prewarm

### 5.1 Endpoint

`POST /api/diva/prewarm`

- **But** : déclencher un job DIVA *sans* impact UX
- **Sémantique** : best effort (les erreurs sont silencieuses, log côté serveur uniquement)

### 5.2 Payload

Le payload prewarm est **strictement identique** à celui de `POST /diva/explain/async`. Aucune transformation spécifique. (Évite duplication, incohérence, divergence Linky vs Runner.)

Exemple :

```json
{
  "context": {
    "tenant": "sarl-la-platine",
    "company_id": 1,
    "date_start": "2026-02-01",
    "date_end": "2026-02-17",
    "timezone": "Europe/Paris",
    "currency": "EUR",
    "locale": "fr-FR"
  },
  "dashboard": {
    "cards": [
      { "key": "cash", "label": "Cash", "value": 12345, "formatted": "12 345", "unit": "EUR" }
    ]
  },
  "options": {
    "mode": "flash",
    "force_refresh": false,
    "prewarm": true
  }
}
```

### 5.3 Comportement

- Timeout côté Linky : **500 ms à 1 000 ms** maximum.
- Si timeout / erreur : **on ignore** (HTTP 204 côté client possible).
- Objectif : ne jamais ralentir le rendu de la grille.

### 5.4 Réponse

- Recommandé : `204 No Content` (toujours).  
  Les logs serveur capturent éventuellement `context_hash` et le status renvoyé par DIVA.

---

## 6. Runner CODIR (Go)

### 6.1 Commande

`cmd/diva-runner`

Rôle : maintenir “chauds” certains contextes.

### 6.2 Modes

- **loop** (par défaut) : tourne en continu avec intervalle.
- **once** : exécute une itération puis sort (utile cron).

### 6.3 Contexte CODIR minimal (v1)

Pour chaque (tenant, company_id) configuré :

- **P1** : Mois courant (`date_start = 1er du mois`, `date_end = today`)
- **P2** : YTD (`date_start = 1er janvier`, `date_end = today`)

Optionnel (v1.1) :
- Mois précédent (comparatif CODIR)

### 6.4 Concurrence / garde‑fous

- `RUNNER_CONCURRENCY` : **1** (default), max 2.
- `RUNNER_MAX_IN_FLIGHT` : égal à concurrency.
- Ne jamais lancer plus de N inférences en parallèle, même si 20 tenants.

### 6.5 Résilience (Linky / Vault / DIVA down)

**Ne jamais bloquer le runner.**

Si Linky ou DIVA est indisponible :
- Pas de panic — le runner continue.
- Log **warning** par contexte en échec.
- Retry au cycle suivant (prochaine itération).

Optionnel : backoff exponentiel léger si tous les contextes échouent (éviter de marteler un service down).

### 6.6 Source des KPI

Le runner envoie le **même payload** que `POST /diva/explain/async`. Pas de format `cards` custom — identique à Linky.

**Option B (v1, retenue)** : appel HTTP à Linky `dashboard-metrics`, puis transformation identique à celle de `explain/async`.
- Simple, cohérent, zéro duplication.
- Évite divergence métriques Linky vs Runner.

**Option A (v2)** : appel direct aux agrégations Vault. Plus "pure" mais duplication de logique. À envisager quand un Metrics Service unifié existera.

Le runner produit strictement le même format `cards` que DIVA attend.

---

## 7. DIVA — comportement requis (déjà couvert par la spec Postgres)

Le runner et le prewarm reposent sur :

- Déduplication par `context_hash`
- `status=processing` réutilisé (202)
- `status=done` & non expiré (200)
- Stale detection (processing trop long → failed)

Aucun changement supplémentaire requis côté DIVA, sauf :

- accepter `options.prewarm` (ignoré côté logique ; utile uniquement pour logs/observabilité).

---

## 8. Observabilité (minimum viable)

### 8.1 Logs Linky (prewarm)

Log structuré (info) :

- `event=diva_prewarm`
- `tenant`, `company_id`, `date_start`, `date_end`
- `status` (code HTTP DIVA, ou `timeout`)
- `latency_ms`

### 8.2 Logs Runner

- `event=diva_runner_tick` (début/fin itération, durée)
- `event=diva_runner_context` (par contexte : 200/202/failed)
- `inference_started` / `inference_done` (si DIVA expose métrique, sinon via DB)

### 8.3 KPIs (v1)

- `prewarm_attempts`
- `prewarm_timeouts`
- `runner_iterations`
- `runner_contexts_processed`
- `diva_cache_hit_rate` (si exposé)
- `avg_time_to_done` (via DB : `done.updated_at - started_at`)

---

## 9. Paramètres

### 9.1 Linky

- `DIVA_URL` : URL DIVA interne
- `DIVA_PREWARM_TIMEOUT_MS` : 500–1000 (default 700)
- `DIVA_PREWARM_ENABLED` : true (default)

### 9.2 Runner

- `RUNNER_ENABLED` : true/false
- `RUNNER_MODE` : loop|once
- `RUNNER_INTERVAL_SECONDS` : 120 (default)
- `RUNNER_CONCURRENCY` : 1 (default)
- `RUNNER_TENANT_CONFIG` : config par tenant (format ci-dessous)
- `RUNNER_PERIODS` : `current_month,ytd` (default)

**Format `RUNNER_TENANT_CONFIG`** : `tenant:company1,company2;tenant2:company3`

Exemple : `RUNNER_TENANT_CONFIG=core:0;sarl-la-platine:1,2`

Rétrocompat : si vide, `RUNNER_TENANTS` + `RUNNER_COMPANY_IDS` (liste globale) restent utilisables.

---

## 10. UX cible (CODIR)

- À l’ouverture Linky :
  - **Grille KPI immédiate**
  - Bloc DIVA :
    - si résultat existant : affichage immédiat
    - sinon : “Analyse en cours…” + rendu dès disponibilité (poll)
- Aucune attente bloquante.
- Pas de bouton refresh (v1) — l’anticipation remplace l’action manuelle.

---

## 11. Plan d’implémentation (très court)

### US‑1 — Linky prewarm endpoint + call opportuniste (0.5 j)
- Ajouter `/api/diva/prewarm` (timeout court, ignore erreurs)
- Déclencher depuis la Home Linky après `dashboard-metrics` (non bloquant)

### US‑2 — Runner Go minimal (1 j)
- `cmd/diva-runner` loop/once
- Génération périodes CODIR (mois courant, YTD)
- Appel DIVA async
- Concurrency 1

### US‑3 — Recette (0.5 j)
- Vérifier que l’UI reçoit plus souvent 200 dès ouverture
- Mesurer “time to first meaningful DIVA” avant/après

---

## 12. Tests d’acceptation

### 12.1 Warm‑up opportuniste
- Charger Linky → vérifier un log `diva_prewarm`
- Recharger la page : bloc DIVA s’affiche plus vite (souvent instantané)

### 12.2 Runner
- Lancer runner 2 minutes
- Ouvrir Linky : 200 immédiat sur les contextes calculés
- Redémarrer DIVA pendant un job : pas de perte (DB conserve processing/done/failed)

---

Fin de la spécification.

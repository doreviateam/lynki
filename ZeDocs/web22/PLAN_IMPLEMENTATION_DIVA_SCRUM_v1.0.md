# Plan d'implémentation SCRUM — DIVA (synthèse KPI Linky)

**Version** : 1.1  
**Date** : 2026-02-17  
**Base** : `SPEC_DIVA_API_v1.0.md` (contenu v1.1), `ANNEXE_PROMPT_DIVA_FLASH_v1.0.md` (contenu v1.1), `RAPPORT_IMPLEMENTATION_MISTRAL_2026-02-17.md`  
**Durée estimée** : 3 sprints (2–3 semaines)  
**Contexte** : Mistral opérationnel (`units/mistral/`), service DIVA à créer (Go, aligné Vault), proxy et UI Linky  
**Équipe** : Dev / Plateforme  
**Stack** : Go (Fiber v2) — aligné Vault  

**Statut** : ✅ **Implémentation complète** (2026-02-17) — voir `RAPPORT_IMPLEMENTATION_DIVA_2026-02-17.md`

---

## 0. Ajustements (amendements v1.1)

Ces points sont **tranchés** pour éviter les zones grises pendant l'implémentation :

1. **Annexe prompts** : on référence **v1.1** (JSON strict renforcé).
2. **Cas `cards` vides / données insuffisantes** : **pas de 400**. DIVA répond **200** avec `confidence="low"` + headline explicite (UX robuste).
3. **context_hash déterministe** : hash calculé **sans `formatted`**, tri stable des cards par `key`, JSON canonicalisé.
4. **Ports** : DIVA écoute sur **8010** (interne), Mistral sur **8000** (interne). Aucun port exposé Internet.
5. **Timeout** : DIVA a un timeout technique Mistral **30 s** ; Linky applique un **timeout UX 10 s** (affiche l'ancienne synthèse si dépassement).

---

## 1. Vue d'ensemble

### 1.1 Objectif

Implémenter **DIVA** (lecture synthétique des KPI Linky) : service dédié `units/diva/` appelant Mistral, proxy Linky `/api/diva/explain`, bloc UI sous la grille. Synthèse Flash ≤ 10 s (objectif UX).

### 1.2 Périmètre

| Inclus | Exclu |
|--------|-------|
| Service `units/diva/` (Go) | DLP, historique, chat libre |
| Endpoint `POST /diva/explain` | Personnalisation, embeddings |
| Cache `context_hash` (TTL 5 min) | Rate limiting (v1) |
| Proxy Linky `/api/diva/explain` | |
| Mapping `dashboard-metrics` → `cards` | |
| Bloc UI sous grille (debounce 5 s) | |
| Prompts v1.1 (annexe) | |

### 1.3 Definition of Done (DoD) globale

DIVA v1 est terminé si :

- [x] `units/diva/` créé avec `docker-compose.yml`, service opérationnel
- [x] `POST /diva/explain` répond selon la SPEC (request/response, codes d'erreur)
- [x] Cache `context_hash` actif (TTL 5 min, pas d'appel Mistral en hit)
- [x] Proxy Linky `/api/diva/explain` transforme `dashboard-metrics` → format `cards`
- [x] Bloc synthèse affiché sous la grille Linky, debounce 5 s
- [x] Badge confidence + disclaimer affichés
- [x] Smoke test end-to-end (grille → DIVA → Mistral → réponse)

---

## 2. Structure des sprints

| Sprint | Durée | Objectif principal | Story Points |
|--------|-------|--------------------|--------------|
| **Sprint 0** (optionnel, 0.5–1j) | 0.5–1 jour | "Happy path visible" (UI + proxy + DIVA stub) | 3 SP |
| **Sprint 1** | 5–7 jours | Service DIVA (`units/diva/`) — structure, endpoint, Mistral, cache, parsing | 13 SP |
| **Sprint 2** | 3–4 jours | Proxy Linky `/api/diva/explain` + mapping cards | 5 SP |
| **Sprint 3** | 3–4 jours | Bloc UI Linky, intégration, debounce, smoke test e2e | 6 SP |

**Total estimé** : 24 SP (ou 27 SP avec Sprint 0) — 2–3 semaines

> Sprint 0 est recommandé si tu veux "voir DIVA parler" très vite, même avec une réponse statique.

---

## 3. Sprint 1 : Service DIVA (5–7 jours)

**Objectif** : Créer `units/diva/`, endpoint `POST /diva/explain`, appels Mistral, cache, parsing JSON strict, fallback, logs.

### US-1.1 : Création de l'unit DIVA — structure et compose

**En tant que** développeur plateforme  
**Je veux** une unit `units/diva/` avec docker-compose et service Go  
**Afin de** déployer DIVA sur le réseau interne, joignable par Linky.

**Points** : 3

**Critères d'acceptation** :

- [ ] Répertoire `units/diva/` créé avec `docker-compose.yml`, `Dockerfile`
- [ ] Service `diva` : réseau `dorevia-network`, port interne **8010**
- [ ] Image Go (Fiber v2, aligné Vault)
- [ ] Dépendance implicite : Mistral doit être up
- [ ] Healthcheck : `GET /health` ou `/ready`
- [ ] Logs rotatifs : max-size 20m, max-file 5

**Tâches techniques** :

- [ ] Créer `units/diva/Dockerfile` (Go, multi-stage build)
- [ ] Créer `units/diva/docker-compose.yml` — réseau `dorevia-network`, **pas de port exposé publiquement**
- [ ] Variables d'environnement :
  - `MISTRAL_BASE_URL=http://mistral-llamacpp:8000/v1`
  - `DIVA_PORT=8010`
  - `CACHE_TTL_SECONDS=300`
- [ ] Tester `docker compose config` sans erreur

**Livrables** : `units/diva/` structure de base, compose valide

---

### US-1.2 : Endpoint POST /diva/explain — contrat request/response

**En tant que** consommateur (proxy Linky)  
**Je veux** un endpoint `POST /diva/explain` conforme à la SPEC  
**Afin de** envoyer le contexte + cartes et recevoir une synthèse structurée.

**Points** : 3

**Critères d'acceptation** :

- [ ] `POST /diva/explain` accepte le body JSON (context, dashboard.cards, options.mode, options.force_refresh)
- [ ] Réponse 200 avec `meta` (request_id, context_hash, generated_at, cached, model, latency_ms) et `flash` (headline, what_i_see, to_check, confidence)
- [ ] Codes 400 (request invalide), 408 (timeout Mistral), 503 (Mistral indisponible)
- [ ] Corps d'erreur : `{ "error": { "code": "...", "message": "..." } }`

**Note v1.1 (important)** :  
**Données insuffisantes** (cards vides/partielles) → **200** avec `confidence="low"` + headline "Données insuffisantes..." (pas une erreur HTTP).

**Tâches techniques** :

- [ ] Structs Go pour request/response (validation via binding Fiber + validation légère)
- [ ] Validation : `context` obligatoire, `dashboard.cards` array (peut être vide)
- [ ] Génération `request_id` (UUID) pour chaque requête

**Livrables** : Endpoint avec contrat validé

---

### US-1.3 : Appel Mistral et parsing JSON strict

**En tant que** service DIVA  
**Je veux** appeler Mistral avec le system + user prompt de l'annexe  
**Afin de** obtenir une synthèse flash structurée.

**Points** : 4

**Critères d'acceptation** :

- [ ] Construction du prompt depuis `ANNEXE_PROMPT_DIVA_FLASH_v1.0.md` (contenu v1.1)
- [ ] Appel `POST /v1/chat/completions` vers `mistral-llamacpp:8000`
- [ ] Paramètres : `temperature=0.2`, `max_tokens=256`, timeout 30 s
- [ ] Parsing JSON strict de la réponse Mistral
- [ ] Validation : `headline`, `what_i_see`, `to_check`, `confidence` ∈ {low, medium, high}
- [ ] Fallback si JSON invalide : `headline="Lecture DIVA temporairement indisponible."`, `confidence=low`

**Tâches techniques** :

- [ ] Intégrer prompts (system, template) — constants ou fichiers embarqués
- [ ] Formatage des cartes (annexe §3) : `- {label} : {formatted} {unit}`
- [ ] Post-validation confidence (annexe §4) : ajustement si besoin (optionnel mais recommandé)
- [ ] Tests anti-hallucination (annexe §5) : rejet si termes interdits
- [ ] Gestion 408 (timeout) et 503 (Mistral down)

**Livrables** : Appel Mistral opérationnel, parsing robuste, fallback

---

### US-1.4 : Cache context_hash et logs

**En tant que** opérateur  
**Je veux** un cache par `context_hash` (TTL 5 min) et des logs techniques  
**Afin de** éviter les appels Mistral redondants et tracer les requêtes.

**Points** : 3

**Critères d'acceptation** :

- [ ] `context_hash` = SHA256 d'un JSON **canonicalisé** :
  - champs : tenant, company_id, date_start, date_end, **cards (triées par key)**
  - card utilisée pour le hash : `{key, value, unit}` (**sans formatted/label**)
- [ ] TTL 5 minutes (mémoire v1)
- [ ] Cache hit → pas d'appel Mistral, `meta.cached=true` (sauf si `force_refresh=true`)
- [ ] Logs : `request_id`, latence, statut (OK/ERROR), `cached` — **pas de payload**
- [ ] Retention logs : 7–14 jours (config docker)

**Tâches techniques** :

- [ ] Implémenter calcul `context_hash` déterministe ; bypass si `force_refresh=true`
- [ ] Cache mémoire : map + timestamp + purge simple
- [ ] Middleware logging Fiber
- [ ] "Données insuffisantes" → réponse 200 low (voir US-1.2)

**Livrables** : Cache opérationnel, logs conformes

---

**Sprint 1 — Definition of Done** :

- [ ] `units/diva/` opérationnel
- [ ] `POST /diva/explain` répond selon SPEC
- [ ] Appel Mistral + parsing JSON + fallback
- [ ] Cache `context_hash` actif
- [ ] README minimal dans `units/diva/`

---

## 4. Sprint 2 : Proxy Linky (3–4 jours)

**Objectif** : Route `/api/diva/explain` dans Linky, transformation `dashboard-metrics` → format `cards`, appel DIVA, renvoi réponse.

### US-2.1 : Route proxy /api/diva/explain

**Points** : 3

**Critères d'acceptation** :

- [ ] Route `app/api/diva/explain/route.ts`
- [ ] Accepte body : `context` + `dashboard` (format Linky) + `options` (dont `force_refresh`)
- [ ] Transforme `date_debut`/`date_fin` → `date_start`/`date_end`
- [ ] Transforme `dashboard-metrics` → `dashboard.cards` (format SPEC)
- [ ] Appelle `http://diva:8010/diva/explain` (host configurable)
- [ ] Retourne la réponse DIVA telle quelle

**Tâches techniques** :

- [ ] `DIVA_URL` (ex. `http://diva:8010`) — à ajouter au compose Linky (manifest, env)
- [ ] Mapping clés/labels selon table §6
- [ ] Mapper `{ value, formatted }` → `{ key, label, value, formatted, unit }`

**Livrables** : Proxy opérationnel, mapping documenté

---

### US-2.2 : Cas limites proxy

**Points** : 2

**Critères d'acceptation** :

- [ ] 408/503 → forward + message doux côté UI
- [ ] Timeout UX 10 s (abort) → garder ancienne synthèse, afficher loader discret
- [ ] Données partielles → laisser DIVA décider (`confidence=low`)

**Livrables** : Gestion d'erreur proxy documentée

---

**Sprint 2 — Definition of Done** :

- [ ] Route `/api/diva/explain` créée
- [ ] Mapping `dashboard-metrics` → `cards` opérationnel
- [ ] Appel DIVA validé (avec Mistral up)

---

## 5. Sprint 3 : UI Linky (3–4 jours)

**Objectif** : Bloc synthèse sous la grille, génération automatique (debounce 5 s), badge confidence, disclaimer.

### US-3.1 : Bloc synthèse DIVA sous la grille

**Points** : 3

**Critères d'acceptation** :

- [ ] Bloc positionné sous la grille
- [ ] Affichage : `headline`, `what_i_see`, `to_check`
- [ ] Badge confidence discret (low/medium/high)
- [ ] Skeleton/loading pendant génération
- [ ] Ancienne synthèse conservée si nouvel appel en cours
- [ ] Bouton « Rafraîchir l'analyse » (icône ↻, bouton secondaire, aligné à droite) — envoie `force_refresh: true`

**Livrables** : Bloc visible, contenu affiché, bouton refresh

**Référence** : `RECOMMANDATION_PRODUIT_DIVA_AUTO_REFRESH_v1.0.md`

---

### US-3.2 : Debounce, disclaimer et force_refresh

**Points** : 2

**Critères d'acceptation** :

- [ ] Debounce 5 s sur changement de filtres (auto)
- [ ] Génération automatique au chargement (après 5 s)
- [ ] Bouton refresh → appel avec `options.force_refresh: true` (bypass cache)
- [ ] Disclaimer : « Lecture assistée par DIVA. L'analyse finale relève de l'utilisateur. »

**Livrables** : Debounce actif, disclaimer visible, refresh fonctionnel

---

### US-3.3 : Smoke test end-to-end

**Points** : 1

**Critères d'acceptation** :

- [ ] Procédure : démarrer Mistral + DIVA + Linky, charger page, vérifier synthèse
- [ ] Script ou commandes documentées
- [ ] Latence cible : ≤ 10 s (objectif UX)

**Livrables** : Script `scripts/smoke_test_diva_e2e.sh` (ou équivalent) + README

---

**Sprint 3 — Definition of Done** :

- [ ] Bloc synthèse affiché
- [ ] Debounce 5 s actif
- [ ] Disclaimer présent
- [ ] Smoke test e2e exécuté et documenté

---

## 6. Table de correspondance cards (référence)

| Clé dashboard-metrics | Clé SPEC cards | Label |
|-----------------------|----------------|-------|
| treasury | treasury_validated_pct | Trésorerie validée |
| cash | cash | Cash |
| business | business | Business |
| taxes | taxes | Taxes |
| credit_notes | credit_notes | Notes de crédit |
| refunds | refunds | Remboursements |
| pos_shops | pos_shops | POS magasins |
| pos_z | pos_z | Z de caisse |

**Conversion** : `value` numérique (ou null), `formatted` pour affichage, `unit` = "EUR" ou "%" selon KPI.

---

## 7. Récapitulatif et ordre d'exécution

| Ordre | Sprint | Résumé |
|-------|--------|--------|
| 0 | Sprint 0 (optionnel) | UI + proxy + stub DIVA — happy path visible |
| 1 | Sprint 1 | Unit diva + endpoint + Mistral + cache + parsing |
| 2 | Sprint 2 | Proxy Linky + mapping cards |
| 3 | Sprint 3 | Bloc UI + debounce + disclaimer + smoke e2e |

---

## 8. Risques et limites

- **JSON strict** : llama.cpp peut dévier → fallback obligatoire (annexe v1.1).
- **RAM** : surveiller Mistral + Linky + DIVA ; éviter swap.
- **Ordre de démarrage** : Mistral → DIVA → Linky.

---

## 9. Références

| Document | Rôle |
|----------|------|
| `SPEC_DIVA_API_v1.0.md` | Spécification API (contenu v1.1) |
| `ANNEXE_PROMPT_DIVA_FLASH_v1.0.md` | Prompts & garde-fous (contenu v1.1) |
| `RAPPORT_IMPLEMENTATION_MISTRAL_2026-02-17.md` | Mistral opérationnel |
| `units/dorevia-linky/app/api/dashboard-metrics/route.ts` | Source métriques Linky |
| `INDEX.md` | Index ZeDocs/web22 |
| `RAPPORT_IMPLEMENTATION_DIVA_2026-02-17.md` | Rapport implémentation complète |
| `RECOMMANDATION_PRODUIT_DIVA_AUTO_REFRESH_v1.0.md` | Décision Auto + Refresh |

---

**Fin du plan.**

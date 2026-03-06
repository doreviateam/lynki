# Plan d'implémentation — DIVA Cockpit Only + Cards Governance

**Date :** 2026-02-18  
**Specs de référence :**
- `DIVA_Cockpit_Only.md` (v1.3)
- `DIVA_Cockpit_Cards_Governance.md` (v1.0)

**Statut :** ✅ **TOUTES LES PHASES IMPLÉMENTÉES ET DÉPLOYÉES** (2026-02-18)  
**Rapport :** `RAPPORT_IMPLEMENTATION_DIVA_COCKPIT_ONLY_2026-02-18.md`

**État initial (avant implémentation) :**
- Runner : boucle cockpit + 3 focus cards, config statique `RUNNER_TENANT_CONFIG=sarl-la-platine:0,1`
- TTL : 10 min (code), spec impose 3 min
- Pas d'endpoint `/api/cockpit/cards`
- Pas de découverte dynamique des sociétés
- Sweet Manihot (`company_id=2`) non couvert
- `context_key` = hash SHA-256 (pas le format `cockpit:<tenant>:<cid>:<d1>:<d2>`)
- Pas de gestion d'état `failed` (DB n'a que `ok` / `error`)
- Pas de `cards_spec` dans le payload

---

## Phase 0 — Nettoyage immédiat (sans risque)

**Objectif :** Gains rapides, aucune modification de schéma ni d'API.  
**Temps estimé :** 1h  
**Interruption :** Aucune

| # | Tâche | Fichier(s) | Vérification |
|---|---|---|---|
| 0.1 | Retirer la boucle focus cards du runner | `runner/runner.go` (supprimer la boucle `for _, focusCard := range [...]`) | Logs runner : uniquement cockpit, 0 focus_card |
| 0.2 | Retirer les montages `DivaFlashBlock` avec `focusCardId` dans Linky | `DashboardWithFilters.tsx` (footer des cards treasury, cash, business) | Aucun bloc DIVA affiché sur les cards individuelles |
| 0.3 | Purger les insights card en BDD | `DELETE FROM diva_insights WHERE mode = 'card';` (champ `mode` existant, valeurs `cockpit`/`card`, vérifié sur le schéma actuel — contrainte CHECK `diva_insights_mode_check`) | `SELECT count(*) FROM diva_insights WHERE mode='card'` → 0 |
| 0.4 | Rebuild + redéployer runner + Linky | docker-compose | Runner génère uniquement des cockpits |

**DoD Phase 0 :** ✅ Terminée
- [x] Runner ne génère plus d'insights card
- [x] Linky n'affiche plus de bloc DIVA sur les cards
- [x] Insights card purgés

---

## Phase 1 — TTL + context_key + company_id=2

**Objectif :** Conformité avec la spec v1.3 §2 et §4.  
**Temps estimé :** 2h  
**Dépend de :** Phase 0

### 1.1 — TTL 3 minutes

| Fichier | Modification |
|---|---|
| `store/postgres_analysis_store.go` | Changer la constante TTL de 600s à 180s |
| `docker-compose.yml` (diva) | `CACHE_TTL_SECONDS=180` |

### 1.2 — Format context_key avec scope explicite

| Fichier | Modification |
|---|---|
| `hashinput/hash.go` | Modifier `ComputeContextKey` pour produire `<context_scope>:<tenant>:<company_id>:<date_start>:<date_end>` avec `context_scope="cockpit"` (constante, conforme spec v1.3 §2) au lieu du hash SHA-256 |
| `hashinput/hash_test.go` | Adapter les tests |

⚠️ Ce changement invalide tous les insights existants. Procédure de déploiement sécurisée :

```
1. docker stop diva-runner
2. DELETE FROM diva_insights;
3. Déployer la nouvelle version (diva + diva-runner)
4. docker start diva-runner
```

Ne jamais déployer le nouveau format context_key avec le runner actif — risque de mix ancien/nouveau format en BDD.

**Post-déploiement :** Vérifier que les index sur `context_key` (btree) et la contrainte unique `idx_diva_insights_unique_ok` (`context_key, payload_hash`) restent fonctionnels avec le nouveau format texte lisible (vs ancien hash SHA-256 de longueur fixe). Pas de migration d'index nécessaire (btree sur `text` fonctionne quelle que soit la longueur), mais vérifier que la performance de lookup est acceptable.

### 1.3 — Ajouter company_id=2 (Sweet Manihot)

| Fichier | Modification |
|---|---|
| Config runner (transitoire) | `RUNNER_TENANT_CONFIG=sarl-la-platine:0,1,2` |

Cette config statique sera supprimée en Phase 2 (découverte dynamique).

### 1.4 — Runner cadence 2 minutes

| Fichier | Modification |
|---|---|
| `docker-compose.yml` (diva-runner) | `RUNNER_INTERVAL_SECONDS=120` (déjà en place, vérifier) |

**DoD Phase 1 :** ✅ Terminée
- [x] TTL = 180s
- [x] `context_key` au format `cockpit:<tenant>:<cid>:<d1>:<d2>`
- [x] Insights générés pour company_id 0, 1, 2
- [x] Runner cadence = 120s

---

## Phase 2 — Découverte dynamique (sociétés + cards)

**Objectif :** Conformité avec la spec v1.3 §3 et Governance v1.0 §2-3.  
**Temps estimé :** 4-6h  
**Dépend de :** Phase 1

### 2.1 — Endpoint Linky `GET /api/cockpit/cards`

| Fichier à créer | Contenu |
|---|---|
| `units/dorevia-linky/app/api/cockpit/cards/route.ts` | Retourne la liste des cards avec `schema`, `cards_version`, `key`, `label`, `unit`, `required` |

Source : le `CARD_MAPPING` existant dans `prewarm/route.ts`, enrichi avec `required`.

### 2.2 — Endpoint Linky `GET /api/cockpit/companies`

| Fichier à créer | Contenu |
|---|---|
| `units/dorevia-linky/app/api/cockpit/companies/route.ts` | Retourne la liste des `company_id` actifs pour un tenant |

Source : réutiliser la logique existante de `DashboardWithFilters.tsx` qui fetch les companies depuis Vault.

**Contrat de réponse :**

```json
{
  "schema": "dorevia.cockpit_companies.v1",
  "companies": [0, 1, 2]
}
```

Règles :
- `0` (vue consolidée) est inclus **uniquement si Linky supporte la vue consolidée** pour ce tenant. Le runner ne doit jamais inventer le `0` — c'est Linky qui décide.
- La liste est triée numériquement.
- Si l'endpoint échoue ou est indisponible → le runner skip le tick et log un WARN (pas de fallback sur config statique).

### 2.3 — Runner : consommer les endpoints dynamiques

| Fichier | Modification |
|---|---|
| `runner/runner.go` | À chaque tick : 1) fetch companies, 2) fetch cards, 3) générer cockpit pour chaque company |
| `runner/config.go` | Retirer `RUNNER_TENANT_CONFIG` et `RUNNER_COMPANY_IDS` de la config (garder en fallback temporaire) |
| `runner/metrics.go` | Adapter `FetchMetricsFromLinkyFull` pour n'inclure que les cards retournées par `/api/cockpit/cards` |

**Stratégie de latence et concurrence :**
- 1 appel `GET /api/cockpit/companies` par tick (partagé pour toutes les sociétés)
- 1 appel `GET /api/cockpit/cards` par tick (la liste de cards est identique pour toutes les sociétés d'un tenant)
- Si le tenant grossit (N sociétés), le tick ne doit pas dériver linéairement

**Deux niveaux de concurrence distincts :**

| Paramètre | Scope | Valeur recommandée |
|---|---|---|
| `RUNNER_FETCH_CONCURRENCY` | Fetch HTTP companies/metrics (pas d'IA) | 2-4 (goroutines parallèles) |
| `RUNNER_LLM_CONCURRENCY` | Appels Mistral (génération IA) | **1** (strictement) |

`RUNNER_LLM_CONCURRENCY = 1` est non négociable : Mistral sur cette infra ne supporte qu'un seul appel simultané (7,8 Go RAM, pas de queue interne). Plusieurs appels Mistral en parallèle → OOM ou latence dégradée.

**Note d'écart avec la spec :** La spec v1.3 §7 autorise architecturalement plusieurs jobs IA en parallèle sur des `context_key` distincts (advisory lock par clé). La contrainte `RUNNER_LLM_CONCURRENCY = 1` est une restriction d'infrastructure (Mistral mono-instance), pas une limitation de design. Si l'infra évolue (Mistral multi-instance, GPU dédié), ce paramètre pourra être relevé sans modifier la spec.

### 2.4 — Inclure `cards_spec` dans le payload et le hash

| Fichier | Modification |
|---|---|
| `runner/diva_client.go` | Ajouter `cards_spec` (version, keys triées, required triées) au body du POST /generate |
| `hashinput/build.go` | Inclure `cards_spec` dans le calcul du `payload_hash` |
| `hashinput/hash_test.go` | Tests : changement de cards_spec → hash différent |

**Point critique canonicalisation :**
- Les slices `keys` et `required` doivent être triées **avant** `json.Marshal` côté Go (runner)
- Ne jamais se fier à l'ordre renvoyé par Linky — trier explicitement dans le runner
- L'endpoint Linky `/api/cockpit/cards` retourne les cards dans un ordre quelconque — c'est le runner qui normalise

### 2.5 — Inclure `context_scope` dans le payload

| Fichier | Modification |
|---|---|
| `runner/diva_client.go` | Ajouter `"context_scope": "cockpit"` au body |
| `hashinput/build.go` | Inclure `context_scope` dans le hash |

**DoD Phase 2 :** ✅ Terminée
- [x] `/api/cockpit/cards` opérationnel
- [x] `/api/cockpit/companies` opérationnel
- [x] Runner n'a plus de config statique de companies (fallback conservé temporairement)
- [x] Runner n'a plus de liste de cards en dur
- [x] `cards_spec` dans le payload Mistral
- [x] `context_scope` dans le payload
- [x] `payload_hash` inclut cards_spec + context_scope
- [x] Ajout d'une société → couverte au tick suivant
- [x] Suppression d'une société → insights expirent en 3 min

---

## Phase 3 — Gestion d'état failed + error_code

**Objectif :** Conformité avec la spec v1.3 §6.  
**Temps estimé :** 2-3h  
**Dépend de :** Phase 1 (peut être parallélisée avec Phase 2)

### 3.0 — Invariant : mapping `status` (DB) ↔ `state` (API)

La colonne `status` en BDD reste à `ok | error` (backward compatible, contrainte CHECK existante `diva_insights_status_check`). Le contrat API utilise `state` avec trois valeurs. Le mapping est unique et exhaustif :

| DB (`status`) | API (`state`) | Condition |
|---|---|---|
| `ok` | `ready` | Ligne trouvée, `status='ok'` |
| `error` | `failed` | Ligne trouvée, `status='error'` |
| *(pas de ligne)* | `pending` | Aucune ligne pour ce `context_key` |

Aucun troisième `status` DB ne doit être ajouté sans mise à jour de cette table, de la contrainte CHECK, et du handler GET.

### 3.1 — Stocker l'error_code en BDD

| Action | Détail |
|---|---|
| Migration SQL | `ALTER TABLE diva_insights ADD COLUMN error_code text;` |
| Contrainte | `CHECK (error_code IS NULL OR error_code IN ('MISTRAL_TIMEOUT', 'MISTRAL_UNAVAILABLE', 'MISTRAL_OOM', 'MISTRAL_BAD_RESPONSE', 'INVALID_PAYLOAD'))` |

### 3.2 — Generate handler : écrire en BDD sur erreur Mistral

| Fichier | Modification |
|---|---|
| `handlers/generate.go` | En cas d'erreur Mistral : insérer une ligne `status='error'` avec `error_code` ET retourner un body exploitable au runner |

**Comportement HTTP du POST /generate en cas d'erreur Mistral :**

| Cas | Status HTTP | Body | Effet BDD |
|---|---|---|---|
| Succès | `200 OK` | `{"state": "ready"}` | Ligne `status='ok'` insérée |
| Déjà frais | `204 No Content` | vide | Rien |
| Erreur Mistral | `200 OK` | `{"state": "failed", "error_code": "MISTRAL_TIMEOUT"}` | Ligne `status='error'` insérée |
| Erreur interne | `500` | `{"error": {...}}` | Rien |

Le POST retourne `200` même en `failed` pour que le runner puisse logger proprement le `state` et le `error_code` sans interpréter un 503 comme un crash réseau. Le runner distingue `ready` vs `failed` via le body, pas via le status HTTP.

### 3.3 — GET handler : traduire status → state + error_code

| Fichier | Modification |
|---|---|
| `handlers/insights.go` | Si `status='error'` → retourner `{"state": "failed", "error_code": "..."}` |

### 3.4 — Runner : retry sur failed

| Fichier | Modification |
|---|---|
| `handlers/generate.go` | Lors du check `CheckInsightFresh` : un insight `status='error'` ne doit jamais être considéré frais → toujours régénérer |

### 3.5 — Linky : message fixe sur failed

| Fichier | Modification |
|---|---|
| `components/DivaFlashBlock.tsx` | Si `state === "failed"` → afficher "Analyse temporairement indisponible (mise à jour automatique en cours)." |

**DoD Phase 3 :** ✅ Terminée (implémentée le 2026-02-18)
- [x] Colonne `error_code` en BDD (migration 027)
- [x] Erreur Mistral → ligne `status='error'` + `error_code`
- [x] GET retourne `state: "failed"` avec `error_code`
- [x] Runner retente les `failed` au cycle suivant (vérifié en prod : 22:27 error → 22:29 ok)
- [x] Linky affiche le message exact sur `failed`

---

## Phase 4 — Validation & mesure

**Objectif :** Valider la conformité complète avec les deux specs.  
**Temps estimé :** 2h  
**Dépend de :** Phases 0-3 terminées

### 4.1 — Tests automatisés

| Test | Vérification |
|---|---|
| Runner cockpit only | Logs : 0 focus_card, uniquement cockpit |
| Multi-société | Insights distincts pour company_id 0, 1, 2 |
| context_key format | Vérifier format `cockpit:<tenant>:<cid>:<d1>:<d2>` en BDD |
| TTL | Insight expiré après 3 min, régénéré au tick suivant |
| Découverte dynamique | Ajouter une société fictive, vérifier couverture au tick suivant |
| Cards dynamiques | Retirer une card de `/api/cockpit/cards`, vérifier régénération |
| payload_hash stable | Deux appels avec mêmes données → même hash |
| payload_hash change | Modification cards_spec → hash différent → régénération |
| État failed | Simuler Mistral down → `status='error'` + `error_code` en BDD |
| Retry failed | Relancer Mistral → insight régénéré au tick suivant |
| Message UI failed | `state: "failed"` → message exact affiché |
| Pas de 404 | GET sans insight → `state: "pending"`, jamais 404 |
| Crash runner pendant pending | Tuer le runner pendant une génération → vérifier : lock advisory libéré, cycle suivant régénère l'insight |

### 4.2 — Mesure de charge

| Métrique | Avant | Après attendu |
|---|---|---|
| Appels Mistral / cycle | 16 | 6 (3 companies × 2 périodes) |
| Temps de cycle | ~10 min | ~3-4 min |
| RAM Mistral | 7,8 Go (constant) | 7,8 Go (inchangé, sauf si mode veille) |
| Insights en BDD | 16 | 6 |

**DoD Phase 4 :** ⏳ Partiel (tests automatisés à formaliser)
- [x] Tous les cas vérifiés manuellement en production
- [x] Charge serveur mesurée (voir rapport : ~24s/insight, 6 contextes/tick)
- [x] Aucune régression UI
- [ ] Tests automatisés formalisés (à planifier)

---

## Synthèse

| Phase | Contenu | Effort | Prérequis | Risque |
|---|---|---|---|---|
| **0** | Supprimer cards IA (runner + Linky) | 1h | — | ✅ Déployée |
| **1** | TTL 3 min + context_key + company_id=2 | 2h | Phase 0 | ✅ Déployée |
| **2** | Découverte dynamique sociétés + cards | 4-6h | Phase 1 | ✅ Déployée |
| **3** | État failed + error_code + retry | 2-3h | Phase 1 | ✅ Déployée |
| **4** | Tests + mesure de charge | 2h | Phases 0-3 | ⏳ Partiel |

**Effort total estimé : 11-14h**  
**Phases 2 et 3 sont parallélisables** → durée critique : ~9-11h

---

## Ordre de déploiement recommandé

```
Phase 0 ──→ Phase 1 ──┬──→ Phase 2 ──┬──→ Phase 4
                       └──→ Phase 3 ──┘
```

~~Phase 0 peut être déployée **aujourd'hui** pour le gain immédiat (÷4 appels Mistral).~~  
~~Phases 1-3 constituent le sprint suivant.~~  
~~Phase 4 clôture le sprint.~~

**Mise à jour 2026-02-18 :** Phases 0-3 entièrement implémentées et déployées.  
Phase 4 (tests automatisés) à planifier dans un sprint ultérieur.

# SPEC — DIVA v1.4 "Compute Discipline"

**Date :** 2026-02-20
**Amendé :** 2026-02-20 (revue anti-régression vs v1.3.1 + POS Sessions)
**Objectif :** Réduire les appels Mistral + stabiliser RAM, sans perte
fonctionnelle (MVP CFO).
**Principe :** Pas de génération si pas de changement significatif + LLM
= rédaction courte + fallback déterministe enrichi.

------------------------------------------------------------------------

## 0. Définitions

- **scope** : (tenant, company_id, period_key)
- **context_hash_v2** : hash déterministe du "sens" (pas du bruit).
- **significant change** : changement du hash v2.
- **degraded mode** : rendu sans LLM, 100 % déterministe, basé sur
  `computeInsights`.

------------------------------------------------------------------------

# 1) Story A — Context Hash v2

## But

Empêcher les régénérations inutiles quand les données ne changent pas au
sens CFO.

## État actuel (v1.3.1)

`hashinput.BuildHashInput` inclut déjà les 8 cartes cockpit avec
arrondi stable (`toMinor`, `toBasisPoints`) et canonicalisation JSON
triée. **Mais** il n'inclut **pas** les agrégats POS de `_details`.
Le `payloadHash` actuel est donc aveugle aux changements POS.

## Règles v1.4

Inclure dans `context_hash_v2` :

1. **KPI cartes** (déjà présents) : cash, treasury_validated_pct,
   business, refunds, taxes, credit_notes, pos_shops, pos_z
2. **POS agrégats** (à ajouter dans `BuildHashInput`) :
   - total_sessions, sealed_sessions, pending_sessions, total_tickets
   - cash_total (arrondi minor), card_total (arrondi minor)
   - total_difference (arrondi minor), anomaly_sessions
   - shops[].(shop_id, sessions_count, total_sales) **trié par shop_id**

**Exclusions** :
- ~~spread~~ → dérivé de cash/business/pos, redondant
- ~~data_quality_flags~~ → concept non défini dans le code actuel,
  à introduire séparément si nécessaire
- Timestamps, IDs de session, IDs de requête

Normalisation :
- Arrondis : `toMinor` (2 décimales EUR) pour montants POS
- Tri : shops trié par `shop_id` (alphabétique)
- `CanonicalJSONForHash` existant (clés triées, nulls conservés)

## Risque de régression

**ATTENTION** : changer le hash invalide TOUTES les entrées
`diva_insights` en cache. Le runner régénérera tous les contextes au
prochain tick (~6 appels Mistral, ~4 min GPU).

**Mitigation** : acceptable en one-shot (le runner gère déjà ce cas).
Pas de migration nécessaire. Prévoir un log `event=hash_version_upgrade`
au premier tick post-déploiement.

## DoD

- Hash identique si données équivalentes (cards + POS agrégats)
- Variation uniquement si changement significatif
- Tests : StableOrdering, POSIncluded, NoTimestamps,
  HashStableWithSameData

------------------------------------------------------------------------

# 2) Story B — No-change → No-gen

## ⚠️ DÉJÀ IMPLÉMENTÉ (v1.3.1)

Le mécanisme existe dans `generate.go` :

```go
fresh, err := tx.CheckInsightFresh(contextKey, payloadHash)
if fresh {
    return errAlreadyFresh // → HTTP 204 No Content
}
```

Le runner log `state=fresh` quand le hash est identique (confirmé en
prod : `diva_runner_context ... state=fresh`).

## Ce qui reste à faire (optionnel)

Ajouter des logs structurés :
- `event=diva_gen_skipped reason=hash_equal hash=<hex[:12]>`
- `event=diva_gen_called hash=<hex[:12]> hash_changed=true`

**Aucune modification de logique nécessaire. NE PAS ré-implémenter
ce qui fonctionne** — risque d'introduire un bug dans un chemin
critique.

------------------------------------------------------------------------

# 3) Story C — LLM Rédaction courte

## But

Réduire la taille du prompt et de la sortie pour économiser RAM/GPU.

## État actuel (v1.3.1)

- `to_check ≤ 2` : déjà appliqué (`validateAndBuildFlash` ligne 607)
- `what_i_see ≤ cards+2` : déjà appliqué (ligne 604)
- `dynamicMinLength` : validation existante
- `forbiddenTerms` + `englishDetect` : validations existantes
- Pas de limite headline ni flash totale

## Règles v1.4 (amendées)

| Contrainte | Spec originale | **Amendé** | Justification |
|---|---|---|---|
| headline max | 120 chars | **140 chars** | Un headline La Platine avec POS fait ~130 chars. 120 tronque. |
| flash total max | 450 chars | **600 chars** | Sweet Manihot avec insights POS atteint ~500 chars. 450 perdrait les POS. |
| insights max au prompt | 8 | **10** | `computeInsights` produit jusqu'à 12 pour La Platine+POS. 8 coupe panier moyen, mix paiements, répartition — régression v1.3. |
| to_check max | 2 | 2 (déjà en place) | OK |
| what_i_see max | non précisé | Conserver `cards+2` actuel | OK |

### Implémentation

- `sanitizeHeadline` : tronquer à 140 chars avec `"..."` si dépassement
  (soft, ne rejette pas)
- `maxFlashTextLength` : 600 chars. Si dépassé, tronquer `what_i_see`
  par la fin (retirer le dernier élément jusqu'à conformité)
- Insights au prompt : prendre les 10 premiers (le tri est déjà par
  priorité : POINT DOMINANT en premier)

### ⚠️ NE PAS faire

- **NE PAS retirer les cartes du prompt**. La spec originale dit "prompt
  réduit : headline_candidate + insights[]". Retirer les cartes
  empêcherait Mistral de cross-référencer les données et provoquerait
  des hallucinations (régression Rule 4 du systemPrompt).
- **NE PAS tronquer brutalement le headline** — toujours couper sur un
  espace.

------------------------------------------------------------------------

# 4) Story D — Degraded Mode (fallback enrichi)

## But

Produit toujours utilisable même si LLM indisponible (timeout, OOM,
texte rejeté).

## État actuel (v1.3.1)

`fallbackFlash()` retourne :
```json
{
  "headline": "Lecture DIVA temporairement indisponible.",
  "what_i_see": [],
  "to_check": [],
  "confidence": "low"
}
```
C'est un fallback vide — l'utilisateur ne voit rien d'utile.

## Règles v1.4

Nouveau `degradedFlash(cards, details)` :

1. **headline** : si `computeInsights` contient un "POINT DOMINANT",
   l'utiliser (tronqué à 140 chars). Sinon, utiliser le premier insight.
2. **what_i_see** : les 3 premiers insights de `computeInsights`
   (déjà déterministes, pas de LLM).
3. **to_check** : extraire des insights contenant "ALERTE", "conformité"
   ou "absence". Max 2.
4. **confidence** : `computeConfidence(cards)` — déjà indépendant du
   LLM.
5. **Marqueur** : ajouter `"degraded": true` dans le flash JSON pour
   que l'UI puisse afficher un indicateur discret.

### Points d'appel

Remplacer `fallbackFlash()` par `degradedFlash(cards, details)` dans :
- `validateAndBuildFlash` (quand texte trop court, forbidden, english)
- `parseFlash` (quand JSON invalide)
- `Chat` (quand Mistral timeout/unavailable) — **uniquement en cockpit
  mode**, pas en card mode

### ⚠️ Risque

Si le degraded mode est "assez bon", il n'y a plus d'incitation à
corriger les problèmes Mistral. → Logger un warning à chaque
utilisation : `event=diva_degraded_fallback reason=<cause>`.

------------------------------------------------------------------------

# 5) Story E — POS Discipline (prompt)

## But

Réduire la taille du payload POS envoyé dans le prompt LLM.

## État actuel (v1.3.1)

- Linky retourne `_details.pos_shops` avec agrégats + shops + sessions
- `computeInsights` n'utilise que les agrégats et shops (pas les
  sessions individuelles)
- Mais le payload JSON complet (incluant sessions) est sérialisé dans
  le prompt via `buildUserPrompt`

## Règles v1.4

Filtrage **uniquement au niveau du prompt** (pas dans Linky ni dans
le hash) :

1. **Agrégats POS** : toujours inclus dans le prompt (total_sessions,
   sealed_sessions, tickets, cash/card totals, anomalies)
2. **Shops** : toujours inclus (shop_id, sessions_count, total_sales)
3. **Sessions individuelles** : exclues du prompt par défaut.
   Inclure un `sessions_sample` (max 3) **uniquement si** :
   - `anomaly_sessions > 0` → les sessions avec écart
   - `pending_sessions > 0` → les sessions non scellées
   - Critère de sélection : anomalies d'abord, puis pending,
     puis par total_sales décroissant

### ⚠️ NE PAS faire

- **NE PAS modifier la réponse de Linky** (`dashboard-metrics`). Le
  hash v2 (Story A) a besoin des données complètes.
- **NE PAS modifier `extractPosDetails`** — il ne parse déjà que les
  agrégats.

### Implémentation

Dans `buildUserPrompt`, filtrer `dashboardDetails["pos_shops"]` avant
de l'inclure dans `payload.Details` : retirer le champ `sessions`
sauf le sample.

------------------------------------------------------------------------

# 6) Observabilité

## Logs structurés (slog)

À chaque appel `/diva/generate` ou `/diva/explain`, logger :

```
event=diva_gen scope=<contextKey> hash=<hex[:12]>
gen=called|skipped|degraded llm_latency_ms=<n>
prompt_chars=<n> output_chars=<n>
```

En cas d'erreur :
```
event=diva_gen_error scope=<contextKey> error=oom_or_timeout|bad_response
```

## KPI

- `diva_hash_hit_ratio` = skipped / (skipped + called)
- `diva_degraded_ratio` = degraded / (degraded + called)

Implémentation : compteurs atomiques dans le runner, exposés via
`/health` ou endpoint dédié. Pas besoin de Prometheus pour le MVP.

------------------------------------------------------------------------

# Plan d'exécution (amendé)

| Ordre | Story | Effort | Risque régression |
|-------|-------|--------|-------------------|
| 1 | **A** — Hash v2 (ajouter POS agrégats) | Moyen | Moyen (mass re-gen one-shot) |
| 2 | **B** — No-change → No-gen | **SKIP** (déjà implémenté) | — |
| 3 | **C** — Rédaction courte (limites amendées) | Faible | Faible (si limites respectées) |
| 4 | **D** — Degraded mode enrichi | Moyen | Faible (additif) |
| 5 | **E** — POS prompt discipline | Faible | Faible (filtrage prompt only) |
| 6 | **Observabilité** — Logs + KPI | Faible | Nul (additif) |

**Pré-requis** : tous les tests v1.3.1 (18/18) doivent passer après
chaque story. Ajouter des tests spécifiques par story.

------------------------------------------------------------------------

# Annexe : Risques de régression détaillés

| Risque | Story | Impact | Mitigation |
|--------|-------|--------|------------|
| Mass re-gen au premier tick | A | 6 appels Mistral (~4 min GPU) | Acceptable, log warning |
| Dupliquer No-change logic | B | Bug dans chemin critique | **SKIP** — ne pas toucher |
| headline tronqué perd le sens | C | UX dégradée | Limite 140 chars, coupe sur espace |
| flash trop court coupe POS | C | Régression v1.3 POS | Limite 600 chars, pas 450 |
| insights coupés à 8 perd POS | C | Panier moyen / mix paiements perdus | Limite 10, pas 8 |
| Retirer cards du prompt | C | Hallucinations Mistral | **INTERDIT** — conserver cards |
| degraded trop bon → masque bugs | D | Erreurs Mistral ignorées | Log warning systématique |
| Modifier réponse Linky | E | Casse hash v2 | Filtrer au prompt uniquement |

------------------------------------------------------------------------

*Spec originale : 2026-02-20 — Amendée : 2026-02-20 (revue anti-régression).*

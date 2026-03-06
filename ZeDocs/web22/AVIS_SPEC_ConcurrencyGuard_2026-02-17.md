# Avis et analyse — SPEC_ConcurrencyGuard

**Document évalué** : `SPEC_ConcurrencyGuard.md` v1.0  
**Date** : 2026-02-17  
**Références** : `RAPPORT_LOAD_TEST_DIVA_MISTRAL_2026-02-17.md`, `units/diva/` (explain.go, cache.go)

---

## 1. Avis général

La spec est **pertinente, bien cadrée et immédiatement implémentable**. Elle traduit correctement les observations du load test (CPU 180 %, 5 refresh parallèles) en solution technique minimaliste.

| Critère | Appréciation |
|---------|--------------|
| **Alignement problème/solution** | ✅ Correct — guard par `context_hash` cible bien la saturation Mistral |
| **Stratégie Reject (v1)** | ✅ Bon choix — évite les timeouts en cascade, UX simple |
| **Non-régression** | ✅ Cache et requêtes sans `force_refresh` inchangés |
| **Contrat API** | ✅ Extensible — `meta.refresh_in_progress` non-breaking |
| **Implémentation Go** | ✅ Réaliste — structure `RefreshGuard` claire |

---

## 2. Points forts

1. **Scope bien limité** : uniquement `force_refresh`, pas de guard sur cache-miss (backlog v1.1+).

2. **200 soft** : éviter 409/429 en v1 est pertinent pour l’UI (pas de gestion d’erreur spécifique).

3. **Purge stale** : `maxAge = 2 * MISTRAL_TIMEOUT` (ex. 60 s) protège contre les locks orphelins (crash, timeout).

4. **Tests d’acceptation** : unitaire (guard), intégration (5 requêtes → 1 inférence), E2E (UI), tous vérifiables.

5. **Exemple JSON** : le corps de réponse `refresh_in_progress=true` avec headline « Analyse déjà en cours » est explicite.

---

## 3. Recommandations / précisions

### 3.1 Réponse quand refresh_in_progress

**Question** : Que retourner exactement quand on rejette (soft) ?

La spec fournit un exemple avec `flash.headline` « Analyse déjà en cours » et `what_i_see` / `to_check`.  
**Recommandation** : garder ce contrat — ne pas renvoyer le cache existant, mais une synthèse minimale dédiée à ce cas. L’UI « conserve l’ancienne synthèse » en ne remplaçant pas son état par cette réponse.

### 3.2 Cohérence du hash

Le handler utilise `computeContextHash` (hash brut, sans préfixe). Le guard doit utiliser **le même hash** que le cache (clé interne). La spec parle de `context_hash` : confirmer que c’est bien le hash brut (SHA-256 hex) utilisé comme clé, et que `meta.context_hash` reste `"sha256:" + hash`.

### 3.3 Injection du guard

Comme le cache, le `RefreshGuard` doit être injecté dans le handler (constructeur ou options). Éviter une variable globale pour faciliter les tests et la réutilisation.

### 3.4 Ordre des opérations

Ordre proposé pour le handler :

1. `contextHash := computeContextHash(...)`
2. Si `!force_refresh` → cache lookup → return si hit
3. Si `force_refresh` → `guard.TryAcquire(contextHash)` ; si false → return 200 soft
4. `defer guard.Release(contextHash)`
5. Appel Mistral, puis `cache.Set`, puis return

Important : ne pas libérer le lock avant d’avoir fait `cache.Set`, pour éviter qu’un autre refresh reparte aussitôt.

### 3.5 Durée de la purge

`maxAge = 2 * MISTRAL_TIMEOUT` : si le timeout Mistral est 30 s, 60 s est cohérent. Vérifier la valeur réelle dans `internal/mistral` et l’aligner.

---

## 4. Points à documenter (optionnel)

| Point | Reco |
|-------|------|
| **Cache-miss burst** | Hors scope v1. Un burst de requêtes (même contexte, sans refresh) au premier chargement peut déclencher plusieurs inférences si le cache est vide. À traiter en v1.1 si besoin. |
| **Multi-instance DIVA** | Si plusieurs instances (load balancer), le guard en mémoire ne suffit pas. Redis distribué (backlog §11) sera nécessaire. |
| **Logs** | La spec mentionne `request_id`, `context_hash`, `refresh_in_progress`, etc. Définir un niveau (info/debug) et éventuellement un format structuré (JSON) pour l’observabilité. |

---

## 5. Synthèse

| Verdict | Détail |
|---------|--------|
| **Faisabilité** | ✅ Sans blocage identifié |
| **Effort estimé** | ~1–2 SP (guard + handler + tests unitaire + intégration) |
| **Risques** | Faibles — changements localisés, comportement déterministe |

**Recommandation** : valider la spec telle quelle et lancer l’implémentation.

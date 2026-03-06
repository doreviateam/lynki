# Réponses et recommandations — Concurrency Guard DIVA

**Date** : 2026-02-17  
**Contexte** : Analyse suite à `SPEC_ConcurrencyGuard.md` v1.0 et avis technique  
**Références** : `SPEC_ConcurrencyGuard.md`, `AVIS_SPEC_ConcurrencyGuard_2026-02-17.md`

---

## 1. Décisions validées

### 1.1 Réponse lorsque refresh_in_progress = true

**Décision** : Conserver une réponse « soft » dédiée, sans renvoyer le cache existant.

**Raison** :
- Le backend ne doit pas décider du rendu UI
- Renvoyer le cache pourrait créer une ambiguïté (illusion de refresh réussi)
- Une réponse explicite permet à l’UI de conserver l’ancienne synthèse proprement

**Contrat retenu** :
- HTTP 200
- `meta.refresh_in_progress = true`
- `flash` minimal : `headline` « Analyse déjà en cours. », `confidence` « low »

**Côté UI** :
- Ne pas remplacer la synthèse affichée
- Afficher un message doux ou un toast discret

---

## 2. Cohérence du context_hash

**Décision** :
- Clé interne (cache + guard) = hash brut (hex SHA-256)
- `meta.context_hash` = `"sha256:"` + hash_brut

Ainsi : `guard.TryAcquire(hash_brut)`, `cache.Get(hash_brut)`. Cohérence garantie entre cache, guard et métadonnées.

---

## 3. Injection du RefreshGuard

**Décision** : Pas de variable globale. Le guard est injecté comme le cache et le client Mistral.

**Pattern recommandé** :
```go
ServerOptions { Cache, RefreshGuard, MistralClient }
```

Handlers instanciés avec dépendances explicites.

**Bénéfices** : tests unitaires simples, pas d’état global caché, architecture alignée avec Vault.

---

## 4. Ordre des opérations dans explain handler

**Ordre strict** :
1. `contextHash := computeContextHash(...)`
2. Si `!force_refresh` → lookup cache → return si hit
3. Si `force_refresh` : `if !guard.TryAcquire(contextHash)` → return soft
4. `defer guard.Release(contextHash)`
5. Appel Mistral
6. `cache.Set(contextHash, result)`
7. return result

**Point critique** : Le lock couvre l’appel Mistral **et** le `cache.Set` pour éviter qu’un second refresh démarre juste après le Set.

---

## 5. Purge des locks orphelins

**Décision** : `maxAge = 2 * MISTRAL_TIMEOUT` (ex. 60 s si timeout = 30 s).

La valeur ne doit pas être hardcodée : alignée sur la configuration réelle du timeout. Ticker de purge toutes les 30 s.

---

## 6. Cache-miss burst (note d’exploitation)

**Hors scope v1** : Un burst sur un contexte jamais vu peut déclencher plusieurs inférences si cache vide et sans `force_refresh`.

**Recommandation** : Laisser le debounce UI limiter les appels ; envisager une protection supplémentaire en v1.1 si besoin.

---

## 7. Multi-instance (anticipation)

Si DIVA devient multi-instance derrière un load balancer :
- Le guard mémoire ne suffit plus
- Nécessité d’un lock distribué (Redis) ou équivalent

Non prioritaire. À prévoir en backlog architecture.

---

## 8. Observabilité

**Logs recommandés** (structurés JSON idéalement) :
- `request_id`, `context_hash`, `force_refresh`, `refresh_in_progress`
- `latency_ms`, `mistral_latency_ms` (si disponible)

**Niveaux** : INFO pour événements principaux, DEBUG pour détails techniques.

---

## 9. Synthèse finale

Le Concurrency Guard par `context_hash` est :
- Cohérent avec le load test observé
- Localisé dans le code (faible risque de régression)
- Compatible avec le cache existant
- Suffisant pour stabiliser Mistral en production mono-instance

| Critère | Évaluation |
|---------|------------|
| Effort estimé | Faible |
| Risque | Maîtrisé |
| Valeur | Élevée (protection CPU + UX stable) |

---

*Fin du document.*

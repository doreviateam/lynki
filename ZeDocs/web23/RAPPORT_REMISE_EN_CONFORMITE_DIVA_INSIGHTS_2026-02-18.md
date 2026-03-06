# RAPPORT — Remise en conformité DIVA Insights

**Date :** 2026-02-18  
**Périmètre :** DIVA + Linky (pipeline insights cockpit/focus card)  
**Références :** `SPEC_DIVA_Insights_v1.0.md`, `SPEC_REGLES_INFERENCE_DIVA_v1.0.md`

## 1. Résumé exécutif

Le système DIVA présentait une dérive par rapport à la spécification sur le flux warmup/lecture, avec un comportement UI instable et un cas bloquant en cockpit (`refresh` à 200 suivi d'un `GET insight` à 404).

Les écarts ont été corrigés, les services redéployés, et les validations techniques/fonctionnelles confirment un retour au fonctionnement attendu.

**Statut final :** ✅ Pipeline opérationnel (cockpit + focus card), conforme sur les points critiques.

---

## 2. Problèmes identifiés

1. **Warmup non conforme à la spec**
   - Warmup long et boucle de re-fetch sur 404, contraire au mode fire-and-forget court.

2. **Écart `generated_from_runner`**
   - Le runner envoyait `generated_from_runner=true`, mais DIVA persistait `false`.

3. **Incohérence configuration lock timeout**
   - Différence entre variable documentée et variable lue par le code.

4. **Bug critique découvert pendant les tests**
   - Cockpit: `POST /api/diva/refresh` retournait 200, puis `GET /api/diva/insight` restait 404.
   - Cause: collision d'unicité `(context_key, payload_hash)` sans remise à jour d'un insight expiré.

---

## 3. Corrections appliquées

### 3.1 Warmup Linky remis conforme

- Fichier : `units/dorevia-linky/app/api/diva/prewarm/route.ts`
- Changement : timeout prewarm par défaut remis à `700 ms` (fire-and-forget court).

### 3.2 Suppression de la boucle automatique sur 404

- Fichier : `units/dorevia-linky/components/DivaFlashBlock.tsx`
- Changement : suppression du poll périodique post-404 (`setInterval`), maintien du fallback "Analyse en cours." et warmup unique par contexte.

### 3.3 Propagation correcte du flag runner

- Fichier : `units/diva/internal/handlers/generate.go`
- Changement : utilisation de `req.Options.GeneratedFromRunner` à la persistence.

### 3.4 Alignement lock timeout doc/code

- Fichier : `units/diva/internal/store/postgres_analysis_store.go`
- Changement : priorité à `INSIGHTS_LOCK_TIMEOUT`, fallback legacy `INSIGHTS_LOCK_TIMEOUT_SECONDS`.

- Fichier : `units/diva/README.md`
- Changement : documentation alignée avec compatibilité legacy explicitée.

### 3.5 Correctif collision unique (bug bloquant cockpit)

- Fichier : `units/diva/internal/store/postgres_analysis_store.go`
- Changement : en cas de `23505` sur `(context_key, payload_hash)`, mise à jour de la ligne existante (message, flash, confidence, model, latency, `expires_at`, `created_at`, `generated_from_runner`) au lieu d'un succès sans insight frais lisible.

---

## 4. Validation réalisée

### 4.1 Technique

- Rebuild/recreate des services Linky et DIVA.
- Vérification des images actives en runtime (conteneurs recréés, pas simple restart).
- Tests Go DIVA : `go test ./...` ✅
- Smoke test scripté : `scripts/test_diva_insights_s2.sh` ✅

### 4.2 Fonctionnelle

- `POST /api/diva/prewarm` : `204` rapide (fire-and-forget) ✅
- `GET /api/diva/insight` sans donnée : `404` attendu ✅
- Cockpit : `POST /api/diva/refresh` puis `GET /api/diva/insight` : `200` ✅
- Focus card `cash` : `POST /api/diva/refresh` puis `GET /api/diva/insight?mode=card` : `200` ✅
- Vérification DB : `generated_from_runner=true` persisté correctement ✅

---

## 5. Tableau de conformité (synthèse)

| Exigence spec | Statut |
|---|---|
| Warmup opportuniste court (500–1000 ms) | ✅ Conforme |
| Pas de boucle de re-fetch auto sur 404 | ✅ Conforme |
| Fallback non bloquant en absence d'insight | ✅ Conforme |
| Refresh manuel utilisable cockpit/card | ✅ Conforme |
| Persistence/lecture par `context_key` | ✅ Conforme |
| Flag `generated_from_runner` fidèle | ✅ Conforme |
| Lock timeout configurable et cohérent | ✅ Conforme |

---

## 6. Risques résiduels et recommandations

1. **Qualité métier des formulations IA**
   - Maintenir des tests manuels ciblés par carte (notamment cas négatifs et absence de données).

2. **Observabilité opérationnelle**
   - Renforcer les logs structurés de génération (`context_key`, mode, status, cause échec) pour accélérer les diagnostics.

3. **Runbook d'incident**
   - Ajouter un runbook court "Insight 404 prolongé" (checks API + DB + env).

---

## 7. Conclusion

La remise en conformité a été appliquée avec succès. Le pipeline DIVA Insights est de nouveau stable et cohérent avec la spécification sur les points critiques de génération, stockage, lecture et UX.


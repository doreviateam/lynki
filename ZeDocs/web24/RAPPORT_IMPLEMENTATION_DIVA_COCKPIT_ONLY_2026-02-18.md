# RAPPORT D'IMPLÉMENTATION — DIVA Cockpit Only + Cards Governance

**Date :** 2026-02-18  
**Specs de référence :**
- `DIVA_Cockpit_Only.md` (v1.3)
- `DIVA_Cockpit_Cards_Governance.md` (v1.0)

**Plan suivi :** `PLAN_IMPLEMENTATION_DIVA_COCKPIT_ONLY_2026-02-18.md`  
**Statut final :** ✅ Phases 0–3 implémentées et déployées en production

---

## 1. Résumé exécutif

L'ensemble du plan d'implémentation DIVA Cockpit Only a été exécuté. Le système DIVA est désormais conforme à la spec v1.3 :

- **Cockpit only** — Plus aucune génération IA sur les cards individuelles
- **TTL 3 min** — Cycle de rafraîchissement maîtrisé
- **Multi-société** — Insights distincts pour `company_id` 0, 1, 2
- **`context_key` lisible** — Format `cockpit:<tenant>:<cid>:<d1>:<d2>`
- **Découverte dynamique** — Sociétés et cards découvertes via Linky API
- **`cards_spec` + `context_scope`** — Inclus dans le payload et le hash
- **État `failed`** — Erreurs Mistral persistées en BDD, retry automatique, message UI fixe

---

## 2. État par phase

### Phase 0 — Nettoyage immédiat ✅

| Tâche | Résultat |
|---|---|
| 0.1 Retirer focus cards du runner | Runner ne contient que le mode cockpit |
| 0.2 Retirer `DivaFlashBlock` des footers de cards | `DashboardWithFilters.tsx` : aucun `focusCardId` passé |
| 0.3 Purger insights card en BDD | 0 lignes `mode='card'` en base |
| 0.4 Rebuild + déploiement | Effectué |

### Phase 1 — TTL + context_key + company_id=2 ✅

| Tâche | Résultat |
|---|---|
| 1.1 TTL 3 minutes | `InsertInsight` : `ttlMin := 3` (défaut), configurable via `INSIGHTS_TTL_MINUTES` |
| 1.2 Format `context_key` | `ComputeContextKey` → `cockpit:<tenant>:<cid>:<d1>:<d2>` |
| 1.3 company_id=2 couvert | `RUNNER_TENANT_CONFIG=sarl-la-platine:0,1,2` + découverte dynamique |
| 1.4 Runner cadence 120s | `RUNNER_INTERVAL_SECONDS=120` |

### Phase 2 — Découverte dynamique ✅

| Tâche | Résultat |
|---|---|
| 2.1 `GET /api/cockpit/cards` | Endpoint opérationnel, retourne 8 cards avec `schema`, `cards_version`, `key`, `label`, `unit`, `required` |
| 2.2 `GET /api/cockpit/companies` | Endpoint opérationnel, retourne `[0, 1, 2]` |
| 2.3 Runner consomme endpoints | `FetchCockpitCompanies` + `FetchCockpitCards` à chaque tick, fallback static |
| 2.4 `cards_spec` dans payload + hash | `diva_client.go` : `body["cards_spec"] = cardsSpec` ; `build.go` : `out["cards_spec"]` dans hash input |
| 2.5 `context_scope` dans payload + hash | `diva_client.go` : `"context_scope": "cockpit"` ; `build.go` : `"context_scope": "cockpit"` dans hash input |

### Phase 3 — Gestion d'état `failed` + `error_code` ✅

**Implémentée et déployée dans cette session.** Détail en §3.

---

## 3. Détail Phase 3 — Changements apportés

### 3.1 Migration SQL

**Fichier :** `sources/vault/migrations/027_add_error_code_diva_insights.sql`

```sql
ALTER TABLE diva_insights ADD COLUMN IF NOT EXISTS error_code TEXT;
ALTER TABLE diva_insights ADD CONSTRAINT diva_insights_error_code_check
    CHECK (error_code IS NULL OR error_code IN (
        'MISTRAL_TIMEOUT', 'MISTRAL_UNAVAILABLE', 'MISTRAL_OOM',
        'MISTRAL_BAD_RESPONSE', 'INVALID_PAYLOAD'
    ));
```

La colonne existait déjà (ajoutée précédemment). La contrainte CHECK a été créée. La contrainte `status IN ('ok', 'error')` existait déjà dans le schéma initial (migration 026).

### 3.2 Store — `InsertInsightParams` et `Insight`

**Fichier :** `units/diva/internal/store/insights.go`

Ajout de deux champs aux structures :

- `InsertInsightParams` : `Status string` et `ErrorCode string`
- `Insight` : `Status string` et `ErrorCode string`

### 3.3 Store — `GetInsight` (lecture)

**Fichier :** `units/diva/internal/store/postgres_analysis_store.go`

Requête modifiée pour retourner aussi les insights en erreur, avec priorité :

```sql
SELECT status, message_text, flash_json, COALESCE(confidence, ''),
       created_at, expires_at, COALESCE(error_code, '')
FROM diva_insights
WHERE context_key = $1
  AND (
    (status = 'ok' AND expires_at > now())
    OR status = 'error'
  )
ORDER BY
  CASE WHEN status = 'ok' THEN 0 ELSE 1 END,
  created_at DESC
LIMIT 1
```

Logique de priorité :
1. Un `status='ok'` non expiré est toujours retourné en priorité
2. Si aucun ok valide, le `status='error'` le plus récent est retourné
3. Si rien → `ErrNotFound` → handler traduit en `state:"pending"`

### 3.4 Store — `InsertInsight` (écriture)

**Fichier :** `units/diva/internal/store/postgres_analysis_store.go`

Deux chemins selon `Status` :

- **`status = "ok"`** : comportement inchangé (INSERT avec ON CONFLICT upsert)
- **`status = "error"`** : supprime les anciens `error` pour le même `context_key` (évite accumulation), puis INSERT avec `error_code`

### 3.5 Handler `POST /diva/generate`

**Fichier :** `units/diva/internal/handlers/generate.go`

Changement principal : sur erreur Mistral, le handler **écrit en BDD** et **retourne 200** (au lieu de 503).

| Cas | Avant | Après |
|---|---|---|
| Succès Mistral | 200 `{"status":"ok"}` | 200 `{"state":"ready"}` |
| Déjà frais | 204 | 204 (inchangé) |
| Erreur Mistral | **503** `{"error":{...}}` | **200** `{"state":"failed","error_code":"MISTRAL_TIMEOUT"}` + ligne BDD |
| Erreur interne | 500 | 500 (inchangé) |

Sur erreur Mistral :
1. Classifie l'erreur (`MISTRAL_TIMEOUT` ou `MISTRAL_UNAVAILABLE`)
2. Insère une ligne `status='error'` + `error_code` dans `diva_insights`
3. Retourne HTTP 200 avec `{"state":"failed","error_code":"..."}`

Les sentinelles `errMistralTimeout` et `errMistralUnavailable` ont été supprimées (inutiles, gestion inline).

### 3.6 Handler `GET /diva/insights`

**Fichier :** `units/diva/internal/handlers/insights.go`

Ajout du mapping `status='error'` → `state:"failed"` :

```go
if insight.Status == "error" {
    return c.JSON(fiber.Map{
        "state":      "failed",
        "error_code": insight.ErrorCode,
    })
}
```

Mapping complet conforme à la spec v1.3 §6 :

| DB (`status`) | API (`state`) | Condition |
|---|---|---|
| `ok` | `ready` | Ligne trouvée, non expirée |
| `error` | `failed` | Ligne trouvée |
| *(pas de ligne)* | `pending` | Aucune ligne pour ce `context_key` |

### 3.7 Runner — `CallDivaGenerate`

**Fichier :** `units/diva/internal/runner/diva_client.go`

Type de retour changé de `(int, error)` à `(*GenerateResult, error)` :

```go
type GenerateResult struct {
    State     string `json:"state"`
    ErrorCode string `json:"error_code,omitempty"`
}
```

Le runner parse désormais le body JSON pour extraire `state` et `error_code`.

### 3.8 Runner — Logs structurés

**Fichier :** `units/diva/internal/runner/runner.go`

Les logs incluent désormais `state` et `error_code` :
- `state=ready` → INFO
- `state=fresh` → INFO
- `state=failed error_code=MISTRAL_TIMEOUT` → WARN

### 3.9 Frontend — `DivaFlashBlock.tsx`

**Fichier :** `units/dorevia-linky/components/DivaFlashBlock.tsx`

1. Interface `InsightResponse` : ajout de `"failed"` au type union `state` et de `error_code?: string`
2. Gestion du `state === "failed"` :

```typescript
if (data.state === "failed") {
    setError("Analyse temporairement indisponible (mise à jour automatique en cours).");
    setFlash(null);
    return;
}
```

Message conforme à la spec v1.3 §6 : **exactement** la chaîne spécifiée.

### 3.10 Correctif pré-existant — `DashboardWithFilters.tsx`

**Fichier :** `units/dorevia-linky/components/DashboardWithFilters.tsx`

Correction de 8 erreurs de syntaxe JSX pré-existantes (`)}}`  → `)}`) qui empêchaient le build Next.js. Ces erreurs n'étaient pas liées à nos modifications mais bloquaient le déploiement Linky.

### 3.11 Retry automatique — `CheckInsightFresh`

**Fichier :** `units/diva/internal/store/postgres_analysis_store.go` (inchangé)

`CheckInsightFresh` filtre `status = 'ok'` — un insight en erreur n'est **jamais considéré comme frais**. Le runner retente automatiquement au cycle suivant sans logique supplémentaire.

---

## 4. Vérification en production

### 4.1 Mapping DB → API

Testé sur les 3 états :

| Requête | Réponse | Conforme |
|---|---|---|
| `company_id=1, date_start=2026-01-01` (insight ok) | `{"state":"ready","insight":{...}}` | ✅ |
| `company_id=1, date_start=2026-02-01` (pendant erreur Mistral) | `{"state":"failed","error_code":"MISTRAL_TIMEOUT"}` | ✅ |
| Contexte sans insight | `{"state":"pending"}` | ✅ |

### 4.2 Retry après `failed`

Observé en production :

```
22:20:09  cockpit:sarl-la-platine:1:2026-02-01:2026-02-28  status=ok
22:27:30  cockpit:sarl-la-platine:1:2026-02-01:2026-02-28  status=error  MISTRAL_TIMEOUT
22:29:49  cockpit:sarl-la-platine:1:2026-02-01:2026-02-28  status=ok     (retry réussi)
```

Le runner a correctement retenté au cycle suivant et Mistral a répondu.  
Le GET retourne `state:"ready"` (l'ok plus récent a priorité sur l'error).

### 4.3 Découverte dynamique

Les deux premiers ticks post-déploiement montrent le runner en fallback (Linky ancien) :

```
22:20:41  WARN discovery companies status=failed (404 — Linky pas encore redéployé)
22:20:41  INFO discovery companies status=fallback_static companies=[0 1 2]
```

Après redéploiement Linky, le runner bascule en mode dynamique :

```
22:28:41  INFO discovery companies status=ok companies=[0 1 2]
22:28:41  INFO discovery cards status=ok version=2026-02-18.1 count=8
```

### 4.4 Métriques

| Métrique | Valeur observée |
|---|---|
| Insights ok actifs (non expirés) | 9 (3 sociétés × 2 périodes + quelques renouvellements) |
| Insights error (total session) | 1 (`MISTRAL_TIMEOUT`, retenté avec succès) |
| Insights mode=card | 0 |
| Latence moyenne Mistral (ok) | ~24s |
| Latence max Mistral (ok) | ~65s |
| Latence timeout (error) | 120s (exactement le timeout HTTP) |
| Durée tick runner | ~4 min 40s (6 contextes séquentiels) |

---

## 5. Fichiers modifiés — Récapitulatif

| Fichier | Nature | Phase |
|---|---|---|
| `sources/vault/migrations/027_add_error_code_diva_insights.sql` | Nouveau | 3.1 |
| `units/diva/internal/store/insights.go` | Modifié | 3.2 |
| `units/diva/internal/store/postgres_analysis_store.go` | Modifié | 3.3, 3.4 |
| `units/diva/internal/handlers/generate.go` | Modifié | 3.5 |
| `units/diva/internal/handlers/insights.go` | Modifié | 3.6 |
| `units/diva/internal/runner/diva_client.go` | Modifié | 3.7 |
| `units/diva/internal/runner/runner.go` | Modifié | 3.8 |
| `units/dorevia-linky/components/DivaFlashBlock.tsx` | Modifié | 3.9 |
| `units/dorevia-linky/components/DashboardWithFilters.tsx` | Corrigé | 3.10 |

---

## 6. Conformité spec v1.3 — Definition of Done

| Exigence (spec §9) | Statut |
|---|---|
| `context_scope` explicite dans `context_key` | ✅ `cockpit:...` |
| `context_scope` présent dans le payload Mistral | ✅ `"context_scope": "cockpit"` |
| `company_id` intégré dans `context_key` | ✅ `cockpit:<tenant>:<cid>:<d1>:<d2>` |
| Découverte dynamique des sociétés | ✅ `GET /api/cockpit/companies` + fallback static |
| TTL = 3 min | ✅ `ttlMin := 3` |
| Cards dynamiques via `/api/cockpit/cards` | ✅ Endpoint + runner consomme |
| Suppression génération focus cards | ✅ Runner cockpit uniquement |
| Suppression bloc DIVA sur cards | ✅ Aucun `focusCardId` dans `DashboardWithFilters` |
| État `failed` → retry au cycle suivant | ✅ Vérifié en production (22:27 error → 22:29 ok) |
| Mistral indisponible → `failed` + `error_code` | ✅ `MISTRAL_TIMEOUT` persisté |
| Message UI en `failed` | ✅ "Analyse temporairement indisponible (mise à jour automatique en cours)." |
| `pending` synthétisé par GET (jamais en DB) | ✅ Aucune ligne `status='pending'` ; advisory lock empêche les doubles runs |
| `payload_hash` déterministe | ✅ Canonicalisation JSON, arrondis stables, scope + company_id inclus |
| Canonicalisation Go stable | ✅ `hashinput/canonical.go` avec tri des clés |
| Test sur `company_id` 0, 1, 2 | ✅ Insights générés pour les 3 sociétés |

---

## 7. Points d'attention post-déploiement

1. **Purge des anciennes lignes `error`** : le job de purge existant (`purge_diva_insights.sql`) nettoie les lignes expirées. Les lignes `error` n'ayant pas d'`expires_at` pertinent, elles s'accumulent lentement. Ajouter une règle de purge pour les lignes `status='error'` plus anciennes que 24h.

2. **`RUNNER_TENANT_CONFIG` toujours en fallback** : la config statique `sarl-la-platine:0,1,2` reste dans `.env` pour le fallback. Elle sera retirée une fois la stabilité de la découverte dynamique confirmée sur plusieurs jours.

3. **Latence Mistral** : avec 6 contextes séquentiels (~24s chacun), le tick dure ~4m40s. Si le tenant grossit, envisager `RUNNER_CONCURRENCY=2` pour paralléliser les sociétés (tout en gardant `LLM_CONCURRENCY=1`).

---

## 8. Procédure de déploiement exécutée

```
1. docker compose stop diva-runner          # Arrêt runner (éviter races)
2. psql < 027_add_error_code_diva_insights.sql   # Migration SQL
3. docker compose build --no-cache          # Rebuild diva + diva-runner
4. docker compose up -d                     # Redémarrage diva + diva-runner
5. docker build -t dorevia/linky:latest .   # Rebuild Linky
6. docker stop/rm + docker compose up -d    # Redémarrage Linky lab
7. Vérification logs runner + requêtes GET  # Validation production
```

Aucune interruption visible côté utilisateur (les insights existants en BDD restent lisibles pendant le déploiement).

---

**Rapport rédigé le 2026-02-18 — Toutes les phases (0-3) de la spec DIVA Cockpit Only v1.3 sont implémentées et déployées.**

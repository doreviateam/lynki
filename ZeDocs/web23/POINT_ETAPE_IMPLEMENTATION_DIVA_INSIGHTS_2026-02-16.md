# Point d'étape — Implémentation DIVA Insights v1.1

**Date :** 2026-02-16  
**Référence :** `SPEC_DIVA_Insights_v1.0.md`, `PLAN_IMPLEMENTATION_DIVA_INSIGHTS_SCRUM.md`

---

## 1. Contexte

**Objectif :** Mode A « lecture à la minute » — Linky lit des insights pré-calculés via GET, sans appel IA bloquant côté UX.

**Design :** Table `diva_insights` (cache volatil) ; `payload_hash` (idempotence) ; `context_key` (verrouillage) ; GET instantané, POST /generate en coulisse (runner + warmup).

---

## 2. Réalisations

### S1.1 Migration SQL — ✅ Terminé

| Élément | Statut |
|---------|--------|
| Migration `026_create_diva_insights.sql` | Créée |
| Migration `026b_grant_diva_insights.sql` | Créée |
| Script `purge_diva_insights.sql` | Créé |
| Script `purge_diva_insights.sh` | Créé puis corrigé (boucle jusqu’à 0 lignes, vérif psql avant boucle) |

**Schéma :** `tenant`, `company_id`, `mode`, `card_key`, `date_start`, `date_end`, `context_key`, `payload_hash`, `message_text`, `flash_json`, `status`, `expires_at`, etc.

---

### S1.2 hash_input + canonicalJSON — ✅ Terminé

| Fichier | Description |
|---------|-------------|
| `units/diva/internal/hashinput/round.go` | `toMinor`, `toBasisPoints` (round_half_away_from_zero, epsilon anti-float) |
| `units/diva/internal/hashinput/canonical.go` | `CanonicalJSONForHash` — tri clés, conservation des null |
| `units/diva/internal/hashinput/build.go` | `BuildHashInput` — CARD_VALUE_SCALE, FOCUS_CARD_DETAILS_SCALE |
| `units/diva/internal/hashinput/hash.go` | `ComputePayloadHash` — SHA-256(canonical(hash_input)) |
| `units/diva/internal/hashinput/round_test.go` | Tests toMinor/toBasisPoints (1.005→101, -1.005→-101) |
| `units/diva/internal/hashinput/hash_test.go` | Tests idempotence, formatted ignoré, null conservé |

**Critères d’acceptation validés :**
- Même payload → même `payload_hash`
- Variation `formatted`/`label` n’impacte pas le hash
- Float 1686.84 → 168684 (centimes)
- `value == null` → `value_minor == null` dans hash_input

---

## 3. État actuel

| Sprint 1 | Statut |
|----------|--------|
| S1.1 Migration SQL | ✅ Terminé |
| S1.2 hash_input | ✅ Terminé |
| S1.3 GET /diva/insights | ✅ Terminé |
| S1.4 POST /diva/generate | ✅ Terminé |
| S1.5 Runner adaptation | ✅ Terminé |

**Sprint 2 (Linky, E2E) :** ✅ terminé.

---

## 4. Récapitulatif Sprint 1 (terminé)

### S1.3 — Handler GET /diva/insights ✅
- Paramètres : tenant, company_id, mode, card_key, period (ou date_start/date_end)
- Résolution period → dates (YTD, MTD, current_month) via `ResolvePeriod` + `INSIGHTS_TIMEZONE`
- Calcul `context_key` via `hashinput.ComputeContextKey`
- Requête SQL `diva_insights` WHERE context_key, status='ok', expires_at > now()
- Réponse 200 (insight) ou 404 / 400

### S1.4 — Handler POST /diva/generate ✅
- Validation payload (tenant, date_start, date_end, cards, focus_card si card)
- Lock session (pg_advisory_lock), double-check payload_hash → 204
- Mistral + insert diva_insights, 200/204/400/500/503

### S1.5 — Runner ✅
- CallDivaGenerate remplace CallDivaAsync (POST /diva/generate, generated_from_runner: true)
- Cockpit + 2–3 cartes (treasury_validated_pct, cash, business) par période
- FetchMetricsFromLinkyFull avec _details pour focus_card_details

---

## 5. Sprint 2 — Terminé ✅

**Règle infra (prioritaire) :** Linky ne doit **jamais** dépendre de Mistral pour afficher quoi que ce soit. Lecture GET uniquement (insights pré-calculés). Design respecté (affichage instantané, pas d’appel IA bloquant côté UX).

| Tâche | Statut | Description |
|-------|--------|-------------|
| S2.1 GET /api/diva/insight | ✅ | Proxy Linky vers DIVA GET /diva/insights |
| S2.2 DivaFlashBlock | ✅ | Remplacer POST+poll par GET, fallback "Analyse en cours" si 404 |
| S2.3 Warmup | ✅ | Fire-and-forget POST /diva/generate (remplace explain/async) |
| S2.4 E2E | ✅ | Script `scripts/test_diva_insights_s2.sh` (cockpit, card, generate, proxy, prewarm) |

### Récapitulatif Sprint 2

| Tâche | Détail |
|-------|--------|
| **S2.1** | Proxy Linky `GET /api/diva/insight` → DIVA `GET /diva/insights` (tenant, company_id, mode, card_key, period ou date_start/date_end) |
| **S2.2** | DivaFlashBlock : lecture GET uniquement, fallback « Analyse en cours » si 404, plus de POST+poll |
| **S2.3** | Prewarm : `POST /diva/generate` au lieu de `/diva/explain/async` (fire-and-forget) |
| **S2.4** | Script `test_diva_insights_s2.sh` : tests 1–3 (DIVA direct), 4–5 (Linky si URL fournie) |

---

## 6. Fichiers créés ou modifiés

| Fichier | Action |
|---------|--------|
| `sources/vault/migrations/026_create_diva_insights.sql` | Créé |
| `sources/vault/migrations/026b_grant_diva_insights.sql` | Créé |
| `scripts/purge_diva_insights.sql` | Créé |
| `scripts/purge_diva_insights.sh` | Créé, puis corrigé |
| `units/diva/internal/hashinput/*.go` | Créé (5 fichiers) |
| `units/diva/internal/hashinput/*_test.go` | Créé (2 fichiers) |
| `units/diva/internal/store/insights.go` | Créé (Insight, InsightsStore, GenerateStore, GenerateTx, InsertInsightParams) |
| `units/diva/internal/handlers/insights.go` | Créé (GET /diva/insights) |
| `units/diva/internal/store/postgres_analysis_store.go` | Modifié (+ GetInsight, WithGenerateLock, generateTx) |
| `units/diva/internal/server/server.go` | Modifié (+ routes GET /diva/insights, POST /diva/generate) |
| `units/diva/internal/handlers/generate.go` | Créé (POST /diva/generate) |
| `units/diva/internal/models/models.go` | Modifié (+ GeneratedFromRunner) |
| `units/diva/internal/runner/periods.go` | Modifié (+ ResolvePeriod, YTD/MTD) |
| `units/diva/internal/hashinput/hash.go` | Modifié (+ ComputeContextKey) |
| `units/diva/internal/runner/diva_client.go` | Modifié (CallDivaGenerate remplace CallDivaAsync) |
| `units/diva/internal/runner/metrics.go` | Modifié (+ FetchMetricsFromLinkyFull, _details) |
| `units/diva/internal/runner/runner.go` | Modifié (cockpit + 3 cartes, POST /diva/generate) |
| `units/dorevia-linky/app/api/diva/insight/route.ts` | Créé (proxy GET /api/diva/insight → DIVA GET /diva/insights) |
| `units/dorevia-linky/components/DivaFlashBlock.tsx` | Modifié (lecture GET uniquement, fallback si 404) |
| `units/dorevia-linky/app/api/diva/prewarm/route.ts` | Modifié (POST /diva/generate au lieu de explain/async) |
| `scripts/test_diva_insights_s2.sh` | Créé (S2.4 — tests manuels DIVA insights) |

---

## 7. La suite

### 7.1 Priorité immédiate — Validation

| Action | Commande / description | Statut |
|--------|------------------------|--------|
| Tests avec Linky | `./scripts/test_diva_insights_s2.sh http://linky_lab_sarl-la-platine:3000` | OK (5/5) |
| Compilation Linky | `cd units/dorevia-linky && npm run build` (ou `docker run -v ... node:20-slim npm install && npm run build`) | OK |
| Migration diva_insights | `docker exec -i vault-db-core-stinger psql -U vault -d dorevia_vault < sources/vault/migrations/026_create_diva_insights.sql` | Appliquée |
| Déploiement DIVA | `cd units/diva && docker compose build && docker compose up -d --force-recreate` ; `.env` avec DIVA_DATABASE_URL | OK |

### 7.2 Prompt DIVA v1.0_fr_expert — Posture linguistique (2026-02-18)

**Évolution :** Synthèse experte + verrouillage linguistique (RECOMMANDATION_RENFORCEMENT_LINGUISTIQUE_DIVA_v1.0.md).

- **Identité** : experte-comptable française, PME, style cabinet
- **Verrouillage** : français strict, aucun anglicisme, vocabulaire métier (rapprochement bancaire, fiabilité des flux, position non certifiée, etc.)
- **Structure** : constat principal → flux significatifs → limites → conclusion neutre
- **Ton** : factuel, neutre, sobre, professionnel

**Appliquer :** Reconstruire DIVA ; purger cache insights pour regénérer.

### 7.3 Améliorations restantes (spec §9.3)

| Élément | État | Action |
|---------|------|--------|
| **Bouton « Rafraîchir »** | Partiel | Actuellement : re-GET. Spec : déclencher POST `/diva/generate` avec `force_refresh` pour forcer une nouvelle génération. |
| **Doc déploiement** | À faire | README DIVA/Linky : variables d'environnement (`INSIGHTS_*`), purge, ordre de démarrage |

### 7.4 Optionnel — v2

| Élément | Référence | Description |
|---------|-----------|-------------|
| Étendre runner à 8 cartes | Spec §7.4 | `taxes`, `credit_notes`, `refunds`, `pos_shops`, `pos_z` si charge Mistral le permet |
| Déprécier explain/async | Spec §10.2 | Une fois GET stable, déprécier `POST /diva/explain/async` pour l'UI Linky |
| Feature flag | Plan §2.4 | GET vs POST pour rollback en production |

### 7.5 Autres chantiers

Reprendre la roadmap plateforme Dorevia (landing v2, Vault, etc.) selon les priorités du projet.

# Rapport d’implémentation détaillé — ADR-001 Linky → Vault only

**Version :** 1.0  
**Date :** 2026-03-15  
**Référence plan :** PLAN_IMPLEMENTATION_ADR001_LINKY_VAULT_ONLY_v1.0.md  
**Périmètre :** Lots 0 à 5 (conformité ADR-001 complète).

---

## Synthèse

L’implémentation des **Lots 0 à 5** est terminée. La **conformité ADR-001** est atteinte : Linky ne lit plus `DLP_URL` ni `DIVA_URL` nulle part ; tous les flux (visibles et admin DLP) transitent par le Vault. Le contrôle CI et la note de nettoyage env (Lot 5) sont en place.

**Phrase de pilotage :** *L’ADR-001 est clôturée : Linky consomme désormais exclusivement des endpoints exposés par le Vault, y compris pour les flux admin DLP, et le CI empêche toute réintroduction de dépendances directes à DLP ou DIVA.*

---

## 1. Contexte et objectif

L’**ADR-001** impose que Linky ne consomme que des endpoints exposés par le Vault (gateway unique) ; toute dépendance directe à DLP ou DIVA est interdite. Ce rapport décrit l’implémentation des **Lots 0 à 5** du plan :

- **Lot 0** : Prérequis Vault (config, règles gateway, erreurs, journalisation).
- **Lot 1** : Routes Vault `/ui/dlp/*` et `/ui/diva/*` pour le Palier 1.
- **Lot 2** : Bascule Linky (dashboard-metrics, dlp/energy-summary, diva/*) vers le Vault.
- **Lot 3** : Routes Vault admin DLP (companies, dlps, perimeters, project-perimeter-map).
- **Lot 4** : `dlpClient.ts` et toutes les routes admin DLP Linky → Vault ; suppression de `DLP_URL`.
- **Lot 5** : Script et workflow CI de conformité ; note de nettoyage env.

**Documents de référence :**

- ZeDocs/web51/ADR-001_LINKY_VAULT_GATEWAY_UNIQUE.md  
- ZeDocs/web51/ANALYSE_CONSEQUENCES_IMPLEMENTATION_ADR001.md  
- ZeDocs/web51/PLAN_IMPLEMENTATION_ADR001_LINKY_VAULT_ONLY_v1.0.md  

---

## 2. Synthèse des changements

| Zone | Fichiers créés | Fichiers modifiés |
|------|----------------|-------------------|
| **Vault** | `internal/handlers/dlp_ui.go`, `internal/handlers/diva_ui.go` | `internal/config/config.go`, `internal/server/replay.go` |
| **Linky** | `scripts/check-adr001-no-dlp-diva.sh` | `app/lib/dlpClient.ts`, `app/api/dashboard-metrics/route.ts`, `app/api/dlp/energy-summary/route.ts`, toutes les routes `app/api/diva/*`, `package.json` |
| **CI** | `.github/workflows/adr001-linky-conformity.yml` | — |
| **Doc** | `ZeDocs/web51/NOTE_LOT5_NETTOYAGE_ENV_LINKY.md` | — |

**Lot 4 :** `app/lib/dlpClient.ts` réécrit vers `VAULT_URL` avec transformation `/api/v1/xxx` → `/ui/dlp/xxx` ; plus aucune référence à `DLP_URL`.

---

## 3. Lot 0 — Prérequis Vault

### 3.1 Configuration (V0.1)

**Fichier :** `sources/vault/internal/config/config.go`

Ajout du bloc suivant (ADR-001, ZeDocs/web51) :

```go
// ADR-001 Linky → Vault only : gateway DLP/DIVA (ZeDocs/web51)
DLPURL         string `env:"DLP_URL" envDefault:""`              // URL du service DLP (ex. http://dlp:8020)
DIVAURL        string `env:"DIVA_URL" envDefault:""`              // URL du service DIVA (ex. http://diva:8030)
DLPTimeoutMs   int    `env:"DLP_TIMEOUT_MS" envDefault:"800"`    // Timeout ms pour appels DLP (tuile énergie)
DIVATimeoutMs  int    `env:"DIVA_TIMEOUT_MS" envDefault:"60000"` // Timeout ms pour appels DIVA (explain, etc.)
DIVAPrewarmMs  int    `env:"DIVA_PREWARM_TIMEOUT_MS" envDefault:"120000"`
DIVARefreshMs  int    `env:"DIVA_REFRESH_TIMEOUT_MS" envDefault:"120000"`
```

- **DLP_URL** / **DIVA_URL** : URLs des services aval ; si vides, les handlers gateway retournent 503 `gateway_unconfigured`.
- **DLP_TIMEOUT_MS** : 800 ms par défaut (aligné sur la contrainte tuile Énergie côté Linky).
- **DIVA_*** : timeouts pour explain (60 s), prewarm (120 s), refresh (120 s).

### 3.2 Règles gateway et erreurs (V0.2, V0.3)

Documentées et appliquées dans les handlers (voir § 4) :

- **Contraintes gateway (ANALYSE § 2.4)** : relais des paramètres fonctionnels (query string, body), propagation de `X-Trace-Id` et `X-Tenant` vers l’aval, pas de relais aveugle des headers, auth technique centralisée côté Vault (config).
- **Erreurs normalisées (ANALYSE § 2.5)** : body d’erreur minimal `{ "code", "message", "request_id" }` ; en cas de timeout, 5xx aval ou erreur réseau, le Vault renvoie 502 avec ce format (pas de propagation brute des réponses DLP/DIVA).

### 3.3 Journalisation (V0.4)

Implémentée dans `dlp_ui.go` et `diva_ui.go` :

- **Logs à chaque appel aval** : `route` (chemin cible), `method`, `status_aval`, `duration_ms`, `request_id`, `tenant`.
- **Aucun log des bodies** (requêtes ou réponses) pour éviter contenu verbeux ou sensible.

---

## 4. Lot 1 — Routes Vault Palier 1

### 4.1 Fichier créé : `internal/handlers/dlp_ui.go`

- **Rôle :** Gateway UI DLP pour Linky (ADR-001).
- **Handler exposé :**
  - **DLPEnergySummaryHandler** : `GET /ui/dlp/energy-summary`
    - Transmet la query string à `DLP_URL/api/v1/dlp/energy-summary`.
    - Timeout : `DLP_TIMEOUT_MS` (défaut 800 ms).
    - Si `DLP_URL` vide → 503 `gateway_unconfigured`.
    - En cas d’erreur aval ou timeout → 502 avec body `{ code, message, request_id }`.
- **Fonctions internes réutilisables (prévues Lot 3)** : `writeGatewayError`, `dlpProxyForward`, `dlpTargetPath` (non utilisées en Lot 1/2).

**Traçabilité :** Le champ `request_id` correspond à l'identifiant de corrélation propagé via `X-Trace-Id` (ou équivalent middleware), repris dans les logs et dans les bodies d'erreur normalisés. Le `tenant` provient du header `X-Tenant` ou de la query `tenant`.

### 4.2 Fichier créé : `internal/handlers/diva_ui.go`

- **Rôle :** Gateway UI DIVA pour Linky (ADR-001).
- **Handlers exposés :**

| Route Vault | Méthode | Cible DIVA | Timeout (config) |
|-------------|---------|------------|------------------|
| `/ui/diva/insights` | GET | `DIVA_URL/diva/insights` | DIVA_TIMEOUT_MS (60 s) |
| `/ui/diva/generate` | POST | `DIVA_URL/diva/generate` | DIVA_PREWARM_TIMEOUT_MS / DIVA_REFRESH_TIMEOUT_MS (120 s) |
| `/ui/diva/explain` | POST | `DIVA_URL/diva/explain` | DIVA_TIMEOUT_MS |
| `/ui/diva/explain/async` | POST | `DIVA_URL/diva/explain/async` | DIVA_TIMEOUT_MS |
| `/ui/diva/jobs/:contextHash` | GET | `DIVA_URL/diva/jobs/:contextHash` | DIVA_TIMEOUT_MS |

- **Comportement commun :** lecture du body pour POST, transmission query/body vers DIVA, propagation `X-Trace-Id` / `X-Tenant`, logs sans body, erreurs normalisées 502/503 avec `code`, `message`, `request_id`.

**Timeout pour `POST /ui/diva/generate` :** Une seule route Vault sert à la fois le prewarm et le refresh Linky. Le handler `DIVAGenerateHandler` choisit le timeout applicable selon le contexte d'appel (ex. contenu du payload, option `force_refresh`). À défaut de logique explicite, un timeout unique doit être retenu (ex. `DIVA_PREWARM_TIMEOUT_MS`), ou à défaut une future consolidation vers une clé dédiée de type `DIVA_GENERATE_TIMEOUT_MS`.

### 4.3 Enregistrement des routes

**Fichier :** `sources/vault/internal/server/replay.go`

Dans `RegisterUiAggregations`, ajout (avant les routes agrégations existantes) :

```go
// Gateway DLP/DIVA (ADR-001 ZeDocs/web51) — exposé même sans DB
if cfg != nil && log != nil {
    app.Get("/ui/dlp/energy-summary", handlers.DLPEnergySummaryHandler(cfg, log))
    app.Get("/ui/diva/insights", handlers.DIVAInsightsHandler(cfg, log))
    app.Post("/ui/diva/generate", handlers.DIVAGenerateHandler(cfg, log))
    app.Post("/ui/diva/explain", handlers.DIVAExplainHandler(cfg, log))
    app.Post("/ui/diva/explain/async", handlers.DIVAExplainAsyncHandler(cfg, log))
    app.Get("/ui/diva/jobs/:contextHash", handlers.DIVAJobsHandler(cfg, log))
}
```

Les routes gateway sont enregistrées **même si la base de données n’est pas configurée** (`db == nil`), afin que le Vault puisse servir de gateway DLP/DIVA indépendamment du reste.

---

## 5. Lots 2 à 5 — Linky, admin DLP et clôture ADR-001

### 5.1 Principe

- Tous les appels **DLP** et **DIVA** concernés par le Palier 1 passent par **VAULT_URL** et les chemins **/ui/dlp/*** ou **/ui/diva/***.
- Les routes Next.js **restent inchangées** côté front : le contrat `/api/dlp/*` et `/api/diva/*` est conservé (migration interne backend uniquement).

### 5.2 Fichiers modifiés — DLP

| Fichier | Modification |
|---------|--------------|
| **app/api/dashboard-metrics/route.ts** | Suppression de `DLP_URL`. La tuile « Énergie stratégique » appelle `VAULT_URL + "/ui/dlp/energy-summary"` (avec `base` déjà défini pour le Vault). Headers : `Accept`, `X-Tenant`. |
| **app/api/dlp/energy-summary/route.ts** | Remplacement de `DLP_URL` par `VAULT_URL`. URL d’appel : `VAULT_URL + "/ui/dlp/energy-summary"` avec la même query. Headers : `Accept`, `X-Tenant`. Commentaire mis à jour : « proxy vers Vault /ui/dlp/energy-summary (ADR-001, ZeDocs/web51) ». |

### 5.3 Fichiers modifiés — DIVA

| Fichier | Modification |
|---------|--------------|
| **app/api/diva/insight/route.ts** | `DIVA_URL` → `VAULT_URL`. Appel : `VAULT_URL + "/ui/diva/insights"` avec la même query. Header `X-Tenant` ajouté. |
| **app/api/diva/prewarm/route.ts** | `DIVA_URL` → `VAULT_URL`. Appel : `VAULT_URL + "/ui/diva/generate"` (POST, body inchangé). Header `X-Tenant` ajouté. |
| **app/api/diva/refresh/route.ts** | `DIVA_URL` → `VAULT_URL`. Appel : `VAULT_URL + "/ui/diva/generate"` (POST, body inchangé). Header `X-Tenant` ajouté. |
| **app/api/diva/jobs/[contextHash]/route.ts** | `DIVA_URL` → `VAULT_URL`. Appel : `VAULT_URL + "/ui/diva/jobs/" + contextHash`. |
| **app/api/diva/explain/route.ts** | `DIVA_URL` → `VAULT_URL`. Appel : `VAULT_URL + "/ui/diva/explain"` (POST). Header `X-Tenant` ajouté. |
| **app/api/diva/explain/async/route.ts** | `DIVA_URL` → `VAULT_URL`. Appel : `VAULT_URL + "/ui/diva/explain/async"` (POST). Header `X-Tenant` ajouté. |

Dans tous les cas, **fallback** si `VAULT_URL` absent : `"http://localhost:8080"`. Ce fallback est toléré pour le développement local ; en environnement intégré ou production, `VAULT_URL` doit être explicitement défini pour éviter des appels involontaires vers localhost.

### 5.4 Lot 3 — Routes Vault admin DLP

Dans **dlp_ui.go**, les routes admin DLP sont exposées via proxy générique :

- **GET/POST** `/ui/dlp/companies`, **GET/POST/PATCH/DELETE** `/ui/dlp/dlps`, **GET** `/ui/dlp/dlps/:id`
- **GET/POST** `/ui/dlp/perimeters`, **GET/PATCH/DELETE** `/ui/dlp/perimeters/:id`
- **GET/POST** `/ui/dlp/project-perimeter-map`, **GET/PATCH/DELETE** `/ui/dlp/project-perimeter-map/:id`

Handlers : `DLPProxyHandler` (sans :id) et `DLPProxyIDHandler` (avec :id) ; même règles gateway (headers, erreurs normalisées, pas de body en log). Enregistrement dans **replay.go** à côté des routes Palier 1.

### 5.5 Lot 4 — dlpClient et routes admin Linky

- **app/lib/dlpClient.ts** : réécrit pour n’utiliser que **VAULT_URL**. Transformation des chemins : `/api/v1/xxx` → `/ui/dlp/xxx`. Plus aucune lecture de `DLP_URL` ni `DIVA_URL` dans Linky.
- Les routes **app/api/dlp/*** (companies, dlps, perimeters, project-perimeter-map, etc.) s’appuient sur ce client ; elles transitent donc toutes par le Vault.

### 5.6 Lot 5 — CI et note env

- **Script** `units/dorevia-linky/scripts/check-adr001-no-dlp-diva.sh` : grep récursif (hors `node_modules`, `.next`) pour interdire `DLP_URL` et `DIVA_URL` dans le code Linky ; sortie non nulle si occurrence trouvée.
- **Workflow** `.github/workflows/adr001-linky-conformity.yml` : exécute `npm run check:adr001` sur push/PR.
- **Note** `ZeDocs/web51/NOTE_LOT5_NETTOYAGE_ENV_LINKY.md` : rappel que seul `VAULT_URL` est requis côté Linky ; runbooks et doc déploiement à aligner si besoin.

---

## 6. Vérifications effectuées

### 6.1 Build Vault

```bash
cd sources/vault && go build ./cmd/vault/...
```

**Résultat :** succès (aucune erreur de compilation).

### 6.2 Absence de DLP_URL / DIVA_URL dans Linky

```bash
grep -r "DLP_URL\|DIVA_URL" units/dorevia-linky/app/api
```

**Résultat :** aucune occurrence.

**Vérification CI / script :** `npm run check:adr001` → succès (script Lot 5 sur toute l’arborescence Linky, hors `node_modules` et `.next`).

**Portée :** le grep sur `app/api` et l’exécution du script Lot 5 (`check-adr001-no-dlp-diva.sh`) sur l’arborescence Linky (hors `node_modules`, `.next`) confirment l’absence de `DLP_URL` et `DIVA_URL` dans le code.

**Conclusion :** **Conformité ADR-001 atteinte** : tous les flux Linky (visibles et admin DLP) passent par le Vault ; plus aucune référence à DLP/DIVA dans le code. Le CI (Lot 5) garantit le maintien de cette conformité.

---

## 7. Récapitulatif des routes Vault exposées

| Méthode | Route Vault | Service aval | Config requise |
|---------|--------------|--------------|----------------|
| GET | `/ui/dlp/energy-summary` | DLP `GET /api/v1/dlp/energy-summary` | DLP_URL, optionnel DLP_TIMEOUT_MS |
| GET | `/ui/diva/insights` | DIVA `GET /diva/insights` | DIVA_URL, DIVA_TIMEOUT_MS |
| POST | `/ui/diva/generate` | DIVA `POST /diva/generate` | DIVA_URL ; timeout selon contexte (cf. § 4.2), ou à défaut future consolidation vers une clé dédiée type `DIVA_GENERATE_TIMEOUT_MS` |
| POST | `/ui/diva/explain` | DIVA `POST /diva/explain` | DIVA_URL, DIVA_TIMEOUT_MS |
| POST | `/ui/diva/explain/async` | DIVA `POST /diva/explain/async` | DIVA_URL, DIVA_TIMEOUT_MS |
| GET | `/ui/diva/jobs/:contextHash` | DIVA `GET /diva/jobs/:contextHash` | DIVA_URL, DIVA_TIMEOUT_MS |
| * | `/ui/dlp/companies`, `/ui/dlp/dlps`, `/ui/dlp/dlps/:id`, `/ui/dlp/perimeters`, `/ui/dlp/perimeters/:id`, `/ui/dlp/project-perimeter-map`, `/ui/dlp/project-perimeter-map/:id` | DLP (proxy) | DLP_URL, DLP_TIMEOUT_MS |

---

## 8. Ce qui reste à faire (optionnel)

- **Runbooks / doc déploiement** : si des runbooks ou une doc hors ZeDocs mentionnent encore `DLP_URL` ou `DIVA_URL` pour Linky, les aligner sur la note Lot 5 (seul `VAULT_URL` est requis côté Linky).
- **DIVA_PREWARM_ENABLED** : décision à trancher (connectivité vs feature flag) ; pas bloquant pour la conformité ADR-001.
- **Tests** : si des mocks ou tests Linky référencent encore DLP/DIVA directement, les adapter pour pointer vers le Vault ou les mocks gateway.

---

## 9. Déploiement et recette finale ADR-001

### 9.1 Vault

- Définir **DLP_URL** et **DIVA_URL** (et timeouts optionnels) pour activer les gateways.
- Si l’une des deux est vide, les routes correspondantes renvoient **503** avec body `{ "code": "gateway_unconfigured", "message": "…", "request_id": "…" }`.

### 9.2 Linky

- **Seul VAULT_URL** est requis. Tous les flux (tuile Énergie, bloc DIVA, admin DLP) passent par le Vault.
- **DLP_URL** et **DIVA_URL** ne sont plus lus nulle part dans Linky (`app/api`, `app/lib/dlpClient.ts`, etc.) ; le script et le workflow Lot 5 en vérifient l’absence.

### 9.3 Recette fonctionnelle

- **Palier 1** : Dashboard Linky (tuile « Énergie stratégique »), bloc DIVA (insight, prewarm, refresh, explain, jobs) : tous les appels passent par le Vault.
- **Palier 2** : Écrans admin DLP (companies, dlps, perimeters, project-perimeter-map) : appels via `dlpClient` → Vault → DLP ; aucun appel direct à DLP depuis Linky.

---

## 10. Références

- **ADR-001** : ZeDocs/web51/ADR-001_LINKY_VAULT_GATEWAY_UNIQUE.md  
- **Analyse des conséquences** : ZeDocs/web51/ANALYSE_CONSEQUENCES_IMPLEMENTATION_ADR001.md  
- **Plan d’implémentation** : ZeDocs/web51/PLAN_IMPLEMENTATION_ADR001_LINKY_VAULT_ONLY_v1.0.md  
- **Rapport d’avancement** : ZeDocs/web51/RAPPORT_AVANCEMENT_ADR001_2026-03-15.md  

---

*ZeDocs/web51 — Rapport d’implémentation détaillé ADR-001 v1.0 — 2026-03-15.*

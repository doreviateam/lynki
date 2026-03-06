# Rapport d'implémentation détaillé — DIVA Warmup Runner CODIR

**Date** : 2026-02-17  
**Spec** : `SPEC_DIVA_Warmup_Runner_CODIR_v1.0.md` (v1.1)  
**Statut** : ✅ Implémenté et testé  
**Périmètre** : Warm-up opportuniste (Linky) + Runner planifié (Go) + Store Postgres + ajustements UX

---

## 1. Vue d'ensemble

### 1.1 Objectifs atteints

| Objectif | Implémentation |
|----------|----------------|
| **Warm-up opportuniste** | Appel fire-and-forget à DIVA à chaque chargement `dashboard-metrics` |
| **Runner planifié CODIR** | Pré-calcul des contextes (mois courant, YTD) toutes les 2 min |
| **Réduction latence perçue** | Bloc DIVA souvent déjà prêt au moment où l'utilisateur lit la grille KPI |
| **Résilience** | Pas de panic, logs warning, retry au cycle suivant |
| **Synthèse ciblée** | DIVA sur chaque carte détaillée, commentaire adapté à la carte affichée |

### 1.2 Stack technique

- **Linky** (Next.js) : `POST /api/diva/prewarm`, appel depuis `DivaFlashBlock`
- **DIVA** (Go/Fiber) : `POST /diva/explain/async` (inchangé), store Postgres/mémoire
- **Runner** (Go) : binaire `diva-runner`, boucle loop/once, concurrence 1

### 1.3 Dépendances préalables

- **DIVA Async** opérationnel (`POST /diva/explain/async`, `GET /diva/jobs/:contextHash`)
- **Mistral** (mistral-llamacpp) sur `dorevia-network`
- **Linky** exposant `/api/dashboard-metrics`

---

## 2. US-1 — Linky Prewarm (Warm-up opportuniste)

### 2.1 Endpoint `POST /api/diva/prewarm`

**Fichier** : `units/dorevia-linky/app/api/diva/prewarm/route.ts`

| Aspect | Détail |
|--------|--------|
| **Réponse** | Toujours `204 No Content` (y compris en cas d'erreur ou timeout) |
| **Timeout** | 700 ms (configurable via `DIVA_PREWARM_TIMEOUT_MS`) |
| **Payload** | Strictement identique à `POST /diva/explain/async` (spec §5.2) |

#### Mapping des champs

Le payload reçu par Linky utilise `date_debut` / `date_fin` (cohérent avec dashboard-metrics).  
Le route les transforme en `date_start` / `date_end` pour DIVA :

```typescript
context: {
  tenant: context.tenant ?? DEFAULT_TENANT,
  company_id: context.company_id ?? 0,
  date_start: context.date_debut ?? "2000-01-01",
  date_end: context.date_fin ?? "2030-12-31",
  timezone: context.timezone ?? "Europe/Paris",
  currency: context.currency ?? "EUR",
  locale: context.locale ?? "fr-FR",
},
dashboard: { cards },  // dérivé de metrics via CARD_MAPPING
options: { mode: "flash", force_refresh: false, prewarm: true },
```

#### Cartes KPI (8 indicateurs)

Même mapping que `explain/async` : `treasury`, `cash`, `business`, `taxes`, `credit_notes`, `refunds`, `pos_shops`, `pos_z`.

#### Comportement erreurs

- **Timeout** : `AbortController` après `PREWARM_TIMEOUT_MS` → log `status=timeout`
- **Erreur réseau** : log `status=error`
- **Pas de dashboard** : retour 204 immédiat (pas d'appel DIVA)

#### Logs structurés (spec §8.1)

```json
{
  "event": "diva_prewarm",
  "tenant": "sarl-la-platine",
  "company_id": 1,
  "date_start": "2026-02-01",
  "date_end": "2026-02-17",
  "status": 202,
  "latency_ms": 120
}
```

En cas d'erreur : `status` vaut `"timeout"` ou `"error"`.

### 2.2 Déclenchement depuis `DivaFlashBlock`

**Fichier** : `units/dorevia-linky/components/DivaFlashBlock.tsx`

**Emplacement** : Après `fetch('/api/dashboard-metrics')`, en parallèle de `fetch('/api/diva/explain/async')` :

```tsx
// Warm-up opportuniste (fire-and-forget) — SPEC DIVA Warmup Runner
const prewarmPayload = {
  context: { tenantId, company_id, date_debut, date_fin, ... },
  dashboard: metrics,
  options: { mode: "flash", force_refresh: false, prewarm: true },
};
fetch("/api/diva/prewarm", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(prewarmPayload),
}).catch(() => {});
```

- **Non bloquant** : `.catch(() => {})` — aucune attente du résultat
- **Même période** : `period.from` / `period.to` identiques à la requête explain/async
- **Payload aligné** : dashboard brut (metrics) passé tel quel, transformation côté route
- **Bouton Rafraîchir** : visible, appelle `fetchDiva(true)` pour forcer un recalcul

### 2.4 Bloc DIVA — UX (DivaFlashBlock)

| Élément | Implémentation |
|---------|----------------|
| **Données utilisées** | Grille 2 colonnes, dans un bloc `<details>` replié par défaut |
| **Confidence badge** | Dans le titre du bloc repliable (toujours visible) |
| **Bouton Rafraîchir** | Visible, force `force_refresh=true` |

### 2.5 Gestion des erreurs et cache

| Cas | Comportement |
|-----|--------------|
| **Réponse « Analyse déjà en cours »** (`refresh_in_progress`) | Affichée mais **non mise en cache** (état transitoire) |
| **Réception d’un flash** | `setError(null)` — efface toute erreur précédente |
| **Réception d’une erreur** | `setFlash(null)` — évite d’afficher un contenu obsolète |
| **404 ou timeout pendant le poll** | Si `fromCache=true` (cache valide au démarrage du fetch) → **ne pas afficher l’erreur**, garder le cache affiché |

### 2.3 Variables d'environnement (Linky)

| Variable | Valeur par défaut | Description |
|----------|-------------------|-------------|
| `DIVA_URL` | `http://diva:8010` | URL interne DIVA |
| `DIVA_PREWARM_TIMEOUT_MS` | `700` | Timeout en ms |
| `DIVA_PREWARM_ENABLED` | `true` | Désactiver si `"false"` |

---

## 3. US-2 — Runner CODIR (Go)

### 3.1 Structure des fichiers

| Fichier | Rôle |
|---------|------|
| `units/diva/cmd/diva-runner/main.go` | Point d'entrée, gestion SIGINT/SIGTERM |
| `units/diva/internal/runner/config.go` | Chargement config env, `parseTenantConfig` |
| `units/diva/internal/runner/runner.go` | Boucle tick, concurrence, logs, recover |
| `units/diva/internal/runner/periods.go` | `PeriodDates(period)` → date_start, date_end |
| `units/diva/internal/runner/metrics.go` | `FetchMetricsFromLinky` → `[]models.Card` |
| `units/diva/internal/runner/diva_client.go` | `CallDivaAsync` → POST /diva/explain/async |

### 3.2 Configuration (`config.go`)

#### Format `RUNNER_TENANT_CONFIG`

```
tenant:company1,company2;tenant2:company3
```

Exemple : `RUNNER_TENANT_CONFIG=sarl-la-platine:0,1;core:0`

> **Company 0** : « Tout » dans Linky = `company_id=0`. Le runner doit pré-calculer 0 et 1 (et les autres companies pertinentes) pour couvrir tous les filtres utilisateur.

Rétrocompatibilité : si vide, usage de `RUNNER_TENANTS` + `RUNNER_COMPANY_IDS` (liste globale).

#### Paramètres

| Variable | Défaut | Description |
|----------|--------|-------------|
| `RUNNER_ENABLED` | `false` | Doit être `true` pour exécuter |
| `RUNNER_MODE` | `loop` | `loop` \| `once` |
| `RUNNER_INTERVAL_SECONDS` | `120` | Intervalle entre itérations (mode loop) |
| `RUNNER_CONCURRENCY` | `1` | Max 2 inférences en parallèle |
| `RUNNER_TENANT_CONFIG` | (vide) | Format `tenant:id1,id2;...` |
| `LINKY_URL` | `http://linky:3000` | URL Linky pour dashboard-metrics (lab : `http://linky_lab_sarl-la-platine:3000`) |
| `DIVA_URL` | `http://diva:8010` | URL DIVA |
| `RUNNER_PERIODS` | `current_month,ytd` | Périodes CODIR |

### 3.3 Périodes CODIR (`periods.go`)

Alignées avec Linky `getPeriodFromKeyAndYear` (period-utils) pour que le `context_hash` corresponde.

| Période | Règle | Exemple (2026-02-17) |
|---------|-------|----------------------|
| `current_month` | 1er du mois → today | 2026-02-01 → 2026-02-17 |
| `ytd` | 1er janvier → **dernier jour du mois courant** | 2026-01-01 → 2026-02-28 |

> **Important** : YTD utilise la fin du mois (comme Linky « Exercice à date »), pas today, pour éviter un décalage de `context_hash` et le message « Analyse expirée ».

### 3.4 Source KPI — Option B (Linky)

**Fichier** : `units/diva/internal/runner/metrics.go`

Le runner appelle `GET /api/dashboard-metrics?tenant=...&date_debut=...&date_fin=...&company_id=...`.

Le mapping vers `[]models.Card` reprend les 8 KPI :

- `treasury_validated_pct`, `cash`, `business`, `taxes`, `credit_notes`, `refunds`, `pos_shops`, `pos_z`

Structure alignée avec le payload attendu par DIVA (spec §6.6).

### 3.5 Client DIVA (`diva_client.go`)

- `POST /diva/explain/async` avec le même schéma que Linky
- Timeout 30 s
- Accepte 200 (done) ou 202 (pending) — aucun parsing du body, juste le code HTTP

### 3.6 Boucle et concurrence (`runner.go`)

- **Mode once** : une itération puis exit
- **Mode loop** : ticker toutes les `IntervalSec` secondes
- **Sémaphore** : `chan struct{}` de taille `Concurrency` (1 ou 2)
- **Recover** : sur tick et sur chaque goroutine contexte — log `slog.Warn`, pas de panic

#### Logs (spec §8.2)

```
event=diva_runner_tick status=start
event=diva_runner_context tenant=sarl-la-platine company_id=1 period=current_month status=202
event=diva_runner_tick status=end duration_ms=... contexts_processed=...
```

En échec : `status=failed` ou `status=panic`, avec `err`.

### 3.7 Build et Docker

**Dockerfile** : build multi-cible

```dockerfile
RUN CGO_ENABLED=0 go build ... -o /diva ./cmd/diva && \
    CGO_ENABLED=0 go build ... -o /diva-runner ./cmd/diva-runner
```

**docker-compose** : service `diva-runner`

```yaml
diva-runner:
  build: { context: ., dockerfile: Dockerfile }
  command: ["/app/diva-runner"]
  environment:
    RUNNER_ENABLED: ${RUNNER_ENABLED:-false}
    RUNNER_TENANT_CONFIG: ${RUNNER_TENANT_CONFIG:-}
    ...
  depends_on: [diva]
  networks: [dorevia-network]
```

---

## 4. Tests et validation

### 4.1 Script de diagnostic async

**Fichier** : `scripts/diagnostic_diva_async.sh`

Usage : `./scripts/diagnostic_diva_async.sh` (depuis la racine du projet)

| Étape | Action | Critère de succès |
|-------|--------|-------------------|
| 1 | Mistral health | `wget http://mistral-llamacpp:8000/health` |
| 2 | DIVA health | `wget http://diva:8010/health` |
| 3 | POST /diva/explain/async | HTTP 200 (cache) ou 202 (pending) + `context_hash` |
| 4 | Poll GET /diva/jobs/{context_hash} | 200 + `status=done` + `headline` |

**Résultat test 2026-02-17** : ✅ Les 4 étapes passent. Analyse terminée en ~55 s pour 8 KPI.

### 4.2 Tests d'acceptation (spec §12)

| Test | Statut | Procédure |
|------|--------|-----------|
| Warm-up : log `diva_prewarm` | ✅ | Charger Linky → logs serveur Linky |
| Warm-up : bloc plus rapide au reload | ✅ | Recharger page → affichage souvent instantané |
| Runner : 200 immédiat | ✅ | Runner 2 min → ouvrir Linky (Tout + Exercice à date 2026) → synthèse immédiate |
| Runner : pas de perte si redémarrage DIVA | ✅ | Store Postgres conserve processing/done |
| Bouton Rafraîchir | ✅ | Visible, force recalcul via `force_refresh` |
| Bloc Données utilisées | ✅ | 2 colonnes, replié par défaut (`<details>`) |
| Refresh navigateur avec cache | ✅ | Cache conservé si 404/timeout (pas d’« Analyse expirée ») |

### 4.3 Revue cartes × périodes

| Élément | Détail |
|---------|--------|
| **8 cartes KPI** | treasury_validated_pct, cash, business, taxes, credit_notes, refunds, pos_shops, pos_z |
| **13 périodes** | ytd (Exercice à date) + 1..12 (Janvier…Décembre) |
| **Runner pré-chauffe** | ytd, current_month uniquement ; mois 1..12 = création à la demande |
| **Procédure revue** | `./scripts/revue_diva_toutes_periodes.sh 2026` (ou `ytd` / `$m` individuels) |

---

## 5. Déploiement

### 5.1 Store Postgres (recommandé)

1. Appliquer la migration 025 sur la base Vault :
   ```bash
   docker exec -i vault-db-core-stinger psql -U vault -d dorevia_vault < sources/vault/migrations/025_create_diva_analysis.sql
   ```

2. Créer `units/diva/.env` (voir `.env.example`) avec :
   ```
   DIVA_DATABASE_URL=postgres://vault:vault_password@vault-db-core-stinger:5432/dorevia_vault
   ```

### 5.2 Prewarm (automatique)

Actif par défaut dès que Linky inclut `DivaFlashBlock`. Aucune configuration spécifique.

### 5.3 Runner

Exemple `.env` lab/stinger :

```
DIVA_DATABASE_URL=postgres://vault:vault_password@vault-db-core-stinger:5432/dorevia_vault
RUNNER_ENABLED=true
RUNNER_TENANT_CONFIG=sarl-la-platine:0,1
LINKY_URL=http://linky_lab_sarl-la-platine:3000
DIVA_URL=http://diva:8010
```

```bash
cd units/diva && docker compose up -d diva diva-runner
```

**Réseau** : `diva-runner` doit joindre Linky (`LINKY_URL`) et DIVA (`DIVA_URL`) sur `dorevia-network`.

### 5.4 Mode cron (once)

```bash
RUNNER_ENABLED=true RUNNER_MODE=once RUNNER_TENANT_CONFIG=... docker run --rm diva-runner
```

---

## 6. Alignement avec la spécification

### 6.1 Conformité par section

| § Spec | Élément | Statut |
|--------|---------|--------|
| 5.1 | POST /api/diva/prewarm | ✅ |
| 5.2 | Payload identique à explain/async | ✅ |
| 5.3 | Timeout 500–1000 ms | ✅ (700 ms) |
| 5.4 | Réponse 204 No Content | ✅ |
| 6.1 | Commande diva-runner | ✅ |
| 6.2 | Modes loop / once | ✅ |
| 6.3 | Périodes current_month, ytd | ✅ |
| 6.4 | Concurrence 1, max 2 | ✅ |
| 6.5 | Résilience (pas de panic) | ✅ |
| 6.6 | Source KPI Option B (Linky) | ✅ |
| 8.1 | Logs prewarm structurés | ✅ |
| 8.2 | Logs runner (tick, context) | ✅ |

### 6.2 Évolutions post-spec (alignement Linky)

- **Période YTD** : spec §6.3 indique `date_end=today`. Implémentation alignée sur Linky : dernier jour du mois courant pour correspondre à « Exercice à date ».
- **Company 0** : « Tout » dans Linky = `company_id=0`. Le runner pré-calculera 0 et 1 (ex. `sarl-la-platine:0,1`).
- **Bouton Rafraîchir** : spec §10 indique « pas de bouton refresh (v1) ». Restauré à la demande pour forcer une re-synthèse (`force_refresh=true`).
- **Bloc Données utilisées** : affichage en 2 colonnes, replié par défaut (`<details>`), badge de confiance dans le titre.
- **Résilience au refresh** : si cache navigateur valide et erreur (404, timeout) pendant le poll, on conserve le cache affiché sans afficher « Analyse expirée ».

### 6.3 Écarts mineurs

- **Prewarm** : mapping `date_debut` / `date_fin` → `date_start` / `date_end` (cohérent avec usage Linky).
- **Runner metrics** : pas de champ `formatted` sur les cards (DIVA n'en a pas besoin pour le hash).

---

## 7. Annexes

### 7.1 Arborescence des fichiers impliqués

```
units/
├── diva/
│   ├── cmd/diva-runner/main.go
│   ├── internal/handlers/explain_async.go
│   ├── internal/models/models.go
│   ├── internal/mistral/client.go
│   ├── internal/runner/
│   │   ├── config.go
│   │   ├── runner.go
│   │   ├── periods.go
│   │   ├── metrics.go
│   │   └── diva_client.go
│   ├── .env.example
│   ├── Dockerfile
│   └── docker-compose.yml
└── dorevia-linky/
    ├── app/api/diva/prewarm/route.ts
    ├── app/api/diva/explain/async/route.ts
    ├── app/api/diva/jobs/[contextHash]/route.ts
    ├── components/DivaFlashBlock.tsx
    └── components/DashboardWithFilters.tsx

sources/vault/migrations/
├── 025_create_diva_analysis.sql
└── 025b_create_diva_user.sql

scripts/
├── diagnostic_diva_async.sh
├── diagnostic_diva_analyse_expiree.sh
└── revue_diva_toutes_periodes.sh
```

### 7.2 Commandes utiles

```bash
# Diagnostic flux async
./scripts/diagnostic_diva_async.sh

# Diagnostic Analyse expiree (flux navigateur Tout + YTD ou mois)
./scripts/diagnostic_diva_analyse_expiree.sh [ytd|1..12] [ANNEE]

# Revue toutes les periodes (13 : YTD + 12 mois)
./scripts/revue_diva_toutes_periodes.sh 2026

# Déploiement complet (Mistral + DIVA + Linky)
./scripts/redeploy_diva_stack.sh --linky

# Démarrer DIVA + runner avec Postgres (depuis units/diva, .env présent)
cd units/diva && docker compose up -d diva diva-runner
```

---

## 8. Dépannage « Analyse expirée »

### Script dédié

`./scripts/diagnostic_diva_analyse_expiree.sh` reproduit le flux navigateur exact (Tout, YTD 2026) via Linky. Si le script renvoie 200/202 mais le navigateur 404 :

- **Timezone / période** : le `period` côté client vient de `new Date()` dans le navigateur ; vérifier que `from`/`to` correspondent au YTD attendu.
- **company_id** : « Tout » doit envoyer `0` ; vérifier le select.
- **Rebuild Linky** : `docker build -t dorevia/linky:latest units/dorevia-linky && docker compose up -d --force-recreate linky`

### Robustesse client (DivaFlashBlock)

Retry avec `force_refresh: true` en cas de 404/500, délai 300 ms avant le premier poll, message « Cliquez sur Rafraîchir ».

---

## 9. Addendum — Synthèse ciblée par carte (post warmup)

### 9.1 Contexte

Le bloc DIVA apparaît désormais sur **chaque vue détaillée** (Trésorerie, Cash, Points de vente, etc.), pas seulement sur le cockpit. Pour éviter qu'il commente les 8 KPI quand l'utilisateur consulte une seule carte, une **synthèse ciblée** a été ajoutée.

### 9.2 API DIVA — `focus_card`

| Élément | Détail |
|---------|--------|
| **Options.FocusCard** | `focus_card` (string) : clé de la carte à cibler (ex. `cash`, `pos_shops`) |
| **Context hash** | Inclut `focus_card` → cache distinct par carte |
| **Mistral** | Quand `focus_card` présent, prompt adapté : headline sur cet indicateur uniquement |

### 9.3 Linky — Focus effectif

| Source | Focus passé à DIVA |
|-------|-------------------|
| **Clic tuile** (ex. Cash) | `focusedCardId` → `cash` |
| **Menu « Points de vente »** | `effectiveFocusCardId` → `pos_shops` |
| **Menu « Cash »** | `effectiveFocusCardId` → `cash` |
| **Menu « Business »** | `effectiveFocusCardId` → `business` |
| **Menu « Corrections »** | `effectiveFocusCardId` → `credit_notes` |
| **Cockpit** (grille) | pas de focus → synthèse globale |

### 9.4 Correctifs techniques

| Correctif | Fichier | Description |
|-----------|---------|-------------|
| **sha256: dans URL** | `app/api/diva/jobs/[contextHash]/route.ts` | Strip préfixe avant appel DIVA (routeur Fiber) |
| **effectiveFocusCardId** | `DashboardWithFilters.tsx` | Dérive le focus depuis `viewMode` quand pas de clic tuile |

### 9.5 Limitation

DIVA reçoit uniquement les **8 KPI agrégés**. Pour les vues détaillées (ex. POS avec Comptoir La Platine, Sweet Manihot), la synthèse porte sur l'agrégat (ex. 4 213,20 € total), pas sur le détail par point de vente. Une évolution future pourrait passer ces données à DIVA.

---

## 10. Architecture macro vs spécialisé (prompts distincts)

### 10.1 Problème initial

L'architecture antérieure utilisait un **même prompt système** pour :
- **Cockpit** : vue d'ensemble des 8 KPI, relations entre indicateurs.
- **Carte détaillée** : focus sur un seul axe (Cash, POS, etc.).

Conséquence : réponses trop similaires, même en mode carte. L'instruction utilisateur seule (filtrage des cartes + "concentre-toi sur cet indicateur") ne suffisait pas.

### 10.2 Solution — prompts séparés

| Mode | Prompt système | Sélection |
|------|----------------|-----------|
| **Macro (cockpit)** | `systemPromptMacro` | quand `focus_card` est vide |
| **Spécialisé (carte)** | `systemPromptSpecialized` | quand `focus_card` est fourni |

### 10.3 Macro — vue d'ensemble

- **Objectif** : mettre en récit les 8 indicateurs, les relier entre eux, décrire la situation globale.
- **headline** : 3–5 phrases, citer les montants, mentionner les absences de données.
- **what_i_see** : une ligne par indicateur fourni (jusqu'à 8).
- **Ton** : synthèse narrative, fluide, professionnelle.

### 10.4 Spécialisé — analyse par axe

- **Objectif** : analyser UN SEUL indicateur affiché sur une carte détaillée.
- **MODE SPÉCIALISÉ** : aucun lien vers les autres axes (trésorerie, business, taxes…). Contexte étroit.
- **headline** : 2–4 phrases max, uniquement sur l'indicateur fourni. Max 500 caractères.
- **what_i_see** : une seule ligne.
- **Ton** : focalisé, sobre, pas de synthèse macro.

### 10.5 Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `units/diva/internal/mistral/client.go` | `systemPromptMacro`, `systemPromptSpecialized`, choix selon `focusCard`, user prompt adapté |

---

**Fin du rapport.**

# Rapport d'analyse — Alignement DLP avec la plateforme Dorevia

**Date :** 2026-02-23  
**Référence :** SPEC_DLP_v0.3.md, PLAN_IMPLEMENTATION_DLP_v0.3_SCRUM.md  
**Objectif :** Identifier les patterns existants et les écarts DLP pour aligner l'implémentation

---

## 1. bin/dorevia.sh — Orchestration des units

### 1.1 Commandes et flux

| Commande | Rôle |
|----------|------|
| `gateway up/status/down/reload/aggregate` | Caddy global : `units/gateway`, agrégation des Caddyfiles rendus |
| `platform up/status/down/destroy <tenant>` | Services partagés (DVIG, Vault) : `tenants/<tenant>/platform/` |
| `app up/status/down/reset/destroy <univers> <env> <tenant>` | Apps par univers (odoo, n8n, suitecrm, sylius, ui) |
| `validate <tenant>` | Validation manifest via `lib/validate.sh` |
| `render <tenant> --env <env>` | Génération artefacts : Caddyfile, docker-compose platform, docker-compose app par univers |
| `apply <tenant> --env <env>` | Déploiement : platform → apps → optionnel gateway aggregate |

### 1.2 Units gérées

**Platform** (déclarées dans `units.platform` du manifest) :
- `dvig`, `vault`, `postgres` — générés par `render_platform_compose.sh`
- Conteneurs : `dvig-${tenant}`, `vault-${tenant}`, `vault-db-${tenant}`, `dvig-db-${tenant}`

**Apps** (déclarées dans `units.<univers>`) :
- **odoo** : odoo, postgres  
- **n8n** : n8n, postgres  
- **suitecrm** : suitecrm, mariadb  
- **sylius** : sylius, postgres  
- **ui** : appsmith, linky — générés par `render_app_compose.sh`

**Units non orchestrées par dorevia.sh** :
- **DIVA** : `units/diva/docker-compose.yml` — démarré manuellement, réseau interne (`diva:8010`), pas d'entrée Caddy (Linky appelle en interne)
- **Gateway** : `units/gateway` — démarrée manuellement via `gateway up`

### 1.3 Points critiques pour DLP

- Le script **ne démarre pas les units** `units/dlp`, `units/diva` : démarrage manuel ou intégration à préciser.
- `_get_platform_container_name()` ne connaît que `dvig`, `vault`, `vault-db`.
- `check_platform_up()` vérifie uniquement dvig/vault selon `units.platform`.
- **Pas de commande dédiée** pour démarrer une unit standalone (ex. DLP, DIVA).

---

## 2. lib/render/ — Génération des docker-compose

### 2.1 render_platform_compose.sh

**Usage :** `render_platform_compose.sh <tenant> <env>`

**Logique :**
- Lit `tenants/<tenant>/state/manifest.json`
- Extrait `units.platform[]` — si vide ou absent, exit 0 (pas de génération)
- Pour chaque unit : `dvig` → service dvig + dvig-db ; `vault` → vault + vault-db
- Variables : `IMAGE_DVIG`, `IMAGE_VAULT`, `IMAGE_POSTGRES`, `secrets_refs.dvig_tokens`, `secrets_refs.vault_db_password`
- Sortie : `tenants/<tenant>/rendered/<env>/platform/docker-compose.yml`

**Pattern pour ajouter une unit platform (ex. DLP) :**
1. Ajouter `"dlp"` dans l'enum `units.platform` du schéma
2. Dans le script, bloc conditionnel : `if echo "$UNITS_PLATFORM" | grep -q "^dlp$"; then ... fi`
3. Définir `IMAGE_DLP` depuis `manifest.images.dlp`
4. Générer service + volumes si BDD dédiée

### 2.2 render_app_compose.sh

**Usage :** `render_app_compose.sh <tenant> <univers> <env>`

**Logique :**
- Lit `units.<univers>[]` pour savoir quels services générer
- **Univers ui** : si `linky` ∈ `units.ui` → service linky avec `VAULT_URL`, `TENANT_ID`, `DIVA_URL`, `DVIG_URL`, `COMPANY_DISPLAY_NAMES`
- Variables manifest : `linky_vault_url`, `linky_dvig_url`, `linky_company_display_names`, `images.linky`

**Pattern pour DLP dans l'univers ui :**
- Ajouter `DLP_URL` dans l'environnement du service Linky (comme `DIVA_URL`)
- Option : `linky_dlp_url` dans le manifest, fallback `http://dlp:8020`

### 2.3 render_caddyfile.sh

**Usage :** `render_caddyfile.sh <tenant> <env>`

**Logique :**
- Génère un bloc par univers (odoo, n8n, ui, etc.) → `reverse_proxy <container>:<port>`
- Génère blocs `dvig.<tenant>.<domain>`, `vault.<tenant>.<domain>` — 1 par tenant (sans env)
- **Pas de bloc DIVA** : DIVA n'est pas exposée via Caddy (réseau interne uniquement)

**Pattern pour DLP :**
- **Option A** : DLP en réseau interne (comme DIVA) → pas de route Caddy, Linky appelle `http://dlp:PORT`
- **Option B** : DLP exposée par tenant → ajouter bloc `dlp.<tenant>.<domain> { reverse_proxy dlp-${tenant}:8080 }` si `dlp` ∈ `units.platform`

---

## 3. Structure des tenants

### 3.1 Arborescence

```
tenants/<tenant>/
├── state/
│   └── manifest.json          # Source de vérité
├── rendered/<env>/
│   ├── caddy/Caddyfile
│   ├── platform/docker-compose.yml
│   ├── odoo/docker-compose.yml
│   ├── ui/docker-compose.yml
│   └── ...
├── platform/
│   └── docker-compose.yml     # Copié depuis rendered au apply
├── apps/
│   ├── odoo/<env>/docker-compose.yml
│   ├── ui/<env>/docker-compose.yml
│   └── ...
└── secrets/
    └── dvig.tokens.yml
```

### 3.2 Intégration diva/vault/linky

- **Vault** : unit platform, conteneur `vault-${tenant}`, port 8080, utilisé par Odoo (vault connector) et Linky
- **DVIG** : unit platform, conteneur `dvig-${tenant}`, port 8080, utilisé par Odoo (ingest) et Linky (vault-health fallback)
- **Linky** : unit app (univers ui), conteneur `linky_<env>_<tenant}`, port 3000, reçoit `VAULT_URL`, `DVIG_URL`, `DIVA_URL` en env
- **DIVA** : unit standalone `units/diva`, conteneur `diva`, port 8010, **non généré** par render — Linky utilise `DIVA_URL` (résolution par nom Docker `diva`)

### 3.3 Pattern pour ajouter l’unit DLP

**Choix d’architecture (aligné DIVA) :**
- DLP = **unit standalone** dans `units/dlp/` (Go ou Python)
- Déployé via `docker compose -f units/dlp/docker-compose.yml up -d` (manuel ou script dédié)
- Réseau `dorevia-network`, nom conteneur `dlp` ou `dlp-${tenant}` selon multi-tenant
- Linky reçoit `DLP_URL` (ex. `http://dlp:8080`)

**OU** (aligné Vault/DVIG) :
- DLP = **unit platform** → `units.platform: ["dvig", "vault", "dlp"]`
- Généré par `render_platform_compose.sh`, conteneur `dlp-${tenant}`
- Nécessite adaptation du script et du schéma

---

## 4. Manifest / state

### 4.1 Schéma attendu (schemas/manifest.schema.json)

```json
{
  "tenant_id": "core",
  "universes": ["odoo", "n8n", "ui", ...],
  "environments": ["lab", "stinger", "prod"],
  "domain_mode": "saas",
  "units": {
    "platform": ["dvig", "vault"],
    "odoo": ["odoo", "postgres"],
    "ui": ["linky"]  // ou ["appsmith"]
  },
  "images": { "dvig": "...", "vault": "...", "linky": "..." },
  "secrets_refs": { "dvig_tokens": "tenants/core/secrets/dvig.tokens.yml" }
}
```

### 4.2 Écarts schéma vs usage

- Le schéma **n’inclut pas `units.ui`** — présent dans les manifests et `render_app_compose.sh`
- Le schéma **n’inclut pas `universes.ui`** — l’enum est `["odoo","pos","sylius","suitecrm","n8n"]` alors que `ui` est utilisé
- `units.platform` : enum `["dvig","vault","postgres"]` — pas de `dlp`

### 4.3 Recommandations pour DLP

1. **Schéma :** ajouter `"dlp"` dans `units.platform.items.enum` si DLP est une unit platform
2. **Manifest :** ajouter `images.dlp`, `linky_dlp_url` (optionnel) si DLP exposée
3. **Tenant :** pour un tenant avec DLP, `units.platform` peut rester `["dvig","vault"]` si DLP est standalone ; sinon `["dvig","vault","dlp"]`

---

## 5. dorevia_vault_connector — Pattern pour dorevia_dlp_connector

### 5.1 Structure du module

```
dorevia_vault_connector/
├── __manifest__.py
├── models/
│   ├── account_move.py       # Hook write/action_post sur factures
│   ├── account_payment.py    # Hook action_post sur paiements
│   ├── dorevia_dvig_service.py  # Service technique (trigger_worker, retry)
│   └── dorevia_vault_metric.py
├── controllers/
├── data/
│   ├── ir_cron.xml
│   ├── ir_actions_server.xml
│   └── ir_model_data.xml
├── views/
├── security/
└── tests/
```

### 5.2 ir.config_parameter utilisés

| Clé | Usage |
|-----|-------|
| `dorevia.dvig.url` | URL DVIG (ingest, outbox) |
| `dorevia.dvig.token` | Token Bearer |
| `dorevia.dvig.source` | Source (ex. odoo.lab.core) |
| `dorevia.dvig.internal.url` | URL endpoint internal/outbox/process |
| `dorevia.dvig.internal.token` | Token interne (outbox) |
| `dorevia.vault.url` | URL Vault (proof, aggregations) |
| `dorevia.vault.tenant` | Tenant |
| `dorevia.vault.max_attempts_proof` | Seuils retry |
| `dorevia.debug.actions` | Debug |

**Note :** Pas de fichier XML `ir_config_parameter` — les valeurs sont configurées manuellement ou par script.

### 5.3 Pattern pour dorevia_dlp_connector

**__manifest__.py :**
```python
'depends': ['project', 'hr_timesheet'],
'data': ['security/ir.model.access.csv', ...],
```

**Modèle étendu :** `account.analytic.line` (timesheet)

**Hooks :** `write` ou signal/cron sur transition « validé »

**ir.config_parameter :**
- `dorevia.dlp.service.url` — URL du service DLP
- `dorevia.dlp.tenant.id` — tenant UUID ou slug
- `dorevia.dlp.auth.token` — token si requis

**Service technique :** modèle `dorevia.dlp.service` pour centraliser l’appel HTTP (comme `dorevia_dvig_service`)

---

## 6. units/dorevia-linky — Routes API et cards

### 6.1 Structure des routes API

| Route | Rôle | Backend |
|-------|------|---------|
| `/api/dashboard-metrics` | Agrégation KPIs | Vault (multi-fetch) |
| `/api/vault-health` | Indicateur confiance | Vault `/ui/system/vault-health` |
| `/api/diva/explain` | Synthèse DIVA | DIVA POST /diva/explain |
| `/api/diva/explain/async` | Async | DIVA |
| `/api/diva/refresh`, prewarm, insight, jobs | DIVA | DIVA |
| `/api/treasury`, payments-in, payments-out, sales, purchases, etc. | Données métier | Vault |
| `/api/companies`, `/api/tenant` | Métadonnées | Vault / cockpit |
| `/api/platform/status` | Santé plateforme | — |

### 6.2 Pattern de proxy

**Exemple vault-health :**
```typescript
const VAULT_URL = process.env.VAULT_URL || "http://localhost:8080";
const url = `${VAULT_URL}/ui/system/vault-health?tenant=${tenant}`;
const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
return NextResponse.json(await res.json());
```

**Exemple diva/explain :**
```typescript
const DIVA_URL = process.env.DIVA_URL || "http://diva:8010";
const res = await fetch(`${DIVA_URL}/diva/explain`, { method: "POST", body: JSON.stringify(divaBody) });
```

### 6.3 Pattern pour route proxy DLP

Créer `app/api/dlp/energy-summary/route.ts` :

```typescript
const DLP_URL = process.env.DLP_URL || "http://dlp:8020";
export async function GET(request: NextRequest) {
  const tenant = searchParams.get("tenant") ?? DEFAULT_TENANT;
  const period_days = searchParams.get("period_days") ?? "90";
  const url = `${DLP_URL}/api/v1/dlp/energy-summary?tenant=${tenant}&period_days=${period_days}`;
  const res = await fetch(url, { cache: "no-store" });
  return NextResponse.json(await res.json());
}
```

Et des routes proxy pour CRUD : `/api/dlp/dlps`, `/api/dlp/perimeters`, `/api/dlp/project-perimeter-map`.

### 6.4 IconGrid et DashboardWithFilters

**IconGrid :**
- `GRID_ITEMS` : tableau de `{ id: CardId, label, Icon }`
- `CardId` = `"treasury" | "cash" | "business" | "taxes" | "credit_notes" | "refunds" | "pos_shops" | "pos_z"`
- Pour DLP : ajouter `"strategic_energy"` dans `CardId` et dans `GRID_ITEMS`

**DashboardWithFilters :**
- Gère `focusedCardId` pour afficher la card détaillée
- `showCard()`, `showWhenFocused()` pour visibilité
- `StrategicEnergyCard` : nouveau composant à créer (pattern `TreasuryCardWithPolling`)

**CardIcons :**
- Ajouter `IconStrategicEnergy` dans `CardIcons.tsx`

**DashboardMetricsResponse :**
- Optionnel : ajouter `strategic_energy?: KpiMetric` si la card utilise les métriques agrégées ; sinon fetch dédié dans la card.

---

## 7. schemas/manifest.schema.json

### 7.1 Champs units actuels

- `platform` : enum `["dvig","vault","postgres"]`
- `odoo`, `pos`, `sylius`, `suitecrm`, `n8n` : définis
- **`ui` absent** du schéma (utilisé dans render et manifests)

### 7.2 Extensions nécessaires pour DLP

1. **units.platform** : ajouter `"dlp"` si DLP est une unit platform
2. **units.ui** : ajouter la propriété (actuellement manquante) :
   ```json
   "ui": {
     "type": "array",
     "items": { "type": "string", "enum": ["linky", "appsmith"] },
     "uniqueItems": true
   }
   ```
3. **universes** : ajouter `"ui"` dans l'enum
4. **images** : ajouter `"dlp"`, `"linky"` (linky absent du schéma)

---

## 8. Résumé des patterns identifiés

| Domaine | Pattern |
|---------|---------|
| **Unit platform** | Déclarée dans `units.platform`, générée par `render_platform_compose.sh`, conteneur `unit-${tenant}` |
| **Unit app** | Déclarée dans `units.<univers>`, générée par `render_app_compose.sh` |
| **Unit standalone** | Dossier `units/<name>/`, docker-compose propre, démarrée manuellement (ex. DIVA) |
| **Connecteur Odoo** | Module avec `ir.config_parameter`, modèle service technique, hooks sur modèles métier |
| **Proxy Linky** | Route `/api/<service>/<path>` → fetch vers `process.env.<SERVICE>_URL` |
| **Card Linky** | IconGrid (tuile) + composant détaillé (ex. TreasuryCardWithPolling) + données depuis API |

---

## 9. Écarts DLP vs existant

| Écart | Détail |
|-------|--------|
| **Service DLP** | Nouveau service Go/Python, pas d’équivalent côté plateforme |
| **Manifest** | Pas de `units.platform.dlp` ni `images.dlp` |
| **Render** | Aucun script ne génère un service DLP |
| **Caddy** | Pas de route DLP (DIVA non exposée, même pattern possible) |
| **Odoo** | Nouveau module `dorevia_dlp_connector` (pattern vault_connector) |
| **Linky** | Pas de route proxy DLP, pas de tuile `strategic_energy`, pas de `StrategicEnergyCard` |
| **Schéma** | Pas de `dlp` dans les enums |

---

## 10. Recommandations concrètes

### 10.1 Fichiers à créer

| Fichier | Action |
|---------|--------|
| `units/dlp/` | Créer unit (Dockerfile, docker-compose.yml, migrations, API) |
| `units/odoo/custom-addons/dorevia_dlp_connector/` | Nouveau module Odoo (pattern vault_connector) |
| `units/dorevia-linky/app/api/dlp/energy-summary/route.ts` | Proxy energy-summary |
| `units/dorevia-linky/app/api/dlp/dlps/route.ts` | Proxy CRUD DLP (GET, POST) |
| `units/dorevia-linky/app/api/dlp/perimeters/route.ts` | Proxy CRUD perimeters |
| `units/dorevia-linky/app/api/dlp/project-perimeter-map/route.ts` | Proxy mapping |
| `units/dorevia-linky/components/StrategicEnergyCard.tsx` | Card Énergie stratégique |
| `units/dorevia-linky/components/CardIcons.tsx` | Ajouter `IconStrategicEnergy` |

### 10.2 Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `lib/render/render_app_compose.sh` | Ajouter `DLP_URL` dans l’env du service Linky (ligne ~319) |
| `units/dorevia-linky/components/IconGrid.tsx` | Ajouter `strategic_energy` à `CardId`, `GRID_ITEMS` |
| `units/dorevia-linky/components/DashboardWithFilters.tsx` | Intégrer `StrategicEnergyCard`, gérer `focusedCardId === "strategic_energy"` |
| `units/dorevia-linky/app/api/dashboard-metrics/route.ts` | Optionnel : inclure `strategic_energy` si agrégation |
| `schemas/manifest.schema.json` | Ajouter `units.ui`, `universes.ui`, `images.linky`, `images.dlp` (si DLP platform) |

### 10.3 Conventions à appliquer

1. **DLP unit** : Suivre le pattern DIVA (standalone) — `units/dlp/`, pas de génération render, `DLP_URL` dans Linky
2. **Connecteur Odoo** : `ir.config_parameter` `dorevia.dlp.*`, modèle `dorevia.dlp.service`, hook sur `account.analytic.line`
3. **Proxy Linky** : `process.env.DLP_URL`, timeout 5–15 s, cache `no-store`
4. **Card** : Même structure que les autres (polling optionnel, disclaimer SPEC §6)
5. **Auth** : Si token requis, aligner sur DVIG (header Bearer) ou API key

### 10.4 Ordre d’implémentation suggéré

1. **Phase 1** : Créer `units/dlp/` (squelette, health, migrations)
2. **Phase 2** : API CRUD DLP côté service
3. **Phase 3** : API timesheet-validated + hits
4. **Phase 4** : API energy-summary
5. **Phase 5** : Routes proxy Linky + StrategicEnergyCard + IconGrid
6. **Phase 6** : Module Odoo dorevia_dlp_connector
7. **Phase 7** : Modifier render_app_compose.sh pour injecter `DLP_URL` dans Linky

---

## 11. Actions appliquées (2026-02-23)

| Fichier | Modification |
|---------|--------------|
| `lib/render/render_app_compose.sh` | Extraction `linky_dlp_url` du manifest ; injection `DLP_URL` dans l'env du service Linky (fallback `http://dlp:8020`) |

---

*Rapport généré à partir de l’analyse des fichiers `bin/dorevia.sh`, `lib/render/*.sh`, `tenants/*/state/manifest.json`, `schemas/manifest.schema.json`, `dorevia_vault_connector`, `dorevia-linky`.*

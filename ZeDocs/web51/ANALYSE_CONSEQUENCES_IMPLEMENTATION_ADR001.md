# Analyse des conséquences d’implémentation — ADR-001 (Linky → Vault only) — v1.0

**Date :** 2026-03-15  
**Référence :** ADR-001 — Linky : Vault comme gateway unique (ERP-agnostique).  
**Objectif :** Inventorier les écarts actuels et les impacts concrets sur le code (Vault, Linky) pour respecter la décision d’architecture.

**Principe :** L’ADR-001 n’est pas seulement une doctrine d’architecture ; il implique une **migration concrète des dépendances Linky** vers des **endpoints Vault unifiés**.

---

## 1. Inventaire des écarts actuels

Toute dépendance directe de Linky à un service aval (DLP, DIVA) est **interdite** par l’ADR-001. Ci-dessous la liste exhaustive des points du code qui appellent aujourd’hui DLP ou DIVA **sans passer par le Vault**.

---

### 1.1 DLP — appels directs depuis Linky

| Fichier Linky | Route Linky | Appel actuel | Méthode | Chemin cible DLP |
|---------------|-------------|--------------|---------|------------------|
| `app/api/dashboard-metrics/route.ts` | (intégré) | `fetch(DLP_URL + …)` | GET | `/api/v1/dlp/energy-summary` |
| `app/api/dlp/energy-summary/route.ts` | `GET /api/dlp/energy-summary` | `fetch(DLP_URL + …)` | GET | `/api/v1/dlp/energy-summary` |
| `app/lib/dlpClient.ts` | — | `dlpFetch()` → DLP_URL | GET/POST/etc. | Base pour toutes les routes DLP ci‑dessous |
| `app/api/dlp/companies/route.ts` | `GET/POST /api/dlp/companies` | `dlpFetch("/api/v1/companies", …)` | GET, POST | `/api/v1/companies` |
| `app/api/dlp/dlps/route.ts` | `GET/POST /api/dlp/dlps` | `dlpFetch("/api/v1/dlps", …)` | GET, POST | `/api/v1/dlps` |
| `app/api/dlp/dlps/[id]/route.ts` | `GET/PATCH /api/dlp/dlps/:id` | `dlpFetch("/api/v1/dlps/:id", …)` | GET, PATCH | `/api/v1/dlps/:id` |
| `app/api/dlp/perimeters/route.ts` | `GET/POST /api/dlp/perimeters` | `dlpFetch("/api/v1/perimeters", …)` | GET, POST | `/api/v1/perimeters` |
| `app/api/dlp/perimeters/[id]/route.ts` | `PATCH /api/dlp/perimeters/:id` | `dlpFetch("/api/v1/perimeters/:id", …)` | PATCH | `/api/v1/perimeters/:id` |
| `app/api/dlp/project-perimeter-map/route.ts` | `GET/POST /api/dlp/project-perimeter-map` | `dlpFetch("/api/v1/project-perimeter-map", …)` | GET, POST | `/api/v1/project-perimeter-map` |
| `app/api/dlp/project-perimeter-map/[id]/route.ts` | `DELETE /api/dlp/project-perimeter-map/:id` | `dlpFetch("/api/v1/project-perimeter-map/:id", …)` | DELETE | `/api/v1/project-perimeter-map/:id` |
| `app/api/dlp/decisions/route.ts` | `POST /api/dlp/decisions` | `dlpFetch("/api/v1/companies", …)` + `dlpFetch("/api/v1/dlps", …)` | GET (interne), POST | `/api/v1/companies`, `/api/v1/dlps` |
| `app/api/dlp/sync-companies/route.ts` | `POST /api/dlp/sync-companies` | `fetch(/api/companies)` (Vault) + `dlpFetch("/api/v1/companies", …)` | GET, POST | `/api/companies` (déjà Vault) ; `/api/v1/companies` (DLP) |

**Variables d’environnement Linky concernées :** `DLP_URL` (et éventuellement timeout).  
**Client partagé :** `app/lib/dlpClient.ts` — toute route qui utilise `dlpFetch` appelle DLP directement.

---

### 1.2 DIVA — appels directs depuis Linky

| Fichier Linky | Route Linky | Appel actuel | Méthode | Chemin cible DIVA |
|---------------|-------------|--------------|---------|-------------------|
| `app/api/dashboard-metrics/route.ts` | (aucun appel DIVA dans dashboard-metrics) | — | — | — |
| `app/api/diva/insight/route.ts` | `GET /api/diva/insight` | `fetch(DIVA_URL + "/diva/insights?…")` | GET | `/diva/insights` |
| `app/api/diva/explain/route.ts` | `POST /api/diva/explain` | `fetch(DIVA_URL + "/diva/explain", { body })` | POST | `/diva/explain` |
| `app/api/diva/explain/async/route.ts` | `POST /api/diva/explain/async` | `fetch(DIVA_URL + "/diva/explain/async", { body })` | POST | `/diva/explain/async` |
| `app/api/diva/prewarm/route.ts` | `POST /api/diva/prewarm` | `fetch(DIVA_URL + "/diva/generate", { body })` | POST | `/diva/generate` |
| `app/api/diva/refresh/route.ts` | `POST /api/diva/refresh` | `fetch(DIVA_URL + "/diva/generate", { body })` | POST | `/diva/generate` |
| `app/api/diva/jobs/[contextHash]/route.ts` | `GET /api/diva/jobs/:contextHash` | `fetch(DIVA_URL + "/diva/jobs/:contextHash")` | GET | `/diva/jobs/:contextHash` |

**Variables d’environnement Linky concernées :** `DIVA_URL`, `DIVA_TIMEOUT_MS`, `DIVA_PREWARM_TIMEOUT_MS`, `DIVA_REFRESH_TIMEOUT_MS`, `DIVA_PREWARM_ENABLED`.

**Composants front qui appellent ces routes :** `DivaFlashBlock.tsx` (insight, prewarm), et tout consommateur de explain / refresh / jobs.

---

## 2. Impact côté Vault

Aujourd’hui le Vault **n’expose aucune route** vers DLP ni vers DIVA. Pour que Linky respecte l’ADR-001 sans changer le comportement fonctionnel, le Vault doit devenir le **seul point d’accès** (gateway) à DLP et DIVA pour Linky.

Le Vault doit exposer des **routes UI stables** pour Linky ; selon les cas, elles pourront **servir des données agrégées**, **proxifier un service aval** ou **orchestrer plusieurs services**. Il ne s’agit pas de réduire le Vault à un simple reverse proxy, mais d’en faire la **façade d’exposition unifiée** et le **contrat d’interface stable** (ADR-001).

### 2.1 Routes Vault à ajouter — DLP

Convention proposée : préfixe **`/ui/dlp/`** pour que Linky appelle `VAULT_URL + /ui/dlp/...`. En interne, le Vault appellera le service DLP (config `DLP_URL`) selon les besoins.

| Route Vault à exposer | Méthode | Comportement | Config Vault |
|------------------------|--------|--------------|--------------|
| `/ui/dlp/energy-summary` | GET | Gateway : appel DLP (query string) vers `DLP_URL/api/v1/dlp/energy-summary` | `DLP_URL`, optionnel `DLP_TIMEOUT_MS` |
| `/ui/dlp/companies` | GET, POST | Gateway vers `DLP_URL/api/v1/companies` (query ou body) | idem |
| `/ui/dlp/dlps` | GET, POST | Gateway vers `DLP_URL/api/v1/dlps` | idem |
| `/ui/dlp/dlps/:id` | GET, PATCH | Gateway vers `DLP_URL/api/v1/dlps/:id` | idem |
| `/ui/dlp/perimeters` | GET, POST | Gateway vers `DLP_URL/api/v1/perimeters` | idem |
| `/ui/dlp/perimeters/:id` | PATCH | Gateway vers `DLP_URL/api/v1/perimeters/:id` | idem |
| `/ui/dlp/project-perimeter-map` | GET, POST | Gateway vers `DLP_URL/api/v1/project-perimeter-map` | idem |
| `/ui/dlp/project-perimeter-map/:id` | DELETE | Gateway vers `DLP_URL/api/v1/project-perimeter-map/:id` | idem |

**Remarque :** Le chemin DLP côté service est `/api/v1/...` ; le Vault peut soit exposer `/ui/dlp/energy-summary` (et en interne appeler `DLP_URL + /api/v1/dlp/energy-summary`), soit exposer une structure miroir. L’important est que **Linky n’ait plus que VAULT_URL** et des chemins stables (ex. `/ui/dlp/...`).

### 2.2 Routes Vault à ajouter — DIVA

Même principe avec préfixe **`/ui/diva/`**.

| Route Vault à exposer | Méthode | Comportement | Config Vault |
|------------------------|--------|--------------|--------------|
| `/ui/diva/insights` | GET | Gateway : appel DIVA (query) vers `DIVA_URL/diva/insights` | `DIVA_URL`, `DIVA_TIMEOUT_MS`, etc. |
| `/ui/diva/explain` | POST | Gateway vers `DIVA_URL/diva/explain` (body) | idem |
| `/ui/diva/explain/async` | POST | Gateway vers `DIVA_URL/diva/explain/async` (body) | idem |
| `/ui/diva/generate` | POST | Gateway vers `DIVA_URL/diva/generate` (body) | idem |
| `/ui/diva/jobs/:contextHash` | GET | Gateway vers `DIVA_URL/diva/jobs/:contextHash` | idem |

Gestion des timeouts (Mistral long) : rester côté Vault (ex. 60 s pour explain, 120 s pour refresh) pour ne pas exposer DIVA directement à Linky.

### 2.3 Fichiers / packages Vault à créer ou modifier

- **Config :** Ajout dans la configuration du binaire Vault (env ou fichier) des clés `DLP_URL`, `DIVA_URL`, et timeouts optionnels.
- **Handlers :** Nouveaux handlers (ex. `internal/handlers/dlp_ui.go`, `internal/handlers/diva_ui.go`) ou sous‑packages dédiés qui :
  - lisent la requête entrante (query, body, path params),
  - appliquent les contraintes de gateway (2.4, 2.5) : headers, auth, erreurs normalisées,
  - appellent le service DLP ou DIVA avec la même méthode et le même corps/query,
  - renvoient le statut et le body de la réponse (ou erreurs stables 502/503 en cas d’échec aval).
- **Routes :** Enregistrement des routes sous `/ui/dlp/*` et `/ui/diva/*` dans le routeur (ex. `internal/server/` ou endroit où sont déclarées les routes UI).

### 2.4 Contraintes de gateway côté Vault

Lorsque le Vault appelle DLP ou DIVA en aval, les règles suivantes s’appliquent pour rester une **frontière de contrat** et non un simple tuyau :

- **Relayer les paramètres fonctionnels** nécessaires (`tenant`, `company_id`, query string, body) vers le service aval.
- **Propager les headers de corrélation / traçabilité** utiles (ex. `X-Request-ID`, `X-Tenant`) pour le diagnostic et les logs.
- **Ne pas relayer aveuglément** tous les headers entrants (sécurité et stabilité) ; limiter à ce qui est nécessaire pour l’appel aval.
- **Centraliser l’auth technique** vers DLP/DIVA côté Vault (tokens, API keys) ; Linky n’a pas à connaître les secrets des services aval.

### 2.5 Erreurs et robustesse

Le Vault reste la **frontière de robustesse** vis-à-vis de Linky. En cas de timeout, indisponibilité, erreur 4xx/5xx ou réponse non JSON du service aval (DLP/DIVA), le Vault doit :

- **renvoyer des réponses stables et observables** (ex. 502 Bad Gateway, 503 Service Unavailable, body d’erreur normalisé),
- **éviter de recoupler Linky** à la forme exacte des erreurs DLP/DIVA (pas de propagation brute des messages ou codes métier aval si cela fragilise le client).

Règle : *Vault renvoie des erreurs stables et observables à Linky, même si le service aval varie.*

---

## 3. Impact côté Linky

### 3.1 Suppression des dépendances directes

- **Variables d’environnement à ne plus utiliser dans Linky :**  
  `DLP_URL`, `DIVA_URL`, `DIVA_TIMEOUT_MS`, `DIVA_PREWARM_TIMEOUT_MS`, `DIVA_REFRESH_TIMEOUT_MS`, `DIVA_PREWARM_ENABLED`.  
  Après mise en œuvre, Linky ne connaît que **`VAULT_URL`** (et `TENANT_ID`, etc.) pour ces flux.

- **Fichiers à modifier (remplacer l’appel direct par un appel au Vault) :**

| Fichier | Modification |
|---------|--------------|
| `app/lib/dlpClient.ts` | Remplacer l’usage de `DLP_URL` par `VAULT_URL` et préfixer les chemins par `/ui/dlp/` (ex. `dlpFetch("/api/v1/companies", …)` → appel à `VAULT_URL + "/ui/dlp/companies"` avec les mêmes params). Ou supprimer `dlpClient` et utiliser un fetch générique vers Vault. |
| `app/api/dlp/energy-summary/route.ts` | Au lieu de `fetch(DLP_URL + "/api/v1/dlp/energy-summary?…")`, appeler `fetch(VAULT_URL + "/ui/dlp/energy-summary?…")` (ou passer par une route Linky qui proxy vers Vault ; dans les deux cas, plus d’usage de `DLP_URL`). |
| `app/api/dashboard-metrics/route.ts` | Remplacer l’appel à `DLP_URL` pour la tuile strategic_energy par un appel à `VAULT_URL + "/ui/dlp/energy-summary?…"`. |
| Tous les fichiers sous `app/api/dlp/*` | S’ils continuent d’exister comme routes Linky (proxy léger), ils doivent appeler **uniquement** le Vault (même chemin et paramètres que aujourd’hui côté client, mais côté serveur Linky → Vault au lieu de Linky → DLP). |
| Tous les fichiers sous `app/api/diva/*` | Idem : remplacer `DIVA_URL` par `VAULT_URL` et préfixe `/ui/diva/...` (ex. `VAULT_URL + "/ui/diva/insights"`, `"/ui/diva/generate"`, etc.). |

### 3.2 Cas particulier : `sync-companies`

`app/api/dlp/sync-companies/route.ts` appelle déjà **Vault** (via `fetch(/api/companies)` = route Linky qui proxy vers Vault) pour la liste des sociétés, puis appelle **DLP** pour créer les sociétés manquantes. Après mise en œuvre :

- La lecture des sociétés reste via Linky → Vault (`/api/companies` → Vault).
- Les appels vers DLP (GET/POST companies) doivent passer par le Vault : Linky appellera par exemple `VAULT_URL + "/ui/dlp/companies"` (GET puis POST) au lieu de `dlpFetch("/api/v1/companies", …)`. Aucune référence à `DLP_URL` dans ce fichier.

### 3.3 Composants front

Aucun changement d’URL côté front **si** les routes Linky conservent les mêmes paths (`/api/dlp/...`, `/api/diva/...`). Le front continue d’appeler `fetch("/api/dlp/energy-summary?…")`, `fetch("/api/diva/insight?…")`, etc. ; seules les **routes serveur** Linky changent (elles appellent le Vault au lieu de DLP/DIVA). Si l’on décide de faire appeler le Vault **directement** par le front (sans passer par les routes Next.js), il faudrait alors exposer le Vault au navigateur et adapter les URLs côté front — option plus lourde ; l’option « routes Linky = proxy vers Vault » est la plus simple et garde le contrat front inchangé.

---

## 4. Synthèse des impacts

| Zone | Action |
|------|--------|
| **Vault** | Ajout config DLP_URL, DIVA_URL (+ timeouts). Nouveaux handlers gateway et routes `/ui/dlp/*`, `/ui/diva/*` ; contraintes headers/auth/traçabilité et erreurs normalisées. |
| **Linky — env** | Suppression de l’usage de `DLP_URL`, `DIVA_URL` et variables DIVA pour l’appel aux services ; seul `VAULT_URL` reste utilisé pour ces flux. |
| **Linky — api/dlp/*** | Chaque route appelle le Vault (VAULT_URL + chemin miroir, ex. `/ui/dlp/energy-summary`, `/ui/dlp/companies`, …) au lieu de DLP. |
| **Linky — api/diva/*** | Chaque route appelle le Vault (VAULT_URL + `/ui/diva/insights`, `/ui/diva/generate`, …) au lieu de DIVA. |
| **Linky — dashboard-metrics** | Tuile strategic_energy : appel à Vault `/ui/dlp/energy-summary` au lieu de DLP_URL. |
| **Linky — lib/dlpClient.ts** | Réécriture pour pointer vers VAULT_URL + `/ui/dlp/...` (ou remplacement par des appels directs à VAULT_URL dans chaque route). |

---

## 5. Ordre de mise en œuvre recommandé

### Palier 1 — Conformité ADR minimale

Objectif : **conformité architecturale sur les écrans visibles** (tuile Énergie stratégique, bloc DIVA, grille synthèse), sans attendre tout l’outillage admin DLP.

1. **Vault :** Config `DLP_URL` + route **`/ui/dlp/energy-summary`** (gateway vers DLP).
2. **Vault :** Config `DIVA_URL` + routes **`/ui/diva/insights`**, **`/ui/diva/generate`**, **`/ui/diva/jobs/:contextHash`** (et si besoin explain / explain/async pour le bloc visible).
3. **Linky :** Modifier `dashboard-metrics` (tuile strategic_energy) → appel à `VAULT_URL + "/ui/dlp/energy-summary"`.
4. **Linky :** Modifier `app/api/dlp/energy-summary/route.ts` et `app/lib/dlpClient.ts` (ou uniquement les routes critiques) pour appeler le Vault ; modifier `app/api/diva/*` (insight, prewarm, refresh, jobs) pour appeler le Vault.
5. **Recette minimale :** Tuile Énergie stratégique, bloc DIVA (insight, prewarm), grille dashboard — tout fonctionne avec Linky ne connaissant que `VAULT_URL` pour ces flux ; **suppression effective de `DLP_URL` et `DIVA_URL`** dans les chemins critiques.

**DoD Palier 1 :** Aucune lecture de `DLP_URL` ni `DIVA_URL` dans les chemins de code utilisés par la grille et le bloc DIVA ; tuile DLP et bloc DIVA affichés correctement via Vault.

### Palier 2 — Convergence complète

Objectif : **suppression totale** des dépendances directes Linky → DLP/DIVA et nettoyage des routes admin / clients partagés.

6. **Vault :** Routes `/ui/dlp/*` restantes (companies, dlps, perimeters, project-perimeter-map, etc.).
7. **Linky :** Toutes les routes `app/api/dlp/*` (admin DLP, decisions, sync-companies) appellent le Vault ; `dlpClient.ts` pointe exclusivement vers VAULT_URL.
8. **Linky :** Suppression des variables d’environnement DLP et DIVA des runbooks et de la doc ; vérification qu’**aucun code** ne lit plus `DLP_URL` ni `DIVA_URL`.
9. **Recette complète :** Admin DLP, décisions, sync-companies, bloc DIVA (explain, refresh, jobs) — tout transite par le Vault ; critère de clôture : **Linky ne lit plus DLP_URL / DIVA_URL** (recherche code + env déploiement).

---

## 6. Références

- ADR-001 (ZeDocs/web51/ADR-001_LINKY_VAULT_GATEWAY_UNIQUE.md).
- NOTE_LINKY_VAULT_GATEWAY_UNIQUE_ERP_AGNOSTIQUE.md (état des lieux et proposition technique).
- Code : `units/dorevia-linky/app/api/dlp/*`, `app/api/diva/*`, `app/lib/dlpClient.ts`, `app/api/dashboard-metrics/route.ts` ; `sources/vault` (structure actuelle des routes et handlers).

---

*ZeDocs/web51 — Analyse impacts implémentation ADR-001 v1.0 — 2026-03-15.*

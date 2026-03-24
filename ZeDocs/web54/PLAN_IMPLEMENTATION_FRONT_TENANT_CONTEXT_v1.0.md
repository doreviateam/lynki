# Plan d’implémentation front — TenantContext multi-tenant

**Date** : mars 2026  
**Référence** : SPEC_TENANT_CONTEXT_ET_CHROME_v1.2.md  
**Répertoire** : ZeDocs/web54  
**Tenants cibles** : laplatine2026, o19.

**Objectif** : plan exécutable pour introduire le TenantContext, la résolution requestedTenant → resolvedTenant, le chargement de la tenant-config (chrome + workspace), les règles de switch et l’intégration header/footer, sans casser le ChromeAdaptiveContext existant.

---

## Phase 0 — Décisions à trancher (avant de coder)

À fixer noir sur blanc avant toute implémentation :

| Décision | Options | Choix à documenter |
|----------|---------|---------------------|
| **requestedTenant = null** (URL sans segment tenant) | Redirection premier tenant autorisé ; écran de choix ; fallback neutre. | Spécifier lequel pour la v1 (recommandation : redirection si un seul tenant, sinon écran de choix). |
| **Source de `availableTenants`** | Dans la réponse `GET /api/tenant-config` ; ou endpoint session/utilisateur dédié. | Une seule source en v1. Aligner avec le backend (ex. si tenant-config existe déjà côté Vault, y ajouter `availableTenants`). |
| **Forme URL phase 1** | Segment de path (`/linky/[tenant]/...`) ou query (`?tenant=laplatine2026`). | Segment préférable à terme ; query acceptable en phase 1 si routage Next.js plus simple. |
| **Backend tenant-config** | Nouvel endpoint `GET /api/tenant-config` ; ou réutilisation/extension d’un endpoint existant. | À trancher avec l’équipe backend. Le plan suppose un endpoint retournant `{ configVersion, chrome, workspace, permissions?, availableTenants? }`. |

---

## 1. Vue d’ensemble

### 1.1 Existant à réutiliser

| Élément | Fichier / lieu | État actuel |
|--------|----------------|-------------|
| Tenant actuel | `app/api/tenant/route.ts` | Retourne `tenant_id` (env `TENANT_ID`), `primary_source`. Pas de config chrome/workspace. |
| Header | `components/ReportHeader.tsx` | Déjà parametré par `tenantId` ; pas encore de config dynamique (branding, apps, sources). |
| Footer | `components/LinkyFooter.tsx` | Fixe ; pas encore de config (drawer, libellé Vault). |
| Layout / données | `app/layout.tsx`, `DashboardWithFilters` | Données scopées au tenant ; pas de sélecteur de tenant ni de résolution. |
| Chrome adaptatif | `app/context/ChromeAdaptiveContext.tsx` | À **ne pas modifier** pour le multi-tenant ; reste indépendant du tenant. |

### 1.2 Principes d’architecture

- **TenantContext** : responsable de requestedTenant, resolvedTenant, hasResolvedOnce, resolving (isLoading), tenantConfig, permissions, availableTenants, setTenant, error: TenantConfigError | null. **Aucune logique d’état chrome** (expanded/compact/hidden) : ça reste dans ChromeAdaptiveContext.
- **Résolution** : une seule requête “gagnante” (anti-race) ; seules les réponses dont l’id de requête correspond au requestedTenant courant mettent à jour resolvedTenant / tenantConfig / permissions.
- **Defaults normatifs** : tout champ manquant dans la config est remplacé par les valeurs §3bis de la spec (productName "Dorevia Linky", showCompanyFilter true, etc. ; apps/sources []).
- **Cache** : config par tenant cacheable en mémoire uniquement en v1 ; invalidation au switch. À terme, invalider aussi tout cache tenant-scoped (sociétés, métriques) au switch.

---

## 2. Architecture des modules

```
units/dorevia-linky/
├── app/
│   ├── context/
│   │   ├── ChromeAdaptiveContext.tsx   — inchangé (états chrome, frozen, pinned)
│   │   └── TenantContext.tsx         — NOUVEAU : requested/resolved, config, resolving, setTenant
│   ├── lib/
│   │   ├── tenant-config-client.ts    — fetch tenant-config, merge defaults, types
│   │   ├── tenant-config-defaults.ts   — valeurs normatives §3bis
│   │   └── tenant-types.ts            — TenantChromeConfig, TenantWorkspaceConfig, TenantPermissions
│   ├── api/
│   │   ├── tenant/
│   │   │   └── route.ts               — existant ; peut coexister avec tenant-config
│   │   └── tenant-config/
│   │       └── route.ts               — NOUVEAU ou proxy vers backend (à trancher)
│   └── (routes)
│       └── [tenant]/                   — optionnel phase 1 : segment tenant
│           └── layout.tsx             — fournit requestedTenant depuis l’URL
├── components/
│   ├── ReportHeader.tsx                — consomme TenantContext (branding, apps, sources, filtres)
│   ├── LinkyFooter.tsx                 — consomme tenantConfig.chrome.footer
│   ├── TenantSelector.tsx             — NOUVEAU : dropdown/boutons, setTenant, aria
│   └── DashboardWithFilters.tsx       — scope données = resolvedTenant + companyId + période
└── ...
```

- **Routage** : si segment `[tenant]`, le layout ou un wrapper lit `params.tenant` et le fournit au TenantContext comme requestedTenant. Si pas de segment (phase 1 avec query), lire `searchParams.tenant` ou équivalent.
- **TenantContext** : au montage et à chaque changement de requestedTenant, lance la résolution (fetch tenant-config pour ce tenant), applique anti-race, merge defaults, puis met à jour resolvedTenant + tenantConfig + permissions. Expose `isLoading` (état resolving).

---

## 3. Plan par phase (séquencement recommandé)

### Phase 1 — Types, defaults et client tenant-config

| # | Tâche | Fichiers | Spec |
|---|-------|----------|------|
| 1.1 | Créer **`tenant-types.ts`** : types TypeScript pour `TenantChromeConfig`, `TenantWorkspaceConfig` (chrome.branding, header, footer, behavior ; workspace.apps, workspace.sources), `TenantPermissions`, réponse API avec `configVersion`, `availableTenants`. | `app/lib/tenant-types.ts` | §3.2, §3.3 |
| 1.2 | Créer **`tenant-config-defaults.ts`** : objet ou fonction retournant les **valeurs normatives** (productName "Dorevia Linky", showCompanyFilter true, etc. ; apps = [], sources = []). | `app/lib/tenant-config-defaults.ts` | §3bis |
| 1.3 | Créer **`tenant-config-client.ts`** : fonction `fetchTenantConfig(tenantId: string)` appelant `GET /api/tenant-config` (ou backend) avec le tenant ; merge des valeurs reçues avec les defaults ; retour typé. Gérer 403/404/5xx et retourner une structure d’erreur exploitable. | `app/lib/tenant-config-client.ts` | §3.1, §3bis, §6 |
| 1.4 | **Route API front** (si backend séparé) : créer `app/api/tenant-config/route.ts` qui proxy vers le backend en passant le tenant (header ou query). Sinon, le client appelle directement l’URL backend ; documenter le choix. | `app/api/tenant-config/route.ts` ou doc | §3.1 |

**DoD Phase 1**
- [ ] Types alignés sur la spec (chrome, workspace, configVersion, permissions, availableTenants).  
- [ ] Defaults appliqués à toute config partielle.  
- [ ] Client retourne soit config + permissions (+ availableTenants si fournis), soit une erreur normalisée de type TenantConfigError (type: forbidden | not_found | network | server | unknown).

---

### Phase 2 — TenantContext provider (résolution + anti-race)

| # | Tâche | Fichiers | Spec |
|---|-------|----------|------|
| 2.1 | Créer **`TenantContext.tsx`** : état `requestedTenant` (string | null), `resolvedTenant` (string | null), `hasResolvedOnce` (boolean), `tenantConfig` (chrome + workspace | null), `permissions` (null), `availableTenants` ([]), `isLoading` (resolving), `error` (Error | null). | `app/context/TenantContext.tsx` | §8 |
| 2.2 | **Source de requestedTenant** : soit fournie par le layout (lecture URL segment ou query), soit par un état initial (ex. null). Exposer une façon d’injecter requestedTenant (ex. via props du Provider ou lecture dans le Provider depuis le routeur). | TenantContext, layout | §2.1, §2.2 |
| 2.3 | **Résolution** : quand requestedTenant change, appeler `fetchTenantConfig(requestedTenant)`. **Anti-race** : conserver un “generation” ou “requestId” ; à la réception de la réponse, ne mettre à jour resolvedTenant / tenantConfig / permissions **que si** la requête correspond encore au requestedTenant courant. Sinon, ignorer la réponse. | TenantContext | §5bis |
| 2.4 | En cas de succès : mettre à jour resolvedTenant, tenantConfig (avec defaults mergés), permissions, availableTenants (si dans la réponse), hasResolvedOnce = true ; clear error. En cas d’erreur (403, 404, réseau) : si hasResolvedOnce est true, ne pas changer resolvedTenant et set error (TenantConfigError) ; si hasResolvedOnce est false, utiliser le fallback neutre (resolvedTenant null + config par défaut). | TenantContext | §5.1, §6 |
| 2.5 | Exposer **`setTenant(id: string)`** : met à jour requestedTenant (et déclenche navigation si URL reflète le tenant, ou met à jour l’état local). La résolution se déclenche automatiquement au changement de requestedTenant. | TenantContext | §8 |
| 2.6 | **État resolving** : `isLoading = true` dès qu’on lance une résolution ; `isLoading = false` à la fin (succès ou erreur). Les composants peuvent afficher un loader ou désactiver le sélecteur pendant resolving. | TenantContext | §8 |

**DoD Phase 2**  
- [ ] TenantContext fournit requestedTenant, resolvedTenant, tenantConfig, permissions, availableTenants, isLoading, error, setTenant.  
- [ ] Changement rapide de tenant (2 clics) : seule la dernière réponse met à jour l’état.  
- [ ] Config partielle → defaults appliqués ; 403/404 → error set, pas d’application du tenant demandé.

---

### Phase 3 — Routage et requestedTenant depuis l’URL

| # | Tâche | Fichiers | Spec |
|---|-------|----------|------|
| 3.1 | **Décider** la forme URL (segment vs query) et l’implémenter : soit route `app/[tenant]/layout.tsx` (ou `app/linky/[tenant]/...`), soit lecture `searchParams.tenant` dans le layout racine. Passer la valeur au TenantContext comme requestedTenant. | `app/layout.tsx` ou `app/[tenant]/layout.tsx` | §2.2 |
| 3.2 | **requestedTenant = null** : si l’URL n’a pas de tenant, appliquer le choix Phase 0 (redirection premier tenant, écran de choix, ou fallback neutre). Exemple : si redirection, après récupération de availableTenants (depuis une route “session” ou la première config), redirect vers `/[firstTenant]/...`. Si écran de choix, afficher un composant dédié sans résolution. | Layout, composant choix tenant | §2.3 |
| 3.3 | **setTenant(id)** : si l’URL est la source de vérité, setTenant doit mettre à jour l’URL (router.push ou équivalent) pour que requestedTenant soit lu au prochain rendu. Sinon, setTenant met à jour l’état local et le Provider relit requestedTenant depuis cet état. | TenantContext, TenantSelector | §2.2, §5.1 |

**DoD Phase 3**  
- [ ] Un lien avec tenant dans l’URL ouvre la bonne résolution.  
- [ ] Refresh conserve le tenant.  
- [ ] Comportement lorsque requestedTenant est null conforme au choix Phase 0.

---

### Phase 4 — Intégration header et footer (config chrome + workspace)

| # | Tâche | Fichiers | Spec |
|---|-------|----------|------|
| 4.1 | **ReportHeader** : consommer `useTenantContext()` (ou équivalent). Afficher branding (logo, productName, tagline) depuis `tenantConfig.chrome.branding` avec defaults. Afficher/masquer filtres société et période selon `tenantConfig.chrome.header` (showCompanyFilter, showPeriodFilter), et “Garder le bandeau” selon showPinChrome. | `components/ReportHeader.tsx` | §9, §3.2 |
| 4.2 | **ReportHeader** : menu navigation depuis `tenantConfig.workspace.apps` (liste de liens internes) et `tenantConfig.workspace.sources` (liens externes). Pas de liste en dur ; boucle sur les tableaux. Si config null (fallback), menu minimal. | `components/ReportHeader.tsx` | §3.3, §9 |
| 4.3 | **LinkyFooter** : affichage conditionnel du drawer “Confiance système” selon `tenantConfig.chrome.footer.showTrustDrawer` ; libellé du lien Vault depuis `tenantConfig.chrome.footer.vaultLinkLabel`. Defaults si absent. | `components/LinkyFooter.tsx` | §9, §3.2 |
| 4.4 | **Comportement chrome** : lire `tenantConfig.chrome.behavior` (allowAutoHide, defaultChromePinned) et les passer au ChromeAdaptiveContext ou aux composants concernés si besoin. À défaut, utiliser les valeurs par défaut (allowAutoHide true, defaultChromePinned false). | ReportHeader, ChromeAdaptiveContext ou layout | §3.2, §3bis |

**DoD Phase 4**  
- [ ] Header reflète le branding et la navigation (apps + sources) du resolvedTenant.  
- [ ] Footer reflète showTrustDrawer et vaultLinkLabel.  
- [ ] En fallback (config null), affichage neutre et sûr (defaults normatifs).

---

### Phase 5 — Sélecteur de tenant et rules of switch

| # | Tâche | Fichiers | Spec |
|---|-------|----------|------|
| 5.1 | Créer **`TenantSelector.tsx`** : dropdown ou boutons listant `availableTenants` ; au choix, appeler `setTenant(id)`. Desktop : ligne haute du header ; tablette/mobile : dans le menu (drawer/burger). Aria-label “Choisir l’espace de pilotage”, annonce du tenant actif. | `components/TenantSelector.tsx` | §7 |
| 5.2 | Intégrer le sélecteur dans **ReportHeader** (desktop) et dans le menu mobile si présent. | ReportHeader | §7 |
| 5.3 | **Rules of switch** : lors du passage à un nouveau resolvedTenant, appliquer les règles spec §5.2 et §5.3 : réinitialiser société/période si invalides dans le nouveau tenant (via une couche de scope dédiée ou un hook métier, pas directement dans TenantContext) ; conserver le mode (Cockpit/Synthèse) ; fermer tous les overlays ; remettre le chrome en état expanded ; chromePinned selon `behavior.defaultChromePinned` de la nouvelle config. TenantContext orchestre le switch (événement de changement de resolvedTenant), les filtres métier réagissent via leurs propres hooks. | TenantContext, DashboardWithFilters ou layout | §5.2, §5.3 |
| 5.4 | **Invalidation cache** : au switch, vider le cache de la config de l’ancien tenant (déjà géré si on recharge à chaque requestedTenant). Documenter ou implémenter l’invalidation des caches tenant-scoped (sociétés, métriques) pour les appels suivants (ex. refetch companies pour le nouveau tenant). | tenant-config-client, appels API | §3.4 |

**DoD Phase 5**  
- [ ] L’utilisateur peut changer de tenant via le sélecteur ; l’URL et l’état se mettent à jour.  
- [ ] Après switch : pas d’overlay resté ouvert ; chrome expanded ; société/période cohérentes avec le nouveau tenant.  
- [ ] Sélecteur accessible (aria, focus).

---

### Phase 6 — Fallback et messages d’erreur

| # | Tâche | Fichiers | Spec |
|---|-------|----------|------|
| 6.1 | **Config ne charge pas** (timeout, 5xx) : afficher branding neutre, navigation minimale, footer standard. Optionnel : retry une fois après 2 s. Ne pas exposer de détail technique. | TenantContext, composant erreur ou layout | §6 |
| 6.2 | **403 / 404** : message utilisateur “Accès refusé” ou “Tenant introuvable” ; proposer retour accueil ou tenant précédent si disponible. Pas de stack trace. | Composant erreur tenant, TenantContext (error state) | §6 |
| 6.3 | **Config partielle** : déjà géré par merge avec defaults (Phase 1). Vérifier que les champs manquants ne provoquent pas d’erreur d’affichage. | tenant-config-client, ReportHeader, LinkyFooter | §6 |

**DoD Phase 6**  
- [ ] Toute erreur de résolution mène à une UI prévisible (message propre ou fallback neutre).  
- [ ] Aucun détail technique exposé à l’utilisateur.

---

## 4. Ordre d’exécution recommandé

1. **Phase 0** — Trancher et documenter : requestedTenant null, source availableTenants, forme URL, backend tenant-config.  
2. **Phase 1** — Types, defaults, client tenant-config (et route API si besoin).  
3. **Phase 2** — TenantContext (état, résolution, anti-race, setTenant, resolving).  
4. **Phase 3** — Routage et injection de requestedTenant depuis l’URL ; comportement si null.  
5. **Phase 4** — Intégration ReportHeader et LinkyFooter (branding, apps, sources, footer, behavior).  
6. **Phase 5** — TenantSelector et rules of switch ; invalidation cache.  
7. **Phase 6** — Fallback et messages d’erreur.

---

## 5. Fichiers à créer / modifier (résumé)

| Fichier | Action |
|---------|--------|
| `app/lib/tenant-types.ts` | Créer (Phase 1) |
| `app/lib/tenant-config-defaults.ts` | Créer (Phase 1) |
| `app/lib/tenant-config-client.ts` | Créer (Phase 1) |
| `app/api/tenant-config/route.ts` | Créer ou documenter (Phase 1) |
| `app/context/TenantContext.tsx` | Créer (Phase 2) |
| `app/layout.tsx` ou `app/[tenant]/layout.tsx` | Modifier / créer (Phase 3) |
| `components/ReportHeader.tsx` | Modifier (Phase 4) |
| `components/LinkyFooter.tsx` | Modifier (Phase 4) |
| `components/TenantSelector.tsx` | Créer (Phase 5) |
| `components/DashboardWithFilters.tsx` | Adapter si besoin (scope resolvedTenant, reset filtres au switch) (Phase 5) |
| `app/context/ChromeAdaptiveContext.tsx` | Ne pas modifier pour le multi-tenant |

---

## 6. Dépendances et risques

- **Backend** : l’existence (ou la définition) de l’endpoint tenant-config et la forme de la réponse (configVersion, chrome, workspace, permissions, availableTenants) conditionnent les phases 1 et 2. En attendant, un mock JSON (fichier ou route front qui retourne un objet fixe) permet d’avancer sur le TenantContext et l’UI.
- **Routage Next.js** : l’introduction d’un segment `[tenant]` peut impacter les routes existantes (ex. `/linky` vs `/linky/laplatine2026`). À valider avec l’équipe (structure des dossiers app/).
- **ChromeAdaptiveContext** : rester strict sur la séparation ; aucun import du TenantContext dans ChromeAdaptiveContext, et réciproquement aucune logique d’état chrome dans TenantContext.

---

**Version** : 1.0  
**Répertoire** : ZeDocs/web54  
**Liens** : SPEC_TENANT_CONTEXT_ET_CHROME_v1.2.md, NOTE_CHROME_MULTI_TENANT_v1.0.md.  
**Suite** : BACKLOG_SCRUM_TENANT_CONTEXT_v1.0.md.

# Résumé d’exécution — Phases 0 à 3 (TenantContext)

**Date** : mars 2026  
**Répertoire** : ZeDocs/web54 / units/dorevia-linky

**Statut** : Phases 0, 1, 2 et 3 livrées. Phases 4, 5, 6 à faire (header/footer config, TenantSelector, fallback UI).

---

## Livré

### Phase 0
- **DECISIONS_PHASE0_TENANT_CONTEXT.md** (ZeDocs/web54) : décisions requesteTenant null, source availableTenants, forme URL, backend tenant-config (route front mock).

### Phase 1
- **app/lib/tenant-types.ts** : TenantChromeConfig, TenantWorkspaceConfig, TenantPermissions, TenantConfigError, TenantConfigResponse, TenantOption.
- **app/lib/tenant-config-defaults.ts** : valeurs normatives §3bis (productName, header, footer, behavior, apps [], sources []).
- **app/lib/tenant-config-client.ts** : fetchTenantConfig(tenantId), merge defaults, TenantConfigError (forbidden, not_found, network, server, unknown), cache mémoire, invalidateTenantConfigCache / clearTenantConfigCache.
- **app/api/tenant-config/route.ts** : GET ?tenant= ; config mock (configVersion, chrome, workspace, permissions, availableTenants) ; 403 si tenant !== TENANT_ID en déploiement verrouillé.

### Phase 2
- **app/context/TenantContext.tsx** : TenantProvider(requestedTenant), requestedTenant / resolvedTenant / hasResolvedOnce / tenantConfig / permissions / availableTenants / isLoading / error / setTenant ; résolution avec anti-race (requestIdRef) ; comportement erreur (hasResolvedOnce → garder ancien tenant).

### Phase 3
- **DashboardWithFilters** : useSearchParams(), requestedTenant = searchParams.get("tenant") ?? tenantId ; TenantProvider(requestedTenant) ; Suspense pour useSearchParams.
- L’URL ?tenant=... est donc lue et utilisée comme requestedTenant ; le contexte résout la config pour ce tenant.

### Intégration
- **DashboardWithFilters** : encapsule le contenu dans TenantProvider(requestedTenant). Les composants enfants peuvent consommer useTenantContext() pour la suite (Phase 4 : ReportHeader / LinkyFooter en config dynamique).

---

## À faire (Phases 4, 5, 6)

- **Phase 4** : ReportHeader consomme useTenantContext() (branding, filtres, menu apps/sources) ; LinkyFooter (showTrustDrawer, vaultLinkLabel) ; behavior (allowAutoHide, defaultChromePinned).
- **Phase 5** : TenantSelector (dropdown/boutons, setTenant, aria) ; rules of switch (reset société/période via hooks, overlays fermés, chrome expanded) ; setTenant met à jour l’URL (router.push).
- **Phase 6** : UI fallback (timeout, 403, 404) ; messages propres ; pas de détail technique.

---

## Build

- `npm run build` (dorevia-linky) : **OK**.

---

## Verdict intermédiaire

> Le cœur architectural du multi-tenant est en place ; il reste à brancher l’expression UI, le switch utilisateur et le fallback propre.

- **Phase 0** : pensée verrouillée  
- **Phase 1** : contrat et defaults posés  
- **Phase 2** : moteur de résolution opérationnel  
- **Phase 3** : URL branchée  

La partie « invisible mais structurante » est livrée. Les phases 4 à 6 relèvent de l’intégration UI, de la qualité d’expérience et des finitions de comportement.

### Points de vigilance pour la suite

| Phase | Vigilance |
|-------|-----------|
| **4** | Zéro liste en dur ; branding propre ; apps/sources vraiment tirés de la config. |
| **5** | setTenant met à jour l’URL proprement ; overlays bien fermés ; reset société/période hors TenantContext. |
| **6** | Ne pas sous-estimer : une erreur multi-tenant mal rendue peut casser la confiance. |

---

**Version** : 1.0

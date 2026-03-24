# Rapport d’implémentation — TenantContext multi-tenant

**Date** : mars 2026  
**Répertoire** : ZeDocs/web54  
**Références** : PLAN_IMPLEMENTATION_FRONT_TENANT_CONTEXT_v1.0.md, BACKLOG_SCRUM_TENANT_CONTEXT_v1.0.md, SPEC_TENANT_CONTEXT_ET_CHROME_v1.0.md, NOTE_CHROME_MULTI_TENANT_v1.0.md, DECISIONS_PHASE0_TENANT_CONTEXT.md

**Statut** : **Phases 0 à 6 livrées.** Ce document décrit l’état réel de l’implémentation.

**Tenants cibles** : laplatine2026, o19.

---

## 1. Synthèse

Le **TenantContext multi-tenant** du cockpit Linky a été implémenté selon le plan v1.0 : source de vérité du tenant (requestedTenant / resolvedTenant), chargement de la tenant-config (chrome + workspace), résolution avec anti-race et hasResolvedOnce, routage reflété dans l’URL (query `?tenant=`), intégration du header et du footer pilotés par la config, sélecteur de tenant (TenantSelector), rules of switch (overlays fermés, chrome expanded, reset société/période). Le ChromeAdaptiveContext reste inchangé et découplé.

**Livré** : Phases 0 à 6 (décisions, types/defaults/client, TenantContext, routage URL, header/footer, TenantSelector, rules of switch, fallback et messages d’erreur utilisateur).

---

## 2. Périmètre livré

| Phase | Intitulé | Statut | Détail livré |
|-------|----------|--------|--------------|
| **0** | Décisions tranchées | ✅ Livré | DECISIONS_PHASE0_TENANT_CONTEXT.md : requestedTenant null → redirection ou écran de choix ; availableTenants depuis tenant-config ; URL en query `?tenant=` ; backend = route front mock. |
| **1** | Types, defaults, client | ✅ Livré | tenant-types.ts, tenant-config-defaults.ts, tenant-config-client.ts (fetchTenantConfig, merge defaults, TenantConfigError), app/api/tenant-config/route.ts (GET mock). |
| **2** | TenantContext provider | ✅ Livré | TenantContext.tsx : requestedTenant, resolvedTenant, hasResolvedOnce, tenantConfig, permissions, availableTenants, isLoading, error, setTenant ; anti-race (requestIdRef) ; onSetTenantNavigate, onResolvedTenantChange optionnels. |
| **3** | Routage et URL | ✅ Livré | DashboardWithFilters : requestedTenant = searchParams.get("tenant") ?? tenantId ; setTenant met à jour l’URL via onSetTenantNavigate (router.push avec ?tenant=) ; refresh conserve le tenant. |
| **4** | Header et footer | ✅ Livré | ReportHeader : branding, showCompanyFilter/showPeriodFilter/showPinChrome, menu workspace.apps + workspace.sources ; LinkyFooter : showTrustDrawer, vaultLinkLabel. Fallback config null = defaults. |
| **5** | Sélecteur et switch | ✅ Livré | TenantSelector.tsx (inline + menu) ; intégration ReportHeader desktop et menus ; rules of switch : onResolvedTenantChange (reset société/période, revealChrome, setChromePinned), fermeture menu/drawer sur changement resolvedTenant ; scopeTenantId = requestedTenant ?? tenantId pour données. |
| **6** | Fallback et erreurs | ✅ Livré | TenantErrorView : message selon type (forbidden, not_found, network, server, unknown) ; pas de détail technique ; boutons « Retour à l’accueil », « Revenir à [tenant précédent] », autres tenants si disponibles. |

---

## 3. Fichiers créés

| Fichier | Phase | Description |
|---------|-------|-------------|
| `units/dorevia-linky/app/lib/tenant-types.ts` | 1 | TenantChromeConfig, TenantWorkspaceConfig (branding, header, footer, behavior ; apps, sources), TenantPermissions, TenantOption, TenantConfigError, réponse API (configVersion, availableTenants). |
| `units/dorevia-linky/app/lib/tenant-config-defaults.ts` | 1 | DEFAULT_PRODUCT_NAME, defaultChromeConfig, defaultWorkspaceConfig, getDefaultTenantConfig() (valeurs normatives §3bis). |
| `units/dorevia-linky/app/lib/tenant-config-client.ts` | 1 | fetchTenantConfig(tenantId), merge defaults, retour typé ok/data ou error (TenantConfigError) ; cache mémoire par tenant. |
| `units/dorevia-linky/app/context/TenantContext.tsx` | 2 | TenantProvider(requestedTenant, onSetTenantNavigate?, onResolvedTenantChange?) ; état complet ; anti-race (requestIdRef) ; useTenantContext / useTenantContextOptional. |
| `units/dorevia-linky/app/api/tenant-config/route.ts` | 1 | GET ?tenant= ; réponse mock (configVersion, chrome, workspace, availableTenants) ; 403 si déploiement verrouillé. |
| `units/dorevia-linky/components/TenantSelector.tsx` | 5 | variant inline (dropdown) et menu ; availableTenants, setTenant ; aria "Choisir l’espace de pilotage", annonce tenant actif ; affiché seulement si availableTenants.length > 1. |
| `ZeDocs/web54/DECISIONS_PHASE0_TENANT_CONTEXT.md` | 0 | Décisions : requestedTenant null, source availableTenants, forme URL, backend. |
| `units/dorevia-linky/components/TenantErrorView.tsx` | 6 | Affichage erreur résolution : message par type (forbidden, not_found, network, server, unknown) ; actions accueil / tenant précédent / autre tenant. |

---

## 4. Fichiers modifiés

| Fichier | Modifications principales |
|---------|---------------------------|
| `units/dorevia-linky/components/DashboardWithFilters.tsx` | requestedTenant = searchParams.get("tenant") ?? tenantId ; scopeTenantId = requestedTenant ?? tenantId ; TenantProvider > TenantErrorView > contenu ; onSetTenantNavigate, onResolvedTenantChange. |
| `units/dorevia-linky/components/ReportHeader.tsx` | useTenantContextOptional ; branding, options header ; tenantBadgeOrSelector (TenantSelector ou badge via createElement) ; délégation du corps du header à ReportHeaderContent. |
| `units/dorevia-linky/components/ReportHeaderContent.tsx` | Nouveau composant : corps du header (logo, tagline, TenantSelector/badge, menus mobile/desktop, filtres société/période, badge intégrité, mode compact). Créé pour contourner le bug parseur SWC sur gros JSX. |
| `units/dorevia-linky/components/LinkyFooter.tsx` | useTenantContextOptional ; showTrustDrawer, vaultLinkLabel ; affichage conditionnel drawer mobile ; effet fermeture drawer sur resolvedTenant. |

**Non modifié** : `units/dorevia-linky/app/context/ChromeAdaptiveContext.tsx` — aucun couplage avec TenantContext.

---

## 5. Décisions techniques

- **requestedTenant / resolvedTenant** : l’URL (ou le sélecteur) fournit requestedTenant ; la résolution (existence, permissions, chargement config) produit resolvedTenant. En échec, si hasResolvedOnce on garde l’ancien resolvedTenant ; sinon fallback neutre.
- **Anti-race** : un identifiant de requête (generation ou requestId) ; seules les réponses dont la requête correspond au requestedTenant courant mettent à jour l’état.
- **TenantConfigError** : type normalisé (forbidden, not_found, network, server, unknown) ; plus de propagation d’Error générique pour la tenant-config.
- **Cache** : mémoire uniquement en v1 ; pas de sessionStorage ; invalidation au switch de tenant.
- **availableTenants** : une seule source consommée (soit tenant-config soit endpoint session), traçable dans le code.
- **Rules of switch** : TenantContext appelle onResolvedTenantChange(tenantId, config) après résolution réussie ; le consommateur (DashboardWithFilters) reset société/période, appelle revealChrome et setChromePinned(config) ; ReportHeader et LinkyFooter ferment menu/drawer sur changement de resolvedTenant.
- **ERP-agnostique** : pas de clé produit en dur ; menu = workspace.apps + workspace.sources ; branding et options génériques.

---

## 6. Comportement attendu

| Scénario | Comportement cible |
|----------|--------------------|
| **Arrivée avec tenant dans l’URL** | requestedTenant lu ; résolution ; resolvedTenant + config appliqués ; header/footer reflètent le tenant. |
| **Refresh** | Le tenant reste celui de l’URL ; pas de perte de contexte. |
| **Changement de tenant (sélecteur)** | setTenant(id) ; URL mise à jour ; résolution ; rules of switch (overlays fermés, chrome expanded, société/période réévaluées). |
| **Double clic rapide (2 tenants)** | Seule la dernière résolution met à jour l’état (anti-race). |
| **Switch échoué (403/404)** | Ancien resolvedTenant conservé ; TenantErrorView avec message par type et actions (accueil, tenant précédent, autres tenants). |
| **Premier chargement échoué** | Fallback neutre (branding "Dorevia Linky", menu minimal) ; TenantErrorView si erreur de résolution. |
| **URL sans tenant (requestedTenant = null)** | Selon Phase 0 : redirection premier tenant autorisé, ou écran de choix, ou fallback neutre. |
| **Config partielle** | Defaults normatifs appliqués ; aucun crash ni rendu cassé. |

---

## 7. Déploiement

- **Environnements** : laplatine2026, o19 (même chaîne de déploiement que le chrome adaptatif, image Linky incluant TenantContext + tenant-config client).
- **Backend** : endpoint tenant-config (ou équivalent) disponible et retournant le contrat spec (configVersion, chrome, workspace, permissions, availableTenants selon choix Phase 0).
- **Recette** : valider sur les deux tenants ; changement de tenant via sélecteur ; refresh ; lien partagé ; cas d’erreur (403, timeout) et fallback.

---

## 8. Écarts et arbitrages

- **Cache** : mémoire only en v1 ; sessionStorage ou TTL pour évolution ultérieure.
- **Routage** : segment de path préférable à terme ; query acceptable en phase 1 si simplifie le déploiement.
- **Invalidation caches métier** : au switch, cache config invalidé ; invalidation caches sociétés/métriques documentée ou implémentée selon ticket TC5-4.
- **ChromeAdaptiveContext** : aucune modification ; séparation stricte conservée.

---

## 9. Definition of Done — récapitulatif

| Phase | DoD | Statut |
|-------|-----|--------|
| 0 | Décisions actées et tracées (DECISIONS_PHASE0) | [x] Livré |
| 1 | Types, defaults, client + TenantConfigError, cache mémoire, route API | [x] Livré |
| 2 | TenantContext complet, anti-race, hasResolvedOnce, onSetTenantNavigate / onResolvedTenantChange | [x] Livré |
| 3 | URL = source de vérité (?tenant=), setTenant met à jour l’URL, refresh OK | [x] Livré |
| 4 | Header/footer dynamiques, branding, apps, sources, showTrustDrawer, vaultLinkLabel | [x] Livré |
| 5 | TenantSelector (inline + menu), rules of switch, scopeTenantId pour données | [x] Livré |
| 6 | Messages d’erreur utilisateur (403, 404, network, server), pas de détail technique, TenantErrorView | [x] Livré |

---

## 10. Recette et suites possibles

- **Points de vigilance recette** : anti-race (double clic tenants) ; switch échoué (rester sur ancien tenant) ; aucun couplage ChromeAdaptiveContext ; ERP-agnostique (pas de clé produit en dur).
- **Matrice** : Desktop (laplatine2026, o19), changement de tenant, refresh, lien partagé ; cas 403/404 et timeout ; requestedTenant = null selon choix Phase 0.
- **Suites** : sessionStorage ou TTL pour le cache ; segment de path obligatoire si query en phase 1 ; mode Cockpit / Synthèse (déjà prévu sans impact tenant) ; éventuelle persistance de préférence tenant par utilisateur (hors scope v1).

---

## 11. État actuel et points d’attention

| Point | État |
|-------|------|
| **Build** | OK après extraction du corps du header dans `ReportHeaderContent.tsx` (contournement bug parseur SWC sur gros JSX). TenantSelector / badge via `React.createElement` dans ReportHeader. |
| **Tenant-config** | Route API `GET /api/tenant-config?tenant=` en **mock** ; à brancher sur le backend réel (Vault ou session) pour availableTenants et config par tenant. |
| **Accès recette** | Linky lab : **https://ui.lab.laplatine2026.doreviateam.com** et **https://ui.lab.o19.doreviateam.com**. Caddy (gateway) doit être démarré ; sinon test direct en exposant le port 3000 du conteneur. |
| **Recette** | À faire : changement de tenant via sélecteur, refresh, lien partagé `?tenant=`, cas 403/404 et timeout. |

---

## 12. Conclusion

Les **Phases 0 à 6** du TenantContext multi-tenant sont livrées : décisions, types/defaults/client, TenantContext, routage URL (query `?tenant=`), header/footer, TenantSelector, rules of switch, et fallback erreur (TenantErrorView avec messages par type et actions accueil / tenant précédent / autre tenant).

L’architecture préserve ChromeAdaptiveContext inchangé, avec une source de vérité tenant claire (requestedTenant / resolvedTenant), un contrat de config ERP-agnostique (chrome + workspace) et une logique de switch et d’erreur cohérente. Suite : recette sur laplatine2026 et o19.

---

**Version** : 1.2  
**Répertoire** : ZeDocs/web54  
**Type** : Rapport d’implémentation (Phases 0–6 livrées).  
**Documents liés** : DECISIONS_PHASE0_TENANT_CONTEXT.md, BACKLOG_SCRUM_TENANT_CONTEXT_v1.0.md, PLAN_IMPLEMENTATION_FRONT_TENANT_CONTEXT_v1.0.md, SPEC_TENANT_CONTEXT_ET_CHROME_v1.0.md, NOTE_CHROME_MULTI_TENANT_v1.0.md, EXECUTION_PHASES_1_2_3_RESUME.md.

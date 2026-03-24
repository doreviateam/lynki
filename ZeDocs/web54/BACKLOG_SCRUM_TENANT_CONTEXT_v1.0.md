# Backlog Scrum — TenantContext / tenant-config / switch

**Date** : mars 2026  
**Répertoire** : ZeDocs/web54  
**Référence** : PLAN_IMPLEMENTATION_FRONT_TENANT_CONTEXT_v1.0.md, SPEC_TENANT_CONTEXT_ET_CHROME_v1.2.md, NOTE_CHROME_MULTI_TENANT_v1.0.md (note consolidée v1.1)

**Objectif** : transformer le plan d’implémentation TenantContext en backlog exécutable avec tickets par phase et Definition of Done par ticket. Base de suivi d’avancement et de recette.

**Tenants cibles** : laplatine2026, o19.

---

## Légende

- **ID** : identifiant court pour suivi (ex. Jira, GitHub Issues). Préfixe **TC** = Tenant Context.
- **DoD** : Definition of Done — critères à valider avant de considérer le ticket terminé.
- **Phase** : 0, 1, 2, 3, 4, 5, 6 (aligné sur le plan).
- **Priorité** : P0 = blocant / socle ; P1 = livrable cœur ; P2 = confort / raffinement.
- **SP** : story points (estimation légère pour sprint planning).
- **Owner** : front, fullstack, ou produit (à affecter selon l’équipe).

---

## Phase 0 — Décisions à trancher

| ID | Titre | Description | DoD |
|----|--------|-------------|-----|
| **TC0-1** | Trancher requestedTenant = null | Choisir et documenter : redirection vers premier tenant autorisé, écran de choix, ou fallback neutre. Recommandation : redirection si un seul tenant, sinon écran de choix. | [ ] Choix documenté dans le plan ou un doc de décisions. |
| **TC0-2** | Trancher source de availableTenants | Une seule source en v1 : soit dans la réponse `GET /api/tenant-config`, soit endpoint session/utilisateur dédié. Aligner avec le backend. | [ ] Source unique documentée ; pas de mélange. |
| **TC0-3** | Trancher forme URL phase 1 | Segment de path (`/linky/[tenant]/...`) ou query (`?tenant=...`). Segment préférable à terme. | [ ] Décision documentée ; routage Next.js aligné. |
| **TC0-4** | Trancher backend tenant-config | Nouvel endpoint `GET /api/tenant-config` ou réutilisation d’un endpoint existant. Forme de réponse : `{ configVersion, chrome, workspace, permissions?, availableTenants? }`. | [ ] Endpoint identifié ou créé ; contrat documenté. |
| **TC0-5** | DoD Phase 0 | Les 4 décisions ci-dessus sont actées et tracées. | [ ] Phase 0 complète ; blocage levé pour Phase 1. |

---

## Phase 1 — Types, defaults et client tenant-config

| ID | Titre | Description | DoD |
|----|--------|-------------|-----|
| **TC1-1** | Créer tenant-types.ts | Types TypeScript : `TenantChromeConfig`, `TenantWorkspaceConfig` (branding, header, footer, behavior ; apps, sources), `TenantPermissions`, réponse API avec `configVersion`, `availableTenants`. Plus type **TenantConfigError** : type parmi forbidden, not_found, network, server, unknown ; message optionnel. | [ ] Types exportés et alignés sur la spec §3.2, §3.3. |
| **TC1-2** | Créer tenant-config-defaults.ts | Objet ou fonction retournant les valeurs normatives §3bis : productName "Dorevia Linky", showCompanyFilter/showPeriodFilter/showPinChrome true, showTrustDrawer true, allowAutoHide true, defaultChromePinned false, apps = [], sources = []. | [ ] Defaults utilisés par le client ; config partielle → rendu sûr. |
| **TC1-3** | Créer tenant-config-client.ts | `fetchTenantConfig(tenantId: string)` : appel `GET /api/tenant-config` (ou backend), merge avec defaults, retour typé. En erreur : retourner **TenantConfigError** (type : forbidden, not_found, network, server ou unknown). Cache **mémoire uniquement** par tenant ; invalidation au switch. | [ ] Client retourne config + permissions (+ availableTenants) ou TenantConfigError ; cache mémoire only. |
| **TC1-4** | Route API tenant-config (si besoin) | Créer `app/api/tenant-config/route.ts` en proxy vers le backend avec tenant (header/query), ou documenter l’appel direct backend. | [ ] Route créée ou choix documenté. |
| **TC1-5** | DoD Phase 1 | Types alignés ; defaults appliqués ; client retourne config ou TenantConfigError ; pas d’Error générique propagé. | [ ] Les critères DoD Phase 1 du plan cochés. |

---

## Phase 2 — TenantContext provider (résolution + anti-race)

| ID | Titre | Description | DoD |
|----|--------|-------------|-----|
| **TC2-1** | Créer TenantContext.tsx (état) | État : requestedTenant, resolvedTenant, hasResolvedOnce, tenantConfig, permissions, availableTenants, isLoading (resolving), error : TenantConfigError ou null. Provider avec injection de requestedTenant (props ou lecture routeur). | [ ] Contexte créé ; tous les champs exposés. |
| **TC2-2** | Résolution + anti-race | Au changement de requestedTenant : appeler fetchTenantConfig. Génération/requestId : ne mettre à jour resolvedTenant / tenantConfig / permissions **que si** la réponse correspond au requestedTenant courant. Ignorer les réponses obsolètes. | [ ] Double clic rapide sur deux tenants : seule la dernière réponse appliquée. |
| **TC2-3** | Comportement succès / erreur | Succès : resolvedTenant, tenantConfig (defaults mergés), permissions, availableTenants, hasResolvedOnce = true ; clear error. Erreur : si hasResolvedOnce → garder resolvedTenant, set error ; sinon fallback neutre (resolvedTenant null + config défaut). | [ ] Switch échoué → ancien tenant conservé ; premier chargement échoué → fallback neutre. |
| **TC2-4** | setTenant + état resolving | Exposer setTenant(id). isLoading = true au début de la résolution, false à la fin. | [ ] setTenant déclenche la résolution ; UI peut afficher loader ou désactiver sélecteur. |
| **TC2-5** | Consommation unique de availableTenants | Vérifier que le code n’utilise qu’**une seule source** pour `availableTenants` (celle tranchée en TC0-2) : soit tenant-config, soit endpoint session/utilisateur. Aucun mélange ni fallback sur une autre source. | [ ] Une seule source consommée ; traçable dans le code. |
| **TC2-6** | DoD Phase 2 | TenantContext fournit tous les champs ; anti-race validé ; hasResolvedOnce et erreur cohérents ; availableTenants source unique. | [ ] Les critères DoD Phase 2 du plan cochés. |

---

## Phase 3 — Routage et requestedTenant depuis l’URL

| ID | Titre | Description | DoD |
|----|--------|-------------|-----|
| **TC3-1** | Implémenter forme URL | Selon TC0-3 : route `app/[tenant]/layout.tsx` (ou équivalent) ou lecture searchParams.tenant dans le layout. Passer la valeur au TenantContext comme requestedTenant. | [ ] requestedTenant reflété dans l’URL ; lecture au chargement. |
| **TC3-2** | Comportement requestedTenant = null | Selon TC0-1 : redirection premier tenant, écran de choix, ou fallback neutre. Ex. redirection après récupération availableTenants (session ou config). | [ ] Comportement conforme au choix Phase 0. |
| **TC3-3** | setTenant met à jour l’URL | Si URL = source de vérité : setTenant(id) déclenche router.push (ou équivalent) pour que requestedTenant soit lu au prochain rendu. | [ ] Refresh conserve le tenant ; lien partagé = bon tenant. |
| **TC3-4** | DoD Phase 3 | Lien avec tenant → bonne résolution ; refresh conserve le tenant ; null géré. | [ ] Les critères DoD Phase 3 du plan cochés. |

---

## Phase 4 — Intégration header et footer (config chrome + workspace)

| ID | Titre | Description | DoD |
|----|--------|-------------|-----|
| **TC4-1** | ReportHeader — branding et filtres | Consommer useTenantContext(). Branding : logo, productName, tagline depuis tenantConfig.chrome.branding (defaults si absent). Filtres société/période et “Garder le bandeau” selon tenantConfig.chrome.header (showCompanyFilter, showPeriodFilter, showPinChrome). | [ ] Header reflète le branding et la visibilité des filtres du resolvedTenant. |
| **TC4-2** | ReportHeader — menu apps et sources | Menu navigation : boucle sur tenantConfig.workspace.apps (liens internes) et tenantConfig.workspace.sources (liens externes). Pas de liste en dur. Config null → menu minimal. | [ ] Menu dynamique ; pas de clé produit en dur (ERP-agnostique). |
| **TC4-3** | LinkyFooter — drawer et Vault | showTrustDrawer et vaultLinkLabel depuis tenantConfig.chrome.footer. Defaults si absent. | [ ] Footer reflète la config du tenant. |
| **TC4-4** | Comportement chrome (behavior) | allowAutoHide, defaultChromePinned depuis tenantConfig.chrome.behavior ; les passer au ChromeAdaptiveContext ou composants si besoin. Defaults : true, false. | [ ] Options behavior prises en compte. |
| **TC4-5** | DoD Phase 4 | Header + footer reflètent le resolvedTenant ; fallback (config null) = affichage neutre et sûr. | [ ] Les critères DoD Phase 4 du plan cochés. |

---

## Phase 5 — Sélecteur de tenant et rules of switch

| ID | Titre | Description | DoD |
|----|--------|-------------|-----|
| **TC5-1** | Créer TenantSelector.tsx | Dropdown ou boutons listant availableTenants ; au choix appeler setTenant(id). Desktop : ligne haute header ; tablette/mobile : dans le menu (drawer/burger). Aria-label “Choisir l’espace de pilotage”, annonce du tenant actif. | [ ] Sélecteur utilisable ; accessible (focus, aria). |
| **TC5-2** | Intégrer TenantSelector | Dans ReportHeader (desktop) et dans le menu mobile si présent. | [ ] Sélecteur visible au bon endroit selon device. |
| **TC5-3** | Rules of switch | Au changement de resolvedTenant : réinitialiser société/période si invalides (via hook ou couche scope métier, pas dans TenantContext) ; conserver mode Cockpit/Synthèse ; fermer tous les overlays ; chrome en état expanded ; chromePinned selon behavior.defaultChromePinned de la nouvelle config. TenantContext émet le changement ; les filtres réagissent via leurs hooks. | [ ] Après switch : pas d’overlay resté ouvert ; chrome expanded ; société/période cohérentes. |
| **TC5-4** | Invalidation cache tenant-scoped | Au switch : cache config géré (mémoire). Documenter ou implémenter invalidation caches sociétés/métriques (refetch pour le nouveau tenant). | [ ] Pas de données ancien tenant affichées après switch. |
| **TC5-5** | DoD Phase 5 | Utilisateur peut changer de tenant ; URL et état à jour ; overlays fermés ; chrome expanded ; sélecteur accessible. | [ ] Les critères DoD Phase 5 du plan cochés. |

---

## Phase 6 — Fallback et messages d’erreur

| ID | Titre | Description | DoD |
|----|--------|-------------|-----|
| **TC6-1** | Config ne charge pas (timeout, 5xx) | Afficher branding neutre, navigation minimale, footer standard. Optionnel : retry une fois après 2 s. Ne pas exposer de détail technique. S’appuyer sur TenantConfigError.type (network, server). | [ ] UI prévisible ; pas de stack trace. |
| **TC6-2** | 403 / 404 | Message utilisateur “Accès refusé” ou “Tenant introuvable” ; proposer retour accueil ou tenant précédent. S’appuyer sur error.type (forbidden, not_found). | [ ] Message propre ; pas de détail technique. |
| **TC6-3** | Vérifier config partielle | Defaults déjà mergés (Phase 1). Vérifier que champs manquants ne provoquent pas d’erreur d’affichage (ReportHeader, LinkyFooter). | [ ] Aucun crash ni rendu cassé si config partielle. |
| **TC6-4** | DoD Phase 6 | Toute erreur mène à une UI prévisible ; aucun détail technique exposé. | [ ] Les critères DoD Phase 6 du plan cochés. |

---

## Priorités et estimation (sprint planning)

| Phase | Priorité | SP (suggestion) | Owner type |
|-------|----------|-----------------|------------|
| 0 | P0 | 1 | Produit / Tech lead |
| 1 | P0 | 3 | Front |
| 2 | P0 | 5 | Front |
| 3 | P0 | 2 | Front |
| 4 | P1 | 3 | Front |
| 5 | P1 | 3 | Front |
| 6 | P1 | 2 | Front |

Phases 0 à 3 = **P0** (socle résolution + URL). Phases 4 à 6 = **P1** (UI, sélecteur, fallback). Raffinements UX éventuels = **P2**. À ajuster selon vélocité et découpage des sprints.

---

## Récapitulatif par phase

| Phase | Tickets | Priorité | DoD phase |
|-------|----------|----------|-----------|
| 0 | TC0-1 à TC0-5 | P0 | Décisions Phase 0 actées et tracées ; blocage levé pour Phase 1 |
| 1 | TC1-1 à TC1-5 | P0 | Types, defaults, client + TenantConfigError, cache mémoire |
| 2 | TC2-1 à TC2-6 | P0 | TenantContext complet, anti-race, hasResolvedOnce, setTenant, source unique availableTenants |
| 3 | TC3-1 à TC3-4 | P0 | URL = source de vérité, requestedTenant null géré, refresh OK |
| 4 | TC4-1 à TC4-5 | P1 | Header/footer dynamiques, branding, apps, sources, behavior |
| 5 | TC5-1 à TC5-5 | P1 | TenantSelector, rules of switch, invalidation cache |
| 6 | TC6-1 à TC6-4 | P1 | Fallback, messages d’erreur, config partielle |

---

## Ordre d’exécution recommandé

1. **Phase 0** — Trancher et documenter les 4 décisions.  
2. **Phase 1** — Types, defaults, client (TenantConfigError, cache mémoire).  
3. **Phase 2** — TenantContext (état, résolution, anti-race, hasResolvedOnce, setTenant).  
4. **Phase 3** — Routage, URL, requestedTenant null.  
5. **Phase 4** — ReportHeader, LinkyFooter (config chrome + workspace).  
6. **Phase 5** — TenantSelector, rules of switch, cache.  
7. **Phase 6** — Fallback et messages d’erreur.

---

## Points de vigilance recette

- **Anti-race** : enchaîner rapidement deux changements de tenant → seule la dernière résolution s’applique.  
- **Switch échoué** : après un tenant déjà résolu, erreur 403/404 → on reste sur l’ancien tenant ; message propre.  
- **ChromeAdaptiveContext** : aucun couplage ; TenantContext ne gère pas expanded/compact/hidden.  
- **ERP-agnostique** : pas de clé Odoo ou produit en dur ; menu = apps + sources génériques.

---

**Version** : 1.1  
**Répertoire** : ZeDocs/web54  
**Liens** : PLAN_IMPLEMENTATION_FRONT_TENANT_CONTEXT_v1.0.md, SPEC_TENANT_CONTEXT_ET_CHROME_v1.2.md, NOTE_CHROME_MULTI_TENANT_v1.0.md (note consolidée v1.1). **Rapport cible** : RAPPORT_IMPLEMENTATION_TENANT_CONTEXT_SIMULE_v1.0.md.

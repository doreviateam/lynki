# Note — Chrome adaptatif et multi-tenant

**Date** : mars 2026  
**Répertoire** : ZeDocs/web54  
**Contexte** : Suite au rapport d’implémentation chrome adaptatif ; évolution future du header et du périmètre de navigation pour un fonctionnement multi-tenant. **Tenants pris en considération** : laplatine2026, o19.

**Objectif** : poser une vision pour adapter le chrome Linky (header, footer, navigation) à un contexte multi-tenant, sans redéployer du code par tenant.

**Principe ERP-agnostique** : le multi-tenant du chrome ne doit pas être pensé comme “tenant = un ERP” ni “navigation = lien ERP + variantes”. On raisonne ainsi :
- **Tenant** = un **espace de pilotage**, connecté à **une ou plusieurs sources métier** dont l’ERP n’est qu’un cas possible parmi d’autres (POS, Banque, Facturation, E-commerce, Paie, CRM, Admin, etc.).
- Le chrome expose **les briques disponibles dans le système d’information** du tenant, pas “l’ERP du tenant”.
- **Config pilotée par tenant, sans dépendance conceptuelle à un ERP précis.**

---

## 1. État actuel

- **Tenant** : déjà présent (déduit du host ou de l’API, ex. `laplatine2026`, `o19`). Le header affiche un badge `tenantId` et les données (sociétés, métriques) sont scopées au tenant. **Un URL = un tenant** : on ne choisit pas le tenant dans l’interface.
- **Chrome** : comportement identique pour tous les tenants (masquage, compact, overlays, drawer footer). Seul le libellé du tenant change.

---

## 1bis. Multi-tenant par sélection (option envisagée)

Une évolution possible est de permettre de **sélectionner le tenant dans l’app** (ex. laplatine2026 ou o19) au lieu d’être fixé par l’URL :

- **Un même déploiement / une même URL** : l’utilisateur arrive sur Linky puis choisit le tenant (liste déroulante ou boutons dans le header ou le menu).
- **Au changement de sélection** : rechargement du contexte (données, config chrome, sociétés, métriques) pour le tenant choisi.
- **Cas d’usage** : admin ou utilisateur ayant accès à plusieurs tenants ; démo ; environnement de dev avec bascule rapide entre laplatine2026 et o19.

Cela implique : un **sélecteur de tenant** dans le chrome (header ou menu), un état “tenant courant” (session ou URL), et que toutes les requêtes (API, config) utilisent ce tenant sélectionné. La config chrome (branding, navigation) décrite plus bas s’appliquerait alors au tenant **sélectionné**.

**Principe central à préserver** : le **moteur adaptatif du chrome reste unique** ; seul le **périmètre visible** change selon le tenant. Un seul Linky, un seul moteur de chrome, plusieurs tenants pilotés par configuration.

---

## 2. Hiérarchie des contextes

En multi-tenant, le header gère plusieurs niveaux de contexte. Il est utile de les distinguer explicitement :

| Niveau | Rôle | Exemple |
|--------|------|--------|
| **Tenant** | Périmètre applicatif principal (branding, navigation, droits). | laplatine2026, o19. |
| **Société** | Périmètre métier à l’intérieur du tenant. | Société X, “Toutes les sociétés”. |
| **Période** | Filtre temporel. | Exercice à date, Janvier 2026. |
| **Mode** | Manière de lire le même périmètre (à venir). | Cockpit, Synthèse. |

Cette hiérarchie évite que le header devienne un empilement de contextes flous : tenant = périmètre applicatif ; société = périmètre métier ; période = filtre ; mode = vue.

**Switch Cockpit | Synthèse** : le changement de mode ne change **ni le tenant, ni la société, ni la période** ; il change uniquement la **vue** appliquée au périmètre courant. Même périmètre, autre manière de le lire. À poser explicitement pour éviter toute confusion avec un changement de contexte.

---

## 3. Ce que “multi-tenant” peut recouvrir pour le chrome

| Dimension | Description | Exemple |
|-----------|-------------|--------|
| **Branding** | Logo, nom produit, tagline, couleurs d’accent par tenant. | Tenant A : “Dorevia Linky” ; Tenant B : “Cockpit Financier [Client]”. |
| **Périmètre de navigation** | Liste des applications / vues et des **sources** accessibles depuis le header (menu, liens). | Tenant A : Comptabilité, POS, ERP, Banque ; Tenant B : Comptabilité uniquement ; Tenant C : Linky + app métier custom. |
| **Contenu du header** | Filtres affichés (société, période), liens vers **sources** (ERP, admin, POS, etc.), visibilité de “Garder le bandeau”. | Certains tenants sans sélecteur société ; URL des sources ou admin variable par tenant. |
| **Footer** | Lien “Powered by”, version, visibilité du drawer “Confiance système”. | Option pour masquer le drawer ou adapter le libellé. |
| **Feature flags** | Activation/désactivation de comportements (ex. auto-hide, compact) par tenant. | Tenant kiosque : chrome toujours visible, pas de masquage. |

---

## 4. Configuration par tenant et permissions

### 4.1 Config d’affichage

Pour éviter du code spécifique par tenant, on introduit une **config par tenant** (API ou fichier chargé au runtime). Il est utile de distinguer **deux sous-blocs** pour éviter que “config chrome” ne devienne trop large :

- **`chrome`** : tout ce qui concerne l’enveloppe (branding, header, footer, comportement d’affichage du bandeau).
- **`workspace`** (ou `apps`) : périmètre de navigation, **sources** (liens vers systèmes métier : ERP, POS, Banque, Facturation, Admin, etc.), liste d’applications ou de vues.

**Source** : endpoint du type `GET /api/tenant-config` retournant par exemple `{ chrome: { … }, workspace: { … } }` (ou injecté au build si déploiement par tenant).

**Contenu minimal envisagé** :
- **chrome** : `branding` (logoUrl?, productName?, tagline?) ; `header` (showCompanyFilter?, showPeriodFilter?, showPinChrome?) ; `footer` (showTrustDrawer?, vaultLinkLabel?) ; `behavior` (allowAutoHide?, defaultChromePinned?).
- **workspace** : `apps` ([{ id, label, href?, viewMode? }]), `sources` ou `externalLinks` ([{ id, label, href, type? }]) — types possibles : erp, pos, banque, facturation, paie, crm, admin, etc. Pas de notion “Odoo” en dur : le chrome lit une liste de briques du SI.

Le header et le footer lisent le bloc **chrome** ; la navigation et les liens métier lisent **workspace**. Le chrome adaptatif actuel (états, useChromeLock, safe areas, télémétrie) reste inchangé ; seuls le contenu et les options sont pilotés par la config.

**Cache** : la config tenant doit être **cacheable côté client** (par tenant), mais **invalidée proprement au switch de tenant** (ou à expiration). Dès qu’on aura plusieurs tenants dans une même session, ce sujet devient critique.

### 4.2 Permissions (autorisation)

La **config** décrit ce qui est *disponible* pour un tenant. Les **permissions** décrivent ce que l’utilisateur *a le droit* de voir ou faire. Il faut les séparer clairement :

- **Config d’affichage** : branding, liste d’apps, options header/footer pour le tenant.
- **Permissions effectives** : voir tel tenant, voir telle société, accéder à telle source (admin, ERP, etc.), voir le drawer confiance, accéder à la Synthèse (futur), etc.

La config ne doit **jamais** servir de pseudo-sécurité : les droits réels (accès tenant, société, liens) viennent d’un mécanisme d’autorisation (API, rôle, etc.). Le front masque ou désactive selon les permissions ; le backend refuse les accès non autorisés.

---

## 5. Stratégie d’URL si tenant sélectionnable

Si l’utilisateur peut changer de tenant dans l’app, il faut choisir où vit cette vérité : **URL**, **session**, ou **state interne**.

**Recommandation** : **tenant courant reflété dans l’URL**, même avec un host unique (ex. paramètre de query ou segment de path). Intérêts :

- partage de lien propre (un lien = un tenant) ;
- refresh robuste (on reste sur le bon tenant) ;
- deep-linking possible ;
- moins d’ambiguïté en debug.

À terme : host unique + paramètre ou segment tenant dans l’URL.

### 5bis. Source de vérité du tenant “résolu”

En pratique, l’URL peut **demander** un tenant qui est inexistant, interdit, ou non encore chargé. Il est utile de nommer explicitement :

- **`requestedTenant`** : ce que l’URL (ou l’utilisateur) demande.
- **`resolvedTenant`** : le tenant effectivement appliqué après résolution (existe, autorisé, config chargée).

Cycle : **1.** l’URL demande un tenant → **2.** le système résout (existence, permissions, chargement config) → **3.** le contexte applique le `resolvedTenant`. En cas d’échec (tenant inconnu, accès refusé), on reste en fallback et on n’applique pas le tenant demandé ; l’URL peut être corrigée ou un message d’erreur affiché.

---

## 6. Impact sur les états UI au changement de tenant

Au switch de tenant, il ne suffit pas de recharger les données. Il faut décider quoi faire de : société sélectionnée, période, mode Cockpit/Synthèse, chromePinned, état compact/hidden, drawer footer.

**Règle simple recommandée** :

- **on conserve le mode de lecture** (ex. Cockpit si c’est le mode actif) ;
- **on réinitialise les filtres non valides** dans le nouveau tenant (société, période si hors périmètre) ;
- **on ferme tous les overlays** (menu, selects, drawer) ;
- **on remet le chrome dans un état stable** (`expanded`) après le switch.

Cela évite des transitions bizarres et un état incohérent (overlay ouvert sur l’ancien tenant, etc.).

---

## 7. Fallback

Que faire si la config tenant ne charge pas, le tenant n’existe pas, l’utilisateur n’y a pas accès, ou la config est partielle ?

**Comportement de secours** :

- **branding** : neutre “Dorevia Linky” ;
- **navigation** : minimale (pas de menu enrichi) ;
- **footer** : standard ;
- **accès refusé** : message d’erreur propre (tenant inconnu ou non autorisé), sans exposer de détail technique inutile.

---

## 8. Architecture recommandée : deux providers distincts

À terme, il est recommandé de garder **deux contextes séparés** :

| Provider | Responsabilité |
|----------|----------------|
| **TenantContext** | Tenant courant, liste des tenants accessibles, config tenant, permissions, action de switch. |
| **ChromeAdaptiveContext** | État du chrome (expanded/compact/hidden), frozen, pinned, interaction mode (desktop/tablet/mobile). |

Le multi-tenant ne doit **pas** polluer la logique d’adaptation écran. TenantContext = *quel* périmètre ; ChromeAdaptiveContext = *comment* le chrome se comporte (masquage, overlays, device). Ne pas mélanger les deux.

---

## 9. Header futur et place du tenant

Avec le mode **Cockpit | Synthèse** (futur) et le multi-tenant, le header doit rester lisible. Vision cible :

**Desktop**  
- Ligne haute : tenant / branding ; switch **Cockpit | Synthèse** ; actions globales.  
- Ligne fonctionnelle : société ; période ; éventuellement menu apps.

**Tablette / mobile**  
- Le switch Cockpit | Synthèse reste visible.  
- Le tenant peut passer dans un menu ou un sélecteur compact.  
- Les éléments secondaires sont repliés (chrome adaptatif actuel).

Le multi-tenant ajoute **un niveau de contexte en plus** ; il ne doit pas casser le chrome adaptatif.

---

## 10. Points d’intégration dans le code actuel

- **ReportHeader** : déjà parametré par `tenantId` ; ajouter un `TenantChromeConfig` (ou équivalent) fourni par un provider ou par `useTenantConfig()`, et brancher :
  - logo / productName / tagline ;
  - boucle sur `workspace.apps` et `workspace.sources` (ou `externalLinks`) pour le menu au lieu d’une liste en dur ;
  - affichage conditionnel des selects (société, période) et de l’entrée “Garder le bandeau”.
- **LinkyFooter** : affichage conditionnel du drawer, libellé du lien Vault, selon la config.
- **DashboardWithFilters** : pas de changement majeur ; le scope données reste `tenantId` + `companyId` + période. Seul le contenu du chrome (menu, filtres) dépend de la config tenant.

Aucun impact sur la machine d’états (expanded/compact/hidden/frozen), le scroll, le device mode ou la télémétrie : ils restent communs.

---

## 11. Stratégie de déploiement possible

1. **Phase 1** : config statique (ex. JSON par tenant dans le front ou injecté par env) pour un ou deux tenants pilotes ; header/footer lisent cette config.
2. **Phase 2** : déplacer la config vers une API (tenant-config ou partie du tenant context) pour mise à jour sans redéploiement.
3. **Phase 3** : étendre la config (branding avancé, feature flags chrome) selon les besoins métier.

---

## 12. Points ouverts

→ **Tranchés dans** SPEC_TENANT_CONTEXT_ET_CHROME_v1.0.md :

- **Stratégie d’URL** : segment de path (ou query en phase 1), nom `tenant`.
- **Articulation config vs permissions** : config = disponible ; permissions = API/rôle ; front masque, backend refuse.
- **Politique de réinitialisation des filtres** : société/période si invalides dans le nouveau tenant ; mode conservé ; overlays fermés ; chrome expanded.
- **Fallback** : branding neutre, nav minimale, message propre (403/404), pas de détail technique.
- **Place du sélecteur de tenant** : desktop = ligne haute ; mobile/tablet = dans le menu ; aria pour accessibilité.

---

## 13. Résumé

- **Multi-tenant pour le chrome** = même comportement adaptatif (états, overlays, mobile, télémétrie), avec **contenu et options pilotés par une config par tenant** (branding, navigation, sources/apps, visibilité des filtres/liens, options d’affichage). **ERP-agnostique** : le tenant = espace de pilotage ; les briques exposées = sources métier (ERP, POS, Banque, Admin, etc.), sans dépendance conceptuelle à un ERP précis.
- **Pas de fork de code par tenant** : un seul bundle, une config chargée au runtime (ou au build si nécessaire).
- **Config ≠ permissions** : la config décrit l’affichage ; les droits réels viennent d’un mécanisme d’autorisation.
- **Deux providers** : TenantContext (tenant, config, permissions, switch) et ChromeAdaptiveContext (état chrome) restent distincts.

**Suite** : **SPEC_TENANT_CONTEXT_ET_CHROME_v1.0.md** (source de vérité tenant, URL, config, permissions, rules of switch, fallback).

---

**Version** : 1.1 (consolidée)  
**Répertoire** : ZeDocs/web54  
**Liens** : SPEC_TENANT_CONTEXT_ET_CHROME_v1.0.md ; RAPPORT_IMPLEMENTATION_CHROME_ADAPTATIF_v1.0.md, PLAN_IMPLEMENTATION_FRONT_LINKY_CHROME_v1.1.md (ZeDocs/web53).

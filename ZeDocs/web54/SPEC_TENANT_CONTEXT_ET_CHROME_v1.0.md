# Spec — TenantContext, tenant-config et rules of switch

**Date** : mars 2026  
**Répertoire** : ZeDocs/web54  
**Réf.** : NOTE_CHROME_MULTI_TENANT_v1.0.md (note consolidée v1.1)  
**Tenants cibles** : laplatine2026, o19.

**Objectif** : verrouiller la source de vérité du tenant, le contrat de config (chrome + workspace), les règles de switch, l’URL, les permissions et le fallback pour le chrome Linky multi-tenant.

---

## 1. Périmètre et principes

- **Tenant** = espace de pilotage, connecté à une ou plusieurs sources métier (ERP, POS, Banque, etc.). Config **ERP-agnostique**.
- **Un seul moteur de chrome** ; contenu et options pilotés par **config par tenant**.
- **TenantContext** et **ChromeAdaptiveContext** restent distincts (cf. note §8).

---

## 2. Source de vérité du tenant

### 2.1 requestedTenant / resolvedTenant

| Notion | Définition |
|--------|------------|
| **requestedTenant** | Ce que l’URL (ou l’utilisateur) demande. Peut être inexistant, interdit ou non chargé. |
| **resolvedTenant** | Tenant effectivement appliqué après résolution : existe, utilisateur autorisé, config chargée (ou fallback). |

**Cycle** :  
1. L’URL (ou le sélecteur) fournit le `requestedTenant`.  
2. Le système résout : existence du tenant, permissions utilisateur, chargement de la config.  
3. Le contexte applique le `resolvedTenant`. En cas d’échec, on reste en fallback (pas d’application du tenant demandé) ; message d’erreur ou redirection selon le cas.

### 2.2 Stratégie d’URL (décision)

- **Vérité dans l’URL** : le tenant courant est reflété dans l’URL (host unique + param ou segment).
- **Forme retenue** : **segment de path** — ex. `/linky/laplatine2026/...` ou `/linky/o19/...`. Alternative acceptable en phase 1 : query `?tenant=laplatine2026`.
- **Nom du segment/param** : `tenant` (ex. path `/t/laplatine2026` ou query `tenant=laplatine2026`). À aligner avec le routage Next.js / app existant.
- **Partage / refresh** : un lien = un tenant ; le refresh conserve le tenant.

### 2.3 Comportement si `requestedTenant` absent (null)

Cas : arrivée sur une URL sans segment tenant, ou route incomplète → `requestedTenant = null`.

**Règle v1** : définir **une** des options suivantes (à trancher au moment de l’implémentation) :

- **Redirection** vers le premier tenant autorisé (si un seul, transparent pour l’utilisateur).
- **Écran de choix** : afficher la liste des tenants accessibles et laisser l’utilisateur choisir avant d’entrer dans Linky.
- **Fallback neutre** : afficher un shell minimal (branding neutre, pas de données) avec message invitant à choisir un espace ou à utiliser un lien direct.

La spec n’impose pas laquelle ; le plan d’implémentation devra trancher et documenter le choix.

---

## 3. Contrat tenant-config (API)

### 3.1 Endpoint

- **GET** `/api/tenant-config` (ou équivalent côté backend) avec contexte tenant (header, cookie ou segment d’URL).
- Réponse : JSON `{ configVersion: string, chrome: TenantChromeConfig, workspace: TenantWorkspaceConfig, permissions?, availableTenants? }`.
- **`configVersion`** (ex. `"1.0"`) : version du schéma de config, pour gérer les évolutions futures de `chrome` / `workspace` sans ambiguïté.

### 3.2 Schéma `chrome`

| Clé | Type | Description |
|-----|------|-------------|
| `branding` | object | |
| `branding.logoUrl` | string? | URL du logo. |
| `branding.productName` | string? | Nom produit (ex. "Dorevia Linky"). |
| `branding.tagline` | string? | Tagline optionnelle. |
| `header` | object | |
| `header.showCompanyFilter` | boolean? | Afficher le filtre société. |
| `header.showPeriodFilter` | boolean? | Afficher le filtre période. |
| `header.showPinChrome` | boolean? | Afficher "Garder le bandeau". |
| `footer` | object | |
| `footer.showTrustDrawer` | boolean? | Afficher le drawer "Confiance système". |
| `footer.vaultLinkLabel` | string? | Libellé du lien Vault. |
| `behavior` | object | |
| `behavior.allowAutoHide` | boolean? | Autoriser le masquage auto du bandeau. |
| `behavior.defaultChromePinned` | boolean? | État initial "bandeau épinglé". |

### 3.3 Schéma `workspace`

| Clé | Type | Description |
|-----|------|-------------|
| `apps` | array | Applications / vues Linky (menu principal). |
| `apps[].id` | string | Identifiant stable. |
| `apps[].label` | string | Libellé affiché. |
| `apps[].href` | string? | Lien interne (route). |
| `apps[].viewMode` | string? | Mode vue si pertinent. |
| `sources` | array? | Liens vers systèmes métier externes (ERP, POS, Banque, Admin, etc.). Alias possible : `externalLinks`. |
| `sources[].id` | string | Identifiant (ex. "erp", "admin"). |
| `sources[].label` | string | Libellé affiché. |
| `sources[].href` | string | URL cible. |
| `sources[].type` | string? | Type optionnel : erp, pos, banque, facturation, paie, crm, admin. |

Pas de clé spécifique à un produit (ex. "Odoo") : le front consomme une liste générique de briques du SI.

**Discipline workspace** : `workspace.apps` = navigation interne Linky / Dorevia ; `workspace.sources` = systèmes externes / liens SI ; permissions séparées ; pas de logique produit enfouie dans les labels. Cela préserve l’agnosticisme ERP.

### 3.4 Cache côté client

- La config est **cacheable par tenant** (ex. mémoire ou sessionStorage).
- **Invalidation** : au **switch de tenant** (requestedTenant change), ou à **expiration** (TTL optionnel, ex. 5 min). Au switch, on recharge la config du nouveau tenant avant d’appliquer le resolvedTenant.
- **Portée** : tout cache dépendant du tenant (config, liste des sociétés, métriques dashboard, apps/sources visibles, permissions) doit être **invalidé au switch**. Même si certaines invalidations ne sont pas implémentées dès la v1, la règle est normative pour éviter les incohérences.

### 3bis. Valeurs par défaut normatives

En l’absence de configuration explicite, les valeurs par défaut suivantes s’appliquent :

- `branding.productName` = `"Dorevia Linky"`
- `header.showCompanyFilter` = `true`
- `header.showPeriodFilter` = `true`
- `header.showPinChrome` = `true`
- `footer.showTrustDrawer` = `true`
- `behavior.allowAutoHide` = `true`
- `behavior.defaultChromePinned` = `false`
- `workspace.apps` = `[]`
- `workspace.sources` = `[]`

Objectif : garantir un rendu sûr, neutre et cohérent en cas de config partielle.

---

## 4. Permissions (articulation config / droits)

- **Config** = ce qui est *disponible* pour le tenant (branding, liste d’apps, liste de sources, options header/footer).
- **Permissions** = ce que l’utilisateur *a le droit* de voir ou faire (accès au tenant, sociétés, sources, drawer confiance, mode Synthèse, etc.).

**Règle** : la config ne fait jamais office de sécurité. Les permissions sont fournies par un mécanisme dédié (API, rôle, JWT, etc.). Le front masque ou désactive selon les permissions ; le backend refuse les accès non autorisés.

**Décision v1** : **les permissions sont retournées dans la même réponse que `tenant-config`** (ex. `GET /api/tenant-config` → `{ configVersion, chrome, workspace, permissions }`). Intérêts : moins d’allers-retours, moins de race conditions, résolution du `resolvedTenant` plus simple. Une séparation (endpoint dédié) pourra être envisagée plus tard si le backend l’exige.

**Origine de `availableTenants`** : en v1, **une seule source** pour la liste des tenants accessibles à l’utilisateur. Soit elle est retournée par `GET /api/tenant-config` (même réponse), soit par un endpoint session/utilisateur dédié. Une fois le choix fait côté backend, ne pas mélanger les deux (évite incohérence entre URL demandée, permissions et liste affichée dans le sélecteur).

---

## 5. Rules of switch (changement de tenant)

### 5.1 Ordre des opérations

1. L’utilisateur change de tenant (URL ou sélecteur) → nouveau `requestedTenant`.
2. Résolution : existence, permissions, chargement config du nouveau tenant.
3. Si succès : appliquer `resolvedTenant`, injecter la nouvelle config, puis appliquer les règles UI ci-dessous. Si échec : rester sur l’ancien resolvedTenant (ou fallback) et afficher erreur.

### 5.2 Réinitialisation des filtres

| Donnée | Règle |
|--------|--------|
| **Société** | Réinitialiser si la société courante n’appartient pas au nouveau tenant (ou liste sociétés vide). Sinon, conserver si encore valide. |
| **Période** | Réinitialiser si hors périmètre du nouveau tenant (ex. exercice inconnu). Sinon, conserver si encore valide. |
| **Mode (Cockpit / Synthèse)** | **Conserver** : pas de reset du mode de lecture. |

### 5.3 État UI

- **Overlays** : fermer tous (menu, selects, drawer footer).
- **Chrome** : remettre dans un état stable **expanded** (ni compact ni hidden).
- **Chrome pinned** : réinitialiser selon `behavior.defaultChromePinned` de la nouvelle config (ou défaut false).

### 5bis. Règle anti-concurrence au switch

Si plusieurs résolutions de tenant sont lancées successivement (changements rapides par l’utilisateur), **seule la requête la plus récente** peut mettre à jour :

- `resolvedTenant`
- `tenantConfig`
- `permissions`

Toute réponse réseau obsolète doit être **ignorée**.

Objectif : éviter qu’une réponse tardive applique un ancien tenant après un switch plus récent.

### 5ter. Portée du mode de lecture

Le mode de lecture (**Cockpit** / **Synthèse**) est conservé au changement de tenant lorsqu’il est disponible dans le nouveau contexte.

Le changement de mode **n’altère ni** le tenant courant, ni la société courante, ni la période courante. Il modifie **uniquement la vue** appliquée au périmètre courant.

---

## 6. Fallback (config indisponible ou accès refusé)

| Situation | Comportement |
|-----------|--------------|
| **Config ne charge pas** (timeout, erreur réseau, 5xx) | Branding neutre "Dorevia Linky" ; navigation minimale ; footer standard. Retry possible selon politique (ex. 1 retry après 2 s). |
| **403 / tenant interdit** | Ne pas appliquer le tenant demandé. Afficher message d’erreur propre ("Accès refusé" / "Tenant non autorisé"), sans détail technique. Proposer de revenir à l’accueil ou au tenant précédent si disponible. |
| **Tenant inconnu (404)** | Même principe : message clair "Tenant introuvable", pas de stack trace. |
| **Config partielle** | Utiliser les valeurs reçues ; pour les champs manquants, appliquer des défauts sûrs (branding neutre, pas de liens sensibles, filtres visibles). |

---

## 7. Place du sélecteur de tenant (header)

- **Desktop** : ligne haute du header, à côté du branding (ou à droite des actions globales). Un seul sélecteur visible (dropdown ou boutons).
- **Tablette / mobile** : le sélecteur de tenant est replié dans le **menu** (drawer ou menu burger), pour ne pas surcharger la ligne principale. Le switch Cockpit | Synthèse reste prioritaire sur la ligne visible.
- **Accessibilité** : aria-label explicite (ex. "Choisir l’espace de pilotage"), et annonce du tenant actif (ex. "Espace actuel : laplatine2026").

---

## 8. TenantContext (responsabilités front)

Le provider **TenantContext** expose au minimum :

- `requestedTenant: string | null`
- `resolvedTenant: string | null`
- `tenantConfig: { chrome?, workspace? } | null` (config du resolvedTenant)
- `permissions: TenantPermissions | null` (si fourni par la même source)
- `availableTenants: { id: string, label?: string }[]` (liste des tenants accessibles ; origine unique en v1 — §4)
- `setTenant(id: string)` ou équivalent (navigation vers le tenant demandé, déclenche le cycle résolution + règles de switch)
- **État de résolution** : entre la demande et l’application du `resolvedTenant`, l’UI est en état **`resolving`** (exposé côté code via `isLoading: boolean`). Nommer explicitement cet état facilite le plan d’implémentation et les tests.
- `error: Error | null` (erreur de résolution ou d’accès)

Le **ChromeAdaptiveContext** reste inchangé (états expanded/compact/hidden, pinned, device, etc.) et ne dépend pas du tenant.

---

## 9. Points d’intégration (rappel)

- **ReportHeader** : consommer `TenantContext` (tenantConfig.chrome, tenantConfig.workspace) pour branding, menu apps, menu sources, visibilité des filtres et du "Garder le bandeau".
- **LinkyFooter** : consommer `tenantConfig.chrome.footer` pour drawer et lien Vault.
- **Routage** : lire le segment/param `tenant` pour définir `requestedTenant` ; après résolution, fournir `resolvedTenant` et config aux composants.

---

## 10. Résumé des décisions

| Sujet | Décision |
|-------|----------|
| Source de vérité tenant | URL (segment path ou query) → requestedTenant ; résolution → resolvedTenant. |
| Forme URL | Segment de path (ou query en phase 1). Nom : `tenant`. |
| Config | Deux blocs : `chrome`, `workspace` ; réponse inclut `configVersion` (ex. "1.0") pour évolution du schéma. |
| Sources / liens externes | Liste `sources` (ou externalLinks) avec id, label, href, type ; pas de clé produit en dur. |
| Cache | Par tenant ; invalidation au switch (et optionnellement TTL). Tout cache tenant-scoped (config, sociétés, métriques, permissions) invalidé au switch. |
| Permissions | Séparées de la config ; fournies dans la même réponse que tenant-config en v1 ; front masque, backend refuse. |
| Defaults | Valeurs normatives §3bis si config partielle (branding neutre, filtres true, apps/sources []). |
| Anti-race | Seule la dernière résolution en cours peut mettre à jour resolvedTenant / tenantConfig / permissions. |
| Mode Cockpit/Synthèse | Conservé au switch ; changement de mode = vue uniquement, pas de changement tenant/société/période. |
| Reset au switch | Société/période si invalides ; mode conservé ; overlays fermés ; chrome expanded. |
| Fallback | Branding neutre, nav minimale, message d’erreur propre (403/404), pas de détail technique. |
| Sélecteur tenant | Desktop : ligne haute ; mobile/tablet : dans le menu. Aria pour accessibilité. |
| requestedTenant null | Redirection, écran de choix ou fallback neutre — à trancher dans le plan d’implémentation (§2.3). |
| availableTenants | Une seule source en v1 : soit tenant-config, soit endpoint session/utilisateur. |
| État resolving | Entre demande et résolution : état logique `resolving` (exposé via `isLoading`). |

---

**Version** : 1.2  
**Statut** : référence de travail pour le plan d’implémentation TenantContext et le backlog Scrum.  
**Répertoire** : ZeDocs/web54  
**Liens** : NOTE_CHROME_MULTI_TENANT_v1.0.md (note consolidée v1.1).  
**Suite** : Plan d’implémentation front — TenantContext multi-tenant ; Backlog Scrum — TenantContext / tenant-config / switch.

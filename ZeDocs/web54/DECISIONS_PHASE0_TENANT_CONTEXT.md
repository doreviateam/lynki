# Décisions Phase 0 — TenantContext multi-tenant

**Date** : mars 2026  
**Répertoire** : ZeDocs/web54  
**Réf.** : PLAN_IMPLEMENTATION_FRONT_TENANT_CONTEXT_v1.0.md, BACKLOG_SCRUM_TENANT_CONTEXT_v1.0.md

Décisions actées pour permettre l’exécution des phases 1 à 6. À réviser si le contexte produit ou backend change.

---

| Décision | Choix retenu v1 | Note |
|----------|-----------------|------|
| **requestedTenant = null** | **Redirection** vers le premier tenant autorisé si la liste `availableTenants` ne contient qu’un seul tenant ; sinon **écran de choix** listant les tenants accessibles. | Évite un écran vide ; un seul tenant = expérience transparente. |
| **Source de availableTenants** | **Dans la réponse `GET /api/tenant-config`** (même payload que chrome, workspace, permissions). Une seule source en v1. | Réduit les allers-retours et les race conditions. |
| **Forme URL phase 1** | **Query** `?tenant=laplatine2026` (ou segment si routage Next.js le permet plus tard). En phase 1, le tenant peut rester déduit du host + `/api/tenant` pour compatibilité ; l’URL reflétera le tenant dès que le sélecteur sera en place. | Minimise les changements de routage au démarrage. |
| **Backend tenant-config** | **Route front** `GET /api/tenant-config` qui, en l’absence de backend dédié, retourne une config **mock** dérivée de l’env `TENANT_ID` (et optionnellement de la query `tenant`). Contrat : `{ configVersion, chrome, workspace, permissions?, availableTenants? }`. | Permet de livrer le front sans attendre un endpoint backend ; le backend pourra remplacer plus tard. |

---

**Blocage levé pour Phase 1** : oui.  
**Version** : 1.0

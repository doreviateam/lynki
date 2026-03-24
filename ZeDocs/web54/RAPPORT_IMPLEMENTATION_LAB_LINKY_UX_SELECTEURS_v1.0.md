# Rapport d’implémentation — Lab Linky : UX et sélecteurs

**Date** : mars 2026  
**Répertoire** : ZeDocs/web54  
**Références** : RAPPORT_IMPLEMENTATION_TENANT_CONTEXT_SIMULE_v1.0.md, SPEC_TENANT_CONTEXT_ET_CHROME_v1.0.md

**Statut** : Livré. Ce document décrit les correctifs et évolutions réalisés sur l’instance lab Linky (lab.linky.doreviateam.com) et les sélecteurs (tenant, société).

**Contexte** : Instance générique multi-tenant `lab.linky.doreviateam.com` avec choix d’espace (La Platine / O19) et affichage des libellés attendus dans le header.

---

## 1. Synthèse

Les évolutions suivantes ont été réalisées et déployées :

1. **Sélecteur de tenant** : passage à un dropdown unique (bouton + liste) qui se replie automatiquement à la sélection ; plus de boutons côte à côte pour 2 tenants. Placement à gauche du menu burger dans le header.
2. **Visibilité du dropdown tenant** : le dropdown « La Platine / O19 » était rogné par le header ; correction via `overflow-visible` lorsque le bandeau est affiché, pour que la liste s’affiche correctement.
3. **Sélecteur de société** : affichage de « odoo:1 » au lieu du nom de la société. Mise en place du support de `COMPANY_DISPLAY_NAMES` par tenant (format plat pour instances dédiées, format imbriqué pour l’instance générique) et configuration des libellés réels (ex. « SARL La Platine », « Ma Société ») sur linky-generic.

**Livré** : Modifications code (TenantSelector, DashboardWithFilters, API companies, docker-compose linky-generic), builds et déploiements sur Vault, Linky laplatine2026, Linky o19, linky_generic.

---

## 2. Périmètre livré

| Thème | Problème / objectif | Solution livrée |
|-------|----------------------|-----------------|
| **Sélecteur tenant** | Réduire les clics et uniformiser : 1 tenant parmi n, dropdown qui se ferme à la sélection. | TenantSelector en mode dropdown uniquement (inline) ; fermeture automatique au clic sur un tenant ; coche sur le tenant actif. |
| **Dropdown coupé** | Liste « La Platine / O19 » non visible ou tronquée sous le bouton. | Header sticky : `overflow-visible` quand le chrome est visible, `overflow-hidden` uniquement quand le bandeau est masqué (animation). |
| **Libellé société** | Sélecteur société affichait « odoo:1 » au lieu du nom (ex. SARL La Platine). | API `/api/companies` : support de `COMPANY_DISPLAY_NAMES` par tenant ; linky-generic configuré avec libellés La Platine et O19. Suppression du fallback générique « Société 1 ». |

---

## 3. Fichiers modifiés

| Fichier | Modifications principales |
|---------|---------------------------|
| `units/dorevia-linky/components/TenantSelector.tsx` | Comportement unique en dropdown : bouton avec libellé du tenant actif + chevron ; liste avec options et coche sur l’actif ; fermeture automatique à la sélection (`handleSelect` → `setOpen(false)`). Suppression du cas particulier 2 boutons côte à côte. |
| `units/dorevia-linky/components/DashboardWithFilters.tsx` | Conteneur du header : `className` conditionnel `overflow-visible` (chrome visible) / `overflow-hidden` (chrome masqué) pour ne plus rogner le dropdown du TenantSelector. |
| `units/dorevia-linky/app/api/companies/route.ts` | Fonction `getDisplayNames(raw, tenant)` : support du format par tenant `{"laplatine2026":{"odoo:1":"SARL La Platine"},"o19":{"odoo:1":"Ma Société"}}` et rétrocompatibilité format plat `{"odoo:1":"SARL La Platine"}`. Enrichissement des sociétés avec `display_name` issu de ce mapping ; plus de fallback « Société 1 ». |
| `tenants/linky-generic/docker-compose.yml` | Variable d’environnement `COMPANY_DISPLAY_NAMES` avec JSON par tenant pour afficher « SARL La Platine » (laplatine2026) et « Ma Société » (o19) dans le sélecteur de société. |

---

## 4. Décisions techniques

- **Dropdown tenant** : un seul pattern (dropdown) pour tout nombre de tenants ; expérience « sélectionner 1 parmi n » cohérente ; fermeture à la sélection pour limiter les clics.
- **Overflow header** : le masquage du bandeau repose sur `transform` + `maxHeight` ; `overflow-hidden` n’est nécessaire que pendant l’état « masqué » pour éviter tout débordement visuel. En état « visible », `overflow-visible` permet au dropdown (position absolute) de s’afficher sous le header sans être rogné.
- **COMPANY_DISPLAY_NAMES** :
  - **Format plat** (instances dédiées laplatine2026, o19) : `{"odoo:1":"SARL La Platine"}` — inchangé, utilisé pour tous les appels.
  - **Format par tenant** (instance générique) : `{"laplatine2026":{"odoo:1":"SARL La Platine"},"o19":{"odoo:1":"Ma Société"}}` — la clé `tenant` (issue du query `?tenant=`) permet de choisir le bon mapping. Si la clé tenant n’existe pas dans le JSON, on retombe sur l’interprétation en format plat pour compatibilité.

---

## 5. Comportement attendu après livraison

| Scénario | Comportement |
|----------|--------------|
| **lab.linky.doreviateam.com, choix tenant** | Clic sur le bouton « La Platine » (ou tenant actif) ouvre la liste ; sélection « O19 » (ou autre) met à jour l’URL et ferme le dropdown ; l’affichage reflète le tenant choisi. |
| **Sélecteur société (lab, La Platine)** | Le select société affiche « SARL La Platine » (et non « odoo:1 »). |
| **Sélecteur société (lab, O19)** | Le select société affiche « Ma Société » (et non « odoo:1 »). |
| **Instances dédiées (laplatine2026, o19)** | Comportement inchangé ; `COMPANY_DISPLAY_NAMES` au format plat dans leur docker-compose continue de fournir le bon libellé. |

---

## 6. Déploiement

- **Script** : `./scripts/build_deploy_vault_laplatine_o19.sh` (Vault + Linky laplatine2026 + Linky o19).
- **Instance générique** : `docker compose -f tenants/linky-generic/docker-compose.yml up -d` après build, pour prendre en compte la nouvelle image et la variable `COMPANY_DISPLAY_NAMES`.
- **Images** : `dorevia/vault:bfr-complet-2026-03-15`, `dorevia/linky:bfr-complet-2026-03-15`.

---

## 7. Récapitulatif des livrables

| Livrable | Statut |
|----------|--------|
| Sélecteur tenant en dropdown unique, fermeture auto à la sélection | ✅ |
| Dropdown tenant visible (overflow header corrigé) | ✅ |
| Libellés société par tenant (API + format par tenant) | ✅ |
| Configuration linky-generic (COMPANY_DISPLAY_NAMES) | ✅ |
| Build & deploy (Vault, laplatine2026, o19, linky_generic) | ✅ |

---

**Version** : 1.0  
**Répertoire** : ZeDocs/web54  
**Type** : Rapport d’implémentation (Lab Linky — UX et sélecteurs).  
**Documents liés** : RAPPORT_IMPLEMENTATION_TENANT_CONTEXT_SIMULE_v1.0.md, SPEC_TENANT_CONTEXT_ET_CHROME_v1.0.md.

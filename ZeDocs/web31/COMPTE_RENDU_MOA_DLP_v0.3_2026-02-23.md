# Compte rendu MOA — DLP (Decision Link Performance) v0.3

**Date :** 24 février 2026 (mise à jour)  
**Objet :** Point d'avancement implémentation DLP — Phases 0 à 7  
**Référence :** SPEC_DLP_v0.3.md, PLAN_IMPLEMENTATION_DLP_v0.3_SCRUM.md

---

## 1. Résumé exécutif

L'implémentation de la DLP (Decision Link Performance) est **achevée pour les Phases 0 à 6**. Les phases 1 à 4 (backend), Phase 0 (prérequis Odoo), Phase 5 (interface Linky) et Phase 6 (connecteur Odoo) sont réalisées.  
Le flux complet est opérationnel : création timesheet Odoo → connecteur → DLP → card Énergie stratégique dans Linky.  
La Phase 7 (runbook, checklist) est réalisée — documentation opérationnelle à jour.

---

## 2. Rappel : qu'est-ce que la DLP ?

La **DLP** structure les décisions stratégiques à partir des données consolidées dans Linky. Elle mesure **l'orientation réelle de l'énergie organisationnelle** (temps validé) sur des périmètres métier définis, sans mesure de performance individuelle.

**Principe :**  
1 déclaration validée + 1 DLP associée = 1 hit → répartition visible dans la card « Énergie stratégique ».

---

## 3. Ce qui a été réalisé

### Phase 1 — Service DLP (squelette) ✅

| Livrable | Statut | Détail |
|----------|--------|--------|
| Unité technique `units/dlp/` | Fait | Service Go, base PostgreSQL dédiée |
| Modèle de données | Fait | Tables : tenants, companies, business_perimeters, dlps, hits, project_perimeter_map |
| Migrations | Fait | 3 migrations SQL exécutées automatiquement au démarrage |
| Endpoints de contrôle | Fait | `/health`, `/ready` pour monitoring |

### Phase 2 — API CRUD ✅

| Fonctionnalité | Statut | Usage |
|----------------|--------|-------|
| Companies | Fait | Création et liste des sociétés |
| Périmètres métier | Fait | Création, liste, modification |
| DLP | Fait | Création, liste, détail, modification, archivage |
| Mapping projet → périmètre | Fait | Associer un projet ERP à un périmètre métier |

### Phase 3 — Réception des validations timesheet ✅

| Fonctionnalité | Statut | Comportement |
|----------------|--------|--------------|
| Route `POST /api/v1/timesheet-validated` | Fait | Reçoit les événements de validation |
| Résolution du mapping | Fait | Projet → périmètre via `project_perimeter_map` |
| Gestion mapping absent | Fait | 202 Accepted + log (pas d’erreur bloquante) |
| Insertion des hits | Fait | Idempotent (rejeu sans doublon) |
| Mise à jour des compteurs | Fait | hit_count sur DLP, périmètre, société |

### Phase 4 — Résumé énergie ✅

| Fonctionnalité | Statut | Détail |
|----------------|--------|--------|
| Route `GET /api/v1/dlp/energy-summary` | Fait | Agrégation pour la card Linky |
| Filtres | Fait | tenant, period_days (30/60/90), company_id |
| Format | Fait | by_perimeter, by_company, pourcentages, DLP actives |

### Intégration plateforme ✅

| Élément | Statut |
|---------|--------|
| Injection `DLP_URL` dans Linky | Fait | Linky reçoit l’URL du service DLP (render_app_compose.sh) |
| Réseau Docker | Fait | Service sur `dorevia-network`, port 8020 |

---

## 4. Ce qui reste à faire

### Phase 0 — Prérequis Odoo ✅

- Modules **project** et **hr_timesheet** installés sur sarl-la-platine (stinger)
- Scripts : `scripts/check_odoo_phase0_dlp.sh`, `scripts/install_odoo_modules_dlp.sh`
- Checklist : `ZeDocs/web31/CHECKLIST_PHASE0_ODOO_DLP.md`

### Phase 5 — Linky (interface + card) ✅

- Route proxy `/api/dlp/energy-summary` vers le service DLP
- Tuile « Énergie stratégique » (9ᵉ tuile) et card StrategicEnergyCard
- Page Gestion DLP : `/dlp` (création sociétés, périmètres, DLP, mapping)

### Phase 6 — Module Odoo dorevia_dlp_connector ✅

- Module `units/odoo/custom-addons/dorevia_dlp_connector`, hook create → POST DLP timesheet-validated
- Configuration : `dorevia.dlp.service.url`, `dorevia.dlp.tenant.id`

### Phase 7 — E2E + documentation

- Runbook : `ZeDocs/web31/RUNBOOK_DLP.md`
- Checklist : `ZeDocs/web31/CHECKLIST_ACTIVATION_DLP_TENANT.md`

---

## 5. Planning indicatif

| Phase | Estimation | Dépendance |
|-------|------------|------------|
| Phase 0 | 0,5 j | À valider par l’équipe Odoo |
| Phase 5 | 2 j | Phase 4 réalisée |
| Phase 6 | 1,5 j | Phase 0 + Phase 3 réalisée |
| Phase 7 | 1 j | Phases 5 et 6 |

**Objectif :** Clôture des phases restantes en 4 à 5 jours ouvrés.

---

## 6. Risques et points d’attention

| Point | Gravité | Commentaire |
|-------|---------|-------------|
| Workflow timesheet Odoo | Moyenne | Le hook exact (write/create) dépend de la version et du workflow — à confirmer en Phase 0 |
| Auth service DLP | Faible | P0 : pas d’auth. P1 : token ou API key à définir |
| Multi-tenant | Faible | P0 : tenant fourni dans les requêtes ; pas de restriction par utilisateur |

---

## 7. Points de décision

1. **Priorisation :** Phase 5 (Linky) ou Phase 6 (Odoo) en premier ?  
   - Recommandation : Phase 5 pour une démo visible, puis Phase 6 pour le flux complet.

2. **Données de test :** Un jeu de données de démo (companies, perimeters, DLP, mapping) est-il nécessaire avant mise en production ?

3. **Désambiguïsation tenant :** Le `tenant_id` est aujourd’hui transmis dans les requêtes. Pour Linky, utilisation du `TENANT_ID` déjà présent côté plateforme. À confirmer.

---

## 8. Annexes

### A. Références

- Spec : `ZeDocs/web31/SPEC_DLP_v0.3.md`
- Plan : `ZeDocs/web31/PLAN_IMPLEMENTATION_DLP_v0.3_SCRUM.md`
- Plan de tests : `ZeDocs/web31/PLAN_TESTS_DLP_v0.3_P0.md`
- Rapport alignement plateforme : `ZeDocs/web31/RAPPORT_ANALYSE_DLP_ALIGNEMENT_PLATEFORME.md`
- Runbook : `ZeDocs/web31/RUNBOOK_DLP.md`
- Checklist activation tenant : `ZeDocs/web31/CHECKLIST_ACTIVATION_DLP_TENANT.md`

### B. Démarrage du service DLP

```bash
cd units/dlp && docker compose up -d
# Service sur http://dlp:8020 (réseau dorevia-network)
# Health : GET /health
```

### C. Documents et scripts créés (24/02/2026)

| Document / script | Rôle |
|-------------------|------|
| `ZeDocs/web31/CHECKLIST_PHASE0_ODOO_DLP.md` | Vérification prérequis Odoo |
| `scripts/check_odoo_phase0_dlp.sh` | Diagnostic modules project/hr_timesheet |
| `scripts/install_odoo_modules_dlp.sh` | Installation automatique des modules |
| `ZeDocs/web31/RUNBOOK_DLP.md` | Procédure de déploiement |
| `ZeDocs/web31/CHECKLIST_ACTIVATION_DLP_TENANT.md` | Activation pour un nouveau tenant |
| `units/odoo/custom-addons/dorevia_dlp_connector/` | Module connecteur Odoo |

### D. Évolutions techniques réalisées

- **DLP** : acceptation du tenant par slug (ex. `sarl-la-platine`) sur toutes les routes
- **DLP** : `store.ResolveTenantID` et `GetTenantIDBySlug` pour résolution/création automatique du tenant

---

*Document rédigé pour la Maîtrise d'Ouvrage — Mise à jour 24/02/2026*

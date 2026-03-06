# 📋 Plan d'Implémentation — SPEC DVIG → Vault Forwarding v1.1.1 — Sprint D (Hardening)

**Version** : 1.1.1 — Production Ready  
**Date** : 2026-01-11  
**Mode** : Scrum  
**Objectif** : Hardening pour production — Tests unitaires, documentation, runbook

---

## 📊 Vue d'Ensemble

### Progression Globale

| Sprint | Statut | Points | Complétion | Date Début | Date Fin |
|--------|--------|--------|------------|------------|----------|
| **Sprint A** | ✅ **Complété** | 25/25 | 100% | 2026-01-11 | 2026-01-11 |
| **Sprint B** | ✅ **Complété** | 15/15 | 100% | 2026-01-11 | 2026-01-11 |
| **Sprint C** | ✅ **Complété** | 10/10 | 100% | 2026-01-11 | 2026-01-11 |
| **Sprint D** | 🟡 **En cours** | 0/12 | 0% | 2026-01-11 | - |
| **Total** | - | **50/62** | **81%** | - | - |

---

## 📦 Sprint D : Hardening — Production Ready (3-5 jours)

**Statut** : 🟡 **En cours**  
**Dates** : 2026-01-11 - 2026-01-11  
**Points** : 0/12 (0%)

### User Stories

#### US-D.1 : Tests unitaires (DVIG + Vault)

**En tant que** développeur plateforme  
**Je veux** avoir des tests unitaires complets pour DVIG et Vault  
**Afin de** garantir la qualité et la maintenabilité du code

**Points** : 5

**Critères d'acceptation** :
- [ ] Tests unitaires DVIG créés :
  - Tests pour `workers/outbox_worker.py` (process_event, classify_error, calculate_next_retry)
  - Tests pour `storage/outbox.py` (CRUD functions)
  - Tests pour `dvig/api_fastapi/routes/ingest.py` (validation, idempotence)
- [ ] Tests unitaires Vault créés :
  - Tests pour `handlers/events.go` (validation, idempotence)
  - Tests pour `storage/idempotency.go` (GetDocumentByIdempotencyKey, GetDocumentByEventID)
- [ ] Couverture de code : > 80% pour les modules critiques
- [ ] Tous les tests passent

**Tâches techniques** :
- [ ] Créer `sources/dvig/tests/unit/test_outbox_worker.py`
- [ ] Créer `sources/dvig/tests/unit/test_storage_outbox.py`
- [ ] Créer `sources/dvig/tests/unit/test_ingest_idempotence.py`
- [ ] Créer `sources/vault/tests/unit/events_test.go`
- [ ] Créer `sources/vault/tests/unit/idempotency_test.go`
- [ ] Vérifier couverture avec `pytest --cov` et `go test -cover`

**Livrables** :
- ✅ Tests unitaires opérationnels
- ✅ Rapport de couverture de code

---

#### US-D.2 : README E2E — Documentation tests end-to-end

**En tant que** développeur plateforme  
**Je veux** avoir une documentation complète des tests e2e  
**Afin de** comprendre comment exécuter et interpréter les tests

**Points** : 2

**Critères d'acceptation** :
- [ ] Document `tests/e2e/README_E2E_TESTS.md` créé
- [ ] Documentation inclut :
  - Prérequis (Vault, DVIG, Odoo)
  - Instructions d'exécution
  - Description des scénarios
  - Interprétation des résultats
  - Troubleshooting

**Tâches techniques** :
- [ ] Créer `sources/dvig/tests/e2e/README_E2E_TESTS.md`
- [ ] Documenter prérequis et setup
- [ ] Documenter scénarios de test
- [ ] Ajouter section troubleshooting

**Livrables** :
- ✅ Documentation E2E complète

---

#### US-D.3 : METRICS.md — Documentation métriques Prometheus

**En tant que** développeur plateforme  
**Je veux** avoir une documentation complète des métriques Prometheus  
**Afin de** comprendre comment monitorer le système en production

**Points** : 2

**Critères d'acceptation** :
- [ ] Document `docs/METRICS.md` créé (DVIG et Vault)
- [ ] Documentation inclut :
  - Liste complète des métriques
  - Description de chaque métrique
  - Labels et valeurs possibles
  - Exemples de requêtes Prometheus
  - Alertes recommandées

**Tâches techniques** :
- [ ] Créer `sources/dvig/docs/METRICS.md`
- [ ] Créer `sources/vault/docs/METRICS_DVIG_EVENTS.md`
- [ ] Documenter toutes les métriques
- [ ] Ajouter exemples de requêtes Prometheus
- [ ] Ajouter recommandations d'alertes

**Livrables** :
- ✅ Documentation métriques complète

---

#### US-D.4 : Runbook Production — Gestion backlog et incidents

**En tant que** opérateur plateforme  
**Je veux** avoir un runbook pour gérer les incidents en production  
**Afin de** réagir rapidement en cas de problème

**Points** : 3

**Critères d'acceptation** :
- [ ] Document `docs/RUNBOOK_PRODUCTION.md` créé
- [ ] Documentation inclut :
  - Que faire si backlog explose ?
  - Que faire si worker ne traite plus ?
  - Que faire si Vault ne répond plus ?
  - Que faire si dead letters augmentent ?
  - Procédures de récupération
  - Commandes utiles

**Tâches techniques** :
- [ ] Créer `sources/dvig/docs/RUNBOOK_PRODUCTION.md`
- [ ] Documenter scénarios d'incidents
- [ ] Documenter procédures de récupération
- [ ] Ajouter commandes utiles (CLI, SQL, etc.)

**Livrables** :
- ✅ Runbook production opérationnel

---

## 📊 Récapitulatif

### Progression Globale

| Sprint | Statut | Points | Complétion | Date Début | Date Fin |
|--------|--------|--------|------------|------------|----------|
| **Sprint A** | ✅ **Complété** | 25/25 | 100% | 2026-01-11 | 2026-01-11 |
| **Sprint B** | ✅ **Complété** | 15/15 | 100% | 2026-01-11 | 2026-01-11 |
| **Sprint C** | ✅ **Complété** | 10/10 | 100% | 2026-01-11 | 2026-01-11 |
| **Sprint D** | 🟡 **En cours** | 0/12 | 0% | 2026-01-11 | - |
| **Total** | - | **50/62** | **81%** | - | - |

---

## 🔗 Références

- **SPEC corrigée** : `SPEC_DVIG_VAULT_FORWARDING_v1.1_CORRIGEE.md`
- **Plan Scrum v1.1** : `PLAN_IMPLEMENTATION_DVIG_VAULT_FORWARDING_v1.1_SCRUM.md`
- **État d'implémentation** : `ETAT_IMPLEMENTATION_DVIG_VAULT_FORWARDING_v1.1.md`

---

**Plan Sprint D créé** ✅

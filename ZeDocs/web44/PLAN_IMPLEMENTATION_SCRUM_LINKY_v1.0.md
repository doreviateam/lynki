# Plan d'implémentation Scrum — Linky

**Version :** 1.0  
**Date :** 13 mars 2026  
**Produit :** Dorevia Linky  
**Statut :** Plan de développement

---

## 1. Vue d'ensemble

Ce document définit le **plan d'implémentation Scrum** pour compléter le cockpit Linky selon les spécifications et l'avis d'expert (AVIS_EXPERT_IMPLEMENTATION_LINKY.md).

### 1.1 Périmètre

| Dimension | Contenu |
|-----------|---------|
| **Instruments** | Compléter la grille 12 instruments (BFR, Encours, EBE) |
| **Metric Engine** | Implémenter le moteur sémantique (DAG, cache, API) |
| **Event Registry** | Spécifier la nomenclature des événements DVIG |
| **Tests** | Automatiser Pareto ABC, grille KPI |
| **Migration** | Cockpit : `dashboard-metrics` → `GET /api/instruments` |

### 1.2 Références

| Document | Rôle |
|----------|------|
| `SPEC_LINKY_COCKPIT_INSTRUMENTS_v1.0.md` | Instruments, grille 4×3 |
| `SPEC_LINKY_INSTRUMENT_MODEL_v1.0.md` | Modèle structurel |
| `SPEC_LINKY_METRIC_REGISTRY_v1.0.md` | Registre des 12 métriques |
| `SPEC_LINKY_METRIC_ENGINE_v1.0.md` | Moteur d'exécution |
| `AVIS_EXPERT_IMPLEMENTATION_LINKY.md` | Priorités P1–P5 |

### 1.3 Conventions

- **Sprint** : 2 semaines
- **Story points** : 1 = trivial, 2 = simple, 3 = moyen, 5 = complexe, 8 = très complexe
- **Definition of Done** : Code review, tests unitaires si applicable, déploiement o19/laplatine2026

---

## 2. Backlog priorisé

| ID | Priorité | Épique / Story | SP | Sprint |
|----|----------|----------------|----|--------|
| US-01 | P3 | **Event Registry** — Spécifier nomenclature DVIG | 2 | 1 |
| US-02 | P1 | **BFR** — Instrument Besoin en Fonds de Roulement | 3 | 1 |
| US-03 | P1 | **Encours** — Instrument Encours dédié | 3 | 2 |
| US-04 | P1 | **EBE** — Instrument Excédent Brut d'Exploitation | 3 | 2 |
| US-05 | P2 | **Metric Engine** — DAG et dépendances | 5 | 3 |
| US-06 | P2 | **Metric Engine** — Cache et invalidation | 5 | 3 |
| US-07 | P2 | **Metric Engine** — API GET /instruments | 3 | 4 |
| US-08 | P5 | **Migration** — Cockpit consomme /instruments | 5 | 4 |
| US-09 | P4 | **Tests** — Pareto ABC et grille KPI | 3 | 5 |
| US-10 | P5 | **Dépréciation** — dashboard-metrics | 2 | 5 |

**Total estimé :** 35 SP (~6 sprints à 6 SP/sprint)

---

## 3. Sprints détaillés

---

### Sprint 1 — Event Registry + BFR (2 semaines)

**Objectif :** Poser les fondations (nomenclature) et livrer le premier instrument manquant.

#### US-01 — SPEC_DVIG_EVENT_REGISTRY

**En tant que** développeur DVIG/Vault  
**Je veux** une spécification de la nomenclature des événements financiers  
**Afin de** garantir l'alignement entre émetteurs, Vault et Metric Engine.

**Critères d'acceptation :**
- [ ] Document `SPEC_DVIG_EVENT_REGISTRY_v1.0.md` créé
- [ ] Liste exhaustive des types d'événements (payment.received, payment.sent, invoice.issued, etc.)
- [ ] Mapping vers les métriques du Metric Registry
- [ ] Validation par l'équipe DVIG

**Tâches techniques :**
- Inventorier les événements dans le code DVIG/Vault
- Rédiger la spec avec structure (event_id, label, payload, consumers)
- Réviser le Metric Registry pour référencer les event_id

**Story points :** 2

---

#### US-02 — Instrument BFR (Besoin en Fonds de Roulement)

**En tant que** dirigeant  
**Je veux** voir le BFR dans le cockpit  
**Afin de** piloter ma trésorerie et mon cycle d'exploitation.

**Critères d'acceptation :**
- [ ] Tuile BFR affichée dans la grille (position selon SPEC Cockpit §3.1)
- [ ] Valeur calculée : Stocks + Créances clients - Dettes fournisseurs (ou formule Metric Registry)
- [ ] Card détaillée au clic (décomposition si possible)
- [ ] Indicateur de statut (ok / warning / alert) cohérent avec les autres instruments
- [ ] Style cockpit dark (palette Fygr)

**Tâches techniques :**
- Créer `WorkingCapitalCard.tsx` ou `BfrCard.tsx`
- Intégrer les données depuis `dashboard-metrics` (ou endpoint dédié si existant)
- Ajouter l'instrument dans `IconGrid` / `DashboardWithFilters`
- Documenter la formule dans le Metric Registry

**Story points :** 3

**Dépendances :** Aucune (utilise dashboard-metrics existant)

---

### Sprint 2 — Encours + EBE (2 semaines)

**Objectif :** Compléter la grille 12 instruments.

#### US-03 — Instrument Encours (dédié)

**En tant que** dirigeant  
**Je veux** un instrument dédié aux encours (créances, dettes)  
**Afin de** distinguer l'encours de l'activité Business (CA, marges).

**Critères d'acceptation :**
- [ ] Tuile Encours affichée (position Cockpit : ligne 2, colonne 2)
- [ ] Valeur = encours créances + encours dettes (ou définition Metric Registry)
- [ ] Card détaillée avec répartition créances / dettes
- [ ] Cohérence visuelle avec les autres instruments

**Tâches techniques :**
- Créer `EncoursCard.tsx` ou étendre une card existante
- S'assurer que les données encours sont exposées par Vault/API
- Intégrer dans la grille

**Story points :** 3

---

#### US-04 — Instrument EBE (Excédent Brut d'Exploitation)

**En tant que** dirigeant  
**Je veux** voir l'EBE dans le cockpit  
**Afin de** suivre la performance opérationnelle.

**Critères d'acceptation :**
- [ ] Tuile EBE affichée (position Cockpit : ligne 3, colonne 4)
- [ ] Formule : CA - Achats - Charges externes (ou définition Metric Registry)
- [ ] Card détaillée avec décomposition
- [ ] Indicateur de statut

**Tâches techniques :**
- Créer `EbitdaCard.tsx` ou `EbeCard.tsx`
- Vérifier les sources de données (Vault, agrégations)
- Intégrer dans la grille

**Story points :** 3

---

### Sprint 3 — Metric Engine (DAG + Cache) (2 semaines)

**Objectif :** Implémenter le cœur du Metric Engine (SPEC Metric Engine v1.1).

#### US-05 — Metric Engine : DAG et dépendances

**En tant que** système Linky  
**Je veux** un graphe de dépendances des métriques  
**Afin de** calculer les métriques dans le bon ordre et détecter les cycles.

**Critères d'acceptation :**
- [ ] Dependency Graph construit depuis le Metric Registry
- [ ] Topological sort pour ordre d'exécution
- [ ] Détection de cycles (erreur explicite si cycle détecté)
- [ ] Support métriques base + derived
- [ ] Tests unitaires sur le graphe

**Tâches techniques :**
- Créer module `metric-engine/` (ou équivalent dans dorevia-linky / vault)
- Implémenter `buildDependencyGraph()`, `topologicalOrder()`, `detectCycles()`
- Charger le Registry depuis config ou JSON
- Documenter l'API interne

**Story points :** 5

**Référence :** SPEC_LINKY_METRIC_ENGINE_v1.0.md §2, §3

---

#### US-06 — Metric Engine : Cache et invalidation

**En tant que** système Linky  
**Je veux** un cache par nœud avec invalidation granulaire  
**Afin de** limiter les recalculs et garantir la fraîcheur des données.

**Critères d'acceptation :**
- [ ] Cache en mémoire par (metric_id, scope)
- [ ] TTL configurable par métrique
- [ ] Invalidation à la réception d'événements (webhook ou poll)
- [ ] `data_freshness` et `status` exposés par métrique
- [ ] Endpoint `GET /metrics/engine` (cache_hit_rate, latency, etc.)

**Tâches techniques :**
- Implémenter `CacheLayer` avec invalidation par event_type
- Intégrer `data_freshness` (timestamp dernière mise à jour)
- Exposer métriques observabilité (Prometheus ou JSON)

**Story points :** 5

**Référence :** SPEC_LINKY_METRIC_ENGINE_v1.0.md §4, §8

---

### Sprint 4 — API Instruments + Migration (2 semaines)

**Objectif :** Exposer l'API instruments et migrer le cockpit.

#### US-07 — Metric Engine : API GET /instruments

**En tant que** front-end Linky  
**Je veux** un endpoint `GET /api/instruments`  
**Afin de** récupérer toutes les valeurs des instruments en une requête.

**Critères d'acceptation :**
- [ ] `GET /api/instruments?scope=...` retourne les 12 instruments
- [ ] Format compatible avec IconGrid (formatted, status, etc.)
- [ ] Support paramètres (tenant, period, etc.)
- [ ] Latence raisonnable (< 2 s P95)

**Tâches techniques :**
- Créer route `/api/instruments` dans dorevia-linky ou gateway
- Déléguer au Metric Engine pour le calcul
- Adapter le format de réponse au format actuel des cards

**Story points :** 3

---

#### US-08 — Migration cockpit : dashboard-metrics → /instruments

**En tant que** utilisateur Linky  
**Je veux** que le cockpit utilise le Metric Engine  
**Afin de** bénéficier du cache, de la traçabilité et de l'extensibilité.

**Critères d'acceptation :**
- [ ] IconGrid et toutes les cards consomment `GET /api/instruments`
- [ ] Comportement identique (non-régression visuelle et fonctionnelle)
- [ ] Fallback ou feature flag si Metric Engine indisponible (optionnel)
- [ ] Déploiement validé sur o19 et laplatine2026

**Tâches techniques :**
- Modifier les composants pour appeler `/api/instruments`
- Supprimer ou adapter les appels à `dashboard-metrics`
- Tests de non-régression manuels ou E2E

**Story points :** 5

**Dépendances :** US-07

---

### Sprint 5 — Tests + Dépréciation (2 semaines)

**Objectif :** Sécuriser la qualité et finaliser la migration.

#### US-09 — Tests automatisés (Pareto ABC, grille KPI)

**En tant que** développeur  
**Je veux** des tests automatisés pour Pareto ABC et la grille KPI  
**Afin de** éviter les régressions.

**Critères d'acceptation :**
- [ ] Tests unitaires : partition ABC (seuils 80 % / 95 %)
- [ ] Tests unitaires ou visuels : grille 12 instruments (présence, ordre)
- [ ] Tests sur les constantes (STATUS_COLORS, STATUS_BG) si extraites
- [ ] CI exécute les tests

**Tâches techniques :**
- Créer `BusinessCard.test.tsx` ou `pareto-utils.test.ts`
- Tests pour `IconGrid` (nombre de tuiles, ordre)
- Extraire STATUS_COLORS vers module partagé (optionnel)

**Story points :** 3

**Référence :** AVIS_EXPERT §6.3

---

#### US-10 — Dépréciation dashboard-metrics

**En tant que** équipe technique  
**Je veux** déprécier ou faire déléguer `dashboard-metrics`  
**Afin de** simplifier l'architecture et éviter la duplication.

**Critères d'acceptation :**
- [ ] `dashboard-metrics` déprécié ou délègue au Metric Engine
- [ ] Documentation mise à jour
- [ ] Aucun appel direct restant depuis Linky

**Tâches techniques :**
- Soit : rediriger `dashboard-metrics` vers Metric Engine
- Soit : marquer déprécié, planifier suppression
- Mettre à jour README / docs

**Story points :** 2

**Dépendances :** US-08

---

## 4. Récapitulatif des sprints

| Sprint | Durée | Objectif | Stories | SP |
|--------|-------|----------|---------|-----|
| 1 | 2 sem. | Event Registry + BFR | US-01, US-02 | 5 |
| 2 | 2 sem. | Encours + EBE | US-03, US-04 | 6 |
| 3 | 2 sem. | Metric Engine (DAG + Cache) | US-05, US-06 | 10 |
| 4 | 2 sem. | API + Migration cockpit | US-07, US-08 | 8 |
| 5 | 2 sem. | Tests + Dépréciation | US-09, US-10 | 5 |

**Durée totale estimée :** 10 semaines (~2,5 mois)

---

## 5. Dépendances et risques

### 5.1 Graphe de dépendances

```
US-01 (Event Registry) ─────────────────────────────────────────┐
                                                                 │
US-02 (BFR) ────────────────────────────────────────────────────┤
                                                                 │
US-03 (Encours) ─────────────────────────────────────────────────┤
                                                                 ├──► US-05 (DAG) ──► US-06 (Cache) ──► US-07 (API) ──► US-08 (Migration) ──► US-10 (Dépréciation)
US-04 (EBE) ────────────────────────────────────────────────────┤
                                                                 │
                                                                 └──► US-09 (Tests) — peut être fait en parallèle
```

### 5.2 Risques

| Risque | Mitigation |
|--------|------------|
| Données BFR/EBE absentes du Vault | Vérifier en Sprint 1 ; adapter formules ou sources |
| Complexité Metric Engine sous-estimée | Découper US-05/US-06 en sous-tâches ; spike technique si besoin |
| Régression lors de la migration | Feature flag, tests E2E, rollback plan |

---

## 6. Definition of Done (DoD)

Pour toute story considérée comme terminée :

- [ ] Code review effectuée
- [ ] Tests unitaires ajoutés si applicable
- [ ] Documentation mise à jour (specs, README)
- [ ] Déploiement validé sur au moins un tenant (o19 ou laplatine2026)
- [ ] Non-régression vérifiée sur les fonctionnalités existantes

---

## 7. Cérémonies suggérées

| Cérémonie | Fréquence | Participants |
|-----------|-----------|--------------|
| Sprint Planning | Début de sprint | Équipe dev, PO |
| Daily | Quotidien | Équipe dev |
| Sprint Review | Fin de sprint | Équipe, stakeholders |
| Rétrospective | Fin de sprint | Équipe dev |
| Refinement | Mi-sprint | Équipe dev, PO |

---

## 8. Historique des versions

| Version | Date | Modifications |
|---------|------|---------------|
| 1.0 | 13 mars 2026 | Version initiale |

---

*Document de planification. À mettre à jour à chaque sprint planning.*

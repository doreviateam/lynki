# Plan d'implémentation Scrum — Cockpit Linky

**Document de planification**

Version : 1.0  
Date : Mars 2026  
Référence : CAHIER_DES_CHARGES_DEV_COCKPIT_LINKY.md v1.1

---

## 1. Cadre Scrum

| Paramètre | Valeur |
|-----------|--------|
| Durée sprint | 2 semaines |
| Équipe | 1 frontend + 1 tech lead (review) |
| Vélocité cible | 21 SP/sprint (estimation) |
| Story points | Fibonacci (1, 2, 3, 5, 8) |

### Definition of Done

- [ ] Code review effectuée
- [ ] Conformité Design System vérifiée
- [ ] Pas de régression sur l'existant
- [ ] Accessibilité : focus visible, sémantique HTML

---

## 2. Backlog produit

### Epic : Refonte cockpit Linky

> En tant que CFO, je veux un cockpit financier clair et fiable afin de piloter mon entreprise en confiance.

---

### Sprint 1 — Fondations (2 semaines)

**Objectif :** Mise en place du Design System et des composants de base. La page peut afficher un cockpit statique avec données mock.

| ID | User Story | SP | Statut |
|----|------------|-----|--------|
| LS-101 | En tant que dev, je veux les tokens Tailwind Linky configurés afin de ne pas inventer les couleurs et espacements | 1 | ✅ Done |
| LS-102 | En tant que dev, je veux IBM Plex Sans comme police principale afin de respecter la direction artistique | 1 | ✅ Done |
| LS-103 | En tant que dev, je veux un composant Badge réutilisable afin d'afficher les statuts (validé, partiel, alerte) | 2 | ✅ Done |
| LS-104 | En tant que dev, je veux un composant KpiCard afin d'afficher un KPI avec titre, valeur et delta | 3 | ✅ Done |
| LS-105 | En tant que dev, je veux un composant KpiGrid afin d'afficher jusqu'à 4 KPI en grille responsive | 2 | ✅ Done |
| LS-106 | En tant que dev, je veux SkeletonCard et CockpitSkeleton afin d'afficher un état de chargement cohérent | 2 | ✅ Done |

**Total Sprint 1 :** 11 SP

**Livrable :** Tokens + Badge + KpiCard + KpiGrid + Skeleton. Page cockpit affiche 4 KPI mock + skeleton.

---

### Sprint 2 — Layout et structure (2 semaines)

**Objectif :** Structure complète du cockpit. Tous les blocs sont en place avec données mock.

| ID | User Story | SP | Statut |
|----|------------|-----|--------|
| LS-201 | En tant que dev, je veux CockpitLayout comme container principal afin de structurer la page | 2 | ✅ Done |
| LS-202 | En tant que CFO, je veux un header avec tenant, période et badges fiabilité afin de connaître le contexte immédiatement | 3 | ✅ Done |
| LS-203 | En tant que CFO, je veux un bloc Insight prioritaire afin de comprendre la situation en une phrase | 2 | ✅ Done |
| LS-204 | En tant que CFO, je veux le widget Couverture probante (jauge radiale + sources) afin de voir la fiabilité des données | 5 | ✅ Done |
| LS-205 | En tant que dev, je veux SectionGrid pour le layout 2 colonnes afin de structurer Flux / Risque / Trésorerie / Alertes | 2 | ✅ Done |

**Total Sprint 2 :** 14 SP

**Livrable :** Page cockpit complète avec Header, Insight, KPI, ProofWidget, SectionGrid. Données mock.

---

### Sprint 3 — Contenu et données (2 semaines)

**Objectif :** Graphiques, tableaux, alertes. Connexion aux APIs réelles.

| ID | User Story | SP | Statut |
|----|------------|-----|--------|
| LS-301 | En tant que dev, je veux le type CockpitData et loadCockpitData() afin de centraliser le chargement des données | 3 | ✅ Done |
| LS-302 | En tant que CFO, je veux le graphique Flux économiques (ventes vs achats) afin d'analyser les flux | 5 | ✅ Done |
| LS-303 | En tant que CFO, je veux la table Exposition clients avec colonne Preuve afin de voir les risques et leurs sources | 5 | ✅ Done |
| LS-304 | En tant que CFO, je veux le graphique Position trésorerie afin de suivre l'évolution | 3 | ✅ Done |
| LS-305 | En tant que CFO, je veux le bloc Alertes financières afin d'être alerté des actions à traiter | 3 | ✅ Done |
| LS-306 | En tant que dev, je veux connecter loadCockpitData aux APIs existantes afin d'afficher des données réelles | 5 | ✅ Done |

**Total Sprint 3 :** 24 SP

**Livrable :** Cockpit fonctionnel avec données réelles. ChartCard, TableCard, AlertCard. Intégration API.

---

### Sprint 4 — Finalisation et qualité (2 semaines)

**Objectif :** États d'erreur, responsive, accessibilité, tests. Cockpit prêt pour la production.

| ID | User Story | SP | Statut |
|----|------------|-----|--------|
| LS-401 | En tant que CFO, je veux un message d'erreur clair avec retry si le chargement échoue afin de ne pas rester bloqué | 3 | À faire |
| LS-402 | En tant que CFO, je veux des messages "Aucune donnée" pour les blocs vides afin de comprendre l'état | 2 | À faire |
| LS-403 | En tant que CFO, je veux un cockpit utilisable sur tablette (1 colonne) afin de consulter en déplacement | 3 | À faire |
| LS-404 | En tant qu'utilisateur clavier, je veux naviguer et voir les focus afin d'utiliser le cockpit en accessibilité | 2 | À faire |
| LS-405 | En tant que dev, je veux des tests E2E sur le cockpit afin de détecter les régressions | 5 | À faire |
| LS-406 | En tant que MOA, je veux une recette conforme au Design System afin de valider la livraison | 2 | À faire |

**Total Sprint 4 :** 17 SP

**Livrable :** Cockpit production-ready. États erreur/vide. Responsive. Accessibilité. Tests E2E.

---

## 3. Vue d'ensemble des sprints

| Sprint | Objectif | SP | Durée |
|--------|----------|-----|-------|
| Sprint 1 | Fondations (tokens, Badge, KpiCard, Skeleton) | 11 | 2 sem |
| Sprint 2 | Layout (Header, Insight, ProofWidget, SectionGrid) | 14 | 2 sem |
| Sprint 3 | Contenu (ChartCard, TableCard, AlertCard, API) | 24 | 2 sem |
| Sprint 4 | Finalisation (erreur, responsive, a11y, tests) | 17 | 2 sem |
| **Total** | | **66 SP** | **8 sem** |

---

## 4. Dépendances entre user stories

```
Sprint 1
LS-101 (tokens) ─┬─► LS-103 (Badge)
LS-102 (font)   ─┼─► LS-104 (KpiCard) ─► LS-105 (KpiGrid)
                 └─► LS-106 (Skeleton)

Sprint 2
LS-105 ─► LS-201 (CockpitLayout)
LS-103 ─► LS-202 (Header), LS-203 (Insight), LS-204 (ProofWidget)
LS-201 ─► LS-205 (SectionGrid)

Sprint 3
LS-201, LS-205 ─► LS-301 (CockpitData + Loader)
LS-301 ─► LS-302, LS-303, LS-304, LS-305, LS-306

Sprint 4
LS-306 ─► LS-401, LS-402, LS-403, LS-404, LS-405, LS-406
```

---

## 5. Critères d'acceptation par story (exemples)

### LS-204 — Widget Couverture probante

- [ ] Jauge radiale SVG affiche le pourcentage (0–100)
- [ ] Formule stroke-dashoffset correcte : `440 * (1 - pct/100)`
- [ ] Liste des 4 sources avec badge (Validé, Sync, Partiel, Confirmé)
- [ ] Layout : radial à gauche, sources à droite (desktop)
- [ ] Responsive : empilé sur mobile

### LS-303 — Table Exposition clients

- [ ] Colonnes : Partenaire, Encours, Retard, Preuve
- [ ] Retard avec badge warning ou danger selon seuil
- [ ] Preuve affiche source (Vault ✓, Odoo + POS)
- [ ] Hover ligne : background #14243A
- [ ] Colonnes Encours et Retard alignées à droite

### LS-306 — Connexion APIs

- [ ] loadCockpitData appelle dashboard-metrics, treasury, ar-by-partner, vault-health
- [ ] Appels en parallèle (Promise.all)
- [ ] Mapping correct vers CockpitData
- [ ] Gestion des erreurs partielles (fallback)

---

## 6. Risques et mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| APIs incomplètes | Blocage LS-306 | Données mock détaillées dès Sprint 1 |
| Scope creep | Délai | Respect strict du backlog, pas de "petites améliorations" |
| Conflit avec Dashboard existant | Régression | Branche dédiée, tests E2E avant merge |

---

## 7. Cérémonies suggérées

| Cérémonie | Fréquence | Participants |
|-----------|-----------|--------------|
| Sprint Planning | Début sprint | Dev, Tech Lead, PO |
| Daily | Quotidien | Dev |
| Review / Demo | Fin sprint | Dev, Tech Lead, MOA |
| Rétrospective | Fin sprint | Dev, Tech Lead |
| Refinement | Mi-sprint | Dev, PO |

---

## 8. Livrables par sprint (checklist)

### Sprint 1
- [x] `tailwind.config.js` mis à jour
- [x] `layout.tsx` avec IBM Plex Sans
- [x] `components/cockpit/Badge.tsx`
- [x] `components/cockpit/KpiCard.tsx`
- [x] `components/cockpit/KpiGrid.tsx`
- [x] `components/cockpit/SkeletonCard.tsx`
- [x] `components/cockpit/CockpitSkeleton.tsx`
- [x] Page cockpit affiche 4 KPI mock

### Sprint 2
- [x] `components/cockpit/CockpitLayout.tsx`
- [x] `components/cockpit/CockpitHeader.tsx`
- [x] `components/cockpit/InsightCard.tsx`
- [x] `components/cockpit/ProofWidget.tsx`
- [x] `components/cockpit/SectionGrid.tsx`
- [x] Page cockpit structure complète (mock)

### Sprint 3
- [x] `app/lib/cockpit/loadCockpitData.ts`
- [x] `app/types/cockpit.ts` (CockpitData)
- [x] `components/cockpit/ChartCard.tsx`
- [x] `components/cockpit/TableCard.tsx`
- [x] `components/cockpit/AlertCard.tsx`
- [x] `components/cockpit/CockpitBarChart.tsx` (Recharts)
- [x] `components/cockpit/CockpitError.tsx`
- [x] Connexion APIs réelles (fallback mock)

### Sprint 4
- [ ] Composant CockpitError
- [ ] États vides par bloc
- [ ] Responsive validé (900px, 600px)
- [ ] Accessibilité validée
- [ ] Tests E2E cockpit
- [ ] Recette MOA

---

---

## 9. Historique

| Date | Version | Modification |
|------|---------|--------------|
| Mars 2026 | 1.0 | Création |
| Mars 2026 | 1.1 | Sprint 1 et 2 terminés — 11 stories Done |
| Mars 2026 | 1.2 | Sprint 3 terminé — 17 stories Done |

---

*Plan d'implémentation Scrum — Cockpit Linky v1.1*

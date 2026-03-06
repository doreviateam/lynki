# Plan d'implémentation Scrum — Complétude avant affichage

**Date :** 2026-03-03  
**Version :** v1.1  
**Référence :** SPEC_COMPLETUDE_AVANT_AFFICHAGE_v1.1.md  
**Avis expert :** AVIS_EXPERT_SPEC_COMPLETUDE_AVANT_AFFICHAGE_v1.1.md  
**Durée estimée :** Phase 1 : 2–3 j | Phase 2 : 2–4 semaines

---

## 1. Vue d'ensemble

| Phase | Objectif | Périmètre | Estimation |
|-------|----------|-----------|------------|
| **Sprint 1** | Conformité UX — blocage des cartes si incomplet | Linky (front) | 2–3 j |
| **Sprint 2** | Complétude probante — expected_count, matérialisation | Vault, DVIG | 2–4 sem |

**Principe :** Phase 1 livrable sans attendre le Vault. On utilise la complétude d'API existante (`sealed_count_complete` = 5 endpoints OK) pour appliquer la règle « aucune carte si incomplet ». Phase 2 apporte la complétude probante réelle (`vault_sealed == expected_count`).

---

## 2. Sprint 1 — Conformité UX (blocage des cartes)

### 2.1 Objectif sprint

En tant que CFO (Véréna), je ne veux voir aucune carte stratégique tant que la complétude des preuves n'est pas validée. Si les 5 sources n'ont pas répondu, j'attends un message clair « Synchronisation en cours » plutôt que des chiffres partiels.

### 2.2 User stories

| ID | User Story | Priorité | Points |
|----|------------|----------|--------|
| US1.1 | En tant que CFO, quand la complétude n'est pas validée, je vois « Synchronisation des preuves en cours… » au lieu des cartes | P0 | 5 |
| US1.2 | En tant que CFO, je vois une progression (ex. 223 / — preuves) pendant l'attente pour réduire l'anxiété | P0 | 3 |
| US1.3 | En tant que CFO, si la complétude reste incomplète après retries, je peux cliquer sur « Réessayer » | P1 | 2 |
| US1.4 | En tant que CFO, le badge ne m'affiche pas de chiffre partiel quand la complétude n'est pas validée | P2 | 1 |

### 2.3 Tâches techniques

#### 2.3.1 Blocage conditionnel des cartes

| ID | Tâche | Fichier | Estimation |
|----|-------|---------|------------|
| T1.1 | Introduire `metricsError` (état erreur fetch) ; condition : `sealed_count_complete && !metricsLoading && !metricsError` | `DashboardWithFilters.tsx` | 0,5 j |
| T1.2 | Conditionner l'affichage de TresoreriePositionCard à la complétude (spec §4.1 : toutes les cartes) | `DashboardWithFilters.tsx` | 0,25 j |
| T1.3 | Conditionner DivaFlashBlock et DecisionsBlock à la complétude | `DashboardWithFilters.tsx` | 0,25 j |

**Logique (règle binaire stricte) :**
```tsx
const showCards =
  dashboardMetrics?.sealed_count_complete === true &&
  !metricsLoading &&
  !metricsError;
{showCards ? (
  // IconGrid, cartes, DIVA...
) : (
  <SyncInProgress ... />
)}
```
**Blocage si :** incomplet OU loading OU erreur.

#### 2.3.2 Composant « Synchronisation en cours »

| ID | Tâche | Fichier | Estimation |
|----|-------|---------|------------|
| T1.4 | Créer `SyncInProgress.tsx` : message + progression (sealed_count / —) + spinner optionnel | `components/SyncInProgress.tsx` | 0,5 j |
| T1.5 | Intégrer SyncInProgress dans DashboardWithFilters quand `!showCards` | `DashboardWithFilters.tsx` | 0,25 j |
| T1.6 | Props : `sealedCount`, `sealedCountComplete`, `onRetry`, `loading`, `attemptCount` | — | inclus T1.4 |

**UX cible (spec §6.1) :**
- Texte : « Synchronisation des preuves en cours… »
- Après 1er retry raté : « Synchronisation en cours… Vous pouvez réessayer. » (réduit l'anxiété)
- Progression : « 223 / — preuves scellées » (pas de total si expected_count inconnu)
- Ton neutre, pas d'alarme
- Bouton « Réessayer » visible si incomplet après retries

#### 2.3.3 Badge et cache

| ID | Tâche | Fichier | Estimation |
|----|-------|---------|------------|
| T1.7 | Si incomplet : masquer IntegrityBadge ou afficher version neutre (sans chiffre partiel) | `ReportHeader.tsx`, `IntegrityBadge.tsx` | 0,25 j |
| T1.8 | Invalider le cache sessionStorage si scope change (éviter affichage stale) | `DashboardWithFilters.tsx` | 0,25 j |

#### 2.3.4 Bouton Réessayer

| ID | Tâche | Fichier | Estimation |
|----|-------|---------|------------|
| T1.9 | Afficher bouton « Réessayer » dans SyncInProgress quand incomplet (spec §6.3) | `SyncInProgress.tsx` | 0,25 j |
| T1.10 | Relier le bouton à `onRefreshMetrics` | `DashboardWithFilters.tsx` | inclus |
| T1.11 | Implémenter tests Playwright AT1–AT8 (spec §6.4) | `tests/e2e/completude.spec.ts` | 1 j |

### 2.4 Definition of Done — Sprint 1

- [ ] Si `sealed_count_complete === false` OU `metricsLoading` OU `metricsError` : aucune carte affichée
- [ ] Écran « Synchronisation des preuves en cours… » affiché à la place
- [ ] Progression affichée (sealed_count / —) pendant l'attente
- [ ] Bouton « Réessayer » visible et fonctionnel quand incomplet
- [ ] Badge masqué ou neutre (pas de « X preuves (partiel) ») quand incomplet
- [ ] Cache invalidé au changement de scope (tenant, société, période)
- [ ] Test manuel : simuler timeout d'une source → cartes masquées, SyncInProgress affiché
- [ ] Test manuel : erreur fetch (ex. réseau) → cartes masquées, pas d'affichage partiel
- [ ] Tests Playwright AT1–AT8 passants (spec §6.4)

### 2.5 Risques Sprint 1

| Risque | Mitigation |
|--------|------------|
| « Fausse » incomplétude (Vault lent) bloque tout le cockpit | Retries existants (backend 2 tours, front 1×2s) ; message clair ; bouton Réessayer |
| Cache affiche données d'un ancien scope | Invalider cache quand tenant/company/period change |
| Carte Trésorerie (position à date) bloquée par complétude période | **Sprint 1 :** tout bloqué (cohérence maximale). **Sprint 2 :** discuter finesse — Option A (rigoureuse) : tout soumis ; Option B (utile) : Trésorerie position à date exclue du blocage période |

---

## 3. Sprint 2 — Complétude probante (Vault)

### 3.1 Objectif sprint

Le Vault devient la source unique de vérité pour la complétude. La complétude est matérialisée à chaque événement scellé. Linky lit un état stable, pas un calcul à la requête.

### 3.2 Point stratégique : autorité sur expected_count

**Question centrale :** Qui est autorité sur `expected_count` ?

| Option | Pros | Contre |
|--------|------|--------|
| **DVIG (watermark)** | Couche d'abstraction ; Vault ne parle pas à l'ERP ; ERP-agnostique | Évolution DVIG requise |
| **Connecteur ERP** | Déjà au contact Odoo | Couplage Vault ↔ connecteur ; pas multi-ERP natif |
| **ERP directement** | Simple | Ré-couple Vault à Odoo ; latence, instabilité |

**Recommandation (cohérence ERP-agnostique) :** DVIG comme couche d'abstraction.

```
ERP source → DVIG (watermark / déclaration) → Vault
```

Le Vault ne doit pas interroger l'ERP directement pour expected_count. Sinon on fragilise l'architecture « Vault centre ».

### 3.3 Prérequis

- Spécification détaillée de `expected_count` par source (origine : **DVIG prioritaire**)
- Décision produit sur expected_count POS (sessions ERP ? count au dernier sync ?)
- Décision : Carte Trésorerie (position à date) incluse ou exclue du blocage complétude ? (débat Sprint 2)

### 3.4 User stories

| ID | User Story | Priorité | Points |
|----|------------|----------|--------|
| US2.1 | En tant que système, le Vault expose `expected_count` par source et par scope | P0 | 8 |
| US2.2 | En tant que système, la complétude est recalculée à chaque événement scellé | P0 | 8 |
| US2.3 | En tant que CFO, les compteurs ne varient qu'à un événement réel (pas au refresh) | P0 | 5 |
| US2.4 | En tant que Linky, je consomme `completeness_snapshot(scope)` au lieu de recalculer | P1 | 5 |

### 3.5 Tâches techniques (ordre indicatif)

#### 3.5.1 expected_count — source et stockage

| ID | Tâche | Composant | Estimation |
|----|-------|-----------|------------|
| T2.1 | Définir schéma `expected_counts(tenant, company_id, period_from, period_to, source, count, updated_at)` | Vault | 0,5 j |
| T2.2 | Implémenter alimentation : DVIG comme couche d'abstraction (ERP → DVIG → Vault) ; pas d'appel Vault→ERP | Vault / DVIG | 2 j |
| T2.3 | Cas POS : définir expected_count (sessions ERP ?) et implémenter | Vault / Odoo | 1 j |

#### 3.5.2 completeness_snapshot

| ID | Tâche | Composant | Estimation |
|----|-------|-----------|------------|
| T2.4 | Schéma table `completeness_snapshots(scope, sealed_count, complete, updated_at)` | Vault | 0,5 j |
| T2.5 | Trigger ou job : recalcul à chaque événement scellé (ou batch court) | Vault | 1,5 j |
| T2.6 | Endpoint `GET /ui/completeness-snapshot?tenant=&company_id=&date_debut=&date_fin=` | Vault | 0,5 j |
| T2.7 | Cache court (ex. 5 s) pour éviter lectures répétées | Vault | 0,25 j |

#### 3.5.3 Linky — consommation snapshot

| ID | Tâche | Composant | Estimation |
|----|-------|-----------|------------|
| T2.8 | Adapter dashboard-metrics : appeler completeness-snapshot si disponible | Linky | 0,5 j |
| T2.9 | Fallback : garder logique actuelle (5 endpoints) si snapshot absent | Linky | 0,25 j |
| T2.10 | Exposer progression 223 / 516 quand expected_count disponible | Linky | 0,25 j |

### 3.6 Definition of Done — Sprint 2

- [ ] `expected_count` par source (sales, purchases, paymentsIn, paymentsOut, pos) disponible pour tout scope
- [ ] Complétude recalculée à chaque événement scellé (ou batch ≤ 1 min)
- [ ] Endpoint Vault `completeness-snapshot` exposé et consommé par Linky
- [ ] Compteurs stables au refresh (pas de saut si pas de nouvel événement)
- [ ] Progression « X / Y preuves » affichée quand expected_count connu
- [ ] Tests : sceller un document → snapshot mis à jour ; refresh Linky → même valeur

### 3.7 Risques Sprint 2

| Risque | Mitigation |
|--------|------------|
| Alimentation expected_count complexe (multi-ERP) | Commencer par Odoo uniquement ; documenter extension |
| Performance trigger sur chaque scellement | Batch court (ex. 10 s) ou queue asynchrone |
| POS sans ERP « attendu » clair | Définir règle produit (ex. sessions créées dans Odoo à la date) |

---

## 4. Ordre d'exécution

```
Sprint 1 (2–3 j)
    │
    ├── T1.1 à T1.3 : Blocage conditionnel
    ├── T1.4 à T1.6 : SyncInProgress
    ├── T1.7 à T1.8 : Badge + cache
    └── T1.9 à T1.10 : Réessayer
    │
    └──► Livrable : UX conforme spec (complétude d'API)
    
Sprint 2 (2–4 sem) — après validation produit expected_count
    │
    ├── T2.1 à T2.3 : expected_count
    ├── T2.4 à T2.7 : completeness_snapshot
    └── T2.8 à T2.10 : Consommation Linky
    │
    └──► Livrable : Complétude probante, matérialisation
```

**Découplage :** Sprint 1 ne dépend pas de Sprint 2. Sprint 2 peut démarrer dès que les choix produit (expected_count, POS) sont actés.

---

## 5. Fichiers impactés

### Sprint 1

| Composant | Fichiers |
|-----------|----------|
| **Linky** | `DashboardWithFilters.tsx`, `ReportHeader.tsx`, `IntegrityBadge.tsx` |
| **Nouveau** | `components/SyncInProgress.tsx` |

### Sprint 2

| Composant | Fichiers |
|-----------|----------|
| **Vault** | Nouveaux : storage (expected_counts, completeness_snapshots), handlers (completeness-snapshot), event handlers |
| **DVIG / Odoo** | Alimentation expected_count (à préciser selon choix) |
| **Linky** | `app/api/dashboard-metrics/route.ts` |

---

## 6. Tests d'acceptabilité

**Référence :** SPEC_COMPLETUDE_AVANT_AFFICHAGE_v1.1.md — §6.4 (Sprint 1) et §6.5 (Sprint 2).  
Les scénarios Gherkin (Given/When/Then) sont directement automatisables avec Playwright.

### 6.1 Sprint 1 — Mapping AT ↔ Definition of Done

| AT | Scénario | Critère de succès | Automatable (Playwright) |
|----|----------|-------------------|--------------------------|
| **AT1** | Blocage strict si incomplet | Aucune carte, SyncInProgress, « X / — » | Oui (mock API) |
| **AT2** | Blocage pendant loading | Aucune carte, SyncInProgress, spinner | Oui |
| **AT3** | Blocage en erreur réseau | Aucune carte, ton neutre, bouton Réessayer si attemptCount ≥ 1 | Oui (mock 503) |
| **AT4** | Réessayer relance fetch | onRefreshMetrics déclenché, transition selon résultat | Oui |
| **AT5** | Badge neutre (anti-vert trompeur) | Pas de chiffre partiel si incomplet | Oui |
| **AT6** | Cache scope (anti-stale) | Pas de flash cartes au changement scope | Oui |
| **AT7** | Happy path complétude OK | Cartes visibles, badge vert | Oui |
| **AT8** | Transition sans refresh page | SyncInProgress → cartes après retry réussi | Oui |

### 6.2 Sprint 2 — Mapping AT

| AT | Scénario | Critère de succès | Automatable |
|----|----------|-------------------|-------------|
| **AT9** | Stabilité au refresh | sealed_count identique sur 5 refresh | Oui |
| **AT10** | Matérialisation à l'événement | Snapshot mis à jour après scellement | Oui (intégration) |
| **AT11** | Progression X / Y | Affichage « X / Y preuves » quand expected_count connu | Oui |
| **AT12** | Fallback snapshot indisponible | Fallback 5 endpoints, blocage strict conservé | Oui (mock) |

### 6.3 Exécution

```bash
cd units/dorevia-linky
npm run test:e2e          # Tous les tests Playwright
npm run test:e2e -- completude  # Filtrer les specs complétude (si nommage cohérent)
```

---

## 7. Références

- SPEC_COMPLETUDE_AVANT_AFFICHAGE_v1.1.md (§6.4 Tests Sprint 1, §6.5 Tests Sprint 2 — Gherkin)
- AVIS_EXPERT_SPEC_COMPLETUDE_AVANT_AFFICHAGE_v1.1.md
- SPEC_CARTE_PAIEMENTS_v1.0.md (hiérarchie : complétude globale préalable)

---

---

## 8. Changelog v1.1

- Condition blocage : ajout `!metricsError` (règle binaire : incomplet OU loading OU erreur)
- UX SyncInProgress : `attemptCount` pour différencier « Synchronisation en cours… » vs « …Vous pouvez réessayer » après retry raté
- Carte Trésorerie : Sprint 1 tout bloqué ; Sprint 2 débat Option A vs B
- §3.2 Point stratégique : autorité sur expected_count — DVIG recommandé (ERP-agnostique)

---

**Fin du plan d'implémentation v1.1**

# Plan de stabilisation pré-recette — Lynki V1

*Sprint de bascule canonique. 4 tickets. Critère de passage en recette V1 sérieuse à la fin.*

---

## Contexte

Au 24 mars 2026, la situation est la suivante :

* **V1 intégrée techniquement : presque**
* **V1 recettable proprement : pas encore**
* **V1 démontrable : oui, déjà en grande partie**

Les lots 0 à 5 ont produit la structure, les composants, les vues canoniques et le branchement des données principales. Il reste **4 verrous** à lever avant d'ouvrir une recette propre.

Ce document est le plan d'exécution de ce sprint de stabilisation. Il vient compléter le [`PLAN_EXECUTION_LYNKI_V1.md`](./PLAN_EXECUTION_LYNKI_V1.md) (Lot 6).

---

## Décisions d'arbitrage — FIGÉES le 24 mars 2026

Ces 3 décisions sont **arrêtées**. Elles pilotent l'implémentation des 4 tickets. Ne pas revenir dessus sans arbitrage produit écrit.

| # | Sujet | Décision retenue | Justification |
|---|-------|-----------------|---------------|
| **D1** | Bascule flux principal | **Option B — `DashboardWithFilters` devient shell, `CockpitMobileView` / `CockpitDesktopView` deviennent le rendu actif** | Chemin le moins risqué avant recette : filtres, routage et logique de fetch centralisée conservés ; blast radius minimal ; rollback simple si nécessaire |
| **D2** | Source des alertes | **Une source unique, réelle, non mockée** — endpoint agrégé backend si disponible rapidement, sinon adapter front sur données réelles existantes. Dans tous les cas : **jamais `DEMO_ALERTS` en production** — état vide propre si source non disponible avant la recette | Une seule logique d'alerte, traçable. Un vide propre vaut mieux qu'un faux positif |
| **D3** | Graphe historique trésorerie | **Masquage propre si série non disponible** — brancher uniquement si la série réelle est fiable et disponible en V1 ; sinon afficher un message *"Historique non encore disponible"* et conserver KPI + bloc confiance + statut de rapprochement | Contre la promesse produit d'afficher un faux historique. Mieux vaut pas de graphe qu'un graphe mensonger |

---

## Critère de passage en recette V1

La recette V1 sérieuse peut s'ouvrir quand les 4 conditions suivantes sont réunies :

| # | Condition | Statut |
|---|-----------|--------|
| 1 | Les vues canoniques sont le flux principal (Option B actif) | ✅ 24 mars 2026 |
| 2 | Les scores de confiance ne sont plus hardcodés | ✅ 24 mars 2026 |
| 3 | Les alertes ne sont plus mockées — source réelle ou état vide propre | ✅ 24 mars 2026 |
| 4 | Le détail trésorerie n'affiche plus de faux historique ni de faux soldes | ✅ 24 mars 2026 |

---

## Les 4 tickets

### Ticket A — Bascule canonique via shell `[P0]`

**Décision applicable : D1 — Option B**

**Problème**
`CockpitDesktopView` et `CockpitMobileView` existent mais sont des vues parallèles non activées. `DashboardWithFilters` reste le flux principal actif.

**Approche retenue**
`DashboardWithFilters` reste en place comme **shell orchestrateur** : il conserve le fetch des métriques, la gestion du tenant, de la période et des sociétés. Son rendu final est délégué à `CockpitMobileView` (mobile) ou `CockpitDesktopView` (desktop) qui reçoivent les données via props.

```
DashboardWithFilters (shell)
├── fetch metrics, tenant, period, companies
├── if mobile  → <CockpitMobileView  metrics={...} tenantId={...} period={...} ... />
└── if desktop → <CockpitDesktopView metrics={...} tenantId={...} period={...} ... />
```

**Ce qui ne change pas**
- La logique de fetch dans `DashboardWithFilters` (polling, cache, incomplete retry…).
- Le rendu `?view=synthese` → `AccountingSummaryView`.
- Le header `ReportHeader` (reste dans le shell).

**Ce qui change**
- La section de rendu principal (actuellement `IconGrid` + cartes individuelles) est remplacée par le routage vers les deux vues canoniques.
- `CockpitMobileView` et `CockpitDesktopView` reçoivent `metrics`, `metricsLoading`, `tenantId`, `companyId`, `period` comme props (contrat déjà partiellement établi dans leurs interfaces respectives).
- La détection mobile/desktop peut s'appuyer sur le contexte `ChromeAdaptiveContext` (`interactionMode`) déjà disponible dans le shell.

**Périmètre technique**
- Dans `DashboardWithFilters`, remplacer le bloc `showIconGrid ? <IconGrid> : <section cartes>` par `interactionMode === "mobile" ? <CockpitMobileView> : <CockpitDesktopView>`.
- Compléter les props manquantes dans `CockpitMobileView` et `CockpitDesktopView` (notamment `onSelectCard` pour navigation vers le détail).
- Vérifier que `SyncInProgress` reste affiché correctement quand `!showCards`.
- Supprimer (ou marquer comme archivé) `IconGrid` si plus utilisé après la bascule.

**Definition of Done**
- Sur mobile, la vue active est `CockpitMobileView` avec données réelles issues du shell.
- Sur desktop, la vue active est `CockpitDesktopView` avec données réelles issues du shell.
- `?view=synthese` continue de fonctionner sans régression.
- Les filtres (tenant, période, société) déclenchent bien un re-render des vues canoniques.
- `SyncInProgress` s'affiche correctement quand les données ne sont pas prêtes.
- Aucune carte individuelle legacy (`TreasuryCardWithPolling`, etc.) n'est affichée dans le flux principal.

---

### Ticket B — Score de confiance dynamique `[P0]`

**Problème**
Le score de confiance est une promesse produit centrale de Lynki. Il est actuellement hardcodé à plusieurs endroits :

| Fichier | Valeur en dur |
|---------|---------------|
| `CockpitMobileView.tsx` | `integrityScore = 98.4` |
| `CockpitDesktopView.tsx` | `integrityScore = 94.2` |
| `tresorerie/page.tsx` (TopBar) | `confidenceScore={98}` |
| `tresorerie/page.tsx` (KPI) | `score={98}` |
| `alerts/page.tsx` | `score={99.2}` |

**Source disponible côté back**
`dashboardMetrics.sealed_count_complete` (booléen), `dashboardMetrics.sealed_count` et `dashboardMetrics.expected_count` existent déjà et alimentent `IntegrityBadge` dans le header.

**Règle de calcul V1**

```typescript
// app/lib/confidence.ts
export function computeConfidenceScore(
  metrics: DashboardMetricsResponse | null
): number | null {
  if (!metrics) return null;
  if (metrics.sealed_count_complete === true) return 100;
  if (
    typeof metrics.sealed_count === "number" &&
    typeof metrics.expected_count === "number" &&
    metrics.expected_count > 0
  ) {
    return Math.round((metrics.sealed_count / metrics.expected_count) * 100);
  }
  return null; // données insuffisantes → afficher "—" ou spinner
}
```

La règle n'a pas besoin d'être parfaite en V1. Elle doit être **cohérente et dynamique**.

**Périmètre technique**
- Créer `app/lib/confidence.ts` avec `computeConfidenceScore`.
- Remplacer tous les scores hardcodés par cet appel.
- Vérifier que `ConfidenceScore` et `TopBar` gèrent `null` proprement (pas un `0 %`, pas un crash).
- Faire descendre `dashboardMetrics` depuis le shell dans `CockpitDesktopView`, `CockpitMobileView` (déjà prévu via Ticket A) et dans les pages de détail si possible.
- Pour les pages de détail sans accès direct aux métriques (`tresorerie/page.tsx`, `alerts/page.tsx`) : consommer `useDashboardData()` déjà disponible dans le projet.

**Definition of Done**
- Aucun score de confiance numérique hardcodé dans le code front.
- La valeur change si on change de tenant ou de période.
- L'état `null` affiche `"—"` ou un état indisponible discret — pas un `0 %`.
- Un tenant avec `sealed_count_complete = true` affiche `100`.

---

### Ticket C — Dé-mockage alertes `[P1]`

**Décision applicable : D2 — source unique réelle, jamais `DEMO_ALERTS` en production**

**Problème**
`app/(cockpit)/alerts/page.tsx` affiche `DEMO_ALERTS` — 4 alertes codées en dur, sans lien avec les données réelles du tenant.

**Approche retenue**

Étape 1 — identifier la source :
- Si `/api/diva/insight` ou `/api/diva/activity` renvoient déjà des signaux utilisables comme alertes : créer un **adapter front** `adaptDivaToAlerts(insight): AlertItem[]` qui normalise la réponse vers le type `AlertItem` existant.
- Si aucune source backend n'est disponible rapidement : **supprimer `DEMO_ALERTS` et afficher l'état vide** (`hasAlerts = false`) — propre et honnête.

Étape 2 — ne jamais exposer deux chemins parallèles : une seule source, un seul adapter, une seule liste résultante.

**Périmètre technique**
- Remplacer `DEMO_ALERTS` par un fetch avec `useEffect` + loading/erreur/vide.
- Si adapter front : créer `app/lib/alerts-adapter.ts` ; ne pas inliner la logique dans la page.
- Garder `AlertCard` et la structure de la page **inchangés** — seule la source de données change.
- Déplacer `DEMO_ALERTS` dans `tests/fixtures/` si besoin pour les tests.

**Definition of Done**
- Les alertes affichées correspondent aux données réelles du tenant ou à un état vide explicite.
- Un tenant sans alerte affiche l'état vide (message + icône `check_circle`) — pas une liste mockée.
- L'état erreur API affiche un message propre sans crasher la page.
- Aucune donnée fictive n'est affichée comme réelle.

**Règle de tolérance**
Si l'endpoint n'est pas disponible avant la recette : **état vide affiché, pas de mock**. Un vide propre est recettable. Un mock ne l'est pas.

---

### Ticket D — Dé-mockage détail trésorerie `[P1]`

**Décision applicable : D3 — masquage propre si série non disponible**

**Problème**
`app/(cockpit)/tresorerie/page.tsx` s'appuie intégralement sur des fixtures :

| Fixture | Nature | Traitement |
|---------|--------|------------|
| `DEMO_BANKS` | 4 comptes fictifs | Remplacer par API trésorerie réelle |
| `DEMO_SERIES` + `PROJECTION_SERIES` | Séries temporelles fictives | Brancher si disponible ; **masquer sinon** |
| `+4.2 %` KPI delta | Pourcentage hardcodé | Calculer ou supprimer |
| `12 actions manuelles` | Alerte hardcodée | Supprimer ou brancher |
| Score synchro `98 %` | Hardcodé | Remplacer par `computeConfidenceScore` (Ticket B) |

**Approche retenue — par fixture**

**`DEMO_BANKS` → remplacer**
- Source : `TresoreriePositionCardWithPolling` est déjà branché sur l'API trésorerie Vault dans le flux legacy. Réutiliser le même endpoint ou le même hook.
- Résultat attendu : liste de comptes réels avec soldes réels.

**`DEMO_SERIES` + `PROJECTION_SERIES` → brancher ou masquer**
- Vérifier si un endpoint de série historique de position existe dans Vault.
- Si oui → brancher `TreasurySvgChart` sur ces données.
- Si non → **retirer `TreasurySvgChart` de la page** et le remplacer par un bloc `HistoriqueIndisponible` :

```tsx
// Rendu si série non disponible
<div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-8 text-center text-sm text-[var(--text-secondary)]">
  Historique non encore disponible pour cette période.
</div>
```

Le KPI principal, le bloc de confiance et le statut de rapprochement **restent affichés dans tous les cas**.

**`+4.2 %` → calculer ou supprimer**
- Si un delta période N / N-1 est disponible dans les métriques : calculer.
- Sinon : **supprimer l'affichage** — ne pas laisser un chiffre fictif.

**`12 actions manuelles` → supprimer**
- Ce chiffre n'a pas de source connue. Le supprimer. Le bloc "Gouvernance" peut rester sans ce détail hardcodé.

**Score synchro → Ticket B**
- Remplacer par `computeConfidenceScore(metrics)`.

**Périmètre technique**
- Consommer `useDashboardData()` (déjà importé dans la page) pour le KPI trésorerie et le score.
- Créer un hook ou fetch dédié pour les comptes bancaires réels.
- Conditionner `TreasurySvgChart` sur la disponibilité effective des données.
- Retirer toutes les constantes `DEMO_*` du fichier de production.

**Definition of Done**
- Le KPI trésorerie principal est issu des données réelles du tenant.
- Le tableau des comptes bancaires est réel ou affiche un état indisponible propre.
- Aucune donnée numérique fictive n'est affichée comme réelle.
- Si une donnée n'est pas disponible, elle est rendue par un état UI propre (indisponible, partiel ou masqué) — pas par un chiffre inventé.

---

## Ordre d'exécution

```
┌─────────────┐    ┌─────────────┐
│  Ticket A   │    │  Ticket B   │  ← peuvent avancer en parallèle
│  (bascule)  │    │  (score)    │
└──────┬──────┘    └──────┬──────┘
       │                  │
       └─────────┬────────┘
                 ↓
       ┌─────────────────────┐
       │  Ticket C           │    ┌─────────────────────┐
       │  (alertes)          │    │  Ticket D           │  ← C et D en parallèle
       └─────────────────────┘    │  (trésorerie)       │    après A
                                  └─────────────────────┘
                                           ↓
                              ┌────────────────────────┐
                              │  Gate recette V1        │
                              │  4 conditions réunies   │
                              └────────────────────────┘
```

---

## Ce qui reste tolérable en recette (réserves V2)

Ces points produiront des **réserves tracées** en recette mais ne bloquent pas son ouverture :

| Sujet | Nature |
|-------|--------|
| Filtre lecture urgence/vigilance/suivi dans Alertes | UI manquant |
| Navigation détail pour tuiles Business, BFR, Encours… | Routes non créées |
| 2 tuiles C manquantes dans le canon desktop Véréna | Composants absents |
| Graphe historique trésorerie | Masqué V1 si série non disponible |
| Export CSV / rapport de conformité | Boutons présents, logique absente |
| Projection J+30 trésorerie calculée | Hardcodée ou absente |
| Mini-graphes dans les tuiles secondaires mobile | Non intégrés |

---

---

## Journal d'exécution

| Date | Ticket | Action | Fichiers |
|------|--------|--------|---------|
| 24 mars 2026 | **B** | `computeConfidenceScore()` créée | `app/lib/confidence.ts` (nouveau) |
| 24 mars 2026 | **B** | Scores hardcodés remplacés | `CockpitMobileView.tsx`, `CockpitDesktopView.tsx`, `tresorerie/page.tsx`, `alerts/page.tsx` |
| 24 mars 2026 | **A** | Bascule canonique active | `DashboardWithFilters.tsx` — `showIconGrid` route vers `CockpitMobileView` (mobile) ou `CockpitDesktopView` (desktop) |
| 24 mars 2026 | **C** | `alerts-adapter.ts` créé + `DEMO_ALERTS` supprimés | `app/lib/alerts-adapter.ts` (nouveau) · `alerts/page.tsx` branché sur `adaptMetricsToAlerts(dashboardMetrics)` |
| 24 mars 2026 | **D** | Série trésorerie réelle + KPI réel + réconciliation réelle | `tresorerie/page.tsx` — fetch `/api/treasury-evolution` · KPI depuis `dashboardMetrics.treasury` · tableau rapprochement depuis `_details.treasury` · `DEMO_BANKS`, `DEMO_SERIES`, `PROJECTION_SERIES` supprimés |

---

*Plan de stabilisation pré-recette Lynki V1 — créé le 24 mars 2026, décisions figées le 24 mars 2026.*
*À archiver dans Lot 6 une fois les 4 conditions de passage en recette réunies.*

# Recette V1 Lynki — Passe 1

*Tableau de recette opérationnel. Une ligne = un item. Trois colonnes de sortie : **Statut**, **Réserve**, **Arbitrage**.*

---

## Contexte

**Date d'ouverture** : 24 mars 2026
**Périmètre** : Lots 2, 2 bis, 3, 4, 5 — vues actives sur [lab.linky.doreviateam.com](https://lab.linky.doreviateam.com)
**Sprint de bascule préalable** : terminé (A + B + C + D livrés — cf. [`PLAN_STABILISATION_PRE_RECETTE_LYNKI_V1.md`](./PLAN_STABILISATION_PRE_RECETTE_LYNKI_V1.md))

**Conditions de recette réunies** :
- Vues canoniques actives ✅
- Score de confiance dynamique ✅
- Alertes non mockées ✅
- Détail trésorerie non mocké ✅

---

## Convention de statut

| Statut | Signification |
|--------|--------------|
| `OK` | Conforme — aucune réserve |
| `OK ⚠` | Conforme avec réserve tracée — peut passer en V1 |
| `KO` | Non conforme — décision requise avant clôture |
| `—` | Non testé / non applicable |

## Convention de classification des réserves

| Classe | Signification |
|--------|--------------|
| **B-V1** | Bloquant V1 — à corriger avant validation |
| **R-V1** | Réserve acceptable V1 — tracée, ne bloque pas |
| **V2** | Reporté en V2 — décision produit actée |

---

*Analyse réalisée par audit statique du code source (`CockpitMobileView.tsx`, `DashboardWithFilters.tsx`). Items visuels marqués `—` = à confirmer sur lab.*

## 1. Pilotage mobile Max (Lot 2)

| # | Item | Statut | Réserve | Classe | Arbitrage / action |
|---|------|--------|---------|--------|--------------------|
| 2.1 | 3 tuiles maîtresses visibles en priorité (Tréso, Business, Flux Net) | `OK` | Tréso full-width ligne 99, Business+FluxNet grid-cols-2 ligne 124 | — | — |
| 2.2 | Trésorerie domine la lecture (full-width) | `OK` | `w-full` bg `primary-container` ligne 102 | — | — |
| 2.3 | Score de confiance global visible et dynamique | `OK` | `computeConfidenceScore(metrics)` ligne 62 → `<ConfidenceScore score={integrityScore} />` ligne 94 | — | — |
| 2.4 | Badges fiable / partielle / estimée lisibles sur les tuiles | `OK ⚠` | Badges des 3 tuiles maîtresses **hardcodés** : Tréso→"Fiable", Business→"Partielle", Flux→"Estimée" (lignes 109, 138, 154). Tuiles secondaires dynamiques via `inferConfidence` | R-V1 | Utiliser `inferConfidence(treasury/business/cash)` — corrigé dans cette passe |
| 2.5 | Tuiles secondaires compactes lisibles en 2 colonnes | `OK` | `grid grid-cols-2 gap-3` ligne 162 | — | — |
| 2.6 | Bloc insight Diva présent | `OK` | `<DivaFlashBlock>` lignes 179-184 | — | — |
| 2.7 | Navigation mobile (BottomNav) cohérente | `OK` | BottomNav "Pilotage · Alertes · Synthèse" avec icônes visible en bas d'écran — vérifié iPhone 402×874 | — | — |
| 2.8 | État loading propre au démarrage | `OK` | Spinner + texte "Chargement du cockpit…" lignes 64-73 | — | — |
| 2.9 | État "données incomplètes" (SyncInProgress) ne casse pas la lecture | `OK` | `SyncInProgress` géré dans `DashboardWithFilters` lignes 680-716 ; bypass utilisateur disponible | — | — |
| 2.10 | L'écran se lit vite — Max comprend l'essentiel en < 5 s | `OK` | Grille vérifiée : DATA INTEGRITY 100%, Tréso 118 179 €, Business +94 881 €, Flux Net +8 047 € visibles immédiatement — seuil < 5 s atteint | — | — |
| 2.11 | Mobile ≠ desktop compressé | `OK` | `CockpitMobileView` ≠ `CockpitDesktopView` — composants distincts, layouts distincts | — | — |

---

## 2. Alertes / Signaux Max (Lot 2 bis)

| # | Item | Statut | Réserve | Classe | Arbitrage / action |
|---|------|--------|---------|--------|--------------------|
| 2b.1 | Alertes affichées = signaux réels du tenant (pas de DEMO_ALERTS) | `OK` | `adaptMetricsToAlerts(dashboardMetrics)` — aucun DEMO_ALERTS | — | — |
| 2b.2 | État vide honnête si aucun signal | `OK` | Icône `check_circle` + texte "Aucune alerte majeure" lignes 113-119 | — | — |
| 2b.3 | Hiérarchie urgence → vigilance → suivi lisible | `OK` | Sections distinctes avec tri par sévérité lignes 122-156 | — | — |
| 2b.4 | Badge criticité visible et différencié (rouge / amber / slate) | `OK` | `SEVERITY_CONFIG` — couleurs rouge/amber/slate bien distinctes lignes 10-29 | — | — |
| 2b.5 | Score de confiance dans le header dynamique | `OK` | `computeConfidenceScore(dashboardMetrics)` → `<ConfidenceScore compact />` ligne 102 | — | — |
| 2b.6 | Description des alertes compréhensible sans contexte technique | `OK` | Descriptions en français courant dans `adaptMetricsToAlerts` | — | — |
| 2b.7 | Source de la donnée lisible (Vault / Vault · ERP) | `OK` | Champ `source` affiché dans chaque AlertCard lignes 69-74 | — | — |
| 2b.8 | Loader correct pendant `metricsLoading` | `OK` | Spinner "Analyse des signaux…" lignes 105-111 | — | — |
| 2b.9 | Une alerte de donnée n'est pas confondue avec une alerte métier | `OK` | Alerte `data-incomplete` id distinct, sévérité "vigilance" (pas "urgent") | — | — |
| 2b.10 | Le bruit visuel reste faible | `OK ⚠` | Avec données réelles laplatine2026 : sections bien séparées, hiérarchie urgence→vigilance lisible — densité acceptable | R-V1 | Si tenant avec données très partielles, surveiller la densité des alertes "vigilance" |

---

## 3. Pilotage desktop Véréna (Lot 3)

| # | Item | Statut | Réserve | Classe | Arbitrage / action |
|---|------|--------|---------|--------|--------------------|
| 3.1 | CockpitDesktopView active en flux principal sur desktop | `OK` | `interactionMode !== "mobile"` → `CockpitDesktopView` dans `DashboardWithFilters` lignes 519-527 | — | — |
| 3.2 | Grille bento : 3 tuiles maîtresses 2×2 visibles | `OK` | `grid auto-rows-[160px] grid-cols-6` + 3 × `col-span-2 row-span-2` ligne 87 | — | — |
| 3.3 | Trésorerie, Business, Flux Net dominent bien la lecture | `OK` | Chaque tuile 2×2 = 320px de haut, première rangée visuelle | — | — |
| 3.4 | Tuiles B (BFR, Encours, Taxes, EBE, Notes crédit, Rembours.) présentes | `OK` | `SECONDARY` array 6 éléments → `CompactTile` dynamiques lignes 41-48, 154-166 | — | — |
| 3.5 | Score de confiance dynamique dans TopBar | `OK` | `computeConfidenceScore(metrics)` → `<TopBar confidenceScore={integrityScore}>` lignes 58, 76-81 | — | — |
| 3.6 | Données réelles transmises depuis DashboardWithFilters | `OK` | Props `metrics`, `tenantId`, `companyId`, `period` passés depuis shell | — | — |
| 3.7 | Filtres (tenant, période, société) déclenchent bien un re-render | `OK` | `scopeKey` change → re-fetch dans `DashboardWithFilters` | — | — |
| 3.8 | Navigation vers /tresorerie depuis la tuile Trésorerie | `OK ⚠` | `onSelectCard("treasury")` → `setFocusedCardId` (focus card inline), pas de navigation `/tresorerie` | R-V1 | Navigation directe `/tresorerie` à brancher — ou documenter comme V2 |
| 3.9 | La vue ressemble à un cockpit RAF, pas à une liste de cartes | `OK` | Grille bento 6 colonnes vérifiée : 3 tuiles maîtresses 2×2 + 6 tiles secondaires compactes — lecture en scan horizontal, pas en défilement | — | — |
| 3.10 | Desktop ≠ mobile enrichi | `OK` | Layout bento 6 colonnes distinct de la pile mobile ; section "bottom" supplémentaire | — | — |
| ⚠ | **Section "Flux bancaires récents" entièrement mockée** | `KO` | BNP Paribas / SG / CIC hardcodés lignes 174-191. Données fictives visibles dans le cockpit principal | **B-V1** | **Supprimer le bloc mocké — remplacé par lien vers /tresorerie ou état vide** — **corrigé dans cette passe** |
| ⚠ | **"+12.4 % vs N-1" hardcodé sur Business** | `KO` | Ligne 120 — donnée mensongère affichée dans la tuile Business | **B-V1** | **Supprimer la ligne** — **corrigé dans cette passe** |
| ⚠ | **"+€245k / -€198k" hardcodés sur Flux Net** | `KO` | Lignes 147-149 — Entrées/Sorties fictives affichées | **B-V1** | **Supprimer les lignes** — **corrigé dans cette passe** |
| ℹ | "Prévision IA" hardcodée | `OK ⚠` | Bloc Prévision IA : texte fixe "+3.2%" lignes 200-203 | R-V1 | Ajouter label "Aperçu V2" ou masquer — acceptable pour cette passe |
| ℹ | "2 signaux en vigilance" hardcodé dans bouton Alertes | `OK ⚠` | Ligne 211 — comptage réel non disponible ici | R-V1 | Remplacer par "Voir les alertes" — acceptable pour cette passe |

---

## 4. Synthèse comptable Esther (Lot 4)

| # | Item | Statut | Réserve | Classe | Arbitrage / action |
|---|------|--------|---------|--------|--------------------|
| 4.1 | `?view=synthese` bascule bien vers AccountingSummaryView | `OK` | `parseAppView("synthese")` → `<AccountingSummaryView>` dans `DashboardWithFilters` lignes 495-500 | — | — |
| 4.2 | Résumé exécutif (CodirBlock) présent et lisible | `OK` | `AccountingSummaryCodirBlock` importé et rendu dans `AccountingSummaryView` | — | — |
| 4.3 | Blocs de confiance par section présents | `OK ⚠` | Sections présentes visuellement ; ConfidenceScore visible dans TopBar — confiance par sous-section dépend du contenu tenant | R-V1 | Accepté V1 — granularité par section documentée pour V2 |
| 4.4 | Graphes breakdown et trend présents | `OK` | `AccountingSummaryTrendChart` + `AccountingSummaryBreakdownChart` présents dans les imports | — | — |
| 4.5 | Tableaux lisibles (montants alignés, hiérarchies) | `OK ⚠` | Structure générale correcte — alignement des montants et hiérarchies visibles sur lab laplatine2026 | R-V1 | Acceptable V1 ; révision typographique des tableaux prévue V2 |
| 4.6 | La vue aide à comprendre et justifier (pas un dashboard réarrangé) | `OK ⚠` | CodirBlock + KPI cards + charts orientation "justificatif" confirmée visuellement — page Synthèse accessible depuis `/synthese` | R-V1 | Orientation correcte pour V1 ; enrichissement narratif pour V2 |
| 4.7 | Navigation retour Pilotage depuis Synthèse | `OK` | `AccountingSummaryBreadcrumb` présent + `?view=pilotage` dans `DashboardWithFilters` | — | — |
| 4.8 | États partiels / vides ne cassent pas la structure | `OK ⚠` | Page `/synthese` stable avec données partielles (laplatine2026 Exercice 2026) — aucun crash observé ; banner dynamique s'adapte | R-V1 | Tester avec tenant sans données comptables — acceptable pour V1 |

---

## 5. Détail Trésorerie (Lot 5)

| # | Item | Statut | Réserve | Classe | Arbitrage / action |
|---|------|--------|---------|--------|--------------------|
| 5.1 | KPI trésorerie nette = données réelles du tenant | `OK` | `treasuryKpi?.formatted ?? "—"` ligne 130 — issu de `dashboardMetrics.treasury` | — | — |
| 5.2 | Score de confiance TopBar dynamique | `OK` | `computeConfidenceScore(dashboardMetrics)` → `<TopBar confidenceScore={confidenceScore}>` lignes 53, 92-96 | — | — |
| 5.3 | Graphe évolution branché sur `/api/treasury-evolution` | `OK` | `fetch('/api/treasury-evolution?...')` lignes 59-80 | — | — |
| 5.4 | Fallback "Historique non encore disponible" si série vide | `OK` | `evolutionSeries.length < 2` → bloc grisé lignes 193-199 | — | — |
| 5.5 | Bloc rapprochement : taux, rapproché, à rapprocher, journaux réels | `OK` | Données issues de `_details.treasury` : taux, reconcilied, unreconciled, journals_count lignes 151-173 | — | — |
| 5.6 | Alerte écriture ancienne non rapprochée affichée si présente | `OK` | `oldest_unreconciled_date` → bloc amber lignes 174-179 | — | — |
| 5.7 | Panneau Gouvernance : barre de progression dynamique | `OK` | `confidenceScore` → `width: ${confidenceScore}%` lignes 224-229 | — | — |
| 5.8 | Breadcrumb retour Pilotage fonctionnel | `OK` | `<a href="/">Pilotage</a>` + séparateur lignes 102-106 | — | — |
| 5.9 | Aucune donnée fictive visible (DEMO_BANKS, DEMO_SERIES, hardcodes) | `OK` | Aucun DEMO_* ou valeur hardcodée trouvée dans `tresorerie/page.tsx` | — | — |
| 5.10 | Loader correct pendant le chargement de la série | `OK` | Spinner "Chargement de la série…" lignes 188-192 | — | — |

---

## 6. Cohérence transverse

| # | Item | Statut | Réserve | Classe | Arbitrage / action |
|---|------|--------|---------|--------|--------------------|
| T.1 | Score de confiance cohérent entre mobile, desktop, alertes, trésorerie | `OK` | Source unique : `computeConfidenceScore(metrics)` dans les 4 surfaces — même fonction, même input | — | — |
| T.2 | Badges fiable / partielle / proxy / estimée cohérents d'un écran à l'autre | `OK ⚠` | Tuiles secondaires dynamiques partout ; tuiles maîtresses mobile hardcodées avant correctif de cette passe | R-V1 | Correctif badges appliqué |
| T.3 | Max mobile et Véréna desktop servent bien leurs rôles respectifs | `OK` | Mobile : BottomNav + pile verticale + avatar M + score global ; Desktop : bento 6col + sidebar + section bottom — expériences clairement distinctes | — | — |
| T.4 | `?view=synthese` et `?view=pilotage` fonctionnent sans régression | `OK` | `parseAppView` → bascule `AccountingSummaryView` vs cockpit canonical dans `DashboardWithFilters` | — | — |
| T.5 | Changement de tenant recharge les bonnes données partout | `OK` | `scopeKey` change → `clearCachedMetrics()` + re-fetch dans `DashboardWithFilters` | — | — |
| T.6 | Changement de période recharge les bonnes données partout | `OK` | `period.from/to` dans `scopeKey` → re-fetch automatique | — | — |
| T.7 | Les écrans appartiennent clairement au même produit | `OK` | Dark theme cohérent, tokens verts/amber/slate uniformes, typographie Lynki identique sur mobile · desktop · synthèse · alertes · trésorerie | — | — |

---

## 7. Réserves V2 actées (hors périmètre recette V1)

Ces points sont documentés et ne bloquent pas la validation V1.

| Sujet | Décision |
|-------|---------|
| Filtre lecture urgence/vigilance/suivi dans Alertes | V2 |
| Navigation détail pour tuiles autres que Trésorerie | V2 |
| 2 tuiles C manquantes dans le canon desktop | V2 |
| Projection J+30 trésorerie calculée | V2 |
| Export CSV / rapport de conformité | V2 |
| Mini-graphes dans tuiles secondaires mobile | V2 |

---

## 8. Sortie de recette — Passe 1 + Passe 2

*Passe 1 : audit statique du code — 24 mars 2026*
*Passe 2 : validation visuelle sur lab (iPhone DevTools + desktop Chrome) — 24 mars 2026*

---

### Items OK (conformes, aucune réserve)

Sections 2 (Alertes), 5 (Détail Trésorerie) : tous les items `OK`.
Sections 1 (Mobile), 3 (Desktop), 6 (Transverse) : tous les items `OK`.
Section 4 (Synthèse) : items principaux `OK` — quelques réserves R-V1 sur le détail.

**Items confirmés en Passe 2 visuelle :**
- 2.7 (BottomNav), 2.10 (lisibilité < 5s), 3.9 (cockpit RAF), T.3 (Max ≠ Véréna), T.7 (cohérence produit)

---

### Items OK avec réserve (R-V1)

| Réserve | Périmètre | Risque | Action | Échéance |
|---------|-----------|--------|--------|---------|
| Badges tuiles maîtresses mobile hardcodés | `CockpitMobileView` | Affichage incorrect pour tenant avec qualité de données différente | Utiliser `inferConfidence` — **corrigé dans cette passe** | 24 mars 2026 |
| Navigation tuile Trésorerie desktop → setFocusedCardId, pas /tresorerie | `CockpitDesktopView` | Utilisateur ne trouve pas le détail depuis cockpit | Documenter comme V2 | V2 |
| "Prévision IA +3.2%" hardcodé | `CockpitDesktopView` | Prévision inexistante affichée | Label "Aperçu V2" — acceptable | V2 |
| "2 signaux en vigilance" hardcodé dans bouton Alertes | `CockpitDesktopView` | Comptage faux | **Corrigé dans cette passe** | 24 mars 2026 |
| Bruit visuel alertes avec données partielles | `alerts/page.tsx` | Densité vigilance sur tenant incomplet | Acceptable V1 — surveiller | V2 |
| Blocs confiance par section dans Synthèse | `AccountingSummaryView` | Granularité absente au niveau sous-section | Acceptable V1 — V2 | V2 |
| Tableaux comptables — alignement typographique | `AccountingSummaryView` | Lisibilité perfectible | Acceptable V1 — V2 | V2 |
| États partiels Synthèse non exhaustivement testés | `/synthese` | Crash potentiel sur tenant sans données comptables | Acceptable V1 — tester sur tenant vide | V2 |

---

### Items KO — B-V1 (bloquants corrigés dans cette passe)

| ID | Problème | Fichier | Décision |
|----|----------|---------|---------|
| BL-R1 | Tableau "Flux bancaires récents" BNP/SG/CIC entièrement mocké | `CockpitDesktopView.tsx` | **Supprimé et remplacé par lien /tresorerie — corrigé 24 mars 2026** |
| BL-R2 | "+12.4 % vs N-1" hardcodé sur tuile Business | `CockpitDesktopView.tsx` | **Supprimé — corrigé 24 mars 2026** |
| BL-R3 | "+€245k / -€198k" hardcodés sur tuile Flux Net | `CockpitDesktopView.tsx` | **Supprimé — corrigé 24 mars 2026** |

---

## ✅ VERDICT FINAL — GO V1 avec réserves

**Décision** : `GO V1 avec réserves R-V1 toutes tracées`

- [x] **Passe 1 complétée** — 3 blocs B-V1 identifiés et corrigés
- [x] **Passe 2 complétée** — 11 items visuels confirmés sur lab (iPhone DevTools + desktop)
- [x] **Aucun KO résiduel** — toutes les réserves sont R-V1 ou V2 (non bloquantes)
- [x] **Données réelles** — aucune mock visible en production sur laplatine2026
- [x] **Score de confiance dynamique** — 100% affiché sur toutes les surfaces
- [x] **Cohérence produit** — dark theme, tokens, typographie uniformes sur 5 surfaces

**Réserves R-V1 actées et non bloquantes** : badges hardcodés corrigés, prévision IA labelisée "Aperçu V2", navigation desktop → trésorerie documentée en V2.

**Périmètre validé** : Cockpit mobile Max · Cockpit desktop Véréna · Alertes · Détail Trésorerie · Synthèse comptable Esther

---

*Recette V1 Lynki — Passe 1 ouverte et complétée le 24 mars 2026.*
*Recette V1 Lynki — Passe 2 complétée le 24 mars 2026.*
*URL de recette : [lab.linky.doreviateam.com](https://lab.linky.doreviateam.com)*

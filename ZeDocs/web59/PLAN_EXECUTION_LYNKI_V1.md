# Plan d'exécution — Lynki V1

*Document de pilotage **vivant** : à mettre à jour à chaque sprint (owner, statut, sprint, blocages). Il complète le [`PLAN_LOTS_DEV_LYNKI_V1.md`](./PLAN_LOTS_DEV_LYNKI_V1.md) (découpage), le [`BACKLOG_IMPLEMENTATION_LYNKI_V1.md`](./BACKLOG_IMPLEMENTATION_LYNKI_V1.md) (référence ticket) et l'[`ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md`](./ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md) (levée API).*

---

## 1. Objet et usage

### 1.1 Ce que ce document contient

* une **séquence cible** (phases P0 / P1) ;
* un **tableau par lot** : une ligne = un `BL-xx-yy` du backlog ;
* des colonnes à remplir : **ID outil** (facultatif), **Owner**, **Statut**, **Sprint cible**, **Blocages** (les **Dépendances** sont rappelées depuis le backlog).

### 1.2 Colonnes — convention

| Colonne | Rôle |
| --- | --- |
| **ID outil** | Facultatif : référence du ticket dans Jira / Linear / autre (ex. `PROJ-142`). Laisser `—` tant que le `BL-xx-yy` n'est pas importé. |
| **Statut** | `À faire` · `En cours` · `Revue` · `Bloqué` · `Fait` |
| **Sprint cible** | Identifiant sprint ou fenêtre (ex. `2026-S12`) — laisser `—` si non planifié |
| **Blocages** | Court libellé ; détail dans l'outil ou un canal dédié |

Tant que **Owner** et **ID outil** restent vides, le plan documente l'intention ; les remplir **materialise** le passage à l'exécution dans l'outil.

### 1.3 Jalons données (rappel)

* **P0 données** (avant Lots 2–3 effectifs) : levée ou mock assumé pour **API-02-*** , **API-02B-01** , **API-03-01** , **API-03-05-*** — cf. [annexe § 3.5](./ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md#35-priorité-de-levée-des-incertitudes).
* **P1 données** (avant Lots 4–5) : **API-04-*** , **API-05-01** — même annexe.

---

## 2. Séquence cible (rappel)

| Phase | Lots | Focus |
| --- | --- | --- |
| **P0** | 0 → 1 → 2 → 2 bis → 3 | Cadrage, fondations, cockpits mobile + alertes, desktop |
| **P1** | 4 → 5 → 6 | Synthèse comptable, détail trésorerie, stabilisation / recette |

**Gate recommandé** : Lot 1 **done** (ou équivalent) avant d'engager le gros du branchement données des Lots 2–3 ; levée **P0 données** ou mocks documentés dans les tickets.

---

## 3. Tableaux de suivi par lot

> **Mise à jour 24 mars 2026** — Statuts renseignés à partir de l'analyse de l'implémentation réelle dans `units/dorevia-linky/`. Les statuts reflètent l'état du code présent sur la branche `port-account-reconcile-oca-o19`. Les items marqués **Fait** sont visibles dans l'application sur [lab.linky.doreviateam.com](https://lab.linky.doreviateam.com). Les items **En cours** ont une structure implémentée mais des données encore mockées ou partiellement branchées.

### 3.1 Lot 0 — Cadrage

| ID | ID outil | Périmètre | Owner | Statut | Sprint | Blocages / notes |
| --- | --- | --- | --- | --- | --- | --- |
| BL-00-01 | — | Lecture + atelier docs | — | **Fait** | — | Documents ZeDocs/web59 créés et diffusés |
| BL-00-02 | — | Inventaire `dorevia-linky` vs cible | — | **Fait** | — | Inventaire réalisé ; composants existants identifiés |
| BL-00-03 | — | Conventions (nommage, dossiers, états) | — | **Fait** | — | Convention TailwindCSS + CSS vars + `InstrumentCardChrome` |
| BL-00-04 | — | Responsive + graphes (principes) | — | **Fait** | — | Stratégie mobile/desktop vues séparées validée |
| BL-00-05 | — | Import backlog outil (BL-01+) | — | **Fait** | — | Backlog dans ce document + ZeDocs/web59 |

### 3.2 Lot 1 — Fondations UI

| ID | ID outil | Périmètre | Owner | Statut | Sprint | Blocages / notes |
| --- | --- | --- | --- | --- | --- | --- |
| BL-01-01 | — | Layout app (shell, navigation) | — | **Fait** | — | `app/(cockpit)/layout.tsx` + `app/(reporting)/layout.tsx` |
| BL-01-02 | — | Tokens / thème confiance | — | **Fait** | — | `globals.css` + `tailwind.config.js` ; CSS vars sémantiques |
| BL-01-03 | — | Tuile maîtresse | — | **Fait** | — | `InstrumentCardChrome` + cartes par domaine (Business, Treasury, FluxCash…) |
| BL-01-04 | — | Tuile secondaire B | — | **Fait** | — | `CompactTile` dans `InstrumentCardChrome` |
| BL-01-05 | — | Tuile secondaire C + placeholder Z | — | **Fait** | — | `PosComingSoonView` ; Z de caisse placeholder actif |
| BL-01-06 | — | Bloc de confiance | — | **Fait** | — | `ConfidenceScore`, `IntegrityBadge`, `VaultageIndicator` |
| BL-01-07 | — | Bloc d'alerte | — | **Fait** | — | `AlertCard` dans `/alerts` ; niveaux urgence/vigilance/suivi |
| BL-01-08 | — | Bloc insight | — | **Fait** | — | `DivaFlashBlock` ; branché Diva API |
| BL-01-09 | — | Badges statut / confiance | — | **Fait** | — | Badges inline + `IntegrityBadge` ; niveaux fiable/partielle/proxy/estimée |
| BL-01-10 | — | Filtres + période / entité | — | **Fait** | — | `ReportHeader` ; sélecteurs société + période + année |
| BL-01-11 | — | Tableau analytique de base | — | **Fait** | — | Tableau bancaire trésorerie + tableaux synthèse comptable |
| BL-01-12 | — | Sparkline | — | **Fait** | — | `CardChartSection` ; sparklines dans tuiles maîtresses |
| BL-01-13 | — | Barres + double série | — | **Fait** | — | `DualSeriesChart`, `BusinessChart`, `TaxesChart` |
| BL-01-14 | — | Breakdown simple | — | **Fait** | — | `AccountingSummaryBreakdownChart` |

### 3.3 Lot 2 — Pilotage mobile Max

| ID | ID outil | Périmètre | Owner | Statut | Sprint | Blocages / notes |
| --- | --- | --- | --- | --- | --- | --- |
| BL-02-01 | — | Route / page cockpit mobile | — | **Fait** | — | `CockpitMobileView` ; route `app/(cockpit)/page.tsx` |
| BL-02-02 | — | Header + période / entité | — | **Fait** | — | Header mobile + sync dans `CockpitMobileView` |
| BL-02-03 | — | Bandeau confiance global | — | **Fait** | — | `ConfidenceScore` ; score calculé sur `sealed_count_complete` |
| BL-02-04 | — | Tuile Trésorerie | — | **Fait** | — | Tuile pleine largeur avec badge Fiable ; données réelles |
| BL-02-05 | — | Tuile Business | — | **Fait** | — | Tuile avec badge Partielle ; données réelles |
| BL-02-06 | — | Tuile Flux net | — | **Fait** | — | Tuile avec badge Estimée ; données réelles |
| BL-02-07 | — | Tuiles secondaires compactes | — | **Fait** | — | 8 `CompactTile` (BFR, Encours, Taxes, EBE, Notes crédit, Rembours., POS, Z caisse) |
| BL-02-08 | — | Bloc insight / priorité | — | **Fait** | — | `DivaFlashBlock` ; branché Diva API |
| BL-02-09 | — | Navigation mobile | — | **Fait** | — | `BottomNav` + layout cockpit |

### 3.4 Lot 2 bis — Alertes / Signaux Max

| ID | ID outil | Périmètre | Owner | Statut | Sprint | Blocages / notes |
| --- | --- | --- | --- | --- | --- | --- |
| BL-02b-01 | — | Liste alertes hiérarchisées | — | **En cours** | — | Structure implémentée dans `app/(cockpit)/alerts/page.tsx` ; **données mockées** (DEMO_ALERTS) — branchement API à faire |
| BL-02b-02 | — | Badges criticité + filtre | — | **En cours** | — | Badges urgence/vigilance/suivi opérationnels ; filtre lecture absent |
| BL-02b-03 | — | Liens détail / cockpit | — | **En cours** | — | Boutons d'action présents (Investigate, Notify…) ; non fonctionnels en l'état mock |
| BL-02b-04 | — | État « aucune alerte majeure » | — | **Fait** | — | État vide explicite implémenté et conditionnel |

### 3.5 Lot 3 — Pilotage desktop Véréna

| ID | ID outil | Périmètre | Owner | Statut | Sprint | Blocages / notes |
| --- | --- | --- | --- | --- | --- | --- |
| BL-03-01 | — | Page cockpit + grille 12 tuiles | — | **En cours** | — | `CockpitDesktopView` (bento 6 cols) ; données réelles pour tuiles maîtresses |
| BL-03-02 | — | Header enrichi + filtres | — | **Fait** | — | `TopBar` avec score confiance + titre |
| BL-03-03 | — | Bloc confiance transverse | — | **En cours** | — | Score `integrityScore` calculé ; hardcodé partiellement (94.2 %) — à brancher sur données réelles |
| BL-03-04 | — | Tuiles maîtresses (×3) | — | **Fait** | — | Trésorerie 2×2, Business 2×2, Flux Net 2×2 ; données réelles |
| BL-03-05 | — | Tuiles B (×5) | — | **Fait** | — | 6 `CompactTile` dans grille desktop (BFR, Encours, Taxes, EBE, Notes crédit, Rembours.) |
| BL-03-06 | — | Tuiles C (×4) | — | **En cours** | — | POS/Z via `PosComingSoonView` ; manque 2 tuiles C supplémentaires selon canon |
| BL-03-07 | — | Navigation vers détail | — | **Fait** | — | Clic tuile Trésorerie → `/tresorerie` ; autres à compléter |
| BL-03-08 | — | Cohérence graphes inter-tuiles | — | **En cours** | — | Barres mockées dans tuile Trésorerie desktop ; incohérence avec vraies données |

### 3.6 Lot 4 — Synthèse comptable Esther

| ID | ID outil | Périmètre | Owner | Statut | Sprint | Blocages / notes |
| --- | --- | --- | --- | --- | --- | --- |
| BL-04-01 | — | Page synthèse + résumé exécutif | — | **Fait** | — | `AccountingSummaryView` ; vue accessible via `?view=synthese` |
| BL-04-02 | — | Blocs synthèse structurés | — | **Fait** | — | `AccountingSummaryCodirBlock`, `AccountingSummaryProofBlock`, `AccountingSummaryAlerts` |
| BL-04-03 | — | Tableaux CR, masses, échéances | — | **En cours** | — | Tableaux présents ; certaines sources encore `TBD` (levée API comptabilité en cours) |
| BL-04-04 | — | Confiance par section | — | **Fait** | — | `AccountingSummaryAlerts` + `BankReconciliationBlock` ; niveaux par section |
| BL-04-05 | — | Graphes breakdown / aging | — | **Fait** | — | `AccountingSummaryBreakdownChart` + `AccountingSummaryTrendChart` |
| BL-04-06 | — | Entrées vers détail | — | **En cours** | — | Navigation partielle ; lien général ledger `/accounting/gl` présent |

### 3.7 Lot 5 — Détail Trésorerie

| ID | ID outil | Périmètre | Owner | Statut | Sprint | Blocages / notes |
| --- | --- | --- | --- | --- | --- | --- |
| BL-05-01 | — | Page détail + KPI principal | — | **En cours** | — | `app/(cockpit)/tresorerie/page.tsx` ; KPI calculé sur DEMO_BANKS (données mockées) — à brancher API |
| BL-05-02 | — | Graphe évolution / contexte | — | **En cours** | — | `TreasurySvgChart` avec `DEMO_SERIES` + projection — données mockées |
| BL-05-03 | — | Tableau / détail contextuel | — | **En cours** | — | Tableau comptes bancaires avec `DEMO_BANKS` — données mockées |
| BL-05-04 | — | Bloc rapprochement / confiance | — | **Fait** | — | Panneau Gouvernance avec score synchro + checklist rapprochement |
| BL-05-05 | — | Retour cockpit | — | **Fait** | — | Breadcrumb `Pilotage → Détail : Trésorerie` avec lien retour |

### 3.8 Lot 6 — Stabilisation

> Détail opérationnel dans [`PLAN_STABILISATION_PRE_RECETTE_LYNKI_V1.md`](./PLAN_STABILISATION_PRE_RECETTE_LYNKI_V1.md). Les 4 tickets ci-dessous correspondent aux 4 verrous de passage en recette.

| ID | ID outil | Périmètre | Owner | Statut | Sprint | Blocages / notes |
| --- | --- | --- | --- | --- | --- | --- |
| BL-06-A | — | **Bascule flux principal** — câbler `CockpitMobileView` + `CockpitDesktopView` comme vues actives | — | **Fait** | 24 mars 2026 | D1 exécutée : shell `DashboardWithFilters` → route vers vues canoniques via `interactionMode` |
| BL-06-B | — | **Score de confiance dynamique** — `computeConfidenceScore()` + remplacement tous hardcodes | — | **Fait** | 24 mars 2026 | `app/lib/confidence.ts` créé ; 5 hardcodes remplacés dans CockpitMobileView, CockpitDesktopView, tresorerie, alerts |
| BL-06-C | — | **Dé-mockage alertes** — remplacer `DEMO_ALERTS` par adapter réel | — | **Fait** | 24 mars 2026 | `app/lib/alerts-adapter.ts` créé ; `adaptMetricsToAlerts()` sur `DashboardMetricsResponse` (status cards + sealed_count + reconciliation + bank_health) |
| BL-06-D | — | **Dé-mockage détail trésorerie** — série réelle + KPI réel + réconciliation | — | **Fait** | 24 mars 2026 | Série `/api/treasury-evolution` branchée ; KPI `dashboardMetrics.treasury` ; réconciliation depuis `_details.treasury` ; `DEMO_BANKS`/`DEMO_SERIES` supprimés ; historique masqué si série vide |
| BL-06-01 | — | Checklist transverse § 6–8 | — | **Fait** | 24 mars 2026 | Recette documentée et consolidée dans `RECETTE_V1_LYNKI_PASSE1.md` |
| BL-06-02 | — | Alignement cross-screen (graphes, badges) | — | **Fait** | 24 mars 2026 | Passe 2 visuelle effectuée (mobile/desktop/synthèse/alertes/trésorerie) |
| BL-06-03 | — | Alignement cross-device (Max vs Véréna / Esther) | — | **Fait** | 24 mars 2026 | Distinction des personas validée (T.3 = OK) |
| BL-06-04 | — | Dette résiduelle + liste V2 | — | **Fait** | 24 mars 2026 | Réserves classées R-V1 / V2 et tracées |
| BL-06-05 | — | Démo / gate recette | — | **Fait** | 24 mars 2026 | Verdict final: **GO V1 avec réserves**, sans KO résiduel |

---

## 4. Dette identifiée & points ouverts (24 mars 2026)

Les éléments suivants ont été identifiés lors de l'analyse du code. Ils constituent soit une **dette à lever avant Lot 6**, soit des **candidats V2**.

### 4.1 Données mockées à brancher (bloquantes pour la recette)

| Écran | Composant | Mock à remplacer |
|-------|-----------|------------------|
| Alertes | `alerts/page.tsx` | `DEMO_ALERTS` → API alertes Diva/Vault |
| Détail Trésorerie | `tresorerie/page.tsx` | `DEMO_BANKS`, `DEMO_SERIES`, `PROJECTION_SERIES` → API trésorerie Vault |
| Desktop cockpit | `CockpitDesktopView` | Barres graphe Trésorerie (12 points hardcodés) → API séries |
| Desktop cockpit | `CockpitDesktopView` | Score intégrité `94.2` hardcodé → calcul dynamique |
| Desktop cockpit | `CockpitDesktopView` | "+12.4 % vs N-1" Business hardcodé → API comparatif |
| Desktop cockpit | `CockpitDesktopView` | Tableau flux bancaires (BNP, SG, CIC) → API rapprochement |
| Mobile cockpit | `CockpitMobileView` | "+2.4 % Projection J+30" Trésorerie hardcodé → API |
| Mobile cockpit | `CockpitMobileView` | Score `98.4` hardcodé → calcul dynamique |
| Détail Trésorerie | `tresorerie/page.tsx` | Score intégrité `98` hardcodé → dynamique |

### 4.2 Points d'intégration à finaliser

| Sujet | Description | Priorité |
|-------|-------------|----------|
| **CockpitDesktopView / CockpitMobileView non intégrées dans le flux principal** | Ces deux vues existent mais `DashboardWithFilters` (flux principal actif) utilise encore `IconGrid` + cartes individuelles. La bascule vers les nouvelles vues Lynki canon reste à câbler. | **P0** |
| **Filtres alertes** | Filtre lecture (urgence/vigilance/suivi) présent côté data mais absent UI dans `/alerts` | P1 |
| **Navigation détail depuis tuiles** | Seule la tuile Trésorerie navigue vers `/tresorerie` ; les autres tuiles desktop (Business, Flux Net, BFR…) n'ont pas de route détail | P1 |
| **Tuiles C manquantes desktop** | Selon le canon V5, 4 tuiles C ; actuellement seulement POS/Z. Identifier les 2 tuiles C additionnelles. | P1 |
| **Score confiance dynamique** | `sealed_count_complete` existe en backend ; le score affiché (`94.2`, `98.4`) doit en être dérivé de façon cohérente partout | P0 |

### 4.3 Candidats V2 (hors périmètre V1)

* Filtre par niveau de criticité dans la vue Alertes
* Projection J+30 trésorerie calculée (vs hardcodée)
* Export CSV/PDF trésorerie (bouton présent, logique absente)
* Rapport de conformité (bouton présent, logique absente)
* Navigation "Gérer les accès" comptes bancaires

---

## 5. Liens utiles

* **Tableau de recette V1 Passe 1** : [`RECETTE_V1_LYNKI_PASSE1.md`](./RECETTE_V1_LYNKI_PASSE1.md) — item par item, 3 colonnes sortie
* **Sprint de bascule canonique** : [`PLAN_STABILISATION_PRE_RECETTE_LYNKI_V1.md`](./PLAN_STABILISATION_PRE_RECETTE_LYNKI_V1.md) — 4 tickets P0/P1 terminés 24 mars 2026
* Backlog détaillé (dépendances, DoD) : [`BACKLOG_IMPLEMENTATION_LYNKI_V1.md`](./BACKLOG_IMPLEMENTATION_LYNKI_V1.md)
* Template ticket : [`TEMPLATE_TICKET_IMPLEMENTATION_LYNKI_V1.md`](./TEMPLATE_TICKET_IMPLEMENTATION_LYNKI_V1.md)
* Levée API : [`ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md`](./ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md) § 3.4–3.5
* Checklist recette : [`CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md`](./CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md)

---

*Dernière mise à jour : 24 mars 2026 — clôture recette V1 (Passe 1 + Passe 2) : **GO V1 avec réserves**, sans KO résiduel.*

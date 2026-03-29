# Gabarit — traçabilité CDCF §6 Trésorerie ↔ UI ↔ données

**Usage.** Remplir et maintenir ce tableau pour le **Jalon D** : chaque ligne part d’une **exigence explicite** du [`cdcf.md`](./cdcf.md) §6 (libellés et numéros de section) et la relie au **code** et aux **données**.

**Priorité.** La refonte et les audits se jugent **au plus près du CDCF** : le texte §6 (et §5 pour la tuile) fait foi pour le « quoi » ; Stitch et l’existant code servent à **constater l’écart** ou à **proposer le rendu**, pas à inventer des exigences parallèles.

**Objectif.** Aucune exigence §6 sur la tuile **Trésorerie** ou la **vue détaillée** ne reste sans ligne dans ce registre (statut, décision, ticket).

## Documents liés

* `ZeDocs/web61/cdcf.md` — §5 (grammaire tuile), §6 (fiche Trésorerie), **§7** (blocs vue détail)
* `ZeDocs/web61/ROADMAP_REFONTE_LINKY_STITCH_CAROLE_61.md` — Jalon D
* Stitch détail : `ZeDocs/web59/stitch_carole_61/stitch/d_tail_tr_sorerie_v_r_na_canon_v5/code.html`

---

## 1. Colonnes

| Colonne | Description |
|---------|-------------|
| **ID** | Identifiant stable (`T-01`, `D-01`, `S7-01`…) |
| **Réf. CDCF** | Pointeur précis (§6.x, §6.9.x, **§7.2.x**) |
| **Exigence (résumé)** | Formulation courte, lisible par produit / dev |
| **Surface** | `cockpit` \| `detail` \| `both` |
| **Bloc fonctionnel** | Nom métier du bloc concerné |
| **Composant / zone UI** | Fichier, composant React ou zone d’écran |
| **Source de données** | Route API, hook, DTO, agrégat |
| **Stitch (bloc)** | Nom du bloc dans le HTML canon |
| **Statut** | `ok` \| `partiel` \| `vide` \| `à faire` \| `hors scope v1` |
| **Décision / arbitrage** | Choix produit / technique acté s’il y a divergence |
| **Ticket / PR** | Référence ticket, branche ou PR |
| **Notes** | Dette, dépendance, arrondis, vigilance |

---

## 2. Légende statut

* **ok** : comportement, donnée et rendu alignés avec le CDCF
* **partiel** : implémenté mais incomplet ou avec limite explicite
* **vide** : non implémenté ou placeholder non conforme
* **à faire** : prévu, non encore traité
* **hors scope v1** : exclu explicitement

---

## 3. Tableau principal — Tuile cockpit (§6 hors détail)

_Première passe (audit code `units/dorevia-linky`, 2026-03) : statuts et notes indicatifs — à affiner en revue produit._

| ID | Réf. CDCF | Exigence (résumé) | Surface | Bloc fonctionnel | Composant / zone UI | Source de données | Stitch (bloc) | Statut | Décision / arbitrage | Ticket / PR | Notes |
|----|-----------|-------------------|---------|------------------|---------------------|-------------------|---------------|--------|----------------------|-------------|-------|
| T-01 | §6.3.1 | Contexte : tenant, société, période, année | both | Contexte de lecture | `DashboardWithFilters`, `ReportHeader`, hooks période / société | Query + `useDashboardData` / contexte dashboard | — | ok | | | Aligné cockpit et `/tresorerie` via le même layout filtre. |
| T-02 | §6.3.2 | Soldes / caisse / couverture / ERP / fraîcheur | cockpit | Données d’entrée Trésorerie | Tuile Trésorerie dans `CockpitDesktopView` | `GET /api/dashboard-metrics` → `treasury`, `_details.treasury` | carte maîtresse | partiel | Moteur métrique optionnel : `NEXT_PUBLIC_LINKY_USE_METRIC_ENGINE` | | Sans `_details.treasury`, couverture / écarts limités ; bannière côté détail seulement. |
| T-03 | §6.4–6.5 | Valeur principale dominante, monnaie explicite | cockpit | Valeur principale | `CockpitDesktopView` (lien Trésorerie) | `dashboard-metrics.treasury.value` / `formatted` | carte maîtresse | ok | | | `fmt(treasury)` + devise EUR formatée. |
| T-04 | §6.6 | Contexte d’interprétation visible | cockpit | Sous-texte métier | Sous-libellé + barre couverture + lignes écart / rappro | `buildTreasuryCockpitTileModel(metrics)` | carte maîtresse | ok | | | « Solde validé (Vault) », couverture probante, ERP−Vault, volume à rapprocher. |
| T-05 | §6.7 | Signal de confiance distinct et sobre | cockpit | Confiance | Badge `treasuryCockpitPrimaryBadge`, `treasuryMasterCardOutlineClass`, `valueKind` | Statut tuile + `confidence` métrique | carte maîtresse | partiel | Contour / badge = doctrine Web60 + statut trésorerie, pas uniquement §6.7 textuel | | Cohérence à suivre avec `DOCTRINE_ETATS_UI_LINKY`. |
| T-06 | §6.8 | États nominal / chargement / vide / partiel / erreur | cockpit | États UX | Grille cockpit : chargement global ; tuile suit `metrics` | `metricsLoading`, `metrics`, erreurs parent `DashboardWithFilters` | carte maîtresse | partiel | Erreur réseau surtout au niveau page ; tuile peut rester « — » sans bandeau d’erreur dédiée | | À durcir si le CDCF exige erreur explicite **sur la tuile**. |
| T-07 | §3.14.2, §5.9.2, §6.9.4 | Accès au détail, contexte conservé | both | Navigation | `Link` `CockpitDesktopView` → `/tresorerie` ; même `tenant` / filtres | URL + état dashboard partagé | — | ok | _Réf. corrigée : le §6.12 du CDCF est « Hors périmètre », pas la navigation._ | | Navigation + rappel contexte sur la page détail (bandeau). |

---

## 4. Tableau principal — Vue détaillée (§6.9)

_Première passe (audit `app/(cockpit)/tresorerie/page.tsx`) : statuts indicatifs._

| ID | Réf. CDCF | Exigence (résumé) | Surface | Bloc fonctionnel | Composant / zone UI | Source de données | Stitch (bloc) | Statut | Décision / arbitrage | Ticket / PR | Notes |
|----|-----------|-------------------|---------|------------------|---------------------|-------------------|---------------|--------|----------------------|-------------|-------|
| D-01 | §6.9.2, §6.9.3 ; **§7.2.3** | Montant trésorerie à date | detail | Hero Trésorerie | Rangée KPI héro (`page.tsx`, grille 12 col.) | **`dashboard-metrics.treasury`** (même agrégat que la tuile) | à nommer | partiel | Pas d’appel `GET /api/treasury` sur cette page : **choix actuel = cohérence tuile/détail via un seul agrégat** | | Si besoin d’un détail plus fin que le dashboard, introduire `GET /api/treasury` et mettre à jour cette ligne. |
| D-02 | §6.9.2 ; **§7.2.2** | Rappel du contexte actif | detail | Bandeau contexte | Carte période / société / tenant (+ synchro si dispo) | `useDashboardData`, `tDetails.last_statement_import_date` | à nommer | ok | | | |
| D-03 | §6.9.2 ; **§7.2.4** | Niveau de confiance associé | detail | Bloc confiance | Encart « fiable / partiel » + `ConfidenceScore` / barre gouvernance | `computeConfidenceScore(dashboardMetrics)` | à nommer | partiel | Score **global** dashboard, pas un indice trésorerie isolé | | À arbitrer si le CDCF exige un signal **spécifique** trésorerie. |
| D-04 | §6.9.2 ; **§7.2.6** | Composantes principales de la trésorerie | detail | Décomposition | Grille rapprochement + montants rapproché / à rapprocher | `_details.treasury` dans `dashboard-metrics` | à nommer | partiel | Absent si moteur instruments ou pas de breakdown API | | Message explicite si `hasDetails` faux. |
| D-05 | §6.9.2 ; **§7.2.6**, **§7.2.7** | Écarts ou limites de couverture | detail | Bloc écarts | `CockpitTreasuryPartialBanner`, lignes d’écart (tuile / détail) | Flags `showInstrumentPartial`, `showPartialNoBreakdown`, champs tuile | à nommer | partiel | | | Couverture tuile = cockpit ; bannières = détail. |
| D-06 | §6.9.2 ; **§7.2.7** | Signaux de vigilance | detail | Alertes | Alerte « écriture non rapprochée la plus ancienne », gouvernance | `oldest_unreconciled_date`, taux rapprochement | à nommer | partiel | Pas d’agrégat « health » dédié unique ; signaux dispersés | | |
| D-07 | §6.9.2 ; **§7.2.8** | Détail par sous-composant ou source | detail | Détail analytique | `TreasurySvgChart` + section rapprochement | `GET /api/treasury-evolution` + `_details.treasury` | à nommer | partiel | Série indépendante du KPI ; peut être vide (`< 2` points) | | |
| D-08 | §6.9.2 ; **§7.2.1** | Retour cockpit clair | detail | Navigation retour | Lien « Pilotage » + `Sidebar` | — | à nommer | ok | | | |
| D-09 | §6.9.4 ; **§7.1** | Continuité tenant / société / période / année | detail | Contexte partagé | Même `useDashboardData` que le cockpit | Identique T-01 | — | ok | | | |

---

## 5. Tableau §7 — blocs d’écran (vue détail Trésorerie)

_Réf. [`cdcf.md`](./cdcf.md) §7.2. Alignement avec `app/(cockpit)/tresorerie/page.tsx` — première passe mars 2026._

| ID | Bloc §7 (nom CDCF) | Réf. CDCF | Composant / zone UI | Source de données | Stitch (bloc) | Statut | Ticket / PR | Notes |
|----|--------------------|-----------|---------------------|-------------------|---------------|--------|-------------|-------|
| S7-01 | Navigation et en-tête | §7.2.1 | `<header>` : lien Pilotage, titre, `TopBar`, boutons Exporter (désactivé) / Actualiser | — | à nommer | partiel | | Export placeholder. |
| S7-02 | Rappel contexte actif | §7.2.2 | Carte fine période / société / tenant / dernier relevé | `useDashboardData`, `tDetails` | à nommer | ok | | |
| S7-03 | Synthèse montant principal | §7.2.3 | Carte héro « Trésorerie nette disponible » + montant | `dashboard-metrics.treasury` | à nommer | partiel | | Voir D-01 (agrégat unique). |
| S7-04 | Bloc confiance | §7.2.4 | Encart fiable/partiel + sous-texte rapprochement ou `ConfidenceScore` | `computeConfidenceScore`, `reconciliationRate` | à nommer | partiel | | Score global. |
| S7-05 | Interprétation / périmètre | §7.2.5 | Carte « Contexte données » (citation `sourceLine`) | `primarySource`, texte métier | à nommer | ok | | |
| S7-06 | Composantes / rapprochement | §7.2.6 | Section « Rapprochement bancaire » grille KPI | `_details.treasury` | à nommer | partiel | | Message si pas `hasDetails`. |
| S7-07 | Signaux de vigilance | §7.2.7 | Encart ancienneté non rapproché + indicateurs gouvernance | `oldest_unreconciled_date`, taux | à nommer | partiel | | |
| S7-08 | Lecture temporelle | §7.2.8 | « Évolution du solde » + `TreasurySvgChart` | `GET /api/treasury-evolution` | à nommer | partiel | | Vide si `< 2` points. |
| S7-09 | Gouvernance (optionnel) | §7.2.9 | Colonne « Gouvernance » (santé synchro, checklist) | `confidenceScore`, `reconciliationRate` | à nommer | partiel | | Optionnel §7.2.9 — présent dans l’UI actuelle. |

---

## 6. Référentiel API / hooks

| Ressource | Chemin ou hook |
|-----------|----------------|
| Métriques dashboard | `GET /api/dashboard-metrics`, `useDashboardData` |
| Trésorerie détaillée | `GET /api/treasury` *(non utilisé aujourd’hui sur la page détail — voir D-01)* |
| Évolution trésorerie | `GET /api/treasury-evolution` |
| Cartes cockpit | `GET /api/cockpit/cards` |
| Instruments | `GET /api/instruments` |

---

## 7. Règles de tenue du tableau

* une ligne = une exigence vérifiable
* pas de mélange entre plusieurs comportements dans une même ligne
* toute ligne en **partiel** doit expliquer clairement la limite (colonne Notes ou Décision)
* tout arbitrage entre CDCF, Stitch et code doit être écrit dans **Décision / arbitrage**
* toute mise en production du Jalon D doit s’appuyer sur ce tableau à jour

---

## 8. Première passe recommandée

Ordre conseillé pour le premier audit :

1. **T-01 à T-07** pour sécuriser la tuile cockpit
2. **D-01 à D-09** pour la vue détaillée minimale conforme au §6
3. **S7-01 à S7-09** contre **§7.2** après chaque évolution de `/tresorerie`

---

*Registre vivant d’alignement produit / design / code. Première passe statuts : hypothèses d’audit repo ; Ticket/PR à renseigner au fil des livraisons.*

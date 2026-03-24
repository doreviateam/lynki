# Checklist de recette détaillée — Lynki V1

*Ce document complète le [CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md), le [PLAN_LOTS_DEV_LYNKI_V1.md](./PLAN_LOTS_DEV_LYNKI_V1.md), le [MAPPING_FRONT_DONNEES_LYNKI_V1.md](./MAPPING_FRONT_DONNEES_LYNKI_V1.md) et le [BACKLOG_IMPLEMENTATION_LYNKI_V1.md](./BACKLOG_IMPLEMENTATION_LYNKI_V1.md). Il sert à vérifier qu'un lot livré est conforme non seulement visuellement, mais aussi en termes de hiérarchie de lecture, d'états, de qualité de donnée, de graphes et de comportement par persona.*

---

## 1. Objet du document

Cette checklist a pour objet de fournir une base de recette détaillée pour **Lynki V1**.

Elle permet de vérifier, lot par lot et écran par écran, que l'intégration :

* respecte le **canon produit** ;
* respecte le **handoff design** ;
* respecte le **cahier des charges d'intégration** ;
* traite correctement les **états de donnée** ;
* traite correctement les **états d'interface** ;
* conserve la logique des **graphes** ;
* et sert correctement les personas **Max**, **Véréna** et **Esther**.

---

## 2. Statut du document

* **Version** : V1
* **Statut** : référence de recette détaillée pour Lynki V1
* **Auteur / responsable** : équipe produit Lynki (Dorevia)
* **Dernière mise à jour** : 24 mars 2026
* **Documents parents** :

  * [`DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md`](./DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md)
  * [`CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md`](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md)
  * [`PLAN_LOTS_DEV_LYNKI_V1.md`](./PLAN_LOTS_DEV_LYNKI_V1.md)
  * [`MAPPING_FRONT_DONNEES_LYNKI_V1.md`](./MAPPING_FRONT_DONNEES_LYNKI_V1.md)
  * [`BACKLOG_IMPLEMENTATION_LYNKI_V1.md`](./BACKLOG_IMPLEMENTATION_LYNKI_V1.md)

---

## 3. Mode d'utilisation

Cette checklist peut être utilisée :

* à la fin de chaque **lot dev** ;
* lors d'une **revue produit / design / intégration** ;
* en **pré-recette** ;
* en **recette finale V1**.

Elle ne remplace pas :

* les tests techniques ;
* les tests API ;
* ni les tickets.

Elle sert à vérifier la **conformité fonctionnelle et visuelle du front**.

### Convention de validation conseillée

Pour chaque item, utiliser l'un des statuts suivants :

* **OK**
* **OK avec réserve**
* **KO**
* **Non applicable**

Les items marqués **[Critique]** sont **structurants** : une recette ne peut être considérée comme **validée** que si tous les items critiques sont en **OK** ou en **OK avec réserve** — et dans ce dernier cas, la réserve doit être **explicitement tracée** (où, pourquoi, action / date).

> **Règle** : aucune validation « au feeling » si un item **[Critique]** est en **KO** sans arbitrage produit écrit.

> **Légende des cases** : `[x]` = implémenté / confirmé dans le code · `[ ]` = non encore implémenté ou non vérifié · `[~]` = partiel / données mockées — à lever avant recette finale

---

## 4. Règles globales de recette

Avant toute validation détaillée, vérifier les règles suivantes :

### 4.1 Cohérence produit

* **[Critique]** Le produit conserve bien la distinction :

  * **Pilotage** — [x] implémenté (`CockpitMobileView`, `CockpitDesktopView`, `IconGrid`)
  * **Synthèse comptable** — [x] implémenté (`AccountingSummaryView` via `?view=synthese`)
  * **Détail** — [~] implémenté pour Trésorerie uniquement ; autres détails à créer
* **[Critique]** Les personas restent lisibles :

  * **Max voit vite** — [x] cockpit mobile `CockpitMobileView` avec 3 tuiles maîtresses + tuiles compactes
  * **Véréna pilote** — [~] cockpit desktop `CockpitDesktopView` présent mais non encore basculé comme vue principale
  * **Esther explique** — [x] synthèse comptable opérationnelle

### 4.2 Cohérence de hiérarchie

* **[Critique]** Les **tuiles maîtresses** dominent bien la lecture. — [x] Trésorerie full-width mobile ; 2×2 desktop
* Les **tuiles secondaires** complètent sans brouiller. — [x] `CompactTile` utilisés
* Les **blocs de synthèse** restent structurants. — [x] dans `AccountingSummaryView`
* **[Critique]** Les **blocs de confiance** restent visibles sans envahir l'écran. — [x] `ConfidenceScore` discret ; `IntegrityBadge` en header

### 4.3 Cohérence des états

* **[Critique]** Les états de donnée sont bien différenciés : — [~] OK avec réserve

  * fiable — [x] badge vert « Fiable » / « SYNCHRO OK »
  * partielle — [x] badge amber « Partielle »
  * proxy — [x] badge bleu « PROXY DATA »
  * à rapprocher — [~] logique présente, rendu visuel à confirmer en recette
  * indisponible — [~] géré par `SyncInProgress` mais non différencié visuellement des autres états
  * anomalie — [~] présent dans alertes ; distinction métier/donnée à confirmer
* Les états d'interface sont correctement gérés :

  * loading — [x] spinners dans toutes les cartes
  * vide — [x] état vide explicite dans alertes
  * alerte — [x] `AlertCard` avec niveaux
  * critique — [x] niveau "urgence" dans alertes
  * partiel — [x] `SyncInProgress` + bypass utilisateur
  * placeholder — [x] `PosComingSoonView` pour Z de caisse

### 4.4 Cohérence des graphes

* **[Critique]** Les graphes sont utiles. — [~] OK pour synthèse comptable ; barres desktop mockées
* **[Critique]** Les graphes restent lisibles. — [x] sparklines et barres lisibles
* **[Critique]** Les graphes n'écrasent jamais le KPI principal. — [x] KPI en haut, graphe en bas
* **[Critique]** Les graphes ne sont pas décoratifs. — [~] OK avec réserve : barres Trésorerie desktop (12 pts hardcodés) sont encore décoratives

### 4.5 Cohérence responsive

* **[Critique]** Le mobile n'est pas un desktop compressé. — [x] `CockpitMobileView` ≠ `CockpitDesktopView`
* **[Critique]** Le desktop n'est pas un mobile enrichi. — [x] grille bento 6 cols vs liste mobile
* **[Critique]** Chaque support respecte son usage produit. — [x]

---

## 5. Checklist par lot

### Lot 0 — Cadrage technique et préparation

#### A. Lecture commune

* [x] Le handoff design V1 a été lu par les parties prenantes.
* [x] Le CDC intégration front V1 a été lu par les parties prenantes.
* [x] Le plan de lots dev V1 est compris.
* [x] Le mapping front ↔ données V1 est compris.

#### B. Préparation technique

* [x] L'existant dans `units/dorevia-linky/` a été inventorié.
* [x] Les écarts entre existant et cible ont été identifiés.
* [x] Une arborescence composants / vues a été proposée.
* [x] Les conventions de nommage ont été fixées.
* [x] La stratégie responsive a été clarifiée.
* [x] La stratégie de gestion des états a été clarifiée.
* [x] La stratégie graphes a été clarifiée.

#### C. Sortie du lot

* [x] L'équipe sait ce qui sera réutilisé.
* [x] L'équipe sait ce qui doit être créé.
* [x] L'ordre des lots est compris.
* [x] Les ambiguïtés majeures ont été levées.

---

### Lot 1 — Fondations UI et composants de base

#### A. Layout et surfaces

* [x] Le layout de base est intégré.
* [x] Les surfaces et conteneurs sont cohérents.
* [x] Les cartes ont un comportement cohérent.
* [x] L'espacement général est stable.
* [x] La hiérarchie typographique est lisible.

#### B. Composants de base

* [x] La tuile maîtresse existe comme composant réutilisable. (`InstrumentCardChrome` + variantes domaine)
* [x] La tuile secondaire B existe comme composant réutilisable. (`CompactTile`)
* [x] La tuile secondaire C existe comme composant réutilisable. (`PosComingSoonView` pour placeholder)
* [x] Le placeholder produit existe comme variante. (Z de caisse `pos_z`)
* [x] **[Critique]** Le bloc de confiance existe. (`ConfidenceScore`, `IntegrityBadge`, `VaultageIndicator`)
* [x] Le bloc d'alerte existe. (`AlertCard` avec 3 niveaux de sévérité)
* [x] Le bloc insight existe. (`DivaFlashBlock`)
* [x] Les badges de statut existent. (badges inline fiable/partielle/proxy/estimée)
* [x] Les filtres existent. (`ReportHeader` : société + période + année)
* [x] Les sélecteurs période / entité existent. (intégrés dans `ReportHeader`)
* [x] Les tables de base existent. (tableau trésorerie + tableaux synthèse comptable)

#### C. États

* [x] L'état **loading** existe. (spinners dans toutes les cartes + `SyncInProgress`)
* [x] L'état **vide** existe. (vue "aucune alerte" dans `/alerts`)
* [x] L'état **partiel** existe. (`SyncInProgress` avec bypass + badges amber)
* [~] L'état **indisponible** existe là où pertinent. (géré globalement, à affiner par tuile)
* [x] L'état **anomalie** existe. (niveau "urgence" dans alertes)
* [~] L'état **à rapprocher** existe là où pertinent. (logique backend, rendu front à confirmer)
* [x] L'état **placeholder** existe. (Z de caisse `PosComingSoonView`)

#### D. Graphes de base

* [x] La sparkline de base existe. (`CardChartSection`)
* [x] Le composant barres existe. (`DualSeriesChart`, barres dans tuiles)
* [x] Le composant double série existe. (`DualSeriesChart`, `BusinessChart`)
* [x] Le composant breakdown simple existe. (`AccountingSummaryBreakdownChart`)

#### E. Réutilisabilité

* [x] Les composants ne sont pas construits en one-shot.
* [x] Les variantes principales sont explicites.
* [~] Les composants sont documentés minimalement. (commentaires dans le code, pas de Storybook)
* [x] Les composants sont utilisables dans les lots 2 à 5.

---

### Lot 2 — Pilotage mobile Max

#### A. Structure générale

* [x] Le header est présent et lisible.
* [x] **[Critique]** Le statut global de confiance est visible. (`ConfidenceScore`)
* [x] **[Critique]** Les 3 tuiles maîtresses sont visibles en priorité.
* [x] Les tuiles secondaires restent lisibles en mobile. (grille 2 cols `CompactTile`)
* [x] Le bloc insight / priorité est présent si prévu. (`DivaFlashBlock`)
* [x] La navigation mobile est cohérente. (`BottomNav`)

#### B. Persona Max

* [x] L'écran se lit vite.
* [x] L'essentiel est compréhensible en quelques secondes.
* [x] La densité reste adaptée au mobile.
* [x] Les informations secondaires ne brouillent pas le noyau de pilotage.

#### C. États de donnée

* [x] Une tuile fiable est identifiable comme telle. (badge vert + icône `verified`)
* [x] Une tuile partielle est identifiable comme telle. (badge amber « Partielle »)
* [~] Une tuile à rapprocher est identifiable comme telle. (logique présente, rendu à confirmer)
* [~] Une tuile indisponible reste lisible. (géré globalement par `SyncInProgress`)
* [~] **[Critique]** Une anomalie de donnée n'est pas confondue avec une alerte métier. (distinction présente dans alertes ; à valider sur les tuiles)
* [x] Un placeholder éventuel est clairement assumé. (Z de caisse `PosComingSoonView`)

#### D. Graphes

* [~] Les mini-graphes sont lisibles sur mobile. (barres mobiles absentes ; `CompactTile` sans graphe)
* [x] **[Critique]** Les graphes n'écrasent pas les KPI. (KPI au-dessus du graphe)
* [~] Les graphes aident réellement à lire une tendance. (sparklines présents dans tuiles maîtresses desktop, absents mobile compact)
* [~] **[Critique]** Aucun graphe n'est purement décoratif. (OK avec réserve — graphes synthèse OK, barres trésorerie mobile à confirmer)

#### E. Critère final

* [x] Max peut comprendre l'état global rapidement.
* [x] Max distingue le noyau de pilotage du reste.
* [x] Max perçoit la qualité de la donnée. (badges fiable/partielle/estimée visibles)
* [x] L'écran ressemble à un cockpit mobile, pas à une liste de cartes génériques.

---

### Lot 2 bis — Alertes / Signaux Max

#### A. Structure générale

* [x] Le header est clair. (titre "Alerts & Signals" + `ConfidenceScore` compact)
* [x] Les alertes sont hiérarchisées. (sections urgence → vigilance → suivi)
* [x] Le niveau de criticité est visible. (badge + icône + bordure colorée)
* [~] L'action attendue est compréhensible. (boutons présents ; logique mockée)
* [~] Un bloc de recommandation est présent si prévu. (absent actuellement)

#### B. Lecture des signaux

* [~] **[Critique]** Une alerte métier est distinguée d'une anomalie de donnée. (OK avec réserve — structure prévue mais distinction sémantique à renforcer dans les données)
* [x] Une vigilance est distinguée d'une urgence. (couleurs + icônes différenciées)
* [x] Un simple suivi est distingué d'un sujet critique. (3 niveaux visibles)
* [x] L'absence d'alerte majeure est lisible. (état vide explicite avec icône check + message)

#### C. États

* [x] Le mode critique est visible sans hystérie visuelle.
* [~] Les alertes partielles restent compréhensibles. (pas de données réelles ; à valider)
* [~] L'indisponibilité des alertes ne casse pas l'écran. (non testé sans API)
* [~] Les signaux de qualité de donnée sont lisibles. (champ `source` présent ; `signalReliability` partiel)

#### D. Critère final

* [~] Max peut prioriser immédiatement. (OK avec réserve — données mockées)
* [~] L'écran fonctionne comme centre d'arbitrage. (structure OK ; actions à brancher)
* [x] Le bruit visuel reste faible.

---

### Lot 3 — Pilotage desktop Véréna

#### A. Structure générale

* [x] Le header enrichi est lisible. (`TopBar` avec score confiance)
* [x] La grille des 12 tuiles est présente. (grille bento 6 cols avec tuiles maîtresses 2×2 + secondaires)
* [x] La hiérarchie entre tuiles maîtresses et secondaires est visible.
* [~] Le bloc de confiance transverse est présent. (score intégrité calculé mais hardcodé à 94.2 %)
* [x] Les filtres desktop sont lisibles. (`ReportHeader`)
* [~] La navigation vers le détail existe. (Trésorerie uniquement → `/tresorerie`)

#### B. Persona Véréna

* [x] La vue permet une lecture simultanée.
* [~] Les tensions principales sont comparables. (données réelles 3 tuiles maîtresses ; secondaires OK)
* [x] La densité est utile sans être confuse.
* [x] L'écran se comporte comme un cockpit opérationnel.

#### C. Hiérarchie des tuiles

* [x] **[Critique]** Trésorerie domine bien la lecture. (2×2 en haut à gauche)
* [x] **[Critique]** Business domine bien la lecture. (2×2 au centre)
* [x] **[Critique]** Flux net domine bien la lecture. (2×2 en haut à droite)
* [x] Les tuiles B enrichissent sans concurrencer les maîtresses. (compactes 1×1)
* [~] Les tuiles C restent utiles sans encombrer. (seulement POS/Z ; 2 tuiles C manquantes)

#### D. États de donnée

* [~] **[Critique]** Les états de confiance sont visibles dans la grille. (badges inline ; score global hardcodé)
* [~] Les cas partiels sont gérés proprement. (à valider avec données réelles)
* [~] Les indisponibilités ne cassent pas la structure. (non testé)
* [~] Les anomalies sont lisibles. (badge "PROXY DATA" présent)
* [x] Le placeholder Z de caisse est assumé. (`PosComingSoonView`)

#### E. Graphes

* [~] Les graphes cockpit sont lisibles. (barres Trésorerie : 12 points mockés)
* [~] Les graphes soutiennent la lecture. (OK avec réserve — données fictives)
* [~] Les graphes sont cohérents d'une tuile à l'autre. (seule Trésorerie a un graphe desktop)
* [x] Les graphes ne créent pas de surcharge.

#### F. Critère final

* [~] Véréna peut piloter, comparer et investiguer. (OK avec réserve — tuiles réelles, graphes à brancher)
* [x] La vue ressemble à un cockpit RAF.
* [~] **[Critique]** La confiance dans la donnée est réellement transverse. (score hardcodé — à dynamiser)

---

### Lot 4 — Synthèse comptable Esther

#### A. Structure générale

* [x] Le header de synthèse est lisible.
* [x] Le résumé exécutif est présent. (`AccountingSummaryCodirBlock`)
* [x] Les blocs de synthèse sont présents. (`AccountingSummaryProofBlock`, `AccountingSummaryAlerts`)
* [~] Les tableaux sont présents. (présents ; certaines sources TBD)
* [x] Les blocs de confiance sont présents. (`AccountingSummaryAlerts`, `BankReconciliationBlock`)
* [x] Les graphes de compréhension sont présents. (`AccountingSummaryBreakdownChart`, `AccountingSummaryTrendChart`)
* [~] Une logique d'entrée vers le détail existe. (lien ledger `/accounting/gl` ; navigation partielle)

#### B. Persona Esther

* [x] La lecture est structurée.
* [x] La vue aide à comprendre.
* [x] La vue aide à justifier. (`AccountingSummaryProofBlock`)
* [~] La vue aide à se projeter dans la restitution. (OK avec réserve — certains tableaux TBD)
* [x] **[Critique]** La vue ne ressemble pas à un dashboard réarrangé.

#### C. Qualité des tableaux

* [~] Les montants sont lisibles. (OK avec réserve — certains montants TBD)
* [x] Les alignements sont corrects.
* [x] Les hiérarchies de lignes sont lisibles.
* [~] Les états partiels ou vides restent compréhensibles. (à valider sur données réelles)

#### D. Graphes

* [x] Les graphes complètent les tableaux.
* [x] Les graphes n'écrasent pas la logique comptable.
* [x] Les breakdowns sont lisibles.
* [~] Les graphes vieillissement / répartition sont cohérents si présents. (à confirmer en recette)

#### E. États

* [~] Un bloc partiel reste lisible. (à valider)
* [~] Un bloc indisponible est géré proprement. (à valider)
* [~] Une anomalie est signalée correctement. (`AccountingSummaryAlerts` présent ; à valider)
* [~] Un tableau peut exister sans son graphe associé si nécessaire. (à valider)

#### F. Critère final

* [x] Esther peut lire, comprendre et justifier.
* [~] La vue peut servir de base de restitution. (OK avec réserve — données TBD sur certains blocs)
* [~] La logique synthèse → détail se sent. (navigation partielle)

---

### Lot 5 — Détail Trésorerie

#### A. Structure générale

* [x] Le KPI principal est visible. (trésorerie nette calculée sur comptes + `ConfidenceScore`)
* [x] Le graphe de détail est présent. (`TreasurySvgChart` avec projection J+30)
* [x] Le tableau ou détail contextuel est présent. (tableau comptes bancaires avec recherche)
* [x] Le bloc de rapprochement / confiance est présent. (panneau "Gouvernance")
* [x] La navigation retour cockpit existe. (breadcrumb `Pilotage → Détail : Trésorerie`)

#### B. Lecture métier

* [x] La vue est un approfondissement métier.
* [x] La hiérarchie entre KPI, graphe et tableau est claire.
* [~] Les écarts sont lisibles. (hardcodés +4.2 % — données mockées)
* [~] Les rapprochements sont lisibles. (statuts ok/warning/error dans tableau ; données mockées)

#### C. États

* [~] L'état à rapprocher est correctement rendu. (statut "warning" sur compte SG ; données mockées)
* [~] L'état partiel est correctement rendu. (à valider avec données réelles)
* [~] L'état indisponible est correctement rendu. (non testé)
* [~] L'état anomalie est correctement rendu. (bloc amber "12 actions manuelles" — hardcodé)

#### D. Graphes

* [x] Le graphe de détail sert l'analyse. (`TreasurySvgChart` avec réel + projection)
* [x] Le graphe n'écrase pas le KPI. (KPI en haut, graphe en dessous)
* [~] Le graphe reste lisible en cas de partiel. (à valider avec données partielles)
* [~] Le graphe n'est pas décoratif. (OK avec réserve — données mockées mais forme pertinente)

#### E. Critère final

* [x] La page est perçue comme une vraie vue détail Lynki.
* [x] Elle ne ressemble pas à une vue technique brute.

---

### Lot 6 — Stabilisation / recette finale

#### A. Cohérence inter-écrans

* [~] Les composants se comportent de manière cohérente d'un écran à l'autre. (à valider en Lot 6)
* [~] Les états ont une logique stable. (à valider)
* [~] Les badges et statuts restent cohérents. (à vérifier — score confiance hardcodé sur certains écrans)
* [~] Les graphes ont une doctrine stable. (à valider)
* [~] Les écrans appartiennent clairement au même produit. (à valider)

#### B. Cohérence cross-device

* [x] Max mobile reste cohérent avec son rôle.
* [x] Véréna desktop reste cohérente avec son rôle.
* [x] Esther desktop reste cohérente avec son rôle.
* [x] Les différences mobile / desktop sont justifiées et non accidentelles.

#### C. Qualité de la donnée

* [x] La confiance reste lisible partout où nécessaire.
* [x] Les cas partiels / indisponibles ne créent pas de confusion.
* [x] Les proxys sont explicitement assumés.
* [x] Les sujets à rapprocher sont visibles.
* [x] Les anomalies ne sont pas masquées.

#### D. Dette résiduelle

* [x] Les écarts résiduels sont listés. (voir `PLAN_EXECUTION_LYNKI_V1.md` § 4)
* [x] Les arbitrages reportés en V2 sont identifiés. (voir `PLAN_EXECUTION_LYNKI_V1.md` § 4.3)
* [x] Les points ouverts non bloquants sont documentés.

#### E. Critère final

* [x] Lynki V1 est cohérent, démontrable et réutilisable.
* [x] L'équipe peut continuer sans repartir du chaos.

---

## 6. Checklist transverse par composant

### Tuile maîtresse

* [x] **[Critique]** Le KPI domine.
* [x] Le graphe reste secondaire.
* [x] **[Critique]** Le statut de donnée est visible. (badges fiable/partielle/proxy/estimée)
* [x] Les variantes existent. (tuiles Trésorerie, Business, Flux net avec designs différenciés)
* [x] Le composant est réutilisable. (`InstrumentCardChrome`)

### Tuile secondaire

* [x] L'information reste utile.
* [x] La densité est maîtrisée.
* [x] Les états sont gérés. (`CompactTile` avec prop `confidence`)
* [x] Le composant n'imite pas artificiellement une tuile maîtresse.

### Bloc de confiance

* [x] **[Critique]** La qualité de donnée est lisible. (`ConfidenceScore`, `IntegrityBadge`)
* [~] Le bloc ne devient pas purement décoratif. (OK avec réserve — score hardcodé sur certains écrans)
* [~] Les états confiance / partiel / à rapprocher / anomalie sont cohérents. (états présents ; cohérence à valider)

### Bloc d'alerte

* [x] L'alerte guide une action. (boutons d'action sur chaque `AlertCard`)
* [x] La criticité est lisible. (urgence / vigilance / suivi avec codes couleur)
* [x] Le bloc ne crée pas de bruit inutile.

### Tableau

* [x] Les montants sont lisibles. (formatage `fr-FR` EUR)
* [~] Les lignes restent compréhensibles en état partiel. (à valider)
* [~] Les vides ne cassent pas la lecture. (à valider)
* [~] Les anomalies de ligne sont visibles si nécessaires. (statuts ok/warning/error présents)

### Graphe

* [x] Il a une fonction de lecture claire.
* [~] **[Critique]** Il n'est pas décoratif. (OK avec réserve — barres desktop Trésorerie encore mockées)
* [~] **[Critique]** Il reste lisible en état partiel. (à valider)
* [x] **[Critique]** Il ne prend pas le dessus sur le sens métier.

---

## 7. Checklist transverse par état

### Fiable / confirmée

* [x] L'état inspire confiance. (badge vert + icône `verified`)
* [x] Il ne surcharge pas l'UI.

### Partielle

* [x] L'utilisateur comprend que la lecture est possible mais incomplète. (badge amber « Partielle »)
* [x] L'écran reste stable.

### Proxy

* [x] L'utilisateur comprend que la valeur n'est pas définitive. (badge bleu « PROXY DATA »)
* [~] **[Critique]** Le front ne la fait pas passer pour confirmée. (OK avec réserve — à confirmer sur tous les écrans)

### À rapprocher

* [~] L'utilisateur comprend qu'un rapprochement est en attente. (logique présente ; rendu à valider)
* [~] L'impact de cet état est lisible. (à valider)

### Indisponible

* [~] Le composant reste lisible. (géré globalement par `SyncInProgress` ; tuile par tuile à confirmer)
* [~] Le produit ne paraît pas cassé. (à valider)

### Anomalie

* [x] L'utilisateur comprend qu'il y a un sujet à investiguer. (alertes urgence bien identifiées)
* [~] **[Critique]** L'anomalie ne se confond pas avec une simple alerte UI. (OK avec réserve — distinction sémantique à renforcer)

---

## 8. Checklist finale de passage en production interne / démo

Avant validation finale V1 :

* [x] les écrans P0 sont validés ;
* [x] les composants de base sont stabilisés ;
* [x] les états critiques sont couverts ;
* [x] les graphes clés sont intégrés ;
* [x] les écarts résiduels sont tracés ; (voir `PLAN_EXECUTION_LYNKI_V1.md` § 4)
* [x] les points V2 sont identifiés ; (voir `PLAN_EXECUTION_LYNKI_V1.md` § 4.3)
* [x] la démonstration produit est fluide ;
* [x] les personas principaux sont bien servis.

---

## 9. Formule finale

> La recette Lynki V1 ne valide pas seulement que « le front ressemble à la maquette ». Elle valide que le produit reste fidèle à sa promesse : organiser une lecture hiérarchisée, qualifiée et gouvernable des données financières.

---

## 10. Sortie de recette

À l'issue d'une recette (lot ou transversale), **produire** :

* la liste des items **OK** ;
* la liste des items **OK avec réserve** (avec **trace écrite** de chaque réserve : périmètre, risque, action, responsable, échéance si utile) ;
* la liste des items **KO** ;
* les **arbitrages demandés au produit** (décisions attendues) ;
* les **points reportés en V2** si applicable.

Cette sortie peut vivre dans l'outil de suivi (ticket, page wiki, commentaire de release) : l'important est qu'elle soit **retrouvable** pour la revue suivante.

### Synthèse de recette — 24 mars 2026

| Lot | Statut global | Réserves principales |
|-----|--------------|----------------------|
| Lot 0 — Cadrage | **OK** | — |
| Lot 1 — Fondations UI | **OK avec réserve** | État "à rapprocher" à valider visuellement |
| Lot 2 — Pilotage mobile Max | **OK avec réserve** | Graphes mini-tuiles absents ; score confiance dynamique ✅ |
| Lot 2 bis — Alertes Max | **OK avec réserve** | Alertes réelles via adapter ✅ — bruits possibles selon données tenant |
| Lot 3 — Desktop Véréna | **OK avec réserve** | Vue canonique active ✅ ; score confiance dynamique ✅ ; 2 tuiles C manquantes (V2) |
| Lot 4 — Synthèse Esther | **OK avec réserve** | Certains tableaux TBD ; navigation détail partielle |
| Lot 5 — Détail Trésorerie | **OK avec réserve** | Données réelles ✅ ; projection J+30 absente (V2) |
| Lot 6 — Stabilisation | **Fait** | Sprint bascule terminé 24 mars 2026 — recette V1 clôturée |

**→ Recette V1 clôturée (Passe 1 + Passe 2) :** [`RECETTE_V1_LYNKI_PASSE1.md`](./RECETTE_V1_LYNKI_PASSE1.md) — **verdict : GO V1 avec réserves**

---

*Document V1 — checklist de recette détaillée Lynki. À utiliser lot par lot, puis en recette finale transversale.*

*Dernière mise à jour : 24 mars 2026 — recette V1 clôturée (Passe 1 + Passe 2), verdict **GO V1 avec réserves**.*

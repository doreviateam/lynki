# Grille de cadrage — Bloc Évolution des cards Linky

Document de cadrage produit pour le bloc **Évolution** commun aux cards Trésorerie, BFR et Encours de Linky. Il définit les métriques à historiser, les rendus visuels recommandés et les règles d’affichage.

---

## Sommaire

1. [Cadre commun](#1-cadre-commun)
2. [Règles et principes](#2-règles-et-principes)
3. [Cadrage détaillé par card](#3-cadrage-détaillé-par-card)
   - [Trésorerie](#trésorerie)
   - [BFR](#bfr)
   - [Encours](#encours)
4. [Avis d’expert — Conformité à l’implémentation](#4-avis-dexpert--conformité-à-limplémentation)
5. [Conclusion et suite](#5-conclusion-et-suite)

---

## 1. Cadre commun

Le bloc **Évolution** doit toujours répondre à la même question :

> **Comment l’indicateur se comporte-t-il dans le temps ?**

Selon la card, la lecture attendue change :

- **Trésorerie** : une trajectoire de cash
- **BFR** : une tension d’exploitation
- **Encours** : une dérive du risque client

### Tableau de cadrage

| Card | Ce que l’évolution exprime | Métrique principale à historiser | Métriques secondaires à historiser | Ce qui reste en état courant | Type de rendu recommandé |
| --- | --- | --- | --- | --- | --- |
| **Trésorerie** | La trajectoire temporelle du cash validé | `cash_validated` | `cash_erp`, `coverage_ratio`, `validation_status` | Détail des libellés de couverture, statut textuel complet | **Courbe de niveau** |
| **BFR** | L’évolution de la tension d’exploitation (AR - AP) | `bfr_net` | `ar_total`, `ap_total`, `ar_overdue_ratio`, `stock_total` si intégré plus tard | Détail cartes créances/dettes, bloc stocks hors périmètre | **Courbe + lecture d’écart** |
| **Encours** | L’évolution du risque client et du retard | `receivables_overdue` ou `overdue_ratio` | `receivables_total`, `receivables_current`, `overdue_invoice_count` | Top créanciers, détail par client | **Courbe / aire simple** centrée sur l’échu |

---

## 2. Règles et principes

### Règle d’architecture

**Source des données :** Toutes les données affichées par Linky (y compris les blocs Évolution) proviennent **exclusivement du Vault** — soit en direct, soit via des séries/tables alimentées par le Vault. Référence : spec consolidée §2.0.

Pour les trois cards, la règle suivante s’applique :

> **Le bloc Évolution s’appuie sur des snapshots journaliers historisés d’agrégats métier.**

Conséquences :

- Les **tops**, répartitions détaillées et listes partenaires restent du **courant**
- Le bloc Évolution ne consomme que des **séries d’agrégats propres**
- Même mécanique technique, narration différente selon la card

### Règle produit

Chaque card doit avoir :

- **1 métrique principale** pour la courbe
- **2 à 3 métriques secondaires** au maximum
- Un rendu lisible même si certaines secondaires sont absentes

### Positionnement

Le cadrage repose sur un triptyque cohérent :

- **Trésorerie** = courbe de niveau
- **BFR** = courbe de tension
- **Encours** = courbe de risque

Pour chaque card, il s’agit de figer : la **métrique principale**, la **granularité** (jour, semaine, mois) et le **rendu visuel exact** du bloc Évolution. Trésorerie est prise comme référence, puis la logique est répliquée aux autres cards.

---

## 3. Cadrage détaillé par card

### Trésorerie

**Question métier :** La trésorerie validée monte-t-elle, baisse-t-elle, ou décroche-t-elle ?

#### 1. Métrique principale

**`cash_validated`** = trésorerie validée Vault.

C’est la courbe principale qui porte la promesse Linky : **une trésorerie pilotable et vérifiable**.

#### 2. Métriques secondaires

- **`cash_erp`** = solde comptable ERP
- **`coverage_ratio`** = couverture probante

Suffisant pour une première version propre.

#### 3. Données à historiser (journalier)

- date
- `cash_validated`
- `cash_erp`
- `coverage_ratio`
- `validation_status`

#### 4. Granularité

**Journalier par défaut.**

- Assez fin pour voir les mouvements réels
- Simple à historiser
- Cohérent avec une lecture CFO

Selon la période affichée :

- **30 jours** → journalier
- **90 jours** → journalier ou hebdo lissé
- **12 mois / exercice** → hebdo ou mensuel agrégé si besoin

#### 5. Type de rendu visuel

**Une courbe principale de niveau.**

- Ligne principale = `cash_validated`
- Ligne secondaire discrète = `cash_erp` si disponible
- Indicateurs de couverture/validation en complément, pas comme 3ᵉ courbe

Lecture visée : **niveau, tendance, écart éventuel avec ERP**.

#### 6. Ce que le bloc doit faire comprendre

En un coup d’œil :

- Si la trésorerie monte ou baisse
- Si elle est stable ou irrégulière
- Si la valeur validée est proche ou non du solde ERP
- Si la fiabilité est forte ou partielle

#### 7. États d’affichage

| État | Comportement |
| --- | --- |
| **Données suffisantes** | La courbe s’affiche. |
| **Données partielles** | La courbe s’affiche, avec mention de couverture partielle. |
| **Historique insuffisant** | Pas de courbe ; message compact : *Historique insuffisant pour afficher une évolution sur la période.* |

#### Décision recommandée

- **Métrique principale** : `cash_validated`
- **Secondaires** : `cash_erp`, `coverage_ratio`
- **Granularité source** : journalière
- **Rendu** : courbe de niveau simple
- **Règle d’apparition** : au moins 2 points historisés

#### Formulation produit

> Le bloc Évolution de la card Trésorerie visualise la trajectoire temporelle de la trésorerie validée, avec mise en regard du solde ERP et du niveau de couverture probante.

---

### BFR

**Question métier :** La pression d’exploitation s’améliore-t-elle ou se tend-elle ?

#### 1. Métrique principale

**`bfr_net`** = besoin en fonds de roulement net (créances clients – dettes fournisseurs).

Mention explicite : **stock hors périmètre** tant qu’il n’est pas intégré. Cette métrique exprime la **tension d’exploitation**.

#### 2. Métriques secondaires

- **`ar_total`** = créances clients
- **`ap_total`** = dettes fournisseurs
- **`ar_overdue_ratio`** = part des créances échues

Lecture : niveau de tension, origine de la tension, qualité du recouvrement.

#### 3. Données à historiser (journalier)

- date
- `bfr_net`
- `ar_total`
- `ap_total`
- `ar_overdue_ratio`
- (plus tard `stock_total` si le périmètre stock entre dans le calcul)

#### 4. Granularité

**Journalier par défaut** (cohérent avec Trésorerie, simple à historiser).

#### 5. Type de rendu visuel

**Courbe de tension.**

- Courbe principale = `bfr_net`
- Lecture secondaire simple possible : `ar_total` vs `ap_total`
- Pas plus de 2 ou 3 signaux visuels ; le bloc reste lisible.

#### 6. Ce que le bloc doit faire comprendre

En un coup d’œil :

- Si la tension d’exploitation augmente ou diminue
- Si le BFR se dégrade ou s’améliore
- Si la hausse vient surtout des créances
- Si l’échu client pèse davantage

#### 7. États d’affichage

| État | Comportement |
| --- | --- |
| **Données suffisantes** | La courbe s’affiche. |
| **Données partielles / périmètre incomplet** | La courbe s’affiche, avec mention du périmètre (ex. *stock non intégré*). |
| **Historique insuffisant** | Pas de courbe, message compact. |

#### Décision recommandée

- **Métrique principale** : `bfr_net`
- **Secondaires** : `ar_total`, `ap_total`, `ar_overdue_ratio`
- **Granularité source** : journalière
- **Rendu** : courbe de tension simple
- **Règle d’apparition** : au moins 2 points historisés
- **Note de périmètre** : stock hors périmètre tant qu’il n’est pas intégré

#### Formulation produit

> Le bloc Évolution de la card BFR visualise la dynamique du besoin en fonds de roulement net sur la période, afin de rendre lisibles la tension d’exploitation, l’équilibre créances/fournisseurs et la dérive éventuelle des créances échues.

---

### Encours

**Question métier :** Le risque client se concentre-t-il et le retard dérive-t-il ?

#### 1. Métrique principale

**`receivables_overdue`** = montant des créances échues.

C’est la métrique qui exprime le plus directement la **part de risque actif** dans l’encours. Alternative possible plus tard : **`overdue_ratio`** pour une lecture plus relative que volumique.

#### 2. Métriques secondaires

- **`receivables_total`** = encours total
- **`receivables_current`** = encours non échu
- **`overdue_ratio`** = part de l’encours en retard

Permet de raconter : taille de l’exposition, part saine, part qui dérive.

#### 3. Données à historiser (journalier)

- date
- `receivables_total`
- `receivables_current`
- `receivables_overdue`
- `overdue_ratio`
- `invoice_count`
- `overdue_invoice_count`

#### 4. Granularité

**Journalier par défaut** (cohérent avec Trésorerie et BFR, pertinent pour le suivi du recouvrement).

#### 5. Type de rendu visuel

**Courbe de risque.**

- Courbe principale = `receivables_overdue`
- Lecture secondaire possible = `overdue_ratio`
- `receivables_total` en contexte, sans surcharger le graphique

Ne pas intégrer les top créanciers dans ce bloc : cela mélangerait **série temporelle** et **ranking courant**.

#### 6. Ce que le bloc doit faire comprendre

En un coup d’œil :

- Si le retard augmente ou se résorbe
- Si la part échue dérive
- Si le risque client se concentre ou se stabilise
- Si le recouvrement s’améliore

#### 7. États d’affichage

| État | Comportement |
| --- | --- |
| **Données suffisantes** | La courbe s’affiche. |
| **Données partielles** | La courbe s’affiche, avec mention éventuelle de couverture ou de périmètre. |
| **Historique insuffisant** | Pas de courbe, message compact. |

#### Décision recommandée

- **Métrique principale** : `receivables_overdue`
- **Secondaires** : `receivables_total`, `receivables_current`, `overdue_ratio`
- **Granularité source** : journalière
- **Rendu** : courbe de risque simple
- **Règle d’apparition** : au moins 2 points historisés

#### Formulation produit

> Le bloc Évolution de la card Encours visualise la dynamique des créances échues sur la période, afin de rendre immédiatement lisibles la dérive du retard, l’exposition client et l’évolution du risque de recouvrement.

---

## 4. Avis d’expert — Conformité à l’implémentation

*Ce paragraphe confronte la grille de cadrage à l’état actuel du code et des données (dorevia-linky, Vault, plans web46). Il vise à valider les choix de la grille et à pointer les écarts ou chantiers restants.*

### 4.1 Ce qui est aligné

| Élément | Grille | Implémentation | Verdict |
| --- | --- | --- | --- |
| **Composant bloc Évolution** | Bloc obligatoire, libellé « Évolution », états distincts | `InstrumentCardEvolutionBlock` (SPEC_LINKY_BLOC_EVOLUTION_COMMUN), délégation à `CardChartSection`, `sectionTitle="Évolution"`, états `available` \| `partial` \| `empty` \| `coming_soon` \| `error` \| `loading` | Conforme |
| **Présence du bloc sur les 3 cards** | Trésorerie, BFR, Encours ont un bloc Évolution | `TresoreriePositionCard`, `WorkingCapitalCard`, `EncoursCard` intègrent chacune `<InstrumentCardEvolutionBlock … state="empty" />` | Conforme |
| **États d’affichage** | Données suffisantes / partielles / historique insuffisant (plus erreur, chargement) | SPEC §6 : A (disponible), B (partiel), C (vide), D (à venir), E (erreur), F (chargement). Mapping technique : available, partial, empty, coming_soon, error, loading | Aligné |
| **Séparation courant vs évolution** | Tops, listes partenaires = courant ; bloc Évolution = séries d’agrégats | Synthèse (KPIs, détail) alimentée par dashboard-metrics / treasury / ar-by-partner (snapshots) ; bloc Évolution alimenté par séries quand elles existent (EBE uniquement aujourd’hui) | Conforme |
| **EBE (hors grille mais dans le plan)** | — | Route `/api/ebe-evolution`, série dérivée (sales − purchases − payroll), granularité mois, état `available` si série non vide, `partial` si payroll manquant, `error` + onRetry | Cohérent avec PLAN_IMPLEMENTATION_DATA (Vitesse 1) |

La grille et la SPEC/plan partagent la même règle : le bloc existe toujours, l’absence de donnée se traduit par un état vide standardisé, pas par la suppression du bloc.

### 4.2 Écarts et chantiers restants

| Sujet | Grille | Implémentation actuelle | Action recommandée |
| --- | --- | --- | --- |
| **Données Trésorerie / BFR / Encours** | Snapshots journaliers historisés (`cash_validated`, `bfr_net`, `receivables_overdue`, etc.) | Vault n’expose que des **snapshots** (treasury : `position.validated_balance`, `position.erp_balance` ; ar-by-partner / ap-by-partner : totaux pour un `as_of_date`). Aucune série temporelle, aucun job d’historisation | Suivre PLAN_IMPLEMENTATION_DATA_EVOLUTION_VAULT_LINKY : snapshotting prospectif + endpoints série (Phase 3). En attendant, garder `state="empty"` sur les 3 cards (déjà le cas). |
| **Nomenclature des métriques** | `cash_validated`, `cash_erp`, `coverage_ratio` | Code : `validated_balance`, `erp_balance`, `treasury_validated_pct` (ou équivalent couverture) | Documenter le mapping grille ↔ Vault/Linky (ex. dans la spec consolidée) pour éviter toute ambiguïté lors du branchement des séries. |
| **Granularité** | Journalier par défaut ; 30 j → jour, 90 j → jour ou hebdo, 12 mois → hebdo ou mensuel | EBE : **mois** uniquement (`granularity=month`, pas de sélecteur jour/hebdo). Trésorerie/BFR/Encours : pas de série donc pas de granularité | Quand les séries Trésorerie/BFR/Encours existeront : prévoir granularité configurable (jour/hebdo/mois) côté API et UI, selon la période affichée, comme dans la grille. EBE peut rester en mensuel pour la v1. |
| **Rendu par type de card** | Trésorerie = courbe de niveau ; BFR = courbe de tension ; Encours = courbe de risque | EBE : `DualSeriesChart` (bar/line, une série). Trésorerie/BFR/Encours : pas de graphique (empty) | Lors du branchement des séries : réutiliser ou étendre les composants de graphique pour respecter « courbe de niveau » vs « tension » vs « risque » (légendes, couleurs, éventuellement second axe pour ERP ou AR/AP). |
| **Formulation des messages vides** | « Historique insuffisant pour afficher une évolution sur la période. » | `CardChartSection` / InstrumentCardEvolutionBlock utilisent des messages vides configurables (`emptyMessage`) ; message par défaut du type « Aucune donnée d’évolution… » | Harmoniser les libellés des états vides avec la grille (et la SPEC §6.3) dans les cards Trésorerie, BFR, Encours (ex. `emptyMessage="Historique insuffisant pour afficher une évolution sur la période."`). |

### 4.3 Synthèse

- **Structure et comportement UI** : l’implémentation est conforme à la grille et à la SPEC (bloc obligatoire, états, libellé, pas de courbe fictive).
- **Données** : la grille suppose une **historisation** (snapshots journaliers) pour Trésorerie, BFR et Encours. Celle-ci n’est pas encore en place côté Vault/orchestration ; le plan data (Vitesse 2 + 3) décrit la cible. Aucun changement de cadrage nécessaire : la grille reste la bonne cible produit.
- **EBE** : déjà en état `available` avec une série dérivée (mois) ; cohérent avec le plan « Vitesse 1 ». La grille ne détaille pas EBE ; c’est volontaire (focus sur le triptyque Trésorerie / BFR / Encours). Si besoin, on peut ajouter une section EBE courte dans une future spec consolidée.
- **Prochaines étapes utiles** : (1) documenter le mapping grille ↔ champs Vault/Linky ; (2) lors de la Phase 3 data, exposer des séries alignées sur les métriques principales/secondaires de la grille et la granularité journalière (puis adaptation selon période) ; (3) uniformiser les messages d’état vide pour les 3 cards.

---

## 5. Conclusion et suite

Le cadrage forme un triptyque cohérent :

- **Trésorerie** = courbe de niveau
- **BFR** = courbe de tension
- **Encours** = courbe de risque

**Suite logique :** la **spec consolidée** des 3 cards Évolution est rédigée (v1.1.1, verrouillage final) : [SPEC_CONSOLIDEE_BLOC_EVOLUTION_3_CARDS_v1.0.md](./SPEC_CONSOLIDEE_BLOC_EVOLUTION_3_CARDS_v1.0.md).

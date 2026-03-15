# SPEC consolidée — Bloc Évolution des 3 cards (Trésorerie, BFR, Encours)

**Document :** SPEC_CONSOLIDEE_BLOC_EVOLUTION_3_CARDS_v1.1.1  
**Date :** 13 mars 2026  
**Produit :** Dorevia Linky  
**Statut :** Spécification de référence (v1.1.1 — verrouillage final)  
**Références :**
- [Grille_Cadrage_Bloc_Evolution.md](./Grille_Cadrage_Bloc_Evolution.md) (source de vérité produit)
- [SPEC_LINKY_BLOC_EVOLUTION_COMMUN_v1.0.md](../web46/SPEC_LINKY_BLOC_EVOLUTION_COMMUN_v1.0.md) (structure UI, états)
- [PLAN_IMPLEMENTATION_DATA_EVOLUTION_VAULT_LINKY_v1.0.md](../web46/PLAN_IMPLEMENTATION_DATA_EVOLUTION_VAULT_LINKY_v1.0.md) (données, historisation)

---

## Sommaire

1. [Objet et périmètre](#1-objet-et-périmètre)
2. [Règles communes aux 3 cards](#2-règles-communes-aux-3-cards)
3. [Périmètre / scope des séries](#3-périmètre--scope-des-séries)
4. [Mapping des métriques (grille ↔ Vault / Linky)](#4-mapping-des-métriques-grille--vault--linky)
5. [Formules normatives](#5-formules-normatives)
6. [Card Trésorerie](#6-card-trésorerie)
7. [Card BFR](#7-card-bfr)
8. [Card Encours](#8-card-encours)
9. [États d’affichage et messages](#9-états-daffichage-et-messages)
10. [Definition of Done et recette](#10-definition-of-done-et-recette)
11. [Contrat API cible (exemple de payload)](#11-contrat-api-cible-exemple-de-payload)

---

## 1. Objet et périmètre

### 1.1 Objet

Cette spec consolide les exigences produit et techniques du **bloc Évolution** pour les trois cards **Trésorerie**, **BFR** et **Encours** de Linky. Elle est la référence unique pour :

- les **métriques** à historiser et à afficher ;
- la **granularité** et le **rendu visuel** attendus ;
- les **états** du bloc et les **messages** associés ;
- le **mapping** entre la nomenclature produit (grille) et les champs Vault / API Linky.

Elle ne remplace pas la SPEC_LINKY_BLOC_EVOLUTION_COMMUN (structure UI, états normalisés A à F, composant), qu’elle complète pour les 3 cards concernées.

### 1.2 Périmètre

| Card | Composant Linky | Bloc Évolution |
| --- | --- | --- |
| **Trésorerie** | `TresoreriePositionCard` | Position trésorerie validée / solde ERP / couverture |
| **BFR** | `WorkingCapitalCard` | BFR net, AR, AP, créances échues |
| **Encours** | `EncoursCard` | Créances échues, encours total, ratio échu |

**Hors périmètre de cette spec :** la card EBE (bloc Évolution déjà spécifié et implémenté via `/api/ebe-evolution` et plan data Vitesse 1).

### 1.3 Question métier commune

Le bloc Évolution doit toujours répondre à :

> **Comment l’indicateur se comporte-t-il dans le temps ?**

Avec une lecture spécifique par card :

- **Trésorerie** : trajectoire du cash (niveau, tendance, écart ERP)
- **BFR** : tension d’exploitation (déséquilibre, amélioration, échu)
- **Encours** : dérive du risque client (retard, concentration, recouvrement)

---

## 2. Règles communes aux 3 cards

### 2.0 Source exclusive des données : Vault

**Règle d’architecture non négociable :**  
**Toutes les données métier affichées par Linky (y compris les 3 cards Trésorerie, BFR, Encours et leurs blocs Évolution) proviennent exclusivement du Vault.**

- Les **montants**, **soldes**, **séries temporelles** et **agrégats** affichés sur le cockpit sont soit (1) **lues directement depuis le Vault** (endpoints `/ui/aggregations/*`, `/ui/system/*`), soit (2) **dérivées de données Vault** (ex. séries EBE = sales − purchases − payroll), soit (3) **issues de tables de snapshots alimentées par des jobs qui eux-mêmes s’appuient sur le Vault** (historisation Phase 3). Aucune autre source (base de données Linky propre, autre microservice métier, fichier externe) ne doit fournir de données financières ou de pilotage affichées sur les cards.
- **Exceptions documentées** (hors données métier cockpit) : (a) **DVIG** peut être utilisé comme indicateur de **santé / complétude** (vault-health) lorsque le Vault ne l’expose pas ; ce n’est pas une source de montants ou de séries. (b) **DLP** (énergie) : données hors périmètre cockpit financier ; à considérer comme source séparée si le bloc DLP est affiché.
- **Implication pour les séries Évolution** : les endpoints de série (trésorerie, encours, BFR) doivent lire soit le Vault en direct, soit des tables de snapshots dont les données ont été produites par des jobs appelant le Vault. Aucune source de vérité métier en dehors du Vault.

### 2.1 Architecture des données

- Le bloc Évolution s’appuie sur des **snapshots journaliers historisés** d’agrégats métier (pas sur des tops ni des listes détaillées).
- Les **tops**, répartitions détaillées et listes partenaires restent du **courant** (synthèse / autres blocs).
- Le bloc Évolution ne consomme que des **séries d’agrégats** (une métrique principale, 2 à 3 secondaires au maximum).
- **Même mécanique technique** (historisation + endpoint série + graphique), **narration différente** selon la card (niveau / tension / risque).

**Définition normative — Snapshot :**  
Un **snapshot** est l’enregistrement d’un agrégat métier calculé pour un périmètre donné à une **date de référence** (`as_of_date`). Il constitue un **point de série temporelle** pour le bloc Évolution. On distingue : (1) **snapshot historisé** = valeur enregistrée en base à la date de référence (source des séries) ; (2) **calcul à date** = valeur calculée à la volée pour « aujourd’hui » (état courant, pas une série) ; (3) **série native** = série déjà exposée par une source (ex. Vault `series` sur sales/purchases). Pour Trésorerie, BFR et Encours, les séries du bloc Évolution proviennent de **snapshots historisés**, pas d’un recalcul sauvage à l’affichage.

### 2.2 Règle produit

- **1 métrique principale** pour la courbe.
- **2 à 3 métriques secondaires** au maximum.
- Rendu **lisible même si certaines secondaires sont absentes**.

### 2.3 Granularité

- **Par défaut : journalière** (source d’historisation).
- Selon la **période affichée** :
  - **30 jours** → affichage journalier
  - **90 jours** → journalier ou hebdo lissé
  - **12 mois / exercice** → hebdo ou mensuel agrégé si besoin

### 2.4 Règles d’agrégation (jour / semaine / mois)

Lorsque la série source est journalière et que l’affichage demande une granularité **hebdo** ou **mensuelle**, l’agrégation suit les règles suivantes (éviter toute ambiguïté front / data) :

| Type de métrique | Règle d’agrégation (hebdo / mois) | Justification |
| --- | --- | --- |
| **Niveau / solde** (Trésorerie : cash_validated, cash_erp) | **Dernier point** de la période (last value of period) | Un solde est un stock ; on lit la valeur en fin de période. |
| **Ratio** (coverage_ratio, ar_overdue_ratio, overdue_ratio) | **Valeur du dernier jour** de la période (pas de moyenne de ratios) | Cohérent avec une lecture « état en fin de période » ; une moyenne de ratios serait biaisée. |
| **Cumul / flux** (hors scope des 3 cards ici) | Somme sur la période | Pour mémoire : EBE, flux = somme. |
| **BFR** (bfr_net, ar_total, ap_total) | **Dernier point** de la période | Stocks ; lecture en fin de période. |
| **Encours** (receivables_overdue, receivables_total, etc.) | **Dernier point** de la période | Stocks ; idem. |

**Convention de date :** pour une période donnée (ex. semaine du 1er au 7 mars), le « dernier point » est le snapshot dont la `date` ou `as_of_date` correspond au dernier jour de la période. **La règle exacte** (dernier jour **calendaire** de la période vs dernier jour **ouvré**) est déterminée par l’endpoint et **doit être explicitée dans la réponse ou la documentation de l’API** (ex. champ `date_convention` ou contrat d’endpoint) pour éviter tout flottement entre back et front.

### 2.5 Règle d’apparition du graphique

- Le graphique (courbe) s’affiche **si et seulement si** au moins **2 points** historisés sont disponibles sur la période.
- En deçà : affichage de l’état **Historique insuffisant** (message standardisé, pas de courbe).

### 2.6 Composant UI

- Utilisation obligatoire de **`InstrumentCardEvolutionBlock`** (SPEC_LINKY_BLOC_EVOLUTION_COMMUN).
- Libellé du bloc : **« Évolution »** (inchangé).
- États techniques : `available` | `partial` | `empty` | `coming_soon` | `error` | `loading`.

---

## 3. Périmètre / scope des séries

Toute série exposée pour le bloc Évolution doit être **scopée** de façon explicite. Les paramètres suivants sont obligatoires ou recommandés pour éviter les ambiguïtés (multi-tenant, multi-société, devise, fuseau).

| Paramètre | Obligatoire | Description |
| --- | --- | --- |
| **tenant** | Oui | Identifiant du tenant (périmètre organisationnel). |
| **company_id** | Recommandé | Société / filiale ; si absent, agrégation au niveau tenant selon règle métier. |
| **currency** | Oui dans la réponse | Devise des montants (ex. `EUR`). |
| **timezone** | Recommandé | Fuseau pour l’interprétation des dates (ex. `Europe/Paris`) ; les dates de snapshot sont en date métier ou UTC selon contrat API. |
| **as_of_date** / **date** | Oui par point | Date de référence du snapshot (YYYY-MM-DD). |

**Règles :**  
- Une série = une liste de points `{ date, value, secondary? }` pour **un** couple (tenant, company_id).  
- En **multi-devise**, les séries sont exposées dans une devise cible (ex. devise société ou tenant) ; la règle de conversion doit être documentée côté endpoint. **En v1 : une série = une devise cible unique ; pas de mélange de devises dans une même réponse.**  
- Les dates sont en **date métier** (jour ouvré ou jour calendaire selon la règle du job d’historisation) ; à préciser dans le contrat de l’API série.

---

## 4. Mapping des métriques (grille ↔ Vault / Linky)

Pour éviter toute ambiguïté lors du branchement des séries (Phase 3 data), le mapping suivant est figé. Les **formules de calcul** (coverage_ratio, bfr_net, overdue_ratio, etc.) sont définies de façon normative en [§5](#5-formules-normatives).

### 4.1 Trésorerie

| Grille (nomenclature produit) | Vault / API Linky | Commentaire |
| --- | --- | --- |
| `cash_validated` | `position.validated_balance` (GET /ui/aggregations/treasury) | Trésorerie validée Vault |
| `cash_erp` | `position.erp_balance` | Solde comptable ERP |
| `coverage_ratio` | Ratio 0–1 : `treasury_validated_pct / 100` (Linky) ou `reconciled / (reconciled + unreconciled)` (Vault). Formule normative : [§5.1](#51-trésorerie). | Couverture probante |
| `validation_status` | Dérivé de `process` / `reconciliation_metrics` | Statut de validation (pour mention partielle) |

### 4.2 BFR

| Grille | Vault / API Linky | Commentaire |
| --- | --- | --- |
| `bfr_net` | AR total − AP total (GET ar-by-partner + ap-by-partner, totaux pour `as_of_date`) | À historiser par date ; pas de série native Vault aujourd’hui |
| `ar_total` | Somme `open_amount` (ar-by-partner) | Créances clients |
| `ap_total` | Somme `open_amount` (ap-by-partner) | Dettes fournisseurs |
| `ar_overdue_ratio` | Part des créances échues (overdue / total) dérivée de ar-by-partner | Ratio ou montant échu |
| `stock_total` | Hors périmètre tant que non intégré | Optionnel, à prévoir si extension |

### 4.3 Encours

| Grille | Vault / API Linky | Commentaire |
| --- | --- | --- |
| `receivables_overdue` | Champ équivalent ar-by-partner (overdue_amount / totaux) | Montant créances échues |
| `overdue_ratio` | Dérivé : overdue / total open | Part de l’encours en retard |
| `receivables_total` | Somme open_amount (ar-by-partner) | Encours total |
| `receivables_current` | Total − overdue | Encours non échu |
| `overdue_invoice_count` | Nombre de factures échues (si exposé par Vault) | Optionnel pour contexte |

---

## 5. Formules normatives

Les formules suivantes sont **figées** pour la v1. Toute divergence (ex. champ Vault manquant) doit être documentée et donner lieu à un état **partial** ou à une convention de fallback écrite.

### 5.1 Trésorerie

| Métrique | Formule normative | Source Vault / Linky |
| --- | --- | --- |
| **coverage_ratio** | Ratio de volume validé (0–1). **Formule v1 :** `coverage_ratio = reconciled / (reconciled + unreconciled)` si `(reconciled + unreconciled) > 0`, sinon `0`. Champs : `process.reconciled_volume`, `process.unreconciled_volume` (ou `reconciled_balance` / `unreconciled_balance`). | Si `reconciliation_metrics` est disponible avec `remaining_ratio` (0–1) : `coverage_ratio = 1 - remaining_ratio`. Linky expose `treasury_validated_pct` (0–100) = `100 - treasuryRemainingPct` → `coverage_ratio = treasury_validated_pct / 100`. |
| **validation_status** | État de validation pour mention partielle. **Valeurs normatives :** `complete` \| `partial` \| `unavailable`. **Règle :** dérivé de la présence et cohérence de `process.reliability_volume` (ou `reconciliation_rate`), `reconciliation_metrics`, et éventuellement `bank_reconciliation_health`. Si couverture &lt; seuil métier (ex. 95 %) ou données incomplètes → `partial`. | À documenter dans l’endpoint série (ex. champ `validation_status` par point ou global). |

### 5.2 BFR

| Métrique | Formule normative |
| --- | --- |
| **bfr_net** | `bfr_net = ar_total - ap_total`. Avec `ar_total` = somme des créances clients (AR), `ap_total` = somme des dettes fournisseurs (AP) pour la même `as_of_date`. |
| **ar_total** | Somme des `open_amount` de la réponse Vault `GET /ui/aggregations/ar-by-partner` (champ `totals.open_amount`). |
| **ap_total** | Somme des `open_amount` de la réponse Vault `GET /ui/aggregations/ap-by-partner` (champ `totals.open_amount`). |
| **ar_overdue_ratio** | `ar_overdue_ratio = totals.overdue_amount / totals.open_amount` si `totals.open_amount > 0`, sinon `0`. Source : ar-by-partner `totals`. |

### 5.3 Encours

| Métrique | Formule normative |
| --- | --- |
| **receivables_overdue** | Égal à `totals.overdue_amount` (ar-by-partner). |
| **receivables_total** | Égal à `totals.open_amount` (ar-by-partner). |
| **receivables_current** | `receivables_total - receivables_overdue`. |
| **overdue_ratio** | `overdue_ratio = receivables_overdue / receivables_total` si `receivables_total > 0`, sinon `0`. |

---

## 6. Card Trésorerie

### 6.1 Formulation produit

> Le bloc Évolution de la card Trésorerie visualise la trajectoire temporelle de la trésorerie validée, avec mise en regard du solde ERP et du niveau de couverture probante.

### 6.2 Exigences

| Réf | Exigence | Critère d’acceptation |
| --- | --- | --- |
| T1 | Métrique principale | Courbe principale = `cash_validated` (trésorerie validée Vault). |
| T2 | Métriques secondaires | `cash_erp` (solde ERP), `coverage_ratio` (couverture probante) ; affichage optionnel si absent. |
| T3 | Données à historiser (journalier) | date, cash_validated, cash_erp, coverage_ratio, validation_status. |
| T4 | Granularité | Journalière en source ; affichage selon période (30 j → jour, 90 j → jour/hebdo, 12 mois → hebdo/mois). |
| T5 | Rendu visuel | **Courbe de niveau** : ligne principale = cash_validated ; ligne secondaire discrète = cash_erp si disponible ; indicateurs couverture/validation en complément, pas de 3ᵉ courbe. |
| T6 | Lecture visée | En un coup d’œil : trésorerie monte/baisse, stable/irrégulière, proche/écart ERP, fiabilité forte/partielle. |

### 6.3 Décision figée

- **Métrique principale** : `cash_validated`
- **Secondaires** : `cash_erp`, `coverage_ratio`
- **Granularité source** : journalière
- **Rendu** : courbe de niveau simple
- **Règle d’apparition** : au moins 2 points historisés

---

## 7. Card BFR

### 7.1 Formulation produit

> Le bloc Évolution de la card BFR visualise la dynamique du besoin en fonds de roulement net sur la période, afin de rendre lisibles la tension d’exploitation, l’équilibre créances/fournisseurs et la dérive éventuelle des créances échues.

### 7.2 Exigences

| Réf | Exigence | Critère d’acceptation |
| --- | --- | --- |
| B1 | Métrique principale | Courbe principale = `bfr_net` (BFR net = créances clients − dettes fournisseurs). **Stock hors périmètre** tant qu’il n’est pas intégré ; mention explicite si périmètre incomplet. |
| B2 | Métriques secondaires | `ar_total`, `ap_total`, `ar_overdue_ratio` ; lecture secondaire possible AR vs AP. |
| B3 | Données à historiser (journalier) | date, bfr_net, ar_total, ap_total, ar_overdue_ratio ; optionnel : stock_total si périmètre étendu. |
| B4 | Granularité | Journalière (cohérent avec Trésorerie). |
| B5 | Rendu visuel | **Courbe de tension** : courbe principale = bfr_net ; éventuellement lecture secondaire ar_total vs ap_total ; pas plus de 2 ou 3 signaux visuels. |
| B6 | Lecture visée | En un coup d’œil : tension d’exploitation augmente/diminue, BFR se dégrade/s’améliore, hausse surtout créances, échu client pèse davantage. |

### 7.3 Décision figée

- **Métrique principale** : `bfr_net`
- **Secondaires** : `ar_total`, `ap_total`, `ar_overdue_ratio`
- **Granularité source** : journalière
- **Rendu** : courbe de tension simple
- **Règle d’apparition** : au moins 2 points historisés
- **Note de périmètre** : stock hors périmètre tant qu’il n’est pas intégré (affichage en état partiel si besoin)

---

## 8. Card Encours

### 8.1 Formulation produit

> Le bloc Évolution de la card Encours visualise la dynamique des créances échues sur la période, afin de rendre immédiatement lisibles la dérive du retard, l’exposition client et l’évolution du risque de recouvrement.

### 8.2 Exigences

| Réf | Exigence | Critère d’acceptation |
| --- | --- | --- |
| E1 | Métrique principale | Courbe principale = `receivables_overdue` (montant créances échues). Alternative possible plus tard : `overdue_ratio` (lecture relative). |
| E2 | Métriques secondaires | `receivables_total`, `receivables_current`, `overdue_ratio` ; receivables_total en contexte sans surcharger le graphique. |
| E3 | Données à historiser (journalier) | date, receivables_total, receivables_current, receivables_overdue, overdue_ratio, invoice_count, overdue_invoice_count. |
| E4 | Granularité | Journalière (cohérent avec Trésorerie et BFR). |
| E5 | Rendu visuel | **Courbe de risque** : courbe principale = receivables_overdue ; lecture secondaire possible = overdue_ratio. **Ne pas intégrer les top créanciers** dans ce bloc (série temporelle ≠ ranking courant). |
| E6 | Lecture visée | En un coup d’œil : retard augmente/se résorbe, part échue dérive, risque client se concentre/se stabilise, recouvrement s’améliore. |

**Note v2 (option future) :** En v1 la métrique principale est le **montant échu** (`receivables_overdue`). Une évolution ultérieure peut proposer une **bascule ou option d’affichage** vers le **ratio échu** (`overdue_ratio`) pour une lecture plus relative (signal de risque indépendant du volume). Le débat n’est pas clos pour toujours ; la spec v1 fige le montant comme référence.

### 8.3 Décision figée

- **Métrique principale** : `receivables_overdue`
- **Secondaires** : `receivables_total`, `receivables_current`, `overdue_ratio`
- **Granularité source** : journalière
- **Rendu** : courbe de risque simple
- **Règle d’apparition** : au moins 2 points historisés

---

## 9. États d’affichage et messages

### 9.1 Correspondance états produit ↔ technique

| État produit (grille) | État technique (composant) | SPEC commun |
| --- | --- | --- |
| Données suffisantes | `available` | A — Disponible |
| Données partielles | `partial` | B — Disponible mais partiel |
| Historique insuffisant | `empty` | C — Vide standardisé |
| À venir / non branché | `coming_soon` | D — À venir |
| Erreur de chargement | `error` | E — Erreur |
| Chargement en cours | `loading` | F — Chargement |

### 9.2 Messages standardisés

| État | Message (libellé figé) |
| --- | --- |
| **Historique insuffisant** (empty) | *Historique insuffisant pour afficher une évolution sur la période.* |
| **Données partielles** (partial) | La courbe s’affiche ; mention contextuelle selon la card (ex. « Couverture partielle », « Stock non intégré », « Périmètre partiel »). |
| **Erreur** (error) | *Impossible de charger l’évolution pour le moment.* + action « Réessayer » dans le body du bloc uniquement. |

### 9.3 Comportement par état

- **available** : affichage de la courbe (niveau / tension / risque selon la card), avec légende si plusieurs séries.
- **partial** : courbe affichée + badge ou phrase courte (couverture partielle, périmètre incomplet).
- **empty** : pas de courbe ; message « Historique insuffisant… » (ou équivalent harmonisé).
- **error** : message d’erreur + bouton Réessayer (onRetry).
- **loading** : skeleton ou placeholder de graphique.

### 9.4 Critères du state `partial` par card

Le state **partial** doit être déterminé de façon **déterministe** côté data ou front pour éviter toute divergence. **Périmètre d’évaluation :** le `partial` est évalué sur les **points effectivement affichés** à la granularité demandée (après agrégation éventuelle), et non sur l’ensemble des snapshots bruts. Ainsi, une série avec 90 points bruts dont 1 secondaire manquant ne passe en `partial` que si ce point manquant impacte au moins un des points affichés (ex. après agrégation hebdo/mensuelle). Règles figées :

| Card | Condition(s) pour `partial` | Sinon |
| --- | --- | --- |
| **Trésorerie** | `cash_validated` présent et exploitable **et** (couverture &lt; seuil **ou** `cash_erp` absent) sur **au moins un des points affichés**. | Si couverture suffisante et `cash_erp` présent sur les points affichés → `available`. Si &lt; 2 points ou série vide → `empty`. |
| **BFR** | `bfr_net` calculable **et** (stock hors périmètre **ou** une seconde série manquante) sur **au moins un des points affichés**. | Si tout présent et périmètre complet → `available`. Si &lt; 2 points ou série vide → `empty`. |
| **Encours** | Série principale présente **et** (ratio/comptage incomplet **ou** périmètre partiel) sur **au moins un des points affichés**. | Si série complète → `available`. Si &lt; 2 points ou série vide → `empty`. |

**Seuil métier Trésorerie :** constante nommée **`COVERAGE_PARTIAL_THRESHOLD`** (valeur recommandée **0,95** soit 95 %). Si la couverture est &lt; seuil sur au moins un point affiché → état `partial` avec mention « Couverture partielle ». La valeur est configurable ; le nom de la constante permet d’aligner implémentation et config.

---

## 10. Definition of Done et recette

### 10.1 DoD par card (quand les séries sont branchées)

Pour chaque card (Trésorerie, BFR, Encours) :

- [ ] Endpoint (ou source) exposant une **série** alignée sur les métriques principales et secondaires de cette spec (voir §3 et §4–6).
- [ ] **Granularité** : au minimum points journaliers (ou agrégation jour/hebdo/mois selon période affichée).
- [ ] **Composant** : `InstrumentCardEvolutionBlock` utilisé avec le bon `storageKey` et le `state` dérivé des données (available / partial / empty / error).
- [ ] **Rendu** : type de courbe conforme (niveau / tension / risque) avec métrique principale en courbe principale, secondaires optionnelles.
- [ ] **Messages** : état empty = « Historique insuffisant pour afficher une évolution sur la période. » (ou libellé harmonisé validé).
- [ ] **Règle d’apparition** : courbe affichée seulement si ≥ 2 points sur la période.

### 10.2 Grille de recette consolidée

| Critère | Trésorerie | BFR | Encours |
| --- | --- | --- | --- |
| Bloc présent, libellé « Évolution » | ✓ | ✓ | ✓ |
| Métrique principale = cash_validated / bfr_net / receivables_overdue | ✓ | ✓ | ✓ |
| Courbe de niveau / tension / risque | ✓ | ✓ | ✓ |
| Granularité journalière (source) | ✓ | ✓ | ✓ |
| États available / partial / empty / error gérés | ✓ | ✓ | ✓ |
| Message vide standardisé | ✓ | ✓ | ✓ |
| Pas de top créanciers dans le bloc (Encours) | — | — | ✓ |
| Mention périmètre (ex. stock non intégré) si partiel (BFR) | — | ✓ | — |

### 10.3 Dépendance données

La mise en conformité **complète** des 3 cards (courbes affichées) dépend de la **Phase 3** du plan data (PLAN_IMPLEMENTATION_DATA_EVOLUTION_VAULT_LINKY) : snapshotting prospectif et/ou backfill, puis endpoints série. Tant que ces séries n’existent pas, les 3 blocs restent en état **empty** avec le message standardisé ; la structure et les règles de cette spec s’appliquent déjà.

---

## 11. Contrat API cible (exemple de payload)

Exemple **illustratif** de structure de réponse pour un endpoint de série (ex. `GET /api/treasury-evolution` ou équivalent Vault). Ce contrat permet d’aligner front et backend sur le format attendu.

**Query params attendus (alignés sur le scope §3) :** `tenant`, `company_id` (optionnel), `date_debut`, `date_fin`, `granularity` (day | week | month).

**Exemple de payload — Trésorerie :**

```json
{
  "metric": "cash_validated",
  "granularity": "day",
  "period": "30d",
  "currency": "EUR",
  "scope": {
    "tenant": "core",
    "company_id": "1"
  },
  "points": [
    {
      "date": "2026-03-01",
      "value": 118179.42,
      "secondary": {
        "cash_erp": 120045.10,
        "coverage_ratio": 0.82
      },
      "state": "available"
    },
    {
      "date": "2026-03-02",
      "value": 119200.00,
      "secondary": {
        "cash_erp": 120100.00,
        "coverage_ratio": 0.85
      },
      "state": "available"
    }
  ],
  "partial_reason": null
}
```

- **points** : un point par date (ou par période si granularity week/month), avec **value** = métrique principale.
- **secondary** : métriques secondaires optionnelles ; absence possible → état partial selon §9.4.
- **state** par point (optionnel) : si absent, le state global de la réponse détermine l’état du bloc.
- **partial_reason** : si présent (ex. `"coverage_below_threshold"`, `"stock_out_of_scope"`), le front affiche l’état **partial** avec la mention adaptée.

Variantes pour **BFR** et **Encours** : même structure, avec `metric` = `bfr_net` ou `receivables_overdue`, et `secondary` contenant les champs §5 (ar_total, ap_total, ar_overdue_ratio ; ou receivables_total, overdue_ratio, etc.).

---

*Document SPEC consolidée — Bloc Évolution 3 cards (Trésorerie, BFR, Encours) — v1.1.1 — 13 mars 2026*

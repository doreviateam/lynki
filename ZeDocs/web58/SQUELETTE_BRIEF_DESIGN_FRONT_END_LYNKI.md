
# BRIEF DESIGN FRONT-END LYNKI — DOCUMENT MAÎTRE (INTERNE)

Ce fichier est la **référence complète** : fond produit, fiches détaillées des 12 tuiles et de la Synthèse, **et** références techniques (fichiers, composants, APIs).

**Version recommandée pour envoi à une designeuse** (même périmètre fonctionnel, allégée, sans chemins de code) : [`BRIEF_DESIGN_LYNKI_MISSION_DESIGNER.md`](./BRIEF_DESIGN_LYNKI_MISSION_DESIGNER.md).

**Design system produit** : canon détaillé [`DESIGN_SYSTEM_PRODUIT_LYNKI_V0.md`](./DESIGN_SYSTEM_PRODUIT_LYNKI_V0.md) · annexe opérationnelle designeuse [`PRODUCT_DESIGN_SYSTEM_PRINCIPLES_LYNKI_V1.md`](./PRODUCT_DESIGN_SYSTEM_PRINCIPLES_LYNKI_V1.md).

---

# SQUELETTE — BRIEF DESIGN FRONT-END LYNKI

## 1. Contexte

Lynki est une application de **pilotage financier**, de **contrôle de gestion** et de **lecture fiable de la situation de l’entreprise**.

Le produit ne doit pas être conçu comme un simple dashboard de KPI, mais comme un **cockpit de lecture décisionnelle**, articulé autour de deux grands régimes d’usage :

* **Pilotage** : voir vite, arbitrer, surveiller, décider ;
* **Synthèse comptable** : comprendre, expliquer, structurer, restituer.

L’objectif de la mission design est de produire une **traduction visuelle cohérente, distincte et publiquement montrable** de Lynki, sans s’appuyer sur nos explorations visuelles précédentes, afin de préserver une lecture fraîche du produit.

---

## 2. Personas d’usage

Nous avons identifié naturellement **3 personas principaux**, qui structurent l’expérience Lynki.

### 2.1 Max — CEO / Dirigeant

**Usage principal :** lecture rapide sur mobile
**Finalité :** décision managériale et arbitrage immédiat
**Attente clé :** voir en quelques secondes l’état global, les tensions, les signaux faibles et les priorités
**Mode de lecture :** synthétique, visuel, orienté action

### 2.2 Véréna — RAF

**Usage principal :** lecture rapide sur écran de travail
**Finalité :** engagement opérationnel et pilotage financier quotidien
**Attente clé :** disposer d’une lecture fiable et structurée pour suivre la trésorerie, les encours, les échéances, les écarts et les points de vigilance
**Mode de lecture :** rapide mais plus dense, orienté contrôle et engagement

### 2.3 Esther — CDG / Contrôle de gestion

**Usage principal :** lecture de synthèse comptable et production de rapports
**Finalité :** analyse, explication, restitution et formalisation
**Attente clé :** accéder à une lecture consolidée, structurée, présentable et justifiable de la situation financière
**Mode de lecture :** posé, analytique, orienté synthèse et reporting

### 2.4 Traduction produit

Cela implique trois niveaux d’expression complémentaires de Lynki :

* **Max doit pouvoir voir vite**
* **Véréna doit pouvoir piloter**
* **Esther doit pouvoir expliquer**

---

## 3. Principes structurants du produit

### 3.1 Deux régimes de lecture

#### A. Pilotage

La vue **Pilotage** répond à la question :

**“Que dois-je voir maintenant pour surveiller, arbitrer ou décider ?”**

C’est une vue :

* plus dynamique ;
* plus orientée signal ;
* plus card-centric ;
* plus immédiate ;
* plus adaptée à Max et Véréna.

#### B. Synthèse comptable

La vue **Synthèse comptable** répond à la question :

**“Comment la situation financière se lit-elle de manière structurée, intelligible et restituable ?”**

C’est une vue :

* plus posée ;
* plus analytique ;
* plus hiérarchisée ;
* plus adaptée à Esther et Véréna.

### 3.2 Différence essentielle

* **Pilotage aide à agir**
* **Synthèse comptable aide à comprendre et restituer**

---

## 4. Principes UX et visuels attendus

Le design Lynki doit exprimer :

* clarté ;
* fiabilité ;
* maîtrise ;
* sobriété premium ;
* lisibilité forte ;
* hiérarchie nette ;
* sérieux financier ;
* gouvernance de la donnée.

Le design doit éviter :

* le look ERP ancien ;
* le dashboard marketing générique ;
* la surcharge décorative ;
* l’uniformité de cards sans logique métier ;
* une esthétique trop gadget ou trop froide.

---

## 5. Principes transverses de conception

### 5.1 Multi-niveaux de lecture

Chaque vue doit permettre :

1. une lecture immédiate ;
2. une lecture métier ;
3. un accès au détail analytique.

### 5.2 Logique device / persona

* **Max** : priorité mobile-first
* **Véréna** : priorité desktop de pilotage
* **Esther** : priorité desktop analytique / synthèse

### 5.3 Fiabilité de la donnée

Le design doit intégrer des signaux liés à :

* fraîcheur de la donnée ;
* complétude ;
* confirmation bancaire ;
* couverture des sources ;
* qualité / confiance ;
* anomalies ;
* données partielles ou indisponibles.

---

# CHAPITRE A — PÉRIMÈTRE DE LA PARTIE PILOTAGE

## 6. Liste des 12 tuiles Pilotage (périmètre réel de l’application)

Les **12 tuiles** du pilotage sont **uniquement** celles de `GRID_ITEMS` dans `IconGrid.tsx`, dans l’ordre d’affichage. Ce chapitre ne décrit pas d’autres « cards » : toute évolution passe par la modification de cette grille et du type `CardId`.

**Références** : `units/dorevia-linky/components/IconGrid.tsx` ; `app/types/linky-tiles.ts` (priorités A/B/C ; tuiles maîtresses : `treasury`, `business`, `cash`) ; tooltips : `app/lib/tile-help.ts`. Navigation Pilotage / Synthèse : `?view=pilotage|synthese` (`app/page.tsx`, `DashboardWithFilters`).

### Hors des 12 tuiles (même écran pilotage)

Ces blocs **ne sont pas** des `CardId` : `ReportHeader` (société, période, vue agrégée, intégrité / scellés, bascule Pilotage ↔ Synthèse, périodes comptables via `useAccountingPeriods`), `DivaFlashBlock`, `DecisionsBlock`, `SyncInProgress` / bandeaux, `LinkyFooter`.

Pour chaque tuile **6.1 à 6.12**, utiliser le template ci-dessous. **Implémentation** : composant de carte détaillée indiqué en fin de fiche.

---

## Template de description d’une card Pilotage

### Nom de la card

[Nom]

### Objectif métier

[À quoi sert cette card dans le pilotage]

### Question à laquelle elle répond

[Question simple et directe]

### Persona principal

[Max / Véréna / Esther]

### Niveau de lecture prioritaire

[lecture instantanée / lecture métier / lecture détaillée]

### KPI principal

[Indicateur dominant]

### Indicateurs secondaires

[Variations, segmentation, état, sous-indicateurs]

### Horizon temporel

[instantané / semaine / mois / glissant / projection]

### Niveau de criticité

[faible / modéré / élevé / critique]

### Action attendue

[arbitrer / surveiller / relancer / investiguer / ouvrir le détail]

### Type de représentation suggéré

[chiffre dominant / sparkline / jauge / barres / timeline / aging / mini-table]

### Données et fiabilité

[source, fraîcheur, confirmation, état de complétude]

### États à prévoir

* normal
* alerte
* critique
* donnée partielle
* donnée indisponible
* donnée à confirmer

---

## 6.1 — Tuile `treasury` · libellé produit « Trésorerie » (classe A, tuile maîtresse)

### Nom de la card

Trésorerie (exactement comme dans `IconGrid` / `tile-help.ts`)

### Objectif métier

Afficher la **trésorerie disponible à date** (position actuelle, **pas** la période sélectionnée — cf. `tile-help.ts`) et les signaux de cohérence / rapprochement associés.

### Question à laquelle elle répond

« Quelle est ma trésorerie **validée** aujourd’hui, et comment se compare-t-elle au solde ERP ? »

### Persona principal

Max, Véréna

### Niveau de lecture prioritaire

Lecture instantanée (montant) puis lecture métier (écart ERP / exposition non rapprochée).

### KPI principal

Solde **validated_balance** (et optionnellement `erp_balance` pour l’écart).

### Indicateurs secondaires

Taux de rapprochement, exposition non validée, drapeaux `large_delta` / `sign_mismatch` / `structural_delta`, évolution temporelle si série de snapshots disponible.

### Horizon temporel

Instantané (+ bloc « Évolution » si ≥ 2 points de série).

### Niveau de criticité

Élevé à critique selon `reconciliation_rate` (sous 70 % = tension, 70–90 % = vigilance dans `TresoreriePositionCard`).

### Action attendue

Surveiller, investiguer les écarts, ouvrir le détail carte / navigation inter-cards.

### Type de représentation suggéré

Chiffre dominant, barres d’évolution (`DualSeriesChart`), badges d’état.

### Données et fiabilité

API trésorerie / agrégations Vault ; `generated_at` ; états `loading` / `no_data` / tension.

### États à prévoir

* normal · alerte · critique · donnée partielle · donnée indisponible · donnée à confirmer

**Implémentation** : `TresoreriePositionCard` / `TresoreriePositionCardWithPolling` ; métriques tuile `GET /api/dashboard-metrics` ou `GET /api/instruments`.

---

## 6.2 — Tuile `business` · « Business » (classe A, tuile maîtresse)

### Nom de la card

Business

### Objectif métier

Lire le **volume d’activité** sur la **période** (ventes, achats), à distinguer de la trésorerie à date et des encaissements (cf. `tile-help.ts`).

### Question à laquelle elle répond

« Comment mon activité évolue sur la période, et où sont les tensions côté clients / encours ? »

### Persona principal

Max, Véréna

### Niveau de lecture prioritaire

Instantanée (KPI) puis détail (graphiques, partenaires, risque / priorité relance).

### KPI principal

Totaux ventes / achats (`SalesAggregation`, `PurchasesAggregation`).

### Indicateurs secondaires

`BusinessChart`, sections encours / risque, badges exposition marge et priorité relance, avertissements (ex. multi-devises).

### Horizon temporel

Période sélectionnée dans le header.

### Niveau de criticité

Modéré à élevé selon concentration et retard.

### Action attendue

Investiguer, relancer, croiser avec Encours ou Flux net.

### Type de représentation suggéré

Courbes / barres, badges, tableaux partenaires.

### Données et fiabilité

Source ERP ou Vault (`primarySource` côté parent).

### États à prévoir

* normal · alerte · critique · donnée partielle · donnée indisponible · donnée à confirmer

**Implémentation** : `BusinessCard` / `BusinessCardWithPolling`.

---

## 6.3 — Tuile `cash` · « Flux net » (classe A, tuile maîtresse)

### Nom de la card

Flux net

### Objectif métier

Afficher **entrées moins sorties** de trésorerie sur la période ; négatif = consommation nette de cash (`tile-help.ts`).

### Question à laquelle elle répond

« Sur la période, mon cash net augmente-t-il ou se contracte-t-il ? »

### Persona principal

Véréna, Max

### Niveau de lecture prioritaire

Lecture métier (dual série in/out + net).

### KPI principal

Flux net signé (`PaymentsAggregation` in / out).

### Indicateurs secondaires

`DualSeriesChart`, granularité, `CardChartSection` / insight flux (`computeFluxNetInsight`).

### Horizon temporel

Période du header.

### Niveau de criticité

Modéré à élevé si net durablement négatif.

### Action attendue

Surveiller, arbitrer, croiser avec Trésorerie (à date) et Paiements.

### Type de représentation suggéré

Graphique dual + KPI signé.

### Données et fiabilité

Erreurs `errorIn` / `errorOut` gérées sur la carte.

### États à prévoir

* normal · alerte · critique · donnée partielle · donnée indisponible · donnée à confirmer

**Implémentation** : `FluxCashCard` / `FluxCashCardWithPolling`.

---

## 6.4 — Tuile `treasury_position` · « Paiements » (classe B)

### Nom de la card

Paiements

### Objectif métier

Exposer les **paiements constatés** sur la période (règlements enregistrés), **distincts** de la trésorerie globale à date (`tile-help.ts`), avec rapprochement / volumes / confirmation selon API.

### Question à laquelle elle répond

« Sur la période, mes paiements et rapprochements sont-ils sous contrôle ? »

### Persona principal

Véréna

### Niveau de lecture prioritaire

Lecture métier (taux, montants, restes).

### KPI principal

Données `TreasuryData` : rapprochement, volumes réconciliés / non réconciliés.

### Indicateurs secondaires

`reconciliation_metrics`, `confirmation`, `completeness_check`, `unreconciled_lines_count`, dates, `process.source`.

### Horizon temporel

Période d’analyse (filtre cockpit).

### Niveau de criticité

Élevé à critique si alignement faible.

### Action attendue

Rapprocher, investiguer.

### Type de représentation suggéré

Pourcentages, montants, messages de complétude.

### Données et fiabilité

Polling trésorerie ; `generated_at` si exposé.

### États à prévoir

* normal · alerte · critique · donnée partielle · donnée indisponible · donnée à confirmer

**Implémentation** : `TreasuryCardWithPolling` (en-tête carte **PAIEMENTS**).

---

## 6.5 — Tuile `working_capital` · « BFR » (classe B)

### Nom de la card

BFR

### Objectif métier

Afficher le **besoin en fonds de roulement à date** : Stock + AR − AP si stock dispo, sinon formules dégradées (`WorkingCapitalCard`).

### Question à laquelle elle répond

« Quelle liquidité est mobilisée dans le cycle d’exploitation ? »

### Persona principal

Véréna

### Niveau de lecture prioritaire

Instantanée puis détail (composition).

### KPI principal

Montant BFR.

### Indicateurs secondaires

Barres de composition, série BFR, `stockValuation` si présent.

### Horizon temporel

**À date** (tooltip : pas un flux de période).

### Niveau de criticité

Modéré à élevé.

### Action attendue

Agir sur stock, clients, fournisseurs.

### Type de représentation suggéré

Chiffre + décomposition + évolution.

### Données et fiabilité

AR/AP par partenaire, stock optionnel.

### États à prévoir

* normal · alerte · critique · donnée partielle · donnée indisponible · donnée à confirmer

**Implémentation** : `WorkingCapitalCard` / `WorkingCapitalCardWithPolling`.

---

## 6.6 — Tuile `encours` · « Encours » (classe B)

### Nom de la card

Encours

### Objectif métier

Détail des **encours clients** ouverts : totaux, retard, partenaires, alertes (ex. sans échéance) — **à date** (`tile-help.ts`).

### Question à laquelle elle répond

« Qui me doit quoi et avec quel retard ? »

### Persona principal

Véréna, Esther

### Niveau de lecture prioritaire

Instantanée puis liste / graphique.

### KPI principal

`open_amount`, `overdue_amount`.

### Indicateurs secondaires

Comptages factures, `missing_due_date_count`, `meta`, série AR.

### Horizon temporel

Stock à date ; évolution si série.

### Niveau de criticité

Élevé si retard élevé.

### Action attendue

Relancer, prioriser.

### Type de représentation suggéré

Totaux + liste + graphique.

### Données et fiabilité

`ArByPartnerDetail`.

### États à prévoir

* normal · alerte · critique · donnée partielle · donnée indisponible · donnée à confirmer

**Implémentation** : `EncoursCard` / `EncoursCardWithPolling`.

---

## 6.7 — Tuile `taxes` · « Taxes » (classe B)

### Nom de la card

Taxes

### Objectif métier

Restituer la **part fiscale** de l’activité sur la période : TVA collectée vs déductible et flux net TVA (`tile-help.ts`).

### Question à laquelle elle répond

« Quelle est ma TVA sur la période (collectée, déductible, solde) ? »

### Persona principal

Véréna, Esther

### Niveau de lecture prioritaire

Lecture métier (montants + graphique).

### KPI principal

Flux TVA : `total_tax` ventes − `total_tax` achats (`TaxesCard`).

### Indicateurs secondaires

`TaxesChart`, `CardChartSection`, granularité / type de graphique.

### Horizon temporel

Période du header.

### Niveau de criticité

Modéré.

### Action attendue

Contrôler déclarations, croiser avec Business.

### Type de représentation suggéré

Graphique + lignes collectée / déductible / flux.

### Données et fiabilité

Erreurs ventes / achats séparées (`errorSales`, `errorPurchases`).

### États à prévoir

* normal · alerte · critique · donnée partielle · donnée indisponible · donnée à confirmer

**Implémentation** : `TaxesCard` / `TaxesCardWithPolling`.

---

## 6.8 — Tuile `ebitda` · « EBE » (classe B)

### Nom de la card

EBE

### Objectif métier

Afficher l’**excédent brut d’exploitation** sur la période : EBE complet (marge brute − charges de personnel) si paie disponible, sinon proxy ; tuile « En attente » si donnée absente (`tile-help.ts`, `EbeCard`).

### Question à laquelle elle répond

« Quel est mon excédent brut d’exploitation réel ou approximatif sur la période ? »

### Persona principal

Véréna, Esther

### Niveau de lecture prioritaire

Lecture instantanée (EBE) puis détail (sources paie, rubriques 641/645).

### KPI principal

EBE calculé ou proxy (`EbeCard`).

### Indicateurs secondaires

Marge brute, charges de personnel, `payslipCount`, étiquette source paie (`PAYROLL_SOURCE_UI`), série d’évolution EBE.

### Horizon temporel

Période ; granularité graphique configurable.

### Niveau de criticité

Modéré (sensibilité forte si paie partielle).

### Action attendue

Creuser la masse salariale ou la marge selon écarts.

### Type de représentation suggéré

Chiffre dominant + série temporelle + badge source.

### Données et fiabilité

Cohérence « EBE complet » vs « proxy » documentée dans le composant ; état « En attente » sur tuile si pas de données paie.

### États à prévoir

* normal · alerte · critique · donnée partielle · donnée indisponible · donnée à confirmer

**Implémentation** : `EbeCard` / `EbeCardWithPolling`.

---

## 6.9 — Tuile `credit_notes` · « Notes de crédit » (classe C)

### Nom de la card

Notes de crédit

### Objectif métier

Suivre les **notes de crédit** (avoirs / corrections) côté client et fournisseur sur la période (`tile-help.ts`).

### Question à laquelle elle répond

« Quel volume d’avoirs et corrections sur la période ? »

### Persona principal

Véréna

### Niveau de lecture prioritaire

Lecture métier (séries client / fournisseur).

### KPI principal

Agrégats `AdjustmentsAggregation` client + fournisseur.

### Indicateurs secondaires

`DualSeriesChart`, `CardChartSection`, granularité.

### Horizon temporel

Période du header.

### Niveau de criticité

Faible à modéré.

### Action attendue

Investiguer pics anormaux, croiser avec Business.

### Type de représentation suggéré

Graphique dual, montants formatés.

### Données et fiabilité

Erreurs `errorClient` / `errorSupplier`.

### États à prévoir

* normal · alerte · critique · donnée partielle · donnée indisponible · donnée à confirmer

**Implémentation** : `CreditNotesCard` / `CreditNotesCardWithPolling`.

---

## 6.10 — Tuile `refunds` · « Remboursements » (classe C)

### Nom de la card

Remboursements

### Objectif métier

Suivre les **remboursements** constatés sur la période, client et fournisseur (`tile-help.ts`).

### Question à laquelle elle répond

« Quels remboursements sur la période ? »

### Persona principal

Véréna

### Niveau de lecture prioritaire

Lecture métier (séries).

### KPI principal

Agrégats `AdjustmentsAggregation` (remboursements).

### Indicateurs secondaires

`DualSeriesChart`, `CardChartSection`.

### Horizon temporel

Période du header.

### Niveau de criticité

Faible à modéré.

### Action attendue

Contrôler anomalies, croiser avec Flux net / Paiements.

### Type de représentation suggéré

Graphique dual.

### Données et fiabilité

Erreurs client / fournisseur.

### États à prévoir

* normal · alerte · critique · donnée partielle · donnée indisponible · donnée à confirmer

**Implémentation** : `RefundsCard` / `RefundsCardWithPolling`.

---

## 6.11 — Tuile `pos_shops` · « Points de vente » (classe C)

### Nom de la card

Points de vente

### Objectif métier

Visualiser l’**activité POS** remontée dans Linky : magasins, sessions, scellés / en attente, ventes, tickets (`tile-help.ts`).

### Question à laquelle elle répond

« Comment se comportent mes points de vente sur la période ? »

### Persona principal

Véréna, Max

### Niveau de lecture prioritaire

Synthèse puis liste sessions / graphiques.

### KPI principal

Agrégats par shop (sessions, ventes, tickets, statuts `vault_status`).

### Indicateurs secondaires

`PosSessionChart`, `DualSeriesChart`, liste des sessions avec écarts caisse éventuels.

### Horizon temporel

Période ; en vue « tout le cockpit » le code peut utiliser le jour courant pour le POS (cf. `DashboardWithFilters` / `posPeriod`).

### Niveau de criticité

Modéré (sessions non scellées).

### Action attendue

Contrôler clôtures, investiguer écarts.

### Type de représentation suggéré

Tableaux, graphiques, badges statut scellé.

### Données et fiabilité

Données issues des APIs POS branchées sur la vue.

### États à prévoir

* normal · alerte · critique · donnée partielle · donnée indisponible · donnée à confirmer

**Implémentation** : `PosShopsView`.

---

## 6.12 — Tuile `pos_z` · « Z de caisse » (classe C)

### Nom de la card

Z de caisse

### Objectif métier

Emplacement produit pour les **clôtures de caisse (Z)** sur la période ; dépend des Z remontés (`tile-help.ts`).

### Question à laquelle elle répond

« Où lire mes Z de caisse ? » (fonctionnalité en cours de déploiement dans l’UI actuelle.)

### Persona principal

Véréna

### Niveau de lecture prioritaire

Lecture instantanée (message d’état).

### KPI principal

Aucun indicateur chiffré dans l’implémentation actuelle (placeholder tuile).

### Indicateurs secondaires

— 

### Horizon temporel

Période (vue dédiée `pos_z` dans le header).

### Niveau de criticité

Faible (fonctionnalité non aboutie).

### Action attendue

Attendre complément produit ou accéder au parcours prévu.

### Type de représentation suggéré

Écran « Bientôt disponible ».

### Données et fiabilité

Non applicable tant que la carte n’est pas branchée.

### États à prévoir

* donnée indisponible · placeholder produit

**Implémentation** : `PosComingSoonView` (titre « Z de caisse ») ; même composant peut servir de shell pour d’autres vues POS vides.

---

# CHAPITRE B — PÉRIMÈTRE DE LA PARTIE SYNTHÈSE COMPTABLE

## 7. Logique générale

La partie **Synthèse comptable** n’est pas une simple reprise de la vue Pilotage.
Elle doit être pensée comme une **lecture structurée**, plus stable, plus explicative, plus apte à la restitution et à la production de rapports.

Elle s’adresse prioritairement à :

* **Esther**
* **Véréna**
* et secondairement au **CODIR**.

### Implémentation actuelle (`AccountingSummaryView`)

* **Entrée** : `?view=synthese` — shell `app/synthese-v2.css`, titre « Lecture synthétique du dossier », source affichée **Vault**.
* **Filtres propres** : multi-sociétés (dropdown), période (exercice courant, N-1, trimestre, semestre, personnalisé).
* **Chaîne de lecture** annoncée : *Synthèse → Balance générale → Grand livre → Écriture* ; drill BG → panneau GL latéral.
* **Ordre des blocs dans le code** (haut → bas) : en-tête + badges → carte « Vue d’ensemble » → fil d’Ariane → **BankReconciliationBlock** → **AccountingSummaryKpiCards** → graphiques tendance / répartition → **AccountingInsightBlock** + **AccountingSummaryProofBlock** → **AccountingSummaryAlerts** + **AccountingSummaryCodirBlock** → **TrialBalanceBlock** (BG partielle OD paie) → rubriques Bilan & CR → (option) agrégats par classes PCG → balances âgées clients & fournisseurs.

Les sections **7.1 à 7.7** ci-dessous alignent le brief sur cette structure ; les titres restent les vôtres, le contenu reflète le **comportement actuel** du front.

---

## Template de description d’un bloc de Synthèse

### Nom du bloc

[Nom]

### Objectif de lecture

[À quoi sert ce bloc dans la compréhension de la situation]

### Question financière traitée

[Question à laquelle le bloc répond]

### Persona principal

[Véréna / Esther / CODIR]

### Niveau de granularité

[haut niveau / intermédiaire / détaillé]

### Indicateurs clés

[agrégats, sous-totaux, variations, ratios]

### Type de restitution attendu

[synthèse / détail / justification / évolution / commentaire]

### Type de représentation suggéré

[bloc synthèse / tableau / variation / waterfall / timeline / commentaire]

### Niveau d’explication attendu

[faible / moyen / élevé]

### Lien avec les vues Pilotage

[quelles cards ou signaux ce bloc reprend, éclaire ou consolide]

### États à prévoir

* lecture normale
* écart significatif
* donnée partielle
* donnée indisponible
* besoin de justification

---

## 7.1 Bloc 1 — Résumé exécutif financier

### Nom du bloc

Vue d’ensemble + carte KPI synthétique (lecture haute)

### Objectif de lecture

Donner en une **prise de vue** le périmètre (sociétés, période, source Vault) et une **première couche de chiffres clés** (totaux bilan / CR / encours / contrôle BG) sans entrer encore dans le grand livre.

### Question financière traitée

« À haut niveau, à quoi ressemble le dossier sur le périmètre choisi ? »

### Persona principal

CODIR, Esther, Véréna

### Niveau de granularité

Haut niveau.

### Indicateurs clés

Carte descriptive « Vue d’ensemble » + **AccountingSummaryKpiCards** : par ex. total actif (bilan rubriques), résultat (CR rubriques), totaux balances âgées, contrôle trial balance — agrégés depuis `/api/accounting/balance-sheet/rubrics`, `income-statement/rubrics`, `aged-*`, `trial-balance` (voir `AccountingSummaryKpiCards.tsx`).

### Type de restitution attendu

Synthèse + cartes KPI (états ok / partial / unavailable par carte).

### Type de représentation suggéré

Bloc narratif + grille de cartes KPI cohérente avec la charte `sv2-*` (synthèse v2).

### Niveau d’explication attendu

Faible à moyen (titres + sous-titres + ligne de référence).

### Lien avec les vues Pilotage

Reprend les **grandes masses** que le pilotage suggère (trésorerie, activité, encours) mais avec **ancrage PCG / Vault** et multi-sociétés.

### États à prévoir

* lecture normale · écart significatif · donnée partielle · donnée indisponible · besoin de justification

**[code]** Header `AccountingSummaryView` (badges Source / sociétés / période) + `AccountingSummaryKpiCards`.

---

## 7.2 Bloc 2 — Compte de résultat synthétique

### Nom du bloc

Compte de résultat par rubriques (+ variante agrégat classes 6–7)

### Objectif de lecture

Lire le **résultat** et sa structure **rubrique PCG**, avec comparaison N/N-1 possible selon mode période, et export CSV.

### Question financière traitée

« Comment le résultat se décompose-t-il et évolue-t-il vs la période de référence ? »

### Persona principal

Esther, Véréna

### Niveau de granularité

Intermédiaire (rubriques) ; détaillé via drill vers BG / GL.

### Indicateurs clés

Rubriques CR, `enableCompare`, export `RubricsBlock` sur `/api/accounting/income-statement/rubrics` ; fallback « classes 6–7 » dans `<details>` (`ClassAggregationBlock` + `income-statement`).

### Type de restitution attendu

Tableau hiérarchisé / synthèse + export justification.

### Type de représentation suggéré

Tableau + boutons export ; drill BG.

### Niveau d’explication attendu

Élevé (lien compte → écriture).

### Lien avec les vues Pilotage

Prolonge la carte **EBE** pilotage par une **lecture comptable complète** du CR.

### États à prévoir

* lecture normale · écart significatif · donnée partielle · donnée indisponible · besoin de justification

**[code]** `RubricsBlock` titre « Compte de résultat » ; `ClassAggregationBlock` replié pour l’agrégat par classes.

---

## 7.3 Bloc 3 — Structure de trésorerie

### Nom du bloc

Bilan synthétique & équilibre actif/passif (rubriques)

### Objectif de lecture

Comprendre la **structure patrimoniale** (bilan) sur la même logique que le CR : rubriques, drill, export.

### Question financière traitée

« Comment sont structurés l’actif et le passif, et où pointer les masses pour expliquer la situation ? »

### Persona principal

Esther, Véréna, CODIR

### Niveau de granularité

Intermédiaire (rubriques) ; détail par compte via BG → GL.

### Indicateurs clés

`total_actif` et agrégats rubriques (`balance-sheet/rubrics`) ; variante classes 1–5 dans le pan replié.

### Type de restitution attendu

Synthèse structurée + justification (export, drill).

### Type de représentation suggéré

Tableau rubriques ; éventuellement mirror avec **AccountingSummaryBreakdownChart** pour la lecture visuelle globale.

### Niveau d’explication attendu

Élevé.

### Lien avec les vues Pilotage

Éclaire les **postes** derrière Trésorerie / BFR vus en pilotage.

### États à prévoir

* lecture normale · écart significatif · donnée partielle · donnée indisponible · besoin de justification

**[code]** `RubricsBlock` « Bilan » ; complété par **TrialBalanceBlock** (balance générale partielle, libellé explicite OD paie dans le code).

---

## 7.4 Bloc 4 — Créances / dettes / échéances

### Nom du bloc

Balances âgées clients & fournisseurs

### Objectif de lecture

Passer des **totaux** aux **tiers** et aux **tranches d’âge** (non échu, 0–30j, …, au-delà de 180 jours), avec base d’échéance documentée (`aging_basis`), limitations éventuelles (V1/V2), export CSV.

### Question financière traitée

« Qui me doit / à qui je dois, et dans quelles tranches temporelles ? »

### Persona principal

Véréna, Esther

### Niveau de granularité

Détaillé (ligne partenaire).

### Indicateurs clés

Montants par tranche, totaux, badges `aging_basis`, messages `v2_limitations` / `v1_limitations`.

### Type de restitution attendu

Détail tabulaire + export.

### Type de représentation suggéré

Tableau aging ; pourrait être enrichi en waterfall ou heatmap côté design.

### Niveau d’explication attendu

Élevé.

### Lien avec les vues Pilotage

Prolonge **Encours** et **BFR** avec une **lecture tiers** conforme au référentiel.

### États à prévoir

* lecture normale · écart significatif · donnée partielle · donnée indisponible · besoin de justification

**[code]** `AgedBalanceBlock` ×2 (clients `aged-receivables`, fournisseurs `aged-payables`).

---

## 7.5 Bloc 5 — Variations sur période

### Nom du bloc

Tendances et répartition (graphiques synthèse)

### Objectif de lecture

Donner une **lecture visuelle** des dynamiques et de la répartition sur la période (complément des tableaux).

### Question financière traitée

« Comment évoluent les principaux agrégats et quelle est la répartition à l’instant T ? »

### Persona principal

Esther, Véréna

### Niveau de granularité

Intermédiaire (agrégats graphiques).

### Indicateurs clés

Données issues des routes comptables sous-jacentes (tendance, breakdown) — voir props des composants graphiques.

### Type de restitution attendu

Évolution + commentaire implicite visuel.

### Type de représentation suggéré

Courbes / barres (`AccountingSummaryTrendChart`, `AccountingSummaryBreakdownChart`).

### Niveau d’explication attendu

Moyen (le détail chiffré reste dans les tableaux et la BG).

### Lien avec les vues Pilotage

Équivalent « synthèse comptable » des courbes déjà présentes sur plusieurs **cards** pilotage (évolution).

### États à prévoir

* lecture normale · écart significatif · donnée partielle · donnée indisponible · besoin de justification

**[code]** Section « Lecture graphique » dans `AccountingSummaryView`.

---

## 7.6 Bloc 6 — Qualité et couverture de la donnée

### Nom du bloc

Confiance bancaire, preuve comptable, alertes

### Objectif de lecture

Rendre explicites **l’alignement bancaire**, les **restes à rapprocher**, et la **traçabilité** (preuve, documentation) avant de conclure.

### Question financière traitée

« Puis-je me fier à ces chiffres et quels sont les points de vigilance documentés ? »

### Persona principal

Esther, Véréna

### Niveau de granularité

Intermédiaire (indicateurs de qualité) + détail dans les sous-blocs.

### Indicateurs clés

`BankReconciliationBlock` : taux, montants rapprochés / restants, lignes non rapprochées, dates ; `AccountingSummaryProofBlock` : preuve / rattachements ; `AccountingSummaryAlerts` : points d’attention.

### Type de restitution attendu

Justification + statuts (Aligné / Partiel / Indisponible…).

### Type de représentation suggéré

Blocs confiance + listes d’alertes + lien documentation CODIR.

### Niveau d’explication attendu

Élevé.

### Lien avec les vues Pilotage

Prolonge la carte **Paiements / rapprochement** et le **badge d’intégrité** du header pilotage.

### États à prévoir

* lecture normale · écart significatif · donnée partielle · donnée indisponible · besoin de justification

**[code]** `BankReconciliationBlock`, `AccountingSummaryProofBlock`, `AccountingSummaryAlerts`, `AccountingSummaryCodirBlock` (docx marqué non disponible dans les props actuelles).

---

## 7.7 Bloc 7 — Notes / commentaires / éléments d’explication

### Nom du bloc

Insight Diva comptable + restitution CODIR

### Objectif de lecture

Fournir une **couche narrative** et **actionnable** (insight généré / structuré) et un **support de restitution** (CODIR) sans se substituer aux écritures.

### Question financière traitée

« Qu’est-ce que je retiens en deux minutes et qu’est-ce que je dois encore expliquer ou auditer ? »

### Persona principal

Esther, CODIR

### Niveau de granularité

Haut niveau (insight) avec renvoi vers preuves.

### Indicateurs clés

Contenu `AccountingInsightBlock` (appel `/api/diva/accounting-insight` ou équivalent selon évolutions) ; bloc CODIR pour packaging documentaire.

### Type de restitution attendu

Commentaire + synthèse + préparation rapport.

### Type de représentation suggéré

Texte structuré, puces, lien avec preuve ; complété par le **fil d’Ariane** (`AccountingSummaryBreadcrumb`) pour la navigation analytique BG.

### Niveau d’explication attendu

Élevé.

### Lien avec les vues Pilotage

Parallèle avec **DivaFlashBlock** en pilotage, mais ancré comptable (périmètre Vault, rubriques).

### États à prévoir

* lecture normale · écart significatif · donnée partielle · donnée indisponible · besoin de justification

**[code]** `AccountingInsightBlock` + `AccountingSummaryCodirBlock` ; navigation drill `setDrillBG` + `TrialBalanceBlock` / GL panel.

---

# CHAPITRE C — LIVRABLES DESIGN ATTENDUS

## 8. Écrans attendus

### 8.1 Pour Max

* Home mobile Pilotage
* Lecture rapide des signaux
* Accès simple aux alertes et détails essentiels

### 8.2 Pour Véréna

* Home desktop Pilotage
* Vue structurée de suivi opérationnel
* Accès au détail de gestion

### 8.3 Pour Esther

* Vue desktop Synthèse comptable
* Vue analytique détaillée
* Préparation implicite à la production de rapports

### 8.4 Écrans complémentaires

* détail d’une card structurante ;
* vue alertes / anomalies ;
* vue analytique tabulaire ;
* système de statuts de fiabilité.

### 8.5 Formats de livrables attendus

* maquettes haute fidélité (mobile et desktop selon personas) ;
* design system ou mini UI kit ;
* règles de composants et états (chargement, vide, erreur, partiel, indisponible) ;
* fichiers source éditables (outil à préciser avec la maître de mission) ;
* prototype cliquable souhaitable sur les parcours clés (Pilotage, tuile détaillée, Synthèse, drill).

### Droit de proposition (design)

La designeuse peut proposer des **améliorations** de hiérarchie, regroupement, navigation ou mise en scène, **sans dénaturer** le périmètre fonctionnel (12 tuiles Pilotage, blocs de Synthèse, personas, distinction Pilotage / Synthèse). Les arbitrages structurants se valident avec le produit.

---

# CHAPITRE D — COMPOSANTS À FORMALISER

## 9. Composants UI

* cards ;
* badges ;
* statuts ;
* filtres ;
* sélecteurs de période ;
* sélecteur d’entité ;
* tableaux ;
* mini-graphes ;
* graphes analytiques ;
* empty states ;
* loading states ;
* data partial states ;
* data unavailable states.

**Référence code (priorisation & états)** : les tuiles du pilotage utilisent des priorités **A / B / C** (`linky-tiles.ts`), des **statuts** de tuile (`ready`, `loading`, `partial`, `unavailable`, `error`, `empty`) et des **nuances de valeur** (`positive`, `negative`, `accent`, etc.). La synthèse comptable s’appuie sur les classes **`sv2-*`** (`synthese-v2.css`) et des blocs métier nommés ci-dessus.

---

# CHAPITRE E — CRITÈRES DE RÉUSSITE

## 10. La proposition sera jugée sur sa capacité à :

* traduire fidèlement la profondeur métier de Lynki ;
* distinguer clairement **Pilotage** et **Synthèse comptable** ;
* articuler correctement les usages de **Max, Véréna et Esther** ;
* proposer un design à la fois **montrable en public** et **cohérent produit** ;
* faire ressentir la **fiabilité de la donnée** comme un marqueur fort ;
* produire une base exploitable pour le futur front-end.

---
# Annexe endpoints / champs — Lynki V1

*Cette annexe complète le [`MAPPING_FRONT_DONNEES_LYNKI_V1.md`](./MAPPING_FRONT_DONNEES_LYNKI_V1.md), le [`BACKLOG_IMPLEMENTATION_LYNKI_V1.md`](./BACKLOG_IMPLEMENTATION_LYNKI_V1.md) et le [`CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md`](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md). Elle a pour objet de préciser, pour chaque écran et composant majeur, les **endpoints visés**, les **champs minimums attendus**, les **fallbacks**, et les **points à confirmer** avant développement effectif.*

---

## 1. Objet du document

Cette annexe sert à transformer les `TBD` du backlog et du mapping en éléments **branchables** par l’équipe intégration/dev.

Elle vise à documenter, pour chaque besoin front :

* l’**endpoint visé** ou la **source logique** ;
* la **méthode** d’appel si applicable ;
* les **paramètres attendus** ;
* les **champs minimums** consommés par le front ;
* les **champs optionnels** ;
* les **états de fallback** ;
* la **fréquence de refresh / polling** si applicable ;
* les **points à confirmer** côté code ou backend.

### Ce que ce document n’est pas

Ce document n’est pas :

* une documentation backend exhaustive ;
* un contrat OpenAPI complet ;
* un audit technique de tout `units/dorevia-linky/` ;
* ni une recette.

Il sert de **document de raccordement** entre :

* le produit,
* le front,
* et les sources de données utiles à Lynki V1.

---

## 2. Statut du document

* **Version** : V1
* **Statut** : annexe de travail pour levée des `TBD`
* **Auteur / responsable** : équipe produit / intégration Lynki
* **Dernière mise à jour** : 23 mars 2026
* **Documents parents** :

  * [`DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md`](./DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md)
  * [`CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md`](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md)
  * [`PLAN_LOTS_DEV_LYNKI_V1.md`](./PLAN_LOTS_DEV_LYNKI_V1.md)
  * [`MAPPING_FRONT_DONNEES_LYNKI_V1.md`](./MAPPING_FRONT_DONNEES_LYNKI_V1.md)
  * [`BACKLOG_IMPLEMENTATION_LYNKI_V1.md`](./BACKLOG_IMPLEMENTATION_LYNKI_V1.md)
  * [`TEMPLATE_TICKET_IMPLEMENTATION_LYNKI_V1.md`](./TEMPLATE_TICKET_IMPLEMENTATION_LYNKI_V1.md)
  * [`PLAN_EXECUTION_LYNKI_V1.md`](./PLAN_EXECUTION_LYNKI_V1.md) (pilotage vivant ticket / lot — optionnel)

---

## 3. Convention de lecture

### 3.1 Niveaux de certitude

Chaque ligne doit être lue avec un niveau de certitude explicite :

* **Confirmé** : route / champ déjà identifié dans le code ou la doc technique
* **Probable** : cohérent avec le produit et l’existant, à confirmer dans le code
* **À confirmer** : hypothèse de travail non encore levée

### 3.2 Règle de développement

Aucun ticket avec `Source donnée = TBD` ou `Endpoint = À confirmer` ne doit partir en développement réel sans :

* validation produit,
* ou confirmation explicite dans le code / backend,
* ou stratégie mock assumée.

(Cohérent avec [backlog § 3.2](./BACKLOG_IMPLEMENTATION_LYNKI_V1.md).)

### 3.3 Structure d’une entrée

Chaque entrée documente :

* **ID de référence**
* **Écran / composant**
* **Endpoint / source logique**
* **Méthode**
* **Paramètres**
* **Champs minimums**
* **Champs optionnels**
* **États de fallback**
* **Refresh**
* **Niveau de certitude**
* **Point ouvert**

### 3.4 Tableau de suivi des niveaux de certitude

*Table vivante : à mettre à jour à chaque levée d’incertitude (passage **Confirmé**, arbitrage, mock).*

| ID | Niveau actuel | Prochaine action |
| --- | --- | --- |
| API-02-01 | Probable | Confirmer endpoint unique cockpit vs agrégation côté front |
| API-02-04 | Probable | Confirmer noms de champs et règle balance validée / ERP / delta |
| API-02-05 | Probable | Confirmer route et contrat pour ventes / achats |
| API-02-06 | Probable | Confirmer route et contrat pour flux net |
| API-02B-01 | À confirmer | Arbitrer alertes agrégées backend vs assemblage front multi-sources |
| API-03-01 | Probable | Vérifier endpoint / contrat cockpit desktop |
| API-03-05-PAY | Probable | Aligner route et champs paiements / rapprochement |
| API-03-05-BFR | Probable | Confirmer comportement si stock non couvert |
| API-03-05-ENC | Probable | Aligner route et champs encours / retard |
| API-03-05-TAX | Probable | Aligner route et champs TVA |
| API-03-05-EBE | Probable | Confirmer source paie prioritaire et fallback proxy |
| API-04-01 | Probable | Confirmer famille de routes comptables |
| API-04-02 | Probable | Valider contrat résumé exécutif avec la même famille que 04-01 |
| API-04-03 | Probable | Valider contrat compte de résultat |
| API-04-04 | Probable | Valider contrat bilan |
| API-04-05 | Probable | Confirmer nomenclature des tranches aging |
| API-05-01 | Probable | Vérifier endpoint et détail trésorerie / séries |

Les entrées **API-04-02** à **API-04-05** héritent de la même décision d’architecture que **API-04-01** ; elles peuvent être levées en bloc une fois la famille de routes comptables figée.

### 3.5 Priorité de levée des incertitudes

Alignement avec le [`PLAN_LOTS_DEV_LYNKI_V1.md`](./PLAN_LOTS_DEV_LYNKI_V1.md) (Lots 2 à 5).

**P0 — à lever avant démarrage effectif des Lots 2 et 3** (pilotage mobile Max, puis desktop Véréna) :

* **API-02-01** : socle agrégat cockpit ; sans arbitrage, risque de double appel ou d’écran vide.
* **API-02-04, API-02-05, API-02-06** : tuiles maîtresses du pilotage mobile.
* **API-02B-01** : stratégie alertes ; impact direct sur l’écran Signaux Max.
* **API-03-01** : même question que le cockpit mobile, densité desktop ; à trancher avant Lot 3.
* Les **API-03-05-*** : cohérence des tuiles desktop avec les routes réelles (au minimum **Probable** ou mock assumé par tuile).

**P1 — à lever avant Lots 4 et 5** (synthèse comptable Esther, détail Trésorerie) :

* **API-04-01** (et sous-IDs **API-04-02** à **API-04-05**) : famille comptable et contrats tableaux / aging.
* **API-05-01** : écran détail trésorerie (KPI, séries, bloc rapprochement).

Les points **P0** peuvent être partiellement couverts par des **mocks assumés** tant que la règle du [§ 3.2](#32-règle-de-développement) est respectée et documentée dans le ticket.

---

## 4. Paramètres transverses standard

Sauf cas contraire, les écrans Lynki V1 peuvent consommer une combinaison de paramètres communs :

* `tenant` ou contexte d’instance
* `company_id` ou périmètre société
* `date_from`
* `date_to`
* `period_preset` (si utilisé par le front)
* `currency`
* `granularity` (jour / semaine / mois)
* `view` (`pilotage`, `synthese`)
* éventuellement `entity_scope`

### Règle

Le front doit éviter de multiplier les formats de période.
Une seule convention de période doit être utilisée à l’échelle V1.

---

## 5. Mapping endpoints / champs par écran

### 5.1 Pilotage mobile Max

#### 5.1.1 Vue cockpit mobile — agrégats principaux

* **ID** : API-02-01
* **Écran / composant** : Pilotage mobile Max — page globale
* **Source logique** : agrégat cockpit / dashboard
* **Endpoint visé** : **à confirmer dans le code**
* **Méthode** : `GET`
* **Paramètres attendus** :

  * `company_id`
  * `date_from`
  * `date_to`
  * éventuellement `granularity`
* **Champs minimums attendus** :

  * `treasury`
  * `business`
  * `cash_flow` ou `flux_net`
  * `payments`
  * `working_capital`
  * `encours`
  * `taxes`
  * `ebe`
  * `credit_notes`
  * `refunds`
  * `pos_shops`
  * `pos_z`
  * `data_quality_summary` ou équivalent
* **Champs optionnels** :

  * `insight`
  * `generated_at`
  * `source_status`
  * `global_confidence`
* **États de fallback** :

  * page lisible même si une ou plusieurs tuiles sont absentes ;
  * tuiles absentes → état `indisponible` ou `placeholder`
* **Refresh** :

  * manuel ou à définir ;
  * polling non obligatoire pour V1 sauf si déjà présent
* **Niveau de certitude** : **Probable**
* **Point ouvert** :
  confirmer si l’existant expose un endpoint unique cockpit ou plusieurs endpoints agrégés côté front

---

#### 5.1.2 Tuile Trésorerie

* **ID** : API-02-04
* **Écran / composant** : Tuile maîtresse Trésorerie
* **Source logique** : position de trésorerie / rapprochement
* **Endpoint visé** : **candidat existant à confirmer**
* **Méthode** : `GET`
* **Paramètres** :

  * `company_id`
  * éventuellement `as_of`
* **Champs minimums** :

  * `current_balance` ou équivalent
  * `currency`
  * `status_confidence`
* **Champs utiles supplémentaires** :

  * `validated_balance`
  * `erp_balance`
  * `reconciliation_rate`
  * `unreconciled_amount`
  * `delta`
  * `generated_at`
  * `series[]`
* **Fallbacks** :

  * si `current_balance` absent → tuile indisponible
  * si balance présente mais rapprochement absent → état `partiel` ou `à rapprocher`
* **Graphes autorisés** :

  * sparkline
  * courte série d’évolution
* **Niveau de certitude** : **Probable**
* **Point ouvert** :
  confirmer le nom exact des champs et la règle d’affichage entre balance validée / ERP / delta

---

#### 5.1.3 Tuile Business

* **ID** : API-02-05
* **Écran / composant** : Tuile maîtresse Business
* **Source logique** : activité ventes / achats sur période
* **Endpoint visé** : **à confirmer**
* **Méthode** : `GET`
* **Paramètres** :

  * `company_id`
  * `date_from`
  * `date_to`
* **Champs minimums** :

  * `sales_total`
  * `purchases_total`
  * `currency`
* **Champs optionnels** :

  * `series_sales[]`
  * `series_purchases[]`
  * `top_partners[]`
  * `risk_flags[]`
  * `follow_up_priority`
* **Fallbacks** :

  * si ventes dispo mais achats absents → état `partiel`
  * si agrégat incomplet → `proxy` possible si validé produit
* **Graphes autorisés** :

  * double série
  * barres
  * sparkline
* **Niveau de certitude** : **Probable**

---

#### 5.1.4 Tuile Flux net

* **ID** : API-02-06
* **Écran / composant** : Tuile maîtresse Flux net
* **Source logique** : encaissements / décaissements sur période
* **Endpoint visé** : **à confirmer**
* **Méthode** : `GET`
* **Paramètres** :

  * `company_id`
  * `date_from`
  * `date_to`
  * `granularity`
* **Champs minimums** :

  * `cash_in`
  * `cash_out`
  * `net_cash_flow`
  * `currency`
* **Champs optionnels** :

  * `series_in[]`
  * `series_out[]`
  * `series_net[]`
  * `reconciliation_hint`
* **Fallbacks** :

  * si net calculable mais séries absentes → KPI seul
  * si in/out incomplets → état `partiel`
* **Graphes autorisés** :

  * double série
  * courbe ou barres
* **Niveau de certitude** : **Probable**

---

### 5.2 Alertes / Signaux Max

#### 5.2.1 Liste d’alertes hiérarchisées

* **ID** : API-02B-01
* **Écran / composant** : Alertes / Signaux Max
* **Source logique** : agrégat alertes
* **Endpoint visé** : **à confirmer**
* **Méthode** : `GET`
* **Paramètres** :

  * `company_id`
  * `date_from`
  * `date_to`
* **Champs minimums** :

  * `alerts[]`
* **Structure minimale d’une alerte** :

  * `id`
  * `type` (`business`, `data_quality`, `reconciliation`, etc.)
  * `severity`
  * `title`
  * `message`
* **Champs optionnels** :

  * `recommended_action`
  * `linked_tile`
  * `linked_route`
  * `confidence_state`
  * `generated_at`
* **Fallbacks** :

  * liste vide → état « aucune alerte majeure »
  * source indisponible → bloc indisponible mais écran stable
* **Niveau de certitude** : **À confirmer**
* **Point ouvert** :
  déterminer si les alertes sont agrégées côté backend ou construites côté front à partir de plusieurs sources

---

### 5.3 Pilotage desktop Véréna

#### 5.3.1 Vue cockpit desktop — agrégat global

* **ID** : API-03-01
* **Écran / composant** : Pilotage desktop Véréna
* **Source logique** : même famille que cockpit mobile, avec densité plus forte
* **Endpoint visé** : **à confirmer**
* **Méthode** : `GET`
* **Paramètres** :

  * `company_id`
  * `date_from`
  * `date_to`
  * `granularity`
* **Champs minimums** :

  * ensemble des 12 tuiles
  * `global_confidence`
  * `generated_at`
* **Champs optionnels** :

  * `integrity_status`
  * `alerts_summary`
  * `insight`
* **Fallbacks** :

  * tuiles dégradées individuellement ;
  * la page ne doit pas attendre que les 12 tuiles soient parfaites pour se rendre
* **Niveau de certitude** : **Probable**

---

#### 5.3.2 Tuile Paiements

* **ID** : API-03-05-PAY
* **Source logique** : paiements / rapprochement sur période
* **Endpoint visé** : **à confirmer**
* **Champs minimums** :

  * `payments_total`
  * `reconciliation_rate` ou équivalent
* **Champs optionnels** :

  * `unreconciled_count`
  * `unreconciled_amount`
  * `completeness_check`
* **États clés** :

  * fiable
  * à rapprocher
  * partielle
  * indisponible

---

#### 5.3.3 Tuile BFR

* **ID** : API-03-05-BFR
* **Source logique** : agrégat BFR
* **Endpoint visé** : **à confirmer**
* **Champs minimums** :

  * `working_capital`
* **Champs optionnels** :

  * `accounts_receivable`
  * `accounts_payable`
  * `stock_valuation`
  * `series[]`
* **États clés** :

  * fiable
  * partielle
  * proxy
  * indisponible
* **Point ouvert** :
  confirmer le comportement quand le stock n’est pas encore couvert

---

#### 5.3.4 Tuile Encours

* **ID** : API-03-05-ENC
* **Source logique** : encours clients / retard
* **Endpoint visé** : **à confirmer**
* **Champs minimums** :

  * `open_amount`
  * `overdue_amount`
* **Champs optionnels** :

  * `open_count`
  * `overdue_count`
  * `missing_due_date_count`
  * `top_debtors[]`
  * `series[]`
* **États clés** :

  * fiable
  * partielle
  * anomalie
  * indisponible

---

#### 5.3.5 Tuile Taxes

* **ID** : API-03-05-TAX
* **Source logique** : TVA collectée / déductible / solde
* **Endpoint visé** : **à confirmer**
* **Champs minimums** :

  * `tax_collected`
  * `tax_deductible`
  * `tax_net`
* **États clés** :

  * fiable
  * partielle
  * indisponible

---

#### 5.3.6 Tuile EBE

* **ID** : API-03-05-EBE
* **Source logique** : EBE réel ou proxy
* **Endpoint visé** : **à confirmer**
* **Champs minimums** :

  * `ebe_value`
* **Champs optionnels** :

  * `gross_margin`
  * `payroll_cost`
  * `payroll_source`
  * `series[]`
* **États clés** :

  * fiable
  * proxy
  * partielle
  * indisponible
* **Point ouvert** :
  confirmer la source paie prioritaire et le fallback proxy

---

#### 5.3.7 Tuiles C

* **Notes de crédit** : montants sur période, séries éventuelles
* **Remboursements** : montants sur période, séries éventuelles
* **Points de vente** : volume POS, tickets, statuts sessions
* **Z de caisse** : placeholder V1

Ces tuiles peuvent être documentées plus finement en V1.1 si leur branchement n’est pas critique pour le premier cycle.

---

### 5.4 Synthèse comptable Esther

#### 5.4.1 Vue synthèse globale

* **ID** : API-04-01
* **Écran / composant** : Synthèse comptable Esther
* **Source logique** : agrégats comptables / synthèse
* **Endpoint visé** : **famille de routes comptables à confirmer**
* **Méthode** : `GET`
* **Paramètres** :

  * `company_id`
  * `date_from`
  * `date_to`
  * `comparison_mode` si applicable
* **Champs minimums attendus** :

  * `summary`
  * `income_statement`
  * `balance_sheet`
  * `aged_receivables`
  * `aged_payables`
  * `data_quality`
* **Champs optionnels** :

  * `proof_block`
  * `insight`
  * `codir_block`
  * `charts`
* **Fallbacks** :

  * un tableau peut être rendu même si un graphe associé est absent ;
  * un bloc peut être `partiel` sans casser la synthèse
* **Niveau de certitude** : **Probable**

---

#### 5.4.2 Résumé exécutif

* **ID** : API-04-02
* **Champs minimums** :

  * `summary_cards[]`
  * `period_label`
  * `company_label`
* **États** :

  * fiable
  * partielle
  * indisponible

---

#### 5.4.3 Compte de résultat synthétique

* **ID** : API-04-03
* **Champs minimums** :

  * `income_statement.lines[]`
* **Champs utiles** :

  * `label`
  * `current_value`
  * `previous_value`
  * `delta`
  * `level`
* **Graphes autorisés** :

  * breakdown
  * waterfall ultérieur si retenu

---

#### 5.4.4 Bilan / structure patrimoniale

* **ID** : API-04-04
* **Champs minimums** :

  * `balance_sheet.lines[]`
* **Graphes autorisés** :

  * breakdown
  * répartition

---

#### 5.4.5 Balances âgées

* **ID** : API-04-05
* **Champs minimums** :

  * `aged_receivables.lines[]`
  * `aged_payables.lines[]`
* **Champs utiles** :

  * `partner`
  * `not_due`
  * `bucket_0_30`
  * `bucket_31_60`
  * `bucket_61_90`
  * `bucket_91_plus`
* **Graphes autorisés** :

  * aging
* **Point ouvert** :
  confirmer la nomenclature des tranches

---

### 5.5 Détail Trésorerie

#### 5.5.1 Vue détail

* **ID** : API-05-01
* **Écran / composant** : Détail Trésorerie
* **Source logique** : détail trésorerie / rapprochement / évolution
* **Endpoint visé** : **à confirmer**
* **Méthode** : `GET`
* **Paramètres** :

  * `company_id`
  * `date_from`
  * `date_to`
  * éventuellement `as_of`
* **Champs minimums** :

  * `main_kpi`
  * `series[]`
  * `reconciliation_block`
* **Champs optionnels** :

  * `detail_table[]`
  * `delta_vs_erp`
  * `explanations[]`
* **États** :

  * fiable
  * à rapprocher
  * partielle
  * indisponible
  * anomalie
* **Graphes autorisés** :

  * évolution
  * barres si utile
* **Niveau de certitude** : **Probable**

---

## 6. Mapping par composant canonique

### 6.1 Tuile maîtresse

* **source type** : KPI métier + état de confiance + mini-série
* **champs minimums** :

  * `value`
  * `label`
  * `confidence_state`
* **champs optionnels** :

  * `delta`
  * `series[]`
  * `currency`
* **fallback** :

  * `value` absent → indisponible
  * `value` présent / `series` absent → KPI seul

---

### 6.2 Tuile secondaire

* **source type** : KPI compact + état + mini-contexte
* **champs minimums** :

  * `value`
  * `label`
* **champs optionnels** :

  * `confidence_state`
  * `mini_series[]`
  * `tag`
* **fallback** :

  * placeholder si fonctionnalité non branchée

---

### 6.3 Bloc de confiance

* **source type** : qualité de donnée
* **champs minimums** :

  * `status`
  * `label`
* **champs optionnels** :

  * `reconciliation_rate`
  * `freshness`
  * `completeness`
  * `warnings[]`

---

### 6.4 Bloc d’alerte

* **source type** : signal priorisé
* **champs minimums** :

  * `severity`
  * `title`
  * `message`
* **champs optionnels** :

  * `action_label`
  * `action_target`
  * `source_type`

---

### 6.5 Tableau analytique

* **source type** : lignes détaillées
* **champs minimums** :

  * `rows[]`
* **fallback** :

  * tableau vide lisible ;
  * lignes partielles autorisées si marquées

---

### 6.6 Graphe analytique

* **source type** : séries
* **champs minimums** :

  * `points[]`
* **fallback** :

  * absence de série → pas de graphe, mais écran stable
* **règle** :

  * ne jamais simuler une série inexistante

---

## 7. Annexe de confirmation à produire ensuite

Cette V1 structure le raccordement.
Une annexe plus précise devra être produite lorsque l’inventaire code / API sera fait.

### À confirmer ensuite

* routes exactes
* noms exacts des champs
* structures JSON réelles
* contrats d’erreur
* fréquence de refresh
* polling ou non
* cache ou non
* fallback exact par endpoint

---

## 8. Règle de passage en tickets

Un ticket ne peut être considéré comme prêt à développer que si :

* l’écran canon est identifié ;
* le composant est identifié ;
* l’état de donnée attendu est identifié ;
* l’endpoint ou la source logique est au minimum **Probable** ;
* le fallback a été pensé.

(Sinon : mock assumé ou levée du **À confirmer** dans ce document ou dans le ticket importé.)

---

## 9. Formule finale

> Cette annexe ne « invente » pas les routes : elle **cadre** ce que le front doit consommer et **trace** ce qui reste à aligner avec le code et le backend. Objectif : des tickets **branchables** sans surprise en recette.

---

*Document V1 — annexe endpoints / champs. Suite recommandée : **V1.1** ou document « routes réelles » après audit de `units/dorevia-linky/` et des APIs ; mettre à jour les niveaux **Confirmé** / **Probable** / **À confirmer** en conséquence.*

# Plan d’implémentation data — Évolution (Vault / API Linky)

**Document :** PLAN_IMPLEMENTATION_DATA_EVOLUTION_VAULT_LINKY_v1.0  
**Date :** 14 mars 2026  
**Références :**
- [ANALYSE_DONNEES_EVOLUTION_VAULT_LINKY.md](./ANALYSE_DONNEES_EVOLUTION_VAULT_LINKY.md) (source de vérité : séries vs snapshots, historisation)
- [PLAN_IMPLEMENTATION_BLOC_EVOLUTION_COMMUN_v1.0.md](./PLAN_IMPLEMENTATION_BLOC_EVOLUTION_COMMUN_v1.0.md) (UI bloc Évolution)
- [SPEC_LINKY_BLOC_EVOLUTION_COMMUN_v1.0.md](./SPEC_LINKY_BLOC_EVOLUTION_COMMUN_v1.0.md)

**Périmètre :** Données nécessaires pour alimenter les blocs Évolution des cards Linky (Trésorerie, Encours, EBE, BFR).  
**Statut :** Plan d’exécution

---

## 1. Synthèse et principe des 3 vitesses

L’analyse distingue deux familles :

- **Séries déjà exposées par le Vault** (sales, purchases, payments, adjustments, payroll) → sujet = **branchement / dérivation**.
- **Snapshots uniquement** (treasury, ar-by-partner, ap-by-partner) → sujet = **historisation** (snapshotting prospectif ; backfill rétroactif seulement si reconstruction fiable).

| Vitesse | Objectif | Cards concernées | Type de travail |
|---------|----------|-------------------|-----------------|
| **1** | Déblocage rapide | EBE | API Linky + branchement séries Vault existantes |
| **2** | Conformité sans fausse courbe | Trésorerie, Encours, BFR | Aucun (déjà fait côté UI : bloc présent, état `empty`) |
| **3** | Série fiable pour les 3 autres | Trésorerie, Encours, BFR | Vault et/ou orchestration : historisation, jobs, endpoints série |

**Ordre recommandé :** Phase 1 (EBE) en priorité, puis Phase 3 (historisation) par chantier décidé (Trésorerie, Encours, BFR ou groupé).

---

## 2. Phase 1 — EBE : déblocage rapide (Vitesse 1)

**Objectif :** Passer la card EBE en bloc Évolution **`available`** en dérivant une série EBE depuis les séries Vault déjà exposées (sales, purchases, payroll). Aucun chantier Vault lourd, aucun backfill.

### 2.1 Données nécessaires

- **Vault** expose déjà :
  - `GET /ui/aggregations/sales` → `SalesAggregationResponse` avec `series` (period, amount), `total_ht`, `currency`
  - `GET /ui/aggregations/purchases` → idem
  - `GET /ui/aggregations/payroll` → `PayrollAggregationResponse` avec `series`, `total_charges`, `currency`
- **Formule EBE par période :** pour chaque `period`, `amount_ebe = amount_sales - amount_purchases - amount_payroll` (aligné sur la logique actuelle de la card : marge brute − charges personnel ; avoirs éventuellement à intégrer plus tard en option).

**Statut de vérité de la série EBE v1 :** La série EBE est une série **dérivée**, cohérente avec la logique actuelle de la card. Elle dépend de la disponibilité et de l’alignement des agrégations ventes / achats / payroll sur les mêmes périodes. « EBE disponible » ne signifie pas « EBE certifié dans tous les cas » — les cas limites (périodes sans payroll, sources partielles) sont gérés par merge et fallback documentés.

### 2.2 Tâches techniques

| # | Tâche | Fichiers / lieu | Description |
|---|--------|------------------|-------------|
| 1.1 | **Route API Linky : série EBE** | `units/dorevia-linky/app/api/ebe-evolution/route.ts` (nouveau) | GET avec query `tenant`, `date_debut`, `date_fin`, `company_id`. Appeler en parallèle Vault : sales, purchases, payroll avec `granularity=month`. Aligner les périodes (merge par `period`), calculer par période : `sales - purchases - payroll`. Réponse : `{ series: [{ period, amount }], granularity: "month", currency }`. Gestion erreur : appliquer la **politique d’erreur EBE** (§2.3). |
| 1.2 | **Types / contrat** | `units/dorevia-linky/app/types/aggregations.ts` (existant) ou à côté de la route | Réutiliser `SeriesPoint` (period, amount). Réponse route : `EbeEvolutionResponse { series: SeriesPoint[], granularity: string, currency: string }`. |
| 1.3 | **EbeCardWithPolling : fetch série EBE** | `units/dorevia-linky/components/EbeCardWithPolling.tsx` | En plus du fetch actuel (totaux pour la synthèse), appeler `GET /api/ebe-evolution?tenant=…&date_debut=…&date_fin=…&company_id=…`. Stocker `ebeSeries` dans un state. Passer `ebeSeries` (et `currency`) à `EbeCard`. |
| 1.4 | **EbeCard : bloc Évolution en `available` avec graphique** | `units/dorevia-linky/components/EbeCard.tsx` | Accepter props optionnelles `ebeSeries?: SeriesPoint[]`, `currency?: string`. Si `ebeSeries?.length > 0` : rendre `<InstrumentCardEvolutionBlock state="available">` avec un graphique (bar/line) en `children`. Sinon : garder `state="empty"`. Pour le graphique : réutiliser `DualSeriesChart` avec une seule série (series2 vide, showSeries2=false) ou introduire un petit composant `SingleSeriesChart` (bar/line EBE par période). |
| 1.5 | **Tests et recette** | Tests manuels ou e2e | Vérifier que sur une période avec ventes/achats/payroll, la card EBE affiche une courbe/barres et que le libellé reste « Évolution ». |

### 2.3 Points d’attention

- **Alignement des périodes :** les trois réponses Vault peuvent avoir des `period` légèrement différents (ex. mois sans payroll). Merge par clé `period`, montant manquant = 0.
- **Avoirs (credit_notes) :** l’analyse et la card actuelle utilisent parfois « marge brute + avoirs nets ». Pour la série EBE dérivée, on peut rester sur sales − purchases − payroll ; ajouter les avoirs par période en Phase 1 bis si besoin (nécessite agrégation adjustments par période déjà disponible).
- **Timeout / résilience :** la route `/api/ebe-evolution` fait 3 appels Vault ; garder un timeout cohérent (ex. 10–15 s) et ne pas bloquer le rendu de la card si l’appel échoue (rester en `empty` ou passer en `error` avec onRetry).

**Politique d’erreur EBE (à implémenter telle quelle) :**
- Si **sales** ou **purchases** manque (échec ou réponse invalide) → la route renvoie une **erreur** (ex. 503 ou 500) ; la card reste en `empty` ou passe en `error` avec onRetry.
- Si **payroll** seul manque → **série partielle autorisée** : renvoyer une série EBE = ventes − achats (sans payroll), avec une indication éventuelle en méta (ex. `payroll_unavailable: true`) pour que la card puisse afficher une note si besoin.
- Si **tout** manque (les trois sources en échec) → **erreur** ; la card en `error` ou `empty`.
Cette règle évite un débat au moment de coder et garde un comportement prévisible.

### 2.4 Definition of Done — Phase 1 (EBE)

- [ ] Route `GET /api/ebe-evolution` disponible et documentée (query : tenant, date_debut, date_fin, company_id).
- [ ] Périodes fusionnées correctement (merge par `period`, montant manquant = 0).
- [ ] EbeCard passe en `state="available"` lorsque la série renvoyée est non vide.
- [ ] Fallback `empty` ou `error` cohérent si l’appel échoue ou renvoie une série vide ; `onRetry` fonctionnel si applicable.
- [ ] Aucune régression sur la synthèse EBE (totaux, marge brute, EBE complet / proxy).

### 2.5 Estimation

**Effort Phase 1 :** 1,5–2 j (développement + recette).

---

## 3. Phase 2 — Conformité structurelle (Vitesse 2)

**Objectif :** S’assurer que les cards Trésorerie, Encours et BFR ont bien le bloc Évolution **présent** mais en état **`empty`** tant qu’aucune série fiable n’est disponible. Aucune fausse courbe.

### 3.1 Vérifications (déjà couvertes par le plan UI)

- **Trésorerie** : `TresoreriePositionCard.tsx` — bloc présent, `state="empty"`.
- **Encours** : `EncoursCard.tsx` — bloc présent, `state="empty"`.
- **BFR** : `WorkingCapitalCard.tsx` — bloc présent, `state="empty"`.

Aucune tâche data supplémentaire : la Phase 2 est **actée** par le plan bloc Évolution. Documenter dans la grille de conformité que l’état du bloc pour ces 3 cards est **empty** « par conception » tant que Phase 3 (historisation) n’a pas livré de série.

**DoD Phase 2 :** Bloc Évolution présent sur Trésorerie, Encours et BFR avec `state="empty"` ; grille de conformité (ou doc de recette) indique que l’état **empty** est attendu tant qu’aucune série fiable n’est disponible.

---

## 4. Phase 3 — Infrastructure d’historisation (Vitesse 3)

**Objectif :** Permettre des séries temporelles **fiables** pour Trésorerie, Encours et BFR. Deux volets : **snapshotting prospectif** (obligatoire, faisable) et **backfill rétroactif** (optionnel, seulement si la donnée source le permet).

### 4.1 Principes

- **Snapshotting prospectif :** à partir de la mise en production, un job (cron / scheduler) enregistre régulièrement les valeurs **courantes** dans une table dédiée (ou des tables par métrique). Ces valeurs deviennent la source de séries « à partir de la date de mise en place ».
- **Backfill rétroactif :** reconstituer les mois passés. Possible seulement si le Vault (ou une autre source) peut fournir un état « à une date passée » (ex. ledger, snapshots déjà stockés). Sinon, ne pas promettre d’historique rétroactif.

**Décision : fréquence de snapshot (baseline v1)**  
Pour démarrer, la **fréquence de snapshot est mensuelle** pour Trésorerie, Encours et BFR. Un snapshot **par mois** (ex. 1er du mois à 00:05 pour le mois précédent) suffit pour le pilotage cockpit et limite le volume, la complexité des jobs et la lisibilité des graphiques. Une **v2 éventuelle** (snapshot quotidien) pourra être envisagée si un besoin analytique fort le justifie — elle impacterait volume, granularité, usages et complexité.

**Prérequis Phase 3 : emplacement des snapshots**  
Le plan laisse volontairement ouvert le choix (Vault, BDD dédiée, orchestration) tant que la Phase 3 n’est pas lancée. **Dès le lancement de la Phase 3**, l’**arbitrage d’architecture** doit être fait en premier : où sont stockées les tables de snapshots, qui héberge les jobs (Vault, cron externe, autre). Sans cette décision, le chantier risque de flotter. À acter en amont du premier sous-projet (ex. Trésorerie).

### 4.2 Trésorerie — Historisation de position

| # | Tâche | Lieu | Description |
|---|--------|------|-------------|
| 3.T.1 | **Modèle / table snapshots trésorerie** | Vault ou BDD dédiée | Table (ex. `treasury_snapshots`) : `tenant`, `company_id`, `period` (ex. `2026-01` pour fin janvier), `validated_balance`, `erp_balance`, `reconciled`, `unreconciled`, `currency`, `created_at`. Clé unique (tenant, company_id, period). |
| 3.T.2 | **Job snapshotting** | Vault ou orchestration (cron) | À échéance **mensuelle** (ex. 1er du mois à 00:05 pour le mois précédent), appeler la logique actuelle qui produit le snapshot treasury (position validée, etc.), puis INSERT ou UPSERT dans `treasury_snapshots` pour la période concernée. |
| 3.T.3 | **Endpoint série trésorerie** | Vault ou API Linky | GET `/ui/aggregations/treasury-series` (ou `/api/treasury-evolution`) avec `tenant`, `date_debut`, `date_fin`, `company_id`. Lire la table des snapshots et renvoyer `{ series: [{ period, amount }] }` (amount = validated_balance ou indicateur choisi). |
| 3.T.4 | **Linky : consommer la série** | `TresoreriePositionCard` + container avec polling | Appeler la nouvelle route ; si `series.length > 0`, passer en `state="available"` et afficher le graphique (single série). |

**DoD Phase 3 — Trésorerie :** table snapshots créée et migrée ; job snapshotting mensuel planifié et exécuté au moins une fois ; endpoint série disponible ; série renvoyée sur au moins 1 période historisée ; card Trésorerie consomme la série et passe en `available` lorsque la série est non vide.

**Backfill rétroactif :** seulement si une reconstruction fiable existe (ex. recalcul position à une date à partir d’un ledger). À traiter dans un chantier dédié.

### 4.3 Encours — Historisation AR

| # | Tâche | Lieu | Description |
|---|--------|------|-------------|
| 3.E.1 | **Modèle / table snapshots AR** | Vault ou BDD | Table (ex. `ar_snapshots`) : `tenant`, `company_id`, `period`, `open_amount`, `overdue_amount`, `open_count_invoices`, `overdue_count_invoices`, `created_at`. |
| 3.E.2 | **Job snapshotting** | Vault ou orchestration | À échéance **mensuelle** (ex. 1er du mois pour le mois précédent), appeler la logique actuelle `ar-by-partner` (avec `as_of_date` = dernier jour du mois) et persister les **totaux** dans `ar_snapshots`. Attention : avec le modèle actuel, le snapshot reflète l’état **courant** des résiduels, pas une vraie reconstitution « à la date T ». Pour un vrai « encours au 31/01 » il faudrait un historique de soldes ; ici on livre le snapshotting prospectif. |
| 3.E.3 | **Endpoint série encours** | Vault ou API Linky | GET série (ex. `/api/ar-evolution` ou `/ui/aggregations/ar-series`) : lecture table, retour `{ series: [{ period, amount }] }` (amount = open_amount total). |
| 3.E.4 | **Linky : consommer** | `EncoursCard` + container | Idem : si série disponible, `state="available"` et graphique. |

**DoD Phase 3 — Encours :** table `ar_snapshots` créée ; job snapshotting mensuel planifié et exécuté au moins une fois ; endpoint série AR disponible ; série renvoyée sur au moins 1 période ; card Encours consomme la série et passe en `available` lorsque la série est non vide.

**Backfill rétroactif :** non garanti sans historique de soldes par date (ledger ou équivalent).

### 4.4 BFR — Historisation AR + AP

| # | Tâche | Lieu | Description |
|---|--------|------|-------------|
| 3.B.1 | **Snapshots AP** | Vault ou BDD | Table `ap_snapshots` (symétrique à AR) : `tenant`, `company_id`, `period`, `open_amount`, etc. |
| 3.B.2 | **Job snapshotting BFR** | Idem | Soit deux jobs (AR + AP) soit un job qui appelle ar-by-partner et ap-by-partner et persiste les deux. Option : table unique `working_capital_snapshots` avec `ar_open_amount`, `ap_open_amount`, `bfr = ar - ap`. |
| 3.B.3 | **Endpoint série BFR** | Vault ou API Linky | GET série BFR (dérivée AR − AP par période depuis les tables, ou lecture d’une table BFR pré-calculée). |
| 3.B.4 | **Linky : consommer** | `WorkingCapitalCard` + container | Si série disponible, `state="available"` et graphique. |

**DoD Phase 3 — BFR :** tables AR/AP (ou `working_capital_snapshots`) créées ; jobs snapshotting mensuels planifiés et exécutés ; endpoint série BFR disponible ; série renvoyée sur au moins 1 période ; card BFR consomme la série et passe en `available` lorsque la série est non vide.

### 4.5 Ordre et estimation Phase 3

- **Ordre suggéré :** Trésorerie (historisation de position) → Encours → BFR (BFR réutilise AR+AP).
- **Estimation globale Phase 3 :** 5–10 j selon périmètre (modèle de données, jobs, endpoints, intégration Linky), à affiner par sous-projet.

---

## 5. Récapitulatif des livrables par phase

| Phase | Livrable | Critère de succès |
|-------|----------|-------------------|
| **1** | Route `/api/ebe-evolution` + EbeCard en `available` avec graphique EBE | La card EBE affiche une courbe/barres d’évolution EBE (dérivée sales − purchases − payroll) sur la période ; pas de régression sur la synthèse. |
| **2** | — | Trésorerie, Encours, BFR : bloc présent, état `empty` documenté. |
| **3** | Tables + jobs + endpoints série + branchement Linky | Pour chaque card (Trésorerie, Encours, BFR), une série fiable est disponible (au moins prospectivement) et le bloc passe en `available` avec graphique. |

---

## 6. Hors périmètre (ce plan ne traite pas)

- **Redesign des graphiques** : choix de type (bar / line / area), couleurs, accessibilité — hors scope de ce plan data.
- **Détail analytique métier des métriques** : drill-down, export, seuils d’alerte métier — hors scope.
- **Historique rétroactif complet** lorsqu’aucune source fiable ne permet une reconstruction (pas de promesse de backfill « magique »).

---

## 7. Dépendances et risques

- **Phase 1 :** Dépend uniquement des endpoints Vault existants (sales, purchases, payroll avec `granularity=month`). Risque faible.
- **Phase 3 :** Dépend du choix d’hébergement des tables (Vault, BDD métier, autre). Coordination avec l’équipe Vault pour le modèle de données et les jobs. Risque moyen (effort et délai).

---

## 8. Références code (rappel)

- **Linky API :** `units/dorevia-linky/app/api/dashboard-metrics/route.ts`, `sales/route.ts`, `purchases/route.ts`, `payroll/route.ts`.
- **Linky EBE :** `EbeCardWithPolling.tsx`, `EbeCard.tsx`, `InstrumentCardEvolutionBlock.tsx`, `CardChartSection.tsx`, `DualSeriesChart.tsx`.
- **Vault modèles :** `sources/vault/internal/models/aggregations.go` (`SeriesPoint`, `SalesAggregationResponse`, etc.).
- **Vault handlers :** `sources/vault/internal/handlers/aggregations_*.go`, `aggregations_treasury.go`.

---

*Plan d’implémentation data — Évolution Vault / API Linky — v1.2 — 14 mars 2026 (politique d’erreur EBE, prérequis arbitrage snapshots Phase 3)*

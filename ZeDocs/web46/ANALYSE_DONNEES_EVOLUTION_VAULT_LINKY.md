# Analyse — Données d’évolution depuis le Vault (Linky)

**Date :** 14 mars 2026  
**Contexte :** Les blocs Évolution des cards Trésorerie, Encours, EBE et BFR sont en état **vide** car aucune série temporelle n’est encore branchée. Cette note analyse comment Linky récupère les données depuis le Vault et ce qu’il faut pour alimenter ces évolutions — en distinguant **branchement de séries existantes** et **besoin d’historisation**.

---

## 1. Comment Linky récupère les données (Vault = source exclusive)

**Règle d’architecture :** Toutes les données métier affichées par Linky (cockpit, KPIs, séries, agrégations) proviennent **exclusivement du Vault**. Aucune autre source ne doit fournir de données financières ou de pilotage affichées sur les cards. Exceptions documentées : DVIG (indicateur de santé Vault uniquement), DLP (domaine énergie, hors cockpit financier).

En pratique, Linky appelle soit :

- des **routes API Next.js** qui proxient le Vault (`/api/treasury`, `/api/dashboard-metrics`, `/api/payments-in`, `/api/payments-out`, etc.),  
- soit directement le Vault (côté serveur) via `VAULT_URL` et les chemins `/ui/aggregations/*`, `/ui/system/*`.

Les séries d’évolution (Phase 3) seront soit dérivées du Vault (comme EBE), soit lues depuis des **tables de snapshots alimentées par des jobs qui s’appuient sur le Vault**. Les paramètres communs sont : `tenant`, `date_debut`, `date_fin`, et souvent `granularity` (day | week | month), `company_id`.

---

## 2. Ce que le Vault expose aujourd’hui

### 2.1 Agrégations avec **série temporelle** (period + amount)

Le Vault renvoie déjà un champ **`series`** (tableau `{ period, amount }`) pour :

| Endpoint Vault | Réponse | Utilisation Linky |
|----------------|---------|-------------------|
| `GET /ui/aggregations/sales` | `SalesAggregationResponse` avec `series`, `granularity` | Business, Taxes (graphiques) |
| `GET /ui/aggregations/purchases` | Idem (série par période) | Business, Taxes |
| `GET /ui/aggregations/payments-in` | `PaymentsAggregationResponse` avec `series` | Flux net (Encaissements) |
| `GET /ui/aggregations/payments-out` | Idem | Flux net (Décaissements) |
| `GET /ui/aggregations/adjustments` (event_type = credit_note, refund…) | `AdjustmentsAggregationResponse` avec `series` | Notes de crédit, Remboursements |
| `GET /ui/aggregations/payroll` | `PayrollAggregationResponse` avec `series`, `granularity` | EBE (charges personnel) |

Ces endpoints prennent `date_debut`, `date_fin`, `granularity` ; le stock calcule les montants **par période** (jour / semaine / mois) et remplit `series`. **Aucun backfill** n’est nécessaire pour alimenter les graphiques d’évolution déjà présents (Flux net, Taxes, Business, Notes de crédit, Remboursements).

### 2.2 Agrégations **snapshot** (une seule valeur pour la période ou l’instant)

| Endpoint Vault | Réponse | Utilisation Linky |
|----------------|---------|-------------------|
| `GET /ui/aggregations/treasury` | Un seul état : `position`, `process`, `reconciliation_metrics`, etc. | Trésorerie, Paiements |
| `GET /ui/aggregations/ar-by-partner` | Totaux AR (open_amount, overdue_amount) + liste partenaires pour **une** date (`as_of_date`) | Encours, BFR (créances) |
| `GET /ui/aggregations/ap-by-partner` | Idem pour les dettes fournisseurs (AP) | BFR (dettes) |

- **Treasury** : la projection (`bank_reconciliation_projection`) et les sommes sont l’**état courant** (pas de filtre par date de fin de mois). Il n’existe pas aujourd’hui de série « trésorerie validée par mois ».
- **ar-by-partner / ap-by-partner** : le paramètre `as_of_date` est utilisé pour le calcul des **échus** (factures dont l’échéance est avant `as_of_date`). Les montants `amount_residual` lus viennent des **documents tels qu’ils sont aujourd’hui** dans le Vault. Il n’y a pas de reconstruction de l’état des créances/dettes **à une date passée** (pas d’historique ledger par date). Donc un seul « snapshot » par appel.

---

## 3. Nuance importante : backfill vs historisation

Le mot **« backfill »** est trompeur s’il n’est pas précisé. Pour **Encours**, **BFR** et en partie **Trésorerie**, on ne parle pas forcément d’un backfill rétroactif réellement faisable.

**Pourquoi :** si le Vault ne garde que les documents avec leur état courant, les résiduels actuels et un calcul snapshot au moment de l’appel, on ne peut pas reconstituer proprement l’encours exact au 31/01, le BFR exact au 28/02 ou la trésorerie validée exacte au 31/12 **simplement en rejouant l’état courant**.

Donc il faut distinguer :

- **Snapshotting prospectif** : à partir d’aujourd’hui, un job enregistre régulièrement (ex. fin de mois) la valeur courante dans une table d’historique. C’est **faisable et propre**.
- **Backfill rétroactif** : reconstituer les valeurs pour les mois passés. **Possible seulement si** une reconstruction fiable existe depuis des événements ou des soldes historisés. Sinon, « backfill » ne doit pas être compris comme promesse automatique de reconstitution historique.

Pour Encours et BFR en particulier : **backfill rétroactif** n’est pas garanti sans une vraie source d’historique (ledger, snapshots déjà enregistrés, etc.).

---

## 4. Par card : historisation ou branchement ?

### 4.1 Trésorerie (TresoreriePositionCard)

- **Données actuelles :** `/api/treasury` → Vault `GET /ui/aggregations/treasury` → un snapshot (position validée, taux de rapprochement, etc.).
- **Pour une évolution :** il faudrait une **série** « position validée (ou indicateur de couverture) par mois ».
- **Conclusion :** le Vault ne calcule pas aujourd’hui cette série. Le besoin est une **historisation de position** : soit un job récurrent qui enregistre (ex. en fin de mois) une valeur type `validated_balance` dans une table dédiée, soit une évolution du Vault qui alimente une table de snapshots. Un endpoint lit ensuite cette table et renvoie une série.

→ **Historisation de position** (snapshotting prospectif au minimum ; backfill rétroactif seulement si une reconstruction fiable existe).

### 4.2 Encours (EncoursCard)

- **Données actuelles :** `ar-by-partner` (via dashboard-metrics) → totaux `open_amount`, `overdue_amount` pour la période et `as_of_date` (souvent « aujourd’hui »).
- **Pour une évolution :** il faudrait « encours total (open_amount) à la fin de chaque mois ».
- **Conclusion :** avec le modèle actuel (documents avec `amount_residual` à jour), on n’a pas l’état des créances **à une date passée**. Le `as_of_date` sert au calcul des échus, pas à reconstruire un stock historique fidèle. Pour une série : **snapshotting prospectif** (enregistrer les totaux AR par mois à partir d’aujourd’hui) et/ou **reconstruction rétroactive** seulement si la donnée source le permet (historique de soldes, ledger, etc.).

→ **Historisation ou reconstruction fiable** ; pas de promesse de backfill rétroactif sans source historisée.


### 4.3 EBE (EbeCard)

- **Données actuelles :** dashboard-metrics agrège ventes, achats, avoirs, payroll ; EBE affiché = marge brute − charges personnel (ou proxy).
- **Séries déjà disponibles :** le Vault expose **sales**, **purchases** et **payroll** avec un champ **`series`** (granularity month).
- **Pour une évolution :** on peut dériver **EBE par période** = (ventes − achats) par mois, et si disponible (payroll avec série) : − charges personnel par mois.
- **Conclusion :** **Pas de backfill.** Il suffit d’ajouter une route API (ou d’enrichir dashboard-metrics / une route dédiée) qui :
  - appelle le Vault pour `sales`, `purchases` et éventuellement `payroll` sur la même période avec `granularity=month`,
  - construit une série `{ period, amount: sales - purchases [- payroll] }`,
  - et que la card EBE utilise pour alimenter le bloc Évolution (état **available** au lieu de **empty**).

→ **Pas d’historisation** ; simple **branchement** des séries déjà exposées (sales, purchases, payroll).

### 4.4 BFR (WorkingCapitalCard)

- **Données actuelles :** `ar-by-partner` (AR) et `ap-by-partner` (AP) → un snapshot chacun (totaux actuels).
- **Pour une évolution :** il faudrait « BFR (AR − AP) à la fin de chaque mois », donc des totaux AR et AP **par date**.
- **Conclusion :** même logique qu’Encours : comme le BFR dépend de deux stocks (AR − AP), s’il manque l’historique de ces stocks, il manque mécaniquement l’historique BFR. Il faut **snapshotting prospectif** et/ou **évolution Vault** (table de snapshots) ; backfill rétroactif seulement si reconstruction fiable possible.

→ **Historisation ou reconstruction fiable** (même contrainte qu’Encours).

---

## 5. Synthèse

**En une ligne :**  
**EBE relève d’un simple branchement de séries déjà exposées.**  
**Trésorerie, Encours et BFR relèvent d’un besoin d’historisation**, pas seulement d’un branchement front.

| Card        | Série déjà exposée par le Vault ? | Historisation / reconstruction nécessaire ? | Action recommandée |
|------------|------------------------------------|---------------------------------------------|---------------------|
| **Trésorerie** | Non (snapshot seul)                | Oui, **historisation** (position par mois)   | Snapshotting prospectif (ex. validated_balance en fin de mois) ; endpoint série ; backfill rétroactif seulement si reconstruction fiable. |
| **Encours**    | Non (snapshot ar-by-partner)       | Oui, **historisation ou reconstruction fiable** | Snapshotting prospectif des totaux AR ; backfill rétroactif seulement si source historisée (ledger, snapshots). |
| **EBE**        | Oui (sales, purchases, payroll avec `series`) | **Non**                             | Brancher les séries : route ou enrichissement qui dérive la série EBE ; card en état **available**. |
| **BFR**        | Non (snapshots AR + AP)            | Oui, **historisation ou reconstruction fiable** | Même contrainte qu’Encours (BFR = AR − AP) ; snapshotting prospectif ou évolution Vault. |

### Recommandation en 3 vitesses

| Vitesse | Objectif | Action |
|---------|----------|--------|
| **1 — Déblocage rapide** | Valeur immédiate sans chantier Vault lourd | Passer **EBE** en `available` en dérivant la série depuis sales, purchases, payroll. Meilleur ratio valeur / effort. |
| **2 — Conformité structurelle** | Respecter la charte sans « fausse » courbe | Garder **Trésorerie**, **Encours**, **BFR** avec bloc Évolution présent mais **`empty`** tant qu’aucune série fiable n’est disponible. |
| **3 — Infrastructure d’historisation** | Série fiable pour les 3 autres cards | Chantier Vault ou orchestration : historiser validated_balance, AR open_amount/overdue, AP open_amount, dériver BFR. Distinguer **prospectif** (facile et propre) et **rétroactif** (possible seulement si la donnée source le permet). |

La suite logique est décrite dans le **[plan d’implémentation data](./PLAN_IMPLEMENTATION_DATA_EVOLUTION_VAULT_LINKY_v1.0.md)** côté Vault / API Linky (Vitesse 1 en priorité, puis 3).

---

## 6. Références dans le code

- **Linky – appel Vault :**  
  - `units/dorevia-linky/app/api/dashboard-metrics/route.ts` (commonParams avec `granularity: "month"`, appels `/ui/aggregations/sales`, `purchases`, `payments-in`, `payments-out`, `treasury`, `ar-by-partner`, etc.)  
  - `units/dorevia-linky/app/api/treasury/route.ts` (proxy `/ui/aggregations/treasury`)  
  - `units/dorevia-linky/app/api/payments-in/route.ts`, `payments-out/route.ts` (proxy avec `granularity`, réponse Vault = `PaymentsAggregation` avec `series`)
- **Vault – réponses avec `series` :**  
  - `sources/vault/internal/models/aggregations.go` (`SalesAggregationResponse`, `PaymentsAggregationResponse`, `AdjustmentsAggregationResponse`, `PayrollAggregationResponse` avec `Series []SeriesPoint`)  
  - `sources/vault/internal/handlers/aggregations_treasury.go` (un seul snapshot, pas de série)  
  - `sources/vault/internal/storage/aggregations_ar_by_partner.go` (totaux pour un `as_of_date`, pas d’historique de soldes)

---

*Document d’analyse — Données d’évolution Vault / Linky — 14 mars 2026 (v1.1 : nuance backfill vs historisation, recommandation 3 vitesses)*

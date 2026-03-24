# Exécution tickets — Sprint 04 Lynki

**Fichier canonique :** `EXECUTION_TICKETS_SPRINT_04_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** exécution terrain — compléter **Owner** dans l'outil ; mettre à jour **Statut** au fil de l'eau.

**Sprint source :** [PLAN_SPRINT_04_LYNKI.md](PLAN_SPRINT_04_LYNKI.md) **v1.0**  
**Clôture Sprint 03 :** [RAPPORT_SPRINT_03_LYNKI.md](RAPPORT_SPRINT_03_LYNKI.md) **v1.1**  
**Rapport Sprint 04 (état plan / exécution) :** [RAPPORT_SPRINT_04_LYNKI.md](RAPPORT_SPRINT_04_LYNKI.md) **v1.0**  
**ADR extension :** [ADR_T19_TRIAL_BALANCE_EXTENSION.md](ADR_T19_TRIAL_BALANCE_EXTENSION.md)

**Objectif :** amener `trial_balance` d'un **pilote partiel** à une **restitution comptable crédible** — `complete=true` seulement si le critère produit est réellement atteint (§5 critère de complétude).

---

## 1. Vue d'ensemble

| Ticket | Objet | Lot | Priorité | Dépend de | Owner | Statut |
|--------|-------|-----|----------|-----------|-------|--------|
| **T21** | Migration `account_move_lines` + alimentation Vault | Vault / données | Critique | ADR T19 | _À assigner_ | todo |
| **T22** | Extension `TrialBalanceAggregation` + règle `complete` | Vault | Critique | T21 | _À assigner_ | todo |
| **T23** | Homogénéisation `referentiel_version` sur `lynki.accounting.*` | 4B | Haute | T16–T17 (S03) | _À assigner_ | todo |
| **T24** | Export BG — endpoint Vault + bouton Linky | 6 | Haute | T22 | _À assigner_ | todo |
| **T25** | Doc : ALIGNEMENT, backlog, prononcé Gate B / Gate C | transversal | Moyenne | T22–T24 | _À assigner_ | todo |

**Légende statut :** `todo` · `in_progress` · `blocked` · `done`

---

## 2. Tickets détaillés

### T21 — Migration `account_move_lines` + alimentation Vault

**But**  
Créer la table `account_move_lines` dans le Vault (migration SQL) et l'alimenter via le connecteur Odoo, de façon à couvrir un périmètre de journaux comptables plus large que les seules OD paie.

**Entrées**

* [ADR_T19_TRIAL_BALANCE_EXTENSION.md](ADR_T19_TRIAL_BALANCE_EXTENSION.md) — schéma cible et règles d'intégration
* Modèle Odoo `account.move.line` (champs : `account_code`, `debit`, `credit`, `date`, `company_id`, `journal_code`, `state`)
* Périmètre produit **arbitré** : quels journaux ? quels états ? quel tenant ?

**Actions**

* Rédiger `sources/vault/migrations/04x_account_move_lines.sql` (colonnes : `tenant`, `move_id`, `line_id`, `line_date`, `account_code`, `debit`, `credit`, `journal_code`, `company_id`, `state` — au minimum)
* Ajouter un connecteur Odoo ou étendre l'existant pour pousser les écritures `posted`
* Tester l'idempotence de l'ingestion (clé `tenant + move_id + line_id`)
* **Ne pas** coupler l'ingestion à la migration (`complete` reste `false` jusqu'à T22)

**Sorties**

* Table créée sans régression sur les tables existantes (`payroll_od_lines`, etc.)
* Lignes visibles en base pour le périmètre de recette défini

**DoD**

* Migration appliquée proprement
* Au moins N lignes ingérées sur le périmètre de recette (N = seuil fixé en grooming)
* Aucune régression `trial_balance` ni `general_ledger` existants
* Idempotence vérifiée

**Pistes fichiers**  
`sources/vault/migrations/04x_account_move_lines.sql` ; connecteur Odoo (`units/odoo/custom-addons/dorevia_vault_connector/models/`)

**Statut :** todo

---

### T22 — Extension `TrialBalanceAggregation` + règle `complete`

**But**  
Étendre la requête d'agrégation de la balance générale avec la nouvelle source `account_move_lines`, et appliquer la règle de `complete=true` selon le **critère produit explicite** défini en §5.

**Entrées**

* T21 livré et validé
* Critère de complétude §5 **figé**
* `sources/vault/internal/storage/trial_balance.go` (code existant Sprint 02)

**Actions**

* Ajouter une branche `UNION ALL` (ou jointure) sur `account_move_lines` dans `TrialBalanceAggregation`
* Mettre à jour `coverage` → chaîne reflétant toutes les sources actives (ex. `"payroll_od_lines+account_move_lines"`)
* Appliquer la règle : `complete=true` **uniquement si** les conditions §5 sont toutes satisfaites
* Adapter le handler `accounting_trial_balance.go` si nécessaire (aucune casse de contrat JSON)
* **Aucune régression** sur `general_ledger` ni sur les routes existantes

**Sorties**

* `trial_balance` agrège les deux sources
* `coverage` honnête
* `complete` piloté par la règle produit

**DoD**

* Critère `complete` appliqué **strictement** selon §5 (pas de `true` précipité)
* `coverage` reflète exactement les sources actives
* Tests d'appel end-to-end OK sur périmètre de recette
* Pas de stub silencieux côté Linky

**Pistes fichiers**  
`sources/vault/internal/storage/trial_balance.go` ; `sources/vault/internal/handlers/accounting_trial_balance.go`

**Statut :** todo

---

### T23 — Homogénéisation `referentiel_version` sur `lynki.accounting.*`

**But**  
S'assurer que toutes les restitutions `lynki.accounting.*` courantes exposent `referentiel_version` de façon cohérente — au-delà de `trial_balance` (Sprint 02) et `general_ledger` (Sprint 03).

**Entrées**

* [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) **v1.1** (version de référence)
* Inventaire des restitutions actives

**Actions**

* Inventorier tous les handlers Vault et routes Linky exposant une restitution `lynki.accounting.*`
* Vérifier la présence et la cohérence de `referentiel_version` dans chaque réponse JSON
* Corriger / compléter les handlers manquants
* S'assurer que la **constante** `referentielVersionLynki` est unique et partagée (éviter la désynchronisation)
* Documenter le mécanisme de bump (qui décide, comment propager)

**Sorties**

* Champ `referentiel_version` présent et cohérent sur toutes les restitutions `lynki.accounting.*`
* Constante partagée ou mécanisme documenté

**DoD**

* Inventaire exhaustif produit
* Aucune restitution `lynki.accounting.*` sans `referentiel_version`
* Valeur alignée avec [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) en vigueur
* Mécanisme de bump documenté (même brièvement)

**Pistes fichiers**  
`sources/vault/internal/handlers/` (tous handlers `accounting_*.go`) ; `sources/vault/internal/handlers/accounting_trial_balance.go` (constante `referentielVersionLynki`)

**Statut :** todo

---

### T24 — Export BG (endpoint Vault + bouton Linky)

**But**  
Permettre à l'utilisateur de télécharger les données de la balance générale depuis la Synthèse — **uniquement depuis le Vault** (doctrine : pas d'export depuis un stub).

**Entrées**

* T22 stable et recetté
* Format décidé en grooming : CSV (recommandé pour portabilité) ou JSON téléchargeable

**Actions**

* Ajouter `GET /api/accounting/trial-balance/export` dans le Vault (handler Go) — même filtres que `trial_balance`, réponse `Content-Type: text/csv` ou fichier JSON
* Ajouter route Next.js `/api/accounting/trial-balance/export` dans Linky (proxy Vault, refus si `data_source=stub`)
* Ajouter un bouton **"Exporter"** dans `AccountingSummaryView` (visible seulement si `data_source === "vault"`)
* Définir et documenter une **limite de lignes** (ex. 10 000 max) avec message explicite si dépassée

**Sorties**

* Fichier téléchargeable depuis Linky
* Export refusé si Vault indisponible (pas d'export depuis stub)
* Colonnes minimales : compte, libellé, débit, crédit, solde (+ référentiel_version + coverage en métadonnée)

**DoD**

* Téléchargement fonctionnel en env de référence
* Refus explicite si Vault indisponible (pas d'export silencieux de stub)
* Limite de lignes documentée et visible dans l'UI
* Colonnes cohérentes avec la BG affichée

**Pistes fichiers**  
`sources/vault/internal/handlers/accounting_trial_balance_export.go` (nouveau) ; `sources/vault/internal/server/replay.go` (enregistrement) ; `units/dorevia-linky/app/api/accounting/trial-balance/export/route.ts` (nouveau) ; `units/dorevia-linky/components/AccountingSummaryView.tsx`

**Statut :** todo

---

### T25 — Doc : ALIGNEMENT, backlog, prononcé Gate B / Gate C

**But**  
Réconcilier la documentation avec ce qui a été livré ; prononcer **explicitement** Gate B (si T22 atteint le critère §5) ou documenter la condition restante.

**Entrées**

* T22 à T24 terminés ou statés
* Critère §5 — verdict `complete`

**Actions**

* Mettre à jour [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) **v1.6** : matrice (BG étendue, export, `referentiel_version` homogène, Gate B)
* Mettre à jour [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v1.4** : état post-Sprint 04, table sprints
* Rédiger [RAPPORT_SPRINT_04_LYNKI.md](RAPPORT_SPRINT_04_LYNKI.md) en clôture
* Prononcer **Gate B** : atteinte **si** `complete=true` ET export disponible ET `referentiel_version` homogène ; sinon documenter la condition manquante
* Mettre à jour **Gate C** : renforcée si export GL ou page dédiée livrés

**Sorties**

* Traçabilité doc ↔ code à jour
* Gate B prononcée ou condition de prononcé explicitement documentée

**DoD**

* ALIGNEMENT / backlog à jour
* Gate B : prononcée ou conditionnée avec critère daté
* Renvois croisés cohérents

**Statut :** todo

---

## 3. Ordre d'attaque recommandé

1. **T21** — verrou technique du sprint : migration + alimentation ; rien de T22 sans données réelles en base
2. **T22** — extension agrégation + règle `complete` ; ne pas mettre `complete=true` avant que le §5 soit satisfait
3. **T23** — peut démarrer en parallèle de T21 (pas de dépendance données), idéalement avant T24
4. **T24** — export seulement une fois T22 stable et recetté
5. **T25** — clôture documentaire et prononcé Gate B en dernier

*Variante terrain :* **T23** peut être traité en parallèle de **T21** dès le début du sprint (chantier code indépendant des données).

---

## 4. Points de contrôle sprint

| CP | Critère | Responsable |
|----|---------|-------------|
| **CP1** | Table `account_move_lines` créée et lignes ingérées sur périmètre de recette | T21 |
| **CP2** | `trial_balance` agrège les deux sources ; `coverage` reflète les sources actives | T22 |
| **CP3** | `complete` n'est `true` que si **tous** les critères §5 sont satisfaits | T22 |
| **CP4** | Toutes les restitutions `lynki.accounting.*` exposent `referentiel_version` | T23 |
| **CP5** | Export téléchargeable ; refusé si Vault absent | T24 |
| **CP6** | Gate B prononcée ou conditionnée explicitement dans la doc | T25 |

---

## 5. Critère de complétude (`complete=true`) — règle produit

> **`complete=true` est interdit tant qu'une seule des conditions ci-dessous n'est pas satisfaite.**

| # | Condition | Vérifiable par |
|---|-----------|----------------|
| C1 | Le périmètre tenant est **défini et borné** (quels tenants sont couverts) | Doc + test |
| C2 | La période couverte est **explicite** (borne basse d'ingestion connue et documentée) | Doc + requête |
| C3 | Le périmètre société est **défini** (toutes les `company_id` pertinentes ou filtre documenté) | Doc + requête |
| C4 | Les écritures du périmètre supporté sont **posted et ingérées** dans le Vault | Requête `account_move_lines` |
| C5 | Il n'y a **plus de dépendance au stub** en environnement de référence (`LINKY_ACCOUNTING_STRICT=1`) | Test env de référence |

**En pratique :** la réunion de grooming ou la revue de T22 doit valider chaque condition avant d'activer `complete=true`. Le résultat de cette validation doit être tracé dans le rapport de sprint.

---

## 6. Graphe de dépendances

```
T21 (migration + ingestion)
  └──> T22 (agrégation étendue + règle complete)
         └──> T24 (export BG — stable avant d'exporter)
                └──> T25 (doc + Gate B)

T23 (referentiel_version — indépendant des données)
  ──> T25 (doc + Gate B)
```

---

*Document d'exécution — ne remplace pas [PLAN_SPRINT_04_LYNKI.md](PLAN_SPRINT_04_LYNKI.md) (gouvernance lots, DoD officiels).*

# PLAN_IMPLEMENTATION_VAULT_EBE_OD_PAYROLL_v1.0

**Document :** `PLAN_IMPLEMENTATION_VAULT_EBE_OD_PAYROLL_v1.0.md`  
**Répertoire :** `ZeDocs/web50/`  
**Date :** 2026-03-15  
**Référence :** `SPEC_BACKEND_VAULT_EBE_OD_PAYROLL_v1.0`  
**Produit :** Dorevia Vault  
**Objet :** Plan d’implémentation — intégration des OD de paie dans l’agrégat payroll EBE  
**Statut :** Validé pour exécution — v1.0 gelée  
**Implémentation :** 2026-03-15 — toutes les tâches du plan ont été réalisées (backend Vault, migration 043, ingestion, agrégation, API, logs, tests, backfill, commande migrate).

---

### Validation

Le plan `PLAN_IMPLEMENTATION_VAULT_EBE_OD_PAYROLL_v1.0` est **validé pour exécution**. Il est aligné avec la spec backend normative, couvre le flux de données OD, la stratégie d’agrégation `payslip` > `od` > `none`, les règles comptables de net signé, l’exposition API de `payroll_source`, ainsi que les cas de non-régression et d’extourne. Document ZeDocs prêt à servir de référence de dev, base de revue technique et support de suivi d’exécution.

---

## 1. Vue d’ensemble

Ce plan découpe l’implémentation du **Lot 2** (backend Vault) du ticket LINKY-EBE-OD-01 en phases et tâches exécutables, en restant aligné sur la spec normative et sur l’architecture actuelle (handler `GET /ui/aggregations/payroll`, storage `PayrollAggregation`).

**Principe :** ajouter une source de repli **OD comptables** (comptes 641\*, 645\*) sans casser la source **payslip** existante, avec priorité payslip puis OD puis `none`, et exposition de `payroll_source`.

---

## 2. Prérequis et choix d’architecture données

### 2.1 Données OD à disposition du Vault

La spec (§8) suppose que le Vault peut exploiter des lignes d’écriture comptable (date, code compte, débit, crédit, écriture postée). Deux options possibles :

| Option | Description | Impact plan |
|--------|-------------|-------------|
| **A — Ingestion** | Un connecteur (Odoo / DVIG) pousse les lignes pertinentes (ex. événement `accounting_line.posted` ou batch OD paie) vers le Vault ; le Vault les persiste puis les agrège. | Nécessite : schéma de stockage des lignes, endpoint ou événement d’ingestion, éventuellement job de sync initiale pour laplatine2026. |
| **B — Lecture externe** | Le Vault interroge une API ou une base Odoo (ou un miroir) pour lire les `account.move.line` à la demande. | Nécessite : client de lecture, configuration par tenant, pas de table dédiée dans le Vault. |

**Recommandation :** Option A (ingestion) pour rester cohérent avec le modèle actuel (documents / événements persistés). Le plan ci‑dessous suppose l’**Option A** ; si Option B est retenue, adapter la Phase 1 en conséquence (lecture à la volée au lieu de tables dédiées).

### 2.2 Dépendances

- Spec **SPEC_BACKEND_VAULT_EBE_OD_PAYROLL_v1.0** validée.
- Décision produit sur le flux de données OD (qui pousse quoi vers le Vault, et sous quel format).
- Pour le test de non‑régression : tenant(s) avec données **payslip** existantes.
- Pour le test OD : tenant **laplatine2026** avec OD de paie déjà vérifiées (21 500 € au 28/02/2026).

---

## 3. Phases et tâches

### Phase 1 — Données OD : stockage ou source

**Objectif :** que le Vault dispose des lignes comptables éligibles (641\*, 645\*) par tenant, période et date comptable.

#### 1.1 Définir le modèle de données (si Option A)

- [x] **T1.1** Créer un modèle (table ou structure) pour les lignes OD paie :
  - tenant, company_id (optionnel)
  - move_id / line_id (identifiants Odoo)
  - date (date comptable)
  - account_code (ex. `641100`, `645100`)
  - debit, credit
  - currency (optionnel)
  - state = posted
- [x] **T1.2** Prévoir une migration SQL (création table `payroll_od_lines` ou équivalent), index (tenant, date, account_code), et **contrainte unique ou index unique sur (`tenant`, `move_id`, `line_id`)** pour garantir l’idempotence technique en stockage.
- [x] **T1.3** Documenter le contrat d’ingestion (champs obligatoires, idempotence si rejoué).

#### 1.2 Ingestion des lignes OD (Option A)

- [x] **T1.4** Créer un endpoint ou un handler d’événement pour recevoir les lignes (ex. `POST /api/v1/payroll-od-lines` ou traitement d’un type d’événement replay).
- [x] **T1.5** Valider et filtrer les lignes : uniquement comptes `641*` et `645*` ; **une ligne OD n’est éligible que si son écriture parent est au statut `posted`** ; rejeter ou ignorer `421*` / `431*`.
- [x] **T1.6** Écrire les lignes éligibles en base (idempotence par move_id + line_id si applicable).
- [x] **T1.7** (Optionnel) Script ou job de backfill pour laplatine2026 : lecture des OD depuis Odoo (ou export) et envoi vers l’ingestion Vault.

**Livrable Phase 1 :** le Vault peut lire (ou a ingéré) les lignes 641/645 par tenant et période.

---

### Phase 2 — Logique d’agrégation payroll

**Objectif :** calculer la composante « charges de personnel » à partir des payslips **ou** des OD, sans double comptage.

#### 2.1 Sous-agrégat Payslip (existant)

- [x] **T2.1** Isoler ou identifier la logique actuelle dans le storage : `PayrollAggregation` ou équivalent qui lit les documents `odoo_model = 'hr.payslip'` et produit total + série.
- [x] **T2.2** Extraire cette logique dans une fonction claire `PayrollFromPayslips(ctx, tenant, from, to, granularity, companyID)` retournant (total, count, series, err). Ne pas modifier le comportement métier.

#### 2.2 Sous-agrégat OD

- [x] **T2.3** Implémenter `PayrollFromAccountingOD(ctx, tenant, from, to, granularity, companyID)` :
  - lire les lignes éligibles (641\*, 645\*) dans la période (date comptable), **uniquement si l’écriture parent est `posted`** ;
  - pour chaque ligne : `net_signed = debit - credit` ;
  - exclure explicitement les comptes 421\*, 431\* (ne pas les lire ou les filtrer) ;
  - agréger par période selon granularity (month / week / day) pour la série ;
  - **`count` = nombre d’écritures contributives distinctes (`move_id` distincts)**, et non nombre de lignes (pour La Platine YTD 28/02, count = 2) ;
  - les écritures dont la somme nette éligible sur la période vaut 0 peuvent être ignorées dans `count`, afin d’éviter de compter des OD totalement neutralisées par correction ;
  - retourner total, count, series, et détail 641 vs 645 si utile.
- [x] **T2.4** Paramétriser les préfixes de comptes (include: `["641","645"]`, exclude: `["421","431"]`) pour extensibilité (§11.4 spec).

#### 2.3 Orchestrateur

- [x] **T2.5** Implémenter l’orchestrateur `PayrollAggregation` (ou refactoriser l’existant) :
  1. Appeler `PayrollFromPayslips`.
  2. **En v1.0, la présence d’au moins une donnée payslip valide sur la période force l’agrégat principal à utiliser exclusivement la source `payslip`, même si des lignes OD éligibles existent également.** Si résultat payslip présent (count > 0 et total cohérent) → retenir cette source ; `payroll_source = "payslip"` ; ne pas additionner OD.
  3. Sinon appeler `PayrollFromAccountingOD`.
  4. Si résultat OD présent → `payroll_source = "od"` ; utiliser total et série OD.
  5. Sinon → `payroll_source = "none"` ; total = 0, count = 0 ; `payroll_unavailable = true`.
- [x] **T2.6** En cas de coexistence payslip + OD (payslip présent) : retenir uniquement payslip pour le total principal ; **les OD coexistantes sont ignorées pour le total mais peuvent être journalisées pour contrôle** (spec §12.4, §13).

**Livrable Phase 2 :** une seule source utilisée par période, pas de double comptage, priorité payslip.

---

### Phase 3 — Contrat API et réponse enrichie

**Objectif :** exposer `payroll_source`, `payroll_unavailable` et optionnellement `breakdown` sans casser les clients existants.

#### 3.1 Modèle de réponse

- [x] **T3.1** Étendre `PayrollAggregationResponse` (ou équivalent) avec :
  - `payroll_source` : `"payslip" | "od" | "none"`
  - `payroll_unavailable` : booléen (true si source = none ou aucune donnée)
  - `breakdown` (optionnel) : `{ "accounts_641": float, "accounts_645": float }` pour la source OD.
- [x] **T3.2** Conserver tous les champs existants : `total_charges` / `total`, `payslip_count` / `count`, `currency`, `from`, `to`, `granularity`, `series`. Adapter les noms si besoin pour compatibilité (ex. `total` aligné avec la spec §9.2).

#### 3.2 Handler HTTP

- [x] **T3.3** S’assurer que `PayrollAggregationHandler` passe les nouveaux champs dans la réponse JSON.
- [x] **T3.4** Vérifier que les consommateurs Linky (GET /api/payroll, GET /api/ebe-evolution) acceptent la réponse enrichie sans rupture (champs additionnels uniquement).

**Livrable Phase 3 :** `GET /ui/aggregations/payroll` renvoie `payroll_source` et, si source OD, éventuellement `breakdown`.

---

### Phase 4 — Observabilité et tests

**Objectif :** traçabilité de la source et des totaux ; validation des AC.

#### 4.1 Logging

- [x] **T4.1** Logger à chaque agrégation payroll (au moins en debug ou info) : tenant, période, source retenue, total, count, et si OD : total_641, total_645.
- [x] **T4.2** Logger explicitement le cas « payslip et OD présents » (source retenue = payslip) pour le support (spec §13).

#### 4.2 Tests

- [x] **T4.3** Test unitaire ou intégration : période avec uniquement OD (lignes 641/645) → total attendu, `payroll_source = "od"`.
- [x] **T4.4** Test : période avec uniquement payslips → comportement identique à l’existant, `payroll_source = "payslip"`.
- [x] **T4.5** Test : période avec payslip + OD → total = total payslip uniquement, `payroll_source = "payslip"`.
- [x] **T4.6** Test : période sans aucune donnée → total = 0, `payroll_source = "none"`, `payroll_unavailable = true`.
- [x] **T4.7** Test : lignes 421/431 présentes dans les données → non incluses dans le total.
- [x] **T4.8** Test de régression : tenant La Platine, période 2026-01-01 / 2026-02-28 → total = **21 500,00 €**, `payroll_source = "od"` (après ingestion des OD).
- [x] **T4.9** Test extourne / correction : une écriture OD de correction ou extourne crédite un compte 641\* ou 645\* → le total est diminué correctement via la règle `net_signed = debit - credit`, sans double comptage ni anomalie de `count`.

**Livrable Phase 4 :** logs exploitables et suite de tests couvrant les AC de la spec (§14) et le cas extourne (règle net signé).

---

## 5. Ordre d’exécution recommandé

1. **Décision données** : valider Option A (ingestion) ou B (lecture externe) et le format des lignes.
2. **Phase 1** : stockage ou source des lignes OD (ingestion + backfill laplatine2026 si Option A).
3. **Phase 2** : sous-agrégats + orchestrateur (T2.1 → T2.6).
4. **Phase 3** : modèle de réponse + handler (T3.1 → T3.4).
5. **Phase 4** : logs + tests (T4.1 → T4.9).

Les phases 2 et 3 peuvent être partiellement parallélisées (modèle de réponse défini tôt pour guider l’orchestrateur).

---

## 6. Récapitulatif des livrables

| Livrable | Contenu |
|----------|---------|
| **Données OD** | Table ou source des lignes 641/645 par tenant et date ; ingestion ou lecture opérationnelle. |
| **PayrollFromPayslips** | Fonction dédiée (existant refactoré), inchangée métier. |
| **PayrollFromAccountingOD** | Nouvelle fonction : net signé, filtres 641/645, exclusion 421/431, série par granularity. |
| **PayrollAggregation** | Orchestrateur : priorité payslip → od → none ; pas de double comptage. |
| **API enrichie** | `GET /ui/aggregations/payroll` avec `payroll_source`, `payroll_unavailable`, `breakdown` (optionnel). |
| **Logs** | Source, totaux, cas coexistence documentés. |
| **Tests** | AC1 à AC7 couverts ; régression La Platine 21 500 € ; cas extourne / correction (net signé). |

---

## 7. Définition of Done (rappel)

Conformément à la spec §15, le ticket backend est réputé terminé lorsque :

- l’agrégat payroll consomme les OD comptables (641\*, 645\*) ;
- les comptes 421\* et 431\* sont exclus ;
- la règle net signé est en place ;
- l’API expose `payroll_source` ;
- la chaîne EBE utilise la source `od` en l’absence de `payslip` ;
- le cas La Platine retourne **21 500,00 €** au 28/02/2026 ;
- aucun double comptage lorsque des payslips existent ;
- les logs permettent d’expliquer la source et le total.

---

## 8. Décisions techniques verrouillées

Avant exécution, les règles suivantes sont fixées pour éviter toute ambiguïté backend / front :

- **`count`** = nombre d’écritures contributives distinctes (`move_id`), et non nombre de lignes.
- **Éligibilité OD :** une ligne OD n’est prise en compte que si l’écriture parent est au statut `posted`.
- **Coexistence payslip + od (v1.0) :** la source retenue est exclusivement `payslip` ; les OD sont ignorées pour le total principal (et peuvent être journalisées pour contrôle).
- **OD neutralisées :** les écritures dont la somme nette éligible sur la période vaut 0 peuvent être exclues du `count`.

---

## 9. Backlog technique — tâches dev ordonnancées (TODO exécutable v1.0)

Ordre recommandé pour un déroulé dev séquentiel :

| # | Tâche | Phase | Dépendances |
|---|--------|-------|-------------|
| 1 | Migration SQL : table `payroll_od_lines` + index + contrainte unique (`tenant`, `move_id`, `line_id`) | 1 | — |
| 2 | Handler ingestion : endpoint ou événement pour recevoir les lignes OD (validation 641/645, posted) | 1 | 1 |
| 3 | Storage OD : lecture des lignes par tenant / période ; idempotence écriture | 1 | 1, 2 |
| 4 | Refactor : extraire `PayrollFromPayslips` (existant), signature et retour explicites | 2 | — |
| 5 | Implémentation `PayrollFromAccountingOD` : net signé, count = move_id distinct, breakdown 641/645 | 2 | 3 |
| 6 | Orchestrateur : `PayrollAggregation` avec priorité payslip → od → none ; log coexistence | 2 | 4, 5 |
| 7 | Enrichissement réponse API : champs `payroll_source`, `payroll_unavailable`, `breakdown` | 3 | 6 |
| 8 | Tests : AC1–AC7 + régression La Platine 21 500 € + cas extourne (T4.9) | 4 | 6, 7 |

Optionnel (selon besoin métier) : backfill laplatine2026 (script ou job d’ingestion des OD existantes) après 2–3.

---

## 10. Suite après v1.0

- **Frontend Linky :** adapter la microcopy de la card EBE en fonction de `payroll_source` (message distinct pour `od` vs `none` vs `payslip`) une fois l’API déployée.
- **Optionnel :** indicateur dans l’UI (ex. « Source : OD comptables » / « Source : bulletins ») pour transparence utilisateur.

---

Le document `PLAN_IMPLEMENTATION_VAULT_EBE_OD_PAYROLL_v1.0` est validé pour exécution et gelé en v1.0. Il constitue la référence backend de mise en œuvre du Lot 2 du ticket LINKY-EBE-OD-01.

*ZeDocs/web50 — SPEC_BACKEND_VAULT_EBE_OD_PAYROLL_v1.0 — Décisions techniques : §8. Backlog exécutable : §9.*

# Rapport de réalisation — Sprint 02 Lynki (Phase 2)

**Fichier canonique :** `RAPPORT_SPRINT_02_LYNKI.md`  
**Sprint de référence :** [PLAN_SPRINT_02_LYNKI.md](PLAN_SPRINT_02_LYNKI.md) **v1.1**  
**Exécution terrain :** [EXECUTION_TICKETS_SPRINT_02_LYNKI.md](EXECUTION_TICKETS_SPRINT_02_LYNKI.md) **v1.1**  
**Date de clôture :** 20 mars 2026  
**Rédacteur :** équipe Lynki Phase 2  
**Version rapport :** 1.1 — mars 2026  
**Révision 1.1 :** **vocabulaire produit** — formules **§1.1** (*BG pilote / périmètre partiel*) ; **§11** checks recette (`data_source`, `complete`, `coverage`, `referentiel_version`).  
**Statut global :** **Sprint livré techniquement — cœur Vault BG + Linky (T11–T13) ; Lot 3 BG→GL (T14) reporté ; recette / doc (T10, T15) à finaliser selon environnement**

---

## 1. Résumé exécutif

### 1.1 Formulation produit (promesse — UI et comité)

Tant que la couverture reste limitée à l’agrégat **`payroll_od_lines`** (OD paie), **ne pas** laisser entendre qu’il s’agit d’une balance générale **complète** au sens métier.

**Formules recommandées (équivalentes) :**

* **Balance générale — périmètre partiel (OD paie)**  
* **Balance générale pilote — couverture partielle**

Le champ API **`complete: false`** et, le cas échéant, **`coverage`** matérialisent cette limite ; l’UI Lynki affiche un badge **Partiel** lorsque des lignes sont présentes sans complétude.

### 1.2 Objectif et résultat synthétique

Le Sprint 02 visait à **matérialiser la doctrine Vault** sur la balance générale (`lynki.accounting.trial_balance`), à **traiter le stub** sans ambiguïté côté Linky, à **amorcer le 4B** (version référentiel), et à **ouvrir le Lot 3** (premier BG → GL).

**Réalisé dans le code :**

* **T11** — Endpoint Vault **`GET /api/accounting/trial-balance`** : payload aligné sur le contrat Lynki ; **première restitution réelle**, **partielle** : agrégation depuis la base Vault (table **`payroll_od_lines`** — OD paie). Voir **§1.1** (pas de « BG complète » au sens métier tant que les sources ne sont pas étendues).
* **T12** — Linky consomme la réponse Vault lorsqu’elle est joignable ; **stub non silencieux** : champs **`data_source`** (`vault` | `stub`) + header **`X-Lynki-Accounting-Source`** ; mode **`LINKY_ACCOUNTING_STRICT`** pour l’environnement de référence (502 si Vault indisponible).
* **T13** — **Version référentiel** exposée sur la réponse Vault (`referentiel_version: "1.1"`) et **répercutée** par la route Linky si présente (sinon fallback documenté).

**Non réalisé dans ce sprint (reporté) :**

* **T14** — `lynki.accounting.general_ledger`, route Vault, premier lien UI **BG → GL** (filtres compte + période + périmètre) : **hors périmètre livré** → **Sprint 03** (voir §9).

**À finaliser hors code ou en parallèle :**

* **T10** — Recette Sprint 01 (R1–R7) / prononcé **Gate A** : dépend de l’environnement et de la trace dans [RAPPORT_SPRINT_01_LYNKI.md](RAPPORT_SPRINT_01_LYNKI.md) §4.
* **T15** — **Alignement + backlog** synchronisés avec ce rapport (**v1.4.3** / **v1.2**) ; libellé produit **§1.1** également porté sur le **titre du bloc** BG dans Lynki (`AccountingSummaryView`).

| Objectif sprint (plan §1) | Résultat |
|---------------------------|----------|
| Vault réel `trial_balance` | ✅ Handler + route HTTP canonique |
| Retrait stub « silencieux » / env de référence | ✅ `data_source` + header + option `LINKY_ACCOUNTING_STRICT` |
| Lot **4B** (version référentiel) | ✅ Sur `trial_balance` (champ + alignement Linky) |
| Lot **3** BG → GL | ⏳ **Non livré** — T14 reporté |
| Gate B « Synthèse exploitable données réelles » | 🟡 **Non atteint à ce stade** — BG pilote réel Vault, couverture métier incomplète (voir §1.1, §8) |

---

## 2. Tickets — état à la clôture

| # | Titre | Lot | Statut | Commentaire |
|---|--------|-----|--------|---------------|
| **T10** | Clôture recette T3 / Gate A (Sprint 01) | 1 | ⏳ **Environnement** | À cocher dans le rapport S01 §4 quand la recette est passée. |
| **T11** | Vault `GET /api/accounting/trial-balance` | Vault | ✅ **done** | `TrialBalanceHandler` + `TrialBalanceAggregation` (DB). |
| **T12** | Linky — réel vs stub explicite | 4A | ✅ **done** | Route Next + UI (badges stub / partiel / erreur HTTP). |
| **T13** | 4B — `referentiel_version` sur `trial_balance` | 4B | ✅ **done** | Réponse Vault + propagation Linky. |
| **T14** | BG → GL minimal (`general_ledger`) | 3 | ⏳ **Reporté** | Pas d’endpoint GL ni drill UI dans ce livrable. |
| **T15** | Doc / alignement / backlog | transversal | ✅ **done** (doc) | [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) **v1.4.3** ; [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v1.2** ; [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) (renvois sprints) ; UI Lynki : libellé **§1.1**. |

---

## 3. Fichiers créés ou modifiés

### Nouveaux fichiers (Vault)

| Fichier | Description |
|---------|-------------|
| `sources/vault/internal/storage/trial_balance.go` | Agrégation par compte sur `payroll_od_lines` ; `TrialBalanceAggregationResult` (`complete`, `coverage`). |
| `sources/vault/internal/handlers/accounting_trial_balance.go` | `GET /api/accounting/trial-balance` — JSON `lynki.accounting.trial_balance` + `referentiel_version`. |

### Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `sources/vault/internal/server/replay.go` | Enregistrement `GET /api/accounting/trial-balance` (après garde `db != nil`). |

### Fichiers modifiés (Linky)

| Fichier | Modification |
|---------|--------------|
| `units/dorevia-linky/app/api/accounting/trial-balance/route.ts` | `data_source`, header `X-Lynki-Accounting-Source`, propagation `referentiel_version` / `coverage`, `LINKY_ACCOUNTING_STRICT`. |
| `units/dorevia-linky/components/AccountingSummaryView.tsx` | Distinction stub / vide / lignes ; badge **Partiel** ; titre bloc **§1.1** (*Balance générale — périmètre partiel (OD paie)*) ; erreur si `!r.ok`. |

---

## 4. Contrat et paramètres d’appel

**Vault — `GET /api/accounting/trial-balance`**

* Query : **`tenant`** (requis), **`date_debut`**, **`date_fin`** (requis, `YYYY-MM-DD`), **`company_id`** (optionnel).
* Réponse JSON (extrait) :

```json
{
  "restitution_id": "lynki.accounting.trial_balance",
  "referentiel_version": "1.1",
  "tenant": "<tenant>",
  "company_id": null,
  "period_from": "YYYY-MM-DD",
  "period_to": "YYYY-MM-DD",
  "generated_at": "<RFC3339>",
  "lines": [ { "account_code": "641100", "account_name": "641100", "debit": 0, "credit": 0, "balance": 0 } ],
  "vault_freshness": "aggregated:payroll_od_lines",
  "complete": false,
  "coverage": "payroll_od_lines"
}
```

> **`restitution_id`** = `"lynki.accounting.trial_balance"` — identifiant **canonique** (distinct du chemin HTTP `GET /api/accounting/trial-balance`).

**Linky — variables d’environnement**

| Variable | Rôle |
|----------|------|
| `VAULT_URL` | Base URL du Vault (ex. `http://vault:8080`). |
| `LINKY_ACCOUNTING_STRICT` | `1` / `true` : pas de stub si Vault injoignable → **502** explicite (env de référence). |

---

## 5. Décisions prises pendant le sprint

### D1 — Couverture données balance (source `payroll_od_lines`)

**Décision :** la première implémentation Vault agrège les lignes **`payroll_od_lines`** (OD paie 641\*/645\*). La réponse est **réelle** (doctrine Vault, pas de contournement amont côté Linky pour ce flux) mais **`complete: false`** : il s’agit d’une **balance générale pilote — couverture partielle** (voir **§1.1**), **pas** d’une BG métier complète jusqu’à extension des sources.

**Conséquence UX :** libellés produit **§1.1** ; badge **Partiel** dans Linky lorsque des lignes sont affichées avec `complete === false`.

### D2 — Stub jamais silencieux

**Décision :** toute réponse de secours côté Linky porte **`data_source: "stub"`** et le header **`X-Lynki-Accounting-Source: stub`**. En **strict**, absence de Vault → erreur HTTP **502**, pas de JSON « gentil » trompeur.

### D3 — T14 reporté

**Décision :** le drill **BG → GL** et le contrat **`lynki.accounting.general_ledger`** sont **hors périmètre** de ce rapport de clôture ; priorité **Sprint 03** ([PLAN_SPRINT_02_LYNKI.md](PLAN_SPRINT_02_LYNKI.md) §8).

---

## 6. Évaluation des risques (plan sprint)

| Risque plan | Matérialisé ? | Résolution |
|-------------|---------------|------------|
| Données BG partielles | Oui — périmètre `payroll_od_lines` | `complete: false` + `coverage` + UI « Partiel » |
| 4B trop large | Non | Limité à `trial_balance` + version `1.1` |

---

## 7. Écarts par rapport au plan §7 (sortie attendue)

| Attendu fin sprint | Écart |
|--------------------|--------|
| `trial_balance` réel + Linky branché | ✅ |
| Stub neutralisé en env de référence | ✅ Via **strict** + traçabilité `data_source` |
| Version référentiel traçable | ✅ |
| Premier drill **BG → GL** | ❌ **Non livré** — T14 |

---

## 8. Gates — état

| Gate | Commentaire |
|------|-------------|
| **Gate A** (Sprint 01) | Toujours conditionnée à la recette T3 (R1–R7) — voir [RAPPORT_SPRINT_01_LYNKI.md](RAPPORT_SPRINT_01_LYNKI.md). |
| **Gate B** (Synthèse exploitable) | **Non atteint à ce stade** : bloc BG pilote réel Vault, **couverture métier incomplète** (`payroll_od_lines` — voir §1.1). |
| **Gate C** (traçabilité + chaîne de preuve) | **Amorcée** (version référentiel + flux Vault) ; **non atteinte** sans **T14** (GL). |

---

## 9. Recommandations — Sprint 03

1. Suivre **`PLAN_SPRINT_03_LYNKI.md`** : **T14** (`lynki.accounting.general_ledger`, drill **BG → GL**) + **extension couverture** balance au-delà de `payroll_od_lines`.
2. Finaliser **T10** / **T15** si non fait : matrice alignement + backlog.

---

## 10. Points de contrôle sprint (rappel [EXECUTION_TICKETS_SPRINT_02_LYNKI.md](EXECUTION_TICKETS_SPRINT_02_LYNKI.md))

| CP | Critère | État |
|----|---------|------|
| CP1 | T11 répond correctement | ✅ Code |
| CP2 | T12 retire le stub silencieux en env de référence | ✅ Code (`strict` + `data_source`) |
| CP3 | T13 expose la version référentiel | ✅ Code |
| CP4 | T14 BG → GL minimal | ❌ **Reporté** |
| CP5 | T15 doc à jour | ✅ **Alignement + backlog + libellé UI** |

---

## 11. Recette — contrôles API / UI (Sprint 02)

À intégrer aux scénarios manuels ou outils (Postman, etc.) :

| Champ / signal | Vérification |
|----------------|--------------|
| **`data_source`** | `vault` si Vault répond 2xx ; `stub` uniquement en secours documenté (hors `LINKY_ACCOUNTING_STRICT`). |
| **`complete`** | `false` tant que la BG n’est pas métier complète (Sprint 02 : attendu `false` avec couverture partielle). |
| **`coverage`** | Cohérent avec la source (ex. `payroll_od_lines` / `payroll_od_lines_empty`). |
| **`referentiel_version`** | Présent ; aligné **v1.1** référentiel ou bump documenté. |
| **Header `X-Lynki-Accounting-Source`** | Même valeur que `data_source` (observabilité). |

---

*Rapport à archiver dans `ZeDocs/web57/` — clôture Sprint 02 (livraison partielle : T14 hors scope). Suite : [PLAN_SPRINT_03_LYNKI.md](PLAN_SPRINT_03_LYNKI.md).*

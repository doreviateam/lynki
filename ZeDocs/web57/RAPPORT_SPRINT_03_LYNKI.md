# Rapport de réalisation — Sprint 03 Lynki (Phase 2)

**Fichier canonique :** `RAPPORT_SPRINT_03_LYNKI.md`  
**Sprint de référence :** [PLAN_SPRINT_03_LYNKI.md](PLAN_SPRINT_03_LYNKI.md) **v1.0**  
**Date de clôture :** 20 mars 2026  
**Rédacteur :** équipe Lynki Phase 2  
**Version rapport :** 1.1 — mars 2026  
**Révision 1.1 :** formulations Gate B / Gate C alignées comité (§1.2, §7, §8) ; §10 point 5 reformulé (`referentiel_version` homogénéisation).  
**Statut global :** **Sprint livré — chaîne BG → GL opérationnelle (T16–T18) ; Gate C partiellement atteinte sur périmètre OD paie ; T19 décision documentée (extension reportée Sprint 04+) ; Gate B reste partielle**

---

## 1. Résumé exécutif

### 1.1 Formulation produit

La promesse produit **ne change pas** par rapport au Sprint 02 :

> **Balance générale — périmètre partiel (OD paie)**

Le drill **BG → GL** est fonctionnel sur ce périmètre : depuis une ligne de la balance pilote, l'utilisateur peut consulter les **écritures individuelles** (`payroll_od_lines`) du compte. La couverture reste limitée aux OD paie (OD 641\*/645\*) ; aucune autre source n'a été branchée (décision T19 — voir §5 / [ADR_T19_TRIAL_BALANCE_EXTENSION.md](ADR_T19_TRIAL_BALANCE_EXTENSION.md)).

### 1.2 Objectif et résultat synthétique

Le Sprint 03 visait deux axes : **chaîne de preuve BG → GL** (`lynki.accounting.general_ledger`) et **extension de la couverture** de la balance (T19).

| Objectif sprint | Résultat |
|-----------------|----------|
| Contrat `lynki.accounting.general_ledger` (T16) | ✅ Types TS + route Linky |
| Vault `GET /api/accounting/general-ledger` (T17) | ✅ Handler + storage |
| UI drill BG → GL (T18) | ✅ Panneau latéral + tableau écritures |
| Extension `trial_balance` (T19) | 🟡 Décision documentée — source unique maintenue (ADR) |
| Gate C amorcée | ✅ Première chaîne de preuve BG → GL |
| Gate B renforcée | 🟡 Partielle — couverture inchangée |

---

## 2. Tickets — état à la clôture

| # | Titre | Lot | Statut | Commentaire |
|---|--------|-----|--------|-------------|
| **T16** | Contrat + types `lynki.accounting.general_ledger` (TS) | 3 / 4A | ✅ **done** | Interface `LynkiGeneralLedgerResponse`, `GeneralLedgerLine` + route `/api/accounting/general-ledger`. |
| **T17** | Vault `GET /api/accounting/general-ledger` | Vault | ✅ **done** | `GeneralLedgerEntries` storage + `GeneralLedgerHandler` ; filtres compte, date, tenant, company_id. |
| **T18** | Linky — route + UI drill BG → GL | 3 | ✅ **done** | `GeneralLedgerPanel` : panneau latéral, tableau écritures, stub non silencieux, `LINKY_ACCOUNTING_STRICT`. |
| **T19** | Extension `trial_balance` — décision documentée | Vault | 🟡 **décision** | Source unique `payroll_od_lines` confirmée ; ADR court produit ; extension Sprint 04+. |
| **T20** | Doc : rapport, alignement, backlog | transversal | ✅ **done** | Ce rapport ; mises à jour [ALIGNEMENT](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) **v1.5** ; [BACKLOG](BACKLOG_PHASE2_LYNKI.md) **v1.3** ; [ADR_T19](ADR_T19_TRIAL_BALANCE_EXTENSION.md). |

---

## 3. Fichiers créés ou modifiés

### Vault (backend Go)

| Fichier | Description |
|---------|-------------|
| `sources/vault/internal/storage/general_ledger.go` | `GeneralLedgerEntries` — écritures individuelles depuis `payroll_od_lines` ; `GeneralLedgerQuery` (validation) ; `GeneralLedgerResult`. |
| `sources/vault/internal/handlers/accounting_general_ledger.go` | `GeneralLedgerHandler` — `GET /api/accounting/general-ledger` ; JSON `lynki.accounting.general_ledger` + `referentiel_version`. |
| `sources/vault/internal/server/replay.go` | Enregistrement `GET /api/accounting/general-ledger`. |
| `sources/vault/internal/storage/trial_balance.go` | Commentaire ADR T19 inline (décision extension documentée). |

### Linky (Next.js TypeScript)

| Fichier | Description |
|---------|-------------|
| `units/dorevia-linky/app/api/accounting/general-ledger/route.ts` | Route Next.js ; contrat `lynki.accounting.general_ledger` ; `data_source` + `X-Lynki-Accounting-Source` ; `LINKY_ACCOUNTING_STRICT`. |
| `units/dorevia-linky/components/AccountingSummaryView.tsx` | `GeneralLedgerPanel` (drill BG→GL) ; `TrialBalanceRow` cliquable ; `onDrill` → panneau latéral ; libellé §1.1 maintenu. |

### Documentation

| Fichier | Description |
|---------|-------------|
| `ZeDocs/web57/ADR_T19_TRIAL_BALANCE_EXTENSION.md` | Décision extension couverture `trial_balance` — sources Vault existantes analysées, extension `account_move_lines` reportée Sprint 04+. |
| `ZeDocs/web57/RAPPORT_SPRINT_03_LYNKI.md` | Ce rapport. |
| `ZeDocs/web57/ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md` | Mise à jour v1.5 — GL livré, Gate C amorcée. |
| `ZeDocs/web57/BACKLOG_PHASE2_LYNKI.md` | Mise à jour v1.3 — état post-Sprint 03. |

---

## 4. Contrats et paramètres d'appel

### Vault — `GET /api/accounting/general-ledger`

Query : **`tenant`**, **`account_code`**, **`date_debut`**, **`date_fin`** (requis), **`company_id`** (optionnel).

```json
{
  "restitution_id": "lynki.accounting.general_ledger",
  "referentiel_version": "1.1",
  "tenant": "<tenant>",
  "account_code": "641100",
  "company_id": null,
  "period_from": "YYYY-MM-DD",
  "period_to": "YYYY-MM-DD",
  "generated_at": "<RFC3339>",
  "lines": [
    {
      "line_id": 1,
      "move_id": 42,
      "line_date": "2026-01-15",
      "account_code": "641100",
      "account_name": "641100",
      "debit": 1500.00,
      "credit": 0,
      "balance": 1500.00,
      "currency": "EUR"
    }
  ],
  "total_debit": 1500.00,
  "total_credit": 0,
  "vault_freshness": "entries:payroll_od_lines",
  "complete": false,
  "coverage": "payroll_od_lines"
}
```

> **`restitution_id`** = `"lynki.accounting.general_ledger"` — identifiant **canonique** (distinct du chemin HTTP `GET /api/accounting/general-ledger`).

### Alignement BG → GL (cohérence filtres)

| Filtre | BG (`trial_balance`) | GL (`general_ledger`) |
|--------|----------------------|------------------------|
| `tenant` | requis | requis |
| `date_debut` / `date_fin` | requis | requis — **même valeur** que la ligne BG source |
| `account_code` | — (agrégé) | requis — **code exact** de la ligne BG cliquée |
| `company_id` | optionnel | optionnel — répercuté depuis BG |

---

## 5. Décisions prises pendant le sprint

### D4 — Extension `trial_balance` (T19) : source unique maintenue

**Décision :** seule `payroll_od_lines` alimente la balance générale (Sprint 03). Aucune des autres tables Vault existantes (`economic_events`, `ledger`, `documents`) ne contient de données débit/crédit structurées agrégables par compte/période.

**Extension future :** migration `04x_account_move_lines.sql` + connecteur Odoo → Sprint 04+. Détail : [ADR_T19_TRIAL_BALANCE_EXTENSION.md](ADR_T19_TRIAL_BALANCE_EXTENSION.md).

**Conséquence :** `complete=false`, `coverage="payroll_od_lines"`, libellé UI inchangé.

### D5 — UI drill : panneau latéral

**Décision :** le drill BG → GL ouvre un **panneau latéral** (`GeneralLedgerPanel`) superposé à la vue Synthèse — pas de navigation vers une page dédiée. Ce choix est réversible (Sprint 04 peut promouvoir vers une route `/accounting/gl/[account_code]`).

### D6 — Stub GL non silencieux

**Décision :** même contrat que le Sprint 02 — `data_source: "stub"` + header `X-Lynki-Accounting-Source: stub` ; `LINKY_ACCOUNTING_STRICT` produit un **502** si Vault injoignable.

---

## 6. Évaluation des risques (plan sprint)

| Risque plan | Matérialisé ? | Résolution |
|-------------|---------------|------------|
| Données GL insuffisantes en base Vault | Partiellement — périmètre limité à payroll | `complete=false` + message UI explicite |
| T19 trop large | Non — timebox respecté | ADR court, décision datée |

---

## 7. Écarts par rapport au plan §8 (sortie attendue)

| Attendu fin sprint | Résultat |
|--------------------|----------|
| Premier `lynki.accounting.general_ledger` utilisable | ✅ Vault + Linky + parcours UI |
| `trial_balance` couverture étendue **ou** décision report | ✅ Décision documentée (ADR T19) |
| Gate C amorcée (BG → GL) | ✅ |

---

## 8. Gates — état

| Gate | Commentaire |
|------|-------------|
| **Gate A** (Sprint 01) | Conditionnée à la recette T3 (R1–R7) — voir [RAPPORT_SPRINT_01_LYNKI.md](RAPPORT_SPRINT_01_LYNKI.md). |
| **Gate B** (Synthèse exploitable) | **Non atteinte comme gate pleine** : bloc BG pilote réel disponible sur périmètre OD paie — couverture métier incomplète. Inchangé par rapport au Sprint 02. |
| **Gate C** (traçabilité + chaîne de preuve) | **Partiellement atteinte sur périmètre OD paie** — chaîne de preuve **BG → GL** fonctionnelle. Complétion cible : extension couverture + GL tous journaux. |

---

## 9. Recette — contrôles API / UI (Sprint 03)

En plus des contrôles Sprint 02 ([RAPPORT_SPRINT_02_LYNKI.md](RAPPORT_SPRINT_02_LYNKI.md) §11) :

| Champ / signal | Vérification |
|----------------|--------------|
| `restitution_id` GL | `"lynki.accounting.general_ledger"` exact. |
| Filtres BG → GL | `account_code` et `date_debut` / `date_fin` **cohérents** avec la ligne BG source. |
| `data_source` GL | `vault` si Vault répond 2xx ; `stub` si Vault injoignable (hors strict). |
| Header GL | `X-Lynki-Accounting-Source` = valeur de `data_source`. |
| `complete` GL | `false` (couverture partielle OD paie). |
| UI — drill | Clic sur ligne BG → panneau latéral GL ; compte et période **identiques** à la ligne. |
| UI — fermeture | Clic sur fond / bouton ✕ ferme le panneau sans régression de la BG. |

---

## 10. Recommandations — Sprint 04

1. **Extension couverture** : migration `account_move_lines` + connecteur Odoo → `complete` → possible `true` sur périmètre "posted all journals" ([ADR_T19_TRIAL_BALANCE_EXTENSION.md](ADR_T19_TRIAL_BALANCE_EXTENSION.md)).
2. **Gate A** : finaliser la recette T3 (R1–R7) si non déjà fait.
3. **Gate B pleine** : conditionné à l'extension couverture BG.
4. **GL dédié** : envisager une route `/accounting/gl/[account_code]` (promotion du panneau latéral).
5. **Lot 4B** : homogénéiser `referentiel_version` sur l'ensemble des restitutions `lynki.accounting.*` restantes (au-delà de `trial_balance` et `general_ledger` déjà exposés).

---

*Rapport clôture Sprint 03 v1.1 — Gate C partiellement atteinte (périmètre OD paie). Suite : [PLAN_SPRINT_04_LYNKI.md](PLAN_SPRINT_04_LYNKI.md) (extension couverture BG, homogénéisation `referentiel_version`, exports).*

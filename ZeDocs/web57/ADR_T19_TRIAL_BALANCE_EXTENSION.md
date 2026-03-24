# ADR T19 — Extension couverture `trial_balance`

**Fichier canonique :** `ADR_T19_TRIAL_BALANCE_EXTENSION.md`  
**Version :** 1.0 — mars 2026  
**Sprint :** Sprint 03  
**Ticket :** T19 ([PLAN_SPRINT_03_LYNKI.md](PLAN_SPRINT_03_LYNKI.md))  
**Statut :** **Décision adoptée — extension reportée à Sprint 04+**

---

## Contexte

Le Sprint 02 a livré `lynki.accounting.trial_balance` via Vault avec `complete=false` et `coverage="payroll_od_lines"`.

Le Sprint 03 (T19) mandate une décision documentée sur l'extension de la couverture au-delà de `payroll_od_lines`.

---

## Tables Vault disponibles à date (mars 2026)

| Table | Description | Utilisable pour trial_balance ? |
|-------|-------------|----------------------------------|
| `payroll_od_lines` | Écritures OD paie (641*, 645*) — débit/crédit par compte/date/tenant | **Oui** — source actuelle |
| `economic_events` | Événements économiques bruts (payload JSON) — pas de débit/crédit structuré | **Non** — pas d'agrégation directe |
| `ledger` | Chaîne de preuve documentaire (hash, prev_hash) — pas de données comptables | **Non** |
| `documents` | Documents sources (factures, etc.) — JSON sans débit/crédit structuré | **Non** |

---

## Décision

**Conserver `payroll_od_lines` comme source unique** pour `TrialBalanceAggregation` jusqu'à la mise en place d'une table `account_move_lines` vaultée.

- `complete = false` **reste la valeur correcte** tant que seuls les journaux paie sont couverts.
- `coverage = "payroll_od_lines"` **reste la valeur correcte**.

### Raisons

1. Aucune autre table Vault ne contient de données débit/crédit structurées par compte et par date.
2. Élargir à `economic_events` nécessiterait un parser JSON par type d'événement : risque élevé d'incohérence comptable et hors doctrine Vault (les events sont des entrées brutes, pas des écritures).
3. La bonne extension est une table dédiée `account_move_lines` (écritures comptables Odoo tous journaux), alimentée par le connecteur Odoo.

### Extension future (Sprint 04+)

```
Migration 04x : CREATE TABLE account_move_lines (
  tenant, move_id, line_id, line_date, account_code, debit, credit,
  journal_code, company_id, state, ...
)
```

Quand cette table sera vaultée :
- Étendre `TrialBalanceAggregation` avec une `UNION ALL` ou une JOIN sur `account_move_lines`
- Condition `complete = true` : tous les journaux `posted` pour le tenant/période sont couverts
- Mettre à jour `coverage` → ex. `"payroll_od_lines + account_move_lines"` ou `"all_posted_journals"`

---

## Impact sur les contrats

| Champ | Valeur actuelle | Valeur cible (post-extension) |
|-------|-----------------|-------------------------------|
| `complete` | `false` | `true` (si tous les journaux couverts) |
| `coverage` | `"payroll_od_lines"` | `"all_posted_journals"` |
| Libellé UI | "Balance générale — périmètre partiel (OD paie)" | "Balance générale complète" |

---

## Références

- Code : `sources/vault/internal/storage/trial_balance.go` (commentaire ADR inline)
- Plan : [PLAN_SPRINT_03_LYNKI.md](PLAN_SPRINT_03_LYNKI.md) §4 T19
- Rapport : [RAPPORT_SPRINT_03_LYNKI.md](RAPPORT_SPRINT_03_LYNKI.md) (à rédiger en clôture)

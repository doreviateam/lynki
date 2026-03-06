# Note technique — Audit traversée Odoo (reconcile → payment)

**Date :** 2026-02-25  
**Sprint 0 — Confirmation Bancaire Stricte v1.3**  
**Référence :** `ZeDocs/web32/SPEC_Confirmation_Bancaire_Stricte_v1.3.md`, §9.1

---

## 1. Objectif

Vérifier que l'on peut reconstruire `impacted_documents` depuis une ligne de relevé bancaire rapprochée, avant d'implémenter le payload v1.2 (Sprint 3.1).

---

## 2. Modèles Odoo utilisés

| Modèle | Champ / lien | Usage |
|--------|--------------|-------|
| `account.bank.statement.line` | `is_reconciled` | Filtrer les lignes rapprochées |
| `account.bank.statement.line` | `move_id` | Move généré lors du rapprochement |
| `account.bank.statement.line` | `_seek_for_lines()` | **(OCA)** Retourne `(liquidity, suspense, other_lines)` — `other_lines` = contreparties rapprochées |
| `account.move.line` | `move_id` | Move source |
| `account.move.line` | `balance` | Montant signé (devise société) |
| `account.move.line` | `amount_currency` | Montant en devise de la ligne |
| `account.move.line` | `matched_debit_ids`, `matched_credit_ids` | Lien vers `account.partial.reconcile` |
| `account.partial.reconcile` | `debit_move_id`, `credit_move_id` | Paires de lignes rapprochées |
| `account.payment` | `move_id` | Lien vers le move créé par le paiement |
| `pos.payment` | `account_move_id` ou `move_id` | Lien vers le move (selon version) |

---

## 3. Traversée validée

```
bank_statement_line (bsl)
    → _seek_for_lines() [OCA] ou move_id.line_ids + partials [standard]
    → other_lines (account.move.line)
    → pour chaque aml : aml.move_id → account.payment (move_id=move.id)
    → amount_abs = ABS(aml.balance)
```

**Règle §9.1 :** `amount_abs = ABS(montant sur move_line rapprochée)` — pas le montant du payment.

---

## 4. Cas OCA (account_reconcile_oca)

Le projet utilise **account_reconcile_oca** : la méthode `_seek_for_lines()` existe et retourne les `other_lines` (contreparties). Pas d'adaptation spécifique nécessaire.

---

## 5. Exclusions

- **Cross-currency :** Si devise ligne bancaire ≠ devise paiement → exclure (V1).
- **Non-payment :** Factures, OD manuelles, écritures diverses → ignorées (périmètre V1 = account.payment, pos.payment uniquement).

---

## 6. Snippet et exécution

**Script :** `scripts/snippet_traverse_reconcile_to_payment.py`

**Exécution dans le shell Odoo :**

```python
exec(open('/opt/dorevia-plateform/scripts/snippet_traverse_reconcile_to_payment.py').read())
bsl = env["account.bank.statement.line"].search([("is_reconciled", "=", True)], limit=1)
if bsl:
    for d in traverse_bsl_to_impacted_documents(env, bsl=bsl):
        print(f"{d.odoo_model}:{d.odoo_id} amount_abs={d.amount_abs}")
```

**Sortie attendue (exemple) :**  
`account.payment:901 amount_abs=1000.0`

---

## 7. Go / No-go Sprint 3.1

- [ ] Snippet exécuté avec succès sur Odoo lab (ou prod lecture seule)
- [ ] Au moins une ligne rapprochée avec payment testée
- [ ] Invariant : `SUM(amount_abs)` = montant ligne bancaire (abs) pour multi-split

**Conclusion :** Si le snippet s'exécute et retourne des `ImpactedDocument` cohérents → **Go** pour Sprint 3.1.

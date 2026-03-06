#!/usr/bin/env python3
"""
Diagnostic : pourquoi impacted_documents est vide pour une ligne rapprochée ?

Usage : copier-coller dans odoo shell :
  exec(open('/opt/dorevia-plateform/scripts/diagnostic_bsl_impacted.py').read())

Ou ajuster bsl_id ci-dessous et lancer.
"""
# Ajuster l'ID de la ligne à diagnostiquer (ex: 6 pour la ligne 33 600 €)
bsl_id = 6

bsl = env["account.bank.statement.line"].browse(bsl_id)
if not bsl.exists():
    print(f"BSL {bsl_id} introuvable")
    raise SystemExit(1)

print(f"=== BSL {bsl_id} : {bsl.amount} € | is_reconciled={bsl.is_reconciled} ===\n")

if not bsl.is_reconciled:
    print("Ligne non rapprochée — rien à diagnostiquer")
    raise SystemExit(0)

# 1. _seek_for_lines
if hasattr(bsl, "_seek_for_lines"):
    liq, sus, other = bsl._seek_for_lines()
    print(f"1. _seek_for_lines() -> other_lines: {len(other)} ligne(s)")
    for i, aml in enumerate(other):
        move = aml.move_id
        payment = env["account.payment"].sudo().search([("move_id", "=", move.id)], limit=1)
        pos_pay = env["pos.payment"].sudo().search([("account_move_id", "=", move.id)], limit=1) if "account_move_id" in env["pos.payment"]._fields else env["pos.payment"].browse([])
        if not pos_pay and "move_id" in env["pos.payment"]._fields:
            pos_pay = env["pos.payment"].sudo().search([("move_id", "=", move.id)], limit=1)
        print(f"   other[{i}]: move_id={move.id} name={move.name} amount={aml.balance}")
        print(f"      -> account.payment: {payment.id if payment else 'NON'}")
        print(f"      -> pos.payment: {pos_pay.id if pos_pay else 'NON'}")
else:
    print("1. _seek_for_lines() non disponible (OCA account_reconcile_oca?)")

# 2. Traverse résultat
impacted = bsl._traverse_to_impacted_documents()
print(f"\n2. _traverse_to_impacted_documents() -> {len(impacted)} document(s)")
for d in impacted:
    print(f"   {d.odoo_model}:{d.odoo_id} amount_abs={d.amount_abs}")

# 3. Chaîne de réconciliation (pour debug traversée indirecte)
if hasattr(bsl, "_seek_for_lines"):
    liq, sus, other = bsl._seek_for_lines()
    for i, aml in enumerate(other):
        partials = (aml.matched_debit_ids or env["account.partial.reconcile"]) | (
            aml.matched_credit_ids or env["account.partial.reconcile"]
        )
        print(f"\n3. Chaîne other[{i}] (move {aml.move_id.id}): {len(partials)} partial(s)")
        for p in partials:
            cp = p.debit_move_id if p.credit_move_id == aml else p.credit_move_id
            pay = env["account.payment"].sudo().search([("move_id", "=", cp.move_id.id)], limit=1)
            print(f"   -> counterpart move {cp.move_id.id} ({cp.move_id.name}) | payment: {pay.id if pay else 'NON'}")

# 4. Vault : ce payment est-il vaulté ?
for d in impacted:
    pmt = env[d.odoo_model].browse(d.odoo_id)
    if hasattr(pmt, "dorevia_vault_last_proof_id"):
        print(f"\n4. Payment {d.odoo_id} vaulté: {bool(pmt.dorevia_vault_last_proof_id)}")
    else:
        print(f"\n3. Modèle {d.odoo_model} — pas de champ vault")

print("\n=== Fin diagnostic ===")

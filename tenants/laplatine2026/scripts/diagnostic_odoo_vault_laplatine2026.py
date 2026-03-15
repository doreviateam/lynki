#!/usr/bin/env python3
"""
Diagnostic Odoo laplatine2026 : effectifs factures et paiements par statut Vault.
À comparer avec les comptages Vault (voir diagnostic_vault_laplatine2026.sh).

Usage : docker cp ce fichier → odoo_lab_laplatine2026:/tmp/ puis
  docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http <<< "exec(open('/tmp/diagnostic_odoo_vault_laplatine2026.py').read())"
"""
Move = env["account.move"].sudo()
Payment = env["account.payment"].sudo()
ELIGIBLE_MOVE = ("out_invoice", "out_refund", "in_invoice", "in_refund")
ELIGIBLE_PAYMENT = ("posted", "paid", "in_process", "sent", "reconciled")

# Factures (posted, éligibles)
domain_move = [("state", "=", "posted"), ("move_type", "in", list(ELIGIBLE_MOVE))]
total_moves = Move.search_count(domain_move)
print("=== FACTURES (account.move posted, client + fournisseur) ===")
print(f"  Total : {total_moves}")
for status in [False, "todo", "pending_proof", "vaulted", "failed_soft", "failed_hard"]:
    d = domain_move + [("dorevia_vault_status", "=", status)]
    c = Move.search_count(d)
    if c:
        label = status or "non initialisé"
        print(f"  - {label}: {c}")

# Paiements (éligibles)
domain_pay = [("state", "in", list(ELIGIBLE_PAYMENT))]
total_pay = Payment.search_count(domain_pay)
print("\n=== PAIEMENTS (account.payment éligibles) ===")
print(f"  Total : {total_pay}")
for status in [False, "todo", "pending_proof", "vaulted", "failed_soft", "failed_hard"]:
    d = domain_pay + [("dorevia_vault_status", "=", status)]
    c = Payment.search_count(d)
    if c:
        label = status or "non initialisé"
        print(f"  - {label}: {c}")

print("\n→ Comparer avec Vault (documents tenant=laplatine2026, source=invoice / payment).")

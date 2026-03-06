#!/usr/bin/env python3
"""
Backfill des paiements 2026 vers le Vault.

Usage (shell Odoo) :
  docker exec -it odoo_lab_laplatine2026 odoo shell -d laplatine2026
  exec(open('/opt/dorevia-plateform/tenants/laplatine2026/scripts/backfill_2026_payments_and_send.py').read())

Ou copier-coller le contenu dans le shell.
"""
from odoo import fields

Payment = env["account.payment"].sudo()
ELIGIBLE = ("posted", "paid", "in_process", "sent", "reconciled")

# 1) Backfill : paiements 2026 non encore initialisés
domain_new = [
    ("state", "in", list(ELIGIBLE)),
    ("date", ">=", "2026-01-01"),
    ("date", "<=", "2026-12-31"),
    ("dorevia_vault_idempotency_key", "=", False),
]
new = Payment.search(domain_new)
for p in new:
    key = Payment._compute_payment_idempotency_key(p)
    p.write({
        "dorevia_vault_status": "todo",
        "dorevia_vault_idempotency_key": key,
        "dorevia_vault_attempt_count": 0,
        "dorevia_vault_next_retry_at": fields.Datetime.now(),
    })
env.cr.commit()
print(f"Backfill : {len(new)} paiements 2026 initialisés en todo")

# 2) Reset : paiements 2026 en failed_soft/failed_hard pour retry
domain_reset = [
    ("state", "in", list(ELIGIBLE)),
    ("date", ">=", "2026-01-01"),
    ("date", "<=", "2026-12-31"),
    ("dorevia_vault_status", "in", ["failed_soft", "failed_hard"]),
]
reset = Payment.search(domain_reset)
for p in reset:
    key = Payment._compute_payment_idempotency_key(p)
    p.write({
        "dorevia_vault_status": "todo",
        "dorevia_vault_idempotency_key": key,
        "dorevia_vault_attempt_count": 0,
        "dorevia_vault_next_retry_at": fields.Datetime.now(),
    })
env.cr.commit()
print(f"Reset : {len(reset)} paiements 2026 remis en todo")

# 3) Envoi vers DVIG + trigger worker
Payment.cron_vault_send_dvig()
env.cr.commit()
print("cron_vault_send_dvig OK")

env["dorevia.dvig.service"].trigger_worker(limit=100)
print("trigger_worker OK")
print(f"Total traité : {len(new) + len(reset)} paiements 2026")

#!/usr/bin/env python3
"""Réinitialise le statut vault des factures 2026 à todo et les renvoie vers DVIG."""
Move = env["account.move"].sudo()
ELIGIBLE = ("out_invoice", "out_refund", "in_invoice", "in_refund")
domain = [
    ("state", "=", "posted"),
    ("move_type", "in", list(ELIGIBLE)),
    ("invoice_date", ">=", "2026-01-01"),
    ("invoice_date", "<=", "2026-12-31"),
]
moves = Move.search(domain)
for m in moves:
    key = Move._compute_idempotency_key(m)
    m.with_context(dorevia_skip_posted_hook=True).write({
        "dorevia_vault_status": "todo",
        "dorevia_vault_idempotency_key": key,
        "dorevia_vault_id": False,
        "dorevia_vault_sha256": False,
        "dorevia_vault_date": False,
        "dorevia_vault_evidence_jws": False,
        "dorevia_vault_ledger_hash": False,
    })
env.cr.commit()
print("Reset", len(moves), "factures 2026 en todo")
env["account.move"].cron_vault_send_dvig()
env.cr.commit()
print("cron_vault_send_dvig OK")
env["dorevia.dvig.service"].trigger_worker(limit=300)
print("trigger_worker OK")

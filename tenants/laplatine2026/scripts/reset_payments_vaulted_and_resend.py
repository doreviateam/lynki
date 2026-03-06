#!/usr/bin/env python3
"""
Reset les paiements marqués 'vaulted' vers 'todo' pour re-envoi vers DVIG/Vault.

Cas : les preuves Odoo (vault_id, sha256) pointent vers des documents qui n'existent
plus dans le Vault (DB reset, migration). L'outbox DVIG n'a aucun payment.posted.
On force le re-envoi en remettant les paiements en todo.

Usage :
  echo "exec(open('/mnt/tenant-scripts/scripts/reset_payments_vaulted_and_resend.py').read())" | docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
"""
from odoo import fields

Payment = env["account.payment"].sudo()
ELIGIBLE = ("posted", "paid", "in_process", "sent", "reconciled")

# 1) Reset : paiements vaulted ou pending_proof → todo (re-envoi)
domain = [
    ("state", "in", list(ELIGIBLE)),
    ("dorevia_vault_status", "in", ["vaulted", "pending_proof"]),
]
to_reset = Payment.search(domain)
for p in to_reset:
    key = p.dorevia_vault_idempotency_key or p._compute_payment_idempotency_key()
    p.write({
        "dorevia_vault_status": "todo",
        "dorevia_vault_idempotency_key": key,
        "dorevia_vault_id": False,
        "dorevia_vault_sha256": False,
        "dorevia_vault_date": False,
        "dorevia_vault_evidence_jws": False,
        "dorevia_vault_ledger_hash": False,
        "dorevia_vault_attempt_count": 0,
        "dorevia_vault_next_retry_at": fields.Datetime.now(),
    })
env.cr.commit()
print(f"Reset : {len(to_reset)} paiements (vaulted/pending_proof) → todo")

# 2) Envoi vers DVIG — 15 rounds × 50
for i in range(15):
    Payment.cron_vault_send_payments()
    env.cr.commit()
    env["dorevia.dvig.service"].trigger_worker(limit=100)
    print(f"  Cron round {i+1}/15 OK")

print("cron_vault_send_payments OK")
print("trigger_worker OK")
print("Lancer la boucle outbox DVIG (RUNBOOK_BACKFILL_VAULT.md)")

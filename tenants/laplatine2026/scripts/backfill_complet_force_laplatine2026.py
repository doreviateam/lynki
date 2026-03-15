#!/usr/bin/env python3
"""
Backfill COMPLET laplatine2026 → Vault : TOUTES les factures et TOUS les paiements
sont mis en 'todo' (y compris déjà vaulted/pending_proof) puis envoyés vers DVIG.
Garantit que tout l'éligible Odoo est poussé vers le Vault.

Usage : exécuter via run_backfill_complet_force_laplatine2026.sh
"""
from odoo import fields

Move = env["account.move"].sudo()
Payment = env["account.payment"].sudo()
ELIGIBLE_MOVE = ("out_invoice", "out_refund", "in_invoice", "in_refund")
ELIGIBLE_PAYMENT = ("posted", "paid", "in_process", "sent", "reconciled")

# ── 1) Factures : TOUTES posted → todo ───────────────────────
domain_move = [("state", "=", "posted"), ("move_type", "in", list(ELIGIBLE_MOVE))]
moves = Move.search(domain_move)
for m in moves:
    key = m.dorevia_vault_idempotency_key or Move._compute_idempotency_key(m)
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
print(f"Factures : {len(moves)} mises en todo")

# ── 2) Paiements : TOUS éligibles → todo ──────────────────────
domain_pay = [("state", "in", list(ELIGIBLE_PAYMENT))]
payments = Payment.search(domain_pay)
for p in payments:
    key = p.dorevia_vault_idempotency_key or p._compute_payment_idempotency_key()
    vals = {
        "dorevia_vault_status": "todo",
        "dorevia_vault_idempotency_key": key,
        "dorevia_vault_id": False,
        "dorevia_vault_sha256": False,
        "dorevia_vault_date": False,
        "dorevia_vault_evidence_jws": False,
        "dorevia_vault_ledger_hash": False,
        "dorevia_vault_attempt_count": 0,
        "dorevia_vault_next_retry_at": fields.Datetime.now(),
    }
    if "dorevia_erp_event_captured_at" in Payment._fields:
        vals["dorevia_erp_event_captured_at"] = False
    p.write(vals)
env.cr.commit()
print(f"Paiements : {len(payments)} mis en todo")

# ── 3) Envoi factures (plusieurs rounds, commit à chaque fois) ──
for i in range(25):
    Move.cron_vault_send_dvig()
    env.cr.commit()
    env["dorevia.dvig.service"].trigger_worker(limit=100)
    if (i + 1) % 5 == 0 or i == 24:
        print(f"  Factures cron round {i+1}/25")
print("cron_vault_send_dvig (25 rounds) OK")

# ── 4) Envoi paiements (plusieurs rounds) ───────────────────────
for i in range(25):
    Payment.cron_vault_send_payments()
    env.cr.commit()
    env["dorevia.dvig.service"].trigger_worker(limit=100)
    if (i + 1) % 5 == 0 or i == 24:
        print(f"  Paiements cron round {i+1}/25")
print("cron_vault_send_payments (25 rounds) OK")

print("Backfill complet terminé. Attendre 2–5 min puis vérifier : diagnostic_vault_laplatine2026.sh et Linky.")

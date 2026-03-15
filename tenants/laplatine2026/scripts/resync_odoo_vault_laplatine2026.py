#!/usr/bin/env python3
"""
Rétablir la vérité Vault pour laplatine2026 : les factures et paiements
marqués vaulted/pending_proof dans Odoo sont remis en 'todo' puis ré-envoyés
vers DVIG → Vault (même clé d'idempotence = pas de doublon côté Vault).

Usage (sans volume tenant-scripts) :
  docker cp tenants/laplatine2026/scripts/resync_odoo_vault_laplatine2026.py odoo_lab_laplatine2026:/tmp/
  docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http < <(echo "exec(open('/tmp/resync_odoo_vault_laplatine2026.py').read())")

Ou via run_resync_odoo_vault_laplatine2026.sh
"""
from odoo import fields

Move = env["account.move"].sudo()
Payment = env["account.payment"].sudo()
ELIGIBLE_MOVE = ("out_invoice", "out_refund", "in_invoice", "in_refund")
ELIGIBLE_PAYMENT = ("posted", "paid", "in_process", "sent", "reconciled")

# ── 1) Factures : vaulted/pending_proof → todo (ré-envoi)
domain_move = [
    ("state", "=", "posted"),
    ("move_type", "in", list(ELIGIBLE_MOVE)),
    ("dorevia_vault_status", "in", ["vaulted", "pending_proof"]),
]
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
print(f"Factures : {len(moves)} remises en todo (ré-envoi vers Vault)")

# ── 2) Paiements : vaulted/pending_proof → todo (ré-envoi)
domain_pay = [
    ("state", "in", list(ELIGIBLE_PAYMENT)),
    ("dorevia_vault_status", "in", ["vaulted", "pending_proof"]),
]
payments = Payment.search(domain_pay)
for p in payments:
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
print(f"Paiements : {len(payments)} remis en todo (ré-envoi vers Vault)")

# ── 3) Envoi factures vers DVIG (plusieurs rounds)
for i in range(20):
    Move.cron_vault_send_dvig()
    env.cr.commit()
    env["dorevia.dvig.service"].trigger_worker(limit=100)
    if i < 19:
        print(f"  Factures cron round {i+1}/20 OK")
print("cron_vault_send_dvig (20 rounds) OK")

# ── 4) Envoi paiements vers DVIG (plusieurs rounds)
for i in range(20):
    Payment.cron_vault_send_payments()
    env.cr.commit()
    env["dorevia.dvig.service"].trigger_worker(limit=100)
    if i < 19:
        print(f"  Paiements cron round {i+1}/20 OK")
print("cron_vault_send_payments (20 rounds) OK")

print("trigger_worker OK")
print("Résync Odoo → Vault lancée. Attendre 2–5 min que DVIG/Vault scellent, puis vérifier Linky (preuves scellées).")

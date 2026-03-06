#!/usr/bin/env python3
"""
Backfill TOUS les paiements Odoo vers le Vault (clients + fournisseurs, toutes années).

Remet en todo tous les paiements posted, puis envoie vers DVIG.
Le cron traite 50 paiements par run — on le lance plusieurs fois.

Usage :
  echo "exec(open('/mnt/tenant-scripts/scripts/backfill_all_payments_to_vault.py').read())" | docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
"""
from odoo import fields

Payment = env["account.payment"].sudo()
ELIGIBLE = ("posted", "paid", "in_process", "sent", "reconciled")

# 1) Backfill : tous les paiements non encore initialisés (via méthode native)
total_new = 0
while True:
    n = Payment.backfill_vault_todo(payment_type=None)
    total_new += n
    if n == 0:
        break
env.cr.commit()
print(f"Backfill : {total_new} paiements initialisés en todo")

# 2) Reset : paiements en failed_soft/failed_hard pour retry
domain_reset = [
    ("state", "in", list(ELIGIBLE)),
    ("dorevia_vault_status", "in", ["failed_soft", "failed_hard"]),
]
reset = Payment.search(domain_reset)
for p in reset:
    key = p._compute_payment_idempotency_key()
    p.write({
        "dorevia_vault_status": "todo",
        "dorevia_vault_idempotency_key": key,
        "dorevia_vault_attempt_count": 0,
        "dorevia_vault_next_retry_at": fields.Datetime.now(),
    })
env.cr.commit()
print(f"Reset : {len(reset)} paiements remis en todo")

# 3) Envoi vers DVIG — cron_vault_send_payments traite 50 par run
# 15 rounds pour ~671 paiements
for i in range(15):
    Payment.cron_vault_send_payments()
    env.cr.commit()
    env["dorevia.dvig.service"].trigger_worker(limit=100)
    if i < 14:
        print(f"  Cron round {i+1}/15 OK")

print("cron_vault_send_payments (15 rounds) OK")
print("trigger_worker OK")
print(f"Total initialisé : {total_new + len(reset)} paiements")
print("Lancer le traitement DVIG outbox (voir RUNBOOK_BACKFILL_VAULT.md)")

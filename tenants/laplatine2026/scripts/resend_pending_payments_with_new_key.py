#!/usr/bin/env python3
"""
Ré-envoie les 261 paiements pending_proof vers le Vault.

Problème : ils ont été "forwarded" par DVIG mais le Vault a retourné un doc existant
(idempotence SHA256) au lieu de créer. On force un nouvel envoi en modifiant la clé
d'idempotence (suffixe _retry2) pour que DVIG et le Vault créent de nouveaux documents.

Usage :
  echo "exec(open('/mnt/tenant-scripts/scripts/resend_pending_payments_with_new_key.py').read())" | docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
"""
from odoo import fields

Payment = env["account.payment"].sudo()
ELIGIBLE = ("posted", "paid", "in_process", "sent", "reconciled")

pending = Payment.search([
    ("state", "in", list(ELIGIBLE)),
    ("dorevia_vault_status", "=", "pending_proof"),
])

for p in pending:
    # Nouvelle clé pour forcer création (éviter idempotence SHA256)
    new_key = (p.dorevia_vault_idempotency_key or p._compute_payment_idempotency_key())[:56] + "_retry2"
    p.write({
        "dorevia_vault_status": "todo",
        "dorevia_vault_idempotency_key": new_key,
        "dorevia_vault_attempt_count": 0,
        "dorevia_vault_next_retry_at": fields.Datetime.now(),
    })

env.cr.commit()
print(f"Reset {len(pending)} paiements avec nouvelle clé idempotence")

# Envoi vers DVIG — 6 rounds × 50
for i in range(6):
    Payment.cron_vault_send_payments()
    env.cr.commit()
    env["dorevia.dvig.service"].trigger_worker(limit=100)
    print(f"  Cron round {i+1}/6 OK")

print("Lancer la boucle outbox DVIG puis fetch_all_payment_proofs.py")

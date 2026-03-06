#!/usr/bin/env python3
"""
Ré-envoie les paiements vaulted dans Odoo mais absents du Vault.

Lit la liste des IDs depuis missing_payment_ids.txt (généré par diagnostic).
Utilise suffixe _retry3 pour forcer création de nouveaux documents.

Usage :
  echo "exec(open('/mnt/tenant-scripts/scripts/resend_missing_payments_to_vault.py').read())" | docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
"""
from odoo import fields

Payment = env["account.payment"].sudo()

# Lire les IDs manquants
try:
    with open("/mnt/tenant-scripts/scripts/missing_payment_ids.txt") as f:
        ids_str = [line.strip() for line in f if line.strip()]
    missing_ids = [int(x) for x in ids_str if x.isdigit()]
except Exception as e:
    print(f"Erreur lecture fichier: {e}")
    missing_ids = []

if not missing_ids:
    print("Aucun ID à traiter")
else:
    payments = Payment.browse(missing_ids).exists()
    payments = payments.filtered(lambda p: p.state in ("posted", "paid", "in_process", "sent", "reconciled"))

    for p in payments:
        new_key = (p.dorevia_vault_idempotency_key or p._compute_payment_idempotency_key())[:56] + "_retry3"
        p.write({
            "dorevia_vault_status": "todo",
            "dorevia_vault_idempotency_key": new_key,
            "dorevia_vault_attempt_count": 0,
            "dorevia_vault_next_retry_at": fields.Datetime.now(),
        })

    env.cr.commit()
    print(f"Reset {len(payments)} paiements avec clé _retry3")

    # Envoi vers DVIG — 4 rounds × 50
    for i in range(4):
        Payment.cron_vault_send_payments()
        env.cr.commit()
        env["dorevia.dvig.service"].trigger_worker(limit=100)
        print(f"  Cron round {i+1}/4 OK")

    print("Lancer outbox DVIG puis fetch_all_payment_proofs.py")

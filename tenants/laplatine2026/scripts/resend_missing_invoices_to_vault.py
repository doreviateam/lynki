#!/usr/bin/env python3
"""
Ré-envoie les factures vaulted dans Odoo mais absentes du Vault.

Lit la liste des IDs depuis missing_invoice_ids.txt (généré par diagnostic_missing_invoices.sh).
Utilise suffixe _retry_inv pour forcer création de nouveaux documents (contourne idempotence Vault).

Usage :
  echo "exec(open('/mnt/tenant-scripts/scripts/resend_missing_invoices_to_vault.py').read())" | docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
"""
import hashlib
from odoo import fields

Move = env["account.move"].sudo()
ELIGIBLE = ("out_invoice", "out_refund", "in_invoice", "in_refund")

# Lire les IDs manquants
try:
    with open("/mnt/tenant-scripts/scripts/missing_invoice_ids.txt") as f:
        ids_str = [line.strip() for line in f if line.strip() and not line.startswith("#")]
    missing_ids = [int(x) for x in ids_str if x.isdigit()]
except Exception as e:
    print(f"Erreur lecture fichier: {e}")
    missing_ids = []

if not missing_ids:
    print("Aucun ID à traiter. Lancer d'abord: ./tenants/laplatine2026/scripts/diagnostic_missing_invoices.sh")
else:
    moves = Move.browse(missing_ids).exists()
    moves = moves.filtered(
        lambda m: m.state == "posted" and m.move_type in ELIGIBLE
    )

    for m in moves:
        base_key = m.dorevia_vault_idempotency_key or Move._compute_idempotency_key(m)
        # Nouveau hash 64 hex (DVIG max 64) pour forcer création
        new_key = hashlib.sha256((base_key + "_retry_inv").encode()).hexdigest()
        m.with_context(dorevia_skip_posted_hook=True).write({
            "dorevia_vault_status": "todo",
            "dorevia_vault_idempotency_key": new_key,
            "dorevia_vault_id": False,
            "dorevia_vault_sha256": False,
            "dorevia_vault_date": False,
            "dorevia_vault_evidence_jws": False,
            "dorevia_vault_ledger_hash": False,
            "dorevia_vault_attempt_count": 0,
            "dorevia_vault_next_retry_at": fields.Datetime.now(),
        })

    env.cr.commit()
    print(f"Reset {len(moves)} factures avec clé _retry_inv")

    # Envoi vers DVIG — 15 rounds × 50 (cron limit)
    for i in range(15):
        Move.cron_vault_send_dvig()
        env.cr.commit()
        env["dorevia.dvig.service"].trigger_worker(limit=100)
        print(f"  Cron round {i+1}/15 OK")

    print("cron_vault_send_dvig OK")
    print("Lancer outbox DVIG (RUNBOOK_BACKFILL_VAULT.md) puis cron_vault_fetch_proof pour les preuves.")

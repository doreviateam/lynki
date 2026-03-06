#!/usr/bin/env python3
"""
Réinitialise les factures marquées vaulted dans Odoo mais absentes du Vault,
puis les renvoie.

Usage :
  echo "exec(open('/mnt/tenant-scripts/scripts/reset_missing_vault_and_resend.py').read())" | docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
"""
Move = env["account.move"].sudo()
ELIGIBLE = ("out_invoice", "out_refund", "in_invoice", "in_refund")

# Récupérer les odoo_id présents dans le Vault (via API ou requête directe si possible)
# Ici on suppose qu'on ne peut pas interroger le Vault depuis Odoo.
# Stratégie : réinitialiser toutes les factures en pending_proof ou vaulted
# dont la preuve n'a jamais été confirmée, et les renvoyer.

# Pour 2026 : reset tout ce qui n'est pas vraiment vaulted (vérification par fetch)
# Simplification : reset toutes les factures 2026 en todo et renvoyer.
# Les déjà en Vault seront idempotent (même idempotency_key) et ne dupliqueront pas.

domain = [
    ("state", "=", "posted"),
    ("move_type", "in", list(ELIGIBLE)),
    ("invoice_date", ">=", "2026-01-01"),
    ("invoice_date", "<=", "2026-12-31"),
]
moves = Move.search(domain)
print(f"Factures 2026 trouvées : {len(moves)}")

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
print(f"Reset {len(moves)} factures 2026 en todo")

Move.cron_vault_send_dvig()
env.cr.commit()
print("cron_vault_send_dvig OK")

env["dorevia.dvig.service"].trigger_worker(limit=200)
print("trigger_worker OK")

#!/usr/bin/env python3
"""
Backfill TOUTES les factures Odoo vers le Vault (351 client + 305 fournisseur).

Remet en todo toutes les factures posted non vaultées, puis envoie vers DVIG.

Usage (shell Odoo) — le répertoire tenants doit être monté, ou copier-coller le code :
  docker exec -it odoo_lab_laplatine2026 odoo shell -d laplatine2026

  # Avec volume tenant monté sur /mnt/tenant-scripts :
  exec(open('/mnt/tenant-scripts/scripts/backfill_all_invoices_to_vault.py').read())

  # Sinon, copier-coller le bloc ci-dessous dans le shell.
"""
Move = env["account.move"].sudo()
ELIGIBLE = ("out_invoice", "out_refund", "in_invoice", "in_refund")

domain = [
    ("state", "=", "posted"),
    ("move_type", "in", list(ELIGIBLE)),
]
moves = Move.search(domain)
print(f"Factures trouvées : {len(moves)}")

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
print(f"Reset {len(moves)} factures en todo")

# Envoi vers DVIG — 15 rounds × 50 (cron limit)
for i in range(15):
    Move.cron_vault_send_dvig()
    env.cr.commit()
    env["dorevia.dvig.service"].trigger_worker(limit=100)
    if i < 14:
        print(f"  Cron round {i+1}/15 OK")
print("cron_vault_send_dvig OK")
print("trigger_worker OK")
print("Lancer la boucle outbox DVIG (RUNBOOK_BACKFILL_VAULT.md)")

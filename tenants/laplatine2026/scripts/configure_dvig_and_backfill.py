#!/usr/bin/env python3
"""Configure DVIG params and init backfill for laplatine2026.
Run: docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 -c /etc/odoo/odoo.conf < configure_dvig_and_backfill.py
"""
# Token from: ./bin/dorevia.sh token issue odoo lab laplatine2026
DVIG_URL = "http://dvig-core-stinger:8080"
DVIG_TOKEN = "dvig_fml8IrTy-12pFzfz0rAKa8haWDEtMPRH5_Hr7MLdQ98"
VAULT_URL = "http://vault-core-stinger:8080"
TENANT = "laplatine2026"
DVIG_SOURCE = "odoo.lab.laplatine2026"

def main(env):
    icp = env["ir.config_parameter"].sudo()
    icp.set_param("dorevia.dvig.url", DVIG_URL)
    icp.set_param("dorevia.dvig.token", DVIG_TOKEN)
    icp.set_param("dorevia.tenant", TENANT)
    icp.set_param("dorevia.dvig.source", DVIG_SOURCE)
    icp.set_param("dorevia.vault.url", VAULT_URL)
    icp.set_param("dorevia.vault.tenant", TENANT)
    env.cr.commit()
    print("Config DVIG + Vault OK")

    # Init backfill factures: set todo for posted invoices without vault_id
    Move = env["account.move"].sudo()
    if "dorevia_vault_idempotency_key" in Move._fields:
        ELIGIBLE = ("out_invoice", "out_refund", "in_invoice", "in_refund")
        domain = [
            ("state", "=", "posted"),
            ("move_type", "in", list(ELIGIBLE)),
            ("dorevia_vault_idempotency_key", "=", False),
        ]
        moves = Move.search(domain, limit=500)
        for m in moves:
            key = Move._compute_idempotency_key(m)
            m.with_context(dorevia_skip_posted_hook=True).write({
                "dorevia_vault_status": "todo",
                "dorevia_vault_idempotency_key": key,
                "dorevia_vault_next_retry_at": False,
            })
        env.cr.commit()
        print(f"Backfill init factures: {len(moves)} en todo")
    else:
        print("Champ vault absent - skip init factures")

    # Backfill RECONCIL
    try:
        result = env["bank.reconciliation.backfill"].run_backfill()
        print("Backfill RECONCIL:", result.get("message", "OK"))
    except Exception as e:
        print("Backfill RECONCIL:", e)

    # Trigger cron send
    try:
        env["account.move"].cron_vault_send_dvig()
        env.cr.commit()
        print("Cron vault_send_dvig exécuté")
    except Exception as e:
        print("Cron vault_send_dvig:", e)

# Odoo shell: env est injecté globalement
if "env" in dir():
    main(env)

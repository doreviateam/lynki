#!/usr/bin/env python3
"""Configure dorevia.dvig.internal.token et lancer le vaulting.
Run: docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 -c /etc/odoo/odoo.conf --no-http < fix_dvig_internal_and_vault.py
"""
# Token interne DVIG (doit correspondre à DVIG_INTERNAL_TOKEN du conteneur DVIG)
DVIG_INTERNAL_TOKEN = "dvig_internal_core-stinger_stinger"

def main(env):
    icp = env["ir.config_parameter"].sudo()
    icp.set_param("dorevia.dvig.internal.token", DVIG_INTERNAL_TOKEN)
    env.cr.commit()
    print("dorevia.dvig.internal.token configuré")

    # Cron vault send
    try:
        env["account.move"].cron_vault_send_dvig()
        env.cr.commit()
        print("cron_vault_send_dvig OK")
    except Exception as e:
        print("cron_vault_send_dvig:", e)

    # Trigger worker DVIG (traite l'outbox)
    try:
        env["dorevia.dvig.service"].trigger_worker(limit=100)
        print("trigger_worker OK")
    except Exception as e:
        print("trigger_worker:", e)

if "env" in dir():
    main(env)

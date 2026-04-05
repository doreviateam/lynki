# -*- coding: utf-8 -*-

from odoo import SUPERUSER_ID, api


def migrate(cr, version):
    """Active le cron billetterie et passe en horaire (bases déjà installées, xmlid noupdate historique)."""
    env = api.Environment(cr, SUPERUSER_ID, {})
    data = env["ir.model.data"].sudo().search(
        [
            ("module", "=", "dorevia_helloasso_billetterie"),
            ("name", "=", "ir_cron_helloasso_sync_billetterie_orders"),
        ],
        limit=1,
    )
    if data and data.noupdate:
        data.write({"noupdate": False})
    cron = env.ref(
        "dorevia_helloasso_billetterie.ir_cron_helloasso_sync_billetterie_orders",
        raise_if_not_found=False,
    )
    if cron:
        cron.sudo().write(
            {
                "active": True,
                "interval_type": "hours",
                "interval_number": 6,
            }
        )

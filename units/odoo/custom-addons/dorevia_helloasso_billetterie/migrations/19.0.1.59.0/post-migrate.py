# -*- coding: utf-8 -*-

from odoo import SUPERUSER_ID, api


def migrate(cr, version):
    """Rattache inventaire / commandes billetterie aux comptes HelloAsso (bases déjà en prod)."""
    env = api.Environment(cr, SUPERUSER_ID, {})
    from odoo.addons.dorevia_helloasso_billetterie.hooks import (
        _migrate_billetterie_helloasso_account_ids,
    )

    _migrate_billetterie_helloasso_account_ids(env)

# -*- coding: utf-8 -*-
"""Rattachement helloasso_account_id sur les partenaires adhérents (ir.rule res.partner)."""

import logging

from odoo import SUPERUSER_ID, api

from odoo.addons.dorevia_helloasso_members.hooks import (
    _migrate_partner_helloasso_account_ids,
)

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    env = api.Environment(cr, SUPERUSER_ID, {})
    _logger.info(
        "post-migrate dorevia_helloasso_members 19.0.1.28.0 : rattachement comptes partenaires"
    )
    _migrate_partner_helloasso_account_ids(env)

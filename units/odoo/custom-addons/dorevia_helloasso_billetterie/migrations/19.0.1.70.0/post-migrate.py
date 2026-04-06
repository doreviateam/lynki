# -*- coding: utf-8 -*-
"""Rattachement des inventaires billetterie orphelins à un compte HelloAsso (voir hooks._migrate_billetterie_helloasso_account_ids)."""

import logging

from odoo import SUPERUSER_ID, api

from odoo.addons.dorevia_helloasso_billetterie.hooks import (
    _migrate_billetterie_helloasso_account_ids,
)

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    env = api.Environment(cr, SUPERUSER_ID, {})
    _logger.info("post-migrate dorevia_helloasso_billetterie 19.0.1.70.0 : rattachement comptes inventaire")
    _migrate_billetterie_helloasso_account_ids(env)

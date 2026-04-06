# -*- coding: utf-8 -*-
"""Retrait de l’ancien héritage Paramètres (billetterie) : la connexion est dans members uniquement."""

import logging

from odoo import SUPERUSER_ID, api

_logger = logging.getLogger(__name__)


def migrate(cr, version):
    env = api.Environment(cr, SUPERUSER_ID, {})
    data = env["ir.model.data"].search(
        [
            ("module", "=", "dorevia_helloasso_billetterie"),
            ("name", "=", "res_config_settings_view_form_helloasso_billetterie"),
        ],
        limit=1,
    )
    if not data:
        return
    if data.model == "ir.ui.view" and data.res_id:
        view = env["ir.ui.view"].browse(data.res_id).exists()
        if view:
            _logger.info(
                "post-migrate billetterie : suppression vue Paramètres héritée id=%s",
                view.id,
            )
            view.unlink()
    data.unlink()

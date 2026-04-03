# -*- coding: utf-8 -*-

import logging

from odoo import SUPERUSER_ID, api

_logger = logging.getLogger(__name__)


def post_init_hook(cr, registry):
    """Supprime l’ancienne vue HelloAsso livrée par dorevia_helloasso_adherent (champs déplacés ici)."""
    env = api.Environment(cr, SUPERUSER_ID, {})
    view = env.ref(
        "dorevia_helloasso_adherent.view_partner_form_helloasso",
        raise_if_not_found=False,
    )
    if view:
        view.unlink()
        _logger.info(
            "Vue obsolète dorevia_helloasso_adherent.view_partner_form_helloasso supprimée"
        )

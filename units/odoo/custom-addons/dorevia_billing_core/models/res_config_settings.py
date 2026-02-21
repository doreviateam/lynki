# -*- coding: utf-8 -*-

from odoo import models, fields


class ResConfigSettings(models.TransientModel):
    """
    Extension de res.config.settings pour ajouter le champ vat_check_vies
    si le module base_vat n'est pas installé.
    Ceci évite l'erreur "vat_check_vies field is undefined" dans Odoo 18.0.
    """
    _inherit = 'res.config.settings'

    vat_check_vies = fields.Boolean(
        string='Verify VAT Numbers',
        help='Verify VAT numbers using the European VIES service',
        default=False,
    )


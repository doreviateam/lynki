# -*- coding: utf-8 -*-
# Identiques à OCA dms/dms/models/res_config_settings.py — évite KeyError dans
# res.config.settings.default_get() lorsque des ir.ui.view héritées de DMS
# référencent ces champs alors que le module dms n’est pas chargé.

from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    documents_binary_max_size = fields.Integer(
        string="Size",
        help="Defines the maximum upload size in MB. Default (25MB)",
        config_parameter="dms.binary_max_size",
    )
    documents_forbidden_extensions = fields.Char(
        string="Extensions",
        help="Defines a list of forbidden file extensions. (Example: 'exe,msi')",
        config_parameter="dms.forbidden_extensions",
    )

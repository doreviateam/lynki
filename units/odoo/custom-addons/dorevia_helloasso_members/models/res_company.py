# -*- coding: utf-8 -*-

from odoo import fields, models


class ResCompany(models.Model):
    _inherit = "res.company"

    helloasso_use_sandbox = fields.Boolean(
        string="HelloAsso — bac à sable",
        help="Si activé, les appels API ciblent l’environnement de test HelloAsso.",
    )
    helloasso_client_id = fields.Char(string="HelloAsso — client ID")
    helloasso_client_secret = fields.Char(string="HelloAsso — client secret")
    helloasso_organization_slug = fields.Char(
        string="HelloAsso — slug organisation",
        help="organizationSlug dans les chemins API v5.",
    )
    helloasso_organization_display_name = fields.Char(
        string="HelloAsso — nom affiché (facultatif)",
        help="Libellé lisible dans les vues HelloAsso (billetterie, etc.).",
    )

# -*- coding: utf-8 -*-

from odoo import fields, models


class ResPartner(models.Model):
    _inherit = "res.partner"

    helloasso_account_id = fields.Many2one(
        "dorevia.helloasso.account",
        string="Compte HelloAsso source",
        ondelete="set null",
        index=True,
        help="Dernier compte HelloAsso ayant alimenté les champs adhésion sur ce contact.",
    )

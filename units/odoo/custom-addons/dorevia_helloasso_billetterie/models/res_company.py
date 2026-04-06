# -*- coding: utf-8 -*-

from odoo import fields, models


class ResCompany(models.Model):
    _inherit = "res.company"

    helloasso_billetterie_form_type = fields.Char(
        string="HelloAsso billetterie — type de campagne par défaut",
        default="Event",
        help="Valeur technique côté HelloAsso (ex. billetterie événement).",
    )
    helloasso_billetterie_form_slug = fields.Char(
        string="HelloAsso billetterie — identifiant campagne (optionnel)",
        help="Si vide, la première campagne du type indiqué est utilisée pour les actions par défaut.",
    )

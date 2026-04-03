# -*- coding: utf-8 -*-

from odoo import fields, models


class ResPartner(models.Model):
    _inherit = "res.partner"

    member_type_id = fields.Many2one(
        "res.partner.member.type",
        string="Type d'adhérent",
        tracking=True,
    )
    consent_personal_data = fields.Boolean(
        string="Consentement données personnelles",
        tracking=True,
    )
    consent_date = fields.Date(
        string="Date du consentement",
        tracking=True,
    )
    consent_note = fields.Text(string="Détail / référence consentement")

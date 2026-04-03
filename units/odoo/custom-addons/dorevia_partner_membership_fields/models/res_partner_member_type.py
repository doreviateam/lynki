# -*- coding: utf-8 -*-

from odoo import fields, models


class ResPartnerMemberType(models.Model):
    _name = "res.partner.member.type"
    _description = "Type d'adhérent"
    _order = "sequence, name"

    name = fields.Char(required=True, translate=True)
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)

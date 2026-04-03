# -*- coding: utf-8 -*-

from odoo import fields, models


class HelloassoPreviewWizard(models.TransientModel):
    _name = "dorevia.helloasso.preview.wizard"
    _description = "Rapport prévisualisation HelloAsso (lecture seule)"

    preview_text = fields.Text(string="Rapport", readonly=True)

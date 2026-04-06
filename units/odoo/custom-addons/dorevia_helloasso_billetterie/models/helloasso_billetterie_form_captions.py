# -*- coding: utf-8 -*-
"""Champs d'affichage liste / recherche (extension du modèle inventaire).

Séparés du fichier principal pour un enregistrement explicite par le registre Odoo
et pour limiter les conflits de fusion sur ``helloasso_billetterie_form.py``.
"""

from odoo import api, fields, models

from .helloasso_ux_labels import form_type_label_for_display


class DoreviaHelloassoBilletterieFormCaptions(models.Model):
    _inherit = "dorevia.helloasso.billetterie.form"

    billetterie_org_caption = fields.Char(
        string="Organisation",
        compute="_compute_billetterie_org_caption",
        store=True,
        readonly=True,
        help="Nom lisible si renseigné dans les paramètres HelloAsso ; sinon la référence technique.",
    )
    billetterie_type_caption = fields.Char(
        string="Type",
        compute="_compute_billetterie_type_caption",
        store=True,
        readonly=True,
    )

    @api.depends(
        "organization_slug",
        "helloasso_account_id",
        "helloasso_account_id.organization_display_name",
    )
    def _compute_billetterie_org_caption(self):
        for rec in self:
            acc = rec.helloasso_account_id
            name = (acc.organization_display_name or "").strip() if acc else ""
            rec.billetterie_org_caption = name or (rec.organization_slug or "")

    @api.depends("form_type")
    def _compute_billetterie_type_caption(self):
        for rec in self:
            rec.billetterie_type_caption = form_type_label_for_display(rec.form_type)

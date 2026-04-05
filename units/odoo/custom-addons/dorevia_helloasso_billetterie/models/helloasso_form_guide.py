# -*- coding: utf-8 -*-
"""Page d’aide applicative : orientation HelloAsso dans Odoo (lecture seule, sans fiche technique)."""

from odoo import _, api, fields, models


class DoreviaHelloassoFormGuide(models.TransientModel):
    _name = "dorevia.helloasso.form.guide"
    _description = "HelloAsso — page d’aide (transient)"
    # Ne pas nommer ce champ « name » : le client web Owl peut le traiter comme réservé
    # et lever « field is undefined » sur les formulaires.
    _rec_name = "page_title"

    page_title = fields.Char(string="Titre", readonly=True)

    env_label = fields.Char(string="Environnement", readonly=True)
    org_slug = fields.Char(string="Organisation", readonly=True)
    count_event_forms = fields.Integer(
        string="Billetteries en base",
        readonly=True,
    )

    def name_get(self):
        label = _("Aide HelloAsso")
        return [(rec.id, label) for rec in self]

    @api.model
    def default_get(self, fields_list):
        vals = super().default_get(fields_list)
        icp = self.env["ir.config_parameter"].sudo()
        use_sb = icp.get_param("dorevia_helloasso.use_sandbox") == "True"
        slug = (icp.get_param("dorevia_helloasso.organization_slug") or "").strip()
        Form = self.env["dorevia.helloasso.billetterie.form"].sudo()
        event_count = Form.search_count([("form_type", "=", "Event")])
        vals.update(
            {
                "page_title": _("Aide HelloAsso"),
                "env_label": _("Essai (bac à sable)") if use_sb else _("Production"),
                "org_slug": slug or _("Non renseignée — voir Paramètres généraux"),
                "count_event_forms": event_count,
            }
        )
        return vals

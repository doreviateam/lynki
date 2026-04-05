# -*- coding: utf-8 -*-
"""Repère lecture seule : rôle des formulaires HelloAsso (Membership vs Event)."""

from odoo import _, api, fields, models


class DoreviaHelloassoFormGuide(models.TransientModel):
    _name = "dorevia.helloasso.form.guide"
    _description = "HelloAsso — repère formulaires"

    env_label = fields.Char(string="Environnement API", readonly=True)
    org_slug = fields.Char(string="Organisation (slug)", readonly=True)
    count_event_forms = fields.Integer(
        string="Billetteries inventoriées (formulaires Event)",
        readonly=True,
    )
    membership_blurb = fields.Text(string="Flux adhésion (Membership)", readonly=True)
    billetterie_blurb = fields.Text(string="Flux billetterie (Event)", readonly=True)
    technical_blurb = fields.Text(string="Paramètres et API", readonly=True)

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
                "env_label": _("Sandbox") if use_sb else _("Production"),
                "org_slug": slug or _("(non renseigné)"),
                "count_event_forms": event_count,
                "membership_blurb": _(
                    "Les adhésions proviennent des paiements sur des formulaires HelloAsso de type « Membership ». "
                    "Odoo les rapproche vers les contacts (identifiants HelloAsso, traçabilité). "
                    "Liste à jour : menu Adhésion ; synchro : Paramètres généraux → bloc HelloAsso (adhérent / Members)."
                ),
                "billetterie_blurb": _(
                    "Les billetteries correspondent aux formulaires de type « Event » exposés par l’API "
                    "(inventaire sous menu Billetteries). Chaque ligne porte le slug et le titre HelloAsso ; "
                    "la synchronisation des commandes s’effectue depuis cette liste ou via l’assistant Synchronisation."
                ),
                "technical_blurb": _(
                    "Identifiants OAuth2, slug d’organisation et mode sandbox / production sont communs aux deux flux "
                    "(Paramètres généraux). La prévisualisation API et les rapports techniques restent dans ce même bloc."
                ),
            }
        )
        return vals

# -*- coding: utf-8 -*-
"""Écran d’accueil minimal (lot 1 — M1) : lecture Paramètres + liens vers Adhérents / Commandes."""

from odoo import _, api, fields, models


class DoreviaHelloassoLanding(models.TransientModel):
    _name = "dorevia.helloasso.landing"
    _description = "HelloAsso — vue d’ensemble"

    env_label = fields.Char(string="Environnement API", readonly=True)
    org_slug = fields.Char(string="Organisation (slug)", readonly=True)
    api_ready = fields.Char(string="Identifiants API", readonly=True)
    help_text = fields.Text(string="Rappel", readonly=True)

    @api.model
    def default_get(self, fields_list):
        vals = super().default_get(fields_list)
        icp = self.env["ir.config_parameter"].sudo()
        use_sb = icp.get_param("dorevia_helloasso.use_sandbox") == "True"
        slug = (icp.get_param("dorevia_helloasso.organization_slug") or "").strip()
        cid = (icp.get_param("dorevia_helloasso.client_id") or "").strip()
        csec = (icp.get_param("dorevia_helloasso.client_secret") or "").strip()
        vals.update(
            {
                "env_label": _("Sandbox") if use_sb else _("Production"),
                "org_slug": slug or _("(non renseigné)"),
                "api_ready": (
                    _("Oui (client ID et secret renseignés)")
                    if (cid and csec)
                    else _("Non — à renseigner dans Paramètres")
                ),
                "help_text": _(
                    "Les tests de connexion, prévisualisations et synchronisations manuelles "
                    "sont disponibles dans Paramètres généraux, sections HelloAsso (adhérents et billetterie)."
                ),
            }
        )
        return vals

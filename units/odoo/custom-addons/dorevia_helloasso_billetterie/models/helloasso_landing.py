# -*- coding: utf-8 -*-
"""Synthèse connecteur (admin) : indicateurs + raccourcis vers Adhésions / Commandes billetterie."""

from odoo import _, api, fields, models


class DoreviaHelloassoLanding(models.TransientModel):
    _name = "dorevia.helloasso.landing"
    _description = "HelloAsso — vue d’ensemble"

    env_label = fields.Char(string="Environnement API", readonly=True)
    org_slug = fields.Char(string="Organisation (slug)", readonly=True)
    api_ready = fields.Char(string="Identifiants API", readonly=True)
    count_adherents = fields.Integer(string="Adhésions synchronisées (nombre)", readonly=True)
    count_billetterie_orders = fields.Integer(string="Commandes billetterie (nombre)", readonly=True)
    last_adherent_sync_at = fields.Datetime(string="Dernière synchro adhérents", readonly=True)
    last_billetterie_sync_at = fields.Datetime(string="Dernière synchro billetterie", readonly=True)
    help_text = fields.Text(string="Rappel", readonly=True)

    _ADHERENTS_DOMAIN = [
        ("helloasso_external_id", "!=", False),
        ("helloasso_form_type", "=", "Membership"),
    ]

    @api.model
    def default_get(self, fields_list):
        vals = super().default_get(fields_list)
        icp = self.env["ir.config_parameter"].sudo()
        use_sb = icp.get_param("dorevia_helloasso.use_sandbox") == "True"
        slug = (icp.get_param("dorevia_helloasso.organization_slug") or "").strip()
        cid = (icp.get_param("dorevia_helloasso.client_id") or "").strip()
        csec = (icp.get_param("dorevia_helloasso.client_secret") or "").strip()
        Partner = self.env["res.partner"].sudo()
        Order = self.env["dorevia.helloasso.billetterie.order"].sudo()
        last_p = Partner.search(self._ADHERENTS_DOMAIN, order="helloasso_last_sync_at desc", limit=1)
        last_o = Order.search([], order="last_sync_at desc", limit=1)
        vals.update(
            {
                "env_label": _("Sandbox") if use_sb else _("Production"),
                "org_slug": slug or _("(non renseigné)"),
                "api_ready": (
                    _("Oui (client ID et secret renseignés)")
                    if (cid and csec)
                    else _("Non — à renseigner dans Paramètres")
                ),
                "count_adherents": Partner.search_count(self._ADHERENTS_DOMAIN),
                "count_billetterie_orders": Order.search_count([]),
                "last_adherent_sync_at": last_p.helloasso_last_sync_at or False,
                "last_billetterie_sync_at": last_o.last_sync_at or False,
                "help_text": _(
                    "Menu HelloAsso : « Adhésion » et « Billetteries » uniquement. "
                    "Adhésion à jour : Paramètres → HelloAsso adhérent → Synchroniser (ou cron). "
                    "Billetteries : consultation référentiel Event ; import sur sélection ; rechargement catalogue via Action ; liste Commandes consultation pure ; assistant via Action ou Paramètres généraux."
                ),
            }
        )
        return vals

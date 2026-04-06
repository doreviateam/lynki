# -*- coding: utf-8 -*-
"""Synthèse connecteur (admin) : indicateurs + raccourcis vers Adhésions / Commandes billetterie."""

from odoo import _, api, fields, models
from odoo.addons.dorevia_helloasso_members.models.helloasso_company_params import (
    get_helloasso_connection_params,
)

from .helloasso_form_guide import helloasso_prepare_window_action


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

    def _company_membership_domain(self, company):
        domain = list(self._ADHERENTS_DOMAIN)
        if not company:
            return domain
        return domain + [
            "|",
            ("helloasso_account_id.company_id", "=", company.id),
            "&",
            ("helloasso_account_id", "=", False),
            ("company_id", "=", company.id),
        ]

    @api.model
    def default_get(self, fields_list):
        vals = super().default_get(fields_list)
        company = self.env.company
        params = get_helloasso_connection_params(self.env)
        use_sb = params["use_sandbox"]
        slug = (params["organization_slug"] or "").strip()
        cid = (params["client_id"] or "").strip()
        csec = (params["client_secret"] or "").strip()
        Partner = self.env["res.partner"].sudo()
        Order = self.env["dorevia.helloasso.billetterie.order"].sudo()
        adherent_domain = self._company_membership_domain(company)
        order_domain = [("company_id", "=", company.id)] if company else []
        last_p = Partner.search(
            adherent_domain, order="helloasso_last_sync_at desc", limit=1
        )
        last_o = Order.search(order_domain, order="last_sync_at desc", limit=1)
        vals.update(
            {
                "env_label": _("Sandbox") if use_sb else _("Production"),
                "org_slug": slug or _("(non renseigné)"),
                "api_ready": (
                    _("Oui (client ID et secret renseignés)")
                    if (cid and csec)
                    else _("Non — à renseigner dans Paramètres")
                ),
                "count_adherents": Partner.search_count(adherent_domain),
                "count_billetterie_orders": Order.search_count(order_domain),
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

    def action_helloasso_open_adhesion(self):
        self.ensure_one()
        return helloasso_prepare_window_action(
            self.env, "dorevia_helloasso_billetterie.action_helloasso_partner_adherents"
        )

    def action_helloasso_open_billetteries(self):
        self.ensure_one()
        return helloasso_prepare_window_action(
            self.env, "dorevia_helloasso_billetterie.action_dorevia_helloasso_billetterie_form"
        )

    def action_helloasso_open_commandes(self):
        self.ensure_one()
        return helloasso_prepare_window_action(
            self.env, "dorevia_helloasso_billetterie.action_dorevia_helloasso_billetterie_order"
        )

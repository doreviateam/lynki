# -*- coding: utf-8 -*-
"""Page d’aide applicative : orientation HelloAsso dans Odoo (lecture seule, sans fiche technique)."""

from markupsafe import Markup, escape

from odoo import _, api, fields, models
from odoo.addons.dorevia_helloasso_members.models.helloasso_company_params import (
    get_helloasso_connection_params,
)
from odoo.tools.safe_eval import safe_eval


def helloasso_prepare_window_action(env, xmlid):
    """Retourne un dict d’action fenêtre sans active_* (boutons object depuis transients)."""
    act = env.ref(xmlid)
    action = dict(act._get_action_dict())
    ctx = action.get("context") or {}
    if isinstance(ctx, str):
        ctx = safe_eval(ctx or "{}", {})
    else:
        ctx = dict(ctx)
    ctx.update({"active_id": False, "active_ids": [], "active_model": False})
    action["context"] = ctx
    return action


class DoreviaHelloassoFormGuide(models.TransientModel):
    _name = "dorevia.helloasso.form.guide"
    _description = "HelloAsso — accueil applicatif (transient)"
    # Ne pas nommer ce champ « name » : le client web Owl peut le traiter comme réservé
    # et lever « field is undefined » sur les formulaires.
    _rec_name = "page_title"

    page_title = fields.Char(string="Titre", readonly=True)

    company_label = fields.Char(string="Société active", readonly=True)
    status_label = fields.Char(string="Statut", readonly=True)
    env_label = fields.Char(string="Environnement", readonly=True)
    org_slug = fields.Char(string="Organisation", readonly=True)
    api_ready_label = fields.Char(string="Connexion API", readonly=True)
    checks_html = fields.Html(
        string="Points à vérifier",
        readonly=True,
        sanitize=False,
    )
    # Un seul champ d’aperçu (HTML) : évite plusieurs balises <field> entier sur le transient,
    # source d’erreurs client « field is undefined » si le registre et la vue ne sont pas alignés.
    landing_stats_html = fields.Html(
        string="Aperçu chiffré",
        readonly=True,
        sanitize=False,
    )
    last_adherent_sync_at = fields.Datetime(
        string="Dernière synchro adhésions",
        readonly=True,
    )
    last_billetterie_sync_at = fields.Datetime(
        string="Dernière synchro billetterie",
        readonly=True,
    )
    last_payment_sync_at = fields.Datetime(
        string="Dernier import paiements",
        readonly=True,
    )

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

    def _landing_stats_markup(self, n_adh, n_forms, n_orders, n_payments):
        """Bloc HTML lecture seule (compteurs échappés)."""

        def card(num, label):
            return Markup(
                '<div class="col-lg-4 col-md-4">'
                '<div class="rounded-3 border p-3 h-100 bg-light">'
                '<div class="fs-2 fw-bold text-primary">%(num)s</div>'
                '<div class="text-muted small">%(label)s</div>'
                '</div></div>'
            ) % {"num": escape(str(num)), "label": escape(str(label))}

        return Markup('<div class="row g-3 mb-0">%s%s%s</div>') % (
            card(n_adh, _("contacts synchronisés pour cette société")),
            card(n_forms, _("campagnes en base pour cette société")),
            card(n_orders, _("commandes importées pour cette société")),
            card(n_payments, _("paiements importés pour cette société")),
        )

    def _checks_markup(self, company, use_sb, slug, api_ready, last_p, last_o):
        messages = []
        if not slug:
            messages.append(
                _("Organisation HelloAsso non renseignée pour cette société.")
            )
        if use_sb:
            messages.append(
                _(
                    "Mode essai actif pour cette société : les données affichées proviennent du bac à sable HelloAsso."
                )
            )
        if not api_ready:
            messages.append(
                _(
                    "Connexion HelloAsso incomplète pour cette société : compléter les paramètres avant utilisation."
                )
            )
        if not last_p and not last_o:
            messages.append(
                _("Aucune synchronisation récente détectée pour cette société.")
            )
        if not messages:
            messages = [
                _("La connexion HelloAsso est disponible pour cette société."),
                _("Les données synchronisées de cette société peuvent être consultées dans Odoo."),
            ]

        items = "".join(
            "<li>%s</li>" % escape(str(msg))
            for msg in messages[:3]
        )
        return Markup('<ul class="small text-muted mb-0 ps-3">%s</ul>') % Markup(items)

    def name_get(self):
        label = _("HelloAsso")
        return [(rec.id, label) for rec in self]

    @api.model
    def default_get(self, fields_list):
        vals = super().default_get(fields_list)
        company = self.env.company
        params = get_helloasso_connection_params(self.env)
        use_sb = params["use_sandbox"]
        slug = (params["organization_slug"] or "").strip()
        cid = (params["client_id"] or "").strip()
        csec = (params["client_secret"] or "").strip()
        api_ready = bool(cid and csec)
        Form = self.env["dorevia.helloasso.billetterie.form"].sudo()
        Partner = self.env["res.partner"].sudo()
        Order = self.env["dorevia.helloasso.billetterie.order"].sudo()
        Payment = self.env["dorevia.helloasso.payment"].sudo()
        form_domain = [("company_id", "=", company.id)]
        order_domain = [("company_id", "=", company.id)]
        payment_domain = [("company_id", "=", company.id)]
        adherent_domain = self._company_membership_domain(company)
        event_count = Form.search_count(form_domain)
        n_adh = Partner.search_count(adherent_domain)
        n_orders = Order.search_count(order_domain)
        n_payments = Payment.search_count(payment_domain)
        last_p = Partner.search(
            adherent_domain, order="helloasso_last_sync_at desc", limit=1
        )
        last_o = Order.search(order_domain, order="last_sync_at desc", limit=1)
        last_pay = Payment.search(payment_domain, order="write_date desc, id desc", limit=1)
        updates = {
            "page_title": _("HelloAsso"),
            "company_label": company.display_name if company else False,
            "status_label": (
                _("Configuration à compléter")
                if not (api_ready and slug)
                else (_("Connecté en mode essai") if use_sb else _("Connecté en production"))
            ),
            "env_label": _("Essai (bac à sable)") if use_sb else _("Production"),
            "org_slug": slug or _("À renseigner"),
            "api_ready_label": (
                _("Connexion prête")
                if api_ready
                else _("Configuration incomplète")
            ),
            "checks_html": self._checks_markup(
                company, use_sb, slug, api_ready, last_p, last_o
            ),
            "landing_stats_html": self._landing_stats_markup(
                n_adh, event_count, n_orders, n_payments
            ),
            "last_adherent_sync_at": last_p.helloasso_last_sync_at or False,
            "last_billetterie_sync_at": last_o.last_sync_at or False,
            "last_payment_sync_at": last_pay.write_date or False,
        }
        if fields_list:
            vals.update({k: v for k, v in updates.items() if k in fields_list})
        else:
            vals.update(updates)
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

    def action_helloasso_open_payments(self):
        self.ensure_one()
        return helloasso_prepare_window_action(
            self.env, "dorevia_helloasso_payment.action_dorevia_helloasso_payment"
        )

    def action_helloasso_open_settings(self):
        self.ensure_one()
        return helloasso_prepare_window_action(self.env, "base.res_config_setting_act_window")

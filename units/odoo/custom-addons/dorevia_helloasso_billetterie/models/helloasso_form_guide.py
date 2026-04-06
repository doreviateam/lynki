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

    env_label = fields.Char(string="Environnement", readonly=True)
    org_slug = fields.Char(string="Organisation", readonly=True)
    api_ready_label = fields.Char(string="Connexion API", readonly=True)
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

    _ADHERENTS_DOMAIN = [
        ("helloasso_external_id", "!=", False),
        ("helloasso_form_type", "=", "Membership"),
    ]

    def _landing_stats_markup(self, n_adh, n_forms, n_orders):
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
            card(n_adh, _("Adhésions synchronisées")),
            card(n_forms, _("Billetteries en base")),
            card(n_orders, _("Commandes importées")),
        )

    def name_get(self):
        label = _("HelloAsso")
        return [(rec.id, label) for rec in self]

    @api.model
    def default_get(self, fields_list):
        vals = super().default_get(fields_list)
        params = get_helloasso_connection_params(self.env)
        use_sb = params["use_sandbox"]
        slug = (params["organization_slug"] or "").strip()
        cid = (params["client_id"] or "").strip()
        csec = (params["client_secret"] or "").strip()
        Form = self.env["dorevia.helloasso.billetterie.form"].sudo()
        Partner = self.env["res.partner"].sudo()
        Order = self.env["dorevia.helloasso.billetterie.order"].sudo()
        event_count = Form.search_count([("form_type", "=", "Event")])
        n_adh = Partner.search_count(self._ADHERENTS_DOMAIN)
        n_orders = Order.search_count([])
        last_p = Partner.search(self._ADHERENTS_DOMAIN, order="helloasso_last_sync_at desc", limit=1)
        last_o = Order.search([], order="last_sync_at desc", limit=1)
        updates = {
            "page_title": _("HelloAsso"),
            "env_label": _("Essai (bac à sable)") if use_sb else _("Production"),
            "org_slug": slug or _("Non renseignée"),
            "api_ready_label": (
                _("Identifiants API renseignés")
                if (cid and csec)
                else _("À configurer dans Paramètres")
            ),
            "landing_stats_html": self._landing_stats_markup(n_adh, event_count, n_orders),
            "last_adherent_sync_at": last_p.helloasso_last_sync_at or False,
            "last_billetterie_sync_at": last_o.last_sync_at or False,
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

    def action_helloasso_open_settings(self):
        self.ensure_one()
        return helloasso_prepare_window_action(self.env, "base.res_config_setting_act_window")

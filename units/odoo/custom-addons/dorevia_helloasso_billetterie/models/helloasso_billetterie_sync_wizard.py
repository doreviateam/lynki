# -*- coding: utf-8 -*-
"""Assistant billetterie : prévisualisation et synchro sans ouvrir Paramètres généraux."""

from odoo import _, api, fields, models
from odoo.exceptions import UserError

from .helloasso_billetterie_sync import (
    build_billetterie_preview_report,
    format_billetterie_sync_result_message,
    run_billetterie_orders_sync,
)


class DoreviaHelloassoBilletterieSyncWizard(models.TransientModel):
    _name = "dorevia.helloasso.billetterie.sync.wizard"
    _description = "HelloAsso billetterie — synchronisation (assistant)"

    helloasso_org_slug = fields.Char(string="Organisation (slug)", readonly=True)
    helloasso_form_type = fields.Char(string="Form type billetterie", readonly=True)
    helloasso_form_slug = fields.Char(string="Form slug billetterie", readonly=True)
    helloasso_sandbox = fields.Char(string="Environnement API", readonly=True)

    @api.model
    def default_get(self, fields_list):
        vals = super().default_get(fields_list)
        icp = self.env["ir.config_parameter"].sudo()
        use_sb = icp.get_param("dorevia_helloasso.use_sandbox") == "True"
        vals.update(
            {
                "helloasso_org_slug": (icp.get_param("dorevia_helloasso.organization_slug") or "").strip()
                or _("(non renseigné)"),
                "helloasso_form_type": (
                    icp.get_param("dorevia_helloasso_billetterie.form_type") or "Event"
                ).strip(),
                "helloasso_form_slug": (
                    icp.get_param("dorevia_helloasso_billetterie.form_slug") or ""
                ).strip()
                or _("(vide — premier formulaire du type)"),
                "helloasso_sandbox": _("Sandbox") if use_sb else _("Production"),
            }
        )
        return vals

    def _billetterie_api_params(self):
        self.ensure_one()
        icp = self.env["ir.config_parameter"].sudo()
        cid = (icp.get_param("dorevia_helloasso.client_id") or "").strip()
        csec = (icp.get_param("dorevia_helloasso.client_secret") or "").strip()
        slug = (icp.get_param("dorevia_helloasso.organization_slug") or "").strip()
        if not (cid and csec):
            raise UserError(
                _(
                    "Identifiants API HelloAsso manquants. "
                    "Un administrateur doit les renseigner dans Paramètres généraux (bloc HelloAsso adhérent)."
                )
            )
        if not slug:
            raise UserError(
                _(
                    "Slug organisation HelloAsso manquant. "
                    "À renseigner dans Paramètres généraux par un administrateur."
                )
            )
        use_sandbox = icp.get_param("dorevia_helloasso.use_sandbox") == "True"
        ft = (icp.get_param("dorevia_helloasso_billetterie.form_type") or "Event").strip()
        fs = (icp.get_param("dorevia_helloasso_billetterie.form_slug") or "").strip()
        return {
            "organization_slug": slug,
            "client_id": cid,
            "client_secret": csec,
            "use_sandbox": use_sandbox,
            "form_type": ft or "Event",
            "form_slug": fs or None,
        }

    def action_helloasso_billetterie_preview(self):
        self.ensure_one()
        p = self._billetterie_api_params()
        message = build_billetterie_preview_report(
            self.env,
            p["organization_slug"],
            p["client_id"],
            p["client_secret"],
            p["use_sandbox"],
            form_type=p["form_type"],
            form_slug=p["form_slug"],
        )
        wizard = self.env["dorevia.helloasso.preview.wizard"].create(
            {"preview_text": message}
        )
        return {
            "type": "ir.actions.act_window",
            "name": _("HelloAsso billetterie — prévisualisation"),
            "res_model": "dorevia.helloasso.preview.wizard",
            "res_id": wizard.id,
            "view_mode": "form",
            "target": "new",
        }

    def action_helloasso_billetterie_sync_orders(self):
        self.ensure_one()
        p = self._billetterie_api_params()
        # Écritures sur commandes / partenaires : droits connecteur (les utilisateurs n’ont souvent que la lecture).
        stats = run_billetterie_orders_sync(
            self.sudo().env,
            p["organization_slug"],
            p["client_id"],
            p["client_secret"],
            p["use_sandbox"],
            p["form_type"],
            p["form_slug"],
            log_origin="wizard",
        )
        message = format_billetterie_sync_result_message(stats)
        notif_type = (
            "success"
            if (stats.get("created") or stats.get("updated")) and not stats.get("errors")
            else "warning"
        )
        return {
            "type": "ir.actions.client",
            "tag": "display_notification",
            "params": {
                "title": _("HelloAsso billetterie — synchronisation"),
                "message": message,
                "type": notif_type,
                "sticky": True,
            },
        }

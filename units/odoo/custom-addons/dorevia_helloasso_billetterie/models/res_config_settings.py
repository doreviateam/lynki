# -*- coding: utf-8 -*-

from odoo import _, fields, models
from odoo.exceptions import UserError

from .helloasso_billetterie_sync import (
    build_billetterie_preview_report,
    format_billetterie_sync_result_message,
    run_billetterie_orders_sync,
)


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    def set_values(self):
        res = super().set_values()
        # Recalcul des libellés organisation (ICP slug / nom affiché) sur l’inventaire billetterie.
        Form = self.env["dorevia.helloasso.billetterie.form"].sudo()
        forms = Form.search([])
        if forms:
            forms.invalidate_recordset(["billetterie_org_caption"])
        return res

    helloasso_billetterie_form_type = fields.Char(
        string="Type de campagne par défaut",
        config_parameter="dorevia_helloasso_billetterie.form_type",
        default="Event",
        help="Valeur technique côté HelloAsso (ex. billetterie événement). À aligner avec vos campagnes.",
    )
    helloasso_billetterie_form_slug = fields.Char(
        string="Identifiant billetterie (optionnel)",
        config_parameter="dorevia_helloasso_billetterie.form_slug",
        help="Si vide, la première campagne du type indiqué est utilisée pour les actions par défaut.",
    )

    def action_helloasso_billetterie_preview(self, *args, **kwargs):
        self.ensure_one()
        if not (self.helloasso_client_id and self.helloasso_client_secret):
            raise UserError(
                _("Renseignez le client ID et le client secret HelloAsso (bloc adhérent).")
            )
        slug = (self.helloasso_organization_slug or "").strip()
        if not slug:
            raise UserError(_("Renseignez le slug organisation HelloAsso (bloc adhérent)."))
        use_sandbox = bool(self.helloasso_use_sandbox)
        ft = (self.helloasso_billetterie_form_type or "Event").strip()
        fs = (self.helloasso_billetterie_form_slug or "").strip()
        message = build_billetterie_preview_report(
            self.env,
            slug,
            self.helloasso_client_id,
            self.helloasso_client_secret,
            use_sandbox,
            form_type=ft,
            form_slug=fs or None,
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

    def action_helloasso_billetterie_sync_orders(self, *args, **kwargs):
        self.ensure_one()
        if not (self.helloasso_client_id and self.helloasso_client_secret):
            raise UserError(
                _("Renseignez le client ID et le client secret HelloAsso (bloc adhérent).")
            )
        if not self.helloasso_organization_slug:
            raise UserError(_("Renseignez le slug organisation HelloAsso."))
        use_sandbox = bool(self.helloasso_use_sandbox)
        ft = (self.helloasso_billetterie_form_type or "Event").strip()
        fs = (self.helloasso_billetterie_form_slug or "").strip()
        stats = run_billetterie_orders_sync(
            self.env,
            self.helloasso_organization_slug.strip(),
            self.helloasso_client_id,
            self.helloasso_client_secret,
            use_sandbox,
            ft or "Event",
            fs or None,
            log_origin="settings",
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

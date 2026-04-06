# -*- coding: utf-8 -*-

from odoo import _, api, fields, models
from odoo.exceptions import UserError

from odoo.addons.dorevia_helloasso_connector.models.helloasso_client import (
    HelloAssoClientError,
)

from .helloasso_payment_import import (
    import_api_payments_for_account,
    import_csv_payment_rows_message,
)


class DoreviaHelloassoPaymentApiImportWizard(models.TransientModel):
    _name = "dorevia.helloasso.payment.api.import.wizard"
    _description = "HelloAsso payment — import API"

    helloasso_account_id = fields.Many2one(
        "dorevia.helloasso.account",
        string="Compte HelloAsso",
        required=True,
        domain="[('active', '=', True)]",
        default=lambda self: self.env["dorevia.helloasso.account"].search(
            [("company_id", "=", self.env.company.id), ("active", "=", True)],
            limit=1,
        ),
    )
    company_id = fields.Many2one(
        "res.company",
        string="Société",
        related="helloasso_account_id.company_id",
        readonly=True,
    )
    form_type = fields.Char(string="formType", required=True)
    form_slug = fields.Char(string="formSlug", required=True)
    import_platform_only = fields.Boolean(
        string="Limiter au MVP plateforme",
        default=True,
        help="Si activé, n'importe que les paiements plateforme HelloAsso.",
    )
    page_size = fields.Integer(string="Taille page", default=50, required=True)
    max_pages = fields.Integer(string="Nombre max de pages", default=20, required=True)

    @api.onchange("helloasso_account_id")
    def _onchange_helloasso_account_id(self):
        account = self.helloasso_account_id
        if not account:
            return
        if not self.form_type:
            self.form_type = account.billetterie_default_form_type or "Event"
        if not self.form_slug:
            self.form_slug = account.billetterie_default_form_slug or ""

    def action_import_api(self):
        self.ensure_one()
        if self.page_size < 1:
            raise UserError(_("La taille de page doit être supérieure ou égale à 1."))
        if self.max_pages < 1:
            raise UserError(_("Le nombre max de pages doit être supérieur ou égal à 1."))
        try:
            stats = import_api_payments_for_account(
                self.sudo().env,
                self.helloasso_account_id,
                self.form_type,
                self.form_slug,
                import_platform_only=self.import_platform_only,
                page_size=self.page_size,
                max_pages=self.max_pages,
            )
        except HelloAssoClientError as err:
            raise UserError(str(err)) from err

        message = import_csv_payment_rows_message(stats)
        if stats.get("pages"):
            message = "%s | %s" % (_("Pages : %s") % stats["pages"], message)
        return {
            "type": "ir.actions.client",
            "tag": "display_notification",
            "params": {
                "title": _("HelloAsso payment — import API"),
                "message": message,
                "type": "success" if not stats.get("errors") else "warning",
                "sticky": True,
            },
        }

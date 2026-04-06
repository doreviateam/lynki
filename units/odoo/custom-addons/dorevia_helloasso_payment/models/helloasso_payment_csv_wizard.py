# -*- coding: utf-8 -*-

import base64

from odoo import _, fields, models
from odoo.exceptions import UserError

from .helloasso_payment_import import (
    import_csv_payment_rows,
    import_csv_payment_rows_message,
    parse_payment_csv_content,
)


class DoreviaHelloassoPaymentCsvWizard(models.TransientModel):
    _name = "dorevia.helloasso.payment.csv.wizard"
    _description = "HelloAsso payment — import CSV"

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
    import_platform_only = fields.Boolean(
        string="Limiter au MVP plateforme",
        default=True,
        help="Si activé, n'importe que les paiements plateforme HelloAsso.",
    )
    upload_file = fields.Binary(string="Fichier CSV", required=True)
    upload_filename = fields.Char(string="Nom du fichier")

    def action_import_csv(self):
        self.ensure_one()
        if not self.upload_file:
            raise UserError(_("Veuillez importer un fichier CSV HelloAsso."))
        try:
            csv_text = base64.b64decode(self.upload_file).decode("utf-8-sig")
        except Exception as err:
            raise UserError(_("Impossible de lire le fichier CSV : %s") % err) from err
        rows = parse_payment_csv_content(csv_text)
        if not rows:
            raise UserError(_("Le fichier CSV est vide ou illisible."))
        stats = import_csv_payment_rows(
            self.sudo().env,
            self.helloasso_account_id,
            rows,
            import_platform_only=self.import_platform_only,
        )
        return {
            "type": "ir.actions.client",
            "tag": "display_notification",
            "params": {
                "title": _("HelloAsso payment — import CSV"),
                "message": import_csv_payment_rows_message(stats),
                "type": "success" if not stats.get("errors") else "warning",
                "sticky": True,
            },
        }

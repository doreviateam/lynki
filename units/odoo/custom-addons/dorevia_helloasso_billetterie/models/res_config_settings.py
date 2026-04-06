# -*- coding: utf-8 -*-

from odoo import api, fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    helloasso_billetterie_form_type = fields.Char(
        string="Type de campagne par défaut",
        compute="_compute_helloasso_billetterie_defaults",
        inverse="_inverse_helloasso_billetterie_defaults",
    )
    helloasso_billetterie_form_slug = fields.Char(
        string="Identifiant billetterie (optionnel)",
        compute="_compute_helloasso_billetterie_defaults",
        inverse="_inverse_helloasso_billetterie_defaults",
    )

    @api.depends("company_id")
    def _compute_helloasso_billetterie_defaults(self):
        Account = self.env["dorevia.helloasso.account"].sudo()
        for s in self:
            company = s.company_id
            if not company:
                s.helloasso_billetterie_form_type = "Event"
                s.helloasso_billetterie_form_slug = False
                continue
            acc = Account.search([("company_id", "=", company.id)], limit=1)
            if acc:
                s.helloasso_billetterie_form_type = (
                    acc.billetterie_default_form_type or "Event"
                )
                s.helloasso_billetterie_form_slug = acc.billetterie_default_form_slug
            else:
                s.helloasso_billetterie_form_type = (
                    company.helloasso_billetterie_form_type or "Event"
                )
                s.helloasso_billetterie_form_slug = company.helloasso_billetterie_form_slug

    def _inverse_helloasso_billetterie_defaults(self):
        Account = self.env["dorevia.helloasso.account"].sudo()
        Form = self.env["dorevia.helloasso.billetterie.form"].sudo()
        for s in self:
            company = s.company_id
            if not company:
                continue
            ft = (s.helloasso_billetterie_form_type or "Event").strip() or "Event"
            fs = (s.helloasso_billetterie_form_slug or "").strip()
            company.write(
                {
                    "helloasso_billetterie_form_type": ft,
                    "helloasso_billetterie_form_slug": fs,
                }
            )
            acc = Account.search([("company_id", "=", company.id)], limit=1)
            if acc:
                acc.write(
                    {
                        "billetterie_default_form_type": ft,
                        "billetterie_default_form_slug": fs,
                    }
                )
            forms = Form.search([])
            if forms:
                forms.invalidate_recordset(["billetterie_org_caption"])

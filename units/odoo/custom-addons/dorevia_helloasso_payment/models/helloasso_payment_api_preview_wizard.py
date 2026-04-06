# -*- coding: utf-8 -*-

import json

from odoo import _, api, fields, models
from odoo.exceptions import UserError

from odoo.addons.dorevia_helloasso_connector.models.helloasso_client import (
    HelloAssoClientError,
    HelloAssoConnectionContext,
    fetch_client_credentials_token,
    fetch_form_payments_page,
)


class DoreviaHelloassoPaymentApiPreviewWizard(models.TransientModel):
    _name = "dorevia.helloasso.payment.api.preview.wizard"
    _description = "HelloAsso payment — observation payload API"

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
    page_index = fields.Integer(string="Page", default=1, required=True)
    page_size = fields.Integer(string="Taille page", default=1, required=True)
    summary_text = fields.Text(string="Résumé", readonly=True)
    payload_text = fields.Text(string="Premier payload payment", readonly=True)

    @api.onchange("helloasso_account_id")
    def _onchange_helloasso_account_id(self):
        account = self.helloasso_account_id
        if not account:
            return
        if not self.form_type:
            self.form_type = account.billetterie_default_form_type or "Event"
        if not self.form_slug:
            self.form_slug = account.billetterie_default_form_slug or ""

    def action_fetch_preview(self):
        self.ensure_one()
        account = self.helloasso_account_id
        if not account:
            raise UserError(_("Veuillez sélectionner un compte HelloAsso."))
        if self.page_index < 1:
            raise UserError(_("Le numéro de page doit être supérieur ou égal à 1."))
        if self.page_size < 1:
            raise UserError(_("La taille de page doit être supérieure ou égale à 1."))

        params = account._to_connection_params()
        connection_ctx = HelloAssoConnectionContext.from_primitives(
            params.get("client_id"),
            params.get("client_secret"),
            params.get("use_sandbox"),
            params.get("organization_slug"),
        )
        if not connection_ctx.organization_slug:
            raise UserError(_("Le slug organisation du compte HelloAsso est manquant."))
        if not (self.form_type or "").strip():
            raise UserError(_("Le formType est obligatoire pour observer le payload API."))
        if not (self.form_slug or "").strip():
            raise UserError(_("Le formSlug est obligatoire pour observer le payload API."))

        try:
            token_payload = fetch_client_credentials_token(connection_ctx)
            items, total, raw = fetch_form_payments_page(
                connection_ctx,
                self.form_type,
                self.form_slug,
                token_payload["access_token"],
                page_index=self.page_index,
                page_size=self.page_size,
            )
        except HelloAssoClientError as err:
            raise UserError(str(err)) from err

        first_item = items[0] if items else {}
        item_keys = sorted(first_item.keys()) if isinstance(first_item, dict) else []
        summary = [
            _("Organisation : %s") % (connection_ctx.organization_slug or ""),
            _("formType : %s") % (self.form_type or ""),
            _("formSlug : %s") % (self.form_slug or ""),
            _("Page : %s") % self.page_index,
            _("Taille page : %s") % self.page_size,
            _("Nombre d'items retournés : %s") % len(items or []),
            _("Total API : %s") % (total if total is not None else _("indéterminé")),
            _("Clés du premier item : %s") % (", ".join(item_keys) if item_keys else _("aucune")),
        ]
        if isinstance(raw, dict):
            raw_keys = sorted(raw.keys())
            summary.append(_("Clés de l'enveloppe : %s") % ", ".join(raw_keys))

        self.summary_text = "\n".join(summary)
        self.payload_text = json.dumps(first_item or raw or {}, ensure_ascii=False, indent=2, default=str)

        return {
            "type": "ir.actions.act_window",
            "name": _("Observer payload API paiements HelloAsso"),
            "res_model": self._name,
            "res_id": self.id,
            "view_mode": "form",
            "target": "new",
        }

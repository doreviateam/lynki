# -*- coding: utf-8 -*-

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class DoreviaHelloassoPayment(models.Model):
    _name = "dorevia.helloasso.payment"
    _description = "Paiement HelloAsso"
    _order = "payment_date desc, id desc"
    _rec_name = "helloasso_payment_ref"

    helloasso_payment_ref = fields.Char(
        string="Réf paiement HelloAsso",
        required=True,
        index=True,
        copy=False,
    )
    helloasso_order_ref = fields.Char(
        string="Réf commande HelloAsso",
        index=True,
        copy=False,
    )
    company_id = fields.Many2one(
        "res.company",
        string="Société",
        required=True,
        index=True,
        ondelete="restrict",
    )
    helloasso_account_id = fields.Many2one(
        "dorevia.helloasso.account",
        string="Compte HelloAsso",
        required=True,
        index=True,
        ondelete="restrict",
    )
    campaign_name = fields.Char(string="Campagne")
    campaign_type = fields.Char(string="Type de campagne")
    payment_kind = fields.Selection(
        [
            ("online", "En ligne"),
            ("offline", "Hors ligne"),
        ],
        string="Type de paiement",
        default="online",
        required=True,
    )
    payment_date = fields.Datetime(string="Date du paiement")
    payment_status = fields.Char(string="Statut du paiement")
    payment_status_raw = fields.Char(string="Statut brut source")
    payout_status = fields.Char(string="Statut du versement")
    payout_status_raw = fields.Char(string="Statut brut de versement")
    payout_date = fields.Datetime(string="Date du versement")
    payment_method = fields.Char(string="Moyen de paiement")
    payment_method_raw = fields.Char(string="Moyen de paiement brut")
    amount_total = fields.Monetary(string="Montant total", currency_field="currency_id")
    payer_firstname = fields.Char(string="Prénom payeur")
    payer_lastname = fields.Char(string="Nom payeur")
    payer_email = fields.Char(string="Email payeur")
    source_payload = fields.Text(string="Payload source")
    currency_id = fields.Many2one(
        "res.currency",
        string="Devise",
        required=True,
        default=lambda self: self.env.company.currency_id.id,
        ondelete="restrict",
    )
    active = fields.Boolean(default=True)
    is_platform_payment = fields.Boolean(
        string="Paiement plateforme",
        default=True,
        help="Vrai pour un paiement encaissé en ligne par HelloAsso.",
    )
    is_offline_payment = fields.Boolean(
        string="Paiement hors ligne",
        default=False,
        help="Vrai pour un paiement seulement déclaré dans HelloAsso.",
    )

    _helloasso_payment_unique = models.Constraint(
        "UNIQUE(helloasso_account_id, helloasso_payment_ref)",
        "Cette référence de paiement HelloAsso existe déjà pour ce compte HelloAsso.",
    )

    @api.constrains("company_id", "helloasso_account_id")
    def _check_payment_account_company_consistency(self):
        for rec in self:
            if not rec.company_id or not rec.helloasso_account_id:
                continue
            if rec.helloasso_account_id.company_id != rec.company_id:
                raise ValidationError(
                    _(
                        "Le compte HelloAsso sélectionné est rattaché à une autre société Odoo."
                    )
                )


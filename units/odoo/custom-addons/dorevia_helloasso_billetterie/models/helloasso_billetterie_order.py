# -*- coding: utf-8 -*-

from odoo import api, fields, models


class DoreviaHelloassoBilletterieOrder(models.Model):
    _name = "dorevia.helloasso.billetterie.order"
    _description = "Commande billetterie HelloAsso (miroir MVP)"
    _order = "date_order desc, id desc"

    name = fields.Char(
        string="Libellé",
        compute="_compute_name",
        store=True,
    )
    helloasso_order_id = fields.Char(
        string="HelloAsso — id commande",
        required=True,
        index=True,
        copy=False,
    )
    form_slug = fields.Char(string="Formulaire (slug)", copy=False)
    form_type = fields.Char(string="Form type", copy=False)
    state_raw = fields.Char(string="Statut brut API", copy=False)
    amount_total = fields.Float(
        string="Montant total (€)",
        digits=(12, 2),
        copy=False,
        help="Conversion depuis les centimes API lorsque le montant est fourni à ce format.",
    )
    date_order = fields.Datetime(string="Date commande", copy=False)
    payer_partner_id = fields.Many2one(
        "res.partner",
        string="Payeur",
        ondelete="set null",
        copy=False,
    )
    catalog_form_id = fields.Many2one(
        "dorevia.helloasso.billetterie.form",
        string="Formulaire inventorié",
        ondelete="set null",
        index=True,
        copy=False,
        help="Lien vers la ligne d’inventaire si la synchro a été lancée depuis celle-ci.",
    )
    line_ids = fields.One2many(
        "dorevia.helloasso.billetterie.line",
        "order_id",
        string="Lignes / participants",
    )
    sync_status = fields.Selection(
        selection=[
            ("synced", "Synchronisé"),
            ("error", "Erreur"),
        ],
        string="Statut synchro",
        default="synced",
        copy=False,
    )
    last_sync_at = fields.Datetime(string="Dernière synchro", copy=False)
    sync_message = fields.Char(string="Message synchro", copy=False)

    _sql_constraints = [
        (
            "helloasso_order_id_unique",
            "unique(helloasso_order_id)",
            "Une commande avec cet identifiant HelloAsso existe déjà.",
        ),
    ]

    @api.depends("helloasso_order_id", "form_slug")
    def _compute_name(self):
        for rec in self:
            slug = rec.form_slug or ""
            oid = rec.helloasso_order_id or ""
            if slug and oid:
                rec.name = "%s — %s" % (slug, oid)
            elif oid:
                rec.name = oid
            else:
                rec.name = "—"


class DoreviaHelloassoBilletterieLine(models.Model):
    _name = "dorevia.helloasso.billetterie.line"
    _description = "Ligne billet / participant (commande HelloAsso)"
    _order = "order_id, sequence, id"

    order_id = fields.Many2one(
        "dorevia.helloasso.billetterie.order",
        string="Commande",
        required=True,
        ondelete="cascade",
        index=True,
    )
    sequence = fields.Integer(string="Séquence", default=10)
    ticket_label = fields.Char(string="Libellé billet / article", copy=False)
    item_type = fields.Char(string="Type article (API)", copy=False)
    participant_email = fields.Char(string="E-mail participant", copy=False)
    participant_first_name = fields.Char(string="Prénom", copy=False)
    participant_last_name = fields.Char(string="Nom", copy=False)
    helloasso_item_id = fields.Char(
        string="HelloAsso — id ligne",
        copy=False,
        index=True,
    )

# -*- coding: utf-8 -*-

from odoo import api, fields, models

from .helloasso_ux_labels import form_type_label_for_display


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
        string="Réf. commande HelloAsso",
        required=True,
        index=True,
        copy=False,
    )
    form_slug = fields.Char(
        string="Identifiant HelloAsso",
        copy=False,
        help="Référence de la billetterie sur HelloAsso.",
    )
    form_type = fields.Char(
        string="Type (HelloAsso)",
        copy=False,
        help="Valeur technique côté HelloAsso.",
    )
    billetterie_type_caption = fields.Char(
        string="Type",
        compute="_compute_billetterie_type_caption",
        store=True,
        readonly=True,
    )
    state_raw = fields.Char(
        string="Statut HelloAsso",
        copy=False,
    )
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
    line_ids = fields.One2many(
        "dorevia.helloasso.billetterie.line",
        "order_id",
        string="Lignes / participants",
    )
    sync_status = fields.Selection(
        selection=[
            ("synced", "Importé"),
            ("error", "Erreur"),
        ],
        string="État d’import",
        default="synced",
        copy=False,
    )
    last_sync_at = fields.Datetime(string="Dernière mise à jour", copy=False)
    sync_message = fields.Char(string="Détail import", copy=False)
    helloasso_account_id = fields.Many2one(
        "dorevia.helloasso.account",
        string="Compte HelloAsso",
        ondelete="restrict",
        index=True,
        copy=False,
        required=True,
        help="Origine métier de la commande importée (isole LGZ / RGL, etc.).",
    )
    company_id = fields.Many2one(
        "res.company",
        string="Société",
        related="helloasso_account_id.company_id",
        store=True,
        readonly=True,
        index=True,
    )

    _helloasso_order_unique_per_account = models.Constraint(
        "UNIQUE(helloasso_account_id, helloasso_order_id)",
        "Une commande avec cet identifiant HelloAsso existe déjà pour ce compte.",
    )

    @api.depends("form_type")
    def _compute_billetterie_type_caption(self):
        for rec in self:
            rec.billetterie_type_caption = form_type_label_for_display(rec.form_type)

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
    helloasso_payment_ids = fields.Char(
        string="HelloAsso — id(s) paiement (ligne)",
        copy=False,
        help="Identifiant(s) du ou des paiements HelloAsso rattachés à cette ligne (JSON ``items[].payments``).",
    )
    payment_share_euros = fields.Float(
        string="Part paiement (€)",
        digits=(12, 2),
        copy=False,
        help="Somme des ``shareAmount`` des paiements de la ligne, convertie depuis les centimes API.",
    )
    payment_state_raw = fields.Char(
        string="Statut paiement (ligne)",
        copy=False,
        help="État texte du paiement côté ligne, si fourni par l’API.",
    )

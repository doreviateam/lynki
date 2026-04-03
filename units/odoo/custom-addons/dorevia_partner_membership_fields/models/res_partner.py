# -*- coding: utf-8 -*-

from odoo import fields, models


class ResPartner(models.Model):
    _inherit = "res.partner"

    member_type_id = fields.Many2one(
        "res.partner.member.type",
        string="Type d'adhérent",
        tracking=True,
    )
    consent_personal_data = fields.Boolean(
        string="Consentement données personnelles",
        tracking=True,
    )
    consent_date = fields.Date(
        string="Date du consentement",
        tracking=True,
    )
    consent_note = fields.Text(string="Détail / référence consentement")

    # HelloAsso — traçabilité (défini ici pour éviter res.partner sans champs si le connecteur API seul n’est pas installé)
    helloasso_external_id = fields.Char(
        string="HelloAsso — identifiant source",
        index=True,
        copy=False,
        help="Identifiant stable côté HelloAsso pour idempotence et traçabilité.",
    )
    helloasso_last_sync_at = fields.Datetime(
        string="HelloAsso — dernière synchro",
        copy=False,
        readonly=True,
    )
    helloasso_source_form = fields.Char(
        string="HelloAsso — formulaire / contexte",
        copy=False,
        help="Ex. formSlug, campagne ou libellé utile au routage.",
    )
    helloasso_sync_status = fields.Selection(
        selection=[
            ("never", "Jamais synchronisé"),
            ("ok", "OK"),
            ("error", "Erreur"),
            ("pending", "En attente"),
        ],
        string="HelloAsso — statut de synchro",
        default="never",
        copy=False,
    )

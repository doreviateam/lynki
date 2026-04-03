# -*- coding: utf-8 -*-

from odoo import fields, models


class ResPartner(models.Model):
    _inherit = "res.partner"

    helloasso_external_id = fields.Char(
        string="HelloAsso — identifiant source",
        index=True,
        copy=False,
        help="Identifiant stable côté HelloAsso pour idempotence et traçabilité (à préciser selon ADR §4).",
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

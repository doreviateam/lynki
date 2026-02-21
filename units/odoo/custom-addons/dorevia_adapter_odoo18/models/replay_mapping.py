# -*- coding: utf-8 -*-

from odoo import models, fields


class ReplayMapping(models.Model):
    """Idempotence par event_id — invoice, payment, balances (pas partners)."""
    _name = 'dorevia.replay.mapping'
    _description = 'Mapping Vault event_id → res Odoo (idempotence replay)'
    _order = 'applied_at desc'

    event_id = fields.Char(
        string='Event ID (Vault)',
        required=True,
        index=True,
        help='UUID événement Vault — clé d\'idempotence',
    )
    tenant = fields.Char(
        string='Tenant',
        required=True,
        index=True,
    )
    model = fields.Char(
        string='Modèle Odoo',
        required=True,
    )
    res_id = fields.Integer(
        string='ID res',
        required=True,
    )
    applied_at = fields.Datetime(
        string='Appliqué le',
        default=fields.Datetime.now,
    )
    status = fields.Selection(
        [
            ('applied', 'Appliqué'),
            ('skipped', 'Ignoré (déjà appliqué)'),
            ('failed', 'Échec'),
        ],
        string='Statut',
        required=True,
    )
    details_json = fields.Text(
        string='Détails (JSON)',
        help='Warnings, ids, allocations',
    )

    _sql_constraints = [
        ('event_id_unique', 'UNIQUE(event_id)', 'Un mapping existe déjà pour cet event_id'),
    ]

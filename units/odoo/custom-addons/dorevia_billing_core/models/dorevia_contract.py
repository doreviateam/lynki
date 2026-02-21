# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import ValidationError
from datetime import datetime


class DoreviaContract(models.Model):
    _name = 'dorevia.contract'
    _description = 'Contrat de facturation MRR'
    _order = 'start_date desc, name'

    name = fields.Char(string='Nom du contrat', required=True, help='Nom du contrat de facturation')
    tenant_id = fields.Many2one('res.partner', string='Tenant', required=True, ondelete='cascade',
                                help='Partenaire tenant')
    start_date = fields.Date(string='Date de début', required=True, index=True,
                             help='Date de début du contrat')
    end_date = fields.Date(string='Date de fin', index=True,
                           help='Date de fin du contrat (optionnel)')
    active = fields.Boolean(string='Actif', default=True, index=True,
                            help='Contrat actif')

    # Règles tarifaires
    pricing_rule_ids = fields.One2many('dorevia.pricing.rule', 'contract_id', string='Règles tarifaires',
                                       help='Règles tarifaires du contrat')

    # TVA
    tax_rate = fields.Float(string='Taux TVA (%)', default=20.0,
                            help='Taux de TVA en pourcentage (défaut: 20%)')
    tax_exempt = fields.Boolean(string='Exonéré de TVA', default=False,
                                help='Le contrat est exonéré de TVA')

    @api.constrains('start_date', 'end_date')
    def _check_dates(self):
        for record in self:
            if record.end_date and record.end_date < record.start_date:
                raise ValidationError('La date de fin ne peut pas être antérieure à la date de début')

    @api.model
    def _get_active_contract(self, tenant_id, period):
        """
        Retourne le contrat actif pour un tenant et une période donnés
        
        :param tenant_id: ID du tenant (res.partner)
        :param period: Période au format YYYY-MM
        :return: dorevia.contract record ou None
        """
        # Parse période pour obtenir start et end
        year, month = map(int, period.split('-'))
        from calendar import monthrange
        period_start = datetime(year, month, 1).date()
        period_end = datetime(year, month, monthrange(year, month)[1]).date()

        # Recherche contrat actif
        contracts = self.search([
            ('tenant_id', '=', tenant_id),
            ('active', '=', True),
            ('start_date', '<=', period_end),
            '|',
            ('end_date', '=', False),
            ('end_date', '>=', period_start),
        ], order='start_date desc', limit=1)

        return contracts[0] if contracts else None


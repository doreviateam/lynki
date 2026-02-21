# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import ValidationError


class DoreviaPricingRule(models.Model):
    _name = 'dorevia.pricing.rule'
    _description = 'Règle tarifaire (prix unitaires, paliers, remises)'
    _order = 'contract_id, move_type, sequence'

    contract_id = fields.Many2one('dorevia.contract', string='Contrat', required=True, ondelete='cascade',
                                  help='Contrat parent')
    move_type = fields.Selection([
        ('out_invoice', 'Facture client'),
        ('in_invoice', 'Facture fournisseur'),
        ('out_refund', 'Avoir client'),
        ('in_refund', 'Avoir fournisseur'),
    ], string='Type de document', required=True,
        help='Type de document comptable')
    price_unit = fields.Monetary(string='Prix unitaire (HT)', required=True,
                                  help='Prix unitaire hors taxes')
    currency_id = fields.Many2one('res.currency', string='Devise', required=True,
                                  default=lambda self: self.env.company.currency_id,
                                  help='Devise du prix unitaire')

    # Paliers
    tier_from = fields.Integer(string='Paliers : De', default=0, required=True,
                                help='Volume minimum (inclus)')
    tier_to = fields.Integer(string='Paliers : À',
                              help='Volume maximum (exclus, vide = infini)')

    # Montant fixe (base)
    fixed_amount = fields.Monetary(string='Montant fixe (HT)', default=80.0,
                                    help='Montant fixe qui s\'ajoute toujours au total, en plus du calcul par paliers (par défaut: 80 €)')
    
    # Remise
    discount_percent = fields.Float(string='Remise (%)', default=0.0,
                                     help='Remise en pourcentage (0-100)')

    # Ordre d'application
    sequence = fields.Integer(string='Séquence', default=10, required=True,
                              help='Ordre d\'application des règles (plus petit = prioritaire)')
    active = fields.Boolean(string='Actif', default=True,
                            help='Règle active')

    @api.constrains('tier_from', 'tier_to')
    def _check_tiers(self):
        for record in self:
            if record.tier_from < 0:
                raise ValidationError('Le palier minimum ne peut pas être négatif')
            if record.tier_to is not None and record.tier_to <= record.tier_from:
                raise ValidationError('Le palier maximum doit être supérieur au palier minimum')

    @api.constrains('discount_percent')
    def _check_discount(self):
        for record in self:
            if record.discount_percent < 0 or record.discount_percent > 100:
                raise ValidationError('La remise doit être entre 0 et 100%')

    def _compute_amount(self, volume):
        """
        Calcule le montant pour un volume donné selon cette règle
        
        :param volume: Volume à facturer
        :return: Montant HT (float)
        """
        # Vérifier si le volume est dans le palier
        if volume < self.tier_from:
            return 0.0
        if self.tier_to is not None and volume >= self.tier_to:
            return 0.0

        # Volume dans le palier
        volume_in_tier = min(volume, self.tier_to or volume) - self.tier_from

        # Calcul montant avec remise
        amount = volume_in_tier * self.price_unit * (1 - self.discount_percent / 100.0)

        return amount

    def _get_volume_in_tier(self, total_volume):
        """
        Retourne le volume qui entre dans ce palier
        
        :param total_volume: Volume total à facturer
        :return: Volume dans ce palier (int)
        """
        if total_volume < self.tier_from:
            return 0
        if self.tier_to is not None and total_volume >= self.tier_to:
            return self.tier_to - self.tier_from
        return total_volume - self.tier_from


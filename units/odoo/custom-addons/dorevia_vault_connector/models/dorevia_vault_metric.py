# -*- coding: utf-8 -*-

from odoo import models, fields, api
from datetime import datetime, timezone
import logging

_logger = logging.getLogger(__name__)


class DoreviaVaultMetric(models.Model):
    """
    Modèle pour stocker les métriques de vaulting
    SPEC v1.1 - US-3.1 : Observabilité
    """
    _name = 'dorevia.vault.metric'
    _description = 'Métriques de vaulting Dorevia'
    _order = 'date desc'
    _rec_name = 'date'
    _sql_constraints = [
        ('date_unique', 'unique(date)', 'Une métrique existe déjà pour cette date')
    ]

    date = fields.Date(
        string='Date',
        required=True,
        default=fields.Date.today,
        help='Date de la métrique'
    )
    
    total_sent = fields.Integer(
        string='Total envoyé',
        default=0,
        help='Nombre total de factures envoyées vers DVIG'
    )
    
    success = fields.Integer(
        string='Succès',
        default=0,
        help='Nombre de factures vaultées avec succès'
    )

    success_sales = fields.Integer(
        string='Factures de vente vaultées',
        default=0,
        help='Nombre de factures de vente (out_invoice) vaultées avec succès'
    )

    failed_soft = fields.Integer(
        string='Échecs temporaires',
        default=0,
        help='Nombre d\'échecs temporaires (retry avec backoff)'
    )
    
    failed_hard = fields.Integer(
        string='Échecs définitifs',
        default=0,
        help='Nombre d\'échecs définitifs (pas de retry)'
    )
    
    backlog = fields.Integer(
        string='Backlog',
        default=0,
        help='Nombre de factures en attente de traitement (todo + pending_proof + failed_soft)'
    )

    @api.model
    def compute_metrics(self, date=None):
        """
        Calcule les métriques pour une date donnée (ou aujourd'hui)
        SPEC v1.1 - US-3.1 : Calcul des métriques
        
        Args:
            date: Date pour laquelle calculer les métriques (par défaut: aujourd'hui)
            
        Returns:
            recordset: Enregistrement de métrique créé/mis à jour
        """
        if not date:
            date = fields.Date.today()
        
        # Rechercher si une métrique existe déjà pour cette date
        metric = self.search([('date', '=', date)], limit=1)
        
        # Calculer les métriques depuis account.move
        AccountMove = self.env['account.move']
        
        # Total envoyé : factures avec dorevia_dvig_event_id (envoyées vers DVIG)
        total_sent = AccountMove.search_count([
            ('dorevia_dvig_event_id', '!=', False),
            ('state', '=', 'posted'),
            ('move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']),
        ])
        
        # Succès : factures vaulted (tous types)
        success = AccountMove.search_count([
            ('dorevia_vault_status', '=', 'vaulted'),
            ('state', '=', 'posted'),
            ('move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']),
        ])

        # Factures de vente vaultées (out_invoice uniquement)
        success_sales = AccountMove.search_count([
            ('dorevia_vault_status', '=', 'vaulted'),
            ('state', '=', 'posted'),
            ('move_type', '=', 'out_invoice'),
        ])
        
        # Failed soft : factures failed_soft
        failed_soft = AccountMove.search_count([
            ('dorevia_vault_status', '=', 'failed_soft'),
            ('state', '=', 'posted'),
            ('move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']),
        ])
        
        # Failed hard : factures failed_hard
        failed_hard = AccountMove.search_count([
            ('dorevia_vault_status', '=', 'failed_hard'),
            ('state', '=', 'posted'),
            ('move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']),
        ])
        
        # Backlog : factures en attente (todo + pending_proof + failed_soft)
        backlog = AccountMove.search_count([
            ('dorevia_vault_status', 'in', ['todo', 'pending_proof', 'failed_soft']),
            ('state', '=', 'posted'),
            ('move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']),
        ])
        
        # Créer ou mettre à jour la métrique
        values = {
            'date': date,
            'total_sent': total_sent,
            'success': success,
            'success_sales': success_sales,
            'failed_soft': failed_soft,
            'failed_hard': failed_hard,
            'backlog': backlog,
        }
        
        if metric:
            metric.write(values)
            _logger.info(f"Métrique mise à jour pour {date}: {values}")
        else:
            metric = self.create(values)
            _logger.info(f"Métrique créée pour {date}: {values}")
        
        return metric

    @api.model
    def cron_compute_metrics(self):
        """
        CRON pour calculer les métriques quotidiennes
        S'exécute une fois par jour (recommandation: toutes les heures ou quotidien)
        """
        today = fields.Date.today()
        self.compute_metrics(today)
        _logger.info(f"CRON métriques exécuté pour {today}")

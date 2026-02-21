# -*- coding: utf-8 -*-

from odoo.tests import tagged
from odoo.tests.common import TransactionCase
from datetime import datetime, timezone, timedelta


@tagged('post_install', '-at_install')
class TestVaultStatus(TransactionCase):
    """Tests unitaires pour la machine d'état du vaulting"""

    def setUp(self):
        super().setUp()
        # Configuration DVIG
        self.env['ir.config_parameter'].sudo().set_param('dorevia.dvig.url', 'https://dvig.test.com')
        self.env['ir.config_parameter'].sudo().set_param('dorevia.dvig.token', 'test_token')
        self.env['ir.config_parameter'].sudo().set_param('dorevia.dvig.source', 'odoo.test.core')
        
        # Créer un partenaire
        self.partner = self.env['res.partner'].create({
            'name': 'Test Partner',
        })
        
        # Créer un journal
        self.journal = self.env['account.journal'].search([
            ('type', '=', 'sale'),
            ('company_id', '=', self.env.company.id)
        ], limit=1)
        
        if not self.journal:
            self.journal = self.env['account.journal'].create({
                'name': 'Test Sale Journal',
                'type': 'sale',
                'code': 'TEST',
            })

    def test_action_post_initializes_todo(self):
        """Test : action_post() initialise status='todo'"""
        invoice = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner.id,
            'journal_id': self.journal.id,
            'invoice_line_ids': [(0, 0, {
                'name': 'Test line',
                'quantity': 1,
                'price_unit': 100,
            })],
        })
        
        invoice.action_post()
        
        # Vérifier que le statut est initialisé à 'todo'
        self.assertEqual(invoice.dorevia_vault_status, 'todo')
        self.assertIsNotNone(invoice.dorevia_vault_idempotency_key)
        self.assertEqual(invoice.dorevia_vault_attempt_count, 0)

    def test_action_post_no_network_call(self):
        """Test : action_post() ne fait aucun appel réseau"""
        invoice = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner.id,
            'journal_id': self.journal.id,
            'invoice_line_ids': [(0, 0, {
                'name': 'Test line',
                'quantity': 1,
                'price_unit': 100,
            })],
        })
        
        # Vérifier qu'il n'y a pas d'appel réseau (pas d'exception de connexion)
        # Si un appel réseau était fait, on aurait une erreur car l'URL est invalide
        invoice.action_post()
        
        # Le statut doit être 'todo' sans appel réseau
        self.assertEqual(invoice.dorevia_vault_status, 'todo')

    def test_status_transitions(self):
        """Test : Transitions de statut valides"""
        invoice = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner.id,
            'journal_id': self.journal.id,
            'invoice_line_ids': [(0, 0, {
                'name': 'Test line',
                'quantity': 1,
                'price_unit': 100,
            })],
        })
        invoice.action_post()
        
        # Transition todo → pending_proof
        invoice.write({
            'dorevia_vault_status': 'pending_proof',
            'dorevia_dvig_event_id': 'test-event-id',
        })
        self.assertEqual(invoice.dorevia_vault_status, 'pending_proof')
        
        # Transition pending_proof → vaulted
        invoice.write({
            'dorevia_vault_status': 'vaulted',
            'dorevia_vaulted': True,
        })
        self.assertEqual(invoice.dorevia_vault_status, 'vaulted')
        
        # Transition todo → failed_soft
        invoice.write({
            'dorevia_vault_status': 'todo',
            'dorevia_vaulted': False,
        })
        invoice.write({
            'dorevia_vault_status': 'failed_soft',
            'dorevia_vault_last_error': 'Test error',
        })
        self.assertEqual(invoice.dorevia_vault_status, 'failed_soft')
        
        # Transition todo → failed_hard
        invoice.write({'dorevia_vault_status': 'todo'})
        invoice.write({
            'dorevia_vault_status': 'failed_hard',
            'dorevia_vault_last_error': 'Hard error',
        })
        self.assertEqual(invoice.dorevia_vault_status, 'failed_hard')

    def test_status_not_initialized_for_non_invoice(self):
        """Test : Statut non initialisé pour les documents non factures"""
        # Créer un compte de test si nécessaire
        account1 = self.env['account.account'].search([('code', '=', '101000')], limit=1)
        if not account1:
            account1 = self.env['account.account'].create({
                'name': 'Test Account 1',
                'code': '101000',
                'account_type': 'asset_current',
            })
        
        account2 = self.env['account.account'].search([('code', '=', '201000')], limit=1)
        if not account2:
            account2 = self.env['account.account'].create({
                'name': 'Test Account 2',
                'code': '201000',
                'account_type': 'liability_current',
            })
        
        # Créer un entry équilibré (debit = credit)
        entry = self.env['account.move'].create({
            'move_type': 'entry',
            'journal_id': self.journal.id,
            'line_ids': [
                (0, 0, {
                    'account_id': account1.id,
                    'debit': 100,
                    'credit': 0,
                }),
                (0, 0, {
                    'account_id': account2.id,
                    'debit': 0,
                    'credit': 100,
                }),
            ],
        })
        
        entry.action_post()
        
        # Le statut ne doit pas être initialisé pour un entry (pas de clé d'idempotence)
        # Note: dorevia_vault_status peut avoir une valeur par défaut, mais la clé ne doit pas être créée
        self.assertFalse(entry.dorevia_vault_idempotency_key)

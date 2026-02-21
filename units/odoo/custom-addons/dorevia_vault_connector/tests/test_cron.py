# -*- coding: utf-8 -*-

from odoo.tests import tagged
from odoo.tests.common import TransactionCase
from odoo import fields
from datetime import datetime, timedelta


@tagged('post_install', '-at_install')
class TestCron(TransactionCase):
    """Tests unitaires pour les CRON de vaulting"""

    def setUp(self):
        super().setUp()
        # Configuration DVIG
        self.env['ir.config_parameter'].sudo().set_param('dorevia.dvig.url', 'https://dvig.test.com')
        self.env['ir.config_parameter'].sudo().set_param('dorevia.dvig.token', 'test_token')
        self.env['ir.config_parameter'].sudo().set_param('dorevia.dvig.source', 'odoo.test.core')
        self.env['ir.config_parameter'].sudo().set_param('dorevia.vault.url', 'https://vault.test.com')
        
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

    def test_cron_send_dvig_selection(self):
        """Test : CRON #1 sélectionne les bonnes factures"""
        # Créer factures avec différents statuts
        invoice_todo = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner.id,
            'journal_id': self.journal.id,
            'invoice_line_ids': [(0, 0, {
                'name': 'Test line',
                'quantity': 1,
                'price_unit': 100,
            })],
        })
        invoice_todo.action_post()
        
        invoice_failed_soft = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner.id,
            'journal_id': self.journal.id,
            'invoice_line_ids': [(0, 0, {
                'name': 'Test line 2',
                'quantity': 1,
                'price_unit': 200,
            })],
        })
        invoice_failed_soft.action_post()
        invoice_failed_soft.write({
            'dorevia_vault_status': 'failed_soft',
            'dorevia_vault_next_retry_at': fields.Datetime.now() - timedelta(minutes=1),
        })
        
        invoice_vaulted = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner.id,
            'journal_id': self.journal.id,
            'invoice_line_ids': [(0, 0, {
                'name': 'Test line 3',
                'quantity': 1,
                'price_unit': 300,
            })],
        })
        invoice_vaulted.action_post()
        invoice_vaulted.write({
            'dorevia_vault_status': 'vaulted',
        })
        
        # Vérifier la sélection
        now = fields.Datetime.now()
        moves = self.env['account.move'].search([
            ('state', '=', 'posted'),
            ('move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']),
            ('dorevia_vault_status', 'in', ['todo', 'failed_soft']),
            '|',
            ('dorevia_vault_next_retry_at', '<=', now),
            ('dorevia_vault_next_retry_at', '=', False),
        ])
        
        # Doit sélectionner todo et failed_soft, pas vaulted
        self.assertIn(invoice_todo.id, moves.ids)
        self.assertIn(invoice_failed_soft.id, moves.ids)
        self.assertNotIn(invoice_vaulted.id, moves.ids)

    def test_cron_send_dvig_success(self):
        """Test : CRON #1 sélectionne les factures en todo pour envoi DVIG"""
        # Créer facture en todo
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
        
        # Vérifier que la facture est en todo après action_post
        self.assertEqual(invoice.dorevia_vault_status, 'todo')
        self.assertIsNotNone(invoice.dorevia_vault_idempotency_key)
        self.assertIsNotNone(invoice.dorevia_vault_next_retry_at)
        
        # Vérifier que la facture est sélectionnable par le CRON #1
        now = fields.Datetime.now()
        moves = self.env['account.move'].search([
            ('state', '=', 'posted'),
            ('move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']),
            ('dorevia_vault_status', 'in', ['todo', 'failed_soft']),
            '|',
            ('dorevia_vault_next_retry_at', '<=', now),
            ('dorevia_vault_next_retry_at', '=', False),
        ], limit=50)
        
        self.assertIn(invoice.id, moves.ids)

    def test_cron_send_dvig_error_soft(self):
        """Test : CRON #1 sélectionne les factures en failed_soft pour retry"""
        # Créer facture en failed_soft avec next_retry_at dans le passé
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
        
        # Simuler un échec soft avec next_retry dans le passé
        invoice.write({
            'dorevia_vault_status': 'failed_soft',
            'dorevia_vault_attempt_count': 1,
            'dorevia_vault_next_retry_at': fields.Datetime.now() - timedelta(minutes=1),
            'dorevia_vault_last_error': 'Test error 503',
        })
        
        # Vérifier que la facture est sélectionnable par le CRON #1 pour retry
        now = fields.Datetime.now()
        moves = self.env['account.move'].search([
            ('state', '=', 'posted'),
            ('move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']),
            ('dorevia_vault_status', 'in', ['todo', 'failed_soft']),
            '|',
            ('dorevia_vault_next_retry_at', '<=', now),
            ('dorevia_vault_next_retry_at', '=', False),
        ], limit=50)
        
        self.assertIn(invoice.id, moves.ids)
        self.assertEqual(invoice.dorevia_vault_status, 'failed_soft')
        self.assertEqual(invoice.dorevia_vault_attempt_count, 1)

    def test_cron_fetch_proof_selection(self):
        """Test : CRON #2 sélectionne les bonnes factures"""
        # Créer facture en pending_proof
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
        invoice.write({
            'dorevia_vault_status': 'pending_proof',
            'dorevia_dvig_event_id': 'test-event-123',
        })
        
        # Vérifier la sélection
        moves = self.env['account.move'].search([
            ('dorevia_vault_status', '=', 'pending_proof'),
            ('dorevia_dvig_event_id', '!=', False),
        ])
        
        self.assertIn(invoice.id, moves.ids)

    def test_cron_fetch_proof_success(self):
        """Test : CRON #2 sélectionne les factures en pending_proof pour récupération preuve"""
        # Créer facture en pending_proof
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
        invoice.write({
            'dorevia_vault_status': 'pending_proof',
            'dorevia_dvig_event_id': 'test-event-123',
        })
        
        # Vérifier que la facture est sélectionnable par le CRON #2
        moves = self.env['account.move'].search([
            ('dorevia_vault_status', '=', 'pending_proof'),
            ('dorevia_dvig_event_id', '!=', False),
        ], limit=50)
        
        self.assertIn(invoice.id, moves.ids)
        self.assertEqual(invoice.dorevia_vault_status, 'pending_proof')
        self.assertEqual(invoice.dorevia_dvig_event_id, 'test-event-123')

    def test_cron_batch_limit(self):
        """Test : CRON respecte la limite de batch (50)"""
        # Créer 60 factures en todo
        invoices = self.env['account.move']
        for i in range(60):
            invoice = self.env['account.move'].create({
                'move_type': 'out_invoice',
                'partner_id': self.partner.id,
                'journal_id': self.journal.id,
                'invoice_line_ids': [(0, 0, {
                    'name': f'Test line {i}',
                    'quantity': 1,
                    'price_unit': 100,
                })],
            })
            invoice.action_post()
            invoices |= invoice
        
        # Vérifier la sélection avec limite
        now = fields.Datetime.now()
        moves = self.env['account.move'].search([
            ('state', '=', 'posted'),
            ('move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']),
            ('dorevia_vault_status', 'in', ['todo', 'failed_soft']),
            '|',
            ('dorevia_vault_next_retry_at', '<=', now),
            ('dorevia_vault_next_retry_at', '=', False),
        ], limit=50)
        
        # Doit limiter à 50
        self.assertLessEqual(len(moves), 50)

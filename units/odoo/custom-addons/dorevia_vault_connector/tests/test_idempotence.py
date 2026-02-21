# -*- coding: utf-8 -*-

from odoo.tests import tagged
from odoo.tests.common import TransactionCase
import hashlib


@tagged('post_install', '-at_install')
class TestIdempotence(TransactionCase):
    """Tests unitaires pour l'idempotence (clé SHA256)"""

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

    def test_compute_idempotency_key(self):
        """Test : Calcul de la clé d'idempotence"""
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
        
        # Vérifier que la clé est calculée
        self.assertIsNotNone(invoice.dorevia_vault_idempotency_key)
        self.assertEqual(len(invoice.dorevia_vault_idempotency_key), 64)  # SHA256 hex = 64 chars

    def test_idempotency_key_same_invoice(self):
        """Test : Même facture = même clé"""
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
        
        key1 = invoice.dorevia_vault_idempotency_key
        
        # Recalculer la clé
        key2 = invoice._compute_idempotency_key(invoice)
        
        # Les clés doivent être identiques
        self.assertEqual(key1, key2)

    def test_idempotency_key_different_invoices(self):
        """Test : Factures différentes = clés différentes"""
        invoice1 = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner.id,
            'journal_id': self.journal.id,
            'invoice_line_ids': [(0, 0, {
                'name': 'Test line 1',
                'quantity': 1,
                'price_unit': 100,
            })],
        })
        invoice1.action_post()
        
        invoice2 = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner.id,
            'journal_id': self.journal.id,
            'invoice_line_ids': [(0, 0, {
                'name': 'Test line 2',
                'quantity': 1,
                'price_unit': 200,
            })],
        })
        invoice2.action_post()
        
        # Les clés doivent être différentes
        self.assertNotEqual(invoice1.dorevia_vault_idempotency_key, invoice2.dorevia_vault_idempotency_key)

    def test_idempotency_key_format(self):
        """Test : Format de la clé SHA256"""
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
        
        key = invoice.dorevia_vault_idempotency_key
        
        # Vérifier le format (hexadécimal)
        self.assertTrue(all(c in '0123456789abcdef' for c in key))
        self.assertEqual(len(key), 64)

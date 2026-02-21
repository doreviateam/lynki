# -*- coding: utf-8 -*-

from odoo.tests import tagged
from odoo.tests.common import TransactionCase
from odoo.exceptions import UserError


@tagged('post_install', '-at_install')
class TestAccountMoveLineLock(TransactionCase):
    """Tests unitaires pour le verrouillage des lignes de factures posted"""

    def setUp(self):
        super().setUp()
        # Activer le verrouillage par défaut
        self.env['ir.config_parameter'].sudo().set_param('dorevia_posted_lock.enabled', 'True')
        
        # Créer un partenaire de test
        self.partner = self.env['res.partner'].create({
            'name': 'Test Partner',
        })
        
        # Créer un journal de vente
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

    def test_posted_line_write_blocked(self):
        """Test : Posted → modifier ligne (quantity/price) → refus"""
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
        
        line = invoice.invoice_line_ids[0]
        
        # Tenter de modifier la quantité (devrait être bloqué)
        with self.assertRaises(UserError):
            line.write({'quantity': 2})
        
        # Tenter de modifier le prix unitaire (devrait être bloqué)
        with self.assertRaises(UserError):
            line.write({'price_unit': 200})

    def test_posted_line_unlink_blocked(self):
        """Test : Posted → unlink line → refus"""
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
        
        line = invoice.invoice_line_ids[0]
        
        # Tenter de supprimer (devrait être bloqué)
        with self.assertRaises(UserError):
            line.unlink()

    def test_draft_line_write_allowed(self):
        """Test : Draft → modifier ligne → OK"""
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
        
        line = invoice.invoice_line_ids[0]
        
        # Modifier la quantité (devrait être autorisé en draft)
        line.write({'quantity': 2})
        self.assertEqual(line.quantity, 2)

    def test_bypass_migration_line(self):
        """Test : Posted → write ligne avec skip_posted_lock context → OK"""
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
        
        line = invoice.invoice_line_ids[0]
        
        # Modifier avec bypass (devrait être autorisé)
        line.with_context(skip_posted_lock=True).write({'quantity': 2})
        self.assertEqual(line.quantity, 2)

    def test_reconciliation_fields_allowed(self):
        """Test : Posted → modifier champs réconciliation → OK"""
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
        
        line = invoice.line_ids.filtered(lambda l: l.debit > 0)[0]
        
        # Modifier un champ de réconciliation (devrait être autorisé)
        # Note: Ces champs sont dans RECONCILIATION_FIELDS (whitelist)
        # En pratique, Odoo modifie ces champs lors de la réconciliation
        # Ici on teste que la whitelist fonctionne
        line.with_context(skip_posted_lock=False).write({
            'amount_residual': 50.0,
        })
        self.assertEqual(line.amount_residual, 50.0)


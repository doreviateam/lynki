# -*- coding: utf-8 -*-

from odoo.tests import tagged
from odoo.tests.common import TransactionCase
from odoo.exceptions import UserError


@tagged('post_install', '-at_install')
class TestAccountMoveLock(TransactionCase):
    """Tests unitaires pour le verrouillage des factures posted"""

    def setUp(self):
        super().setUp()
        # Activer le verrouillage par défaut
        self.env['ir.config_parameter'].sudo().set_param('dorevia_posted_lock.enabled', 'True')
        self.env['ir.config_parameter'].sudo().set_param('dorevia_posted_lock.allow_chatter', 'True')
        self.env['ir.config_parameter'].sudo().set_param('dorevia_posted_lock.allow_draft', 'False')
        
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

    def test_draft_write_allowed(self):
        """Test : Draft → write autorisé"""
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
        
        # Modifier le partenaire (devrait être autorisé en draft)
        invoice.write({'partner_id': self.partner.id})
        self.assertEqual(invoice.state, 'draft')

    def test_posted_write_protected_field_blocked(self):
        """Test : Posted → modifier partner_id → refus"""
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
        
        # Tenter de modifier le partenaire (devrait être bloqué)
        new_partner = self.env['res.partner'].create({'name': 'New Partner'})
        with self.assertRaises(UserError):
            invoice.write({'partner_id': new_partner.id})

    def test_posted_write_invoice_line_ids_blocked(self):
        """Test : Posted → modifier invoice_line_ids → refus"""
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
        
        # Tenter de modifier les lignes (devrait être bloqué)
        with self.assertRaises(UserError):
            invoice.write({
                'invoice_line_ids': [(1, invoice.invoice_line_ids[0].id, {
                    'quantity': 2,
                })]
            })

    def test_posted_chatter_allowed(self):
        """Test : Posted → chatter (si allow_chatter=True) → OK"""
        self.env['ir.config_parameter'].sudo().set_param('dorevia_posted_lock.allow_chatter', 'True')
        
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
        
        # Ajouter un message (devrait être autorisé)
        invoice.message_post(body='Test message')
        self.assertEqual(len(invoice.message_ids), 1)

    def test_posted_unlink_blocked(self):
        """Test : Posted → unlink move → refus"""
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
        
        # Tenter de supprimer (devrait être bloqué)
        with self.assertRaises(UserError):
            invoice.unlink()

    def test_posted_button_draft_blocked(self):
        """Test : Posted → button_draft() → refus"""
        self.env['ir.config_parameter'].sudo().set_param('dorevia_posted_lock.allow_draft', 'False')
        
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
        
        # Tenter de remettre en brouillon (devrait être bloqué)
        with self.assertRaises(UserError):
            invoice.button_draft()

    def test_bypass_migration(self):
        """Test : Posted → write avec skip_posted_lock context → OK"""
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
        
        # Modifier avec bypass (devrait être autorisé)
        new_partner = self.env['res.partner'].create({'name': 'New Partner'})
        invoice.with_context(skip_posted_lock=True).write({'partner_id': new_partner.id})
        self.assertEqual(invoice.partner_id, new_partner)

    def test_entry_not_locked(self):
        """Test : Entry (si apply_to_entries=False) → write autorisé"""
        self.env['ir.config_parameter'].sudo().set_param('dorevia_posted_lock.apply_to_entries', 'False')
        
        entry = self.env['account.move'].create({
            'move_type': 'entry',
            'journal_id': self.journal.id,
            'line_ids': [(0, 0, {
                'account_id': self.env['account.account'].search([
                    ('company_id', '=', self.env.company.id)
                ], limit=1).id,
                'debit': 100,
            }), (0, 0, {
                'account_id': self.env['account.account'].search([
                    ('company_id', '=', self.env.company.id)
                ], limit=1).id,
                'credit': 100,
            })],
        })
        entry.action_post()
        
        # Modifier (devrait être autorisé car entry)
        entry.write({'ref': 'Test ref'})
        self.assertEqual(entry.ref, 'Test ref')

    def test_command_update_blocked(self):
        """Test : Posted → Command.UPDATE sur invoice_line_ids → refus"""
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
        
        # Tenter de modifier via Command.UPDATE (devrait être bloqué)
        with self.assertRaises(UserError):
            invoice.write({
                'invoice_line_ids': [(1, invoice.invoice_line_ids[0].id, {
                    'quantity': 2,
                })]
            })

    def test_command_delete_blocked(self):
        """Test : Posted → Command.DELETE sur invoice_line_ids → refus"""
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
        
        # Tenter de supprimer via Command.DELETE (devrait être bloqué)
        with self.assertRaises(UserError):
            invoice.write({
                'invoice_line_ids': [(2, invoice.invoice_line_ids[0].id)]
            })

    def test_vaulted_chatter_blocked(self):
        """Test : Posted + vaulted → chatter interdit (verrouillage renforcé)"""
        self.env['ir.config_parameter'].sudo().set_param('dorevia_posted_lock.allow_chatter', 'True')
        
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
        invoice.dorevia_vaulted = True
        
        # Tenter d'ajouter un message (devrait être bloqué si vaulted)
        # Note: message_post() modifie message_ids, qui est dans CHATTER_FIELDS
        # Mais si vaulted, même chatter interdit
        with self.assertRaises(UserError):
            invoice.write({'message_ids': [(0, 0, {'body': 'Test'})]})


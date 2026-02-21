# -*- coding: utf-8 -*-
"""
E6-US4bis : Tests allocations FIFO paiement → factures
"""

from odoo.tests import tagged
from odoo.tests.common import TransactionCase

from odoo.addons.dorevia_adapter_odoo18.controllers.replay_controller import _allocate_fifo


@tagged('post_install', '-at_install')
class TestReplayFIFO(TransactionCase):
    """Tests allocations FIFO : paiement partiel, multi-factures"""

    def setUp(self):
        super().setUp()
        self.partner = self.env['res.partner'].create({
            'name': 'Test FIFO Partner',
            'ref': 'P-FIFO',
        })
        self.bank_journal = self.env['account.journal'].search([
            ('type', '=', 'bank'),
            ('company_id', '=', self.env.company.id),
        ], limit=1)
        if not self.bank_journal:
            self.bank_journal = self.env['account.journal'].create({
                'name': 'Test Bank',
                'type': 'bank',
                'code': 'TBK',
            })
        self.sale_journal = self.env['account.journal'].search([
            ('type', '=', 'sale'),
            ('company_id', '=', self.env.company.id),
        ], limit=1)

    def test_fifo_multi_invoices_partial(self):
        """Paiement 100 sur 2 factures (60 + 50) → allocation FIFO : 60 + 40"""
        # Facture 1 : 60 (plus ancienne)
        inv1 = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner.id,
            'journal_id': self.sale_journal.id,
            'invoice_date': '2026-01-10',
            'invoice_line_ids': [(0, 0, {
                'name': 'Line 1',
                'quantity': 1,
                'price_unit': 60,
            })],
        })
        inv1.action_post()
        # Facture 2 : 50 (plus récente)
        inv2 = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner.id,
            'journal_id': self.sale_journal.id,
            'invoice_date': '2026-01-15',
            'invoice_line_ids': [(0, 0, {
                'name': 'Line 2',
                'quantity': 1,
                'price_unit': 50,
            })],
        })
        inv2.action_post()
        # Paiement 100 (couvre inv1 entièrement + 40 sur inv2)
        payment = self.env['account.payment'].create({
            'payment_type': 'inbound',
            'partner_type': 'customer',
            'partner_id': self.partner.id,
            'amount': 100,
            'journal_id': self.bank_journal.id,
        })
        payment.action_post()
        allocations = _allocate_fifo(self.env, payment)
        self.assertEqual(len(allocations), 2, "2 allocations attendues (FIFO)")
        self.assertEqual(allocations[0]['invoice_id'], inv1.id)
        self.assertEqual(allocations[0]['amount_applied'], 60)
        self.assertEqual(allocations[1]['invoice_id'], inv2.id)
        self.assertEqual(allocations[1]['amount_applied'], 40)

    def test_fifo_single_invoice_full(self):
        """Paiement 50 sur facture 50 → 1 allocation complète"""
        inv = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner.id,
            'journal_id': self.sale_journal.id,
            'invoice_line_ids': [(0, 0, {
                'name': 'Line',
                'quantity': 1,
                'price_unit': 50,
            })],
        })
        inv.action_post()
        payment = self.env['account.payment'].create({
            'payment_type': 'inbound',
            'partner_type': 'customer',
            'partner_id': self.partner.id,
            'amount': 50,
            'journal_id': self.bank_journal.id,
        })
        payment.action_post()
        allocations = _allocate_fifo(self.env, payment)
        self.assertEqual(len(allocations), 1)
        self.assertEqual(allocations[0]['invoice_id'], inv.id)
        self.assertEqual(allocations[0]['amount_applied'], 50)

    def test_fifo_no_invoices(self):
        """Paiement sans factures ouvertes → allocations vides"""
        payment = self.env['account.payment'].create({
            'payment_type': 'inbound',
            'partner_type': 'customer',
            'partner_id': self.partner.id,
            'amount': 100,
            'journal_id': self.bank_journal.id,
        })
        payment.action_post()
        allocations = _allocate_fifo(self.env, payment)
        self.assertEqual(allocations, [])

# -*- coding: utf-8 -*-
"""
Tests pour les gardes de validation des preuves Vault (revue code 2026-02).

Vérifie :
- source_model / source_id : rejet si mismatch (anti-routage multi-tenant)
- Acceptation si source_model/source_id absents (rétrocompat)
- cron_vault_fetch_proof respecte next_retry_at (backoff)
"""

from odoo.tests import tagged
from odoo.tests.common import TransactionCase
from odoo import fields
from datetime import timedelta
from unittest.mock import patch, MagicMock


@tagged('post_install', '-at_install', 'dorevia_vault')
class TestProofValidation(TransactionCase):
    """Tests pour validation source_model/source_id et next_retry_at"""

    def setUp(self):
        super().setUp()
        self.env['ir.config_parameter'].sudo().set_param('dorevia.dvig.url', 'https://dvig.test.com')
        self.env['ir.config_parameter'].sudo().set_param('dorevia.dvig.token', 'test_token')
        self.env['ir.config_parameter'].sudo().set_param('dorevia.vault.url', 'https://vault.test.com')

        self.partner = self.env['res.partner'].create({'name': 'Test Partner'})
        self.journal = self.env['account.journal'].search([
            ('type', '=', 'sale'),
            ('company_id', '=', self.env.company.id),
        ], limit=1)
        if not self.journal:
            self.journal = self.env['account.journal'].create({
                'name': 'Test Sale Journal',
                'type': 'sale',
                'code': 'TST',
            })

    def _create_invoice(self, **kwargs):
        vals = {
            'move_type': 'out_invoice',
            'partner_id': self.partner.id,
            'journal_id': self.journal.id,
            'invoice_line_ids': [(0, 0, {
                'name': 'Test line',
                'quantity': 1,
                'price_unit': 100,
            })],
        }
        vals.update(kwargs)
        inv = self.env['account.move'].create(vals)
        inv.action_post()
        return inv

    def _proof_response(self, **overrides):
        base = {
            'id': 'doc-uuid',
            'hash': 'sha256hex',
            'ledger': 'ledger-hash',
            'timestamp': '2026-02-22T20:34:24Z',
            'jws': 'eyJ...',
            'status': 'verified',
        }
        base.update(overrides)
        return base

    def test_fetch_proof_source_model_source_id_ok(self):
        """Preuve avec source_model=account.move et source_id=move.id → vaulted"""
        invoice = self._create_invoice()
        invoice.with_context(dorevia_skip_posted_hook=True).write({
            'dorevia_vault_status': 'pending_proof',
            'dorevia_dvig_event_id': 'ev-123',
        })

        proof = self._proof_response(
            source_model='account.move',
            source_id=invoice.id,
        )
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = proof
        mock_resp.raise_for_status = MagicMock()

        with patch('odoo.addons.dorevia_vault_connector.models.account_move.requests.get', return_value=mock_resp):
            invoice._fetch_and_apply_proof('https://vault.test.com')

        self.assertEqual(invoice.dorevia_vault_status, 'vaulted')
        self.assertEqual(invoice.dorevia_vault_id, 'doc-uuid')

    def test_fetch_proof_source_model_mismatch_rejected(self):
        """Preuve avec source_model != account.move → pas de passage en vaulted"""
        invoice = self._create_invoice()
        invoice.with_context(dorevia_skip_posted_hook=True).write({
            'dorevia_vault_status': 'pending_proof',
            'dorevia_dvig_event_id': 'ev-123',
        })

        proof = self._proof_response(
            source_model='account.payment',
            source_id=invoice.id,
        )
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = proof
        mock_resp.raise_for_status = MagicMock()

        with patch('odoo.addons.dorevia_vault_connector.models.account_move.requests.get', return_value=mock_resp):
            invoice._fetch_and_apply_proof('https://vault.test.com')

        self.assertEqual(invoice.dorevia_vault_status, 'pending_proof')
        self.assertFalse(invoice.dorevia_vault_id)

    def test_fetch_proof_source_id_mismatch_rejected(self):
        """Preuve avec source_id != move.id → pas de passage en vaulted"""
        invoice = self._create_invoice()
        invoice.with_context(dorevia_skip_posted_hook=True).write({
            'dorevia_vault_status': 'pending_proof',
            'dorevia_dvig_event_id': 'ev-123',
        })

        proof = self._proof_response(
            source_model='account.move',
            source_id=999999,  # Autre ID
        )
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = proof
        mock_resp.raise_for_status = MagicMock()

        with patch('odoo.addons.dorevia_vault_connector.models.account_move.requests.get', return_value=mock_resp):
            invoice._fetch_and_apply_proof('https://vault.test.com')

        self.assertEqual(invoice.dorevia_vault_status, 'pending_proof')
        self.assertFalse(invoice.dorevia_vault_id)

    def test_fetch_proof_source_id_str_ok(self):
        """Preuve avec source_id en string (JSON) → acceptée si égale à move.id"""
        invoice = self._create_invoice()
        invoice.with_context(dorevia_skip_posted_hook=True).write({
            'dorevia_vault_status': 'pending_proof',
            'dorevia_dvig_event_id': 'ev-123',
        })

        proof = self._proof_response(
            source_model='account.move',
            source_id=str(invoice.id),
        )
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = proof
        mock_resp.raise_for_status = MagicMock()

        with patch('odoo.addons.dorevia_vault_connector.models.account_move.requests.get', return_value=mock_resp):
            invoice._fetch_and_apply_proof('https://vault.test.com')

        self.assertEqual(invoice.dorevia_vault_status, 'vaulted')

    def test_fetch_proof_no_source_fields_accepted(self):
        """Preuve sans source_model/source_id (legacy) → acceptée (rétrocompat)"""
        invoice = self._create_invoice()
        invoice.with_context(dorevia_skip_posted_hook=True).write({
            'dorevia_vault_status': 'pending_proof',
            'dorevia_dvig_event_id': 'ev-123',
        })

        proof = self._proof_response()
        # Pas de source_model ni source_id
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = proof
        mock_resp.raise_for_status = MagicMock()

        with patch('odoo.addons.dorevia_vault_connector.models.account_move.requests.get', return_value=mock_resp):
            invoice._fetch_and_apply_proof('https://vault.test.com')

        self.assertEqual(invoice.dorevia_vault_status, 'vaulted')

    def test_cron_fetch_proof_respects_next_retry_at(self):
        """cron_vault_fetch_proof : ne sélectionne pas les moves avec next_retry_at dans le futur"""
        invoice = self._create_invoice()
        invoice.with_context(dorevia_skip_posted_hook=True).write({
            'dorevia_vault_status': 'pending_proof',
            'dorevia_dvig_event_id': 'ev-123',
            'dorevia_vault_next_retry_at': fields.Datetime.now() + timedelta(minutes=10),
        })

        # Domaine du CRON #2 (aligné sur l'implémentation)
        now = fields.Datetime.now()
        moves = self.env['account.move'].search([
            ('dorevia_vault_status', '=', 'pending_proof'),
            ('dorevia_dvig_event_id', '!=', False),
            '|',
            ('dorevia_vault_next_retry_at', '<=', now),
            ('dorevia_vault_next_retry_at', '=', False),
        ], limit=50)

        self.assertNotIn(invoice.id, moves.ids)

    def test_cron_fetch_proof_selects_next_retry_past(self):
        """cron_vault_fetch_proof : sélectionne les moves avec next_retry_at dans le passé"""
        invoice = self._create_invoice()
        invoice.with_context(dorevia_skip_posted_hook=True).write({
            'dorevia_vault_status': 'pending_proof',
            'dorevia_dvig_event_id': 'ev-123',
            'dorevia_vault_next_retry_at': fields.Datetime.now() - timedelta(minutes=1),
        })

        now = fields.Datetime.now()
        moves = self.env['account.move'].search([
            ('dorevia_vault_status', '=', 'pending_proof'),
            ('dorevia_dvig_event_id', '!=', False),
            '|',
            ('dorevia_vault_next_retry_at', '<=', now),
            ('dorevia_vault_next_retry_at', '=', False),
        ], limit=50)

        self.assertIn(invoice.id, moves.ids)

    def test_cron_fetch_proof_selects_next_retry_false(self):
        """cron_vault_fetch_proof : sélectionne les moves avec next_retry_at=False"""
        invoice = self._create_invoice()
        invoice.with_context(dorevia_skip_posted_hook=True).write({
            'dorevia_vault_status': 'pending_proof',
            'dorevia_dvig_event_id': 'ev-123',
            'dorevia_vault_next_retry_at': False,
        })

        now = fields.Datetime.now()
        moves = self.env['account.move'].search([
            ('dorevia_vault_status', '=', 'pending_proof'),
            ('dorevia_dvig_event_id', '!=', False),
            '|',
            ('dorevia_vault_next_retry_at', '<=', now),
            ('dorevia_vault_next_retry_at', '=', False),
        ], limit=50)

        self.assertIn(invoice.id, moves.ids)

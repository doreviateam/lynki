# -*- coding: utf-8 -*-
"""
Tests pour action_securiser_maintenant — Bouton « Sécuriser maintenant »

Vérifie :
- Éligibilité (todo, pending_proof, failed_soft)
- Configuration DVIG/Vault manquante
- Incrément du compteur de tentatives pour pending_proof
- Récupération de preuve (mock HTTP)
"""

from odoo.tests import tagged
from odoo.tests.common import TransactionCase
from odoo.exceptions import UserError
from odoo import fields
from datetime import datetime
from unittest.mock import patch, MagicMock


@tagged('post_install', '-at_install')
class TestActionSecuriserMaintenant(TransactionCase):
    """Tests pour action_securiser_maintenant"""

    def setUp(self):
        super().setUp()
        self.env['ir.config_parameter'].sudo().set_param('dorevia.dvig.url', 'https://dvig.test.com')
        self.env['ir.config_parameter'].sudo().set_param('dorevia.dvig.token', 'test_token')
        self.env['ir.config_parameter'].sudo().set_param('dorevia.dvig.source', 'odoo.test.sarl')
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

    def test_action_securiser_vaulted_not_eligible(self):
        """Facture déjà vaulted → UserError"""
        invoice = self._create_invoice()
        invoice.with_context(dorevia_skip_posted_hook=True).write({
            'dorevia_vault_status': 'vaulted',
            'dorevia_vaulted': True,
        })
        with self.assertRaises(UserError) as cm:
            invoice.action_securiser_maintenant()
        self.assertIn('éligible', str(cm.exception))

    def test_action_securiser_config_missing(self):
        """Configuration DVIG manquante → UserError"""
        self.env['ir.config_parameter'].sudo().set_param('dorevia.dvig.url', '')
        invoice = self._create_invoice()
        with self.assertRaises(UserError) as cm:
            invoice.action_securiser_maintenant()
        self.assertIn('Configuration DVIG', str(cm.exception))

    def test_action_securiser_pending_proof_increments_attempt(self):
        """pending_proof + preuve disponible → vaulted, compteur incrémenté si pas vaulted"""
        invoice = self._create_invoice()
        invoice.with_context(dorevia_skip_posted_hook=True).write({
            'dorevia_vault_status': 'pending_proof',
            'dorevia_dvig_event_id': 'ev-123',
            'dorevia_vault_attempt_count': 2,
        })

        proof_response = {
            'id': 'uuid-proof-123',
            'hash': 'abc123sha256',
            'ledger': 'ledger-hash',
            'timestamp': '2026-02-22T20:34:24Z',
            'jws': 'eyJ...',
            'status': 'verified',
        }

        mock_get = MagicMock()
        mock_get.status_code = 200
        mock_get.json.return_value = proof_response
        mock_get.raise_for_status = MagicMock()

        with patch('odoo.addons.dorevia_vault_connector.models.account_move.requests.get', return_value=mock_get):
            with patch('odoo.addons.dorevia_vault_connector.models.account_move.requests.post') as mock_post:
                mock_post_resp = MagicMock()
                mock_post_resp.status_code = 200
                mock_post_resp.json.return_value = {'event_id': 'ev-123'}
                mock_post_resp.raise_for_status = MagicMock()
                mock_post.return_value = mock_post_resp

                with patch('time.sleep'):
                    result = invoice.action_securiser_maintenant()

        self.assertEqual(invoice.dorevia_vault_status, 'vaulted')
        self.assertEqual(invoice.dorevia_vault_id, 'uuid-proof-123')
        self.assertEqual(invoice.dorevia_vault_sha256, 'abc123sha256')
        self.assertIn('display_notification', result.get('tag', ''))

    def test_action_securiser_pending_proof_404_increments_only(self):
        """pending_proof + 404 (preuve pas prête) → incrémente attempt_count, reste pending_proof"""
        invoice = self._create_invoice()
        invoice.with_context(dorevia_skip_posted_hook=True).write({
            'dorevia_vault_status': 'pending_proof',
            'dorevia_dvig_event_id': 'ev-123',
            'dorevia_vault_attempt_count': 2,
        })

        mock_get = MagicMock()
        mock_get.status_code = 404

        mock_post = MagicMock()
        mock_post.status_code = 200
        mock_post.raise_for_status = MagicMock()

        with patch('odoo.addons.dorevia_vault_connector.models.account_move.requests.get', return_value=mock_get):
            with patch('odoo.addons.dorevia_vault_connector.models.account_move.requests.post', return_value=mock_post):
                with patch('time.sleep'):
                    result = invoice.action_securiser_maintenant()

        self.assertEqual(invoice.dorevia_vault_status, 'pending_proof')
        self.assertEqual(invoice.dorevia_vault_attempt_count, 3)
        self.assertIn('display_notification', result.get('tag', ''))

    def test_fetch_and_apply_proof_success(self):
        """_fetch_and_apply_proof : 200 + status verified → vaulted"""
        invoice = self._create_invoice()
        invoice.with_context(dorevia_skip_posted_hook=True).write({
            'dorevia_vault_status': 'pending_proof',
            'dorevia_dvig_event_id': 'ev-123',
        })

        proof_response = {
            'id': 'doc-uuid',
            'hash': 'sha256hex',
            'ledger': 'ledger-hash',
            'timestamp': '2026-02-22T20:34:24Z',
            'jws': 'eyJ...',
            'status': 'verified',
        }

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = proof_response
        mock_resp.raise_for_status = MagicMock()

        with patch('odoo.addons.dorevia_vault_connector.models.account_move.requests.get', return_value=mock_resp):
            invoice._fetch_and_apply_proof('https://vault.test.com')

        self.assertEqual(invoice.dorevia_vault_status, 'vaulted')
        self.assertEqual(invoice.dorevia_vault_id, 'doc-uuid')
        self.assertEqual(invoice.dorevia_vault_sha256, 'sha256hex')

    def test_fetch_and_apply_proof_404_no_change(self):
        """_fetch_and_apply_proof : 404 → pas de modification"""
        invoice = self._create_invoice()
        invoice.with_context(dorevia_skip_posted_hook=True).write({
            'dorevia_vault_status': 'pending_proof',
        })

        mock_resp = MagicMock()
        mock_resp.status_code = 404

        with patch('odoo.addons.dorevia_vault_connector.models.account_move.requests.get', return_value=mock_resp):
            invoice._fetch_and_apply_proof('https://vault.test.com')

        self.assertEqual(invoice.dorevia_vault_status, 'pending_proof')
        self.assertFalse(invoice.dorevia_vault_id)

    def test_fetch_and_apply_proof_status_pending_no_vault(self):
        """_fetch_and_apply_proof : status=pending → pas de passage en vaulted"""
        invoice = self._create_invoice()
        invoice.with_context(dorevia_skip_posted_hook=True).write({
            'dorevia_vault_status': 'pending_proof',
        })

        proof_response = {
            'id': 'doc-uuid',
            'hash': 'sha256hex',
            'status': 'pending',
            'timestamp': '2026-02-22T20:34:24Z',
        }

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = proof_response
        mock_resp.raise_for_status = MagicMock()

        with patch('odoo.addons.dorevia_vault_connector.models.account_move.requests.get', return_value=mock_resp):
            invoice._fetch_and_apply_proof('https://vault.test.com')

        self.assertEqual(invoice.dorevia_vault_status, 'pending_proof')

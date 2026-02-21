# -*- coding: utf-8 -*-
"""
Tests pour le hook write() — init vault sur transition vers posted (SPEC v1.1).
Plan : ZeDocs/web14/PLAN_IMPLEMENTATION_HOOK_WRITE_POSTED_SCRUM.md US-3.2
"""

from unittest.mock import patch
from odoo.tests.common import TransactionCase
from odoo.tests import tagged
from datetime import datetime


@tagged('post_install', '-at_install')
class TestHookWritePosted(TransactionCase):
    """Tests du hook write() pour initialisation vault sur transition state -> posted."""

    def setUp(self):
        super().setUp()
        self.AccountMove = self.env['account.move']
        self.IrConfigParameter = self.env['ir.config_parameter'].sudo()
        # Config DVIG pour que _should_vault retourne True
        self.IrConfigParameter.set_param('dorevia.dvig.url', 'https://dvig.test.com')
        self.IrConfigParameter.set_param('dorevia.dvig.token', 'test_token')
        self.IrConfigParameter.set_param('dorevia.dvig.source', 'odoo.test.core')
        # Journal vente (requis pour facture valide)
        self.journal = self.env['account.journal'].search([
            ('type', '=', 'sale'),
            ('company_id', '=', self.env.company.id),
        ], limit=1)
        if not self.journal:
            self.journal = self.env['account.journal'].create({
                'name': 'Test Sale Journal',
                'type': 'sale',
                'code': 'THWP',
            })
        self.partner = self.env['res.partner'].create({'name': 'Test Partner Hook Write'})

    def _create_invoice(self, **kwargs):
        vals = {
            'move_type': 'out_invoice',
            'partner_id': self.partner.id,
            'journal_id': self.journal.id,
            'invoice_date': datetime.now().date(),
            'invoice_line_ids': [(0, 0, {
                'name': 'Test Product',
                'quantity': 1,
                'price_unit': 100.0,
            })],
        }
        vals.update(kwargs)
        return self.AccountMove.create(vals)

    def test_write_posted_initializes_vault(self):
        """Write state=posted sur facture draft → todo, clé, init."""
        inv = self._create_invoice()
        self.assertEqual(inv.state, 'draft')
        self.assertFalse(inv.dorevia_vault_idempotency_key)
        inv.write({'state': 'posted'})
        self.assertEqual(inv.state, 'posted')
        self.assertTrue(inv.dorevia_vault_idempotency_key, "Clé d'idempotence doit être définie")
        self.assertEqual(inv.dorevia_vault_status, 'todo')

    def test_already_posted_write_no_reinit(self):
        """Déjà posté + write(state=posted) ou autre champ → pas de réinit."""
        inv = self._create_invoice()
        inv.write({'state': 'posted'})
        key1 = inv.dorevia_vault_idempotency_key
        self.assertTrue(key1)
        # Re-write posted (simule repost ou autre)
        inv.with_context(dorevia_skip_posted_hook=False).write({'state': 'posted'})
        self.assertEqual(inv.dorevia_vault_idempotency_key, key1, "Clé ne doit pas changer")
        self.assertEqual(inv.dorevia_vault_status, 'todo')

    def test_write_without_state_no_init(self):
        """Write sans 'state' dans vals → aucune init vault."""
        inv = self._create_invoice()
        inv.write({'state': 'posted'})
        self.assertTrue(inv.dorevia_vault_idempotency_key)
        # Nouvelle facture draft, on écrit un autre champ (sans state) → pas d'init vault
        inv2 = self._create_invoice()
        inv2.write({'ref': 'REF-NO-STATE'})
        self.assertFalse(inv2.dorevia_vault_idempotency_key, "Write sans state ne doit pas poser la clé")

    def test_write_state_not_posted_no_init(self):
        """Write avec state != 'posted' (ex. draft) → pas d'init."""
        inv = self._create_invoice()
        # Rester en draft via write d'un autre champ
        inv.write({'ref': 'X'})
        self.assertFalse(inv.dorevia_vault_idempotency_key)

    def test_non_eligible_no_init(self):
        """Move non éligible (_should_vault False) → pas d'init."""
        self.IrConfigParameter.set_param('dorevia.dvig.url', '')
        inv = self._create_invoice()
        inv.write({'state': 'posted'})
        self.assertFalse(inv.dorevia_vault_idempotency_key)

    def test_pos_invoice_write_posted_init_ok(self):
        """Facture type POS (invoice_origin) postée via write → init OK."""
        inv = self._create_invoice(invoice_origin='Boulangerie/0007')
        inv.write({'state': 'posted'})
        self.assertTrue(inv.dorevia_vault_idempotency_key)
        self.assertEqual(inv.dorevia_vault_status, 'todo')

    def test_batch_single_trigger(self):
        """Plusieurs moves en un write → tous initialisés (un seul trigger côté code)."""
        inv1 = self._create_invoice()
        inv2 = self._create_invoice()
        self.AccountMove.browse([inv1.id, inv2.id]).write({'state': 'posted'})
        self.assertTrue(inv1.dorevia_vault_idempotency_key)
        self.assertTrue(inv2.dorevia_vault_idempotency_key)
        self.assertEqual(inv1.dorevia_vault_status, 'todo')
        self.assertEqual(inv2.dorevia_vault_status, 'todo')

    def test_skip_posted_hook_context_no_init(self):
        """Contexte dorevia_skip_posted_hook=True → write ne déclenche pas _vault_init_moves."""
        inv = self._create_invoice()
        inv.with_context(dorevia_skip_posted_hook=True).write({'state': 'posted'})
        self.assertFalse(inv.dorevia_vault_idempotency_key)

    def test_error_compute_sets_status_and_message(self):
        """Erreur dans _compute_idempotency_key → statut explicite (failed_soft) + last_error, write ne remonte pas."""
        inv = self._create_invoice()
        with patch.object(type(inv), '_compute_idempotency_key', side_effect=RuntimeError("Compute error")):
            inv.write({'state': 'posted'})
        inv.invalidate_recordset()
        self.assertEqual(inv.dorevia_vault_status, 'failed_soft')
        self.assertTrue(inv.dorevia_vault_last_error)
        self.assertIn('Compute error', inv.dorevia_vault_last_error)

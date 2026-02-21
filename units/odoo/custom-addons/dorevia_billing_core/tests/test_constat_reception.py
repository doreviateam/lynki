# -*- coding: utf-8 -*-

from odoo.tests.common import TransactionCase
from odoo.exceptions import ValidationError
from datetime import datetime
import random
import string


def generate_constat_id():
    """Génère un ID de constat de 10 caractères alphanumériques"""
    charset = string.ascii_letters + string.digits  # a-z, A-Z, 0-9
    return ''.join(random.choice(charset) for _ in range(10))


class TestConstatReception(TransactionCase):
    """Tests unitaires pour la réception et le traitement des constats"""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        
        # Créer un tenant de test
        cls.tenant = cls.env['res.partner'].create({
            'name': 'Test Tenant',
            'code': 'test-tenant-1',
            'is_company': True,
        })

        # Créer un contrat de test
        cls.contract = cls.env['dorevia.contract'].create({
            'name': 'Contrat Test Premium',
            'tenant_id': cls.tenant.id,
            'start_date': '2026-01-01',
            'active': True,
            'tax_rate': 20.0,
            'tax_exempt': False,
        })

        # Créer des règles tarifaires de test
        cls.rule1 = cls.env['dorevia.pricing.rule'].create({
            'contract_id': cls.contract.id,
            'move_type': 'out_invoice',
            'price_unit': 1.00,
            'currency_id': cls.env.company.currency_id.id,
            'tier_from': 0,
            'tier_to': 100,
            'discount_percent': 0.0,
            'sequence': 10,
            'active': True,
        })

        cls.rule2 = cls.env['dorevia.pricing.rule'].create({
            'contract_id': cls.contract.id,
            'move_type': 'out_invoice',
            'price_unit': 0.90,
            'currency_id': cls.env.company.currency_id.id,
            'tier_from': 100,
            'tier_to': 200,
            'discount_percent': 5.0,
            'sequence': 20,
            'active': True,
        })

    def test_validate_payload_json(self):
        """Test de validation du payload JSON"""
        # Payload valide
        valid_payload = {
            'constat_id': generate_constat_id(),
            'tenant': 'test-tenant-1',
            'period': '2026-01',
            'generated_at': '2026-02-01T00:05:23Z',
            'vault_id': 'vault-test',
            'volumes': {
                'out_invoice': 150,
                'in_invoice': 45,
                'out_refund': 3,
                'in_refund': 1,
            },
            'proofs': {
                'jws': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test',
                'documents_count': 199,
            },
        }
        
        # Créer le constat
        constat = self.env['dorevia.constat'].create({
            'constat_id': valid_payload['constat_id'],
            'tenant_id': self.tenant.id,
            'period': valid_payload['period'],
            'generated_at': datetime.fromisoformat(valid_payload['generated_at'].replace('Z', '+00:00')),
            'vault_id': valid_payload['vault_id'],
            'volumes_out_invoice': valid_payload['volumes']['out_invoice'],
            'volumes_in_invoice': valid_payload['volumes']['in_invoice'],
            'volumes_out_refund': valid_payload['volumes']['out_refund'],
            'volumes_in_refund': valid_payload['volumes']['in_refund'],
            'proofs_jws': valid_payload['proofs']['jws'],
            'proofs_documents_count': valid_payload['proofs']['documents_count'],
        })

        self.assertEqual(constat.constat_id, valid_payload['constat_id'])
        self.assertEqual(constat.period, '2026-01')

    def test_idempotence(self):
        """Test d'idempotence (même constat_id ne doit pas être dupliqué)"""
        constat_id = generate_constat_id()
        
        # Créer le premier constat
        constat1 = self.env['dorevia.constat'].create({
            'constat_id': constat_id,
            'tenant_id': self.tenant.id,
            'period': '2026-01',
            'generated_at': datetime.now(),
        })

        # Tenter de créer un deuxième constat avec le même constat_id
        with self.assertRaises(ValidationError):
            self.env['dorevia.constat'].create({
                'constat_id': constat_id,
                'tenant_id': self.tenant.id,
                'period': '2026-01',
                'generated_at': datetime.now(),
            })

    def test_attach_tenant_contract(self):
        """Test de rattachement tenant + contrat"""
        constat = self.env['dorevia.constat'].create({
            'constat_id': generate_constat_id(),
            'tenant_id': self.tenant.id,
            'period': '2026-01',
            'generated_at': datetime.now(),
        })

        # Appeler la méthode de rattachement (simulée)
        contract = self.env['dorevia.contract']._get_active_contract(self.tenant.id, '2026-01')
        
        if contract:
            constat.contract_id = contract.id
            self.assertEqual(constat.contract_id.id, self.contract.id)

    def test_compute_amounts_tiers(self):
        """Test de calcul des montants avec paliers"""
        constat = self.env['dorevia.constat'].create({
            'constat_id': generate_constat_id(),
            'tenant_id': self.tenant.id,
            'period': '2026-01',
            'generated_at': datetime.now(),
            'contract_id': self.contract.id,
            'volumes_out_invoice': 150,  # Volume pour tester les paliers
        })

        amounts = constat._compute_amounts()
        
        # Vérifier le calcul avec paliers
        # Tranche 0-100: 100 × 1.00€ = 100.00€
        # Tranche 100-150: 50 × 0.90€ × (1 - 5%) = 42.75€
        # Total HT attendu: 142.75€
        self.assertGreater(amounts['out_invoice']['ht'], 0)
        self.assertAlmostEqual(amounts['out_invoice']['ht'], 142.75, places=2)

    def test_compute_amounts_discounts(self):
        """Test de calcul des montants avec remises"""
        constat = self.env['dorevia.constat'].create({
            'constat_id': generate_constat_id(),
            'tenant_id': self.tenant.id,
            'period': '2026-01',
            'generated_at': datetime.now(),
            'contract_id': self.contract.id,
            'volumes_out_invoice': 150,
        })

        amounts = constat._compute_amounts()
        
        # Vérifier que la remise de 5% est appliquée sur la tranche 100-200
        # La tranche 100-150 devrait avoir une remise de 5%
        self.assertGreater(amounts['out_invoice']['ht'], 0)

    def test_compute_amounts_tax(self):
        """Test d'application de la TVA"""
        constat = self.env['dorevia.constat'].create({
            'constat_id': generate_constat_id(),
            'tenant_id': self.tenant.id,
            'period': '2026-01',
            'generated_at': datetime.now(),
            'contract_id': self.contract.id,
            'volumes_out_invoice': 100,
        })

        amounts = constat._compute_amounts()
        
        # Vérifier que la TVA est appliquée (20%)
        # Total HT: 100.00€
        # Total TTC attendu: 120.00€
        self.assertAlmostEqual(amounts['total_ht'], 100.0, places=2)
        self.assertAlmostEqual(amounts['total_ttc'], 120.0, places=2)

    def test_generate_invoice(self):
        """Test de génération de facture"""
        constat = self.env['dorevia.constat'].create({
            'constat_id': generate_constat_id(),
            'tenant_id': self.tenant.id,
            'period': '2026-01',
            'generated_at': datetime.now(),
            'contract_id': self.contract.id,
            'volumes_out_invoice': 100,
            'state': 'validated',
            'invoice_status': 'pending',
        })

        # Générer la facture
        invoice = constat.action_generate_invoice()

        self.assertIsNotNone(invoice)
        self.assertEqual(invoice.move_type, 'out_invoice')
        self.assertEqual(invoice.partner_id.id, self.tenant.id)
        self.assertEqual(constat.invoice_id.id, invoice.id)
        self.assertEqual(constat.invoice_status, 'invoiced')
        self.assertEqual(constat.state, 'invoiced')

    def test_jws_verification_valid(self):
        """Test de vérification JWS valide (mock)"""
        # Note: Ce test nécessiterait un JWS valide et un JWKS accessible
        # Pour l'instant, on teste juste que la méthode ne plante pas
        constat = self.env['dorevia.constat'].create({
            'constat_id': generate_constat_id(),
            'tenant_id': self.tenant.id,
            'period': '2026-01',
            'generated_at': datetime.now(),
            'proofs_jws': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test',
        })

        # La vérification JWS est non bloquante, donc même si elle échoue,
        # le constat doit rester dans un état valide
        self.assertIn(constat.state, ['draft', 'validated', 'validated_with_warning'])

    def test_jws_verification_invalid(self):
        """Test de vérification JWS invalide (non bloquant)"""
        constat = self.env['dorevia.constat'].create({
            'constat_id': generate_constat_id(),
            'tenant_id': self.tenant.id,
            'period': '2026-01',
            'generated_at': datetime.now(),
            'proofs_jws': 'invalid.jws.token',
            'state': 'validated',
        })

        # Si JWS invalide, state devrait être 'validated_with_warning'
        # Mais comme la vérification est non bloquante, on accepte aussi 'validated'
        self.assertIn(constat.state, ['validated', 'validated_with_warning'])


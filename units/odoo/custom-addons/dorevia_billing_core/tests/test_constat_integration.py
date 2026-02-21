# -*- coding: utf-8 -*-

from odoo.tests.common import HttpCase
from odoo import http
from datetime import datetime
import json
import random
import string


def generate_constat_id():
    """Génère un ID de constat de 10 caractères alphanumériques"""
    charset = string.ascii_letters + string.digits  # a-z, A-Z, 0-9
    return ''.join(random.choice(charset) for _ in range(10))


class TestConstatIntegration(HttpCase):
    """Tests d'intégration pour la réception complète et la facturation"""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        
        # Créer un tenant de test
        cls.tenant = cls.env['res.partner'].create({
            'name': 'Test Tenant Integration',
            'code': 'test-tenant-integration',
            'is_company': True,
        })

        # Créer un contrat de test
        cls.contract = cls.env['dorevia.contract'].create({
            'name': 'Contrat Test Integration',
            'tenant_id': cls.tenant.id,
            'start_date': '2026-01-01',
            'active': True,
            'tax_rate': 20.0,
            'tax_exempt': False,
        })

        # Créer une règle tarifaire simple
        cls.env['dorevia.pricing.rule'].create({
            'contract_id': cls.contract.id,
            'move_type': 'out_invoice',
            'price_unit': 1.00,
            'currency_id': cls.env.company.currency_id.id,
            'tier_from': 0,
            'tier_to': None,  # Pas de limite
            'discount_percent': 0.0,
            'sequence': 10,
            'active': True,
        })

    def test_reception_complete_flow(self):
        """Test du flux complet : réception → stockage → facturation"""
        constat_id = generate_constat_id()
        payload = {
            'constat_id': constat_id,
            'tenant': 'test-tenant-integration',
            'period': '2026-01',
            'generated_at': '2026-02-01T00:05:23Z',
            'vault_id': 'vault-test',
            'volumes': {
                'out_invoice': 100,
                'in_invoice': 0,
                'out_refund': 0,
                'in_refund': 0,
            },
            'proofs': {
                'jws': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test',
                'documents_count': 100,
            },
        }

        # Simuler la réception via l'endpoint (via contrôleur)
        # Note: Pour un vrai test d'intégration, il faudrait appeler l'endpoint HTTP
        # Ici, on teste directement le modèle
        
        constat = self.env['dorevia.constat'].create({
            'constat_id': payload['constat_id'],
            'tenant_id': self.tenant.id,
            'period': payload['period'],
            'generated_at': datetime.fromisoformat(payload['generated_at'].replace('Z', '+00:00')),
            'vault_id': payload['vault_id'],
            'volumes_out_invoice': payload['volumes']['out_invoice'],
            'proofs_jws': payload['proofs']['jws'],
            'proofs_documents_count': payload['proofs']['documents_count'],
            'contract_id': self.contract.id,
            'state': 'validated',
        })

        # Vérifier que le constat est créé
        self.assertEqual(constat.constat_id, constat_id)
        self.assertEqual(constat.tenant_id.id, self.tenant.id)
        self.assertEqual(constat.contract_id.id, self.contract.id)

        # Générer la facture
        invoice = constat.action_generate_invoice()

        # Vérifier que la facture est créée
        self.assertIsNotNone(invoice)
        self.assertEqual(invoice.move_type, 'out_invoice')
        self.assertEqual(constat.invoice_status, 'invoiced')

    def test_generate_invoice_with_pricing_rules(self):
        """Test de génération de facture avec règles tarifaires complexes"""
        # Créer des règles tarifaires avec paliers
        self.env['dorevia.pricing.rule'].create({
            'contract_id': self.contract.id,
            'move_type': 'out_invoice',
            'price_unit': 1.00,
            'currency_id': self.env.company.currency_id.id,
            'tier_from': 0,
            'tier_to': 100,
            'discount_percent': 0.0,
            'sequence': 10,
            'active': True,
        })

        self.env['dorevia.pricing.rule'].create({
            'contract_id': self.contract.id,
            'move_type': 'out_invoice',
            'price_unit': 0.90,
            'currency_id': self.env.company.currency_id.id,
            'tier_from': 100,
            'tier_to': None,
            'discount_percent': 5.0,
            'sequence': 20,
            'active': True,
        })

        constat = self.env['dorevia.constat'].create({
            'constat_id': generate_constat_id(),
            'tenant_id': self.tenant.id,
            'period': '2026-01',
            'generated_at': datetime.now(),
            'contract_id': self.contract.id,
            'volumes_out_invoice': 150,
            'state': 'validated',
            'invoice_status': 'pending',
        })

        # Calculer les montants
        amounts = constat._compute_amounts()
        
        # Vérifier le calcul avec paliers
        self.assertAlmostEqual(amounts['out_invoice']['ht'], 142.75, places=2)

        # Générer la facture
        invoice = constat.action_generate_invoice()
        
        # Vérifier que la facture contient les bonnes lignes
        self.assertEqual(len(invoice.invoice_line_ids), 1)  # Une ligne pour out_invoice
        self.assertAlmostEqual(invoice.amount_total, amounts['total_ttc'], places=2)

    def test_error_handling(self):
        """Test de gestion des erreurs"""
        # Test : constat sans contrat ne peut pas générer de facture
        constat = self.env['dorevia.constat'].create({
            'constat_id': generate_constat_id(),
            'tenant_id': self.tenant.id,
            'period': '2026-01',
            'generated_at': datetime.now(),
            'contract_id': False,  # Pas de contrat
            'volumes_out_invoice': 100,
            'state': 'validated',
            'invoice_status': 'pending',
        })

        with self.assertRaises(ValidationError) as cm:
            constat.action_generate_invoice()
        
        self.assertIn('Aucun contrat actif', str(cm.exception))

        # Test : constat déjà facturé ne peut pas être refacturé
        constat_with_invoice = self.env['dorevia.constat'].create({
            'constat_id': generate_constat_id(),
            'tenant_id': self.tenant.id,
            'period': '2026-01',
            'generated_at': datetime.now(),
            'contract_id': self.contract.id,
            'volumes_out_invoice': 100,
            'state': 'invoiced',
            'invoice_status': 'invoiced',
        })

        with self.assertRaises(ValidationError) as cm:
            constat_with_invoice.action_generate_invoice()
        
        self.assertIn('déjà été traité', str(cm.exception))


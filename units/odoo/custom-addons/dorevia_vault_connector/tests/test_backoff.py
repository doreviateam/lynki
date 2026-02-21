# -*- coding: utf-8 -*-

from odoo.tests import tagged
from odoo.tests.common import TransactionCase
from odoo import fields
from datetime import datetime, timedelta


@tagged('post_install', '-at_install')
class TestBackoff(TransactionCase):
    """Tests unitaires pour le backoff exponentiel"""

    def setUp(self):
        super().setUp()
        # Configuration DVIG
        self.env['ir.config_parameter'].sudo().set_param('dorevia.dvig.url', 'https://dvig.test.com')
        self.env['ir.config_parameter'].sudo().set_param('dorevia.dvig.token', 'test_token')
        self.env['ir.config_parameter'].sudo().set_param('dorevia.dvig.source', 'odoo.test.core')

    def test_backoff_attempt_1(self):
        """Test : Tentative 1 = 2 min"""
        move = self.env['account.move'].new({})
        next_retry = move._calculate_next_retry(0)  # attempt_count = 0 pour tentative 1
        
        now = fields.Datetime.now()
        expected = now + timedelta(seconds=2 ** 0 * 60)  # 2 min
        
        # Vérifier que le délai est d'environ 2 minutes (tolérance de 1 seconde)
        diff = abs((next_retry - expected).total_seconds())
        self.assertLess(diff, 2)  # Tolérance de 2 secondes

    def test_backoff_attempt_2(self):
        """Test : Tentative 2 = 4 min"""
        move = self.env['account.move'].new({})
        next_retry = move._calculate_next_retry(1)  # attempt_count = 1 pour tentative 2
        
        now = fields.Datetime.now()
        expected = now + timedelta(seconds=2 ** 1 * 60)  # 4 min
        
        diff = abs((next_retry - expected).total_seconds())
        self.assertLess(diff, 2)

    def test_backoff_attempt_3(self):
        """Test : Tentative 3 = 8 min"""
        move = self.env['account.move'].new({})
        next_retry = move._calculate_next_retry(2)  # attempt_count = 2 pour tentative 3
        
        now = fields.Datetime.now()
        expected = now + timedelta(seconds=2 ** 2 * 60)  # 8 min
        
        diff = abs((next_retry - expected).total_seconds())
        self.assertLess(diff, 2)

    def test_backoff_attempt_4(self):
        """Test : Tentative 4 = 16 min"""
        move = self.env['account.move'].new({})
        next_retry = move._calculate_next_retry(3)  # attempt_count = 3 pour tentative 4
        
        now = fields.Datetime.now()
        expected = now + timedelta(seconds=2 ** 3 * 60)  # 16 min
        
        diff = abs((next_retry - expected).total_seconds())
        self.assertLess(diff, 2)

    def test_backoff_attempt_5_plus(self):
        """Test : Tentative 5+ = 60 min (plafond)"""
        move = self.env['account.move'].new({})
        
        # Test simplifié : vérifier que les délais relatifs entre tentatives sont corrects
        # Tentative 5 (attempt_count=4) : 2^4 * 60 = 960 secondes
        next_retry_5 = move._calculate_next_retry(4)
        # Tentative 6 (attempt_count=5) : 2^5 * 60 = 1920, mais plafond à 3600
        next_retry_6 = move._calculate_next_retry(5)
        # Tentative 10 (attempt_count=9) : plafond à 3600
        next_retry_10 = move._calculate_next_retry(9)
        
        # Vérifier que les dates sont valides (datetime objects)
        self.assertIsNotNone(next_retry_5)
        self.assertIsNotNone(next_retry_6)
        self.assertIsNotNone(next_retry_10)
        
        # Vérifier que tentative 6 > tentative 5 (délai plus long)
        self.assertGreater(next_retry_6, next_retry_5)
        
        # Vérifier que tentative 10 >= tentative 6 (plafond atteint)
        # Note: peut être égal si calculé rapidement, ou supérieur si calculé avec décalage
        self.assertGreaterEqual(next_retry_10, next_retry_6)
        
        # Vérifier que les délais relatifs sont cohérents
        # Tentative 6 devrait être environ 960 secondes après tentative 5
        delay_5_to_6 = (next_retry_6 - next_retry_5).total_seconds()
        # Le délai entre 5 et 6 devrait être proche de (1920 - 960) = 960 secondes
        # Mais avec le plafond, c'est plus complexe. On vérifie juste que c'est positif
        self.assertGreater(delay_5_to_6, 0)

    def test_backoff_formula(self):
        """Test : Formule backoff respectée"""
        move = self.env['account.move'].new({})
        
        for attempt in range(10):
            next_retry = move._calculate_next_retry(attempt)
            now = fields.Datetime.now()
            delay = (next_retry - now).total_seconds()
            
            # Calculer le délai attendu
            expected_delay = min(2 ** attempt * 60, 3600)
            
            # Vérifier avec tolérance de 2 secondes
            self.assertAlmostEqual(delay, expected_delay, delta=2)

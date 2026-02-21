# -*- coding: utf-8 -*-

from odoo.tests import tagged
from odoo.tests.common import TransactionCase
import requests


@tagged('post_install', '-at_install')
class TestClassification(TransactionCase):
    """Tests unitaires pour la classification des erreurs"""

    def setUp(self):
        super().setUp()
        self.move = self.env['account.move'].new({})

    def test_classify_timeout_failed_soft(self):
        """Test : Timeout → failed_soft"""
        exception = requests.exceptions.Timeout("Request timeout")
        classification = self.move._classify_error(exception)
        self.assertEqual(classification, 'failed_soft')

    def test_classify_connection_error_failed_soft(self):
        """Test : ConnectionError → failed_soft"""
        exception = requests.exceptions.ConnectionError("Connection failed")
        classification = self.move._classify_error(exception)
        self.assertEqual(classification, 'failed_soft')

    def test_classify_502_failed_soft(self):
        """Test : 502 → failed_soft"""
        exception = requests.exceptions.HTTPError()
        exception.response = type('obj', (object,), {'status_code': 502})()
        classification = self.move._classify_error(exception, 502)
        self.assertEqual(classification, 'failed_soft')

    def test_classify_503_failed_soft(self):
        """Test : 503 → failed_soft"""
        exception = requests.exceptions.HTTPError()
        exception.response = type('obj', (object,), {'status_code': 503})()
        classification = self.move._classify_error(exception, 503)
        self.assertEqual(classification, 'failed_soft')

    def test_classify_400_failed_hard(self):
        """Test : 400 → failed_hard"""
        exception = requests.exceptions.HTTPError()
        exception.response = type('obj', (object,), {'status_code': 400})()
        classification = self.move._classify_error(exception, 400)
        self.assertEqual(classification, 'failed_hard')

    def test_classify_401_failed_hard(self):
        """Test : 401 → failed_hard"""
        exception = requests.exceptions.HTTPError()
        exception.response = type('obj', (object,), {'status_code': 401})()
        classification = self.move._classify_error(exception, 401)
        self.assertEqual(classification, 'failed_hard')

    def test_classify_403_failed_hard(self):
        """Test : 403 → failed_hard"""
        exception = requests.exceptions.HTTPError()
        exception.response = type('obj', (object,), {'status_code': 403})()
        classification = self.move._classify_error(exception, 403)
        self.assertEqual(classification, 'failed_hard')

    def test_classify_404_failed_hard(self):
        """Test : 404 → failed_hard"""
        exception = requests.exceptions.HTTPError()
        exception.response = type('obj', (object,), {'status_code': 404})()
        classification = self.move._classify_error(exception, 404)
        self.assertEqual(classification, 'failed_hard')

    def test_classify_unknown_error_failed_soft(self):
        """Test : Erreur inconnue → failed_soft (par défaut)"""
        exception = Exception("Unknown error")
        classification = self.move._classify_error(exception)
        self.assertEqual(classification, 'failed_soft')

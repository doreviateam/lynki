# -*- coding: utf-8 -*-

from psycopg2 import IntegrityError

from odoo.exceptions import ValidationError
from odoo.tests.common import TransactionCase, tagged


@tagged("post_install", "-at_install", "dorevia_helloasso", "dorevia_helloasso_payment")
class TestHelloassoPaymentModel(TransactionCase):
    def setUp(self):
        super().setUp()
        self.company = self.env.company
        self.other_company = self.env["res.company"].create({"name": "Autre societe test"})
        self.account = self.env["dorevia.helloasso.account"].create(
            {
                "name": "Compte LGZ test",
                "company_id": self.company.id,
                "environment": "sandbox",
            }
        )
        self.other_account = self.env["dorevia.helloasso.account"].create(
            {
                "name": "Compte autre societe",
                "company_id": self.other_company.id,
                "environment": "sandbox",
            }
        )

    def test_create_payment_record(self):
        payment = self.env["dorevia.helloasso.payment"].create(
            {
                "helloasso_payment_ref": "pay_001",
                "helloasso_order_ref": "ord_001",
                "company_id": self.company.id,
                "helloasso_account_id": self.account.id,
                "campaign_name": "Campagne test",
                "payment_kind": "online",
                "amount_total": 42.5,
                "payer_email": "payer@test.local",
            }
        )
        self.assertEqual(payment.helloasso_payment_ref, "pay_001")
        self.assertEqual(payment.company_id, self.company)
        self.assertEqual(payment.helloasso_account_id, self.account)
        self.assertTrue(payment.is_platform_payment)
        self.assertFalse(payment.is_offline_payment)

    def test_unique_payment_ref_per_account(self):
        Payment = self.env["dorevia.helloasso.payment"]
        vals = {
            "helloasso_payment_ref": "pay_unique",
            "company_id": self.company.id,
            "helloasso_account_id": self.account.id,
        }
        Payment.create(vals)
        with self.cr.savepoint(), self.assertRaises(IntegrityError):
            Payment.create(vals)

    def test_reject_account_company_mismatch(self):
        with self.assertRaises(ValidationError):
            self.env["dorevia.helloasso.payment"].create(
                {
                    "helloasso_payment_ref": "pay_bad_company",
                    "company_id": self.company.id,
                    "helloasso_account_id": self.other_account.id,
                }
            )

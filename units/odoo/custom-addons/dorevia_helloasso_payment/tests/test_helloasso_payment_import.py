# -*- coding: utf-8 -*-

from odoo.tests.common import TransactionCase, tagged

from odoo.addons.dorevia_helloasso_payment.models.helloasso_payment_import import (
    import_api_payment_rows,
    import_csv_payment_rows,
)


@tagged("post_install", "-at_install", "dorevia_helloasso", "dorevia_helloasso_payment")
class TestHelloassoPaymentImport(TransactionCase):
    def setUp(self):
        super().setUp()
        self.account = self.env["dorevia.helloasso.account"].create(
            {
                "name": "Compte import test",
                "company_id": self.env.company.id,
                "environment": "sandbox",
            }
        )

    def test_import_csv_payment_rows_creates_platform_payment(self):
        stats = import_csv_payment_rows(
            self.env,
            self.account,
            [
                {
                    "Référence commande": "82810",
                    "Référence paiement": "53041",
                    "Montant total": "45,00",
                    "Date du paiement": "03/04/2026 18:23:13",
                    "Statut du paiement": "Payé",
                    "Versé": "Non",
                    "Date du versement": "",
                    "Nom payeur": "Baron",
                    "Prénom payeur": "David",
                    "Email payeur": "doreviateam@gmail.com",
                    "Campagne": "BilletterieTestDoreviaGLZ",
                    "Type de campagne": "Billetterie",
                    "Montant du tarif": "40,00",
                    "Montant des options": "",
                    "Don supplémentaire": "5,00",
                    "Montant du code promo": "",
                    "Moyen de paiement": "Carte bancaire",
                }
            ],
        )
        self.assertEqual(stats["created"], 1)
        self.assertEqual(stats["updated"], 0)
        payment = self.env["dorevia.helloasso.payment"].search(
            [("helloasso_account_id", "=", self.account.id), ("helloasso_payment_ref", "=", "53041")]
        )
        self.assertEqual(len(payment), 1)
        self.assertEqual(payment.amount_total, 45.0)
        self.assertEqual(payment.payment_kind, "online")

    def test_import_csv_payment_rows_updates_without_duplicate(self):
        row = {
            "Référence commande": "82810",
            "Référence paiement": "53041",
            "Montant total": "45,00",
            "Date du paiement": "03/04/2026 18:23:13",
            "Statut du paiement": "Payé",
            "Versé": "Non",
            "Date du versement": "",
            "Nom payeur": "Baron",
            "Prénom payeur": "David",
            "Email payeur": "doreviateam@gmail.com",
            "Campagne": "BilletterieTestDoreviaGLZ",
            "Type de campagne": "Billetterie",
            "Montant du tarif": "40,00",
            "Montant des options": "",
            "Don supplémentaire": "5,00",
            "Montant du code promo": "",
            "Moyen de paiement": "Carte bancaire",
        }
        stats1 = import_csv_payment_rows(self.env, self.account, [row])
        self.assertEqual(stats1["created"], 1)
        row2 = dict(row)
        row2["Montant total"] = "50,00"
        stats2 = import_csv_payment_rows(self.env, self.account, [row2])
        self.assertEqual(stats2["created"], 0)
        self.assertEqual(stats2["updated"], 1)
        payments = self.env["dorevia.helloasso.payment"].search(
            [("helloasso_account_id", "=", self.account.id), ("helloasso_payment_ref", "=", "53041")]
        )
        self.assertEqual(len(payments), 1)
        self.assertEqual(payments.amount_total, 50.0)

    def test_import_csv_payment_rows_skips_offline_in_mvp_mode(self):
        stats = import_csv_payment_rows(
            self.env,
            self.account,
            [
                {
                    "Référence commande": "82782",
                    "Référence paiement": "53029",
                    "Montant total": "10,00",
                    "Date du paiement": "03/04/2026",
                    "Statut du paiement": "Hors Ligne",
                    "Versé": "Hors Ligne",
                    "Date du versement": "",
                    "Nom payeur": "larue",
                    "Prénom payeur": "marion",
                    "Email payeur": "marion.larue@gmail.com",
                    "Campagne": "AdhésionTestDoreviaGLZ",
                    "Type de campagne": "Adhésion",
                    "Montant du tarif": "10,00",
                    "Montant des options": "",
                    "Don supplémentaire": "",
                    "Montant du code promo": "",
                    "Moyen de paiement": "Virement bancaire",
                }
            ],
        )
        self.assertEqual(stats["created"], 0)
        self.assertEqual(stats["skip_offline"], 1)
        self.assertEqual(
            self.env["dorevia.helloasso.payment"].search_count(
                [("helloasso_account_id", "=", self.account.id)]
            ),
            0,
        )

    def test_import_api_payment_rows_creates_platform_payment(self):
        stats = import_api_payment_rows(
            self.env,
            self.account,
            [
                {
                    "id": 53041,
                    "amount": 4500,
                    "date": "2026-04-03T18:23:13.4112357+02:00",
                    "state": "Authorized",
                    "cashOutState": "Pending",
                    "paymentMeans": "Card",
                    "payer": {
                        "firstName": "David",
                        "lastName": "Baron",
                        "email": "doreviateam@gmail.com",
                    },
                    "order": {
                        "id": 82810,
                        "formName": "BilletterieTestDoreviaGLZ",
                        "formType": "Event",
                    },
                }
            ],
        )
        self.assertEqual(stats["created"], 1)
        payment = self.env["dorevia.helloasso.payment"].search(
            [("helloasso_account_id", "=", self.account.id), ("helloasso_payment_ref", "=", "53041")]
        )
        self.assertEqual(len(payment), 1)
        self.assertEqual(payment.amount_total, 45.0)
        self.assertEqual(payment.payment_kind, "online")

    def test_import_api_payment_rows_updates_without_duplicate(self):
        payment = {
            "id": 53041,
            "amount": 4500,
            "date": "2026-04-03T18:23:13.4112357+02:00",
            "state": "Authorized",
            "cashOutState": "Pending",
            "paymentMeans": "Card",
            "payer": {
                "firstName": "David",
                "lastName": "Baron",
                "email": "doreviateam@gmail.com",
            },
            "order": {
                "id": 82810,
                "formName": "BilletterieTestDoreviaGLZ",
                "formType": "Event",
            },
        }
        stats1 = import_api_payment_rows(self.env, self.account, [payment])
        self.assertEqual(stats1["created"], 1)
        payment2 = dict(payment)
        payment2["amount"] = 5000
        stats2 = import_api_payment_rows(self.env, self.account, [payment2])
        self.assertEqual(stats2["created"], 0)
        self.assertEqual(stats2["updated"], 1)
        payments = self.env["dorevia.helloasso.payment"].search(
            [("helloasso_account_id", "=", self.account.id), ("helloasso_payment_ref", "=", "53041")]
        )
        self.assertEqual(len(payments), 1)
        self.assertEqual(payments.amount_total, 50.0)

    def test_import_api_payment_rows_skips_offline_in_mvp_mode(self):
        stats = import_api_payment_rows(
            self.env,
            self.account,
            [
                {
                    "id": 53029,
                    "amount": 1000,
                    "date": "2026-04-03T18:23:13.4112357+02:00",
                    "state": "Hors Ligne",
                    "cashOutState": "Hors Ligne",
                    "paymentOffLineMean": "Virement bancaire",
                    "payer": {
                        "firstName": "Marion",
                        "lastName": "Larue",
                        "email": "marion.larue@gmail.com",
                    },
                    "order": {
                        "id": 82782,
                        "formName": "AdhesionTestDoreviaGLZ",
                        "formType": "Membership",
                    },
                }
            ],
        )
        self.assertEqual(stats["created"], 0)
        self.assertEqual(stats["skip_offline"], 1)
        self.assertEqual(
            self.env["dorevia.helloasso.payment"].search_count(
                [("helloasso_account_id", "=", self.account.id)]
            ),
            0,
        )

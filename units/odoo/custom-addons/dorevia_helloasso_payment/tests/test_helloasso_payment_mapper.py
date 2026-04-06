# -*- coding: utf-8 -*-

from odoo.tests.common import TransactionCase, tagged

from odoo.addons.dorevia_helloasso_payment.models.helloasso_payment_mapper import (
    map_csv_payment_row,
    normalize_csv_decimal,
    parse_payment_csv_datetime,
)


@tagged("post_install", "-at_install", "dorevia_helloasso", "dorevia_helloasso_payment")
class TestHelloassoPaymentMapper(TransactionCase):
    def setUp(self):
        super().setUp()
        self.account = self.env["dorevia.helloasso.account"].create(
            {
                "name": "Compte mapper test",
                "company_id": self.env.company.id,
                "environment": "sandbox",
            }
        )

    def test_normalize_csv_decimal(self):
        self.assertEqual(normalize_csv_decimal("45,00"), 45.0)
        self.assertFalse(normalize_csv_decimal(""))

    def test_parse_payment_csv_datetime_without_time_defaults_to_midnight(self):
        dt = parse_payment_csv_datetime("03/04/2026")
        self.assertEqual(str(dt), "2026-04-03 00:00:00")

    def test_map_csv_payment_row_platform_payment(self):
        vals = map_csv_payment_row(
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
            },
            self.account,
        )
        self.assertEqual(vals["helloasso_payment_ref"], "53041")
        self.assertEqual(vals["payment_status"], "paid")
        self.assertEqual(vals["payout_status"], "not_paid_out")
        self.assertEqual(vals["payment_method"], "card")
        self.assertEqual(vals["payment_kind"], "online")
        self.assertTrue(vals["is_platform_payment"])
        self.assertFalse(vals["is_offline_payment"])
        self.assertEqual(vals["amount_total"], 45.0)
        self.assertEqual(vals["amount_tariff"], 40.0)
        self.assertEqual(vals["amount_extra_donation"], 5.0)
        self.assertFalse(vals["amount_options"])
        self.assertFalse(vals["amount_discount"])

    def test_map_csv_payment_row_offline_payment(self):
        vals = map_csv_payment_row(
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
            },
            self.account,
        )
        self.assertEqual(vals["payment_status"], "offline")
        self.assertEqual(vals["payout_status"], "offline")
        self.assertEqual(vals["payment_method"], "bank_transfer_offline")
        self.assertEqual(vals["payment_kind"], "offline")
        self.assertFalse(vals["is_platform_payment"])
        self.assertTrue(vals["is_offline_payment"])

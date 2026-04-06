# -*- coding: utf-8 -*-

import base64

from odoo.tests.common import TransactionCase, tagged

from odoo.addons.dorevia_helloasso_payment.models.helloasso_payment_import import (
    parse_payment_csv_content,
)


CSV_SAMPLE = """Référence commande;Référence paiement;Montant total;Date du paiement;Statut du paiement;Versé;Date du versement;Nom payeur;Prénom payeur;Email payeur;Campagne;Type de campagne;Montant du tarif;Montant des options;Don supplémentaire;Montant du code promo;Moyen de paiement
82810;53041;45,00;03/04/2026 18:23:13;Payé;Non;;Baron;David;doreviateam@gmail.com;BilletterieTestDoreviaGLZ;Billetterie;40,00;;5,00;;Carte bancaire
82782;53029;10,00;03/04/2026;Hors Ligne;Hors Ligne;;larue;marion;marion.larue@gmail.com;AdhésionTestDoreviaGLZ;Adhésion;10,00;;;;Virement bancaire
"""


@tagged("post_install", "-at_install", "dorevia_helloasso", "dorevia_helloasso_payment")
class TestHelloassoPaymentCsvImport(TransactionCase):
    def setUp(self):
        super().setUp()
        self.account = self.env["dorevia.helloasso.account"].create(
            {
                "name": "Compte csv test",
                "company_id": self.env.company.id,
                "environment": "sandbox",
            }
        )

    def test_parse_payment_csv_content(self):
        rows = parse_payment_csv_content(CSV_SAMPLE)
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["Référence paiement"], "53041")

    def test_csv_wizard_imports_platform_payment_only(self):
        wizard = self.env["dorevia.helloasso.payment.csv.wizard"].create(
            {
                "helloasso_account_id": self.account.id,
                "import_platform_only": True,
                "upload_filename": "test.csv",
                "upload_file": base64.b64encode(CSV_SAMPLE.encode("utf-8")),
            }
        )
        action = wizard.action_import_csv()
        self.assertEqual(action["type"], "ir.actions.client")
        payments = self.env["dorevia.helloasso.payment"].search(
            [("helloasso_account_id", "=", self.account.id)]
        )
        self.assertEqual(len(payments), 1)
        self.assertEqual(payments.helloasso_payment_ref, "53041")

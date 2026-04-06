# -*- coding: utf-8 -*-

from unittest.mock import patch

from odoo.tests.common import TransactionCase, tagged

from odoo.addons.dorevia_helloasso_billetterie.models.helloasso_billetterie_form import (
    run_billetterie_forms_inventory,
)


@tagged("post_install", "-at_install", "dorevia_helloasso")
class TestHelloassoBilletterieFormInventory(TransactionCase):
    """Inventaire formulaires depuis API mockée."""

    def _ticketing_account(self, slug="org-lab"):
        return self.env["dorevia.helloasso.account"].sudo().create(
            {
                "name": "Lab billetterie",
                "company_id": self.env.company.id,
                "environment": "sandbox",
                "organization_slug": slug,
                "client_id": "cid",
                "client_secret": "csec",
                "use_for_ticketing": True,
            }
        )

    @patch(
        "odoo.addons.dorevia_helloasso_billetterie.models.helloasso_billetterie_form.fetch_all_organization_forms",
        return_value=(
            [
                {
                    "formSlug": "evt-lab",
                    "formType": "Event",
                    "title": "Soirée test",
                },
            ],
            1,
        ),
    )
    @patch(
        "odoo.addons.dorevia_helloasso_billetterie.models.helloasso_billetterie_form.fetch_client_credentials_token",
        return_value={"access_token": "fake-token"},
    )
    def test_inventory_creates_and_updates(self, _mock_tok, _mock_forms):
        Form = self.env["dorevia.helloasso.billetterie.form"]
        acc = self._ticketing_account()
        stats = run_billetterie_forms_inventory(
            self.env,
            "org-lab",
            "cid",
            "csec",
            True,
            helloasso_account=acc,
        )
        self.assertEqual(stats["created"], 1)
        self.assertEqual(stats["updated"], 0)
        ev = Form.search(
            [
                ("helloasso_account_id", "=", acc.id),
                ("organization_slug", "=", "org-lab"),
                ("form_slug", "=", "evt-lab"),
                ("use_sandbox", "=", True),
            ]
        )
        self.assertEqual(len(ev), 1)
        self.assertEqual(ev.form_type, "Event")
        self.assertIn("Soirée", ev.name)

        stats2 = run_billetterie_forms_inventory(
            self.env,
            "org-lab",
            "cid",
            "csec",
            True,
            helloasso_account=acc,
        )
        self.assertEqual(stats2["created"], 0)
        self.assertEqual(stats2["updated"], 1)

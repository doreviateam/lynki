# -*- coding: utf-8 -*-
"""Tests automatisés de la synchro MVP (scénarios proches de RECETTE_MVP_HELLOASSO.md)."""

from unittest.mock import patch

from odoo.tests.common import TransactionCase, tagged

from odoo.addons.dorevia_helloasso_adherent.models.helloasso_sync import (
    _payment_trace_vals,
    payment_eligible_mvp,
    run_membership_payments_sync,
)


def _payment_mvp(
    pid=53022,
    email="recette_nominal@test.dorevia.local",
    order_id=82771,
    amount_cents=1000,
):
    """Paiement sandbox-type : Membership + Registered + items Membership (filtre MVP)."""
    return {
        "id": pid,
        "state": "Registered",
        "amount": amount_cents,
        "date": "2026-04-03T12:00:00+00:00",
        "payer": {
            "email": email,
            "firstName": "Jean",
            "lastName": "Recette",
        },
        "order": {
            "id": order_id,
            "formType": "Membership",
        },
        "items": [{"type": "Membership"}],
    }


MEMBERSHIP_FORM = {"formSlug": "adhesiontest", "formType": "Membership", "title": "Test"}


@tagged("post_install", "-at_install", "dorevia_helloasso")
class TestHelloassoSyncMvp(TransactionCase):
    """Synchro mockée : pas d’appel réseau HelloAsso."""

    def _patch_sync(self, payments_list):
        token_p = patch(
            "odoo.addons.dorevia_helloasso_adherent.models.helloasso_sync.fetch_client_credentials_token",
            return_value={"access_token": "fake-token"},
        )
        resolve_p = patch(
            "odoo.addons.dorevia_helloasso_adherent.models.helloasso_sync.resolve_membership_form",
            return_value=dict(MEMBERSHIP_FORM),
        )
        fetch_p = patch(
            "odoo.addons.dorevia_helloasso_adherent.models.helloasso_sync.fetch_form_payments_page",
            return_value=(payments_list, len(payments_list), {}),
        )
        token_p.start()
        self.addCleanup(token_p.stop)
        resolve_p.start()
        self.addCleanup(resolve_p.stop)
        fetch_p.start()
        self.addCleanup(fetch_p.stop)

    def test_payment_eligible_mvp_accepts_membership_registered(self):
        p = _payment_mvp()
        self.assertTrue(payment_eligible_mvp(p))

    def test_payment_trace_vals_converts_cents_to_euros(self):
        vals = _payment_trace_vals(_payment_mvp(amount_cents=1000), "adhesiontest", "Membership")
        self.assertEqual(vals.get("helloasso_payment_amount"), 10.0)
        self.assertEqual(vals.get("helloasso_external_id"), "53022")

    def test_scenario_1_nominal_creates_partner(self):
        pay = _payment_mvp(email="s1_create_only@test.dorevia.local")
        self._patch_sync([pay])
        Partner = self.env["res.partner"]
        self.assertFalse(Partner.search([("email", "=ilike", pay["payer"]["email"])]))

        stats = run_membership_payments_sync(
            self.env,
            "org-test",
            "cid",
            "csecret",
            True,
        )
        self.assertEqual(stats["created"], 1)
        self.assertEqual(stats["updated"], 0)
        self.assertGreaterEqual(stats["processed"], 1)

        partner = Partner.search([("email", "=ilike", pay["payer"]["email"])])
        self.assertEqual(len(partner), 1)
        self.assertEqual(partner.helloasso_external_id, "53022")
        self.assertEqual(partner.helloasso_order_id, "82771")
        self.assertEqual(partner.helloasso_source_form, "adhesiontest")
        self.assertEqual(partner.helloasso_sync_status, "synced")
        self.assertEqual(partner.helloasso_payment_amount, 10.0)

    def test_scenario_2_replay_updates_without_duplicate(self):
        email = "s2_replay@test.dorevia.local"
        pay = _payment_mvp(email=email)
        self._patch_sync([pay])

        stats1 = run_membership_payments_sync(self.env, "org", "c", "s", True)
        self.assertEqual(stats1["created"], 1)
        Partner = self.env["res.partner"]
        p1 = Partner.search([("email", "=ilike", email)])
        pid = p1.id

        stats2 = run_membership_payments_sync(self.env, "org", "c", "s", True)
        self.assertEqual(stats2["created"], 0)
        self.assertEqual(stats2["updated"], 1)
        p2 = Partner.search([("email", "=ilike", email)])
        self.assertEqual(len(p2), 1)
        self.assertEqual(p2.id, pid)

    def test_scenario_3_email_match_updates_existing_without_create(self):
        email = "s3_existing@test.dorevia.local"
        Partner = self.env["res.partner"]
        existing = Partner.create(
            {
                "name": "Contact pré-existant",
                "email": email,
            }
        )
        self.assertFalse(existing.helloasso_external_id)

        pay = _payment_mvp(email=email)
        self._patch_sync([pay])

        stats = run_membership_payments_sync(self.env, "org", "c", "s", True)
        self.assertEqual(stats["created"], 0)
        self.assertEqual(stats["updated"], 1)

        existing.invalidate_recordset()
        self.assertEqual(existing.helloasso_external_id, "53022")
        self.assertEqual(existing.helloasso_payment_amount, 10.0)

    def test_scenario_4_duplicate_email_skips_without_write(self):
        email = "s4_dup@test.dorevia.local"
        Partner = self.env["res.partner"]
        Partner.create({"name": "A", "email": email})
        Partner.create({"name": "B", "email": email})

        pay = _payment_mvp(email=email)
        self._patch_sync([pay])

        stats = run_membership_payments_sync(self.env, "org", "c", "s", True)
        self.assertEqual(stats["created"], 0)
        self.assertEqual(stats["updated"], 0)
        self.assertGreaterEqual(stats["skipped"], 1)

        partners = Partner.search([("email", "=ilike", email)])
        self.assertEqual(len(partners), 2)
        for p in partners:
            self.assertFalse(p.helloasso_external_id)

    def test_cron_skips_when_credentials_missing(self):
        icp = self.env["ir.config_parameter"].sudo()
        icp.set_param("dorevia_helloasso.client_id", "")
        icp.set_param("dorevia_helloasso.client_secret", "")
        icp.set_param("dorevia_helloasso.organization_slug", "")
        self.env["dorevia.helloasso.cron"].cron_sync_membership_adherents()

    @patch(
        "odoo.addons.dorevia_helloasso_adherent.models.helloasso_cron.run_membership_payments_sync"
    )
    def test_cron_calls_sync_when_configured(self, mock_run):
        mock_run.return_value = {
            "processed": 0,
            "created": 0,
            "updated": 0,
            "skipped": 0,
            "errors": [],
        }
        icp = self.env["ir.config_parameter"].sudo()
        icp.set_param("dorevia_helloasso.client_id", "cid")
        icp.set_param("dorevia_helloasso.client_secret", "sec")
        icp.set_param("dorevia_helloasso.organization_slug", "org-slug")
        icp.set_param("dorevia_helloasso.use_sandbox", "True")
        self.env["dorevia.helloasso.cron"].cron_sync_membership_adherents()
        mock_run.assert_called_once()
        args = mock_run.call_args.args
        self.assertEqual(args[1], "org-slug")
        self.assertEqual(args[2], "cid")
        self.assertEqual(args[3], "sec")
        self.assertTrue(args[4])

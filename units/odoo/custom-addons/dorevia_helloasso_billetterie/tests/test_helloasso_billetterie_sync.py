# -*- coding: utf-8 -*-

from unittest.mock import patch

from odoo.tests.common import TransactionCase, tagged

from odoo.addons.dorevia_helloasso_billetterie.models.helloasso_billetterie_sync import (
    _order_amount_euros,
    _order_payer,
    _order_state_raw_for_storage,
    order_eligible_mvp,
    run_billetterie_orders_sync,
)


def _order_mvp(
    oid=9001,
    email="acheteur_billet@test.dorevia.local",
    state="Authorized",
    amount_cents=2500,
):
    return {
        "id": oid,
        "state": state,
        "amount": amount_cents,
        "date": "2026-04-04T18:00:00+02:00",
        "payer": {
            "email": email,
            "firstName": "Alice",
            "lastName": "Acheteuse",
        },
        "items": [
            {
                "id": 501,
                "type": "Ticket",
                "name": "Place standard",
                "user": {
                    "email": "invite@test.dorevia.local",
                    "firstName": "Bob",
                    "lastName": "Invité",
                },
            }
        ],
    }


EVENT_FORM = {"formSlug": "soiree-test", "formType": "Event", "title": "Soirée test"}


@tagged("post_install", "-at_install", "dorevia_helloasso")
class TestHelloassoBilletterieSyncMvp(TransactionCase):
    """Synchro billetterie mockée."""

    def _patch_sync(self, orders_list):
        token_p = patch(
            "odoo.addons.dorevia_helloasso_billetterie.models.helloasso_billetterie_sync.fetch_client_credentials_token",
            return_value={"access_token": "fake-token"},
        )
        resolve_p = patch(
            "odoo.addons.dorevia_helloasso_billetterie.models.helloasso_billetterie_sync.resolve_billetterie_form",
            return_value=dict(EVENT_FORM),
        )
        fetch_p = patch(
            "odoo.addons.dorevia_helloasso_billetterie.models.helloasso_billetterie_sync.fetch_form_orders_page",
            return_value=(orders_list, len(orders_list), {}),
        )
        token_p.start()
        self.addCleanup(token_p.stop)
        resolve_p.start()
        self.addCleanup(resolve_p.stop)
        fetch_p.start()
        self.addCleanup(fetch_p.stop)

    def test_order_eligible_mvp_rejects_refused(self):
        o = _order_mvp(state="Refused")
        self.assertFalse(order_eligible_mvp(o))
        self.assertTrue(order_eligible_mvp(_order_mvp(state="Authorized")))

    def test_order_eligible_mvp_rejects_refused_on_nested_payment(self):
        o = {
            "id": 1,
            "state": "",
            "payments": [{"state": "Refused", "id": 1}],
        }
        self.assertFalse(order_eligible_mvp(o))

    def test_order_state_raw_from_payment_when_root_missing(self):
        o = {
            "id": 82810,
            "payments": [{"id": 53041, "state": "Authorized"}],
        }
        self.assertEqual(_order_state_raw_for_storage(o), "Authorized")

    def test_order_state_raw_from_item_when_no_payment_state(self):
        o = {
            "id": 1,
            "items": [{"id": 10, "state": "Processed", "type": "Registration"}],
        }
        self.assertEqual(_order_state_raw_for_storage(o), "Processed")

    def test_order_amount_euros_from_amount_object_total(self):
        o = {"amount": {"total": 4500, "vat": 0, "discount": 0}}
        self.assertEqual(_order_amount_euros(o), 45.0)

    def test_order_amount_euros_sums_items_when_no_scalar_amount(self):
        o = {"items": [{"amount": 2000}, {"amount": 500}]}
        self.assertEqual(_order_amount_euros(o), 25.0)

    def test_order_payer_flat_email_fallback(self):
        order = {
            "id": 1,
            "state": "Authorized",
            "payerEmail": "plat@example.org",
            "firstName": "Jean",
            "lastName": "Dupont",
        }
        em, fn, ln = _order_payer(order)
        self.assertEqual(em, "plat@example.org")
        self.assertEqual(fn, "Jean")
        self.assertEqual(ln, "Dupont")

    def test_nominal_creates_order_and_lines(self):
        order = _order_mvp(email="bil_nominal@test.dorevia.local")
        self._patch_sync([order])
        stats = run_billetterie_orders_sync(
            self.env,
            "org-test",
            "cid",
            "csecret",
            True,
            "Event",
            None,
        )
        self.assertGreaterEqual(stats["created"], 1)
        Order = self.env["dorevia.helloasso.billetterie.order"]
        rec = Order.search([("helloasso_order_id", "=", "9001")])
        self.assertEqual(len(rec), 1)
        self.assertEqual(rec.amount_total, 25.0)
        self.assertEqual(len(rec.line_ids), 1)
        self.assertEqual(rec.line_ids.participant_email, "invite@test.dorevia.local")
        self.assertTrue(rec.date_order, "date commande API ISO +fuseau doit être stockée")

    def test_catalog_form_id_set_when_passed(self):
        order = _order_mvp(oid=9201, email="bil_catalog@test.dorevia.local")
        self._patch_sync([order])
        Form = self.env["dorevia.helloasso.billetterie.form"]
        cat = Form.create(
            {
                "use_sandbox": True,
                "organization_slug": "org-test",
                "form_type": "Event",
                "form_slug": "soiree-test",
                "helloasso_title": "Soirée test",
            }
        )
        stats = run_billetterie_orders_sync(
            self.env,
            "org-test",
            "cid",
            "csecret",
            True,
            "Event",
            None,
            catalog_form_id=cat.id,
        )
        self.assertGreaterEqual(stats["created"], 1)
        Order = self.env["dorevia.helloasso.billetterie.order"]
        rec = Order.search([("helloasso_order_id", "=", "9201")])
        self.assertEqual(len(rec), 1)
        self.assertEqual(rec.catalog_form_id, cat)

    def test_replay_updates_without_duplicate_order(self):
        email = "bil_replay@test.dorevia.local"
        order = _order_mvp(oid=9101, email=email)
        self._patch_sync([order])
        stats1 = run_billetterie_orders_sync(
            self.env, "org", "c", "s", True, "Event", None
        )
        self.assertGreaterEqual(stats1["created"], 1)
        Order = self.env["dorevia.helloasso.billetterie.order"]
        r1 = Order.search([("helloasso_order_id", "=", "9101")])
        self.assertEqual(len(r1), 1)
        rid = r1.id

        stats2 = run_billetterie_orders_sync(
            self.env, "org", "c", "s", True, "Event", None
        )
        self.assertGreaterEqual(stats2["updated"], 1)
        r2 = Order.search([("helloasso_order_id", "=", "9101")])
        self.assertEqual(len(r2), 1)
        self.assertEqual(r2.id, rid)

    def test_shared_email_picks_oldest_partner(self):
        """Plusieurs contacts avec le même e-mail : la synchro ne doit plus ignorer la commande."""
        email = "dup_payer@test.dorevia.local"
        Partner = self.env["res.partner"].sudo()
        p1 = Partner.create({"name": "Premier doublon", "email": email})
        Partner.create({"name": "Second doublon", "email": email})
        order = _order_mvp(oid=9301, email=email)
        self._patch_sync([order])
        stats = run_billetterie_orders_sync(
            self.env, "org-dup", "c", "s", True, "Event", None
        )
        self.assertEqual(stats["shared_email_partner_picked"], 1)
        self.assertEqual(stats["skip_ambiguous_partner"], 0)
        self.assertGreaterEqual(stats["created"], 1)
        rec = self.env["dorevia.helloasso.billetterie.order"].search(
            [("helloasso_order_id", "=", "9301")]
        )
        self.assertEqual(len(rec), 1)
        self.assertEqual(rec.payer_partner_id, p1)

    def test_cron_skips_when_credentials_missing(self):
        icp = self.env["ir.config_parameter"].sudo()
        icp.set_param("dorevia_helloasso.client_id", "")
        icp.set_param("dorevia_helloasso.client_secret", "")
        icp.set_param("dorevia_helloasso.organization_slug", "")
        self.env["dorevia.helloasso.billetterie.cron"].cron_sync_billetterie_orders()

    @patch(
        "odoo.addons.dorevia_helloasso_billetterie.models.helloasso_billetterie_cron.run_billetterie_orders_sync"
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
        icp.set_param("dorevia_helloasso_billetterie.form_type", "Event")
        self.env["dorevia.helloasso.billetterie.cron"].cron_sync_billetterie_orders()
        mock_run.assert_called_once()
        args = mock_run.call_args.args
        self.assertEqual(args[1], "org-slug")
        self.assertEqual(mock_run.call_args.kwargs.get("log_origin"), "cron")

# -*- coding: utf-8 -*-
"""Planificateur — synchro billetterie (par compte HelloAsso actif, repli société / ICP)."""

import logging

from odoo import api, models
from odoo.exceptions import UserError

from odoo.addons.dorevia_helloasso_members.models.helloasso_company_params import (
    get_helloasso_connection_params,
)

from .helloasso_billetterie_form import run_billetterie_forms_inventory
from .helloasso_billetterie_sync import run_billetterie_orders_sync

_logger = logging.getLogger(__name__)


class DoreviaHelloassoBilletterieCron(models.Model):
    _name = "dorevia.helloasso.billetterie.cron"
    _description = "HelloAsso billetterie — ancrage planificateur"

    @api.model
    def cron_sync_billetterie_orders(self):
        return self._cron_sync_billetterie_orders()

    def _billetterie_cron_run_for_params(self, env_c, log_label, p, helloasso_account=None):
        """Inventaire + import commandes pour un jeu de paramètres résolu."""
        client_id = p["client_id"]
        client_secret = p["client_secret"]
        org_slug = p["organization_slug"]
        use_sandbox = p["use_sandbox"]
        form_type_icp = (p["billetterie_form_type"] or "Event").strip()
        form_slug_icp = (p["billetterie_form_slug"] or "").strip()
        ha = helloasso_account or p.get("helloasso_account")

        try:
            inv_stats = run_billetterie_forms_inventory(
                env_c,
                org_slug,
                client_id,
                client_secret,
                use_sandbox,
                helloasso_account=ha,
            )
            _logger.info(
                "HelloAsso billetterie cron [%s] : inventaire — lues=%s créés=%s maj=%s erreurs=%s",
                log_label,
                inv_stats.get("total_api_items", 0),
                inv_stats.get("created", 0),
                inv_stats.get("updated", 0),
                len(inv_stats.get("errors") or []),
            )
        except UserError as err:
            _logger.warning(
                "HelloAsso billetterie cron [%s] : inventaire interrompu — %s",
                log_label,
                err,
            )

        Form = env_c["dorevia.helloasso.billetterie.form"].sudo()
        if ha:
            forms = Form.search([("helloasso_account_id", "=", ha.id)])
        else:
            forms = Form.search(
                [
                    ("organization_slug", "=", org_slug),
                    ("use_sandbox", "=", use_sandbox),
                    ("helloasso_account_id", "=", False),
                ]
            )
        if forms:
            for rec in forms:
                try:
                    stats = run_billetterie_orders_sync(
                        env_c,
                        org_slug,
                        client_id,
                        client_secret,
                        use_sandbox,
                        rec.form_type,
                        rec.form_slug,
                        catalog_form_id=rec.id,
                        log_origin="cron",
                        helloasso_account=rec.helloasso_account_id or ha,
                    )
                    _logger.info(
                        "HelloAsso billetterie cron [%s] : %s — traités=%s créés=%s maj=%s",
                        log_label,
                        rec.display_name,
                        stats["processed"],
                        stats["created"],
                        stats["updated"],
                    )
                except UserError as err:
                    _logger.warning(
                        "HelloAsso billetterie cron [%s] : formulaire %s ignoré — %s",
                        log_label,
                        rec.display_name,
                        err,
                    )
                except Exception:
                    _logger.exception(
                        "HelloAsso billetterie cron [%s] : erreur sur %s",
                        log_label,
                        rec.display_name,
                    )
            return

        stats = run_billetterie_orders_sync(
            env_c,
            org_slug,
            client_id,
            client_secret,
            use_sandbox,
            form_type_icp or "Event",
            form_slug_icp or None,
            log_origin="cron",
            helloasso_account=ha,
        )
        _logger.info(
            "HelloAsso billetterie cron [%s] : repli type/slug — traités=%s créés=%s maj=%s ignorés=%s",
            log_label,
            stats["processed"],
            stats["created"],
            stats["updated"],
            stats["skipped"],
        )

    @api.model
    def _cron_sync_billetterie_orders(self):
        Account = self.env["dorevia.helloasso.account"].sudo()
        accounts = Account.search(
            [("active", "=", True), ("use_for_ticketing", "=", True)],
            order="company_id, sequence, id",
        )
        any_run = False
        if accounts:
            for account in accounts:
                p = account._to_connection_params()
                if not (p["client_id"] and p["client_secret"] and p["organization_slug"]):
                    continue
                any_run = True
                env_c = self.env.with_company(account.company_id)
                label = "%s / %s" % (account.company_id.display_name, account.display_name)
                self._billetterie_cron_run_for_params(
                    env_c, label, p, helloasso_account=account
                )
        else:
            Company = self.env["res.company"].sudo()
            for company in Company.search([]):
                env_c = self.env.with_company(company)
                params = get_helloasso_connection_params(env_c, company)
                if not (
                    params["client_id"]
                    and params["client_secret"]
                    and params["organization_slug"]
                ):
                    continue
                any_run = True
                self._billetterie_cron_run_for_params(
                    env_c,
                    company.display_name + " (repli société)",
                    params,
                    helloasso_account=params.get("helloasso_account"),
                )
        if not any_run:
            _logger.info(
                "HelloAsso billetterie cron : aucun compte billetterie actif ni société avec identifiants complets."
            )

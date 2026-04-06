# -*- coding: utf-8 -*-
"""Point d’entrée ir.cron pour la synchro adhérents (mêmes paramètres que Paramètres → HelloAsso)."""

import logging

from odoo import api, models

from .helloasso_company_params import get_helloasso_connection_params
from .helloasso_sync import run_membership_payments_sync

_logger = logging.getLogger(__name__)


class DoreviaHelloassoCron(models.Model):
    _name = "dorevia.helloasso.cron"
    _description = "HelloAsso — ancrage planificateur (synchro planifiée)"

    @api.model
    def cron_sync_membership_adherents(self):
        """Entrée ir.cron (`model.cron_sync_membership_adherents()`)."""
        return self._cron_sync_membership_adherents()

    @api.model
    def _cron_sync_membership_adherents(self):
        """Entrée actions serveur / recette (`model._cron_sync_membership_adherents()`)."""
        Account = self.env["dorevia.helloasso.account"].sudo()
        accounts = Account.search(
            [("active", "=", True), ("use_for_members", "=", True)],
            order="company_id, sequence, id",
        )
        any_run = False
        if accounts:
            for account in accounts:
                p = account._to_connection_params()
                if not (p["client_id"] and p["client_secret"] and p["organization_slug"]):
                    continue
                any_run = True
                company = account.company_id
                stats = run_membership_payments_sync(
                    self.env.with_company(company),
                    p["organization_slug"],
                    p["client_id"],
                    p["client_secret"],
                    p["use_sandbox"],
                    log_origin="cron",
                    helloasso_account=account,
                )
                _logger.info(
                    "HelloAsso cron [%s / %s] : terminé — traités=%s créés=%s maj=%s ignorés=%s",
                    company.display_name,
                    account.display_name,
                    stats["processed"],
                    stats["created"],
                    stats["updated"],
                    stats["skipped"],
                )
        else:
            Company = self.env["res.company"].sudo()
            for company in Company.search([]):
                params = get_helloasso_connection_params(
                    self.env.with_company(company), company
                )
                client_id = params["client_id"]
                client_secret = params["client_secret"]
                org_slug = params["organization_slug"]
                use_sandbox = params["use_sandbox"]
                if not (client_id and client_secret and org_slug):
                    continue
                any_run = True
                stats = run_membership_payments_sync(
                    self.env.with_company(company),
                    org_slug,
                    client_id,
                    client_secret,
                    use_sandbox,
                    log_origin="cron",
                    helloasso_account=params.get("helloasso_account"),
                )
                _logger.info(
                    "HelloAsso cron [%s] (repli société) : terminé — traités=%s créés=%s maj=%s ignorés=%s",
                    company.display_name,
                    stats["processed"],
                    stats["created"],
                    stats["updated"],
                    stats["skipped"],
                )
        if not any_run:
            _logger.info(
                "HelloAsso cron : aucun compte HelloAsso adhésion actif ni société avec identifiants complets."
            )

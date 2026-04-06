# -*- coding: utf-8 -*-
"""Planificateur — synchro API des paiements HelloAsso (MVP)."""

import logging

from odoo import api, models

from odoo.addons.dorevia_helloasso_connector.models.helloasso_client import (
    HelloAssoClientError,
)

from .helloasso_payment_import import import_api_payments_for_account

_logger = logging.getLogger(__name__)


class DoreviaHelloassoPaymentCron(models.Model):
    _name = "dorevia.helloasso.payment.cron"
    _description = "HelloAsso payment — ancrage planificateur"

    @api.model
    def cron_sync_api_payments(self):
        return self._cron_sync_api_payments()

    @api.model
    def _cron_sync_api_payments(self):
        Account = self.env["dorevia.helloasso.account"].sudo()
        accounts = Account.search(
            [("active", "=", True), ("use_for_ticketing", "=", True)],
            order="company_id, sequence, id",
        )
        any_run = False
        if not accounts:
            _logger.info(
                "HelloAsso payment cron : aucun compte HelloAsso billetterie actif."
            )
            return True

        for account in accounts:
            params = account._to_connection_params()
            client_id = params.get("client_id")
            client_secret = params.get("client_secret")
            organization_slug = params.get("organization_slug")
            form_type = (params.get("billetterie_form_type") or "Event").strip() or "Event"
            form_slug = (params.get("billetterie_form_slug") or "").strip()
            if not (client_id and client_secret and organization_slug and form_slug):
                _logger.info(
                    "HelloAsso payment cron [%s / %s] : compte ignoré (identifiants, organisation ou formSlug manquant).",
                    account.company_id.display_name,
                    account.display_name,
                )
                continue

            any_run = True
            env_c = self.env.with_company(account.company_id)
            try:
                stats = import_api_payments_for_account(
                    env_c,
                    account,
                    form_type,
                    form_slug,
                    import_platform_only=True,
                    page_size=50,
                    max_pages=20,
                )
                _logger.info(
                    "HelloAsso payment cron [%s / %s] : pages=%s traites=%s crees=%s maj=%s ignores=%s hors_ligne=%s erreurs=%s",
                    account.company_id.display_name,
                    account.display_name,
                    stats.get("pages", 0),
                    stats.get("processed", 0),
                    stats.get("created", 0),
                    stats.get("updated", 0),
                    stats.get("skipped", 0),
                    stats.get("skip_offline", 0),
                    len(stats.get("errors") or []),
                )
            except HelloAssoClientError as err:
                _logger.warning(
                    "HelloAsso payment cron [%s / %s] : erreur HelloAsso — %s",
                    account.company_id.display_name,
                    account.display_name,
                    err,
                )
            except Exception:
                _logger.exception(
                    "HelloAsso payment cron [%s / %s] : erreur inattendue",
                    account.company_id.display_name,
                    account.display_name,
                )

        if not any_run:
            _logger.info(
                "HelloAsso payment cron : aucun compte avec configuration suffisante pour synchroniser les paiements."
            )
        return True

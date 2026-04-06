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
    def _iter_payment_import_targets(self, account):
        """Retourne les couples (form_type, form_slug, source_label) à traiter."""
        Form = self.env["dorevia.helloasso.billetterie.form"].sudo()
        forms = Form.search(
            [("helloasso_account_id", "=", account.id)],
            order="form_type, form_slug, id",
        )
        targets = []
        seen = set()
        for form in forms:
            form_type = (form.form_type or "Event").strip() or "Event"
            form_slug = (form.form_slug or "").strip()
            if not form_slug:
                continue
            key = (form_type, form_slug)
            if key in seen:
                continue
            seen.add(key)
            targets.append((form_type, form_slug, "inventory"))

        if targets:
            return targets

        params = account._to_connection_params()
        fallback_type = (params.get("billetterie_form_type") or "Event").strip() or "Event"
        fallback_slug = (params.get("billetterie_form_slug") or "").strip()
        if fallback_slug:
            return [(fallback_type, fallback_slug, "fallback")]
        return []

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
            targets = self._iter_payment_import_targets(account)
            if not (client_id and client_secret and organization_slug and targets):
                _logger.info(
                    "HelloAsso payment cron [%s / %s] : compte ignoré (identifiants, organisation ou formulaires manquants).",
                    account.company_id.display_name,
                    account.display_name,
                )
                continue

            any_run = True
            env_c = self.env.with_company(account.company_id)
            aggregate = {
                "pages": 0,
                "processed": 0,
                "created": 0,
                "updated": 0,
                "skipped": 0,
                "skip_offline": 0,
                "errors": 0,
            }
            for form_type, form_slug, source_label in targets:
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
                    aggregate["pages"] += stats.get("pages", 0)
                    aggregate["processed"] += stats.get("processed", 0)
                    aggregate["created"] += stats.get("created", 0)
                    aggregate["updated"] += stats.get("updated", 0)
                    aggregate["skipped"] += stats.get("skipped", 0)
                    aggregate["skip_offline"] += stats.get("skip_offline", 0)
                    aggregate["errors"] += len(stats.get("errors") or [])
                    _logger.info(
                        "HelloAsso payment cron [%s / %s / %s:%s / %s] : pages=%s traites=%s crees=%s maj=%s ignores=%s hors_ligne=%s erreurs=%s",
                        account.company_id.display_name,
                        account.display_name,
                        form_type,
                        form_slug,
                        source_label,
                        stats.get("pages", 0),
                        stats.get("processed", 0),
                        stats.get("created", 0),
                        stats.get("updated", 0),
                        stats.get("skipped", 0),
                        stats.get("skip_offline", 0),
                        len(stats.get("errors") or []),
                    )
                except HelloAssoClientError as err:
                    aggregate["errors"] += 1
                    _logger.warning(
                        "HelloAsso payment cron [%s / %s / %s:%s] : erreur HelloAsso — %s",
                        account.company_id.display_name,
                        account.display_name,
                        form_type,
                        form_slug,
                        err,
                    )
                except Exception:
                    aggregate["errors"] += 1
                    _logger.exception(
                        "HelloAsso payment cron [%s / %s / %s:%s] : erreur inattendue",
                        account.company_id.display_name,
                        account.display_name,
                        form_type,
                        form_slug,
                    )

            _logger.info(
                "HelloAsso payment cron [%s / %s] : formulaires=%s pages=%s traites=%s crees=%s maj=%s ignores=%s hors_ligne=%s erreurs=%s",
                account.company_id.display_name,
                account.display_name,
                len(targets),
                aggregate["pages"],
                aggregate["processed"],
                aggregate["created"],
                aggregate["updated"],
                aggregate["skipped"],
                aggregate["skip_offline"],
                aggregate["errors"],
            )

        if not any_run:
            _logger.info(
                "HelloAsso payment cron : aucun compte avec configuration suffisante pour synchroniser les paiements."
            )
        return True

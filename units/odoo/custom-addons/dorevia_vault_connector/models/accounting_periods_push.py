# -*- coding: utf-8 -*-
"""
Push des périodes comptables vers Vault (Sprint 13 T72).
Cron quotidien : lit la configuration exercice et les dates de clôture Odoo (period_lock_date,
fiscalyear_lock_date) au niveau société, puis POST /api/accounting/periods/sync.

company_id est transmis en TEXT au format "odoo:<id>" pour rester homogène avec le modèle Vault.
"""

import logging
import os
from datetime import date

import requests

from odoo import api, models

_logger = logging.getLogger(__name__)


class DoreviaAccountingPeriodsPush(models.Model):
    _name = "dorevia.accounting.periods.push"
    _description = "Push périodes comptables vers Vault"

    @api.model
    def _get_vault_config(self):
        icp = self.env["ir.config_parameter"].sudo()
        vault_url = (
            icp.get_param("dorevia.vault.url", "") or os.environ.get("ODOO_VAULT_URL", "")
        ).rstrip("/")
        token = (
            icp.get_param("dorevia.vault.token", "")
            or icp.get_param("dorevia.stock_valuation.token", "")
            or os.environ.get("ODOO_VAULT_TOKEN", "")
            or os.environ.get("STOCK_VALUATION_INTERNAL_TOKEN", "")
        )
        tenant = (
            icp.get_param("dorevia.tenant", "")
            or os.environ.get("ODOO_TENANT", "")
            or os.environ.get("ODOO_DVIG_TENANT", "")
        )
        return {
            "vault_url": vault_url,
            "token": token,
            "tenant": tenant or "default",
        }

    @api.model
    def _compute_fiscal_year_bounds(self, company, ref_date=None):
        """Calcule les bornes d'exercice fiscal pour une société à une date de référence."""
        if ref_date is None:
            ref_date = date.today()
        last_month = int(company.fiscalyear_last_month)
        last_day = int(company.fiscalyear_last_day)
        fy_end_year = ref_date.year
        fy_end_candidate = date(fy_end_year, last_month, min(last_day, 28))
        try:
            fy_end_candidate = date(fy_end_year, last_month, last_day)
        except ValueError:
            pass

        if ref_date > fy_end_candidate:
            fy_end_year += 1
            try:
                fy_end_candidate = date(fy_end_year, last_month, last_day)
            except ValueError:
                fy_end_candidate = date(fy_end_year, last_month, min(last_day, 28))

        fy_end = fy_end_candidate

        if last_month == 12:
            fy_start = date(fy_end.year, 1, 1)
        else:
            fy_start = date(fy_end.year - 1, last_month + 1, 1)

        return fy_start, fy_end

    @api.model
    def _determine_period_status(self, company, year, month):
        """
        Détermine le statut d'une période (mois) selon les dates de verrouillage Odoo.
        - locked   : mois entièrement avant fiscalyear_lock_date
        - closed   : mois entièrement avant period_lock_date
        - open     : sinon
        """
        last_day_of_month = date(year, month + 1, 1) if month < 12 else date(year + 1, 1, 1)
        from datetime import timedelta
        period_end = last_day_of_month - timedelta(days=1)

        fy_lock = company.fiscalyear_lock_date
        period_lock = company.period_lock_date

        if fy_lock and period_end <= fy_lock:
            return "locked", fy_lock
        if period_lock and period_end <= period_lock:
            return "closed", period_lock
        return "open", None

    @api.model
    def _build_periods_payload(self, company, tenant):
        """Construit le payload des 12 mois de l'exercice courant pour une société."""
        today = date.today()
        fy_start, fy_end = self._compute_fiscal_year_bounds(company, today)
        company_id_str = "odoo:%s" % company.id

        periods = []
        current = fy_start
        while current <= fy_end:
            month = current.month
            year = current.year
            status, closed_at = self._determine_period_status(company, year, month)

            entry = {
                "company_id": company_id_str,
                "fiscal_year_start": fy_start.strftime("%Y-%m-%d"),
                "fiscal_year_end": fy_end.strftime("%Y-%m-%d"),
                "period_month": month,
                "period_year": year,
                "status": status,
            }
            if closed_at:
                entry["closed_at"] = closed_at.strftime("%Y-%m-%dT00:00:00Z")

            periods.append(entry)

            if month == 12:
                current = date(year + 1, 1, 1)
            else:
                current = date(year, month + 1, 1)

        return periods

    @api.model
    def cron_push_accounting_periods(self):
        """
        Cron quotidien : synchronise les périodes comptables de toutes les sociétés vers Vault.
        Un seul POST /api/accounting/periods/sync avec toutes les périodes.
        """
        config = self._get_vault_config()
        vault_url = config["vault_url"]
        token = config["token"]
        tenant = config["tenant"]

        if not vault_url or not token:
            _logger.info("accounting_periods_push: skip (vault_url ou token manquant)")
            return

        companies = self.env["res.company"].sudo().search([])
        if not companies:
            _logger.debug("accounting_periods_push: aucune société à traiter")
            return

        all_periods = []
        for company in companies:
            try:
                periods = self._build_periods_payload(company, tenant)
                all_periods.extend(periods)
            except Exception as e:
                _logger.warning(
                    "accounting_periods_push: erreur build périodes company=%s: %s",
                    company.id, e, exc_info=True,
                )
                continue

        if not all_periods:
            _logger.debug("accounting_periods_push: aucune période à envoyer")
            return

        url = f"{vault_url}/api/accounting/periods/sync"
        payload = {"tenant": tenant, "periods": all_periods}

        try:
            resp = requests.post(
                url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                timeout=30,
            )
            if resp.ok:
                body = resp.json() if resp.text else {}
                _logger.info(
                    "accounting_periods_push: ok tenant=%s periods=%d upserted=%s",
                    tenant, len(all_periods), body.get("upserted", "?"),
                )
            else:
                _logger.warning(
                    "accounting_periods_push: vault resp status=%s body=%s",
                    resp.status_code, resp.text[:200] if resp.text else "",
                )
        except Exception as e:
            _logger.warning(
                "accounting_periods_push: erreur POST vault %s: %s", url, e, exc_info=True,
            )

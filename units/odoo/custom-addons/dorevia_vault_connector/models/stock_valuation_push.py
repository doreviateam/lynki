# -*- coding: utf-8 -*-
"""
Push quotidien de la valorisation stock vers Vault (ZeDocs/web52 — Option B).
Cron J-1 : as_of_date = veille ; calcul Odoo (stock.valuation.layer) puis POST /internal/stock-valuation-snapshot.
Doctrine : valeur 0 = snapshot valide ; en échec technique on n'écrit pas de snapshot (log uniquement).
"""

import logging
import os
from datetime import date, timedelta

import requests

from odoo import api, models

_logger = logging.getLogger(__name__)

SOURCE_CANONICAL = "odoo.inventory.valuation"


class DoreviaStockValuationPush(models.Model):
    _name = "dorevia.stock.valuation.push"
    _description = "Push valorisation stock vers Vault (snapshot J-1)"

    @api.model
    def get_stock_valuation_config(self):
        """
        Config pour le push Vault (url, token, tenant, company_ids).
        Paramètres Odoo : dorevia.vault.url, dorevia.stock_valuation.token, dorevia.tenant,
        dorevia.stock_valuation.company_ids (optionnel, ex. "1" ou "1,2" → odoo:1, odoo:2).
        Fallback : variables d'environnement ODOO_VAULT_URL, STOCK_VALUATION_INTERNAL_TOKEN, ODOO_TENANT.
        """
        icp = self.env["ir.config_parameter"].sudo()
        vault_url = (
            icp.get_param("dorevia.vault.url", "") or os.environ.get("ODOO_VAULT_URL", "")
        ).rstrip("/")
        token = (
            icp.get_param("dorevia.stock_valuation.token", "")
            or os.environ.get("STOCK_VALUATION_INTERNAL_TOKEN", "")
        )
        tenant = (
            icp.get_param("dorevia.tenant", "")
            or os.environ.get("ODOO_TENANT", "")
            or os.environ.get("ODOO_DVIG_TENANT", "")
        )
        company_ids_param = icp.get_param("dorevia.stock_valuation.company_ids", "").strip()
        if company_ids_param:
            try:
                company_ids = [int(x.strip()) for x in company_ids_param.split(",") if x.strip()]
            except ValueError:
                company_ids = []
        else:
            company_ids = []
        return {
            "vault_url": vault_url,
            "token": token,
            "tenant": tenant or "default",
            "company_ids": company_ids,
        }

    def _compute_stock_value_at_date(self, company, as_of_date):
        """
        Calcule la valeur totale du stock pour une société à une date donnée.
        Utilise stock.valuation.layer (module stock_account) : somme des value des layers
        de la société créés à ou avant as_of_date (fin de journée).
        Retourne float (0 si pas de stock) ou None en cas d'erreur / module absent.
        """
        if "stock.valuation.layer" not in self.env:
            _logger.debug(
                "stock_valuation_push: module stock_account non installé, skip calcul"
            )
            return None
        try:
            SVL = self.env["stock.valuation.layer"].sudo()
            # as_of_date = date ; on inclut toute la journée
            as_of_end = as_of_date.strftime("%Y-%m-%d") + " 23:59:59"
            # company via stock_move_id (standard Odoo stock_account)
            domain = [
                ("stock_move_id.company_id", "=", company.id),
                ("create_date", "<=", as_of_end),
            ]
            layers = SVL.search(domain)
            total = sum(layers.mapped("value"))
            return float(total)
        except Exception as e:
            _logger.warning(
                "stock_valuation_push: erreur calcul valorisation company=%s as_of_date=%s: %s",
                company.id,
                as_of_date,
                e,
                exc_info=True,
            )
            return None

    def _push_snapshot(self, vault_url, token, tenant, company_id_str, as_of_date, value, currency):
        """Envoie un snapshot au Vault. Retourne True si 2xx, False sinon (log déjà fait)."""
        url = f"{vault_url}/internal/stock-valuation-snapshot"
        payload = {
            "tenant": tenant,
            "company_id": company_id_str,
            "as_of_date": as_of_date.strftime("%Y-%m-%d"),
            "value": value,
            "currency": currency or "EUR",
            "source": SOURCE_CANONICAL,
        }
        try:
            resp = requests.post(
                url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                timeout=15,
            )
            if resp.ok:
                _logger.info(
                    "stock_valuation_push: ok tenant=%s company_id=%s as_of_date=%s value=%s",
                    tenant,
                    company_id_str,
                    payload["as_of_date"],
                    value,
                )
                return True
            _logger.warning(
                "stock_valuation_push: vault resp status=%s body=%s",
                resp.status_code,
                resp.text[:200] if resp.text else "",
            )
            return False
        except Exception as e:
            _logger.warning(
                "stock_valuation_push: erreur POST vault %s: %s", url, e, exc_info=True
            )
            return False

    @api.model
    def cron_push_stock_valuation_snapshot(self):
        """
        Cron quotidien (ex. 02:00) : as_of_date = J-1.
        Pour chaque société configurée : calcul valorisation → POST Vault si valeur calculable.
        Si calcul impossible (module absent, erreur), aucun snapshot écrit (log seulement).
        """
        config = self.get_stock_valuation_config()
        vault_url = config["vault_url"]
        token = config["token"]
        tenant = config["tenant"]
        company_ids = config["company_ids"]

        if not vault_url or not token:
            _logger.info(
                "stock_valuation_push: skip (vault_url ou token manquant)"
            )
            return
        as_of_date = date.today() - timedelta(days=1)

        companies = self.env["res.company"].sudo()
        if company_ids:
            companies = companies.browse(company_ids).exists()
        else:
            companies = companies.search([])
        if not companies:
            _logger.debug("stock_valuation_push: aucune société à traiter")
            return

        for company in companies:
            value = self._compute_stock_value_at_date(company, as_of_date)
            if value is None:
                continue
            company_id_str = "odoo:%s" % company.id
            currency = (company.currency_id or self.env.company.currency_id).name or "EUR"
            self._push_snapshot(
                vault_url, token, tenant, company_id_str, as_of_date, value, currency
            )

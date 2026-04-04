# -*- coding: utf-8 -*-
"""Planificateur — synchro billetterie (mêmes identifiants API que l’adhérent)."""

import logging

from odoo import api, models

from .helloasso_billetterie_sync import run_billetterie_orders_sync

_logger = logging.getLogger(__name__)


class DoreviaHelloassoBilletterieCron(models.Model):
    _name = "dorevia.helloasso.billetterie.cron"
    _description = "HelloAsso billetterie — ancrage planificateur"

    @api.model
    def cron_sync_billetterie_orders(self):
        return self._cron_sync_billetterie_orders()

    @api.model
    def _cron_sync_billetterie_orders(self):
        icp = self.env["ir.config_parameter"].sudo()
        client_id = (icp.get_param("dorevia_helloasso.client_id") or "").strip()
        client_secret = (icp.get_param("dorevia_helloasso.client_secret") or "").strip()
        org_slug = (icp.get_param("dorevia_helloasso.organization_slug") or "").strip()
        use_sandbox = icp.get_param("dorevia_helloasso.use_sandbox") == "True"
        form_type = (icp.get_param("dorevia_helloasso_billetterie.form_type") or "Event").strip()
        form_slug = (icp.get_param("dorevia_helloasso_billetterie.form_slug") or "").strip()
        if not (client_id and client_secret and org_slug):
            _logger.info(
                "HelloAsso billetterie cron : synchro ignorée (identifiants ou slug manquants)."
            )
            return
        stats = run_billetterie_orders_sync(
            self.env,
            org_slug,
            client_id,
            client_secret,
            use_sandbox,
            form_type or "Event",
            form_slug or None,
        )
        _logger.info(
            "HelloAsso billetterie cron : terminé — traités=%s créés=%s maj=%s ignorés=%s",
            stats["processed"],
            stats["created"],
            stats["updated"],
            stats["skipped"],
        )

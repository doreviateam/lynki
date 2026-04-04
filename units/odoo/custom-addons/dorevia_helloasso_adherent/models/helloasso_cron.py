# -*- coding: utf-8 -*-
"""Point d’entrée ir.cron pour la synchro adhérents (mêmes paramètres que Paramètres → HelloAsso)."""

import logging

from odoo import api, models

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
        icp = self.env["ir.config_parameter"].sudo()
        client_id = (icp.get_param("dorevia_helloasso.client_id") or "").strip()
        client_secret = (icp.get_param("dorevia_helloasso.client_secret") or "").strip()
        org_slug = (icp.get_param("dorevia_helloasso.organization_slug") or "").strip()
        use_sandbox = icp.get_param("dorevia_helloasso.use_sandbox") == "True"
        if not (client_id and client_secret and org_slug):
            _logger.info(
                "HelloAsso cron : synchro ignorée (identifiants ou slug organisation manquants)."
            )
            return
        stats = run_membership_payments_sync(
            self.env,
            org_slug,
            client_id,
            client_secret,
            use_sandbox,
            log_origin="cron",
        )
        _logger.info(
            "HelloAsso cron : terminé — traités=%s créés=%s maj=%s ignorés=%s",
            stats["processed"],
            stats["created"],
            stats["updated"],
            stats["skipped"],
        )

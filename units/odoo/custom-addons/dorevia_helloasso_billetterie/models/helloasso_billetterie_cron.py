# -*- coding: utf-8 -*-
"""Planificateur — synchro billetterie (mêmes identifiants API que l’adhérent)."""

import logging

from odoo import api, models
from odoo.exceptions import UserError

from .helloasso_billetterie_form import run_billetterie_forms_inventory
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
        form_type_icp = (icp.get_param("dorevia_helloasso_billetterie.form_type") or "Event").strip()
        form_slug_icp = (icp.get_param("dorevia_helloasso_billetterie.form_slug") or "").strip()
        if not (client_id and client_secret and org_slug):
            _logger.info(
                "HelloAsso billetterie cron : synchro ignorée (identifiants ou slug manquants)."
            )
            return

        try:
            inv_stats = run_billetterie_forms_inventory(
                self.env, org_slug, client_id, client_secret, use_sandbox
            )
            _logger.info(
                "HelloAsso billetterie cron : inventaire — lues=%s créés=%s maj=%s erreurs=%s",
                inv_stats.get("total_api_items", 0),
                inv_stats.get("created", 0),
                inv_stats.get("updated", 0),
                len(inv_stats.get("errors") or []),
            )
        except UserError as err:
            _logger.warning(
                "HelloAsso billetterie cron : inventaire interrompu — %s", err
            )

        Form = self.env["dorevia.helloasso.billetterie.form"].sudo()
        forms = Form.search(
            [
                ("organization_slug", "=", org_slug),
                ("use_sandbox", "=", use_sandbox),
            ]
        )
        if forms:
            for rec in forms:
                try:
                    stats = run_billetterie_orders_sync(
                        self.env,
                        org_slug,
                        client_id,
                        client_secret,
                        use_sandbox,
                        rec.form_type,
                        rec.form_slug,
                        catalog_form_id=rec.id,
                        log_origin="cron",
                    )
                    _logger.info(
                        "HelloAsso billetterie cron : %s — traités=%s créés=%s maj=%s",
                        rec.display_name,
                        stats["processed"],
                        stats["created"],
                        stats["updated"],
                    )
                except UserError as err:
                    _logger.warning(
                        "HelloAsso billetterie cron : formulaire %s ignoré — %s",
                        rec.display_name,
                        err,
                    )
                except Exception:
                    _logger.exception(
                        "HelloAsso billetterie cron : erreur sur %s", rec.display_name
                    )
            return

        stats = run_billetterie_orders_sync(
            self.env,
            org_slug,
            client_id,
            client_secret,
            use_sandbox,
            form_type_icp or "Event",
            form_slug_icp or None,
            log_origin="cron",
        )
        _logger.info(
            "HelloAsso billetterie cron : repli ICP — traités=%s créés=%s maj=%s ignorés=%s",
            stats["processed"],
            stats["created"],
            stats["updated"],
            stats["skipped"],
        )

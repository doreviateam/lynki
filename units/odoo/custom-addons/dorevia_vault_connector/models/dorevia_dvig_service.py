# -*- coding: utf-8 -*-
"""
Modèle technique dorevia.dvig.service — orchestration DVIG.
Utilisé par queue_job pour le trigger_worker.
SPEC : Orchestration Temps Réel v1.1.1
"""

import logging
import requests

from odoo import models, api

_logger = logging.getLogger(__name__)


class DoreviaDvigService(models.Model):
    _name = 'dorevia.dvig.service'
    _description = 'Service DVIG Dorevia'

    def trigger_worker(self):
        """Déclenche le worker DVIG pour traiter l'outbox."""
        icp = self.env['ir.config_parameter'].sudo()
        dvig_url = icp.get_param('dorevia.dvig.url', '')
        dvig_token = icp.get_param('dorevia.dvig.token', '')
        if not dvig_url or not dvig_token:
            _logger.warning("dvig_trigger_skip: config manquante")
            return
        try:
            resp = requests.post(
                f"{dvig_url}/api/worker/trigger",
                headers={
                    'Authorization': f'Bearer {dvig_token}',
                    'Content-Type': 'application/json',
                },
                timeout=15,
            )
            resp.raise_for_status()
            _logger.info("dvig_trigger_ok status=%s", resp.status_code)
        except Exception as e:
            _logger.warning("dvig_trigger_error error=%s", e)

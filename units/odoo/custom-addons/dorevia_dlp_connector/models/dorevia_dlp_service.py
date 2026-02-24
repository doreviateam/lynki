# -*- coding: utf-8 -*-
"""
Service DLP — appel POST timesheet-validated.
Configuration : ir.config_parameter dorevia.dlp.service.url, dorevia.dlp.tenant.id
"""

import logging
from datetime import datetime

import requests

from odoo import models

_logger = logging.getLogger(__name__)


class DoreviaDlpService(models.Model):
    _name = 'dorevia.dlp.service'
    _description = 'Service DLP Dorevia'

    def _get_config(self):
        """Retourne (url, tenant_id) depuis ir.config_parameter."""
        icp = self.env['ir.config_parameter'].sudo()
        url = (icp.get_param('dorevia.dlp.service.url') or '').rstrip('/')
        tenant = icp.get_param('dorevia.dlp.tenant.id') or ''
        return url, tenant

    def notify_timesheet_validated(
        self,
        company_id_external,
        project_external_id,
        time_entry_external_id,
    ):
        """
        POST /api/v1/timesheet-validated vers le service DLP.
        Ne bloque pas : en cas d'erreur, log uniquement.
        Retourne True si succès (202), False sinon.
        """
        url_base, tenant_id = self._get_config()
        if not url_base or not tenant_id:
            _logger.debug("dlp_skip: dorevia.dlp.service.url ou tenant.id manquants")
            return False

        endpoint = f"{url_base}/api/v1/timesheet-validated"
        payload = {
            'tenant_id': tenant_id,
            'source_system': 'odoo',
            'company_id': company_id_external,
            'project_external_id': str(project_external_id),
            'time_entry_external_id': str(time_entry_external_id),
            'hit_at': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
        }

        try:
            resp = requests.post(
                endpoint,
                json=payload,
                headers={'Content-Type': 'application/json', 'Accept': 'application/json'},
                timeout=10,
            )
            if resp.status_code in (202, 200):
                _logger.info(
                    "dlp_timesheet_ok project=%s line=%s hits=%s",
                    project_external_id,
                    time_entry_external_id,
                    resp.json().get('hits_inserted', 0) if resp.content else 0,
                )
                return True
            _logger.warning(
                "dlp_timesheet_fail project=%s line=%s status=%s body=%s",
                project_external_id,
                time_entry_external_id,
                resp.status_code,
                resp.text[:200],
            )
            return False
        except requests.exceptions.Timeout:
            _logger.warning("dlp_timesheet_timeout project=%s line=%s", project_external_id, time_entry_external_id)
            return False
        except Exception as e:
            _logger.warning("dlp_timesheet_error project=%s line=%s error=%s", project_external_id, time_entry_external_id, e)
            return False

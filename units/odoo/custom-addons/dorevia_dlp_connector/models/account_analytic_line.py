# -*- coding: utf-8 -*-
"""
Extension account.analytic.line — envoi vers DLP à la création d'une ligne timesheet.
SPEC_DLP_v0.3 Phase 6.
Déclencheur : create sur une ligne avec project_id.
"""

import logging

from odoo import models

_logger = logging.getLogger(__name__)


class AccountAnalyticLine(models.Model):
    _inherit = 'account.analytic.line'

    def create(self, vals_list):
        lines = super().create(vals_list)
        for line in lines:
            if line.project_id and line.company_id:
                try:
                    # company_id au format odoo:X pour correspondre aux companies DLP
                    company_external = f"odoo:{line.company_id.id}"
                    self.env['dorevia.dlp.service'].notify_timesheet_validated(
                        company_id_external=company_external,
                        project_external_id=line.project_id.id,
                        time_entry_external_id=line.id,
                    )
                except Exception as e:
                    _logger.warning("dorevia_dlp_connector: create notify failed line=%s error=%s", line.id, e)
        return lines

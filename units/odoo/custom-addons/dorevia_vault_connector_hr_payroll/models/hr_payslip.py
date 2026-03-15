# -*- coding: utf-8 -*-
"""
Extension hr.payslip pour l'envoi des charges de personnel vers Dorevia DVIG.
SPEC DVIG Event Registry v1.0 §3.6 — événement payroll.charge.posted

Flow : action_validate (payslip confirmé) → DVIG /ingest (payroll.charge.posted)
                                           → DVIG worker → Vault POST /api/v1/payroll
                                           → documents (odoo_model = 'hr.payslip')
                                           → GET /ui/aggregations/payroll → Linky EBE complet

Module optionnel : n'installer que si hr_payroll est utilisé (évite l'erreur
"Model 'hr.payslip' does not exist in registry" sur les bases sans paie).
"""

import hashlib
import json
import logging
import requests
from datetime import datetime, timezone

from odoo import models, fields, api

_logger = logging.getLogger(__name__)


class HrPayslip(models.Model):
    _inherit = 'hr.payslip'

    # ── Champs de traçabilité DVIG ─────────────────────────────
    dorevia_vault_status = fields.Selection(
        [
            ('todo', 'À envoyer'),
            ('sent', 'Envoyé au Vault'),
            ('failed', 'Échec'),
        ],
        string='Statut Vault',
        copy=False,
        default=False,
    )
    dorevia_dvig_event_id = fields.Char(
        string='Référence DVIG',
        readonly=True,
        copy=False,
    )
    dorevia_vault_idempotency_key = fields.Char(
        string="Clé d'idempotence",
        readonly=True,
        copy=False,
    )
    dorevia_vault_last_error = fields.Text(
        string='Dernière erreur',
        copy=False,
    )

    # ── Config DVIG ────────────────────────────────────────────

    def _dvig_config(self):
        icp = self.env['ir.config_parameter'].sudo()
        import os
        return {
            'dvig_url': (icp.get_param('dorevia.dvig.url', '') or os.environ.get('ODOO_DVIG_URL', '')).rstrip('/'),
            'dvig_token': icp.get_param('dorevia.dvig.token', '') or os.environ.get('ODOO_DVIG_TOKEN', ''),
            'dvig_source': icp.get_param('dorevia.dvig.source', '') or os.environ.get('ODOO_DVIG_SOURCE', ''),
        }

    def _should_send_payroll(self):
        cfg = self._dvig_config()
        return bool(cfg.get('dvig_url') and cfg.get('dvig_token'))

    # ── Calcul idempotence ─────────────────────────────────────

    def _compute_payroll_idempotency_key(self):
        """SHA-256 déterministe : db + employee_id + date_from (bulletin de paie unique)."""
        canonical = json.dumps({
            'db': self.env.cr.dbname,
            'model': 'hr.payslip',
            'id': self.id,
            'employee_id': self.employee_id.id,
            'date_from': str(self.date_from),
            'date_to': str(self.date_to),
        }, sort_keys=True, ensure_ascii=True)
        return hashlib.sha256(canonical.encode()).hexdigest()

    # ── Extraction charges de personnel ───────────────────────

    def _get_payroll_amounts(self):
        """
        Extrait les montants depuis les lignes du bulletin.
        Cherche :
          - BASIC, GROSS, BRUT : salaire brut
          - NET : salaire net
          - EMPLOYER_COST, CHARGE_PATRONALE : charges patronales
        Fallback : amount_total si disponible (Odoo 17+).
        """
        gross = 0.0
        net = 0.0
        employer_cost = 0.0

        for line in self.line_ids:
            code = (line.code or '').upper()
            amount = float(line.total or 0)
            if code in ('BASIC', 'GROSS', 'BRUT', 'GROSS_SALARY'):
                if amount > gross:
                    gross = amount
            elif code in ('NET', 'NET_SALARY', 'SALAIRE_NET'):
                net = abs(amount)
            elif code in ('EMPLOYER_COST', 'CHARGE_PATRONALE', 'CHARGE_EMP', 'COTISATION_PATRONALE'):
                employer_cost += abs(amount)

        # Fallback Odoo 17+ : champ amount_total
        if gross == 0:
            gross = float(getattr(self, 'wage_type', None) and self.wage_type == 'monthly' and hasattr(self, 'contract_id') and self.contract_id and float(self.contract_id.wage or 0) or 0)

        # total_charges = coût employeur total = brut + charges patronales
        total_charges = gross + employer_cost if employer_cost > 0 else gross
        return {
            'total_charges': total_charges,
            'net_salary': net,
            'employer_cost': employer_cost,
        }

    # ── Build payload DVIG ─────────────────────────────────────

    def _build_payroll_dvig_payload(self, source):
        amounts = self._get_payroll_amounts()
        return {
            'source': source,
            'event_type': 'payroll.charge.posted',
            'idempotency_key': self.dorevia_vault_idempotency_key,
            'data': {
                'name': self.name or '',
                'employee_id': self.employee_id.id,
                'employee_name': self.employee_id.name or '',
                'total_charges': amounts['total_charges'],
                'net_salary': amounts['net_salary'],
                'employer_cost': amounts['employer_cost'],
                'currency': self.currency_id.name if hasattr(self, 'currency_id') and self.currency_id else 'EUR',
                'date_from': str(self.date_from),
                'date_to': str(self.date_to),
                'date': str(self.date_from),
                'company_id': self.company_id.id if self.company_id else 1,
                'erp_event_captured_at': datetime.now(timezone.utc).isoformat(),
            },
        }

    # ── Hook action_validate ───────────────────────────────────

    def action_validate(self):
        """Surcharge : envoi DVIG après validation du bulletin."""
        res = super().action_validate()
        self._send_payroll_to_dvig()
        return res

    def _send_payroll_to_dvig(self):
        """Envoie payroll.charge.posted vers DVIG pour chaque bulletin validé."""
        if not self._should_send_payroll():
            return

        cfg = self._dvig_config()
        dvig_url = cfg['dvig_url']
        dvig_token = cfg['dvig_token']
        dvig_source = cfg['dvig_source']

        for slip in self:
            if slip.state not in ('done', 'paid'):
                continue
            if slip.dorevia_vault_idempotency_key:
                # Déjà envoyé
                continue
            try:
                key = slip._compute_payroll_idempotency_key()
                slip.write({'dorevia_vault_idempotency_key': key, 'dorevia_vault_status': 'todo'})

                payload = slip._build_payroll_dvig_payload(dvig_source)
                resp = requests.post(
                    f"{dvig_url}/ingest",
                    json=payload,
                    headers={
                        'Authorization': f'Bearer {dvig_token}',
                        'Content-Type': 'application/json',
                    },
                    timeout=15,
                )
                resp.raise_for_status()
                resp_data = resp.json()

                slip.write({
                    'dorevia_vault_status': 'sent',
                    'dorevia_dvig_event_id': resp_data.get('event_id', ''),
                    'dorevia_vault_last_error': False,
                })
                _logger.info(
                    "payroll_dvig_sent slip=%s employee=%s total_charges=%.2f event_id=%s",
                    slip.name, slip.employee_id.name,
                    payload['data'].get('total_charges', 0),
                    resp_data.get('event_id', ''),
                )
            except Exception as e:
                _logger.warning("payroll_dvig_error slip=%s error=%s", slip.name, e)
                slip.write({
                    'dorevia_vault_status': 'failed',
                    'dorevia_vault_last_error': str(e)[:500],
                })

    # ── Action manuelle de re-envoi ────────────────────────────

    def action_resend_to_dvig(self):
        """Bouton de re-envoi manuel (depuis la fiche bulletin)."""
        for slip in self:
            slip.write({'dorevia_vault_idempotency_key': False, 'dorevia_vault_status': False})
        self._send_payroll_to_dvig()
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': 'Dorevia Vault',
                'message': 'Bulletins renvoyés au Vault.',
                'type': 'success',
            },
        }

# -*- coding: utf-8 -*-
"""
Modèle technique dorevia.dvig.service — orchestration DVIG.
Utilisé par queue_job pour le trigger_worker.
SPEC : Orchestration Temps Réel v1.1.1
Endpoint : POST /internal/outbox/process (auth DVIG_INTERNAL_TOKEN)
SPEC : Alimentation expected_count (Phase DVIG) — POST /internal/expected-counts
"""

import logging
from datetime import datetime, timezone, timedelta
from dateutil.relativedelta import relativedelta

import requests

from odoo import models, api

_logger = logging.getLogger(__name__)


class DoreviaDvigService(models.Model):
    _name = 'dorevia.dvig.service'
    _description = 'Service DVIG Dorevia'

    def _get_internal_request_params(self):
        """Retourne (base_url, token) pour les appels internes DVIG."""
        icp = self.env['ir.config_parameter'].sudo()
        internal_url = icp.get_param('dorevia.dvig.internal.url', '')
        if not internal_url:
            dvig_url = icp.get_param('dorevia.dvig.url', '').rstrip('/')
            if dvig_url:
                internal_url = f"{dvig_url}/internal/outbox/process"
        internal_token = icp.get_param('dorevia.dvig.internal.token', '') or icp.get_param('dorevia.dvig.token', '')
        return internal_url or '', internal_token or ''

    def retry_outbox_event(self, tenant, idempotency_key):
        """Réinitialise un événement failed_hard/failed_soft pour retraitement.
        Retourne True si OK, False si 404 (événement non trouvé)."""
        base_url, token = self._get_internal_request_params()
        if not base_url or not token:
            return False
        retry_url = base_url.replace('/internal/outbox/process', '/internal/outbox/retry')
        if retry_url == base_url:
            retry_url = base_url.rstrip('/').replace('/process', '') + '/retry'
        try:
            resp = requests.post(
                retry_url,
                json={"tenant": tenant, "idempotency_key": idempotency_key},
                headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
                timeout=10,
            )
            if resp.status_code == 404:
                return False
            resp.raise_for_status()
            _logger.info("dvig_retry_ok tenant=%s", tenant)
            return True
        except Exception as e:
            _logger.warning("dvig_retry_error tenant=%s error=%s", tenant, e)
            return False

    def trigger_worker(self, limit=50):
        """Déclenche le worker DVIG pour traiter l'outbox.

        Utilise dorevia.dvig.internal.url (ou dorevia.dvig.url + /internal/outbox/process)
        et dorevia.dvig.internal.token pour l'authentification.
        """
        internal_url, internal_token = self._get_internal_request_params()
        if not internal_url:
            _logger.warning("dvig_trigger_skip: dorevia.dvig.url et internal.url manquants")
            return
        if not internal_token:
            _logger.warning("dvig_trigger_skip: token manquant (internal ou dvig)")
            return
        try:
            resp = requests.post(
                internal_url,
                json={"limit": limit},
                headers={
                    'Authorization': f'Bearer {internal_token}',
                    'Content-Type': 'application/json',
                },
                timeout=15,
            )
            resp.raise_for_status()
            _logger.info("dvig_trigger_ok status=%s", resp.status_code)
        except Exception as e:
            _logger.warning("dvig_trigger_error error=%s", e)

    def _get_dvig_base_url(self):
        """Retourne l'URL de base DVIG (sans chemin)."""
        icp = self.env['ir.config_parameter'].sudo()
        url = icp.get_param('dorevia.dvig.url', '').rstrip('/')
        if not url:
            internal_url = icp.get_param('dorevia.dvig.internal.url', '')
            if internal_url:
                url = internal_url.split('/internal')[0].rstrip('/')
        return url

    def _count_expected_sales(self, company_id, date_from, date_to):
        """Compte les factures clients (out_invoice, out_refund) postées sur la période."""
        domain = [
            ('state', '=', 'posted'),
            ('move_type', 'in', ('out_invoice', 'out_refund')),
            ('invoice_date', '>=', date_from),
            ('invoice_date', '<=', date_to),
        ]
        if company_id:
            domain.append(('company_id', '=', company_id))
        return self.env['account.move'].sudo().search_count(domain)

    def _count_expected_purchases(self, company_id, date_from, date_to):
        """Compte les factures fournisseurs (in_invoice, in_refund) postées sur la période."""
        domain = [
            ('state', '=', 'posted'),
            ('move_type', 'in', ('in_invoice', 'in_refund')),
            ('invoice_date', '>=', date_from),
            ('invoice_date', '<=', date_to),
        ]
        if company_id:
            domain.append(('company_id', '=', company_id))
        return self.env['account.move'].sudo().search_count(domain)

    def _count_expected_payments_in(self, company_id, date_from, date_to):
        """Compte les encaissements postés sur la période."""
        domain = [
            ('state', 'in', ('posted', 'paid', 'in_process', 'sent', 'reconciled')),
            ('payment_type', '=', 'inbound'),
            ('date', '>=', date_from),
            ('date', '<=', date_to),
        ]
        if company_id:
            domain.append(('company_id', '=', company_id))
        return self.env['account.payment'].sudo().search_count(domain)

    def _count_expected_payments_out(self, company_id, date_from, date_to):
        """Compte les décaissements postés sur la période."""
        domain = [
            ('state', 'in', ('posted', 'paid', 'in_process', 'sent', 'reconciled')),
            ('payment_type', '=', 'outbound'),
            ('date', '>=', date_from),
            ('date', '<=', date_to),
        ]
        if company_id:
            domain.append(('company_id', '=', company_id))
        return self.env['account.payment'].sudo().search_count(domain)

    def _count_expected_pos_sessions(self, company_id, date_from, date_to):
        """Compte les sessions POS fermées sur la période. 0 si pos non installé."""
        PosSession = self.env.get('pos.session')
        if not PosSession:
            return 0
        start_dt = datetime.strptime(date_from, '%Y-%m-%d')
        end_dt = datetime.strptime(date_to, '%Y-%m-%d') + timedelta(days=1)
        domain = [
            ('state', '=', 'closed'),
            ('stop_at', '>=', start_dt),
            ('stop_at', '<', end_dt),
        ]
        if company_id:
            domain.append(('company_id', '=', company_id))
        return PosSession.sudo().search_count(domain)

    @api.model
    def push_expected_counts(self, periods_months=2):
        """Pousse les comptages attendus vers DVIG (Phase DVIG — complétude probante).

        Compte les documents par scope (tenant, company_id, période) et envoie à
        POST {DVIG}/internal/expected-counts.

        periods_months : nombre de mois à couvrir (défaut 2 = mois courant + précédent).
        """
        icp = self.env['ir.config_parameter'].sudo()
        base_url = self._get_dvig_base_url()
        token = icp.get_param('dorevia.dvig.internal.token', '') or icp.get_param('dorevia.dvig.token', '')
        if not base_url or not token:
            _logger.debug("push_expected_counts_skip: dvig url ou token manquant")
            return 0

        tenant = icp.get_param('dorevia.tenant', '') or icp.get_param('dorevia.vault.tenant', '')
        if not tenant and icp.get_param('dorevia.dvig.source', ''):
            src = icp.get_param('dorevia.dvig.source', '')
            tenant = src.split('.')[-1] if '.' in src else src
        if not tenant:
            tenant = 'default'

        url = f"{base_url}/internal/expected-counts"
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        generated_at = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

        today = datetime.now().date()
        pushed = 0
        companies = self.env['res.company'].sudo().search([])
        company_ids = [None] + list(companies.ids)  # None = agrégat tous

        for m in range(periods_months):
            delta = relativedelta(months=m)
            month_start = (today.replace(day=1) - delta)
            period_from = month_start.strftime('%Y-%m-%d')
            period_to = (month_start + relativedelta(months=1, days=-1)).strftime('%Y-%m-%d')

            for company_id in company_ids:
                company_key = str(company_id) if company_id else ''
                sales = self._count_expected_sales(company_id, period_from, period_to)
                purchases = self._count_expected_purchases(company_id, period_from, period_to)
                payments_in = self._count_expected_payments_in(company_id, period_from, period_to)
                payments_out = self._count_expected_payments_out(company_id, period_from, period_to)
                pos_sessions = self._count_expected_pos_sessions(company_id, period_from, period_to)

                payload = {
                    'tenant': tenant,
                    'company_id': company_key,
                    'period_from': period_from,
                    'period_to': period_to,
                    'generated_at': generated_at,
                    'counts': [
                        {'source': 'sales', 'expected_count': sales},
                        {'source': 'purchases', 'expected_count': purchases},
                        {'source': 'paymentsIn', 'expected_count': payments_in},
                        {'source': 'paymentsOut', 'expected_count': payments_out},
                        {'source': 'pos', 'expected_count': pos_sessions},
                    ],
                }
                try:
                    resp = requests.post(url, json=payload, headers=headers, timeout=10)
                    if resp.status_code in (200, 204):
                        pushed += 1
                        _logger.debug(
                            "expected_counts_pushed tenant=%s company=%s period=%s",
                            tenant, company_key, period_from,
                        )
                    else:
                        _logger.warning(
                            "expected_counts_push_failed status=%s body=%s",
                            resp.status_code, resp.text[:200],
                        )
                except Exception as e:
                    _logger.warning("expected_counts_push_error %s", e)

        if pushed:
            _logger.info("expected_counts_pushed total=%d tenant=%s", pushed, tenant)
        return pushed

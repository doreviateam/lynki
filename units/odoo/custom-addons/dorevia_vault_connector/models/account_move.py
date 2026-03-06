# -*- coding: utf-8 -*-
"""
Extension account.move pour le vaulting automatique Dorevia.
SPEC : Orchestration Temps Réel du Vaulting v1.1 / v1.1.1

Machine d'état : todo → pending_proof → vaulted
                 todo → failed_soft (retry) → failed_hard (abandon)
"""

import hashlib
import json
import logging
import random
import uuid
import requests
from datetime import datetime, timedelta

from odoo import models, fields, api, _
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)

VAULT_STATUS_SELECTION = [
    ('todo', 'À traiter'),
    ('pending_proof', 'En attente de preuve'),
    ('vaulted', 'Protégée'),
    ('failed_soft', 'Échec temporaire'),
    ('failed_hard', 'Échec définitif'),
]

ELIGIBLE_MOVE_TYPES = ('out_invoice', 'in_invoice', 'out_refund', 'in_refund')


class AccountMove(models.Model):
    _inherit = 'account.move'

    # ── Champs vault ──────────────────────────────────────────
    dorevia_vault_status = fields.Selection(
        VAULT_STATUS_SELECTION,
        string='Statut de protection',
        copy=False,
        tracking=True,
    )
    dorevia_vaulted = fields.Boolean(
        string='Vaulted (legacy)',
        default=False,
        copy=False,
    )
    dorevia_vault_id = fields.Char(
        string='Référence de preuve',
        readonly=True,
        copy=False,
    )
    dorevia_vault_sha256 = fields.Char(
        string='Empreinte numérique',
        readonly=True,
        copy=False,
    )
    dorevia_vault_date = fields.Datetime(
        string='Date de sécurisation',
        readonly=True,
        copy=False,
    )
    dorevia_vault_evidence_jws = fields.Text(
        string='Attestation cryptographique',
        readonly=True,
        copy=False,
    )
    dorevia_vault_ledger_hash = fields.Char(
        string='Journal de preuve',
        readonly=True,
        copy=False,
    )
    dorevia_vault_idempotency_key = fields.Char(
        string='Clé d\'idempotence',
        readonly=True,
        copy=False,
    )
    dorevia_vault_attempt_count = fields.Integer(
        string='Nombre de tentatives',
        default=0,
        copy=False,
    )
    dorevia_vault_last_try_at = fields.Datetime(
        string='Dernière tentative',
        copy=False,
    )
    dorevia_vault_next_retry_at = fields.Datetime(
        string='Prochain essai',
        copy=False,
    )
    dorevia_vault_last_error = fields.Text(
        string='Dernière erreur',
        copy=False,
    )
    dorevia_dvig_event_id = fields.Char(
        string='Référence technique DVIG',
        copy=False,
    )
    dorevia_debug_enabled = fields.Boolean(
        string='Debug activé',
        compute='_compute_debug_enabled',
        store=False,
    )

    # ── Compute ───────────────────────────────────────────────

    def _compute_debug_enabled(self):
        flag = self.env['ir.config_parameter'].sudo().get_param(
            'dorevia.debug.actions', '0'
        )
        enabled = str(flag) == '1'
        for rec in self:
            rec.dorevia_debug_enabled = enabled

    # ── Éligibilité ───────────────────────────────────────────

    def _should_vault(self):
        """Vérifie que la config DVIG est présente."""
        icp = self.env['ir.config_parameter'].sudo()
        url = icp.get_param('dorevia.dvig.url', '')
        token = icp.get_param('dorevia.dvig.token', '')
        return bool(url and token)

    # ── Hook write() — init vault sur transition posted ───────

    def write(self, vals):
        res = super().write(vals)
        if self.env.context.get('dorevia_skip_posted_hook'):
            return res
        if vals.get('state') == 'posted':
            self._vault_init_moves()
        return res

    def action_post(self):
        res = super().action_post()
        self._vault_init_moves()
        return res

    def _vault_init_moves(self):
        """Initialise le vaulting pour les moves éligibles passés en posted.

        Si queue_job est disponible, enqueue immédiatement _job_send_to_dvig()
        pour un vaulting en < 15s. Sinon, le CRON prendra le relais.
        """
        if not self._should_vault():
            return
        for move in self:
            if move.state != 'posted':
                continue
            if move.move_type not in ELIGIBLE_MOVE_TYPES:
                continue
            if move.dorevia_vault_idempotency_key:
                continue
            try:
                key = self._compute_idempotency_key(move)
                move.with_context(dorevia_skip_posted_hook=True).write({
                    'dorevia_vault_status': 'todo',
                    'dorevia_vault_idempotency_key': key,
                    'dorevia_vault_attempt_count': 0,
                    'dorevia_vault_next_retry_at': fields.Datetime.now(),
                })
                move._enqueue_send_to_dvig()
            except Exception as e:
                _logger.warning(
                    "vault_init_error move_id=%s error=%s", move.id, e
                )
                move.with_context(
                    dorevia_skip_posted_hook=True, skip_posted_lock=True
                ).write({
                    'dorevia_vault_status': 'failed_soft',
                    'dorevia_vault_last_error': str(e),
                })

    def _enqueue_send_to_dvig(self):
        """Enqueue l'envoi DVIG via queue_job si disponible (SPEC v1.1.0)."""
        self.ensure_one()
        if not hasattr(self, 'with_delay'):
            return
        try:
            db_name = self.env.cr.dbname
            self.with_delay(
                channel='dorevia_vault',
                identity_key=f"send_dvig:{db_name}:{self.id}",
            )._job_send_to_dvig()
        except Exception as e:
            _logger.warning(
                "vault_enqueue_send_error move_id=%s error=%s", self.id, e
            )

    # ── Clé d'idempotence SHA-256 ─────────────────────────────

    @api.model
    def _compute_idempotency_key(self, move):
        canonical = json.dumps({
            'db': self.env.cr.dbname,
            'model': 'account.move',
            'id': move.id,
            'name': move.name or '',
            'move_type': move.move_type,
            'partner_id': move.partner_id.id,
            'amount_total': float(move.amount_total),
            'currency_id': move.currency_id.id,
            'date': str(move.date),
        }, sort_keys=True, ensure_ascii=True)
        return hashlib.sha256(canonical.encode()).hexdigest()

    # ── Backoff exponentiel ───────────────────────────────────

    def _calculate_next_retry(self, attempt_count):
        """2^n * 60s, plafond 3600s (1h)."""
        delay = min(2 ** attempt_count * 60, 3600)
        return fields.Datetime.now() + timedelta(seconds=delay)

    def _calculate_fetch_proof_retry_delay(self, attempt):
        """Délai pour retry fetch_proof : 0.25*(n+1) plafonné 10s + jitter."""
        base = min(0.25 * (attempt + 1), 10.0)
        jitter = random.uniform(0, 1.0)
        return base + jitter

    # ── Seuils d'abandon ──────────────────────────────────────

    def _check_abandon_thresholds(self):
        icp = self.env['ir.config_parameter'].sudo()
        max_attempts = int(icp.get_param('dorevia.vault.max_attempts_proof', '20'))
        max_age_hours = int(icp.get_param('dorevia.vault.max_age_pending_proof_hours', '24'))

        for move in self:
            if move.dorevia_vault_status not in ('pending_proof', 'failed_soft'):
                continue
            abandoned = False
            reason = ''
            if move.dorevia_vault_attempt_count >= max_attempts:
                abandoned = True
                reason = f'MAX_ATTEMPTS ({max_attempts})'
            elif move.dorevia_vault_last_try_at:
                age = datetime.now() - move.dorevia_vault_last_try_at
                if age > timedelta(hours=max_age_hours):
                    abandoned = True
                    reason = f'MAX_AGE ({max_age_hours}h)'
            if abandoned:
                _logger.error(
                    "vault_abandon_incident move_id=%s incident_type=abandon "
                    "reason=%s status=%s attempts=%s",
                    move.id, reason, move.dorevia_vault_status,
                    move.dorevia_vault_attempt_count,
                )
                move.with_context(
                    dorevia_skip_posted_hook=True, skip_posted_lock=True
                ).write({
                    'dorevia_vault_status': 'failed_hard',
                    'dorevia_vault_last_error': f'Abandon: {reason}',
                })

    # ── Anti-duplication (queue_job) ──────────────────────────

    def _can_enqueue_proof(self):
        self.ensure_one()
        if self.dorevia_vault_last_try_at:
            elapsed = (datetime.now() - self.dorevia_vault_last_try_at).total_seconds()
            if elapsed < 10:
                return False
        return True

    # ── CRON #1 — Envoi DVIG ──────────────────────────────────

    @api.model
    def cron_vault_send_dvig(self):
        """Sélectionne les factures en todo/failed_soft et envoie vers DVIG."""
        now = fields.Datetime.now()
        moves = self.search([
            ('state', '=', 'posted'),
            ('move_type', 'in', list(ELIGIBLE_MOVE_TYPES)),
            ('dorevia_vault_status', 'in', ['todo', 'failed_soft']),
            '|',
            ('dorevia_vault_next_retry_at', '<=', now),
            ('dorevia_vault_next_retry_at', '=', False),
        ], limit=50)

        icp = self.env['ir.config_parameter'].sudo()
        dvig_url = icp.get_param('dorevia.dvig.url', '')
        dvig_token = icp.get_param('dorevia.dvig.token', '')
        dvig_source = icp.get_param('dorevia.dvig.source', '')

        if not dvig_url or not dvig_token:
            return

        for move in moves:
            try:
                payload = move._build_dvig_payload(dvig_source)
                resp = requests.post(
                    f"{dvig_url}/ingest",
                    json=payload,
                    headers={
                        'Authorization': f'Bearer {dvig_token}',
                        'Content-Type': 'application/json',
                    },
                    timeout=30,
                )
                resp.raise_for_status()
                data = resp.json()
                event_id = data.get('event_id', '')
                move.with_context(
                    dorevia_skip_posted_hook=True, skip_posted_lock=True
                ).write({
                    'dorevia_vault_status': 'pending_proof',
                    'dorevia_dvig_event_id': event_id,
                    'dorevia_vault_attempt_count': move.dorevia_vault_attempt_count + 1,
                    'dorevia_vault_last_try_at': fields.Datetime.now(),
                    'dorevia_vault_last_error': False,
                })
                _logger.info(
                    "vault_send_dvig_ok move_id=%s event_id=%s", move.id, event_id
                )
            except Exception as e:
                attempt = move.dorevia_vault_attempt_count + 1
                next_retry = move._calculate_next_retry(attempt)
                move.with_context(
                    dorevia_skip_posted_hook=True, skip_posted_lock=True
                ).write({
                    'dorevia_vault_status': 'failed_soft',
                    'dorevia_vault_attempt_count': attempt,
                    'dorevia_vault_last_try_at': fields.Datetime.now(),
                    'dorevia_vault_next_retry_at': next_retry,
                    'dorevia_vault_last_error': str(e)[:500],
                })
                _logger.warning(
                    "vault_send_dvig_error move_id=%s attempt=%s error=%s",
                    move.id, attempt, e,
                )
                move._check_abandon_thresholds()

        # Déclencher le worker DVIG pour traiter l'outbox immédiatement (évite d'attendre
        # le scheduler DVIG 30s). Essentiel quand queue_job n'est pas utilisé ou en retry.
        try:
            self.env['dorevia.dvig.service'].trigger_worker(limit=50)
        except Exception as e:
            _logger.warning(
                "vault_cron_trigger_worker_error (non bloquant) error=%s", e
            )

    def _build_dvig_payload(self, source):
        """Construit le payload pour l'API DVIG (endpoint /ingest).
        Inclut amount_residual et invoice_date_due pour AR by Partner (SPEC v1.0).
        """
        return {
            'source': source,
            'event_type': 'invoice.posted',
            'idempotency_key': self.dorevia_vault_idempotency_key,
            'data': {
                'db': self.env.cr.dbname,
                'model': 'account.move',
                'id': self.id,
                'name': self.name,
                'move_type': self.move_type,
                'partner_id': self.partner_id.id,
                'partner_name': self.partner_id.name,
                'company_id': self.company_id.id if self.company_id else None,
                'amount_total': float(self.amount_total),
                'amount_untaxed': float(self.amount_untaxed),
                'amount_tax': float(self.amount_tax),
                'currency': self.currency_id.name,
                'date': str(self.date),
                'invoice_date': str(self.invoice_date) if self.invoice_date else None,
                'invoice_date_due': str(self.invoice_date_due) if self.invoice_date_due else None,
                'amount_residual': float(self.amount_residual) if self.amount_residual else None,
            },
        }

    # ── CRON #2 — Fetch proof ─────────────────────────────────

    @api.model
    def cron_vault_fetch_proof(self):
        """Récupère les preuves pour les factures en pending_proof."""
        moves = self.search([
            ('dorevia_vault_status', '=', 'pending_proof'),
            ('dorevia_dvig_event_id', '!=', False),
        ], limit=50)

        icp = self.env['ir.config_parameter'].sudo()
        vault_url = icp.get_param('dorevia.vault.url', '')

        if not vault_url:
            return

        for move in moves:
            try:
                move._fetch_and_apply_proof(vault_url)
            except Exception as e:
                attempt = move.dorevia_vault_attempt_count + 1
                next_retry = move._calculate_next_retry(attempt)
                move.with_context(
                    dorevia_skip_posted_hook=True, skip_posted_lock=True
                ).write({
                    'dorevia_vault_attempt_count': attempt,
                    'dorevia_vault_last_try_at': fields.Datetime.now(),
                    'dorevia_vault_next_retry_at': next_retry,
                    'dorevia_vault_last_error': str(e)[:500],
                })
                _logger.warning(
                    "vault_fetch_proof_error move_id=%s error=%s", move.id, e
                )
                move._check_abandon_thresholds()

    def _fetch_and_apply_proof(self, vault_url):
        """Récupère la preuve depuis Vault et met à jour la facture.

        Vault expose GET /api/v1/proof/account_move/:odoo_id qui retourne :
        {id, hash, ledger, prev_hash, timestamp, jws, status, source_model, source_id}
        Envoie X-Trace-Id pour traçabilité bout en bout.
        """
        trace_id = str(uuid.uuid4())
        icp = self.env['ir.config_parameter'].sudo()
        tenant = icp.get_param('dorevia.tenant', '') or icp.get_param('dorevia.dvig.source', '')
        if not tenant and self.company_id:
            tenant = str(self.company_id.id)
        headers = {'X-Trace-Id': trace_id}
        if tenant:
            headers['X-Tenant'] = tenant

        resp = requests.get(
            f"{vault_url}/api/v1/proof/account_move/{self.id}",
            headers=headers,
            timeout=15,
        )
        result = 'not_found' if resp.status_code == 404 else ('protected' if resp.status_code == 200 else 'error')
        _logger.info(
            "vault_proof_fetch move_id=%s tenant=%s vault_url=%s trace_id=%s http_status=%s result=%s",
            self.id, tenant or 'N/A', vault_url, trace_id, resp.status_code, result,
        )

        if resp.status_code == 404:
            return
        resp.raise_for_status()
        data = resp.json()

        if data.get('status') not in ('verified', 'sealed'):
            return

        vault_date = fields.Datetime.now()
        ts_raw = data.get('timestamp')
        if ts_raw:
            try:
                vault_date = datetime.fromisoformat(
                    ts_raw.replace('Z', '+00:00')
                ).strftime('%Y-%m-%d %H:%M:%S')
            except (ValueError, AttributeError):
                pass

        self.with_context(
            dorevia_skip_posted_hook=True, skip_posted_lock=True
        ).write({
            'dorevia_vault_status': 'vaulted',
            'dorevia_vaulted': True,
            'dorevia_vault_id': data.get('id', ''),
            'dorevia_vault_sha256': data.get('hash', ''),
            'dorevia_vault_date': vault_date,
            'dorevia_vault_evidence_jws': data.get('jws', ''),
            'dorevia_vault_ledger_hash': data.get('ledger', ''),
            'dorevia_vault_last_error': False,
        })
        _logger.info("vault_fetch_proof_ok move_id=%s vault_id=%s", self.id, data.get('id'))

    # ── CRON Reconciler (Addendum v1.1.1-add1) ───────────────

    @api.model
    def cron_vault_reconciler(self):
        """Rattrapage des factures bloquées en pending_proof/failed_soft."""
        now = fields.Datetime.now()
        moves = self.search([
            ('state', '=', 'posted'),
            ('move_type', 'in', list(ELIGIBLE_MOVE_TYPES)),
            ('dorevia_vault_status', 'in', ['pending_proof', 'failed_soft']),
            '|',
            ('dorevia_vault_next_retry_at', '<=', now),
            ('dorevia_vault_next_retry_at', '=', False),
        ], limit=50)

        for move in moves:
            if not move._can_enqueue_proof():
                continue
            if hasattr(move, 'with_delay'):
                db_name = self.env.cr.dbname
                identity_key = f"proof:{db_name}:{move.id}"
                try:
                    move.with_delay(
                        channel='dorevia_vault',
                        identity_key=identity_key,
                    )._job_fetch_proof()
                except Exception as e:
                    _logger.warning(
                        "vault_reconciler_enqueue_error move_id=%s error=%s",
                        move.id, e,
                    )

    @api.model
    def cron_vault_reconciler_failed_hard(self):
        """Repasse les failed_hard en todo (politique no_abandon)."""
        moves = self.search([
            ('state', '=', 'posted'),
            ('move_type', 'in', list(ELIGIBLE_MOVE_TYPES)),
            ('dorevia_vault_status', '=', 'failed_hard'),
        ], limit=50)
        for move in moves:
            move.with_context(
                dorevia_skip_posted_hook=True, skip_posted_lock=True
            ).write({
                'dorevia_vault_status': 'todo',
                'dorevia_vault_attempt_count': 0,
                'dorevia_vault_next_retry_at': fields.Datetime.now(),
                'dorevia_vault_last_error': 'Reset from failed_hard (no_abandon policy)',
            })
            _logger.info("vault_reconciler_reset move_id=%s", move.id)

    # ── CRON posted invoices (legacy, appelé par ir.cron existant) ──

    @api.model
    def cron_vault_posted_invoices(self):
        """Legacy CRON — redirige vers cron_vault_send_dvig."""
        return self.cron_vault_send_dvig()

    # ── Jobs queue_job ────────────────────────────────────────

    def _job_send_to_dvig(self):
        """Job queue_job : envoi vers DVIG + trigger synchrone + fetch immédiat.

        Flux complet (objectif < 10 s) :
        action_post → todo → [ce job] → pending_proof → trigger_worker synchrone
        → fetch_proof immédiat → vaulted
        """
        self.ensure_one()
        if self.dorevia_vault_status not in ('todo', 'failed_soft'):
            return

        icp = self.env['ir.config_parameter'].sudo()
        dvig_url = icp.get_param('dorevia.dvig.url', '')
        dvig_token = icp.get_param('dorevia.dvig.token', '')
        dvig_source = icp.get_param('dorevia.dvig.source', '')
        if not dvig_url or not dvig_token:
            return

        payload = self._build_dvig_payload(dvig_source)
        resp = requests.post(
            f"{dvig_url}/ingest",
            json=payload,
            headers={
                'Authorization': f'Bearer {dvig_token}',
                'Content-Type': 'application/json',
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        event_id = data.get('event_id', '')

        self.with_context(
            dorevia_skip_posted_hook=True, skip_posted_lock=True
        ).write({
            'dorevia_vault_status': 'pending_proof',
            'dorevia_dvig_event_id': event_id,
            'dorevia_vault_attempt_count': self.dorevia_vault_attempt_count + 1,
            'dorevia_vault_last_try_at': fields.Datetime.now(),
            'dorevia_vault_last_error': False,
        })
        _logger.info(
            "vault_job_send_dvig_ok move_id=%s event_id=%s", self.id, event_id
        )

        # Appel synchrone : garantit que le document est en Vault avant le fetch
        # (objectif < 10 s de bout en bout)
        dvig_service = self.env['dorevia.dvig.service']
        dvig_service.trigger_worker(limit=50)

        # Fetch immédiat : document prêt après trigger synchrone
        vault_url = icp.get_param('dorevia.vault.url', '')
        if vault_url:
            self._fetch_and_apply_proof(vault_url)
        # Fallback async si pas vaulted (réseau lent, 404)
        if self.dorevia_vault_status == 'pending_proof' and hasattr(self, 'with_delay'):
            db_name = self.env.cr.dbname
            try:
                self.with_delay(
                    channel='dorevia_vault',
                    identity_key=f"proof:{db_name}:{self.id}:r0",
                    eta=2,
                )._job_fetch_proof(retry_count=0)
            except Exception:
                pass

    def _job_fetch_proof(self, retry_count=0):
        """Job queue_job pour récupérer une preuve.

        Si Vault retourne 404 (preuve pas encore prête), re-enqueue
        avec un délai croissant jusqu'à 3 tentatives. Au-delà, le CRON prend le relais.
        """
        vault_url = self.env['ir.config_parameter'].sudo().get_param(
            'dorevia.vault.url', ''
        )
        if not vault_url:
            return
        self._fetch_and_apply_proof(vault_url)
        if self.dorevia_vault_status == 'pending_proof' and retry_count < 3:
            if hasattr(self, 'with_delay'):
                db_name = self.env.cr.dbname
                delay = [2, 4, 6][retry_count]
                try:
                    self.with_delay(
                        channel='dorevia_vault',
                        identity_key=f"proof:{db_name}:{self.id}:r{retry_count+1}",
                        eta=delay,
                    )._job_fetch_proof(retry_count=retry_count + 1)
                except Exception:
                    pass

    # ── Actions UI ────────────────────────────────────────────

    def action_securiser_maintenant(self):
        """Bouton 'Sécuriser maintenant' — envoi DVIG + trigger worker + fetch proof (effet immédiat)."""
        self.ensure_one()
        _logger.info("vault_securiser_maintenant called move_id=%s status=%s", self.id, self.dorevia_vault_status)
        icp = self.env['ir.config_parameter'].sudo()
        dvig_url = icp.get_param('dorevia.dvig.url', '')
        dvig_token = icp.get_param('dorevia.dvig.token', '')
        dvig_source = icp.get_param('dorevia.dvig.source', '')
        vault_url = icp.get_param('dorevia.vault.url', '')
        if not dvig_url or not dvig_token:
            raise UserError(_("Configuration DVIG manquante."))
        if self.dorevia_vault_status not in ('todo', 'pending_proof', 'failed_soft'):
            raise UserError(_("Cette facture n'est pas éligible (statut: %s).") % (self.dorevia_vault_status or _('N/A')))
        try:
            if self.dorevia_vault_status in ('todo', 'failed_soft'):
                payload = self._build_dvig_payload(dvig_source)
                resp = requests.post(
                    f"{dvig_url}/ingest",
                    json=payload,
                    headers={
                        'Authorization': f'Bearer {dvig_token}',
                        'Content-Type': 'application/json',
                    },
                    timeout=30,
                )
                resp.raise_for_status()
                data = resp.json()
                event_id = data.get('event_id', '')
                self.with_context(
                    dorevia_skip_posted_hook=True, skip_posted_lock=True
                ).write({
                    'dorevia_vault_status': 'pending_proof',
                    'dorevia_dvig_event_id': event_id,
                    'dorevia_vault_attempt_count': self.dorevia_vault_attempt_count + 1,
                    'dorevia_vault_last_try_at': fields.Datetime.now(),
                    'dorevia_vault_last_error': False,
                })
            dvig_service = self.env['dorevia.dvig.service']
            dvig_service.trigger_worker(limit=50)
            if vault_url:
                import time
                for _attempt in range(4):
                    time.sleep(2)
                    self._fetch_and_apply_proof(vault_url)
                    self.invalidate_recordset()
                    if self.dorevia_vault_status == 'vaulted':
                        break
            if self.dorevia_vault_status != 'vaulted':
                self.with_context(
                    dorevia_skip_posted_hook=True, skip_posted_lock=True
                ).write({
                    'dorevia_vault_attempt_count': self.dorevia_vault_attempt_count + 1,
                    'dorevia_vault_last_try_at': fields.Datetime.now(),
                })
                self.invalidate_recordset()
            if self.dorevia_vault_status == 'vaulted':
                msg = _("Facture protégée.")
                notif_type = 'success'
            else:
                msg = _(
                    "Sécurisation lancée. La preuve n'est pas encore dans le coffre-fort — "
                    "le statut peut rester « En attente » quelques minutes."
                )
                notif_type = 'warning'
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _("Sécurisation"),
                    'message': msg,
                    'type': notif_type,
                    'sticky': False,
                    'next': {
                        'type': 'ir.actions.act_window',
                        'name': _('Facture'),
                        'res_model': 'account.move',
                        'res_id': self.id,
                        'view_mode': 'form',
                        'views': [(False, 'form')],
                        'target': 'current',
                    },
                },
            }
        except Exception as e:
            raise UserError(_(
                "Erreur lors de la sécurisation : %s"
            ) % str(e))

    def action_refresh_vault_proof(self):
        """Bouton 'Refresh Proof Now' — debug uniquement."""
        self.ensure_one()
        if not self.dorevia_debug_enabled:
            raise UserError(_(
                "Cette action est désactivée en production.\n"
                "Les outils de diagnostic ne sont disponibles qu'en environnement de développement."
            ))
        if hasattr(self, 'with_delay'):
            db_name = self.env.cr.dbname
            self.with_delay(
                channel='dorevia_vault',
                identity_key=f"proof:{db_name}:{self.id}",
            )._job_fetch_proof()
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _("Récupération de preuve"),
                    'message': _("Job de récupération de preuve en file d'attente."),
                    'type': 'info',
                    'sticky': False,
                },
            }

    def action_trigger_dvig_worker(self):
        """Bouton 'Trigger DVIG Worker Now' — debug uniquement."""
        self.ensure_one()
        if not self.dorevia_debug_enabled:
            raise UserError(_(
                "Cette action est désactivée en production.\n"
                "Les outils de diagnostic ne sont disponibles qu'en environnement de développement."
            ))
        dvig_service = self.env['dorevia.dvig.service']
        if hasattr(dvig_service, 'with_delay'):
            db_name = self.env.cr.dbname
            tenant = self.env['ir.config_parameter'].sudo().get_param(
                'dorevia.tenant', 'default'
            )
            dvig_service.with_delay(
                channel='dorevia_vault',
                identity_key=f"dvig_trigger:{db_name}:{tenant}",
            ).trigger_worker()
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _("DVIG Worker"),
                'message': _("Trigger DVIG worker en file d'attente."),
                'type': 'info',
                'sticky': False,
            },
        }

    def action_download_attestation(self):
        """Télécharge l'attestation cryptographique de la facture."""
        self.ensure_one()
        if self.dorevia_vault_status != 'vaulted':
            raise UserError(_("Aucune attestation disponible."))
        content = json.dumps({
            'document': self.name,
            'type': self.move_type,
            'vault_id': self.dorevia_vault_id,
            'sha256': self.dorevia_vault_sha256,
            'vaulted_at': str(self.dorevia_vault_date),
            'ledger_hash': self.dorevia_vault_ledger_hash,
            'evidence_jws': self.dorevia_vault_evidence_jws,
        }, indent=2, ensure_ascii=False)
        import base64
        attachment = self.env['ir.attachment'].create({
            'name': f'attestation_{self.name}.json',
            'type': 'binary',
            'datas': base64.b64encode(content.encode('utf-8')),
            'mimetype': 'application/json',
        })
        return {
            'type': 'ir.actions.act_url',
            'url': f'/web/content/{attachment.id}?download=true',
            'target': 'self',
        }

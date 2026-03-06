# -*- coding: utf-8 -*-
"""
Extension account.payment pour le vaulting automatique Dorevia.
SPEC : Vaulting Paiements v1.3 — Temps réel via queue_job

Flow temps réel : action_post → todo → [queue_job] → DVIG /ingest → pending_proof
                  → [queue_job eta=15s] → Vault GET /proof → vaulted (~20s)
Flow CRON (fallback) : idem mais piloté par CRONs toutes les 2-5 min
"""

import hashlib
import json
import logging
import time
import requests
from datetime import datetime, timedelta

from odoo import models, fields, api, _
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)

VAULT_STATUS_SELECTION = [
    ('todo', 'À traiter'),
    ('pending_proof', 'En attente de preuve'),
    ('vaulted', 'Protégé'),
    ('failed_soft', 'Échec temporaire'),
    ('failed_hard', 'Échec définitif'),
]

# Odoo 18 : account.payment utilise 'paid' ; Odoo 17- : 'posted'
ELIGIBLE_PAYMENT_STATES = ('posted', 'paid', 'in_process', 'sent', 'reconciled')


class AccountPayment(models.Model):
    _inherit = 'account.payment'

    # ── Champs vault ──────────────────────────────────────────
    dorevia_vault_status = fields.Selection(
        VAULT_STATUS_SELECTION,
        string='Statut de protection',
        copy=False,
    )
    dorevia_vault_id = fields.Char(string='Référence de preuve', readonly=True, copy=False)
    dorevia_vault_sha256 = fields.Char(string='Empreinte numérique', readonly=True, copy=False)
    dorevia_vault_date = fields.Datetime(string='Date de sécurisation', readonly=True, copy=False)
    dorevia_vault_evidence_jws = fields.Text(string='Attestation cryptographique', readonly=True, copy=False)
    dorevia_vault_ledger_hash = fields.Char(string='Journal de preuve', readonly=True, copy=False)
    dorevia_vault_idempotency_key = fields.Char(string="Clé d'idempotence", readonly=True, copy=False)
    dorevia_vault_attempt_count = fields.Integer(string='Nombre de tentatives', default=0, copy=False)
    dorevia_vault_last_try_at = fields.Datetime(string='Dernière tentative', copy=False)
    dorevia_vault_next_retry_at = fields.Datetime(string='Prochain essai', copy=False)
    dorevia_vault_last_error = fields.Text(string='Dernière erreur', copy=False)

    # ── Helpers ────────────────────────────────────────────────

    def _dvig_config(self):
        icp = self.env['ir.config_parameter'].sudo()
        return {
            'dvig_url': icp.get_param('dorevia.dvig.url', ''),
            'dvig_token': icp.get_param('dorevia.dvig.token', ''),
            'dvig_source': icp.get_param('dorevia.dvig.source', ''),
            'vault_url': icp.get_param('dorevia.vault.url', ''),
            'tenant': icp.get_param('dorevia.vault.tenant', ''),
        }

    def _should_vault(self):
        icp = self.env['ir.config_parameter'].sudo()
        url = icp.get_param('dorevia.dvig.url', '')
        token = icp.get_param('dorevia.dvig.token', '')
        return bool(url and token)

    def _calculate_next_retry(self, attempt_count):
        delay = min(2 ** attempt_count * 60, 3600)
        return fields.Datetime.now() + timedelta(seconds=delay)

    def _compute_payment_idempotency_key(self):
        canonical = json.dumps({
            'db': self.env.cr.dbname,
            'model': 'account.payment',
            'id': self.id,
            'name': self.name or '',
            'amount': float(self.amount),
            'currency_id': self.currency_id.id,
            'date': str(self.date),
        }, sort_keys=True, ensure_ascii=True)
        return hashlib.sha256(canonical.encode()).hexdigest()

    # ── Hook action_post — init vault + enqueue ────────────────

    def action_post(self):
        res = super().action_post()
        self._vault_init_payments()
        return res

    def _vault_init_payments(self):
        """Initialise le vaulting pour les paiements éligibles.

        Si queue_job est disponible, enqueue immédiatement _job_send_to_dvig()
        pour un vaulting en ~20s. Sinon, le CRON prendra le relais.
        """
        if not self._should_vault():
            return
        for payment in self:
            if payment.state not in ELIGIBLE_PAYMENT_STATES:
                continue
            if payment.dorevia_vault_idempotency_key:
                continue
            try:
                key = payment._compute_payment_idempotency_key()
                payment.write({
                    'dorevia_vault_status': 'todo',
                    'dorevia_vault_idempotency_key': key,
                    'dorevia_vault_attempt_count': 0,
                    'dorevia_vault_next_retry_at': fields.Datetime.now(),
                })
                payment._enqueue_send_to_dvig()
            except Exception as e:
                _logger.warning(
                    "vault_init_error payment_id=%s error=%s", payment.id, e
                )
                payment.write({
                    'dorevia_vault_status': 'failed_soft',
                    'dorevia_vault_last_error': str(e),
                })

    def _enqueue_send_to_dvig(self):
        """Enqueue l'envoi DVIG via queue_job si disponible."""
        self.ensure_one()
        if not hasattr(self, 'with_delay'):
            return
        try:
            db_name = self.env.cr.dbname
            self.with_delay(
                channel='dorevia_vault',
                identity_key=f"send_dvig_pay:{db_name}:{self.id}",
            )._job_send_to_dvig()
        except Exception as e:
            _logger.warning(
                "vault_enqueue_send_error payment_id=%s error=%s", self.id, e
            )

    # ── Jobs queue_job ────────────────────────────────────────

    def _job_send_to_dvig(self):
        """Job queue_job : envoi vers DVIG + chaînage fetch_proof.

        action_post → todo → [ce job] → pending_proof → [fetch_proof eta=15s] → vaulted
        """
        self.ensure_one()
        if self.dorevia_vault_status not in ('todo', 'failed_soft'):
            return

        cfg = self._dvig_config()
        if not cfg['dvig_url'] or not cfg['dvig_token']:
            return

        payload = self._build_dvig_payload(cfg)
        resp = requests.post(
            f"{cfg['dvig_url']}/ingest",
            json=payload,
            headers={
                'Authorization': f'Bearer {cfg["dvig_token"]}',
                'Content-Type': 'application/json',
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        event_id = data.get('event_id', '')

        self.write({
            'dorevia_vault_status': 'pending_proof',
            'dorevia_vault_attempt_count': self.dorevia_vault_attempt_count + 1,
            'dorevia_vault_last_try_at': fields.Datetime.now(),
            'dorevia_vault_last_error': False,
        })
        _logger.info(
            "vault_job_send_dvig_ok payment_id=%s event_id=%s", self.id, event_id
        )

        dvig_service = self.env['dorevia.dvig.service']
        if hasattr(dvig_service, 'with_delay'):
            db_name = self.env.cr.dbname
            tenant = self.env['ir.config_parameter'].sudo().get_param('dorevia.tenant', 'default')
            try:
                dvig_service.with_delay(
                    channel='dorevia_vault',
                    identity_key=f"dvig_trigger_pay:{db_name}:{tenant}",
                ).trigger_worker(limit=50)
            except Exception:
                pass

        if hasattr(self, 'with_delay'):
            db_name = self.env.cr.dbname
            try:
                self.with_delay(
                    channel='dorevia_vault',
                    identity_key=f"proof_pay:{db_name}:{self.id}:r0",
                    eta=5,
                )._job_fetch_proof(retry_count=0)
            except Exception:
                pass

    def _job_fetch_proof(self, retry_count=0):
        """Job queue_job pour récupérer une preuve de paiement.

        Si Vault retourne 404, re-enqueue avec délai croissant (max 3 retries).
        Au-delà, le CRON prend le relais.
        """
        self.ensure_one()
        vault_url = self.env['ir.config_parameter'].sudo().get_param(
            'dorevia.vault.url', ''
        )
        if not vault_url:
            return
        self._fetch_and_apply_proof(vault_url)
        if self.dorevia_vault_status == 'pending_proof' and retry_count < 3:
            if hasattr(self, 'with_delay'):
                db_name = self.env.cr.dbname
                delay = [3, 6, 10][retry_count]
                try:
                    self.with_delay(
                        channel='dorevia_vault',
                        identity_key=f"proof_pay:{db_name}:{self.id}:r{retry_count+1}",
                        eta=delay,
                    )._job_fetch_proof(retry_count=retry_count + 1)
                except Exception:
                    pass

    # ── Backfill — Initialiser tous les paiements éligibles non encore marqués ─

    @api.model
    def backfill_vault_todo(self, payment_type=None):
        """Initialise vault pour les paiements déjà validés non encore traités.

        Utile pour les paiements fournisseurs/clients validés avant l'activation du connector.
        payment_type : None (tous), 'inbound' (clients), 'outbound' (fournisseurs).
        """
        if not self._should_vault():
            return 0
        domain = [
            ('state', 'in', list(ELIGIBLE_PAYMENT_STATES)),
            ('dorevia_vault_status', 'in', [False, 'todo']),
            ('dorevia_vault_idempotency_key', '=', False),
        ]
        if payment_type:
            domain.append(('payment_type', '=', payment_type))
        payments = self.search(domain, limit=500)
        count = 0
        for payment in payments:
            try:
                key = payment._compute_payment_idempotency_key()
                payment.write({
                    'dorevia_vault_status': 'todo',
                    'dorevia_vault_idempotency_key': key,
                    'dorevia_vault_attempt_count': 0,
                    'dorevia_vault_next_retry_at': fields.Datetime.now(),
                })
                count += 1
            except Exception as e:
                _logger.warning("backfill_vault_todo payment_id=%s error=%s", payment.id, e)
        if count > 0:
            _logger.info("backfill_vault_todo initialized %d payments (payment_type=%s)", count, payment_type)
        return count

    # ── CRON #1 — Envoi paiements vers DVIG /ingest (fallback) ─

    @api.model
    def cron_vault_send_payments(self):
        """Fallback CRON : envoie les paiements non traités par queue_job."""
        now = fields.Datetime.now()
        payments = self.search([
            ('state', 'in', list(ELIGIBLE_PAYMENT_STATES)),
            ('dorevia_vault_status', 'in', [False, 'todo', 'failed_soft']),
            '|',
            ('dorevia_vault_next_retry_at', '<=', now),
            ('dorevia_vault_next_retry_at', '=', False),
        ], limit=50)

        if not payments:
            return

        cfg = self._dvig_config()
        if not cfg['dvig_url'] or not cfg['dvig_token']:
            return

        sent_count = 0
        for payment in payments:
            try:
                payload = payment._build_dvig_payload(cfg)
                resp = requests.post(
                    f"{cfg['dvig_url']}/ingest",
                    json=payload,
                    headers={
                        'Authorization': f'Bearer {cfg["dvig_token"]}',
                        'Content-Type': 'application/json',
                    },
                    timeout=30,
                )
                resp.raise_for_status()
                data = resp.json()
                event_id = data.get('event_id', '')
                payment.write({
                    'dorevia_vault_status': 'pending_proof',
                    'dorevia_vault_attempt_count': payment.dorevia_vault_attempt_count + 1,
                    'dorevia_vault_last_try_at': fields.Datetime.now(),
                    'dorevia_vault_last_error': False,
                })
                _logger.info(
                    "vault_send_payment_dvig_ok payment_id=%s event_id=%s",
                    payment.id, event_id
                )
                sent_count += 1
            except Exception as e:
                attempt = payment.dorevia_vault_attempt_count + 1
                next_retry = payment._calculate_next_retry(attempt)
                payment.write({
                    'dorevia_vault_status': 'failed_soft',
                    'dorevia_vault_attempt_count': attempt,
                    'dorevia_vault_last_try_at': fields.Datetime.now(),
                    'dorevia_vault_next_retry_at': next_retry,
                    'dorevia_vault_last_error': str(e)[:500],
                })
                _logger.warning(
                    "vault_send_payment_dvig_error payment_id=%s error=%s",
                    payment.id, e
                )
        if sent_count > 0:
            try:
                self.env['dorevia.dvig.service'].trigger_worker(limit=50)
            except Exception:
                pass

    def _vault_payment_method(self):
        """Mappe journal + payment_method Odoo vers method Vault (minuscule).
        cash → cash ; check → check ; bank/general/autre → transfer.
        """
        if self.journal_id and self.journal_id.type == 'cash':
            return 'cash'
        code = None
        if self.payment_method_line_id:
            code = getattr(self.payment_method_line_id, 'code', None)
        if not code and self.payment_method_id:
            code = getattr(self.payment_method_id, 'code', None)
        if code and str(code).lower() == 'check':
            return 'check'
        return 'transfer'

    def _build_dvig_payload(self, cfg):
        """Construit le payload pour DVIG /ingest."""
        idemp_key = self.dorevia_vault_idempotency_key
        if not idemp_key:
            idemp_key = self._compute_payment_idempotency_key()
            self.write({'dorevia_vault_idempotency_key': idemp_key})

        # P0.2 : mapping espèces / virements / chèque (minuscule, SPEC Payments v1.1)
        # journal cash → cash ; payment_method check → check ; bank/general → transfer
        # card : non identifié sans config dédiée (reste transfer)
        method = self._vault_payment_method()
        return {
            'source': cfg['dvig_source'],
            'event_type': 'payment.posted',
            'idempotency_key': idemp_key,
            'data': {
                'db': self.env.cr.dbname,
                'model': 'account.payment',
                'id': self.id,
                'name': self.name,
                'amount': float(self.amount),
                'currency': self.currency_id.name or 'EUR',
                'date': str(self.date),
                'partner_id': self.partner_id.id,
                'partner_name': self.partner_id.name or '',
                'payment_type': self.payment_type,
                'method': method,
                'is_refund': False,
                'company_id': self.company_id.id or 1,
                'memo': '',
            },
        }

    # ── CRON #2 — Fetch proof (fallback) ──────────────────────

    @api.model
    def cron_vault_fetch_proof_payments(self):
        """Fallback CRON : récupère les preuves non traitées par queue_job."""
        payments = self.search([
            ('dorevia_vault_status', '=', 'pending_proof'),
        ], limit=50)

        if not payments:
            return

        cfg = self._dvig_config()
        if not cfg['vault_url']:
            return

        for payment in payments:
            try:
                payment._fetch_and_apply_proof(cfg['vault_url'])
            except Exception as e:
                attempt = payment.dorevia_vault_attempt_count + 1
                next_retry = payment._calculate_next_retry(attempt)
                payment.write({
                    'dorevia_vault_attempt_count': attempt,
                    'dorevia_vault_last_try_at': fields.Datetime.now(),
                    'dorevia_vault_next_retry_at': next_retry,
                    'dorevia_vault_last_error': str(e)[:500],
                })
                _logger.warning(
                    "vault_fetch_proof_payment_error payment_id=%s error=%s",
                    payment.id, e
                )

    def _fetch_and_apply_proof(self, vault_url):
        """Récupère la preuve depuis GET /api/v1/proof/account_payment/:id."""
        resp = requests.get(
            f"{vault_url}/api/v1/proof/account_payment/{self.id}",
            timeout=15,
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

        self.write({
            'dorevia_vault_status': 'vaulted',
            'dorevia_vault_id': data.get('id', ''),
            'dorevia_vault_sha256': data.get('hash', ''),
            'dorevia_vault_date': vault_date,
            'dorevia_vault_evidence_jws': data.get('jws', ''),
            'dorevia_vault_ledger_hash': data.get('ledger', ''),
            'dorevia_vault_last_error': False,
        })
        _logger.info(
            "vault_fetch_proof_payment_ok payment_id=%s vault_id=%s",
            self.id, data.get('id')
        )

    # ── Actions UI ────────────────────────────────────────────

    def action_refresh_vault_proof(self):
        """Bouton 'Rafraîchir la preuve'."""
        self.ensure_one()
        cfg = self._dvig_config()

        if self.dorevia_vault_status in (False, 'todo', 'failed_soft', 'failed_hard'):
            if not cfg['dvig_url'] or not cfg['dvig_token']:
                raise UserError(_("Configuration DVIG manquante."))
            try:
                payload = self._build_dvig_payload(cfg)
                resp = requests.post(
                    f"{cfg['dvig_url']}/ingest",
                    json=payload,
                    headers={
                        'Authorization': f'Bearer {cfg["dvig_token"]}',
                        'Content-Type': 'application/json',
                    },
                    timeout=30,
                )
                resp.raise_for_status()
                self.write({
                    'dorevia_vault_status': 'pending_proof',
                    'dorevia_vault_attempt_count': self.dorevia_vault_attempt_count + 1,
                    'dorevia_vault_last_try_at': fields.Datetime.now(),
                })
            except Exception as e:
                raise UserError(_("Erreur lors de l'envoi vers DVIG : %s") % str(e))

        if self.dorevia_vault_status == 'pending_proof':
            if not cfg['vault_url']:
                raise UserError(_("Configuration Vault manquante."))
            # Réinitialiser l'événement outbox si échec 404 (route Vault déployée après coup)
            idemp_key = self.dorevia_vault_idempotency_key
            tenant = cfg.get('tenant') or self.env['ir.config_parameter'].sudo().get_param('dorevia.tenant', 'default')
            if idemp_key and tenant:
                dvig = self.env['dorevia.dvig.service']
                if dvig.retry_outbox_event(tenant, idemp_key):
                    dvig.trigger_worker(limit=50)
                    time.sleep(3)
            self._fetch_and_apply_proof(cfg['vault_url'])

    def action_download_payment_attestation(self):
        """Télécharge l'attestation du paiement."""
        self.ensure_one()
        if self.dorevia_vault_status != 'vaulted':
            raise UserError(_("Aucune attestation disponible."))
        content = json.dumps({
            'document': self.name,
            'type': 'payment',
            'vault_id': self.dorevia_vault_id,
            'sha256': self.dorevia_vault_sha256,
            'vaulted_at': str(self.dorevia_vault_date),
            'ledger_hash': self.dorevia_vault_ledger_hash,
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

    def action_open_vault_proof(self):
        """Ouvre la preuve Vault dans un nouvel onglet."""
        self.ensure_one()
        vault_url = self.env['ir.config_parameter'].sudo().get_param('dorevia.vault.url', '')
        if not vault_url or not self.dorevia_vault_id:
            raise UserError(_("Preuve non disponible."))
        return {
            'type': 'ir.actions.act_url',
            'url': f"{vault_url}/proofs/{self.dorevia_vault_id}",
            'target': 'new',
        }

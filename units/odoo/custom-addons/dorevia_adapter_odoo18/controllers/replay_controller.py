# -*- coding: utf-8 -*-
"""
Endpoints replay ERP — SPEC ERP Reconnect v1.2, Annexe §4.6
Appelés par le Runner Vault. Auth Basic (admin/password).
E6-US4bis : allocations FIFO paiement → factures.
"""

import json
import logging
from datetime import datetime

from odoo import http, SUPERUSER_ID
from odoo.http import request, Response

_logger = logging.getLogger(__name__)


def _allocate_fifo(env, payment):
    """
    Allocation FIFO : réconcilie le paiement avec les factures impayées
    (client ou fournisseur selon le type de paiement).
    Best-effort : en cas d'erreur, on retourne ce qui a été alloué.
    Returns: list of dicts {invoice_id, amount_applied}
    """
    allocations = []
    try:
        liquidity, counterpart, _ = payment._seek_for_lines()
        if not counterpart:
            return []
        # Lignes paiement non réconciliées
        payment_lines = counterpart.filtered(
            lambda l: not l.reconciled and abs(l.amount_residual) > 1e-9
        )
        if not payment_lines:
            return []
        remaining = payment_lines[0]
        # Déterminer le type de recherche selon partner_type
        if payment.partner_type == 'customer':
            account_type = 'asset_receivable'
            move_types = ('out_invoice', 'out_refund')
        else:
            account_type = 'liability_payable'
            move_types = ('in_invoice', 'in_refund')
        # Factures impayées, triées par date (FIFO)
        inv_domain = [
            ('account_id.account_type', '=', account_type),
            ('partner_id', '=', payment.partner_id.id),
            ('reconciled', '=', False),
            ('amount_residual', '!=', 0),
            ('move_id.move_type', 'in', move_types),
            ('move_id.state', '=', 'posted'),
        ]
        inv_lines = env['account.move.line'].search(
            inv_domain,
            order='move_id.invoice_date asc, move_id.id asc'
        )
        for inv_line in inv_lines:
            if abs(remaining.amount_residual) < 1e-9:
                break
            amount_before = abs(remaining.amount_residual)
            try:
                (remaining | inv_line).with_context(
                    no_exchange_difference=True,
                ).reconcile()
            except Exception as e:
                _logger.warning(
                    "FIFO reconcile partner=%s inv=%s: %s",
                    payment.partner_id.display_name,
                    inv_line.move_id.display_name,
                    e,
                )
                break
            env.invalidate_all()
            amount_applied = amount_before - abs(remaining.amount_residual)
            allocations.append({
                'invoice_id': inv_line.move_id.id,
                'amount_applied': round(amount_applied, 2),
            })
            # Récupérer la ligne paiement restante (peut être une nouvelle ligne partielle)
            _, counterpart2, _ = payment._seek_for_lines()
            unreconciled = counterpart2.filtered(
                lambda l: not l.reconciled and abs(l.amount_residual) > 1e-9
            )
            if not unreconciled:
                break
            remaining = unreconciled[0]
    except Exception as e:
        _logger.warning("FIFO allocation failed: %s", e)
    return allocations


def _check_basic_auth():
    """Vérifie Basic Auth contre config (admin/password). Retourne (ok, Response|None)."""
    auth = request.httprequest.authorization
    if not auth or auth.type != 'basic' or not auth.username or not auth.password:
        return False, Response(
            json.dumps({'error': 'unauthorized', 'details': 'Basic Auth requis'}),
            status=401,
            headers={'WWW-Authenticate': 'Basic realm="Dorevia Replay"'},
            mimetype='application/json',
        )
    env = request.env(user=SUPERUSER_ID)
    icp = env['ir.config_parameter'].sudo()
    expected_user = icp.get_param('dorevia.adapter.auth_user', 'admin')
    expected_pass = icp.get_param('dorevia.adapter.auth_password', 'admin')
    if auth.username != expected_user or auth.password != expected_pass:
        return False, Response(
            json.dumps({'error': 'unauthorized', 'details': 'Identifiants invalides'}),
            status=401,
            mimetype='application/json',
        )
    return True, None


def _json_response(data, status=200):
    return Response(json.dumps(data), status=status, mimetype='application/json')


def _parse_json_body():
    try:
        return json.loads(request.httprequest.data.decode('utf-8')) if request.httprequest.data else {}
    except (ValueError, TypeError):
        return None


class ReplayController(http.Controller):

    # ── E6-US2 : partner/upsert ────────────────────────────────────────────
    @http.route(
        '/dorevia/replay/partner/upsert',
        type='http',
        methods=['POST'],
        auth='public',
        csrf=False,
    )
    def partner_upsert(self, **kwargs):
        """
        Idempotent par (tenant, partner_ref). Pas d'entrée dans dorevia.replay.mapping.
        Input: { tenant, name, partner_ref [, vat, email, street, city, zip, country ] }
        """
        ok, err_resp = _check_basic_auth()
        if not ok:
            return err_resp

        payload = _parse_json_body()
        if not payload:
            return _json_response({'error': 'invalid_payload', 'details': 'JSON invalide'}, 400)

        tenant = payload.get('tenant', '').strip()
        name = payload.get('name', '').strip()
        partner_ref = payload.get('partner_ref', '').strip() or payload.get('ref', '').strip()
        if not tenant or not name or not partner_ref:
            return _json_response({
                'error': 'validation_failed',
                'details': 'tenant, name, partner_ref obligatoires',
            }, 400)

        env = request.env(user=SUPERUSER_ID)
        Partner = env['res.partner']

        # Recherche par ref (partner_ref = champ ref Odoo) — idempotent
        partner = Partner.sudo().search([('ref', '=', partner_ref)], limit=1)

        vals = {
            'name': name,
            'ref': partner_ref,
        }
        for f in ('vat', 'email', 'street', 'city', 'zip', 'country'):
            if f in payload and payload[f] is not None:
                vals[f] = payload[f]

        if partner:
            partner.sudo().write(vals)
            status = 'updated'
        else:
            partner = Partner.sudo().create(vals)
            status = 'created'

        return _json_response({
            'partner_id': partner.id,
            'status': status,
            'warnings': [],
        }, 200)

    # ── E6-US3 : invoice/create_synth ──────────────────────────────────────
    @http.route(
        '/dorevia/replay/invoice/create_synth',
        type='http',
        methods=['POST'],
        auth='public',
        csrf=False,
    )
    def invoice_create_synth(self, **kwargs):
        """
        Crée account.move avec 1 ligne « Vente HT (Vault) ».
        Input: invoice_issued canonique + event_id
        """
        ok, err_resp = _check_basic_auth()
        if not ok:
            return err_resp

        payload = _parse_json_body()
        if not payload:
            return _json_response({'error': 'invalid_payload', 'details': 'JSON invalide'}, 400)

        event_id = payload.get('event_id')
        if not event_id:
            return _json_response({'error': 'validation_failed', 'details': 'event_id obligatoire'}, 400)

        env = request.env(user=SUPERUSER_ID)
        Mapping = env['dorevia.replay.mapping']

        # Idempotence : event_id déjà appliqué ?
        existing = Mapping.sudo().search([('event_id', '=', event_id)], limit=1)
        if existing:
            return _json_response({
                'move_id': existing.res_id,
                'status': 'skipped',
                'warnings': ['event_id déjà appliqué'],
            }, 200)

        partner_ref = payload.get('partner_ref', '')
        if not partner_ref:
            return _json_response({'error': 'validation_failed', 'details': 'partner_ref obligatoire'}, 400)

        partner = env['res.partner'].sudo().search([('ref', '=', partner_ref)], limit=1)
        if not partner:
            return _json_response({
                'error': 'partner_not_found',
                'details': f'Partner ref={partner_ref} non trouvé. Appeler partner/upsert avant.',
            }, 400)

        move_type = payload.get('move_type', 'out_invoice')
        journal_type = 'sale' if move_type in ('out_invoice', 'out_refund') else 'purchase'
        journal = env['account.journal'].sudo().search([
            ('type', '=', journal_type),
            ('company_id', '=', env.company.id),
        ], limit=1)
        if not journal:
            return _json_response({'error': 'config_error', 'details': f'Journal {journal_type} introuvable'}, 500)

        product_tmpl = env.ref('dorevia_adapter_odoo18.product_product_vault_synth', raise_if_not_found=False)
        if not product_tmpl:
            return _json_response({'error': 'config_error', 'details': 'Produit Vente HT (Vault) introuvable'}, 500)
        product = env['product.product'].sudo().search(
            [('product_tmpl_id', '=', product_tmpl.id)], limit=1
        )
        if not product:
            return _json_response({'error': 'config_error', 'details': 'Variant produit Vault introuvable'}, 500)

        amount_untaxed = float(payload.get('amount_untaxed', 0) or 0)
        date_str = payload.get('date') or payload.get('invoice_date', '')[:10]
        invoice_date = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else datetime.now().date()

        invoice_line = {
            'product_id': product.id,
            'name': product.name,
            'quantity': 1.0,
            'price_unit': amount_untaxed,
        }

        invoice_vals = {
            'move_type': move_type,
            'partner_id': partner.id,
            'journal_id': journal.id,
            'invoice_date': invoice_date,
            'ref': payload.get('invoice_id', ''),
            'invoice_line_ids': [(0, 0, invoice_line)],
        }

        try:
            move = env['account.move'].sudo().create(invoice_vals)
            move.action_post()
        except Exception as e:
            _logger.exception('invoice create_synth failed')
            return _json_response({'error': 'create_failed', 'details': str(e)}, 500)

        Mapping.sudo().create({
            'event_id': event_id,
            'tenant': payload.get('tenant', ''),
            'model': 'account.move',
            'res_id': move.id,
            'status': 'applied',
        })

        return _json_response({
            'move_id': move.id,
            'status': 'applied',
            'warnings': [],
        }, 201)

    # ── E6-US4 : payment/create ─────────────────────────────────────────────
    @http.route(
        '/dorevia/replay/payment/create',
        type='http',
        methods=['POST'],
        auth='public',
        csrf=False,
    )
    def payment_create(self, **kwargs):
        """
        Crée account.payment. Pas de FIFO ni balances/recompute (MVP).
        Input: payment_received/payment_sent canonique + event_id
        """
        ok, err_resp = _check_basic_auth()
        if not ok:
            return err_resp

        payload = _parse_json_body()
        if not payload:
            return _json_response({'error': 'invalid_payload', 'details': 'JSON invalide'}, 400)

        event_id = payload.get('event_id')
        if not event_id:
            return _json_response({'error': 'validation_failed', 'details': 'event_id obligatoire'}, 400)

        env = request.env(user=SUPERUSER_ID)
        Mapping = env['dorevia.replay.mapping']

        existing = Mapping.sudo().search([('event_id', '=', event_id)], limit=1)
        if existing:
            allocations = []
            if existing.details_json:
                try:
                    details = json.loads(existing.details_json)
                    allocations = details.get('allocations', [])
                except (ValueError, TypeError):
                    pass
            return _json_response({
                'payment_id': existing.res_id,
                'status': 'skipped',
                'allocations': allocations,
                'warnings': ['event_id déjà appliqué'],
            }, 200)

        partner_ref = payload.get('partner_ref', '')
        if not partner_ref:
            return _json_response({'error': 'validation_failed', 'details': 'partner_ref obligatoire'}, 400)

        partner = env['res.partner'].sudo().search([('ref', '=', partner_ref)], limit=1)
        if not partner:
            return _json_response({
                'error': 'partner_not_found',
                'details': f'Partner ref={partner_ref} non trouvé',
            }, 400)

        event_type = payload.get('event_type', 'payment_received')
        payment_type = 'inbound' if event_type == 'payment_received' else 'outbound'
        partner_type = 'customer' if payment_type == 'inbound' else 'supplier'
        journal_type = 'bank'
        journal = env['account.journal'].sudo().search([
            ('type', '=', journal_type),
            ('company_id', '=', env.company.id),
        ], limit=1)
        if not journal:
            return _json_response({'error': 'config_error', 'details': 'Journal bancaire introuvable'}, 500)

        amount = float(payload.get('amount', 0) or 0)
        date_str = payload.get('date', '')[:10]
        payment_date = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else datetime.now().date()

        payment_vals = {
            'payment_type': payment_type,
            'partner_type': partner_type,
            'partner_id': partner.id,
            'amount': amount,
            'journal_id': journal.id,
            'date': payment_date,
            'payment_reference': payload.get('payment_id', ''),
        }

        try:
            payment = env['account.payment'].sudo().create(payment_vals)
            payment.action_post()
        except Exception as e:
            _logger.exception('payment create failed')
            return _json_response({'error': 'create_failed', 'details': str(e)}, 500)

        # E6-US4bis : allocation FIFO paiement → factures
        allocations = _allocate_fifo(env, payment)
        details_json = json.dumps({'allocations': allocations}) if allocations else None

        Mapping.sudo().create({
            'event_id': event_id,
            'tenant': payload.get('tenant', ''),
            'model': 'account.payment',
            'res_id': payment.id,
            'status': 'applied',
            'details_json': details_json,
        })

        return _json_response({
            'payment_id': payment.id,
            'status': 'applied',
            'allocations': allocations,
            'warnings': [],
        }, 201)

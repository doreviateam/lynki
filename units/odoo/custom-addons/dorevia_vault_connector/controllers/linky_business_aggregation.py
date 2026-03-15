# -*- coding: utf-8 -*-
"""
Endpoint Linky — Agrégation ventes / achats (carte Business)

GET /dorevia/vault/linky_business_aggregation
Appelé par Linky (ou Vault) pour afficher les totaux ERP quand le tenant (ex. o19)
privilégie la source Odoo plutôt que les seuls documents vaultés.
Retourne : sales (total_ht, total, total_tax, invoices_count, series), purchases (idem).

Sécurité : si dorevia.linky.internal.token ou ODOO_LINKY_INTERNAL_TOKEN est défini,
l'appel doit fournir Authorization: Bearer <token> ou X-Internal-Token: <token>.
Performance : agrégation via read_group (SQL) au lieu de search + boucle.
"""

import logging
import os
from collections import defaultdict

from odoo import http, SUPERUSER_ID
from odoo.http import request, Response

_logger = logging.getLogger(__name__)


def _json_response(data, status=200):
    return Response(
        __import__("json").dumps(data, default=str),
        status=status,
        mimetype="application/json",
    )


def _check_internal_token(req):
    """Vérifie le token API interne si configuré. Retourne (ok, response_or_none)."""
    try:
        icp = request.env["ir.config_parameter"].sudo()
        expected = icp.get_param("dorevia.linky.internal.token", "") or os.environ.get("ODOO_LINKY_INTERNAL_TOKEN", "")
    except Exception:
        expected = os.environ.get("ODOO_LINKY_INTERNAL_TOKEN", "")
    if not expected:
        return True, None
    auth = req.httprequest.headers.get("Authorization") or req.httprequest.headers.get("X-Internal-Token")
    if auth and auth.startswith("Bearer "):
        token = auth[7:].strip()
    elif auth:
        token = auth.strip()
    else:
        token = ""
    if token != expected:
        return False, _json_response({"error": "Unauthorized"}, status=403)
    return True, None


def _aggregate_moves_read_group(env, company, date_from, date_to, invoice_types, refund_types):
    """
    Agrège via read_group (SQL) pour performance. Retourne total, total_ht, total_tax,
    invoices_count, series (YYYY-MM -> amount), currency (devise de la société).
    """
    Move = env["account.move"].sudo()
    base_domain = [
        ("state", "=", "posted"),
        ("invoice_date", ">=", date_from),
        ("invoice_date", "<=", date_to),
    ]
    if company:
        base_domain.append(("company_id", "=", company.id))

    # Devise : société (préconisation revue technique — cohérence multi-devise)
    currency = (company.currency_id.name or "EUR") if company else "EUR"

    domain_inv = base_domain + [("move_type", "in", list(invoice_types))]
    domain_refund = base_domain + [("move_type", "in", list(refund_types))]

    def read_series(domain):
        try:
            return Move.read_group(
                domain,
                ["amount_total:sum", "amount_untaxed:sum"],
                ["invoice_date:month"],
                lazy=False,
            )
        except Exception:
            return []

    rows_inv = read_series(domain_inv)
    rows_refund = read_series(domain_refund)

    by_month_inv = {(r["invoice_date:month"] or ""): {"total": r.get("amount_total") or 0, "ht": r.get("amount_untaxed") or 0} for r in rows_inv}
    by_month_refund = {(r["invoice_date:month"] or ""): {"total": r.get("amount_total") or 0, "ht": r.get("amount_untaxed") or 0} for r in rows_refund}

    def _norm_month(k):
        s = str(k)
        return s[:7] if len(s) >= 7 else s  # "2026-03-01" -> "2026-03"

    by_month_inv_norm = {_norm_month(k): v for k, v in by_month_inv.items()}
    by_month_refund_norm = {_norm_month(k): v for k, v in by_month_refund.items()}
    all_months = sorted(set(by_month_inv_norm) | set(by_month_refund_norm))
    series = []
    total = 0.0
    total_ht = 0.0
    for period in all_months:
        inv = by_month_inv_norm.get(period, {"total": 0, "ht": 0})
        ref = by_month_refund_norm.get(period, {"total": 0, "ht": 0})
        # Avoirs en négatif (alignement logique métier)
        net_total = (inv["total"] or 0) - (ref["total"] or 0)
        net_ht = (inv["ht"] or 0) - (ref["ht"] or 0)
        series.append({"period": period, "amount": round(net_total, 2)})
        total += net_total
        total_ht += net_ht

    count_inv = Move.search_count(domain_inv)
    count_refund = Move.search_count(domain_refund)
    total_tax = max(0, total - total_ht)

    return {
        "total": round(total, 2),
        "total_ht": round(total_ht, 2),
        "total_tax": round(total_tax, 2),
        "invoices_count": count_inv + count_refund,
        "series": series,
        "currency": currency,
    }


class LinkyBusinessAggregationController(http.Controller):
    """Contrôleur pour l'endpoint Linky business aggregation (ventes + achats)."""

    @http.route(
        "/dorevia/vault/linky_business_aggregation",
        type="http",
        methods=["GET"],
        auth="public",
        csrf=False,
    )
    def linky_business_aggregation(self, company_id=None, date_from=None, date_to=None, **kwargs):
        """
        Retourne les agrégats ventes et achats depuis account.move (postés).
        Paramètres : company_id (optionnel), date_from/date_to (optionnel, YYYY-MM-DD).
        Format compatible avec les réponses Vault /ui/aggregations/sales et /ui/aggregations/purchases.
        """
        ok, err_response = _check_internal_token(request)
        if not ok:
            return err_response

        try:
            env = request.env(user=SUPERUSER_ID)
            company = env.company
            if company_id:
                try:
                    cid_str = str(company_id).split(":")[-1]
                    cid = int(cid_str)
                    company = env["res.company"].sudo().browse(cid)
                    if not company.exists():
                        company = env.company
                except (ValueError, TypeError):
                    pass
            if not date_from:
                date_from = "2000-01-01"
            if not date_to:
                date_to = "2030-12-31"

            tenant = kwargs.get("tenant") or "o19"
            granularity = kwargs.get("granularity") or "month"

            sales = _aggregate_moves_read_group(
                env, company, date_from, date_to,
                ("out_invoice",), ("out_refund",),
            )
            purchases = _aggregate_moves_read_group(
                env, company, date_from, date_to,
                ("in_invoice",), ("in_refund",),
            )

            sales_resp = {
                "tenant": tenant,
                "scope": "invoice.posted",
                "currency": sales["currency"],
                "total": sales["total"],
                "total_ht": sales["total_ht"],
                "total_tax": sales["total_tax"],
                "invoices_count": sales["invoices_count"],
                "posted_sales_count": sales["invoices_count"],
                "from": date_from,
                "to": date_to,
                "effective_from": date_from,
                "effective_to": date_to,
                "granularity": granularity,
                "series": sales["series"],
                "last_seal_at": None,
                "verifiable": True,
            }
            purchases_resp = {
                "tenant": tenant,
                "scope": "invoice.posted",
                "currency": purchases["currency"],
                "total": purchases["total"],
                "total_ht": purchases["total_ht"],
                "total_tax": purchases["total_tax"],
                "invoices_count": purchases["invoices_count"],
                "posted_purchases_count": purchases["invoices_count"],
                "from": date_from,
                "to": date_to,
                "effective_from": date_from,
                "effective_to": date_to,
                "granularity": granularity,
                "series": purchases["series"],
                "last_seal_at": None,
                "verifiable": True,
            }

            return _json_response({
                "sales": sales_resp,
                "purchases": purchases_resp,
            })
        except Exception as e:
            _logger.exception("linky_business_aggregation failed: %s", e)
            return _json_response({"error": str(e)}, status=500)

# -*- coding: utf-8 -*-
"""
Endpoint backfill — Types de journal des paiements (SPEC_BACKFILL_PAIEMENTS_ESPECES_BANQUE_v1.0)

GET /dorevia/vault/payment_journal_types?payment_ids=1,2,3
Retourne { "1": "cash", "2": "transfer", "3": "check" } pour le backfill Vault.
Mapping : journal.type=='cash'→cash, payment_method.code=='check'→check, sinon transfer.
Note : CB sur journal bank → transfer (tant qu'il n'y a pas de payment_method dédié).
"""

import json
import logging

from odoo import http

_logger = logging.getLogger(__name__)


class PaymentJournalTypesController(http.Controller):
    """Contrôleur pour l'endpoint backfill payment_journal_types."""

    @http.route(
        "/dorevia/vault/payment_journal_types",
        type="http",
        methods=["GET"],
        auth="public",
        csrf=False,
    )
    def payment_journal_types(self, payment_ids=None, token=None, **kwargs):
        """
        Retourne le mapping ID paiement → method Vault (cash, transfer, check).
        Paramètres : payment_ids (obligatoire, ex. "1,2,3"), token (optionnel).
        """
        if not payment_ids:
            return self._json_response({})
        try:
            ids = [int(x.strip()) for x in payment_ids.split(",") if x.strip().isdigit()]
        except (ValueError, TypeError):
            return self._json_response({})
        if not ids:
            return self._json_response({})

        # Garde-fou (optionnel) : vérifier token si configuré
        if token:
            icp = http.request.env["ir.config_parameter"].sudo()
            expected = icp.get_param("dorevia.vault.backfill.token", "")
            if expected and token != expected:
                return http.Response("Forbidden", status=403)

        env = http.request.env(su=True)
        Payment = env["account.payment"]
        payments = Payment.browse(ids).exists()
        result = {}
        for p in payments:
            # Réutilise la logique du modèle (cohérent avec _build_dvig_payload)
            result[str(p.id)] = p._vault_payment_method()
        return self._json_response(result)

    def _json_response(self, data):
        return http.Response(
            json.dumps(data, ensure_ascii=True),
            status=200,
            mimetype="application/json",
        )

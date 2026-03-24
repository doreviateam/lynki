# -*- coding: utf-8 -*-
"""
Push des écritures comptables Odoo (account.move.line, posted) vers le Vault.
Sprint 04 T21 — migration 047_account_move_lines.sql — extension couverture trial_balance.
ADR : ZeDocs/web57/ADR_T19_TRIAL_BALANCE_EXTENSION.md

Endpoint Vault : POST /api/v1/account-move-lines (header X-Tenant requis).
Mode : CRON quotidien (rattrapage J-1) + push ponctuel sur demande.
Idempotence : (tenant, move_id, line_id) — doublons ignorés côté Vault.
"""
import logging
import os
from datetime import date, timedelta

import requests

from odoo import api, models

_logger = logging.getLogger(__name__)

# Taille du batch d'envoi vers le Vault
BATCH_SIZE = 500
# Limite de lignes par exécution CRON (évite les timeout)
CRON_LINE_LIMIT = 5000


class DoreviaAccountMoveLinesPush(models.Model):
    _name = "dorevia.account.move.lines.push"
    _description = "Push écritures comptables posted vers Vault (extension trial_balance)"

    @api.model
    def _get_config(self):
        """Config Vault pour le push account_move_lines."""
        icp = self.env["ir.config_parameter"].sudo()
        vault_url = (
            icp.get_param("dorevia.vault.url", "") or os.environ.get("ODOO_VAULT_URL", "")
        ).rstrip("/")
        token = (
            icp.get_param("dorevia.vault.token", "")
            or icp.get_param("dorevia.stock_valuation.token", "")
            or os.environ.get("VAULT_INTERNAL_TOKEN", "")
        )
        tenant = (
            icp.get_param("dorevia.tenant", "")
            or os.environ.get("ODOO_TENANT", "")
            or os.environ.get("ODOO_DVIG_TENANT", "")
            or "default"
        )
        return {"vault_url": vault_url, "token": token, "tenant": tenant}

    @api.model
    def _fetch_posted_move_lines(self, date_from, date_to, company_ids=None, limit=CRON_LINE_LIMIT):
        """Récupère les écritures posted pour la période donnée.

        Filtre : state='posted', date in [date_from, date_to].
        Exclut les comptes de type 'liquidity' (banque) si non pertinent — paramétrable.
        """
        domain = [
            ("parent_state", "=", "posted"),
            ("date", ">=", date_from),
            ("date", "<=", date_to),
        ]
        if company_ids:
            domain.append(("company_id", "in", company_ids))

        AML = self.env["account.move.line"].sudo()
        lines = AML.search(domain, limit=limit, order="date asc, move_id asc, id asc")
        return lines

    @api.model
    def _push_lines_to_vault(self, move_lines, config):
        """Envoie les écritures vers le Vault en batches.

        Retourne (total_sent, total_errors).
        """
        vault_url = config["vault_url"]
        token = config["token"]
        tenant = config["tenant"]

        if not vault_url or not token:
            _logger.warning("account_move_lines_push: config Vault manquante (vault_url ou token vide)")
            return 0, 0

        url = f"{vault_url}/api/v1/account-move-lines"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "X-Tenant": tenant,
        }

        total_sent = 0
        total_errors = 0

        # Traitement par batch
        all_lines = list(move_lines)
        for i in range(0, len(all_lines), BATCH_SIZE):
            batch = all_lines[i : i + BATCH_SIZE]
            payload_lines = []
            for l in batch:
                partner_id = l.partner_id.id if l.partner_id else None
                partner_name = (l.partner_id.display_name or "")[:512] if l.partner_id else ""
                line_data = {
                    "move_id": l.move_id.id,
                    "line_id": l.id,
                    "line_date": str(l.date),
                    "account_code": l.account_id.code or "",
                    "journal_code": l.journal_id.code or "",
                    "debit": float(l.debit),
                    "credit": float(l.credit),
                    "currency": l.currency_id.name if l.currency_id else "EUR",
                    "state": "posted",
                    "company_id": l.company_id.id if l.company_id else None,
                    "partner_id": partner_id,
                    "partner_name": partner_name,
                }
                if hasattr(l, "date_maturity") and l.date_maturity:
                    line_data["date_maturity"] = str(l.date_maturity)
                if hasattr(l, "full_reconcile_id") and l.full_reconcile_id:
                    line_data["full_reconcile_id"] = l.full_reconcile_id.id
                if hasattr(l, "matching_number") and l.matching_number:
                    line_data["matching_number"] = str(l.matching_number)
                payload_lines.append(line_data)

            if not payload_lines:
                continue

            try:
                resp = requests.post(
                    url,
                    json={"lines": payload_lines},
                    headers=headers,
                    timeout=30,
                )
                if resp.ok:
                    data = resp.json()
                    count = data.get("count", len(payload_lines))
                    total_sent += count
                    _logger.debug(
                        "account_move_lines_push: batch ok tenant=%s count=%s",
                        tenant, count,
                    )
                else:
                    total_errors += len(payload_lines)
                    _logger.warning(
                        "account_move_lines_push: vault resp status=%s body=%s",
                        resp.status_code, resp.text[:200],
                    )
            except Exception as e:
                total_errors += len(payload_lines)
                _logger.warning("account_move_lines_push: erreur POST %s: %s", url, e, exc_info=True)

        return total_sent, total_errors

    @api.model
    def cron_push_account_move_lines(self):
        """CRON quotidien — push des écritures J-1 (rattrapage glissant sur 30 jours).

        Stratégie : fenêtre glissante pour garantir que les écritures modifiées
        ou postées en retard sont bien capturées.
        """
        config = self._get_config()
        today = date.today()
        date_to = today - timedelta(days=1)
        date_from = date_to - timedelta(days=30)

        _logger.info(
            "account_move_lines_push: cron start date_from=%s date_to=%s",
            date_from, date_to,
        )

        move_lines = self._fetch_posted_move_lines(
            date_from=str(date_from),
            date_to=str(date_to),
            limit=CRON_LINE_LIMIT,
        )

        if not move_lines:
            _logger.info("account_move_lines_push: aucune écriture à pousser")
            return

        sent, errors = self._push_lines_to_vault(move_lines, config)
        _logger.info(
            "account_move_lines_push: cron done sent=%s errors=%s",
            sent, errors,
        )

    @api.model
    def push_period(self, date_from, date_to, company_ids=None):
        """Push manuel pour une période arbitraire — appel depuis l'interface ou un script.

        Exemple : self.env['dorevia.account.move.lines.push'].push_period('2026-01-01', '2026-03-31')
        """
        config = self._get_config()
        move_lines = self._fetch_posted_move_lines(
            date_from=date_from,
            date_to=date_to,
            company_ids=company_ids,
            limit=50_000,
        )
        if not move_lines:
            return {"sent": 0, "errors": 0, "message": "Aucune écriture trouvée"}

        sent, errors = self._push_lines_to_vault(move_lines, config)
        return {"sent": sent, "errors": errors}

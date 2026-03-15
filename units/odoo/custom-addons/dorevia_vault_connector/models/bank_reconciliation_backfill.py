# -*- coding: utf-8 -*-
"""
Backfill RECONCIL — Initialisation de la projection bank_reconciliation (SPEC web16)

Envoie l'état courant des lignes de relevé bancaire (account.bank.statement.line)
vers Vault via DVIG (bank.move.reconciled / bank.move.unreconciled).

Référence : ZeDocs/web16/RECONCIL_BACKFILL_SPEC_v1.0.md
"""

import logging
import time
from datetime import datetime, timezone

import requests

from odoo import api, models

_logger = logging.getLogger(__name__)

BATCH_SIZE = 50
BATCH_DELAY_SEC = 0.1


class BankReconciliationBackfill(models.Model):
    """Service de backfill pour la projection RECONCIL (SPEC web16)."""

    _name = "bank.reconciliation.backfill"
    _description = "Backfill rapprochement bancaire vers Vault (RECONCIL)"

    @api.model
    def run_backfill(self, company_id=None):
        """
        Lance le backfill : envoie toutes les lignes de relevé bancaire postées
        vers DVIG (event_type bank.move.reconciled ou bank.move.unreconciled).

        :param company_id: ID de la société (optionnel). Si absent, utilise la société courante.
        :return: dict avec sent, errors, duration_sec, message
        """
        cfg = self.env["dorevia.dvig.service"].get_dvig_config()
        tenant = cfg["tenant"]
        dvig_url = cfg["dvig_url"]
        dvig_token = cfg["dvig_token"]
        dvig_source = cfg["dvig_source"]

        if not dvig_url or not dvig_token:
            return {
                "sent": 0,
                "errors": 0,
                "duration_sec": 0,
                "message": "Configuration DVIG manquante (dorevia.dvig.url/token ou ODOO_DVIG_URL/ODOO_DVIG_TOKEN)",
            }

        # Société
        if company_id:
            company = self.env["res.company"].sudo().browse(company_id)
        else:
            company = self.env.company
        if not company.exists():
            return {"sent": 0, "errors": 0, "duration_sec": 0, "message": "Société introuvable"}

        # Fallback tenant sarl-la-platine
        if tenant == "sarl-la-platine" and not company.id:
            platine = (
                self.env["res.company"]
                .sudo()
                .search([("name", "ilike", "la platine")], limit=1)
            )
            if platine:
                company = platine

        # Lignes de relevé postées (Odoo 17+ : state sur la ligne ; fallback : statement posté)
        Line = self.env["account.bank.statement.line"].sudo()
        domain = [("journal_id.company_id", "=", company.id)]
        if "state" in Line._fields:
            domain.append(("state", "=", "posted"))
        else:
            # Fallback Odoo 18 : filtrer par statement posté
            domain.append(("statement_id.state", "=", "posted"))
        lines = Line.search(domain)
        total = len(lines)

        if total == 0:
            return {
                "sent": 0,
                "errors": 0,
                "duration_sec": 0,
                "message": "Aucune ligne de relevé bancaire postée à traiter",
            }

        start = time.time()
        sent = 0
        errors = 0
        # Même pattern que account_payment : dvig_url peut inclure /api/v1 ou non
        url = f"{dvig_url.rstrip('/')}/ingest"

        for i, line in enumerate(lines):
            try:
                payload = self._build_backfill_payload(line, tenant, dvig_source)
                resp = requests.post(
                    url,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {dvig_token}",
                        "Content-Type": "application/json",
                    },
                    timeout=30,
                )
                resp.raise_for_status()
                sent += 1
            except Exception as e:
                errors += 1
                _logger.warning(
                    "backfill_reconcil_error line_id=%s error=%s", line.id, e
                )

            if (i + 1) % BATCH_SIZE == 0:
                time.sleep(BATCH_DELAY_SEC)

        duration = time.time() - start

        # Déclencher le worker DVIG pour traiter l'outbox
        try:
            dvig_service = self.env["dorevia.dvig.service"]
            dvig_service.trigger_worker(limit=200)
        except Exception:
            pass

        msg = f"Backfill terminé : {sent} envoyés, {errors} erreurs sur {total} lignes ({duration:.1f}s)"
        _logger.info("backfill_reconcil_done %s", msg)

        return {
            "sent": sent,
            "errors": errors,
            "total": total,
            "duration_sec": round(duration, 1),
            "message": msg,
        }

    def _build_backfill_payload(self, line, tenant, dvig_source):
        """Construit le payload DVIG pour une ligne (SPEC RECONCIL Backfill)."""
        event_type = (
            "bank.move.reconciled" if line.is_reconciled else "bank.move.unreconciled"
        )
        idempotency_key = f"reconcil_backfill:{tenant}:bsl:{line.id}"

        occurred_at = line.date
        if hasattr(line, "statement_id") and line.statement_id:
            occurred_at = line.statement_id.date or line.date
        if occurred_at:
            if hasattr(occurred_at, "isoformat"):
                occurred_at_str = occurred_at.isoformat()
            else:
                occurred_at_str = str(occurred_at)
            if "T" not in occurred_at_str:
                occurred_at_str = f"{occurred_at_str}T00:00:00Z"
        else:
            occurred_at_str = datetime.now(timezone.utc).isoformat()

        amount = float(line.amount) if line.amount else 0.0
        account_id = None
        if line.journal_id and hasattr(line.journal_id, "default_account_id"):
            acc = line.journal_id.default_account_id
            if acc:
                account_id = acc.id

        company_id = line.journal_id.company_id.id if line.journal_id else None
        currency = "EUR"
        if hasattr(line, "currency_id") and line.currency_id:
            currency = line.currency_id.name or "EUR"
        elif hasattr(line, "journal_id") and line.journal_id and line.journal_id.currency_id:
            currency = line.journal_id.currency_id.name or "EUR"

        data = {
            "model": "account.bank.statement.line",
            "move_id": line.id,
            "move_line_id": line.id,
            "amount": amount,
            "currency": currency,
            "company_id": company_id,
            "occurred_at": occurred_at_str,
        }
        if account_id is not None:
            data["account_id"] = account_id

        return {
            "event_type": event_type,
            "source": dvig_source,
            "idempotency_key": idempotency_key,
            "timestamp": occurred_at_str,
            "data": data,
        }

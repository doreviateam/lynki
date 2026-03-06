# -*- coding: utf-8 -*-
"""
RECONCIL temps réel — Détection des transitions is_reconciled (SPEC web16 / Confirmation Bancaire v1.3)

Émet bank.move.reconciled ou bank.move.unreconciled vers DVIG lorsque :
- reconcile_bank_line() / unreconcile_bank_line() (OCA) sont appelés ;
- ou write() modifie is_reconciled (fallback si champ écrit directement).

Format v1.2 (SPEC Confirmation Bancaire) : impacted_documents pour agrégation confirmation.
"""

import logging
from collections import namedtuple
from datetime import datetime, timezone

import requests

from odoo import api, models

_logger = logging.getLogger(__name__)

ImpactedDocument = namedtuple("ImpactedDocument", ["odoo_model", "odoo_id", "amount_abs"])


class AccountBankStatementLine(models.Model):
    _inherit = "account.bank.statement.line"

    def reconcile_bank_line(self):
        """Override OCA : émettre bank.move.reconciled après lettrage."""
        res = super().reconcile_bank_line()
        for line in self:
            try:
                impacted = line._traverse_to_impacted_documents()
                line._emit_reconciliation_event(True, impacted)
            except Exception as e:
                _logger.warning(
                    "reconcil_emit_error reconcile_bank_line line_id=%s error=%s",
                    line.id,
                    e,
                )
        return res

    def unreconcile_bank_line(self):
        """Override OCA : capturer impacted_documents AVANT délettrage puis émettre bank.move.unreconciled."""
        impacted_per_line = {}
        for line in self:
            if line.is_reconciled:
                impacted_per_line[line.id] = line._traverse_to_impacted_documents()
        res = super().unreconcile_bank_line()
        for line in self:
            try:
                line._emit_reconciliation_event(False, impacted_per_line.get(line.id, []))
            except Exception as e:
                _logger.warning(
                    "reconcil_emit_error unreconcile_bank_line line_id=%s error=%s",
                    line.id,
                    e,
                )
        return res

    def write(self, vals):
        # Capturer impacted_documents AVANT write pour unreconcile
        to_emit = []
        impacted_before = {}
        if "is_reconciled" in vals:
            new_val = vals["is_reconciled"]
            for line in self:
                old_val = line.is_reconciled
                if old_val != new_val:
                    to_emit.append((line, new_val))
                    if not new_val and old_val:
                        impacted_before[line.id] = line._traverse_to_impacted_documents()

        res = super().write(vals)

        # Émettre vers DVIG après write réussi
        for line, is_reconciled in to_emit:
            try:
                if is_reconciled:
                    impacted = line._traverse_to_impacted_documents()
                else:
                    impacted = impacted_before.get(line.id, [])
                line._emit_reconciliation_event(is_reconciled, impacted)
            except Exception as e:
                _logger.warning(
                    "reconcil_emit_error line_id=%s is_reconciled=%s error=%s",
                    line.id,
                    is_reconciled,
                    e,
                )

        return res

    def _traverse_to_impacted_documents(self):
        """Traverse BSL → reconciled move lines → payment + amount_abs (SPEC v1.3 §9.1).

        Gère écritures directes (payment.move_id) et indirectes (facture ↔ paiement,
        chaînes multi-sauts). Utilise _all_partials_lines (OCA) si disponible pour
        couvrir l'arbre complet de réconciliation.
        """
        self.ensure_one()
        if not self.is_reconciled:
            return []

        results = []
        other_lines = []
        liquidity_lines = self.env["account.move.line"]
        if hasattr(self, "_seek_for_lines"):
            liq, _sus, other_lines = self._seek_for_lines()
            liquidity_lines = liq if liq else liquidity_lines
        else:
            if not self.move_id:
                return []
            move = self.move_id
            bank_account = self.journal_id.default_account_id if self.journal_id else None
            if not bank_account:
                return []
            liquidity_lines = move.line_ids.filtered(
                lambda l: l.account_id == bank_account
                and (l.matched_debit_ids or l.matched_credit_ids)
            )
            collected = []
            for liq in liquidity_lines:
                partials = liq.matched_debit_ids | liq.matched_credit_ids
                for p in partials:
                    counterpart = (
                        p.debit_move_id if p.credit_move_id == liq else p.credit_move_id
                    )
                    if counterpart.move_id != move:
                        collected.append(counterpart)
            other_lines = (
                self.env["account.move.line"].browse([l.id for l in collected])
                if collected
                else self.env["account.move.line"]
            )

        bsl_currency = (
            self.currency_id or self.journal_id.currency_id or self.env.company.currency_id
        ).name

        for aml in other_lines:
            move = aml.move_id
            if not move:
                continue
            amount_abs = abs(aml.balance) if aml.balance else abs(aml.amount_currency or 0.0)

            # 1. Direct : move = payment.move_id (paiement enregistré)
            payment = self.env["account.payment"].sudo().search(
                [("move_id", "=", move.id)], limit=1
            )
            if payment:
                pay_currency = (
                    payment.currency_id or self.env.company.currency_id
                ).name
                if pay_currency != bsl_currency:
                    continue
                results.append(
                    ImpactedDocument("account.payment", payment.id, round(amount_abs, 2))
                )
                continue

            # 2. Indirect : remonter la chaîne de réconciliation (facture ↔ paiement, ou écritures intermédiaires)
            # Parcourir récursivement les counterpart jusqu'à trouver un payment
            payment = None
            processed = set()
            to_check = [aml]

            while to_check and not payment:
                current = to_check.pop(0)
                if current.id in processed:
                    continue
                processed.add(current.id)
                partials = (
                    (current.matched_debit_ids or self.env["account.partial.reconcile"])
                    | (current.matched_credit_ids or self.env["account.partial.reconcile"])
                )
                for p in partials:
                    counterpart = (
                        p.debit_move_id
                        if p.credit_move_id == current
                        else p.credit_move_id
                    )
                    if counterpart.id in processed or counterpart.move_id == move:
                        continue
                    pay = self.env["account.payment"].sudo().search(
                        [("move_id", "=", counterpart.move_id.id)], limit=1
                    )
                    if pay:
                        payment = pay
                        break
                    to_check.append(counterpart)
                if payment:
                    break
            if payment:
                pay_currency = (
                    payment.currency_id or self.env.company.currency_id
                ).name
                if pay_currency != bsl_currency:
                    continue
                results.append(
                    ImpactedDocument("account.payment", payment.id, round(amount_abs, 2))
                )
                continue

            try:
                pos_model = self.env["pos.payment"].sudo()
                if "account_move_id" in pos_model._fields:
                    pos_payment = pos_model.search(
                        [("account_move_id", "=", move.id)], limit=1
                    )
                elif "move_id" in pos_model._fields:
                    pos_payment = pos_model.search([("move_id", "=", move.id)], limit=1)
                else:
                    pos_payment = pos_model.browse([])
            except KeyError:
                pos_payment = self.env["account.move.line"].browse([])
            if pos_payment:
                pay_currency = (
                    pos_payment.currency_id or self.env.company.currency_id
                ).name
                if pay_currency != bsl_currency:
                    continue
                results.append(
                    ImpactedDocument("pos.payment", pos_payment.id, round(amount_abs, 2))
                )
                continue

        # 3. Fallback : arbre complet via _all_partials_lines (OCA) pour écritures indirectes
        if not results and other_lines and hasattr(self, "_all_partials_lines"):
            all_line_ids = set()
            seed = other_lines
            if liquidity_lines:
                seed = liquidity_lines | other_lines
            partials = self._all_partials_lines(seed)
            for p in partials:
                all_line_ids.add(p.debit_move_id.id)
                all_line_ids.add(p.credit_move_id.id)
            amls = self.env["account.move.line"].browse(list(all_line_ids))
            payment_amounts = {}  # payment_id -> amount_abs (éviter doublons)
            pos_amounts = {}  # pos_payment_id -> amount_abs
            for aml in amls:
                if not aml.move_id:
                    continue
                amount_abs = round(
                    abs(aml.balance) if aml.balance else abs(aml.amount_currency or 0.0),
                    2,
                )
                if amount_abs <= 0:
                    continue
                payment = self.env["account.payment"].sudo().search(
                    [("move_id", "=", aml.move_id.id)], limit=1
                )
                if payment:
                    pay_currency = (
                        payment.currency_id or self.env.company.currency_id
                    ).name
                    if pay_currency != bsl_currency:
                        continue
                    if payment.id not in payment_amounts:
                        payment_amounts[payment.id] = amount_abs
                    else:
                        payment_amounts[payment.id] = max(
                            payment_amounts[payment.id], amount_abs
                        )
                else:
                    try:
                        pos_model = self.env["pos.payment"].sudo()
                        if "account_move_id" in pos_model._fields:
                            pos_pay = pos_model.search(
                                [("account_move_id", "=", aml.move_id.id)], limit=1
                            )
                        elif "move_id" in pos_model._fields:
                            pos_pay = pos_model.search(
                                [("move_id", "=", aml.move_id.id)], limit=1
                            )
                        else:
                            pos_pay = self.env["pos.payment"].browse([])
                    except KeyError:
                        pos_pay = self.env["pos.payment"].browse([])
                    if pos_pay:
                        pay_currency = (
                            pos_pay.currency_id or self.env.company.currency_id
                        ).name
                        if pay_currency == bsl_currency:
                            if pos_pay.id not in pos_amounts:
                                pos_amounts[pos_pay.id] = amount_abs
                            else:
                                pos_amounts[pos_pay.id] = max(
                                    pos_amounts[pos_pay.id], amount_abs
                                )
            for pay_id, amt in payment_amounts.items():
                results.append(
                    ImpactedDocument("account.payment", pay_id, amt)
                )
            for pos_id, amt in pos_amounts.items():
                results.append(
                    ImpactedDocument("pos.payment", pos_id, amt)
                )

        return results

    def _emit_reconciliation_event(self, is_reconciled, impacted_documents=None):
        """Envoie bank.move.reconciled ou bank.move.unreconciled vers DVIG (format v1.2)."""
        self.ensure_one()
        icp = self.env["ir.config_parameter"].sudo()
        dvig_url = icp.get_param("dorevia.dvig.url", "").rstrip("/")
        dvig_token = icp.get_param("dorevia.dvig.token", "")
        dvig_source = icp.get_param("dorevia.dvig.source", "")

        if not dvig_url or not dvig_token:
            return

        tenant = icp.get_param("dorevia.tenant", "")
        if not tenant and dvig_source:
            tenant = dvig_source.split(".")[-1] if "." in dvig_source else dvig_source
        if not tenant:
            tenant = "default"
        if not dvig_source:
            dvig_source = f"odoo.stinger.{tenant}"

        event_type = "bank.move.reconciled" if is_reconciled else "bank.move.unreconciled"
        occurred_at = datetime.now(timezone.utc)
        occurred_at_str = occurred_at.isoformat()

        # Clé idempotente stable (SPEC v1.3 §5.3) — max 64 chars
        suffix = "reconcile" if is_reconciled else "unreconcile"
        idempotency_key = f"reconcil:{tenant}:bsl:{self.id}:{suffix}"[:64]

        amount = float(self.amount) if self.amount else 0.0
        account_id = None
        if self.journal_id and hasattr(self.journal_id, "default_account_id"):
            acc = self.journal_id.default_account_id
            if acc:
                account_id = acc.id

        company_id = self.journal_id.company_id.id if self.journal_id else None
        currency = "EUR"
        if hasattr(self, "currency_id") and self.currency_id:
            currency = self.currency_id.name or "EUR"
        elif self.journal_id and self.journal_id.currency_id:
            currency = self.journal_id.currency_id.name or "EUR"

        impacted = impacted_documents or []
        impacted_list = [
            {"odoo_model": d.odoo_model, "odoo_id": d.odoo_id, "amount_abs": d.amount_abs}
            for d in impacted
        ]

        data = {
            "model": "account.bank.statement.line",
            "move_id": self.id,
            "move_line_id": self.id,
            "bank_statement_line_id": self.id,
            "amount": amount,
            "currency": currency,
            "company_id": company_id,
            "occurred_at": occurred_at_str,
            "impacted_documents": impacted_list,
        }
        if account_id is not None:
            data["account_id"] = account_id

        payload = {
            "event_type": event_type,
            "source": dvig_source,
            "idempotency_key": idempotency_key,
            "timestamp": occurred_at_str,
            "data": data,
        }

        resp = requests.post(
            f"{dvig_url}/ingest",
            json=payload,
            headers={
                "Authorization": f"Bearer {dvig_token}",
                "Content-Type": "application/json",
            },
            timeout=15,
        )
        resp.raise_for_status()

        _logger.info(
            "reconcil_emit_ok line_id=%s event_type=%s",
            self.id,
            event_type,
        )

        # Déclencher le worker DVIG
        try:
            self.env["dorevia.dvig.service"].trigger_worker(limit=50)
        except Exception:
            pass

    def backfill_reconciliation_confirmation_events(self, batch_size=100):
        """Backfill : émet bank.move.reconciled pour les lignes rapprochées non encore envoyées (SPEC v1.3).

        Utilisé par CRON ou action manuelle. Idempotent via clé stable.
        """
        icp = self.env["ir.config_parameter"].sudo()
        last_id = int(icp.get_param("dorevia.vault.reconcil_backfill_last_bsl_id", "0"))
        lines = self.search(
            [("is_reconciled", "=", True), ("id", ">", last_id)],
            order="id asc",
            limit=batch_size,
        )
        processed = 0
        max_id = last_id
        for line in lines:
            try:
                impacted = line._traverse_to_impacted_documents()
                line._emit_reconciliation_event(True, impacted)
                processed += 1
                max_id = max(max_id, line.id)
            except Exception as e:
                _logger.warning(
                    "reconcil_backfill_error line_id=%s error=%s",
                    line.id,
                    e,
                )
        if max_id > last_id:
            icp.set_param("dorevia.vault.reconcil_backfill_last_bsl_id", str(max_id))
        if processed:
            _logger.info(
                "reconcil_backfill_ok processed=%s max_bsl_id=%s",
                processed,
                max_id,
            )
        return processed

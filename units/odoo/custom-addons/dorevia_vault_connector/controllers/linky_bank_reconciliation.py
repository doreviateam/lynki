# -*- coding: utf-8 -*-
"""
Endpoint Linky — Santé du rapprochement bancaire (SPEC web15 / Trésorerie v1.1)

GET /dorevia/vault/linky_bank_reconciliation
Appelé par Vault (proxy bank-reconciliation-health) pour alimenter la carte Trésorerie validée.
Retourne : unreconciled_entries, last_statement_date, bank_accounts_count,
           oldest_unreconciled_date, reconciliation_rate, unreconciled_amount.
"""

import json
import logging
from odoo import http, SUPERUSER_ID
from odoo.http import request, Response

_logger = logging.getLogger(__name__)


def _json_response(data, status=200):
    return Response(
        json.dumps(data, default=str),
        status=status,
        mimetype="application/json",
    )


class LinkyBankReconciliationController(http.Controller):
    """Contrôleur pour l'endpoint Linky bank reconciliation health."""

    @http.route(
        "/dorevia/vault/linky_bank_reconciliation",
        type="http",
        methods=["GET"],
        auth="public",
        csrf=False,
    )
    def linky_bank_reconciliation(self, company_id=None, date_from=None, date_to=None, **kwargs):
        """
        Retourne les métriques de rapprochement bancaire pour Linky.
        Paramètres : company_id (optionnel), date_from/date_to (optionnel, YYYY-MM-DD), tenant (optionnel).
        SPEC Carte Paiements v1.1 : payments_posted_count, payments_posted_sum_amount_signed (contrôle complétude).
        """
        stub = {
            "reconciliation_rate": None,
            "last_statement_date": None,
            "unreconciled_entries": 0,
            "unreconciled_amount": 0.0,
            "bank_accounts_count": 0,
            "oldest_unreconciled_date": None,
        }

        try:
            env = request.env(user=SUPERUSER_ID)

            # Filtre société : company_id > tenant > défaut
            company = env.company
            if company_id:
                try:
                    cid_str = str(company_id).split(":")[-1]  # "odoo:1" → "1"
                    cid = int(cid_str)
                    company = env["res.company"].sudo().browse(cid)
                    if not company.exists():
                        return _json_response(stub)
                except (ValueError, TypeError):
                    pass
            elif kwargs.get("tenant") == "sarl-la-platine":
                # Fallback : cibler SARL La Platine quand tenant=sarl-la-platine et pas de company_id
                platine = env["res.company"].sudo().search([("name", "ilike", "la platine")], limit=1)
                if platine:
                    company = platine

            Line = env["account.bank.statement.line"].sudo()

            # Odoo 18 : inclure TOUTES les lignes bancaires postées (avec ou sans statement_id)
            # Les lignes sans statement sont des transactions non encore regroupées dans un relevé
            line_domain = [
                ("state", "=", "posted"),
                ("journal_id.company_id", "=", company.id),
            ]
            lines = Line.search(line_domain)

            # Agrégations sur bank statement lines
            unreconciled = lines.filtered(lambda l: not l.is_reconciled)
            unreconciled_entries = len(unreconciled)
            unreconciled_amount = sum(unreconciled.mapped("amount")) if unreconciled else 0.0
            total_amount = sum(lines.mapped("amount")) or 0.0
            reconciled_stmt = total_amount - unreconciled_amount

            # Paiements = Encaisseements - Décaissements (avoirs clients + remboursements fournisseurs inclus)
            paiements_net = self._get_payments_net(env, company)
            total_activity_stmt = sum(abs(x) for x in lines.mapped("amount")) if lines else 0.0
            total_activity_ledger = self._get_bank_total_activity(env, company)
            total_activity = paiements_net if (paiements_net is not None and abs(paiements_net) > 1e-9) else None
            if total_activity is None:
                total_activity = total_activity_ledger if (total_activity_ledger or 0) > 1e-9 else total_activity_stmt

            # Logique Linky : En attente = Paiements - Trésorerie validée (montant rapproché).
            bank_balance = self._get_bank_balance(env, company)
            reconciled_base = reconciled_stmt if reconciled_stmt > 0.01 else (abs(bank_balance) if bank_balance else 0)
            if total_activity > 1e-9:
                # Formule : En attente = Paiements - Trésorerie validée
                total_amount = total_activity
                reconciled_amount = reconciled_base
                unreconciled_amount = max(0, total_activity - reconciled_base)
                unreconciled_entries = len(unreconciled) if unreconciled_amount > 0.01 else (max(unreconciled_entries, 1) if unreconciled_amount > 0.01 else 0)

            # Pas de lignes du tout : fallback move_line
            if not lines:
                aml_res = self._unreconciled_from_move_lines(env, company)
                if aml_res:
                    return _json_response(aml_res)
                return _json_response(stub, status=503)

            # Taux de rapprochement (bank statement)
            reconciliation_rate = None
            if abs(total_amount) > 1e-9:
                reconciled_amount = total_amount - unreconciled_amount
                reconciliation_rate = round(100.0 * reconciled_amount / total_amount, 2)

            # Dernier relevé importé (date max des statements des lignes)
            last_statement_date = None
            statements = lines.mapped("statement_id")
            if statements:
                valid_dates = [s.date for s in statements if getattr(s, "date", None)]
                if valid_dates:
                    last_statement_date = max(valid_dates).strftime("%Y-%m-%d")

            # Nombre de journaux bancaires distincts
            journal_ids = lines.mapped("journal_id")
            bank_accounts_count = len(journal_ids)

            # Date de la plus ancienne ligne non rapprochée
            oldest_unreconciled_date = None
            if unreconciled:
                dates = [l.date for l in unreconciled if l.date]
                if dates:
                    min_date = min(dates)
                    oldest_unreconciled_date = min_date.strftime("%Y-%m-%d")

            reconciled_amount = total_amount - unreconciled_amount
            # erp_balance = bank_balance (SPEC Trésorerie v4.1 §5.2) — périmètre §5.2.1
            erp_balance_val = round(bank_balance, 2) if bank_balance is not None else None

            # SPEC Carte Paiements v1.1 — contrôle complétude (payment_date, account.payment uniquement)
            list_ids = kwargs.get("list_ids") in ("1", 1, True)
            completeness = self._get_payments_posted_completeness(
                env, company,
                kwargs.get("date_from"), kwargs.get("date_to"),
                list_ids=list_ids,
            )

            resp = {
                # Bank-reconciliation-health (Linky détail)
                "reconciliation_rate": reconciliation_rate,
                "last_statement_date": last_statement_date,
                "unreconciled_entries": unreconciled_entries,
                "unreconciled_amount": round(unreconciled_amount, 2),
                "bank_accounts_count": bank_accounts_count,
                "oldest_unreconciled_date": oldest_unreconciled_date,
                # Treasury aggregation (Vault /ui/aggregations/treasury) — SPEC v4.1
                "erp_balance": erp_balance_val,
                "reconciled_balance": round(reconciled_amount, 2),
                "unreconciled_balance": round(unreconciled_amount, 2),
                "accounting_balance": round(total_amount, 2),
                "total": round(total_amount, 2),
                # SPEC Carte Paiements v1.1 — contrôle complétude
                "payments_posted_count": completeness["count"],
                "payments_posted_sum_amount_signed": round(completeness["sum_amount_signed"], 2),
            }
            if list_ids and completeness.get("ids"):
                resp["payments_posted_ids"] = completeness["ids"]
            # debug=1 : montants bruts
            if kwargs.get("debug") == "1" or kwargs.get("debug") == 1:
                inbound = env["account.payment"].sudo().search([
                    ("state", "in", ("posted", "reconciled")),
                    ("journal_id.company_id", "=", company.id),
                    ("journal_id.type", "=", "bank"),
                    ("payment_type", "=", "inbound"),
                ])
                outbound = env["account.payment"].sudo().search([
                    ("state", "in", ("posted", "reconciled")),
                    ("journal_id.company_id", "=", company.id),
                    ("journal_id.type", "=", "bank"),
                    ("payment_type", "=", "outbound"),
                ])
                resp["_debug"] = {
                    "company_id": company.id,
                    "company_name": company.name,
                    "lignes_releve_count": len(lines),
                    "paiements_net": round(paiements_net, 2) if paiements_net is not None else None,
                    "paiements_inbound_count": len(inbound),
                    "paiements_outbound_count": len(outbound),
                    "total_activity_stmt": round(total_activity_stmt, 2),
                    "total_activity_ledger": round(total_activity_ledger, 2) if total_activity_ledger is not None else None,
                    "bank_balance": round(bank_balance, 2) if bank_balance is not None else None,
                    "reconciled_stmt": round(reconciled_stmt, 2),
                    "total_amount_raw": round(total_amount, 2),
                }
            return _json_response(resp)

        except Exception as e:
            _logger.exception("linky_bank_reconciliation failed: %s", e)
            return _json_response(stub, status=503)

    def _get_bank_balance(self, env, company):
        """Solde bancaire (erp_balance) — SPEC Trésorerie v4.1 §5.2.1.
        Périmètre : default_account_id des journaux type=bank actifs, écritures posted uniquement.
        """
        try:
            journals = env["account.journal"].sudo().search([
                ("type", "=", "bank"),
                ("company_id", "=", company.id),
            ])
            if not journals:
                return None
            total = 0.0
            for j in journals:
                acc = getattr(j, "default_account_id", None)
                if acc:
                    domain = [
                        ("account_id", "=", acc.id),
                        ("move_id.state", "=", "posted"),
                    ]
                    lines = env["account.move.line"].sudo().search(domain)
                    total += sum(lines.mapped("balance")) or 0.0
            return total if abs(total) > 1e-9 else 0.0
        except Exception as e:
            _logger.warning("_get_bank_balance failed: %s", e)
            return None

    def _get_payments_posted_completeness(self, env, company, date_from=None, date_to=None, list_ids=False):
        """
        SPEC Carte Paiements v1.1 — count et sum(amount_signed) des account.payment posted.
        Périmètre : payment_date (champ date), company.
        Alignement Vault : le connecteur vault tous les payment.posted (bank, cash, transfer).
        Sans filtre journal_id.type pour que count Odoo == count Vault.
        amount_signed : encaissement +, décaissement -.
        Si list_ids=True : retourne aussi la liste des IDs (pour identification des manquants).
        """
        try:
            Payment = env["account.payment"].sudo()
            base_domain = [
                ("state", "in", ("posted", "paid", "in_process", "sent", "reconciled")),
                ("journal_id.company_id", "=", company.id),
            ]
            if date_from:
                base_domain.append(("date", ">=", date_from))
            if date_to:
                base_domain.append(("date", "<=", date_to))

            payments = Payment.search(base_domain, order="id")
            count = len(payments)
            sum_signed = 0.0
            ids = []
            for p in payments:
                amt = float(p.amount) or 0.0
                if p.payment_type == "inbound":
                    sum_signed += amt
                else:
                    sum_signed -= amt
                if list_ids:
                    ids.append(p.id)
            result = {"count": count, "sum_amount_signed": sum_signed}
            if list_ids:
                result["ids"] = ids
            return result
        except Exception as e:
            _logger.warning("_get_payments_posted_completeness failed: %s", e)
            out = {"count": 0, "sum_amount_signed": 0.0}
            if list_ids:
                out["ids"] = []
            return out

    def _get_payments_net(self, env, company):
        """
        Paiements = Encaisseements - Décaissements (account.payment).
        Inclut : paiements clients, remboursements fournisseurs (inbound),
                 paiements fournisseurs, avoirs clients (outbound).
        """
        try:
            Payment = env["account.payment"].sudo()
            base_domain = [
                ("state", "in", ("posted", "reconciled")),
                ("journal_id.company_id", "=", company.id),
                ("journal_id.type", "=", "bank"),
            ]
            inbound = Payment.search(base_domain + [("payment_type", "=", "inbound")])
            outbound = Payment.search(base_domain + [("payment_type", "=", "outbound")])
            encaissements = sum(inbound.mapped("amount")) or 0.0
            decaissements = sum(outbound.mapped("amount")) or 0.0
            return encaissements - decaissements
        except Exception as e:
            _logger.warning("_get_payments_net failed: %s", e)
            return None

    def _get_bank_total_activity(self, env, company):
        """
        Fallback : volume ledger = sum(debit) + sum(credit) sur comptes bancaires.
        Privilégier _get_payments_net (encaissements - décaissements) pour Paiements.
        """
        try:
            journals = env["account.journal"].sudo().search([
                ("type", "=", "bank"),
                ("company_id", "=", company.id),
            ])
            if not journals:
                return None
            total = 0.0
            for j in journals:
                acc = getattr(j, "default_account_id", None)
                if acc:
                    domain = [
                        ("account_id", "=", acc.id),
                        ("move_id.state", "=", "posted"),
                        ("display_type", "not in", ("line_section", "line_note")),
                    ]
                    amls = env["account.move.line"].sudo().search(domain)
                    total += sum(amls.mapped("debit")) + sum(amls.mapped("credit"))
            return total if total > 1e-9 else None
        except Exception as e:
            _logger.warning("_get_bank_total_activity failed: %s", e)
            return None

    def _unreconciled_from_move_lines(self, env, company):
        """Fallback ou complément Odoo 18 : account.move.line (reconciled flag mis à jour au rapprochement)."""
        try:
            AML = env["account.move.line"].sudo()
            base_domain = [
                ("move_id.state", "=", "posted"),
                ("move_id.journal_id.type", "=", "bank"),
                ("move_id.journal_id.company_id", "=", company.id),
            ]
            unreconciled_domain = base_domain + [("reconciled", "=", False)]
            reconciled_domain = base_domain + [("reconciled", "=", True)]
            unreconciled = AML.search(unreconciled_domain)
            reconciled = AML.search(reconciled_domain)
            unreconciled_count = len(unreconciled)
            reconciled_count = len(reconciled)
            # Montant non rapproché = somme des soldes ouverts (balance des lignes unreconciled)
            unreconciled_amount = abs(sum(unreconciled.mapped("balance")) or 0.0)
            total_count = reconciled_count + unreconciled_count
            # Taux basé sur le nombre de lignes (les soldes rapprochés s'annulent)
            rate = (
                round(100.0 * reconciled_count / total_count, 2)
                if total_count > 0
                else (100.0 if unreconciled_count == 0 else 0.0)
            )
            dates = [l.date for l in unreconciled if getattr(l, "date", None)]
            oldest = min(dates).strftime("%Y-%m-%d") if dates else None
            journals = (unreconciled | reconciled).mapped("move_id.journal_id")
            bank_count = len(journals)
            # Répartition montants : unreconciled = ouvert ; total déduit du taux pour cohérence Linky
            total_amt = (
                round(unreconciled_amount / (1 - rate / 100.0), 2)
                if rate < 100 and rate > 0
                else round(unreconciled_amount, 2)
            )
            reconciled_amt = max(0, total_amt - unreconciled_amount)
            return {
                "reconciliation_rate": rate,
                "last_statement_date": None,
                "unreconciled_entries": unreconciled_count,
                "unreconciled_amount": round(unreconciled_amount, 2),
                "bank_accounts_count": bank_count,
                "oldest_unreconciled_date": oldest,
                "reconciled_balance": round(reconciled_amt, 2),
                "unreconciled_balance": round(unreconciled_amount, 2),
                "accounting_balance": round(total_amt, 2),
                "total": round(total_amt, 2),
            }
        except Exception as e:
            _logger.warning("_unreconciled_from_move_lines failed: %s", e)
            return None

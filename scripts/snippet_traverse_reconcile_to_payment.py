# -*- coding: utf-8 -*-
"""
Sprint 0 — Traversée bank_statement_line → impacted_documents (Confirmation Bancaire v1.3)

Usage dans le shell Odoo :
    exec(open('/opt/dorevia-plateform/scripts/snippet_traverse_reconcile_to_payment.py').read())
    bsl = env["account.bank.statement.line"].search([("is_reconciled", "=", True)], limit=1)
    if bsl:
        for d in traverse_bsl_to_impacted_documents(env, bsl=bsl):
            print(f"{d.odoo_model}:{d.odoo_id} amount_abs={d.amount_abs}")

Référence : ZeDocs/web32/SPEC_Confirmation_Bancaire_Stricte_v1.3.md §9.1
"""

from collections import namedtuple

ImpactedDocument = namedtuple("ImpactedDocument", ["odoo_model", "odoo_id", "amount_abs"])


def traverse_bsl_to_impacted_documents(env, bsl):
    """
    Traverse bank_statement_line → reconciled move lines → payment + amount.

    Utilise OCA account_reconcile_oca : _seek_for_lines() → other_lines = counterpart.
    Pour chaque move_line rapprochée : move → payment (via move_id), amount_abs = ABS(balance).

    Returns:
        list[ImpactedDocument]: [{odoo_model, odoo_id, amount_abs}, ...]
    """
    bsl.ensure_one()
    if not bsl.is_reconciled:
        return []

    results = []
    other_lines = []

    # OCA account_reconcile_oca : _seek_for_lines() → (liquidity, suspense, other_lines)
    if hasattr(bsl, "_seek_for_lines"):
        _liquidity, _suspense, other_lines = bsl._seek_for_lines()
    else:
        # Fallback Odoo standard : récupérer les lignes rapprochées via move_id
        if not bsl.move_id:
            return []
        move = bsl.move_id
        bank_account = bsl.journal_id.default_account_id if bsl.journal_id else None
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
            env["account.move.line"].browse([l.id for l in collected])
            if collected
            else env["account.move.line"]
        )

    # Devise ligne bancaire (pour exclusion cross-currency éventuelle)
    bsl_currency = (bsl.currency_id or bsl.journal_id.currency_id or env.company.currency_id).name

    for aml in other_lines:
        move = aml.move_id
        if not move:
            continue

        # amount_abs = ABS(montant sur move_line) — règle §9.1
        amount_abs = abs(aml.balance) if aml.balance else abs(aml.amount_currency or 0.0)

        # account.payment : link via move_id
        payment = env["account.payment"].sudo().search([("move_id", "=", move.id)], limit=1)
        if payment:
            # Exclure cross-currency si besoin (optionnel pour l'audit)
            pay_currency = (payment.currency_id or env.company.currency_id).name
            if pay_currency != bsl_currency:
                continue  # cross-currency, exclure du périmètre V1
            results.append(ImpactedDocument("account.payment", payment.id, round(amount_abs, 2)))
            continue

        # pos.payment : link via account_move_id ou move_id (selon version Odoo)
        try:
            pos_model = env["pos.payment"].sudo()
            if "account_move_id" in pos_model._fields:
                pos_payment = pos_model.search([("account_move_id", "=", move.id)], limit=1)
            elif "move_id" in pos_model._fields:
                pos_payment = pos_model.search([("move_id", "=", move.id)], limit=1)
            else:
                pos_payment = pos_model.browse([])
        except KeyError:
            pos_payment = env["account.move.line"].browse([])  # pos non installé
        if pos_payment:
            pay_currency = (pos_payment.currency_id or env.company.currency_id).name
            if pay_currency != bsl_currency:
                continue
            results.append(ImpactedDocument("pos.payment", pos_payment.id, round(amount_abs, 2)))
            continue

        # Pas un payment vaulté — on ignore (facture, OD, etc.) pour V1
        # Log possible : _logger.debug("skip_non_payment move_id=%s", move.id)

    return results

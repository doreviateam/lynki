# -*- coding: utf-8 -*-
"""Synchro MVP adhérents : lecture payments, filtre Membership + Registered, rapprochement res.partner."""

import logging

from odoo import _, fields
from odoo.exceptions import UserError

from .helloasso_client import (
    HelloAssoClientError,
    fetch_client_credentials_token,
    fetch_form_payments_page,
    form_light_form_type_str,
    form_light_slug,
    resolve_membership_form,
)

_logger = logging.getLogger(__name__)

_PAYMENT_PAGE_SIZE = 50
_MAX_PAYMENT_PAGES = 40

# API HelloAsso (v5) : les montants des paiements sont en centimes (ex. 1000 → 10,00 €).
_HELLOASSO_PAYMENT_CENTS_PER_EURO = 100


def _g(obj, *keys):
    if not isinstance(obj, dict):
        return None
    for k in keys:
        if k in obj:
            return obj[k]
    return None


def payment_eligible_mvp(payment):
    """Filtre MVP : formType Membership, state Registered ; items[].type Membership si présent."""
    order = _g(payment, "order", "Order")
    if not isinstance(order, dict):
        return False
    ft = _g(order, "formType", "FormType")
    ft = (ft or "").strip() if isinstance(ft, str) else str(ft or "").strip()
    if ft != "Membership":
        return False
    st = _g(payment, "state", "State")
    st = (st or "").strip() if isinstance(st, str) else str(st or "").strip()
    if st != "Registered":
        return False
    items = _g(payment, "items", "Items")
    if isinstance(items, list) and len(items) > 0:
        ok = False
        for it in items:
            if not isinstance(it, dict):
                continue
            t = _g(it, "type", "Type")
            t = (t or "").strip() if isinstance(t, str) else str(t or "").strip()
            if t == "Membership":
                ok = True
                break
        if not ok:
            return False
    return True


def _payer_identity(payment):
    payer = _g(payment, "payer", "Payer")
    if not isinstance(payer, dict):
        return "", "", ""
    em = _g(payer, "email", "Email") or ""
    fn = _g(payer, "firstName", "FirstName", "firstname") or ""
    ln = _g(payer, "lastName", "LastName", "lastname") or ""
    return (em or "").strip().lower(), (fn or "").strip(), (ln or "").strip()


def _payment_id(payment):
    v = _g(payment, "id", "Id")
    if v is None:
        return None
    return str(v)


def _parse_payment_datetime(raw):
    if raw is None:
        return False
    try:
        return fields.Datetime.to_datetime(raw)
    except Exception:
        return False


def _payment_trace_vals(payment, form_slug, form_type):
    """Champs traçabilité / contexte depuis un objet payment API (camelCase ou PascalCase)."""
    order = _g(payment, "order", "Order") or {}
    oid = _g(order, "id", "Id")
    pid = _payment_id(payment)
    amount = _g(payment, "amount", "Amount")
    date_raw = _g(payment, "date", "Date")
    mean = _g(payment, "paymentMeans", "PaymentMeans") or _g(
        payment, "paymentOffLineMean", "PaymentOffLineMean"
    )
    if isinstance(mean, dict):
        mean = str(mean)
    elif mean is not None:
        mean = str(mean)
    else:
        mean = ""
    dt = _parse_payment_datetime(date_raw)
    try:
        amt_cents = float(amount) if amount is not None else False
    except (TypeError, ValueError):
        amt_cents = False
    amt_euros = False
    if amt_cents is not False:
        amt_euros = round(amt_cents / _HELLOASSO_PAYMENT_CENTS_PER_EURO, 2)
    return {
        "helloasso_external_id": pid,
        "helloasso_order_id": str(oid) if oid is not None else False,
        "helloasso_source_form": form_slug or False,
        "helloasso_form_type": form_type or False,
        "helloasso_payment_date": dt or False,
        "helloasso_payment_mean": mean or False,
        "helloasso_payment_amount": amt_euros if amt_euros is not False else False,
        "helloasso_sync_status": "synced",
        "helloasso_last_sync_at": fields.Datetime.now(),
    }


def _partner_display_name(firstname, lastname, email):
    parts = [p for p in [firstname, lastname] if p]
    name = " ".join(parts).strip()
    return name or (email or _("Contact HelloAsso"))


def run_membership_payments_sync(
    env, organization_slug, client_id, client_secret, use_sandbox, log_origin=None
):
    """
    Retourne un dict : processed, created, updated, skipped, errors (list of str messages).

    :param log_origin: si renseigné (clé ``origin`` du journal), enregistre une ligne dans
        ``dorevia.helloasso.sync.log`` après exécution.
    """
    Partner = env["res.partner"]
    slug = (organization_slug or "").strip()
    stats = {
        "processed": 0,
        "created": 0,
        "updated": 0,
        "skipped": 0,
        "errors": [],
    }

    try:
        token_payload = fetch_client_credentials_token(
            client_id, client_secret, use_sandbox
        )
    except HelloAssoClientError as err:
        raise UserError(str(err)) from err

    token = token_payload["access_token"]
    membership_form = resolve_membership_form(slug, token, use_sandbox)
    if not membership_form:
        raise UserError(
            _("Aucun formulaire « Membership » trouvé pour cette organisation.")
        )

    fslug = form_light_slug(membership_form)
    ftype = form_light_form_type_str(membership_form) or "Membership"
    if not fslug:
        raise UserError(_("Le formulaire Membership n’a pas de formSlug exploitable."))

    page = 1
    while page <= _MAX_PAYMENT_PAGES:
        try:
            items, _total, _raw = fetch_form_payments_page(
                slug,
                ftype,
                fslug,
                token,
                use_sandbox,
                page_index=page,
                page_size=_PAYMENT_PAGE_SIZE,
            )
        except HelloAssoClientError as err:
            stats["errors"].append(str(err))
            _logger.warning("HelloAsso sync payments page %s: %s", page, err)
            break

        if not items:
            break

        for payment in items:
            if not isinstance(payment, dict):
                stats["skipped"] += 1
                continue
            if not payment_eligible_mvp(payment):
                stats["skipped"] += 1
                continue

            stats["processed"] += 1
            email, fn, ln = _payer_identity(payment)
            pid = _payment_id(payment)
            if not pid:
                stats["skipped"] += 1
                stats["errors"].append("Paiement sans id, ignoré.")
                continue
            if not email:
                stats["skipped"] += 1
                _logger.warning("HelloAsso sync: payment %s sans email payer", pid)
                continue

            trace_vals = _payment_trace_vals(payment, fslug, ftype)

            by_ext = Partner.search([("helloasso_external_id", "=", pid)])
            if len(by_ext) > 1:
                stats["skipped"] += 1
                _logger.warning(
                    "HelloAsso sync: plusieurs partenaires pour helloasso_external_id=%s",
                    pid,
                )
                continue
            if len(by_ext) == 1:
                partner = by_ext
                mode = "update"
            else:
                by_mail = Partner.search([("email", "=ilike", email)])
                if len(by_mail) > 1:
                    stats["skipped"] += 1
                    _logger.warning(
                        "HelloAsso sync: email ambigu %s (%s partenaires)", email, len(by_mail)
                    )
                    continue
                if len(by_mail) == 1:
                    partner = by_mail
                    mode = "update"
                else:
                    mode = "create"

            if mode == "create":
                create_vals = dict(trace_vals)
                create_vals["email"] = email
                if "firstname" in Partner._fields:
                    create_vals["firstname"] = fn
                    create_vals["lastname"] = ln
                create_vals["name"] = _partner_display_name(fn, ln, email)
                Partner.create(create_vals)
                stats["created"] += 1
                _logger.info("HelloAsso sync: création partenaire payment=%s email=%s", pid, email)
            else:
                write_vals = dict(trace_vals)
                if "firstname" in Partner._fields:
                    if not partner.firstname and fn:
                        write_vals["firstname"] = fn
                    if not partner.lastname and ln:
                        write_vals["lastname"] = ln
                if not partner.email and email:
                    write_vals["email"] = email
                partner.write(write_vals)
                stats["updated"] += 1
                _logger.info("HelloAsso sync: mise à jour partenaire id=%s payment=%s", partner.id, pid)

        if len(items) < _PAYMENT_PAGE_SIZE:
            break
        page += 1

    if log_origin:
        from .helloasso_sync_log import helloasso_sync_log_push

        helloasso_sync_log_push(
            env,
            "membership_payments",
            log_origin,
            stats,
        )
    return stats

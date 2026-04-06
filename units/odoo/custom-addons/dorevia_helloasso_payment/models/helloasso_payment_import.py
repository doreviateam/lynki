# -*- coding: utf-8 -*-

import csv
from io import StringIO

from odoo import _

from odoo.addons.dorevia_helloasso_connector.models.helloasso_client import (
    HelloAssoClientError,
    HelloAssoConnectionContext,
    fetch_client_credentials_token,
    fetch_form_payments_page,
)

from .helloasso_payment_mapper import map_api_payment_row, map_csv_payment_row


def import_csv_payment_rows(env, helloasso_account, rows, import_platform_only=True):
    Payment = env["dorevia.helloasso.payment"]
    stats = {
        "processed": 0,
        "created": 0,
        "updated": 0,
        "skipped": 0,
        "skip_offline": 0,
        "errors": [],
    }
    for row in rows:
        stats["processed"] += 1
        try:
            vals = map_csv_payment_row(row, helloasso_account)
        except ValueError as err:
            stats["skipped"] += 1
            stats["errors"].append(str(err))
            continue

        if import_platform_only and not vals.get("is_platform_payment"):
            stats["skipped"] += 1
            stats["skip_offline"] += 1
            continue

        existing = Payment.search(
            [
                ("helloasso_account_id", "=", helloasso_account.id),
                ("helloasso_payment_ref", "=", vals["helloasso_payment_ref"]),
            ],
            limit=1,
        )
        if existing:
            existing.write(vals)
            stats["updated"] += 1
        else:
            Payment.create(vals)
            stats["created"] += 1
    return stats


def import_api_payment_rows(env, helloasso_account, payments, import_platform_only=True):
    Payment = env["dorevia.helloasso.payment"]
    stats = {
        "processed": 0,
        "created": 0,
        "updated": 0,
        "skipped": 0,
        "skip_offline": 0,
        "errors": [],
    }
    for payment in payments or []:
        stats["processed"] += 1
        try:
            vals = map_api_payment_row(payment, helloasso_account)
        except ValueError as err:
            stats["skipped"] += 1
            stats["errors"].append(str(err))
            continue

        if import_platform_only and not vals.get("is_platform_payment"):
            stats["skipped"] += 1
            stats["skip_offline"] += 1
            continue

        existing = Payment.search(
            [
                ("helloasso_account_id", "=", helloasso_account.id),
                ("helloasso_payment_ref", "=", vals["helloasso_payment_ref"]),
            ],
            limit=1,
        )
        if existing:
            existing.write(vals)
            stats["updated"] += 1
        else:
            Payment.create(vals)
            stats["created"] += 1
    return stats


def import_api_payments_for_account(
    env,
    helloasso_account,
    form_type,
    form_slug,
    import_platform_only=True,
    page_size=50,
    max_pages=20,
):
    stats = {
        "processed": 0,
        "created": 0,
        "updated": 0,
        "skipped": 0,
        "skip_offline": 0,
        "errors": [],
        "pages": 0,
    }
    params = helloasso_account._to_connection_params()
    connection_ctx = HelloAssoConnectionContext.from_primitives(
        params.get("client_id"),
        params.get("client_secret"),
        params.get("use_sandbox"),
        params.get("organization_slug"),
    )
    if not connection_ctx.organization_slug:
        raise HelloAssoClientError(_("Slug organisation HelloAsso manquant."))

    token_payload = fetch_client_credentials_token(connection_ctx)
    token = token_payload["access_token"]

    for page_index in range(1, max_pages + 1):
        items, _total, _raw = fetch_form_payments_page(
            connection_ctx,
            form_type,
            form_slug,
            token,
            page_index=page_index,
            page_size=page_size,
        )
        if not items:
            break
        page_stats = import_api_payment_rows(
            env,
            helloasso_account,
            items,
            import_platform_only=import_platform_only,
        )
        stats["pages"] += 1
        stats["processed"] += page_stats["processed"]
        stats["created"] += page_stats["created"]
        stats["updated"] += page_stats["updated"]
        stats["skipped"] += page_stats["skipped"]
        stats["skip_offline"] += page_stats["skip_offline"]
        stats["errors"].extend(page_stats["errors"])
        if len(items) < page_size:
            break
    return stats


def import_csv_payment_rows_message(stats):
    parts = [
        _("Traitées : %s") % stats.get("processed", 0),
        _("Créées : %s") % stats.get("created", 0),
        _("Mises à jour : %s") % stats.get("updated", 0),
        _("Ignorées : %s") % stats.get("skipped", 0),
    ]
    if stats.get("skip_offline"):
        parts.append(_("Ignorées hors ligne : %s") % stats["skip_offline"])
    if stats.get("errors"):
        parts.append(_("Erreurs : %s") % len(stats["errors"]))
    return " | ".join(parts)


def parse_payment_csv_content(csv_text):
    text = (csv_text or "").strip()
    if not text:
        return []
    handle = StringIO(text)
    reader = csv.DictReader(handle, delimiter=";")
    return list(reader)

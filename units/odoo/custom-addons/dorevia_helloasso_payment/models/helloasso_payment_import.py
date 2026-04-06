# -*- coding: utf-8 -*-

from odoo import _

from .helloasso_payment_mapper import map_csv_payment_row


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

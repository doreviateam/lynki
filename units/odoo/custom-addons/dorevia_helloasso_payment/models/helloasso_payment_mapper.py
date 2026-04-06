# -*- coding: utf-8 -*-

import json
from datetime import datetime


def _clean_str(value):
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    return str(value).strip()


def normalize_csv_decimal(value):
    raw = _clean_str(value)
    if not raw:
        return False
    raw = raw.replace(" ", "").replace(",", ".")
    return float(raw)


def parse_payment_csv_datetime(value):
    raw = _clean_str(value)
    if not raw:
        return False
    for fmt in ("%d/%m/%Y %H:%M:%S", "%d/%m/%Y"):
        try:
            dt = datetime.strptime(raw, fmt)
            if fmt == "%d/%m/%Y":
                return dt.replace(hour=0, minute=0, second=0)
            return dt
        except ValueError:
            continue
    raise ValueError("Date de paiement HelloAsso invalide: %s" % raw)


def normalize_payment_status(raw_status):
    raw = _clean_str(raw_status).lower()
    if raw == "payé" or raw == "paye":
        return "paid"
    if raw == "hors ligne":
        return "offline"
    return "unknown"


def normalize_payout_status(raw_payout_status):
    raw = _clean_str(raw_payout_status).lower()
    if raw == "oui":
        return "paid_out"
    if raw == "non":
        return "not_paid_out"
    if raw == "hors ligne":
        return "offline"
    return "unknown"


def normalize_payment_method(raw_method):
    raw = _clean_str(raw_method).lower()
    if raw == "carte bancaire":
        return "card"
    if raw == "virement bancaire":
        return "bank_transfer_offline"
    if raw == "espèce" or raw == "espece":
        return "cash"
    return "unknown" if not raw else raw


def qualify_payment(payment_status_raw, payment_method_raw, payout_status_raw=None):
    status = normalize_payment_status(payment_status_raw)
    method = normalize_payment_method(payment_method_raw)
    payout = normalize_payout_status(payout_status_raw)
    is_platform = status == "paid" and method == "card"
    is_offline = status == "offline" or payout == "offline" or method in {
        "bank_transfer_offline",
        "cash",
    }
    payment_kind = "online" if is_platform and not is_offline else "offline"
    return {
        "payment_kind": payment_kind,
        "is_platform_payment": is_platform,
        "is_offline_payment": is_offline,
    }


def map_csv_payment_row(row, helloasso_account):
    payment_ref = _clean_str(row.get("Référence paiement"))
    order_ref = _clean_str(row.get("Référence commande"))
    payment_status_raw = _clean_str(row.get("Statut du paiement"))
    payment_method_raw = _clean_str(row.get("Moyen de paiement"))
    if not payment_ref:
        raise ValueError("Référence paiement manquante")
    if not payment_status_raw:
        raise ValueError("Statut du paiement manquant")
    if not payment_method_raw:
        raise ValueError("Moyen de paiement manquant")

    payout_status_raw = _clean_str(row.get("Versé"))
    vals = {
        "helloasso_payment_ref": payment_ref,
        "helloasso_order_ref": order_ref or False,
        "helloasso_account_id": helloasso_account.id,
        "company_id": helloasso_account.company_id.id,
        "currency_id": helloasso_account.company_id.currency_id.id,
        "campaign_name": _clean_str(row.get("Campagne")) or False,
        "campaign_type": _clean_str(row.get("Type de campagne")) or False,
        "payment_date": parse_payment_csv_datetime(row.get("Date du paiement")),
        "payment_status_raw": payment_status_raw,
        "payment_status": normalize_payment_status(payment_status_raw),
        "payout_status_raw": payout_status_raw or False,
        "payout_status": normalize_payout_status(payout_status_raw),
        "payout_date": parse_payment_csv_datetime(row.get("Date du versement")),
        "payment_method_raw": payment_method_raw,
        "payment_method": normalize_payment_method(payment_method_raw),
        "amount_total": normalize_csv_decimal(row.get("Montant total")),
        "amount_tariff": normalize_csv_decimal(row.get("Montant du tarif")),
        "amount_options": normalize_csv_decimal(row.get("Montant des options")),
        "amount_extra_donation": normalize_csv_decimal(row.get("Don supplémentaire")),
        "amount_discount": normalize_csv_decimal(row.get("Montant du code promo")),
        "payer_firstname": _clean_str(row.get("Prénom payeur")) or False,
        "payer_lastname": _clean_str(row.get("Nom payeur")) or False,
        "payer_email": _clean_str(row.get("Email payeur")).lower() or False,
        "source_payload": json.dumps(row, ensure_ascii=False, sort_keys=True),
    }
    vals.update(
        qualify_payment(
            payment_status_raw=payment_status_raw,
            payment_method_raw=payment_method_raw,
            payout_status_raw=payout_status_raw,
        )
    )
    return vals

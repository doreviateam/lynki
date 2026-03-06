#!/usr/bin/env python3
"""Envoie les factures 1896 et 1898 vers DVIG /ingest (sarl-la-platine)."""
import os
import requests
from datetime import datetime, timezone

DVIG_URL = os.environ.get("DVIG_URL", "http://dvig-core-stinger:8080").rstrip("/")
DVIG_TOKEN = os.environ.get("DVIG_TOKEN", "")
SOURCE = "odoo.stinger.sarl-la-platine"

INVOICES = [
    {
        "id": 1896,
        "name": "FAC/2026/00001",
        "move_type": "out_invoice",
        "state": "posted",
        "invoice_date": "2026-01-11",
        "date": "2026-01-11",
        "amount_untaxed": 356626.00,
        "amount_tax": 71325.20,
        "amount_total": 427951.20,
        "idempotency_key": "6fa82f69affd3a235515817d69e2fe79ece8c0388ed81d9f1b96ed0ee26c318d",
    },
    {
        "id": 1898,
        "name": "FAC/2026/00002",
        "move_type": "out_invoice",
        "state": "posted",
        "invoice_date": "2026-01-11",
        "date": "2026-01-11",
        "amount_untaxed": 110466.00,
        "amount_tax": 22093.20,
        "amount_total": 132559.20,
        "idempotency_key": "724a896f86bde63f75d9ca730420aec7321c6757b9692b4de833a727b776ad50",
    },
]

def main():
    if not DVIG_TOKEN:
        print("DVIG_TOKEN requis (ou dorevia.dvig.token Odoo)")
        return 1
    ts = datetime.now(timezone.utc).isoformat()
    headers = {"Authorization": f"Bearer {DVIG_TOKEN}", "Content-Type": "application/json"}
    for inv in INVOICES:
        payload = {
            "event_type": "invoice.posted",
            "source": SOURCE,
            "timestamp": ts,
            "idempotency_key": inv["idempotency_key"],
            "data": {
                "move_id": inv["id"],
                "move_name": inv["name"],
                "move_type": inv["move_type"],
                "state": inv["state"],
                "invoice_date": inv["invoice_date"],
                "date": inv["date"],
                "partner_id": None,
                "partner_name": None,
                "company_id": None,
                "company_name": None,
                "amount_untaxed": inv["amount_untaxed"],
                "amount_tax": inv["amount_tax"],
                "amount_total": inv["amount_total"],
                "currency_id": None,
                "currency_name": "EUR",
                "ref": "",
                "invoice_origin": "",
            },
        }
        url = f"{DVIG_URL}/ingest"
        try:
            r = requests.post(url, json=payload, headers=headers, timeout=15)
            r.raise_for_status()
            data = r.json()
            print(f"OK {inv['name']} (id={inv['id']}) -> event_id={data.get('event_id', data.get('id', '?'))}")
        except Exception as e:
            print(f"ERREUR {inv['name']}: {e}")
            if hasattr(e, "response") and e.response is not None:
                print(e.response.text[:500])
            return 1
    return 0

if __name__ == "__main__":
    exit(main())

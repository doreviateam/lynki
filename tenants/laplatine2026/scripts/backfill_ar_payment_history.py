#!/usr/bin/env python3
"""
Backfill AR Payment History — alimente le Vault avec les dates de paiement des factures clients payées
pour calculer le "délai moyen de paiement" (SPEC Priorisation v1.0).

Récupère les factures clients (out_invoice) payées sur les 12 derniers mois :
  - partner_id, invoice_date_due, et la date du paiement (dernier paiement ayant réconcilié la facture).

Envoie les lignes au Vault : POST /ui/ar-payment-history/backfill

Usage (shell Odoo) :
  docker exec -it odoo_lab_laplatine2026 odoo shell -d laplatine2026

  exec(open("/mnt/tenant-scripts/scripts/backfill_ar_payment_history.py").read())

  # Ou en local avec requêtes HTTP (sans shell Odoo) : voir run_backfill_ar_payment_history.sh
"""
from datetime import datetime, timedelta
import json
import os
import requests

# ─── Config (modifier si exécution hors shell Odoo) ───
VAULT_URL = os.environ.get("VAULT_URL", "http://vault-core-stinger:8080")
TENANT = os.environ.get("TENANT_ID", "laplatine2026")
COMPANY_ID = os.environ.get("COMPANY_ID", "odoo:1")  # ou "1"
MONTHS_BACK = 12

# ─── Récupération des factures payées + date de paiement (Odoo shell) ───
def get_paid_invoices_payment_dates(env):
    Move = env["account.move"].sudo()
    domain = [
        ("state", "=", "posted"),
        ("move_type", "=", "out_invoice"),
        ("payment_state", "=", "paid"),
        ("invoice_date_due", "!=", False),
    ]
    # Derniers 12 mois (sur date de facture)
    from_date = (datetime.now() - timedelta(days=MONTHS_BACK * 31)).strftime("%Y-%m-%d")
    domain.append(("invoice_date", ">=", from_date))
    invoices = Move.search(domain)
    rows = []
    for inv in invoices:
        payment_date = _get_invoice_payment_date(inv)
        if not payment_date or not inv.invoice_date_due:
            continue
        partner_id = str(inv.partner_id.id) if inv.partner_id else ""
        partner_name = (inv.partner_id.name or "") if inv.partner_id else ""
        rows.append({
            "partner_id": partner_id,
            "partner_name": partner_name[:200] if partner_name else "",
            "odoo_invoice_id": inv.id,
            "invoice_date_due": inv.invoice_date_due.strftime("%Y-%m-%d"),
            "payment_date": payment_date.strftime("%Y-%m-%d"),
        })
    return rows


def _get_invoice_payment_date(inv):
    """Retourne la date du dernier paiement ayant réconcilié la facture (move.date du paiement)."""
    # Lignes créances (receivable) de la facture
    receivable_type = getattr(inv.line_ids, "account_id", None)
    if receivable_type is None:
        return None
    rec_lines = inv.line_ids.filtered(
        lambda l: getattr(l, "display_type", "") != "line_section"
        and l.account_id
        and getattr(l.account_id, "account_type", "") == "asset_receivable"
    )
    if not rec_lines:
        return None
    dates = []
    for line in rec_lines:
        # matched_debit_ids / matched_credit_ids selon le sens
        matched = getattr(line, "matched_debit_ids", None) or getattr(line, "matched_credit_ids", None)
        if not matched:
            continue
        for rec in matched:
            other = rec.credit_move_id if rec.debit_move_id == line else rec.debit_move_id
            if other and other.move_id and other.move_id != inv:
                dates.append(other.move_id.date)
    return max(dates) if dates else None


# ─── Envoi au Vault ───
def send_to_vault(rows, vault_url=VAULT_URL, tenant=TENANT, company_id=COMPANY_ID):
    url = f"{vault_url.rstrip('/')}/ui/ar-payment-history/backfill"
    payload = {
        "tenant": tenant,
        "company_id": company_id or "",
        "rows": rows,
    }
    r = requests.post(url, json=payload, timeout=60)
    r.raise_for_status()
    return r.json()


# ─── Exécution (contexte Odoo shell) ───
if "env" in dir():
    rows = get_paid_invoices_payment_dates(env)
    print(f"Factures payées (12 mois) : {len(rows)} lignes")
    if rows:
        icp = env["ir.config_parameter"].sudo()
        vault_url = icp.get_param("dorevia.vault.url", VAULT_URL)
        tenant = icp.get_param("dorevia.tenant", "") or icp.get_param("dorevia.dvig.source", TENANT)
        company_id = "odoo:{}".format(env.company.id) if env.company else "odoo:1"
        try:
            result = send_to_vault(rows, vault_url=vault_url, tenant=tenant, company_id=str(company_id))
            print("Vault backfill OK:", result)
        except Exception as e:
            print("Erreur Vault:", e)
else:
    print("Exécuter ce script dans le shell Odoo (variable env disponible).")

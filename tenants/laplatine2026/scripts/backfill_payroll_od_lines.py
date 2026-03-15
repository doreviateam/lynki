#!/usr/bin/env python3
"""
Backfill OD de paie (641*, 645*) vers le Vault — table payroll_od_lines pour l'agrégat EBE.
LINKY-EBE-OD-01 / SPEC EBE OD payroll v1.0.
Lit les lignes account.move.line (comptes 641*, 645*, écritures postées) et les envoie à
POST /api/v1/payroll-od-lines (header X-Tenant).

Période par défaut : 2026-01-01 → 2026-02-28 (La Platine, total attendu 21 500 €).

Usage (shell Odoo) :
  exec(open("/mnt/tenant-scripts/scripts/backfill_payroll_od_lines.py").read())

Ou via le script shell :
  ./run_backfill_payroll_od_lines.sh
"""
from datetime import datetime
import os
import requests

# ─── Config ───
VAULT_URL = os.environ.get("VAULT_URL", "http://vault-core-stinger:8080")
TENANT = os.environ.get("TENANT_ID", "laplatine2026")
DATE_FROM = os.environ.get("PAYROLL_OD_DATE_FROM", "2026-01-01")
DATE_TO = os.environ.get("PAYROLL_OD_DATE_TO", "2026-02-28")


def get_payroll_od_lines(env, date_from, date_to):
    """Récupère les lignes OD 641* et 645* postées sur la période (date comptable)."""
    MoveLine = env["account.move.line"].sudo()
    Account = env["account.account"].sudo()

    accounts_charge = Account.search([("code", "=like", "641%")]) + Account.search(
        [("code", "=like", "645%")]
    )
    if not accounts_charge:
        return []

    lines = MoveLine.search([
        ("account_id", "in", accounts_charge.ids),
        ("date", ">=", date_from),
        ("date", "<=", date_to),
        ("move_id.state", "=", "posted"),
    ])

    out = []
    for l in lines:
        out.append({
            "move_id": l.move_id.id,
            "line_id": l.id,
            "line_date": l.date.strftime("%Y-%m-%d"),
            "account_code": l.account_id.code,
            "debit": float(l.debit),
            "credit": float(l.credit),
            "currency": (l.currency_id and l.currency_id.name) or "EUR",
            "state": "posted",
            "company_id": l.company_id.id if l.company_id else None,
        })
    return out


def send_to_vault(lines, vault_url=VAULT_URL, tenant=TENANT):
    """Envoie les lignes au Vault (POST /api/v1/payroll-od-lines)."""
    if not lines:
        return {"status": "no_eligible_lines", "count": 0}
    url = f"{vault_url.rstrip('/')}/api/v1/payroll-od-lines"
    headers = {"X-Tenant": tenant, "Content-Type": "application/json"}
    payload = {"lines": lines}
    r = requests.post(url, json=payload, headers=headers, timeout=60)
    r.raise_for_status()
    return r.json()


# ─── Exécution (contexte Odoo shell) ───
if "env" in dir():
    lines = get_payroll_od_lines(env, DATE_FROM, DATE_TO)
    print(f"Lignes OD paie (641*/645*) du {DATE_FROM} au {DATE_TO} : {len(lines)}")
    if not lines:
        print("Aucune ligne éligible (vérifier période et écritures postées).")
    else:
        total_net = sum(l["debit"] - l["credit"] for l in lines)
        print(f"Total net (débit - crédit) : {total_net:,.2f} €")
        try:
            vault_url = VAULT_URL
            tenant = TENANT
            icp = env["ir.config_parameter"].sudo()
            if icp.get_param("dorevia.vault.url"):
                vault_url = icp.get_param("dorevia.vault.url")
            if icp.get_param("dorevia.tenant") or icp.get_param("dorevia.dvig.source"):
                tenant = icp.get_param("dorevia.tenant") or icp.get_param("dorevia.dvig.source")
            result = send_to_vault(lines, vault_url=vault_url, tenant=tenant)
            print("Vault backfill OK:", result)
        except Exception as e:
            print("Erreur Vault:", e)
            raise
else:
    print("Exécuter ce script dans le shell Odoo (variable env disponible).")

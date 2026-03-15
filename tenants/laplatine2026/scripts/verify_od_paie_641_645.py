#!/usr/bin/env python3
"""
Vérifie les OD de paie (comptes 641*, 645*) sur la base laplatine2026.
LINKY_EBE_OD_01 : charges de personnel attendues 31/01 et 28/02 (10 750 €/mois).

Usage :
  docker cp tenants/laplatine2026/scripts/verify_od_paie_641_645.py odoo_lab_laplatine2026:/tmp/ && \
  docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http <<< "exec(open('/tmp/verify_od_paie_641_645.py').read())"
"""
# pylint: disable=undefined-variable,used-before-assignment

MoveLine = env["account.move.line"].sudo()
Account = env["account.account"].sudo()

# Comptes charges personnel (EBE) : 641*, 645*
# Comptes contrepartie à exclure : 421*, 431*
accounts_charge = Account.search([("code", "=like", "641%")]) + Account.search([("code", "=like", "645%")])
accounts_contrepartie = Account.search([("code", "=like", "421%")]) + Account.search([("code", "=like", "431%")])

print("=== COMPTES CHARGES PERSONNEL (641*, 645*) ===")
for acc in accounts_charge:
    print(f"  {acc.code} — {acc.name}")

print("\n=== COMPTES CONTREPARTIE (421*, 431*) — à exclure EBE ===")
for acc in accounts_contrepartie[:6]:
    print(f"  {acc.code} — {acc.name}")
if len(accounts_contrepartie) > 6:
    print(f"  ... et {len(accounts_contrepartie) - 6} autres")

# Lignes 641/645 : débit = charge
# Période Jan 2026 et Fév 2026
from datetime import datetime
for month_label, date_from, date_to in [
    ("Janvier 2026", "2026-01-01", "2026-01-31"),
    ("Février 2026", "2026-02-01", "2026-02-28"),
]:
    lines = MoveLine.search([
        ("account_id", "in", accounts_charge.ids),
        ("date", ">=", date_from),
        ("date", "<=", date_to),
        ("move_id.state", "=", "posted"),
    ])
    total_debit = sum(l.debit for l in lines)
    total_credit = sum(l.credit for l in lines)
    # Charge = débit - crédit (pour comptes de charge)
    charge_mois = total_debit - total_credit
    print(f"\n--- {month_label} (date {date_from} à {date_to}) ---")
    print(f"  Lignes trouvées : {len(lines)}")
    print(f"  Total débit : {total_debit:,.2f} €")
    print(f"  Total crédit : {total_credit:,.2f} €")
    print(f"  Charge personnel (débit - crédit) : {charge_mois:,.2f} €")
    if lines:
        for l in lines[:8]:
            print(f"    - {l.account_id.code} {l.move_id.name} date={l.date} débit={l.debit} crédit={l.credit}")
        if len(lines) > 8:
            print(f"    ... et {len(lines) - 8} autres lignes")

# Cumul YTD au 28/02/2026
lines_ytd = MoveLine.search([
    ("account_id", "in", accounts_charge.ids),
    ("date", ">=", "2026-01-01"),
    ("date", "<=", "2026-02-28"),
    ("move_id.state", "=", "posted"),
])
total_debit_ytd = sum(l.debit for l in lines_ytd)
total_credit_ytd = sum(l.credit for l in lines_ytd)
charge_ytd = total_debit_ytd - total_credit_ytd
print("\n=== CUMUL EXERCICE À DATE AU 28/02/2026 ===")
print(f"  Charge personnel cumulée (641*+645*) : {charge_ytd:,.2f} €")
print("\n→ Document LINKY_EBE_OD_01 attend 21 500 € (10 750 × 2 mois).")

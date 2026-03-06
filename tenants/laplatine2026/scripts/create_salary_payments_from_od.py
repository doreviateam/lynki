#!/usr/bin/env python3
"""
Crée les 4 paiements salaires (421 + 431 pour Jan et Fév) à partir des OD.

Usage (depuis la plateforme) :
  cat /opt/dorevia-plateform/tenants/laplatine2026/scripts/create_salary_payments_from_od.py | \
  docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
"""
# pylint: disable=undefined-variable,used-before-assignment

MoveLine = env["account.move.line"].sudo()
Payment = env["account.payment"].sudo()
Account = env["account.account"].sudo()
Partner = env["res.partner"].sudo()
Journal = env["account.journal"].sudo()

# Comptes et montants SPEC Masse Salariale
LINES_SPEC = [
    {"account_code": "421000", "amount": 7000.0, "date": "2026-01-31"},   # Personnel Jan
    {"account_code": "431000", "amount": 3750.0, "date": "2026-01-31"},   # URSSAF Jan
    {"account_code": "421000", "amount": 7000.0, "date": "2026-02-28"},   # Personnel Fév
    {"account_code": "431000", "amount": 3750.0, "date": "2026-02-28"},   # URSSAF Fév
]

# Journal banque
bank_journal = Journal.search([("type", "=", "bank")], limit=1)
if not bank_journal:
    print("ERREUR: Aucun journal banque trouvé")
else:
    print(f"Journal banque: {bank_journal.name}")

# Partenaire Équipage La Platine
partner = Partner.search([("name", "ilike", "Équipage La Platine")], limit=1)
if not partner:
    partner = Partner.search([("name", "ilike", "La Platine")], limit=1)
if not partner:
    print("ERREUR: Partenaire Équipage La Platine introuvable")
else:
    print(f"Partenaire: {partner.name} (id={partner.id})")

created = []
for spec in LINES_SPEC:
    acc = Account.search([("code", "=", spec["account_code"])], limit=1)
    if not acc:
        print(f"  Compte {spec['account_code']} introuvable, skip")
        continue

    # Trouver la ligne à régler (crédit, non reconciliée)
    line = MoveLine.search([
        ("account_id", "=", acc.id),
        ("partner_id", "=", partner.id),
        ("credit", "=", spec["amount"]),
        ("reconciled", "=", False),
        ("move_id.state", "=", "posted"),
    ], limit=1, order="id desc")

    if not line:
        print(f"  Ligne {spec['account_code']} {spec['amount']} € ({spec['date']}) introuvable ou déjà réglée")
        continue

    # Vérifier si paiement existe déjà pour cette ligne
    if line.reconciled:
        print(f"  Ligne déjà reconciliée: {spec['account_code']} {spec['amount']} €")
        continue

    from datetime import datetime
    pay_date = datetime.strptime(spec["date"], "%Y-%m-%d").date()

    try:
        payment = Payment.create({
            "payment_type": "outbound",
            "partner_type": "supplier",
            "partner_id": partner.id,
            "amount": spec["amount"],
            "journal_id": bank_journal.id,
            "date": pay_date,
        })
        payment.action_post()
        env.cr.commit()

        # Reconcile: le paiement crée une ligne débit sur le compte payable
        # On doit réconcilier la ligne du paiement avec la ligne de l'OD
        pay_move = payment.move_id
        pay_line = MoveLine.search([
            ("move_id", "=", pay_move.id),
            ("account_id", "=", acc.id),
            ("debit", ">", 0),
        ], limit=1)

        if pay_line and line:
            (pay_line + line).reconcile()
            env.cr.commit()
            created.append(f"  {spec['account_code']} {spec['amount']} € ({spec['date']}) -> payment id={payment.id}")
        else:
            print(f"  Paiement créé id={payment.id} mais réconciliation manuelle requise")
            created.append(f"  {spec['account_code']} {spec['amount']} € -> payment id={payment.id} (non reconcilié)")

    except Exception as e:
        print(f"  ERREUR {spec['account_code']} {spec['amount']} €: {e}")
        env.cr.rollback()

print(f"\nPaiements créés: {len(created)}")
for c in created:
    print(c)

if created:
    print("\nLancer le vaulting:")
    print("  env['account.payment'].cron_vault_send_payments()")
    print("  env['dorevia.dvig.service'].trigger_worker(limit=50)")

#!/usr/bin/env python3
"""
Script de test lettrage bancaire (Phase 5.3).
Crée un relevé bancaire, une ligne, et tente le rapprochement avec un paiement existant.
Émet bank.move.reconciled vers DVIG si le connecteur Dorevia est actif.

Exécuter :
  docker exec -i odoo_lab_o19 odoo shell -d odoo_lab_o19 --no-http < tenants/o19/apps/odoo/lab/test_lettrage_reconcil.py

Vérifier l'événement dans DVIG :
  SELECT * FROM outbox_events
  WHERE payload->>'event_type' IN ('bank.move.reconciled','bank.move.unreconciled')
  ORDER BY created_at DESC LIMIT 5;
"""
from datetime import date

env = env  # noqa: F821 - odoo shell

Stmt = env["account.bank.statement"]
Line = env["account.bank.statement.line"]
Payment = env["account.payment"]
Journal = env["account.journal"]
Partner = env["res.partner"]

# --- 1. Journal bancaire ---
journal = Journal.search([
    ("type", "=", "bank"),
    ("company_id", "=", env.company.id),
], limit=1)
if not journal:
    journal = Journal.search([("company_id", "=", env.company.id)], limit=1)
if not journal:
    print("ERREUR: aucun journal trouvé")
    raise SystemExit(1)

# --- 2. Partenaire ---
partner = Partner.search([("company_id", "=", env.company.id)], limit=1)
if not partner:
    partner = Partner.create({"name": "Test Lettrage", "company_id": env.company.id})

# --- 3. Paiement existant ou nouveau (pour rapprochement) ---
payment = Payment.search([
    ("state", "=", "posted"),
    ("company_id", "=", env.company.id),
    ("payment_type", "=", "inbound"),
], limit=1)
if not payment:
    payment = Payment.create({
        "payment_type": "inbound",
        "partner_type": "customer",
        "partner_id": partner.id,
        "amount": 100.0,
        "currency_id": env.company.currency_id.id,
        "journal_id": journal.id,
        "date": str(date.today()),
    })
    payment.action_post()
    env.cr.commit()
    print("Paiement créé: %s (%.2f €)" % (payment.name, payment.amount))

# Ligne créance du paiement
receivable_lines = payment.move_id.line_ids.filtered(
    lambda l: l.account_id.account_type in ("asset_receivable", "liability_payable")
)
if not receivable_lines:
    print("ERREUR: aucune ligne créance sur le paiement %s" % payment.name)
    raise SystemExit(1)
receivable_line = receivable_lines[0]
amount = abs(receivable_line.balance) or abs(receivable_line.amount_currency or 0)

# --- 4. Relevé bancaire + ligne ---
today = str(date.today())
stmt = Stmt.create({
    "journal_id": journal.id,
    "date": today,
    "name": "Test Lettrage %s" % today,
    "balance_start": 0.0,
    "balance_end_real": amount,
})
line = Line.create({
    "statement_id": stmt.id,
    "journal_id": journal.id,
    "date": today,
    "payment_ref": "Rapprochement test %s" % payment.name,
    "partner_id": partner.id,
    "amount": amount,
})
env.cr.commit()
print("Relevé créé: id=%s, ligne id=%s, montant=%.2f €" % (stmt.id, line.id, amount))

# --- 5. Valider le relevé (si méthode disponible) ---
posted = False
for method in ("action_post", "button_post", "action_validate", "button_balance"):
    if hasattr(stmt, method):
        try:
            getattr(stmt, method)()
            posted = True
            print("Relevé validé via %s()" % method)
            break
        except Exception as e:
            print("  %s() échoué: %s" % (method, e))
if not posted:
    print("INFO: pas de méthode de validation trouvée, ligne peut ne pas avoir move_id")

env.cr.commit()

# --- 6. Rapprochement (OCA ou standard) ---
reconciled = False
if hasattr(line, "reconcile_bank_line") and hasattr(line, "_add_account_move_line"):
    # OCA account_reconcile_oca : utiliser _add_account_move_line + reconcile_bank_line
    try:
        line._add_account_move_line(receivable_line)
        if line.can_reconcile:
            line.reconcile_bank_line()
            reconciled = True
            print("Lettrage OCA OK: reconcile_bank_line()")
        else:
            print("INFO: can_reconcile=False après _add_account_move_line")
    except Exception as e:
        print("Lettrage OCA échoué: %s" % e)
else:
    # Odoo 19 standard sans OCA : pas d'API programmatique pour le lettrage.
    # Le rapprochement Suspense↔Créance n'est pas possible via reconcile() direct
    # (comptes différents). Utiliser l'interface Bank Matching.
    print("INFO: Odoo 19 sans OCA — lettrage manuel requis")
    print("  → Comptabilité > Banque > Transactions (Bank Matching)")
    print("  → Ou : Relevés bancaires > Relevé id=%s > Lettrage de la ligne" % stmt.id)

env.cr.commit()

# --- 7. Backfill (émet les événements pour lignes déjà rapprochées) ---
try:
    result = env["bank.reconciliation.backfill"].run_backfill(company_id=env.company.id)
    print("\nBackfill: %s" % result.get("message", result))
except Exception as e:
    print("\nBackfill: %s" % e)

# --- 8. Résumé ---
line.invalidate_recordset()
print("\n=== Résumé ===")
print("  Ligne BSL id=%s | is_reconciled=%s | move_id=%s" % (
    line.id, line.is_reconciled, line.move_id.id if line.move_id else None))
if reconciled or line.is_reconciled:
    print("  Événement bank.move.reconciled émis vers DVIG (si dorevia.dvig.url configuré)")
    print("  Vérifier: SELECT * FROM outbox_events WHERE payload->>'event_type'='bank.move.reconciled'")
else:
    print("  Lettrage non effectué. Après lettrage manuel dans l'UI, le connecteur émet l'événement.")
    print("  Ou lancer le backfill pour les lignes déjà rapprochées.")

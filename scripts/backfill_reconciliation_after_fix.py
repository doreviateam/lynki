#!/usr/bin/env python3
"""
Backfill Confirmation Bancaire — après correction _traverse_to_impacted_documents

Usage (Odoo shell) :
  exec(open('/opt/dorevia-plateform/scripts/backfill_reconciliation_after_fix.py').read())

Ou :
  docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http < /opt/dorevia-plateform/scripts/backfill_reconciliation_after_fix.py

Référence : ZeDocs/RUNBOOK_BACKFILL_CONFIRMATION.md Option C
"""
# 1. Réinitialiser le curseur backfill
env["ir.config_parameter"].sudo().set_param(
    "dorevia.vault.reconcil_backfill_last_bsl_id", "0"
)
print("Curseur backfill réinitialisé à 0")

# 2. Relancer le backfill (toutes les lignes rapprochées)
processed = env["account.bank.statement.line"].backfill_reconciliation_confirmation_events(
    batch_size=500
)
print(f"Backfill : {processed} ligne(s) traitée(s)")

# 3. Déclencher le worker DVIG
try:
    env["dorevia.dvig.service"].trigger_worker(limit=100)
    print("Trigger worker DVIG OK")
except Exception as e:
    print(f"Trigger worker erreur (non bloquant): {e}")

print("=== Fin backfill_reconciliation_after_fix ===")

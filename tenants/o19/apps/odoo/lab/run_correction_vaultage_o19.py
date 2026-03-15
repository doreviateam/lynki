# Exécuté dans Odoo shell (stdin) pour backfill + exécution crons Vault paiements.
# Usage: docker exec -i odoo_lab_o19 odoo shell -d odoo_lab_o19 --no-http < run_correction_vaultage_o19.py

# 1. Backfill des paiements (marquer en todo pour envoi DVIG)
Payment = env["account.payment"].sudo()
count_backfill = Payment.backfill_vault_todo()
print(f"Backfill: {count_backfill} paiement(s) initialisés pour envoi.")

# 2. Exécuter le cron Vault Send Payments (envoi vers DVIG)
Cron = env["ir.cron"].sudo()
try:
    cron_send = env.ref("dorevia_vault_connector.ir_cron_vault_send_payments")
    cron_send.method_direct_trigger()
    print("Cron 'Vault Send Payments' exécuté.")
except Exception as e:
    print(f"Cron Send Payments: {e}")

# 3. Exécuter le cron Vault Fetch Proof Payments (récupération preuves)
try:
    cron_fetch = env.ref("dorevia_vault_connector.ir_cron_vault_fetch_proof_payments")
    cron_fetch.method_direct_trigger()
    print("Cron 'Vault Fetch Proof Payments' exécuté.")
except Exception as e:
    print(f"Cron Fetch Proof: {e}")

env.cr.commit()
print("Terminé. Attendre 1–2 min puis lancer scripts/verifier_vaultage_o19.sh")

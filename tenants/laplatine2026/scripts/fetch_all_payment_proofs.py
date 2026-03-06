#!/usr/bin/env python3
"""
Récupère les preuves pour TOUS les paiements pending_proof.
Contourne la limite 50 du cron en itérant sur tous les IDs.

Usage :
  echo "exec(open('/mnt/tenant-scripts/scripts/fetch_all_payment_proofs.py').read())" | docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
"""
Payment = env["account.payment"].sudo()
cfg = Payment._dvig_config()
vault_url = cfg.get("vault_url")
if not vault_url:
    print("ERREUR: dorevia.vault.url non configuré")
else:
    pending = Payment.search([
        ("state", "in", ("posted", "paid", "in_process", "sent", "reconciled")),
        ("dorevia_vault_status", "=", "pending_proof"),
    ], order="id")
    vaulted_before = Payment.search_count([
        ("state", "in", ("posted", "paid")),
        ("dorevia_vault_status", "=", "vaulted"),
    ])
    for i, p in enumerate(pending):
        try:
            p._fetch_and_apply_proof(vault_url)
            if (i + 1) % 50 == 0:
                env.cr.commit()
                print(f"  {i+1}/{len(pending)} traités")
        except Exception as e:
            pass  # 404 ou erreur → reste pending
    env.cr.commit()
    vaulted_after = Payment.search_count([
        ("state", "in", ("posted", "paid")),
        ("dorevia_vault_status", "=", "vaulted"),
    ])
    print(f"Terminé: {vaulted_after - vaulted_before} nouveaux vaulted (total {vaulted_after}/{vaulted_after + len(pending)})")

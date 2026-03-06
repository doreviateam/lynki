#!/usr/bin/env python3
"""
Récupère les preuves pour TOUTES les factures pending_proof.
Contourne la limite 50 du cron en itérant sur tous les IDs.

Usage :
  echo "exec(open('/mnt/tenant-scripts/scripts/fetch_all_invoice_proofs.py').read())" | docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
"""
Move = env["account.move"].sudo()
ELIGIBLE = ("out_invoice", "out_refund", "in_invoice", "in_refund")

icp = env["ir.config_parameter"].sudo()
vault_url = icp.get_param("dorevia.vault.url", "")

if not vault_url:
    print("ERREUR: dorevia.vault.url non configuré")
else:
    pending = Move.search([
        ("state", "=", "posted"),
        ("move_type", "in", list(ELIGIBLE)),
        ("dorevia_vault_status", "=", "pending_proof"),
    ], order="id")
    vaulted_before = Move.search_count([
        ("state", "=", "posted"),
        ("move_type", "in", list(ELIGIBLE)),
        ("dorevia_vault_status", "=", "vaulted"),
    ])
    for i, m in enumerate(pending):
        try:
            m._fetch_and_apply_proof(vault_url)
            if (i + 1) % 50 == 0:
                env.cr.commit()
                print(f"  {i+1}/{len(pending)} traités")
        except Exception:
            pass  # 404 ou erreur → reste pending
    env.cr.commit()
    vaulted_after = Move.search_count([
        ("state", "=", "posted"),
        ("move_type", "in", list(ELIGIBLE)),
        ("dorevia_vault_status", "=", "vaulted"),
    ])
    print(f"Terminé: {vaulted_after - vaulted_before} nouveaux vaulted (total {vaulted_after})")

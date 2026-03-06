#!/usr/bin/env python3
"""
Backfill vault pour les paiements fournisseurs (et clients) non encore initialisés.

Exécution via shell Odoo (recommandé) :

  docker exec -it odoo_lab_laplatine2026 odoo shell -d laplatine2026

  # Dans le shell :
  n = env['account.payment'].backfill_vault_todo(payment_type='outbound')  # fournisseurs
  n += env['account.payment'].backfill_vault_todo(payment_type='inbound')  # clients (optionnel)
  print(f"Initialisés : {n} paiements")

Les crons Vault Send Payments (2 min) et Vault Fetch Proof Payments (1 min) traiteront ensuite.
"""

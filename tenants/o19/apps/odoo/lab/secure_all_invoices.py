#!/usr/bin/env python3
"""
Script pour sécuriser (vault) toutes les factures du tenant o19.
À exécuter via: docker exec -i odoo_lab_o19 odoo shell -d odoo_lab_o19 --no-http < secure_all_invoices.py
"""
ELIGIBLE = ('out_invoice', 'in_invoice', 'out_refund', 'in_refund')

# 1. Initialiser le vault pour les factures posted sans clé
Move = env['account.move']
posted = Move.search([
    ('state', '=', 'posted'),
    ('move_type', 'in', list(ELIGIBLE)),
    ('dorevia_vault_idempotency_key', '=', False),
])
if posted:
    try:
        posted._vault_init_moves()
        env.cr.commit()
        print(f"Initialisé vault pour {len(posted)} facture(s)")
    except Exception as e:
        print(f"Erreur init vault: {e}")

# 2. Exécuter les CRONs en boucle jusqu'à ce que tout soit traité
AccountMove = env['account.move']
for round_num in range(10):
    todo = AccountMove.search_count([
        ('state', '=', 'posted'),
        ('move_type', 'in', list(ELIGIBLE)),
        ('dorevia_vault_status', 'in', ['todo', 'failed_soft']),
    ])
    pending = AccountMove.search_count([
        ('dorevia_vault_status', '=', 'pending_proof'),
    ])
    if todo == 0 and pending == 0:
        print(f"Round {round_num}: Rien à traiter.")
        break
    print(f"Round {round_num}: todo/failed_soft={todo}, pending_proof={pending}")
    AccountMove.cron_vault_send_dvig()
    env.cr.commit()
    AccountMove.cron_vault_fetch_proof()
    env.cr.commit()
    AccountMove.cron_vault_reconciler()
    env.cr.commit()

# 3. Résumé final
vaulted = AccountMove.search_count([
    ('state', '=', 'posted'),
    ('move_type', 'in', list(ELIGIBLE)),
    ('dorevia_vault_status', '=', 'vaulted'),
])
remaining = AccountMove.search([
    ('state', '=', 'posted'),
    ('move_type', 'in', list(ELIGIBLE)),
    ('dorevia_vault_status', 'not in', ['vaulted', False]),
], limit=20)
print(f"\nRésumé: {vaulted} facture(s) protégée(s)")
if remaining:
    print(f"En attente: {[(r.name, r.dorevia_vault_status) for r in remaining]}")

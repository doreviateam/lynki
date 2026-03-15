#!/usr/bin/env python3
"""
Script de test vaulting paiement (Phase 5.2).
Exécuter : docker exec -i odoo_lab_o19 odoo shell -d odoo_lab_o19 --no-http < tenants/o19/apps/odoo/lab/test_vaulting_payment.py
"""
from datetime import date
env = env  # noqa: F821 - odoo shell
Payment = env['account.payment']
Partner = env['res.partner']
Journal = env['account.journal']

# Partenaire et journal
partner = Partner.search([('company_id', '=', env.company.id)], limit=1)
if not partner:
    partner = Partner.create({'name': 'Test Vault Payment', 'company_id': env.company.id})

journal = Journal.search([
    ('type', '=', 'bank'),
    ('company_id', '=', env.company.id),
], limit=1)
if not journal:
    journal = Journal.search([('company_id', '=', env.company.id)], limit=1)

# Créer paiement entrant
payment = Payment.create({
    'payment_type': 'inbound',
    'partner_type': 'customer',
    'partner_id': partner.id,
    'amount': 100.0,
    'currency_id': env.company.currency_id.id,
    'journal_id': journal.id,
    'date': str(date.today()),
})
payment.action_post()
env.cr.commit()

print("Payment créé: id=%s, name=%s" % (payment.id, payment.name))
print("  state=%s, dorevia_vault_status=%s" % (payment.state, payment.dorevia_vault_status))
print("Attendre CRON ou queue_job (~2-5 min) pour vaulted.")

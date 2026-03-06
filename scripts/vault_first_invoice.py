#!/usr/bin/env python3
"""
Script pour vaultériser la première facture postée non vaultée
Usage: docker exec -it odoo_stinger_sarl-la-platine odoo shell -d odoo_stinger_sarl-la-platine < vault_first_invoice.py
"""

# Trouver la première facture postée non vaultée
invoice = env['account.move'].search([
    ('state', '=', 'posted'),
    ('dorevia_vaulted', '=', False),
    ('move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund'])
], order='id asc', limit=1)

if not invoice:
    print("❌ Aucune facture postée non vaultée trouvée")
    exit(1)

print(f"📄 Facture trouvée: {invoice.name} (ID: {invoice.id})")
print(f"   Type: {invoice.move_type}")
print(f"   État: {invoice.state}")
print(f"   Vaulted?: {invoice.dorevia_vaulted}")

# Vérifier la configuration DVIG
dvig_url = env['ir.config_parameter'].sudo().get_param('dorevia.dvig.url')
dvig_token = env['ir.config_parameter'].sudo().get_param('dorevia.dvig.token')
dvig_source = env['ir.config_parameter'].sudo().get_param('dorevia.dvig.source')

if not dvig_url or not dvig_token or not dvig_source:
    print("❌ Configuration DVIG incomplète:")
    print(f"   URL: {dvig_url or 'MANQUANT'}")
    print(f"   Token: {'PRÉSENT' if dvig_token else 'MANQUANT'}")
    print(f"   Source: {dvig_source or 'MANQUANT'}")
    exit(1)

print(f"✅ Configuration DVIG OK:")
print(f"   URL: {dvig_url}")
print(f"   Source: {dvig_source}")

# Vaultériser
try:
    print(f"\n🔄 Vaulting de la facture {invoice.name}...")
    invoice.action_vault()
    print(f"✅ Facture {invoice.name} vaultérisée avec succès!")
    print(f"   Vaulted?: {invoice.dorevia_vaulted}")
except Exception as e:
    print(f"❌ Erreur lors du vaulting: {str(e)}")
    exit(1)

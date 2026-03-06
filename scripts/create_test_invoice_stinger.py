#!/usr/bin/env python3
"""
Script pour créer une facture de test dans Odoo (tenant sarl-la-platine)
Usage: docker exec odoo_stinger_sarl-la-platine odoo shell -d sarl-la-platine < scripts/create_test_invoice_stinger.py
"""

import json
from datetime import date

print("="*60)
print("🔧 CRÉATION D'UNE FACTURE DE TEST")
print("="*60)

# Trouver un partenaire client
partner = env['res.partner'].search([
    ('is_company', '=', True),
    ('customer_rank', '>', 0)
], limit=1)

if not partner:
    # Si aucun partenaire client, prendre le premier partenaire
    partner = env['res.partner'].search([], limit=1)

if not partner:
    print("❌ Aucun partenaire trouvé")
    exit(1)

print(f"✅ Partenaire: {partner.name} (ID: {partner.id})")
if partner.vat:
    print(f"   TVA: {partner.vat}")

# Trouver un journal de vente
journal = env['account.journal'].search([
    ('type', '=', 'sale'),
    ('company_id', '=', env.company.id)
], limit=1)

if not journal:
    print("❌ Aucun journal de vente trouvé")
    exit(1)

print(f"✅ Journal: {journal.name} (ID: {journal.id})")

# Trouver un produit avec TVA
product = env['product.product'].search([
    ('sale_ok', '=', True),
    ('type', '!=', 'service')
], limit=1)

if not product:
    # Si aucun produit, prendre le premier
    product = env['product.product'].search([], limit=1)

if not product:
    print("❌ Aucun produit trouvé")
    exit(1)

print(f"✅ Produit: {product.name} (ID: {product.id})")
print(f"   Prix: {product.list_price} {env.company.currency_id.name}")

# Créer la facture
print("\n📝 Création de la facture...")

invoice_vals = {
    'move_type': 'out_invoice',
    'partner_id': partner.id,
    'journal_id': journal.id,
    'invoice_date': date.today(),
    'date': date.today(),
    'invoice_line_ids': [(0, 0, {
        'product_id': product.id,
        'name': f'Test produit - Validation champs facturation Vault',
        'quantity': 2,
        'price_unit': 1250.00,
    })],
}

invoice = env['account.move'].create(invoice_vals)
print(f"✅ Facture créée: {invoice.name} (ID: {invoice.id})")

# Valider la facture
print("\n✅ Validation de la facture (action_post)...")
invoice.action_post()

print(f"✅ Facture validée: {invoice.name}")
print(f"   État: {invoice.state}")
print(f"   Date: {invoice.invoice_date}")
print(f"   Montant HT: {invoice.amount_untaxed:.2f} {invoice.currency_id.name}")
print(f"   Montant TTC: {invoice.amount_total:.2f} {invoice.currency_id.name}")
print(f"   TVA Vendeur: {env.company.vat or 'N/A'}")
print(f"   TVA Acheteur: {partner.vat or 'N/A'}")

# Vérifier le statut Vault
print(f"\n📊 Statut Vault:")
print(f"   dorevia_vault_status: {invoice.dorevia_vault_status or 'Non initialisé'}")
print(f"   dorevia_vaulted: {invoice.dorevia_vaulted}")

# Commit
env.cr.commit()

print("\n" + "="*60)
print("✅ FACTURE DE TEST CRÉÉE AVEC SUCCÈS")
print("="*60)
print(f"📄 Numéro: {invoice.name}")
print(f"🆔 ID Odoo: {invoice.id}")
print(f"💰 Montant HT: {invoice.amount_untaxed:.2f} {invoice.currency_id.name}")
print(f"💰 Montant TTC: {invoice.amount_total:.2f} {invoice.currency_id.name}")
print(f"📅 Date: {invoice.invoice_date}")
print(f"🏢 TVA Vendeur: {env.company.vat or 'N/A'}")
print(f"👤 TVA Acheteur: {partner.vat or 'N/A'}")
print("\n⏳ Le vaulting automatique se fera via le CRON DVIG")
print("💡 Attendez 5-10 minutes puis vérifiez dans Vault:")
print(f"   SELECT * FROM documents WHERE odoo_id = {invoice.id};")
print("="*60)

#!/usr/bin/env python3
"""
Script de création d'une facture de test pour valider le remplissage automatique des champs optionnels Vault
Date: 2026-01-11
Version Vault: v1.3.3
"""

import sys
import os

# Ajouter le chemin Odoo si nécessaire
odoo_path = "/opt/dorevia-plateform/units/odoo"
if odoo_path not in sys.path:
    sys.path.insert(0, odoo_path)

try:
    import odoo
    from odoo import api, SUPERUSER_ID
    from odoo.tools import config
except ImportError:
    print("❌ Erreur: Odoo n'est pas disponible dans ce contexte")
    print("💡 Utilisez plutôt: docker exec odoo-core-stinger odoo shell -d [database]")
    sys.exit(1)

def create_test_invoice():
    """Crée une facture de test dans Odoo"""
    
    print("🔧 Connexion à Odoo...")
    
    # Configuration Odoo
    config['db_name'] = os.getenv('ODOO_DB', 'odoo')
    config['db_user'] = os.getenv('ODOO_DB_USER', 'odoo')
    config['db_password'] = os.getenv('ODOO_DB_PASSWORD', 'odoo')
    config['db_host'] = os.getenv('ODOO_DB_HOST', 'localhost')
    config['db_port'] = int(os.getenv('ODOO_DB_PORT', '5432'))
    
    # Initialiser Odoo
    odoo.tools.config.parse_config([])
    
    # Connexion
    registry = odoo.registry(config['db_name'])
    with registry.cursor() as cr:
        env = api.Environment(cr, SUPERUSER_ID, {})
        
        print("✅ Connecté à Odoo")
        
        # Trouver un partenaire
        partner = env['res.partner'].search([], limit=1)
        if not partner:
            print("❌ Aucun partenaire trouvé")
            return None
        
        print(f"📋 Partenaire: {partner.name}")
        
        # Trouver un journal de vente
        journal = env['account.journal'].search([
            ('type', '=', 'sale'),
            ('company_id', '=', env.company.id)
        ], limit=1)
        
        if not journal:
            print("❌ Aucun journal de vente trouvé")
            return None
        
        print(f"📋 Journal: {journal.name}")
        
        # Trouver un produit
        product = env['product.product'].search([], limit=1)
        if not product:
            print("❌ Aucun produit trouvé")
            return None
        
        print(f"📋 Produit: {product.name}")
        
        # Créer la facture
        print("\n📝 Création de la facture de test...")
        
        invoice = env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': partner.id,
            'journal_id': journal.id,
            'invoice_date': '2026-01-11',
            'date': '2026-01-11',
            'invoice_line_ids': [(0, 0, {
                'product_id': product.id,
                'name': 'Test produit pour validation champs optionnels Vault',
                'quantity': 1,
                'price_unit': 1500.00,
            })],
        })
        
        print(f"✅ Facture créée: {invoice.name} (ID: {invoice.id})")
        
        # Valider la facture
        print("\n✅ Validation de la facture...")
        invoice.action_post()
        
        print(f"✅ Facture validée: {invoice.name}")
        print(f"📊 Montant HT: {invoice.amount_untaxed} €")
        print(f"📊 Montant TTC: {invoice.amount_total} €")
        print(f"📊 Statut Vault: {invoice.dorevia_vault_status or 'Non initialisé'}")
        
        cr.commit()
        
        return {
            'id': invoice.id,
            'name': invoice.name,
            'amount_untaxed': float(invoice.amount_untaxed),
            'amount_total': float(invoice.amount_total),
            'currency': invoice.currency_id.name,
            'move_type': invoice.move_type,
            'vault_status': invoice.dorevia_vault_status,
        }

if __name__ == '__main__':
    try:
        result = create_test_invoice()
        if result:
            print("\n" + "="*60)
            print("✅ FACTURE DE TEST CRÉÉE AVEC SUCCÈS")
            print("="*60)
            print(f"ID Odoo: {result['id']}")
            print(f"Numéro: {result['name']}")
            print(f"Montant HT: {result['amount_untaxed']} {result['currency']}")
            print(f"Montant TTC: {result['amount_total']} {result['currency']}")
            print(f"Type: {result['move_type']}")
            print(f"Statut Vault: {result['vault_status']}")
            print("\n⏳ Attendez ~5-10 minutes pour le vaulting automatique")
            print("💡 Utilisez le script de vérification pour suivre le processus")
            print("="*60)
        else:
            print("\n❌ Échec de la création de la facture")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

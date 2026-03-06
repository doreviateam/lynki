#!/usr/bin/env python3
"""
Script pour supprimer une facture (même si elle est postée)
Usage: 
  docker exec -it odoo_lab_core odoo shell -d odoo_lab_core < delete_invoice.py
  
  Ou avec un ID spécifique:
  INVOICE_ID=123 docker exec -it odoo_lab_core odoo shell -d odoo_lab_core < delete_invoice.py
  
  Ou avec un nom de facture:
  INVOICE_NAME=FAC/2026/00001 docker exec -it odoo_lab_core odoo shell -d odoo_lab_core < delete_invoice.py
"""

import os

# Récupérer l'ID ou le nom de la facture depuis les variables d'environnement
invoice_id = os.environ.get('INVOICE_ID')
invoice_name = os.environ.get('INVOICE_NAME')

# Rechercher la facture
if invoice_id:
    try:
        invoice_id = int(invoice_id)
        invoice = env['account.move'].browse([invoice_id])
        if not invoice.exists():
            print(f"❌ Facture avec ID {invoice_id} introuvable")
            exit(1)
    except ValueError:
        print(f"❌ ID invalide: {invoice_id}")
        exit(1)
elif invoice_name:
    invoice = env['account.move'].search([
        ('name', '=', invoice_name),
        ('move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund'])
    ], limit=1)
    if not invoice:
        print(f"❌ Facture '{invoice_name}' introuvable")
        exit(1)
else:
    # Par défaut: chercher la dernière facture (tous états)
    invoice = env['account.move'].search([
        ('move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund'])
    ], order='id desc', limit=1)
    
    if not invoice:
        print("❌ Aucune facture trouvée")
        exit(1)

print(f"📄 Facture trouvée:")
print(f"   ID: {invoice.id}")
print(f"   Nom: {invoice.name}")
print(f"   Type: {invoice.move_type}")
print(f"   État: {invoice.state}")
print(f"   Client: {invoice.partner_id.name if invoice.partner_id else 'N/A'}")
print(f"   Montant: {invoice.amount_total} {invoice.currency_id.name}")

# Afficher un avertissement si la facture est postée
if invoice.state == 'posted':
    print(f"\n⚠️  ATTENTION: Cette facture est POSTÉE (comptabilisée)")
    print(f"   La suppression nécessite le bypass de la protection dorevia_posted_lock")
    
    # Vérifier si la facture est vaultée
    if hasattr(invoice, 'dorevia_vaulted') and invoice.dorevia_vaulted:
        print(f"   ⚠️  La facture est VAULTÉE - le document reste dans Vault")
    
    # Demander confirmation (en mode interactif)
    # En mode non-interactif, on supprime directement avec le bypass
    print(f"\n🔄 Suppression de la facture {invoice.name}...")

# Supprimer avec bypass de la protection posted_lock
try:
    # Si la facture est postée, il faut d'abord la remettre en draft via SQL
    # car Odoo core bloque la suppression des lignes postées
    if invoice.state == 'posted':
        print(f"🔄 Remise en draft via SQL (bypass Odoo core)...")
        try:
            # Mettre la facture en draft directement en SQL pour bypasser toutes les protections
            env.cr.execute("""
                UPDATE account_move 
                SET state = 'draft' 
                WHERE id = %s
            """, (invoice.id,))
            
            # Mettre les lignes en draft aussi
            env.cr.execute("""
                UPDATE account_move_line 
                SET parent_state = 'draft' 
                WHERE move_id = %s
            """, (invoice.id,))
            
            env.cr.commit()
            # Recharger l'objet depuis la base
            invoice.invalidate_recordset(['state'])
            invoice = env['account.move'].browse([invoice.id])
            print(f"   ✅ Facture et lignes remises en draft (nouvel état: {invoice.state})")
        except Exception as sql_error:
            print(f"   ⚠️  Erreur SQL: {str(sql_error)}")
            print(f"   💡 Solution: Annulez manuellement la facture depuis l'interface Odoo")
            import traceback
            traceback.print_exc()
            exit(1)
    elif invoice.state == 'draft':
        print(f"ℹ️  Facture déjà en brouillon, suppression directe...")
    else:
        print(f"ℹ️  État de la facture: {invoice.state}, suppression...")
    
    # Supprimer la facture et ses lignes avec bypass complet
    print(f"🔄 Suppression de la facture et de ses lignes comptables...")
    invoice.with_context(skip_posted_lock=True).unlink()
    print(f"✅ Facture {invoice.name if invoice.name else f'ID {invoice.id}'} supprimée avec succès!")
except Exception as e:
    print(f"❌ Erreur lors de la suppression: {str(e)}")
    print(f"\n💡 Solution recommandée:")
    print(f"   1. Allez dans l'interface Odoo")
    print(f"   2. Ouvrez la facture {invoice.name if invoice.name else f'ID {invoice.id}'}")
    if invoice.state == 'posted':
        print(f"   3. Cliquez sur 'Annuler' (button_cancel)")
        print(f"   4. Puis supprimez-la normalement")
    else:
        print(f"   3. Supprimez-la normalement")
    import traceback
    traceback.print_exc()
    exit(1)

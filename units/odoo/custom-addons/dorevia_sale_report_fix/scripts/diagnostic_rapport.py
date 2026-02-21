#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de diagnostic pour identifier quel rapport est utilisé pour les devis/commandes
et vérifier si external_layout est présent dans le template.
"""

import xmlrpc.client
import sys

# Configuration (à adapter selon votre instance)
ODOO_URL = "http://localhost:8069"
ODOO_DB = "odoo_db_lab_core"  # À adapter
ODOO_USERNAME = "admin"  # À adapter
ODOO_PASSWORD = "admin"  # À adapter

def get_odoo_models(url, db, username, password):
    """Connexion à Odoo et récupération des modèles"""
    try:
        common = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/common')
        uid = common.authenticate(db, username, password, {})
        
        if not uid:
            print("❌ Erreur d'authentification")
            return None, None
        
        models = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/object')
        return models, uid
    except Exception as e:
        print(f"❌ Erreur de connexion : {e}")
        return None, None

def diagnostic_rapports():
    """Diagnostic des rapports de vente"""
    print("🔍 Diagnostic des rapports de devis/commandes\n")
    
    models, uid = get_odoo_models(ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD)
    if not models:
        print("⚠️  Impossible de se connecter à Odoo")
        print("   Vérifiez les paramètres dans le script (ODOO_URL, ODOO_DB, etc.)")
        return
    
    # Rechercher tous les rapports pour sale.order
    reports = models.execute_kw(
        ODOO_DB, uid, ODOO_PASSWORD,
        'ir.actions.report', 'search_read',
        [[('model', '=', 'sale.order')]],
        {'fields': ['name', 'report_name', 'report_file', 'report_type', 'binding_type']}
    )
    
    print(f"📊 Rapports trouvés pour sale.order : {len(reports)}\n")
    
    for report in reports:
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"📄 Rapport : {report['name']}")
        print(f"   Nom technique : {report['report_name']}")
        print(f"   Fichier : {report['report_file']}")
        print(f"   Type : {report['report_type']}")
        print(f"   Binding : {report['binding_type']}")
        
        # Vérifier le template QWeb
        if report['report_file']:
            try:
                views = models.execute_kw(
                    ODOO_DB, uid, ODOO_PASSWORD,
                    'ir.ui.view', 'search_read',
                    [[('name', '=', report['report_file'])]],
                    {'fields': ['name', 'arch', 'inherit_id'], 'limit': 1}
                )
                
                if views:
                    view = views[0]
                    has_external_layout = 'external_layout' in view.get('arch', '')
                    has_html_container = 'html_container' in view.get('arch', '')
                    
                    print(f"   Template QWeb : {view['name']}")
                    print(f"   ✅ external_layout : {'OUI' if has_external_layout else '❌ NON'}")
                    print(f"   ✅ html_container : {'OUI' if has_html_container else 'NON'}")
                    
                    if view.get('inherit_id'):
                        print(f"   Hérite de : {view['inherit_id'][1]}")
                else:
                    print(f"   ⚠️  Template QWeb non trouvé")
            except Exception as e:
                print(f"   ⚠️  Erreur lors de la vérification du template : {e}")
        
        print()
    
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("\n💡 Pour vérifier quel rapport est utilisé :")
    print("   1. Ouvrir un devis/commande dans Odoo")
    print("   2. Cliquer sur 'Imprimer'")
    print("   3. Noter le nom du rapport sélectionné")
    print("   4. Comparer avec les rapports listés ci-dessus")

if __name__ == '__main__':
    diagnostic_rapports()


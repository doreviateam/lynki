#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de diagnostic pour vérifier la présence d'external_layout dans les vues QWeb
"""

import sys
import os

# Ajouter le chemin Odoo
sys.path.insert(0, '/usr/lib/python3/dist-packages')

try:
    import odoo
    from odoo import api, SUPERUSER_ID
    from odoo.tools import config
    
    # Configuration Odoo
    config.parse_config(['-c', '/etc/odoo/odoo.conf'])
    
    # Initialiser Odoo
    odoo.tools.config.parse_config(['-c', '/etc/odoo/odoo.conf'])
    registry = odoo.registry(config['db_name'])
    
    with registry.cursor() as cr:
        env = api.Environment(cr, SUPERUSER_ID, {})
        
        # Vérifier les vues
        views_to_check = [
            'sale.report_saleorder',
            'sale.report_saleorder_raw',
            'sale.report_saleorder_document',
        ]
        
        print("=" * 80)
        print("DIAGNOSTIC DES VUES QWEB - external_layout")
        print("=" * 80)
        
        for view_name in views_to_check:
            print(f"\n📋 Vue : {view_name}")
            print("-" * 80)
            
            # Récupérer la vue
            view = env['ir.ui.view'].search([('name', '=', view_name)], limit=1)
            
            if not view:
                print(f"❌ Vue '{view_name}' non trouvée")
                continue
            
            # Récupérer l'arch effectif (après tous les héritages)
            arch = view._get_combined_arch()
            
            # Vérifier la présence d'external_layout
            has_external_layout = 'external_layout' in arch or 't-call="web.external_layout"' in arch or "t-call='web.external_layout'" in arch
            
            if has_external_layout:
                print(f"✅ external_layout est PRÉSENT")
                # Trouver la ligne exacte
                lines = arch.split('\n')
                for i, line in enumerate(lines, 1):
                    if 'external_layout' in line:
                        print(f"   Ligne {i}: {line.strip()[:100]}")
            else:
                print(f"❌ external_layout est ABSENT")
                print(f"   Début du template (100 premiers caractères):")
                print(f"   {arch[:100]}...")
            
            # Vérifier les modules qui héritent cette vue
            inherits = env['ir.ui.view'].search([
                ('inherit_id', '=', view.id)
            ])
            
            if inherits:
                print(f"\n   Modules qui héritent cette vue:")
                for inherit in inherits:
                    module = inherit.module or 'base'
                    print(f"   - {module}.{inherit.name}")
        
        print("\n" + "=" * 80)
        print("FIN DU DIAGNOSTIC")
        print("=" * 80)
        
except Exception as e:
    print(f"❌ Erreur : {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)


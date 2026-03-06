# -*- coding: utf-8 -*-
{
    'name': 'Dorevia Sale Report Fix (nok)',
    'version': '1.0.0',
    'category': 'Sales',
    'summary': 'Correction du external_layout pour les rapports de devis/commandes',
    'description': """
        Module pour corriger le problème d'external_layout dans les rapports PDF
        des devis et commandes de vente.
        
        Problème corrigé :
        - Les PDF de devis/commandes n'utilisaient pas le external_layout
        - Le layout standard Odoo (en-tête, pied de page) n'était pas appliqué
        
        Solution :
        - Héritage du template de rapport sale.order
        - Forçage de l'utilisation de web.external_layout
    """,
    'author': 'Dorevia Team',
    'website': 'https://doreviateam.com',
    'depends': [
        'base',
        'sale',
    ],
    'data': [
        'views/sale_report_templates.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}


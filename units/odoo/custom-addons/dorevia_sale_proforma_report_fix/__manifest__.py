# -*- coding: utf-8 -*-
{
    'name': 'Dorevia Sale Proforma Report Fix',
    'version': '1.0.0',
    'category': 'Sales',
    'summary': 'Correction du external_layout pour les factures pro forma',
    'description': """
        Module pour corriger le problème d'external_layout dans les rapports PDF
        des factures pro forma.
        
        Problème corrigé :
        - Les PDF de factures pro forma n'utilisaient pas le external_layout
        - Le layout standard Odoo (en-tête, pied de page) n'était pas appliqué
        - Contenu tassé à gauche avec zone blanche à droite
        
        Solution :
        - Héritage du template de rapport sale.report_saleorder_pro_forma
        - Forçage de l'utilisation de web.external_layout
    """,
    'author': 'Dorevia Team',
    'website': 'https://doreviateam.com',
    'depends': [
        'base',
        'sale',
    ],
    'data': [
        'views/sale_proforma_report_templates.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}


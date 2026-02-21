# -*- coding: utf-8 -*-
{
    "name": "Dorevia Report PDF Layout Fix",
    "version": "18.0.1.0.0",
    "category": "Reporting",
    "summary": "Fix mise en page PDF (Bootstrap col-*) pour Sale/Account",
    "description": """
        Module transversal pour corriger la mise en page PDF des rapports Odoo.
        
        Problème corrigé :
        - Les PDF de devis, commandes, pro forma et factures ont des totaux étroits (col-6 = 50%)
        - Grande zone blanche à droite
        - Contenu tassé à gauche
        
        Solution :
        - Modification des classes Bootstrap en PDF uniquement (via xpath)
        - CSS personnalisé pour forcer la largeur si l'xpath ne fonctionne pas
        - col-6 → col-12 en PDF (pleine largeur)
        - HTML inchangé (col-sm-7 col-md-6 conservé)
        
        Note : Le support pour les factures (Account) sera ajouté en v1.1
        après analyse de la structure du template account.report_invoice_document.
    """,
    "author": "Dorevia Team",
    "website": "https://doreviateam.com",
    "depends": ["sale"],
    "data": [
        "views/sale_report_templates.xml",
        # "views/account_report_templates.xml",  # Temporairement désactivé - à corriger
    ],
    "assets": {
        "web.assets_backend": [
            "dorevia_report_pdf_layout_fix/static/src/css/report_pdf_layout_fix.css",
        ],
    },
    "installable": True,
    "application": False,
    "auto_install": False,
    "license": "LGPL-3",
}

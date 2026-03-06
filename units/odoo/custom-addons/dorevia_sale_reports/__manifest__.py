# -*- coding: utf-8 -*-
{
    "name": "Dorevia Sale Reports(NOK)",
    "version": "18.0.1.1.0",
    "category": "Sales/Reporting",
    "summary": "Modèles d'impression Dorevia (Devis, Commandes, Pro Forma) — PDF layout stable",
    "description": """
        Ajoute des rapports Dorevia (standard conservé) et stabilise le rendu PDF.
        
        Ce module fournit des modèles d'impression personnalisés pour les documents commerciaux :
        - Layout optimisé pour PDF (totaux pleine largeur, meilleure lisibilité)
        - Templates QWeb personnalisés basés sur les standards Odoo
        - Compatible avec external_layout standard Odoo (en-tête, pied de page, logo)
        
        Documents inclus :
        - Devis / Quotation
        - Commandes / Sales Order  
        - Factures Pro Forma / Pro Forma Invoice
        
        Les rapports standards Odoo restent disponibles pour comparaison et fallback.
    """,
    "author": "Dorevia Team",
    "website": "https://doreviateam.com",
    "depends": [
        "sale",
        "web",
    ],
    "data": [
        "reports/sale_reports.xml",
        "views/sale_report_templates.xml",
    ],
    "installable": True,
    "application": False,
    "auto_install": False,
    "license": "LGPL-3",
    "icon": "/dorevia_sale_reports/static/description/icon.png",
}

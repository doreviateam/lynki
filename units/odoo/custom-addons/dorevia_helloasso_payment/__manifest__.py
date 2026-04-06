# -*- coding: utf-8 -*-
{
    "name": "Dorevia — HelloAsso Payment",
    "version": "19.0.1.1.0",
    "category": "Dorevia",
    "summary": "Objet pivot MVP des paiements HelloAsso dans Odoo",
    "description": """
        Module transverse HelloAsso Payment :
        - modèle métier ``dorevia.helloasso.payment``
        - idempotence par compte HelloAsso + référence paiement
        - base de travail pour les futurs flux paiements, reversements et intégrations comptables

        Ce lot pose le pivot métier, sans ouvrir encore la synchronisation complète ni la comptabilité.
    """,
    "author": "Dorevia Team",
    "website": "https://doreviateam.com",
    "license": "LGPL-3",
    "depends": [
        "base",
        "dorevia_helloasso_connector",
        "dorevia_helloasso_members",
    ],
    "data": [
        "data/ir_cron_data.xml",
        "security/ir.model.access.csv",
        "security/ir_rule_helloasso_payment.xml",
        "views/helloasso_payment_views.xml",
        "views/helloasso_payment_api_import_wizard_views.xml",
        "views/helloasso_payment_csv_wizard_views.xml",
        "views/helloasso_payment_api_preview_wizard_views.xml",
    ],
    "installable": True,
    "application": False,
}

# -*- coding: utf-8 -*-
{
    "name": "Dorevia — HelloAsso Payment",
    "version": "19.0.1.0.0",
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
        "security/ir.model.access.csv",
    ],
    "installable": True,
    "application": False,
}

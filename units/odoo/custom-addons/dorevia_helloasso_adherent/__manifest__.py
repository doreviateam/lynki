# -*- coding: utf-8 -*-
{
    "name": "Dorevia — HelloAsso adhérents (MVP)",
    "version": "19.0.1.0.1",
    "category": "Dorevia",
    "summary": "Connecteur MVP : synchronisation des adhérents HelloAsso vers res.partner",
    "description": """
        Squelette MVP (SPEC ZeDocs/Projet_LGZ/HelloAsso) :
        - Paramètres API (client ID / secret, sandbox, slug organisation)
        - « Tester la connexion » : OAuth2 client_credentials + ping formTypes si slug renseigné
        - « Synchroniser les adhérents » : stub (mapping SPEC §6.2)
        - Champs de traçabilité HelloAsso sur le partenaire
    """,
    "author": "Dorevia Team",
    "website": "https://doreviateam.com",
    "license": "LGPL-3",
    "depends": [
        "base",
        "base_setup",
        "contacts",
    ],
    "external_dependencies": {
        "python": ["requests"],
    },
    "data": [
        "views/res_config_settings_views.xml",
        "views/res_partner_views.xml",
    ],
    "installable": True,
    "application": True,
}

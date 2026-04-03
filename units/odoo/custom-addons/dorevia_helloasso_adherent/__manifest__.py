# -*- coding: utf-8 -*-
{
    "name": "Dorevia — HelloAsso adhérents (MVP)",
    "version": "19.0.1.0.0",
    "category": "Dorevia",
    "summary": "Connecteur MVP : synchronisation des adhérents HelloAsso vers res.partner",
    "description": """
        Squelette MVP (SPEC ZeDocs/Projet_LGZ/HelloAsso) :
        - Paramètres API (client ID / secret, sandbox, slug organisation)
        - Actions « Tester la connexion » et « Synchroniser les adhérents » (stubs)
        - Champs de traçabilité HelloAsso sur le partenaire
        L’appel HTTP OAuth et le mapping métier sont à compléter après audit API (SPEC §6.2).
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

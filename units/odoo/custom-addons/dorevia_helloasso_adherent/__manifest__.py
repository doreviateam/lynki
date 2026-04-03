# -*- coding: utf-8 -*-
{
    "name": "Dorevia — HelloAsso adhérents (MVP)",
    "version": "19.0.1.0.18",
    "category": "Dorevia",
    "summary": "Connecteur MVP : synchronisation des adhérents HelloAsso vers res.partner",
    "description": """
        Squelette MVP (SPEC ZeDocs/Projet_LGZ/HelloAsso) :
        - Paramètres API (client ID / secret, sandbox, slug organisation)
        - « Tester la connexion » : OAuth2 client_credentials + ping formTypes si slug renseigné
        - « Prévisualiser les données HelloAsso » : rapport + JSON brut orders/payments pour audit SPEC
        - « Synchroniser les adhérents » : MVP payments (Membership + Registered) → res.partner
        - Champs traçabilité sur res.partner : module dorevia_partner_membership_fields
    """,
    "author": "Dorevia Team",
    "website": "https://doreviateam.com",
    "license": "LGPL-3",
    "depends": [
        "base",
        "base_setup",
        "contacts",
        "dorevia_partner_membership_fields",
        "dorevia_res_config_dms_shim",
    ],
    "external_dependencies": {
        "python": ["requests"],
    },
    "data": [
        "security/ir.model.access.csv",
        "data/ir_cron_data.xml",
        "views/helloasso_preview_wizard_views.xml",
        "views/res_config_settings_views.xml",
    ],
    "installable": True,
    "application": True,
}

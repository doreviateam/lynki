# -*- coding: utf-8 -*-
{
    "name": "Dorevia — HelloAsso Members",
    "version": "19.0.1.9.0",
    "category": "Dorevia",
    "summary": "Synchronisation HelloAsso Membership → res.partner (API v5)",
    "description": """
        Module métier **Members** (refonte HelloAsso) :
        - Paramètres API partagés (sandbox, slug, nom d’organisation affiché optionnel, client ID / secret)
        - Synchro paiements Membership éligibles → contacts
        - Prévisualisation lecture seule, planificateur **actif par défaut** (toutes les **6 h** si identifiants OK ; modifiable), actions Paramètres

        Dépend du socle ``dorevia_helloasso_connector`` (client HTTP, journal).
    """,
    "author": "Dorevia Team",
    "website": "https://doreviateam.com",
    "license": "LGPL-3",
    "depends": [
        "base",
        "base_setup",
        "contacts",
        "dorevia_helloasso_connector",
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
    "application": False,
}

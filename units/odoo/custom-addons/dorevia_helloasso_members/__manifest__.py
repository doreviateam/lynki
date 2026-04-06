# -*- coding: utf-8 -*-
{
    "name": "Dorevia — HelloAsso Members",
    "version": "19.0.1.28.0",
    "category": "Dorevia",
    "summary": "Synchronisation HelloAsso Membership → res.partner (API v5)",
    "description": """
        Module métier **Members** (refonte HelloAsso) :
        - **Compte HelloAsso** (``dorevia.helloasso.account``) : **une société Odoo = un compte** (environnement, slug, identifiants) ; repli res.company + ICP si aucun compte
        - Synchro paiements Membership éligibles → contacts
        - Prévisualisation lecture seule, planificateur **actif par défaut** (toutes les **6 h** si identifiants OK ; modifiable), actions Paramètres

        Dépend du socle ``dorevia_helloasso_connector`` (client HTTP, journal).
    """,
    "author": "Dorevia Team",
    "website": "https://doreviateam.com",
    "license": "LGPL-3",
    "icon": "/dorevia_helloasso_members/static/description/icon.png",
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
        "security/ir_rule_helloasso_res_partner.xml",
        "views/helloasso_account_views.xml",
        "data/ir_cron_data.xml",
        "views/helloasso_preview_wizard_views.xml",
        "views/res_config_settings_views.xml",
    ],
    "installable": True,
    "application": False,
    "post_init_hook": "post_init_hook",
}

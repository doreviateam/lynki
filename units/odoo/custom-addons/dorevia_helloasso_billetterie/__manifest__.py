# -*- coding: utf-8 -*-
{
    "name": "Dorevia — HelloAsso billetterie (MVP)",
    "version": "19.0.1.71.0",
    "category": "Dorevia",
    "summary": "Connecteur MVP : commandes billetterie HelloAsso → Odoo (traçabilité, payeur, lignes)",
    "description": """
        MVP aligné ZeDocs/Projet_LGZ/HelloAsso_billetterie (SPEC / ADR) :
        - Réutilise ``dorevia_helloasso_connector`` et ``dorevia_helloasso_members`` (paramètres API **par société**)
        - Paramètres billetterie par société : type de campagne par défaut, identifiant optionnel
        - Prévisualisation et import manuel des commandes
        - Modèle d’ancrage ``dorevia.helloasso.billetterie.order`` + lignes participants
        - Cron billetterie **actif par défaut** (toutes les **6 h**) : inventaire Event + import commandes pour chaque ligne d’inventaire (repli sur paramètres ICP si inventaire vide)
        - Menu Billetteries : consultation référentiel ; import contextualisé en en-tête ; rechargement API et autres outils via menu Action
        - Journal ``dorevia.helloasso.logentry`` (socle connector) : pas d’entrée sous l’app HelloAsso pour l’instant
        - App HelloAsso : entrée « accueil » (aperçu chiffré + raccourcis) | Adhésion | Billetterie (Billetteries, Commandes)
    """,
    "author": "Dorevia Team",
    "website": "https://doreviateam.com",
    "license": "LGPL-3",
    "icon": "/dorevia_helloasso_billetterie/static/description/icon.png",
    "depends": [
        "web",
        "base",
        "base_setup",
        "contacts",
        "dorevia_helloasso_connector",
        "dorevia_helloasso_members",
        "dorevia_partner_membership_fields",
        "dorevia_res_config_dms_shim",
    ],
    "external_dependencies": {
        "python": ["requests"],
    },
    "data": [
        "security/ir.model.access.csv",
        "security/ir_rule_helloasso_billetterie.xml",
        "data/ir_cron_data.xml",
        "views/helloasso_billetterie_sync_wizard_views.xml",
        "views/helloasso_billetterie_form_views.xml",
        "views/helloasso_billetterie_order_views.xml",
        "views/helloasso_partner_membership_views.xml",
        "views/helloasso_billetterie_act_windows.xml",
        "views/helloasso_menu_lot1.xml",
    ],
    "installable": True,
    "application": False,
    "post_init_hook": "post_init_hook",
    "assets": {
        "web.assets_backend": [
            "dorevia_helloasso_billetterie/static/src/js/helloasso_menu_service_patch.esm.js",
        ],
    },
}

# -*- coding: utf-8 -*-
{
    "name": "Dorevia — HelloAsso billetterie (MVP)",
    "version": "19.0.1.12.0",
    "category": "Dorevia",
    "summary": "Connecteur MVP : commandes billetterie HelloAsso → Odoo (traçabilité, payeur, lignes)",
    "description": """
        MVP aligné ZeDocs/Projet_LGZ/HelloAsso_billetterie (SPEC / ADR) :
        - Réutilise identifiants API et slug organisation du module adhérent
        - Paramètres billetterie : formType (défaut Event), formSlug optionnel
        - Prévisualisation et synchro manuelle des commandes (API orders)
        - Modèle d’ancrage ``dorevia.helloasso.billetterie.order`` + lignes participants
        - Cron désactivé par défaut (palier 2)
        - Inventaire formulaires HelloAsso (``dorevia.helloasso.billetterie.form``) puis Commandes + Synchronisation
        - Menu Journal des synchros (``dorevia.helloasso.logentry`` dans le module adhérent)
        - App HelloAsso : Adhésions, Billetterie (formulaires, commandes, synchro), Configuration
    """,
    "author": "Dorevia Team",
    "website": "https://doreviateam.com",
    "license": "LGPL-3",
    "depends": [
        "base",
        "base_setup",
        "contacts",
        "dorevia_helloasso_adherent",
        "dorevia_partner_membership_fields",
        "dorevia_res_config_dms_shim",
    ],
    "external_dependencies": {
        "python": ["requests"],
    },
    "data": [
        "security/ir.model.access.csv",
        "data/ir_cron_data.xml",
        "views/helloasso_billetterie_form_views.xml",
        "views/helloasso_billetterie_order_views.xml",
        "views/helloasso_billetterie_sync_wizard_views.xml",
        "views/helloasso_partner_membership_views.xml",
        "views/helloasso_menu_lot1.xml",
        "views/res_config_settings_views.xml",
    ],
    "installable": True,
    "application": False,
}

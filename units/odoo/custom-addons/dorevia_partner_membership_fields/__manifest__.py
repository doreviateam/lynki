# -*- coding: utf-8 -*-
{
    "name": "Dorevia — champs adhérent / consentement",
    "version": "19.0.1.0.2",
    "category": "Dorevia",
    "summary": "Type d'adhérent et consentement sur les partenaires (complète partner-contact)",
    "author": "Dorevia Team",
    "website": "https://doreviateam.com",
    "license": "LGPL-3",
    "depends": [
        "contacts",
        "dorevia_helloasso_adherent",
        "partner_stage",
        "partner_contact_personal_information_page",
    ],
    "data": [
        "security/ir.model.access.csv",
        "views/res_partner_member_type_views.xml",
        "views/res_partner_views.xml",
    ],
    "installable": True,
    "application": False,
}

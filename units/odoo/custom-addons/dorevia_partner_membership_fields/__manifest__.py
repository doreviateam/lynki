# -*- coding: utf-8 -*-
{
    "name": "Dorevia — champs adhérent / consentement",
    "version": "19.0.1.0.5",
    "category": "Dorevia",
    "summary": "Type d'adhérent, consentement, date de naissance (OCA) sur les partenaires",
    "author": "Dorevia Team",
    "website": "https://doreviateam.com",
    "license": "LGPL-3",
    "depends": [
        "contacts",
        "partner_stage",
        "partner_contact_birthdate",
    ],
    "data": [
        "security/ir.model.access.csv",
        "views/res_partner_member_type_views.xml",
        "views/res_partner_views.xml",
    ],
    "post_init_hook": "post_init_hook",
    "installable": True,
    "application": False,
}

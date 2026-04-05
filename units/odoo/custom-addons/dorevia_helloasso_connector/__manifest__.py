# -*- coding: utf-8 -*-
{
    "name": "Dorevia — HelloAsso connector (socle)",
    "version": "19.0.1.0.1",
    "category": "Dorevia",
    "summary": "Socle technique HelloAsso : client API v5, OAuth, journal des synchros",
    "description": """
        Premier lot de la refonte HelloAsso :
        - Client HTTP / OAuth2 (API v5) — ``helloasso_client``
        - Modèle transverse ``dorevia.helloasso.logentry`` + ``helloasso_sync_log_push``
        - Vues du journal (admin)

        Ne contient pas la synchro métier Members / Events (modules ``dorevia_helloasso_adherent`` etc.).
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
        "views/helloasso_sync_log_views.xml",
    ],
    "installable": True,
    "application": False,
}

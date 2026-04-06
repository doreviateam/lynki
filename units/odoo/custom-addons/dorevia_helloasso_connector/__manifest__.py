# -*- coding: utf-8 -*-
{
    "name": "Dorevia — HelloAsso connector (socle)",
    "version": "19.0.1.2.0",
    "category": "Dorevia",
    "summary": "Socle technique HelloAsso : client API v5, OAuth, journal des synchros",
    "description": """
        Premier lot de la refonte HelloAsso :
        - Client HTTP / OAuth2 (API v5) — ``helloasso_client`` + ``HelloAssoConnectionContext`` (appels nominaux Lot 2)
        - Modèle transverse ``dorevia.helloasso.logentry`` + ``helloasso_sync_log_push``
        - Vues du journal (admin)

        Ne contient pas la synchro métier Members / Events (voir ``dorevia_helloasso_members``).
    """,
    "author": "Dorevia Team",
    "website": "https://doreviateam.com",
    "license": "LGPL-3",
    "icon": "/dorevia_helloasso_connector/static/description/icon.png",
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

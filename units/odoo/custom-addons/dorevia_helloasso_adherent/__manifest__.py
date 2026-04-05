# -*- coding: utf-8 -*-
{
    "name": "Dorevia — HelloAsso adhérents (shim legacy)",
    "version": "19.0.2.0.1",
    "category": "Dorevia",
    "summary": "Shim : installe HelloAsso Members — à terme remplacé par dorevia_helloasso_app",
    "description": """
        **Module de compatibilité** après refonte HelloAsso.

        Ne contient plus de code Python : il ne fait que dépendre de
        ``dorevia_helloasso_members`` pour que les bases et scripts qui référencent
        encore ``dorevia_helloasso_adherent`` continuent à résoudre la chaîne
        connector → members.

        Nouvelle intégration : installer **HelloAsso Members** (ou le futur module app).
    """,
    "author": "Dorevia Team",
    "website": "https://doreviateam.com",
    "license": "LGPL-3",
    "depends": [
        "dorevia_helloasso_members",
    ],
    "installable": True,
    "application": True,
}

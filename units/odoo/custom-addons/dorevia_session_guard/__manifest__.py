# -*- coding: utf-8 -*-
{
    'name': 'Dorevia Session Guard',
    'version': '1.0.0',
    'category': 'Productivity',
    'summary': 'Auto-déconnexion et redirection Linky pour utilisateurs concernés',
    'description': """
        Module Odoo pour sécuriser les sessions :
        - Intégration OCA web_session_auto_close (déconnexion après inactivité)
        - Redirection vers Linky pour les utilisateurs du groupe "Linky Users"
        - Cookie dorevia_linky pour survivre à l'expiration de session
        - Whitelist stricte anti open-redirect
    """,
    'author': 'Dorevia Team',
    'website': 'https://doreviateam.com',
    'depends': [
        'web',
        'web_session_auto_close',
    ],
    'data': [
        'security/ir.model.access.csv',
        'security/res_groups.xml',
        'data/ir_config_parameter.xml',
        'data/res_users_linky.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'AGPL-3',
}

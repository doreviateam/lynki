# -*- coding: utf-8 -*-
{
    'name': 'Dorevia Posted Lock',
    'version': '1.0.0',
    'category': 'Accounting',
    'summary': 'Verrouillage WORM-like des factures posted (immutabilité)',
    'description': """
        Module Odoo pour verrouiller les factures (account.move) à l'état 'posted',
        conformément à la Règle Fondatrice Dorevia #2 : Immutabilité des documents comptables.
        
        Fonctionnalités :
        - Blocage des modifications de factures posted (write)
        - Blocage de la suppression de factures posted (unlink)
        - Blocage du reset to draft (button_draft)
        - Protection des lignes de facture (account.move.line)
        - Whitelist pour réconciliation et chatter/attachments
        - Bypass pour migrations (context skip_posted_lock)
        - Préparation v1.1 : champ dorevia_vaulted pour verrouillage renforcé
        
        Règle Fondatrice Dorevia #2 :
        "Tout document comptable à l'état POSTED est définitif et immuable.
        Toute correction passe par un nouveau document comptable (annulation, avoir, contre-passation)."
    """,
    'author': 'Dorevia Team',
    'website': 'https://doreviateam.com',
    'depends': [
        'base',
        'account',
        'mail',  # Optionnel, pour chatter/attachments
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/ir_config_parameter.xml',
        'views/account_move_views.xml',
        'views/menus.xml',
    ],
    'installable': True,
    'application': False,
    'icon': '/dorevia_posted_lock/static/description/icon.png',
    'auto_install': False,
    'license': 'LGPL-3',
}


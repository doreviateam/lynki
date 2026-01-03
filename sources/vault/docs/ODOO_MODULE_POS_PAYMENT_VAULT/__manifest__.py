# -*- coding: utf-8 -*-
{
    'name': 'Dorevia Vault POS Payment',
    'version': '1.0.0',
    'category': 'Point of Sale',
    'summary': 'Vue Vault premium pour les paiements POS',
    'description': """
        Module Dorevia Vault pour les paiements POS
        ============================================
        
        Ce module ajoute une vue Vault premium pour les paiements POS avec :
        - Layout 3 cartes alignées (Conformité | Preuve | Chaînage)
        - Bandeau synthèse en haut
        - Audit technique en accordéon
        - Conforme à la Charte UX Dorevia Vault Views v1.0
    """,
    'author': 'Doreviateam',
    'website': 'https://doreviateam.com',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'point_of_sale',
    ],
    'data': [
        'views/pos_payment_vault_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'dorevia_vault_pos_payment/static/src/css/vault_pos_payment_views.css',
        ],
    },
    'external_dependencies': {
        'python': ['PyJWT'],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
}


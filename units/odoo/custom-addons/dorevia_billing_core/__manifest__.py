# -*- coding: utf-8 -*-
{
    'name': 'Dorevia Billing CORE',
    'version': '1.0.0',
    'category': 'Accounting',
    'summary': 'Réception des constats mensuels et facturation MRR',
    'description': """
        Module Odoo CORE pour la réception des constats mensuels transmis par Dorevia Vault
        et la génération automatique des factures MRR basées sur les volumes constatés.
        
        Fonctionnalités :
        - Réception des constats via API REST (POST /api/v1/constats)
        - Rattachement automatique tenant + contrat
        - Calcul des montants avec règles tarifaires (paliers, remises, TVA)
        - Génération automatique des factures MRR
        - Vérification JWS non bloquante
    """,
    'author': 'Dorevia Team',
    'website': 'https://doreviateam.com',
    'depends': [
        'base',
        'account',
        'contacts',
    ],
    # Note: PyJWT et requests sont optionnels
    # Si non installés, la vérification JWS sera désactivée automatiquement
    # 'external_dependencies': {
    #     'python': ['PyJWT', 'requests'],
    # },
    'data': [
        'security/ir.model.access.csv',
        'security/security.xml',
        'data/ir_config_parameter.xml',
        'views/dorevia_constat_views.xml',
        'views/dorevia_contract_views.xml',
        'views/dorevia_pricing_rule_views.xml',
        'views/menus.xml',
    ],
    'installable': True,
    'application': True,
    'icon': '/dorevia_billing_core/static/description/icon.png',
    'auto_install': False,
    'license': 'LGPL-3',
}


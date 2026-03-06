# -*- coding: utf-8 -*-
{
    'name': 'Dorevia Vault Connector',
    'version': '1.1.1',
    'category': 'Accounting',
    'summary': 'Vaulting automatique des factures et paiements dans Dorevia Vault',
    'description': """
        Connecteur entre Odoo et Dorevia Vault (coffre-fort numérique).
        
        SPEC : Orchestration Temps Réel du Vaulting v1.1 / v1.1.1
        
        Fonctionnalités :
        - Vaulting automatique des factures à la validation (action_post)
        - Machine d'état : todo → pending_proof → vaulted / failed_soft / failed_hard
        - Backoff exponentiel avec retry CRON
        - Clé d'idempotence SHA-256
        - Récupération automatique des preuves cryptographiques
        - Attestation téléchargeable (JSON signé)
        - Intégration queue_job (OCA) pour orchestration temps réel
        - Métriques de vaulting (observabilité)
        - Vaulting des paiements (card Linky)
    """,
    'author': 'Dorevia Team',
    'website': 'https://doreviateam.com',
    'depends': [
        'base',
        'account',
        'account_reconcile_oca',  # reconcile_bank_line / unreconcile_bank_line pour RECONCIL temps réel
    ],
    'external_dependencies': {
        'python': ['requests'],
    },
    'data': [
        'security/ir.model.access.csv',
        'data/ir_model_data.xml',
        'data/ir_actions_server.xml',
        'data/ir_cron.xml',
        'views/account_move_views.xml',
        'views/account_payment_views.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
    'post_load': None,
}

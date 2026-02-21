# -*- coding: utf-8 -*-
{
    'name': 'Dorevia Core',
    'version': '18.0.1.0.0',
    'category': 'Dorevia',
    'summary': 'Config et utilitaires communs Dorevia (Vault, Adapter)',
    'description': """
        Couche minimale partagée par les modules dorevia_*.
        
        SPEC ERP Reconnect v1.2 — Annexe Architecture Odoo 18.
        
        Paramètres : Vault URL, tokens, timeouts, tenant.
        Aucune logique métier ERP.
    """,
    'author': 'Dorevia Team',
    'website': 'https://doreviateam.com',
    'depends': ['base'],
    'data': [],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}

# -*- coding: utf-8 -*-
{
    'name': 'Dorevia Adapter Odoo 18',
    'version': '18.0.1.0.0',
    'category': 'Dorevia',
    'summary': 'Adapter ERP : endpoints replay (partner, invoice, payment) — SPEC ERP Reconnect v1.2',
    'description': """
        Adapter ERP cible pour Vault Replay.
        
        Endpoints techniques appelés par le Runner :
        - POST /dorevia/replay/partner/upsert
        - POST /dorevia/replay/invoice/create_synth
        - POST /dorevia/replay/payment/create
        
        Modèle dorevia.replay.mapping (idempotence par event_id).
        Produit synthétique « Vente HT (Vault) » créé à l'install.
    """,
    'author': 'Dorevia Team',
    'website': 'https://doreviateam.com',
    'depends': ['dorevia_core', 'account', 'product'],
    'data': [
        'security/ir.model.access.csv',
        'data/product_data.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}

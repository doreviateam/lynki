# -*- coding: utf-8 -*-
{
    'name': 'Dorevia Vault Connector — Paie',
    'version': '1.0.0',
    'category': 'Accounting',
    'summary': 'Vaulting des bulletins de paie (hr.payslip) vers Dorevia Vault',
    'description': """
        Extension optionnelle du connecteur Vault : envoi des bulletins de paie
        (hr.payslip) vers DVIG/Vault (payroll.charge.posted).
        À installer uniquement si le module Paie (hr_payroll) est utilisé.
    """,
    'author': 'Dorevia Team',
    'website': 'https://doreviateam.com',
    'depends': [
        'dorevia_vault_connector',
        'hr_payroll',  # fournit hr.payslip
    ],
    'data': [],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}

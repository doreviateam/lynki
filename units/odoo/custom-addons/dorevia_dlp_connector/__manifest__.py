# -*- coding: utf-8 -*-
{
    'name': 'Dorevia DLP Connector',
    'version': '1.0.0',
    'category': 'Services',
    'summary': 'Envoi des validations timesheet vers le service DLP (Decision Link Performance)',
    'description': """
        Connecteur Odoo → DLP.
        Lors de la création d'une ligne de timesheet sur un projet, envoi d'un événement
        au service DLP pour alimenter la card Énergie stratégique dans Linky.
        SPEC_DLP_v0.3 Phase 6.
    """,
    'author': 'Dorevia Team',
    'website': 'https://doreviateam.com',
    'depends': ['project', 'hr_timesheet'],
    'external_dependencies': {'python': ['requests']},
    'data': [
        'security/ir.model.access.csv',
        'data/ir_config_parameter.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}

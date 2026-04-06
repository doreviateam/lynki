# -*- coding: utf-8 -*-
# Ordre : ``helloasso_billetterie_sync`` puis ``helloasso_billetterie_order`` (comodel du One2many)
# puis ``helloasso_billetterie_form`` puis ``helloasso_billetterie_form_captions`` (extension champs affichage)
# puis ``helloasso_billetterie_order_catalog`` (Many2one vers l'inventaire).

from . import res_company
from . import helloasso_ux_labels
from . import helloasso_billetterie_sync
from . import helloasso_billetterie_order
from . import helloasso_billetterie_form
from . import helloasso_billetterie_form_captions
from . import helloasso_billetterie_order_catalog
from . import helloasso_billetterie_cron
from . import helloasso_landing
from . import helloasso_form_guide
from . import res_config_settings
from . import helloasso_billetterie_sync_wizard

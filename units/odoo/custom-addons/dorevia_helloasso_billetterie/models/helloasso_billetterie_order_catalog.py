# -*- coding: utf-8 -*-
"""Extension commande billetterie : lien vers l’inventaire formulaires (fichier dédié pour le chargement Odoo)."""

from odoo import fields, models


class DoreviaHelloassoBilletterieOrderCatalog(models.Model):
    _inherit = "dorevia.helloasso.billetterie.order"

    catalog_form_id = fields.Many2one(
        "dorevia.helloasso.billetterie.form",
        string="Formulaire inventorié",
        ondelete="set null",
        index=True,
        copy=False,
        help="Lien vers la ligne d’inventaire si la synchro a été lancée depuis celle-ci.",
    )

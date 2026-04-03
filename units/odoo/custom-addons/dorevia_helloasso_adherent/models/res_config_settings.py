# -*- coding: utf-8 -*-

from odoo import _, fields, models
from odoo.exceptions import UserError


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    helloasso_use_sandbox = fields.Boolean(
        string="HelloAsso — utiliser le sandbox",
        config_parameter="dorevia_helloasso.use_sandbox",
        help="Si activé, les appels API cibleront l’environnement de test HelloAsso.",
    )
    helloasso_client_id = fields.Char(
        string="HelloAsso — client ID",
        config_parameter="dorevia_helloasso.client_id",
    )
    helloasso_client_secret = fields.Char(
        string="HelloAsso — client secret",
        config_parameter="dorevia_helloasso.client_secret",
    )
    helloasso_organization_slug = fields.Char(
        string="HelloAsso — slug organisation",
        config_parameter="dorevia_helloasso.organization_slug",
        help="organizationSlug dans les chemins API v5.",
    )

    def action_helloasso_test_connection(self):
        """Stub : OAuth + ping API à implémenter (REF_API, SPEC §6.2)."""
        self.ensure_one()
        if not (self.helloasso_client_id and self.helloasso_client_secret):
            raise UserError(
                _("Renseignez le client ID et le client secret HelloAsso avant le test.")
            )
        raise UserError(
            _(
                "Connexion API non implémentée dans ce squelette MVP. "
                "Implémenter OAuth2 et un appel test (ex. formTypes) selon la SPEC §6.2 et REF_API."
            )
        )

    def action_helloasso_sync_members(self):
        """Stub : import adhérents à implémenter (mapping §6.2, rapprochement §7)."""
        self.ensure_one()
        if not self.helloasso_organization_slug:
            raise UserError(_("Renseignez le slug organisation HelloAsso."))
        raise UserError(
            _(
                "Synchronisation non implémentée dans ce squelette MVP. "
                "À brancher après audit payloads (commandes / paiements) et table SPEC §6.2."
            )
        )

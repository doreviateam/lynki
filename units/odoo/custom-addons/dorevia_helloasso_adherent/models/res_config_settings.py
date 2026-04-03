# -*- coding: utf-8 -*-

import logging

from odoo import _, fields, models
from odoo.exceptions import UserError

from .helloasso_client import (
    HelloAssoClientError,
    fetch_client_credentials_token,
    fetch_form_types_sample,
    summarize_form_type_entry,
)

_logger = logging.getLogger(__name__)


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
        """OAuth client_credentials puis ping GET formTypes si slug renseigné (REF_API §2.2, §2.4)."""
        self.ensure_one()
        if not (self.helloasso_client_id and self.helloasso_client_secret):
            raise UserError(
                _("Renseignez le client ID et le client secret HelloAsso avant le test.")
            )
        use_sandbox = bool(self.helloasso_use_sandbox)
        try:
            token_payload = fetch_client_credentials_token(
                self.helloasso_client_id,
                self.helloasso_client_secret,
                use_sandbox,
            )
        except HelloAssoClientError as err:
            raise UserError(str(err)) from err

        env_label = _("sandbox") if use_sandbox else _("production")
        parts = [
            _("Jeton d’accès HelloAsso obtenu avec succès (environnement : %s).") % env_label,
        ]
        expires = token_payload.get("expires_in")
        if expires is not None:
            parts.append(_("Durée indicative du jeton : %s secondes (cf. doc HelloAsso).") % expires)

        slug = (self.helloasso_organization_slug or "").strip()
        if slug:
            try:
                _items, count = fetch_form_types_sample(
                    slug,
                    token_payload["access_token"],
                    use_sandbox,
                )
            except HelloAssoClientError as err:
                raise UserError(
                    _(
                        "Le jeton est valide, mais la lecture des types de formulaires a échoué : %s"
                    )
                    % str(err)
                ) from err
            if count is not None:
                parts.append(
                    _("Lecture API OK : %s type(s) de formulaire(s) pour l’organisation « %s ».")
                    % (count, slug)
                )
            else:
                parts.append(
                    _("Lecture API OK pour l’organisation « %s » (réponse sans liste exploitable).")
                    % slug
                )
        else:
            parts.append(
                _(
                    "Renseignez aussi le slug organisation pour valider en plus l’appel « formTypes »."
                )
            )

        message = "\n".join(parts)
        return {
            "type": "ir.actions.client",
            "tag": "display_notification",
            "params": {
                "title": _("HelloAsso — connexion"),
                "message": message,
                "type": "success",
                "sticky": True,
            },
        }

    def action_helloasso_preview_data(self):
        """Lecture seule API (formTypes) : aucune écriture Odoo, résumé UI + log serveur."""
        self.ensure_one()
        if not (self.helloasso_client_id and self.helloasso_client_secret):
            raise UserError(
                _("Renseignez le client ID et le client secret HelloAsso avant la prévisualisation.")
            )
        slug = (self.helloasso_organization_slug or "").strip()
        if not slug:
            raise UserError(
                _("Renseignez le slug organisation pour prévisualiser les données HelloAsso.")
            )
        use_sandbox = bool(self.helloasso_use_sandbox)
        try:
            token_payload = fetch_client_credentials_token(
                self.helloasso_client_id,
                self.helloasso_client_secret,
                use_sandbox,
            )
        except HelloAssoClientError as err:
            raise UserError(str(err)) from err

        try:
            items, count = fetch_form_types_sample(
                slug,
                token_payload["access_token"],
                use_sandbox,
            )
        except HelloAssoClientError as err:
            raise UserError(str(err)) from err

        _logger.info(
            "HelloAsso prévisualisation formTypes (org=%s, sandbox=%s, count=%s): %s",
            slug,
            use_sandbox,
            count,
            items if items is not None else "(liste non résolue)",
        )

        env_label = _("sandbox") if use_sandbox else _("production")
        lines = [
            _("Aperçu non destructif — aucune création ni mise à jour dans Odoo."),
            _("Environnement : %s — organisation : %s") % (env_label, slug),
        ]
        if count is not None:
            lines.append(_("Entrées « formTypes » : %s") % count)
        else:
            lines.append(_("Nombre d’entrées : non déterminé (structure de réponse inattendue)."))

        if items:
            max_rows = 20
            for i, it in enumerate(items[:max_rows], start=1):
                lines.append(summarize_form_type_entry(it, i))
            if len(items) > max_rows:
                lines.append(
                    _("… et %s autre(s) (affichage tronqué).") % (len(items) - max_rows)
                )
        else:
            lines.append(
                _("Aucune liste d’éléments exploitable ; consultez les logs serveur pour le détail.")
            )

        message = "\n".join(lines)
        return {
            "type": "ir.actions.client",
            "tag": "display_notification",
            "params": {
                "title": _("HelloAsso — prévisualisation"),
                "message": message,
                "type": "success",
                "sticky": True,
            },
        }

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
